/**
 * API для системы сообщений
 * Внутренний мессенджер: админы, специалисты, клиенты
 */

import { supabase } from './supabase';
import { logger } from './logger';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  // Вложения
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
  // Поддержка - единый чат
  is_support_message?: boolean;
  actual_sender_id?: string | null; // Реальный ID админа (для аналитики)
}

// Виртуальный ID для единой "Службы поддержки" в UI клиента
export const SUPPORT_VIRTUAL_ID = '__support__';

export interface AttachmentInfo {
  url: string;
  name: string;
  type: string;
  size: number;
}

export type RecipientType = 'client' | 'specialist' | 'admin';

export interface Conversation {
  recipientId: string;
  recipientName: string;
  recipientAvatar: string | null;
  recipientType: RecipientType;
  specialization?: string; // Для специалистов - их специализация
  adminRole?: string; // Для админов - их роль
  lastMessage: Message | null;
  unreadCount: number;
}

/**
 * Результат пагинированного списка бесед
 */
export interface PaginatedConversations {
  conversations: Conversation[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Параметры пагинации
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Размер страницы по умолчанию
export const DEFAULT_PAGE_SIZE = 25;

// Роли администраторов
const ADMIN_ROLES = ['admin', 'super_admin', 'support'];

// Метки ролей для отображения
const ROLE_LABELS: Record<string, string> = {
  'super_admin': 'Главный администратор',
  'admin': 'Администратор',
  'support': 'Поддержка',
};

// Имена по умолчанию для админов (вместо email)
const ADMIN_DEFAULT_NAMES: Record<string, string> = {
  'super_admin': 'Служба поддержки',
  'admin': 'Служба поддержки',
  'support': 'Служба поддержки',
};

interface RecipientInfo {
  id: string;
  type: RecipientType;
}

/**
 * Хелпер: получить данные о сообщениях для списка собеседников
 * Оптимизировано: отдельные запросы для последнего сообщения и непрочитанных
 */
async function getMessagesData(
  userId: string,
  recipientIds: string[]
): Promise<Map<string, { lastMessage: Message | null; unreadCount: number }>> {
  if (recipientIds.length === 0) {
    return new Map();
  }

  const messagesByRecipient = new Map<string, { lastMessage: Message | null; unreadCount: number }>();
  for (const recipientId of recipientIds) {
    messagesByRecipient.set(recipientId, { lastMessage: null, unreadCount: 0 });
  }

  // Условие для всех бесед
  const orConditions = recipientIds.map(rid =>
    `and(sender_id.eq.${userId},recipient_id.eq.${rid}),and(sender_id.eq.${rid},recipient_id.eq.${userId})`
  ).join(',');

  // Параллельно: последние сообщения + непрочитанные
  const [lastMessagesResult, unreadResult] = await Promise.all([
    // 1. Последние сообщения (по 1 на беседу, максимум N)
    supabase
      .from('messages')
      .select('*')
      .or(orConditions)
      .order('created_at', { ascending: false })
      .limit(recipientIds.length * 2), // Достаточно для получения последнего сообщения в каждой беседе

    // 2. Только непрочитанные входящие
    supabase
      .from('messages')
      .select('sender_id')
      .eq('recipient_id', userId)
      .eq('is_read', false)
      .in('sender_id', recipientIds),
  ]);

  // Обрабатываем последние сообщения
  for (const msg of lastMessagesResult.data || []) {
    const recipientId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
    const entry = messagesByRecipient.get(recipientId);
    if (entry && !entry.lastMessage) {
      entry.lastMessage = msg as Message;
    }
  }

  // Подсчитываем непрочитанные
  for (const msg of unreadResult.data || []) {
    const entry = messagesByRecipient.get(msg.sender_id);
    if (entry) {
      entry.unreadCount++;
    }
  }

  return messagesByRecipient;
}

/**
 * Интерфейс данных получателя из RPC функции
 */
interface RecipientData {
  user_id: string;
  email: string | null;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  display_name: string | null;
  specialist_avatar: string | null;
  specialization_codes: string[] | null;
}

/**
 * Хелпер: получить данные о получателях
 * Сначала пробует RPC функцию, при ошибке fallback на прямые запросы
 */
async function getRecipientsData(recipientIds: string[]): Promise<RecipientData[]> {
  // Пробуем RPC функцию (обходит RLS)
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_message_recipients', { p_user_ids: recipientIds });

  if (!rpcError && rpcData) {
    return rpcData as RecipientData[];
  }

  // Fallback: прямые запросы (могут быть ограничены RLS)
  logger.warn('get_message_recipients RPC failed, using fallback:', rpcError?.message);

  const [
    { data: users },
    { data: profiles },
    { data: specialists },
  ] = await Promise.all([
    supabase.from('users').select('id, email, role').in('id', recipientIds),
    // Запрашиваем профили с типом, чтобы отдать приоритет родительскому профилю
    supabase.from('profiles').select('user_id, first_name, last_name, type').in('user_id', recipientIds),
    supabase.from('specialists').select('user_id, display_name, avatar_url, specialization_codes').in('user_id', recipientIds),
  ]);

  // Собираем данные в формат RecipientData
  return recipientIds.map(id => {
    const user = users?.find(u => u.id === id);
    // Находим профиль с приоритетом 'parent' над детскими профилями
    const userProfiles = profiles?.filter(p => p.user_id === id) || [];
    const profile = userProfiles.find(p => p.type === 'parent') || userProfiles[0];
    const spec = specialists?.find(s => s.user_id === id);

    return {
      user_id: id,
      email: user?.email || null,
      role: user?.role || null,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      avatar_url: spec?.avatar_url || null,  // avatar_url только в specialists
      display_name: spec?.display_name || null,
      specialist_avatar: spec?.avatar_url || null,
      specialization_codes: spec?.specialization_codes || null,
    };
  });
}

/**
 * Хелпер: построить список бесед из получателей
 */
async function buildConversations(
  userId: string,
  recipients: RecipientInfo[]
): Promise<Conversation[]> {
  if (recipients.length === 0) {
    return [];
  }

  const recipientIds = recipients.map(r => r.id);

  // Параллельно получаем данные о получателях и справочник специализаций
  const [
    recipientsData,
    { data: specializations },
    messagesByRecipient,
  ] = await Promise.all([
    getRecipientsData(recipientIds),
    supabase.from('specializations').select('code, name').eq('is_active', true),
    getMessagesData(userId, recipientIds),
  ]);

  const specMap: Record<string, string> = {};
  specializations?.forEach(s => {
    specMap[s.code] = s.name;
  });

  // Собираем беседы
  const conversations: Conversation[] = [];

  for (const recipient of recipients) {
    const recipientId = recipient.id;
    const recipientType = recipient.type;

    // Данные о получателе (приводим к строке для надёжного сравнения)
    const recipientData = recipientsData.find(r => String(r.user_id) === String(recipientId));

    // Определяем имя
    let name = 'Пользователь';
    if (recipientData?.display_name) {
      name = recipientData.display_name;
    } else if (recipientData?.first_name) {
      name = recipientData.first_name + (recipientData.last_name ? ' ' + recipientData.last_name : '');
    } else if (recipientType === 'admin' && recipientData?.role) {
      // Для админов без профиля показываем "Служба поддержки" вместо email
      name = ADMIN_DEFAULT_NAMES[recipientData.role] || 'Служба поддержки';
    } else if (recipientData?.email) {
      name = recipientData.email;
    }

    // Определяем специализацию (для специалистов)
    let specialization: string | undefined;
    if (recipientType === 'specialist' && recipientData?.specialization_codes) {
      specialization = recipientData.specialization_codes
        .map(code => specMap[code])
        .filter(Boolean)
        .slice(0, 2)
        .join(', ') || 'Специалист';
    }

    // Определяем роль админа
    let adminRole: string | undefined;
    if (recipientType === 'admin' && recipientData?.role) {
      adminRole = ROLE_LABELS[recipientData.role] || 'Администратор';
    }

    const msgData = messagesByRecipient.get(recipientId) || { lastMessage: null, unreadCount: 0 };

    conversations.push({
      recipientId,
      recipientName: name,
      recipientAvatar: recipientData?.specialist_avatar || recipientData?.avatar_url || null,
      recipientType,
      specialization,
      adminRole,
      lastMessage: msgData.lastMessage,
      unreadCount: msgData.unreadCount,
    });
  }

  // Сортируем: сначала с сообщениями (по времени), потом без сообщений
  conversations.sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return b.lastMessage.created_at.localeCompare(a.lastMessage.created_at);
    }
    if (a.lastMessage && !b.lastMessage) return -1;
    if (!a.lastMessage && b.lastMessage) return 1;
    return a.recipientName.localeCompare(b.recipientName);
  });

  return conversations;
}

/**
 * Получить список бесед для текущего пользователя (клиент или специалист)
 * Использует RPC функцию для обхода RLS
 * Поддерживает пагинацию
 */
export async function getConversations(
  params: PaginationParams = {}
): Promise<PaginatedConversations> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Пробуем RPC функцию (обходит RLS)
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_available_message_recipients');

  let recipients: RecipientInfo[] = [];

  if (!rpcError && rpcData && rpcData.length > 0) {
    // RPC успешно - используем результат
    recipients = rpcData.map((r: { recipient_id: string; recipient_type: string }) => ({
      id: r.recipient_id,
      type: r.recipient_type as RecipientType,
    }));
  } else {
    // Fallback: старая логика с прямыми запросами (может быть ограничена RLS)
    if (rpcError) {
      logger.warn('get_available_message_recipients RPC failed, using fallback:', rpcError.message);
    }

    // Проверяем, является ли пользователь специалистом
    const { data: currentSpecialist } = await supabase
      .from('specialists')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (currentSpecialist) {
      // Пользователь - специалист
      const addedUserIds = new Set<string>();

      // 1. Получаем его клиентов
      const { data: clientAssignments } = await supabase
        .from('client_assignments')
        .select('client_user_id')
        .eq('specialist_id', currentSpecialist.id)
        .eq('status', 'active');

      clientAssignments?.forEach(a => {
        recipients.push({ id: a.client_user_id, type: 'client' });
        addedUserIds.add(a.client_user_id);
      });

      // 2. Получаем других активных специалистов (коллег)
      const { data: otherSpecialists } = await supabase
        .from('specialists')
        .select('user_id')
        .eq('status', 'active')
        .neq('user_id', user.id);

      otherSpecialists?.forEach(s => {
        if (!addedUserIds.has(s.user_id)) {
          recipients.push({ id: s.user_id, type: 'specialist' });
          addedUserIds.add(s.user_id);
        }
      });

      // 3. Получаем админов/support
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .in('role', ADMIN_ROLES)
        .neq('id', user.id);

      admins?.forEach(a => {
        if (!addedUserIds.has(a.id)) {
          recipients.push({ id: a.id, type: 'admin' });
        }
      });

    } else {
      // Пользователь - клиент
      const addedUserIds = new Set<string>();

      // 1. Получаем его специалистов
      const { data: assignments } = await supabase
        .from('client_assignments')
        .select('specialist:specialists!inner(user_id)')
        .eq('client_user_id', user.id)
        .eq('status', 'active');

      assignments?.forEach((a: any) => {
        recipients.push({ id: a.specialist.user_id, type: 'specialist' });
        addedUserIds.add(a.specialist.user_id);
      });

      // 2. Получаем админов/support (поддержка)
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .in('role', ADMIN_ROLES);

      admins?.forEach(a => {
        if (!addedUserIds.has(a.id)) {
          recipients.push({ id: a.id, type: 'admin' });
        }
      });
    }
  }

  // Строим все беседы (с сортировкой по дате)
  const allConversations = await buildConversations(user.id, recipients);

  // Применяем пагинацию
  const totalCount = allConversations.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const conversations = allConversations.slice(startIndex, endIndex);

  return {
    conversations,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Результат разделённых бесед для клиента
 */
export interface SplitConversations {
  support: Conversation[];      // Единая беседа с поддержкой (все админы видят все сообщения)
  specialists: Conversation[];  // Беседы со специалистами
  hasNewSupportOption: boolean; // Показывать ли кнопку "Написать в поддержку"
  // Пагинация для специалистов
  specialistsTotalCount: number;
  specialistsPage: number;
  specialistsPageSize: number;
  specialistsTotalPages: number;
}

/**
 * Получить разделённые беседы для клиента (родителя)
 * Разделяет на:
 * - Поддержка: ЕДИНАЯ беседа "Служба поддержки" (все сообщения с любым админом)
 * - Специалисты: назначенные специалисты (координатор, логопед, психолог и т.д.)
 * Поддерживает пагинацию для списка специалистов
 */
export async function getClientSplitConversations(
  params: PaginationParams = {}
): Promise<SplitConversations> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем назначенных специалистов
  const { data: assignments } = await supabase
    .from('client_assignments')
    .select('specialist:specialists!inner(user_id)')
    .eq('client_user_id', user.id)
    .eq('status', 'active');

  // Дедупликация: один специалист может быть назначен разным профилям
  const specialistRecipients: RecipientInfo[] = [];
  const addedSpecialistIds = new Set<string>();
  assignments?.forEach((a: any) => {
    if (!addedSpecialistIds.has(a.specialist.user_id)) {
      specialistRecipients.push({ id: a.specialist.user_id, type: 'specialist' });
      addedSpecialistIds.add(a.specialist.user_id);
    }
  });

  // Строим список бесед со специалистами
  const allSpecialists = await buildConversations(user.id, specialistRecipients);

  // Применяем пагинацию для специалистов
  const specialistsTotalCount = allSpecialists.length;
  const specialistsTotalPages = Math.ceil(specialistsTotalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const specialists = allSpecialists.slice(startIndex, endIndex);

  // Проверяем наличие админов через RPC (обходит RLS)
  const { data: recipients } = await supabase.rpc('get_available_message_recipients');
  const adminIds = recipients
    ?.filter((r: { recipient_type: string }) => r.recipient_type === 'admin')
    .map((r: { recipient_id: string }) => r.recipient_id) || [];
  const hasAdmins = adminIds.length > 0;

  // Получаем статистику сообщений поддержки (единая беседа)
  let supportConversation: Conversation | null = null;

  if (hasAdmins) {
    // Получаем последнее сообщение поддержки
    // Условие: (отправитель=клиент И получатель=админ) ИЛИ (отправитель=админ И получатель=клиент)
    const orConditions = adminIds.flatMap(aid => [
      `and(sender_id.eq.${user.id},recipient_id.eq.${aid})`,
      `and(sender_id.eq.${aid},recipient_id.eq.${user.id})`,
    ]).join(',');

    const { data: supportMessages } = await supabase
      .from('messages')
      .select('*')
      .or(orConditions)
      .order('created_at', { ascending: false })
      .limit(1);

    // Считаем непрочитанные (входящие от админов)
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false)
      .in('sender_id', adminIds);

    const lastMessage = supportMessages?.[0] as Message | undefined;

    // Если есть хотя бы одно сообщение поддержки или непрочитанные, показываем беседу
    if (lastMessage || (unreadCount && unreadCount > 0)) {
      supportConversation = {
        recipientId: SUPPORT_VIRTUAL_ID,
        recipientName: 'Служба поддержки',
        recipientAvatar: null,
        recipientType: 'admin',
        adminRole: 'Поддержка',
        lastMessage: lastMessage || null,
        unreadCount: unreadCount || 0,
      };
    }
  }

  return {
    support: supportConversation ? [supportConversation] : [],
    specialists,
    // Показываем кнопку "Написать в поддержку" всегда если есть админы
    hasNewSupportOption: hasAdmins,
    // Пагинация для специалистов
    specialistsTotalCount,
    specialistsPage: page,
    specialistsPageSize: pageSize,
    specialistsTotalPages,
  };
}

/**
 * Получить первого доступного админа для новой беседы поддержки
 */
export async function getFirstAvailableSupport(): Promise<string | null> {
  // Используем RPC для обхода RLS
  const { data: recipients } = await supabase.rpc('get_available_message_recipients');
  const admins = recipients
    ?.filter((r: { recipient_type: string }) => r.recipient_type === 'admin')
    .map((r: { recipient_id: string }) => r.recipient_id) || [];

  return admins[0] || null;
}

/**
 * Получить все сообщения поддержки для клиента
 * Клиент видит единую беседу "Служба поддержки" - все сообщения с любым админом
 */
export async function getSupportMessages(
  limit: number = 50,
  before?: string
): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем всех админов через RPC (обходит RLS)
  const { data: recipients } = await supabase.rpc('get_available_message_recipients');
  const adminIds = recipients
    ?.filter((r: { recipient_type: string }) => r.recipient_type === 'admin')
    .map((r: { recipient_id: string }) => r.recipient_id) || [];
  if (adminIds.length === 0) return [];

  // Получаем все сообщения поддержки
  // Условие: (отправитель=клиент И получатель=админ) ИЛИ (отправитель=админ И получатель=клиент)
  const orConditions = adminIds.flatMap(aid => [
    `and(sender_id.eq.${user.id},recipient_id.eq.${aid})`,
    `and(sender_id.eq.${aid},recipient_id.eq.${user.id})`,
  ]).join(',');

  let query = supabase
    .from('messages')
    .select('*')
    .or(orConditions)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching support messages:', error);
    throw new Error(`Failed to fetch support messages: ${error.message}`);
  }

  // Генерируем signed URLs для вложений
  const messagesWithUrls = await enrichMessagesWithSignedUrls(data || []);

  // Возвращаем в хронологическом порядке
  return messagesWithUrls.reverse();
}

/**
 * Отправить сообщение в поддержку (для клиентов)
 * Использует RPC функцию для обхода RLS
 */
export async function sendSupportMessage(
  content: string,
  attachment?: AttachmentInfo
): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  if (!content.trim() && !attachment) {
    throw new Error('Сообщение не может быть пустым');
  }

  // Используем RPC функцию для обхода RLS
  const { data, error } = await supabase.rpc('send_support_message', {
    p_content: content.trim(),
    p_attachment_url: attachment?.url || null,
    p_attachment_name: attachment?.name || null,
    p_attachment_type: attachment?.type || null,
    p_attachment_size: attachment?.size || null,
  });

  if (error) {
    logger.error('Error sending support message:', error);
    throw new Error(`Failed to send support message: ${error.message}`);
  }

  return data as Message;
}

/**
 * Отправить ответ от поддержки клиенту (для админов)
 * Сохраняет actual_sender_id для аналитики
 */
export async function sendSupportReply(
  clientId: string,
  content: string,
  attachment?: AttachmentInfo
): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  if (!content.trim() && !attachment) {
    throw new Error('Сообщение не может быть пустым');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id: clientId,
      content: content.trim(),
      is_support_message: true,
      actual_sender_id: user.id, // Сохраняем реальный ID админа
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
      attachment_size: attachment?.size || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error sending support reply:', error);
    throw new Error(`Failed to send support reply: ${error.message}`);
  }

  return data as Message;
}

/**
 * Пометить сообщения поддержки как прочитанные (для клиентов)
 */
export async function markSupportMessagesAsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем всех админов
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('role', ADMIN_ROLES);

  const adminIds = admins?.map(a => a.id) || [];
  if (adminIds.length === 0) return;

  // Помечаем прочитанными все входящие сообщения от админов
  const { error } = await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('recipient_id', user.id)
    .eq('is_read', false)
    .in('sender_id', adminIds);

  if (error) {
    logger.error('Error marking support messages as read:', error);
  }
}

/**
 * Интерфейс беседы поддержки для админов
 */
export interface SupportConversation {
  clientId: string;
  clientName: string;
  clientAvatar: string | null;
  lastMessage: Message | null;
  unreadCount: number;
}

/**
 * Результат пагинированного списка бесед поддержки
 */
export interface PaginatedSupportConversations {
  conversations: SupportConversation[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Получить все беседы поддержки для админа
 * Админ видит ВСЕ обращения в поддержку от всех клиентов
 * Поддерживает пагинацию
 */
export async function getAdminSupportConversations(
  params: PaginationParams = {}
): Promise<PaginatedSupportConversations> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем всех админов
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('role', ADMIN_ROLES);

  const adminIds = admins?.map(a => a.id) || [];

  // Получаем все сообщения поддержки
  const { data: supportMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('is_support_message', true)
    .order('created_at', { ascending: false });

  // Группируем по клиентам
  const clientMessagesMap = new Map<string, Message[]>();

  (supportMessages || []).forEach(msg => {
    // Определяем ID клиента (не-админ)
    const clientId = adminIds.includes(msg.sender_id) ? msg.recipient_id : msg.sender_id;
    if (!clientId || adminIds.includes(clientId)) return; // Пропускаем сообщения между админами

    const messages = clientMessagesMap.get(clientId) || [];
    messages.push(msg as Message);
    clientMessagesMap.set(clientId, messages);
  });

  // Получаем данные о клиентах (с fallback если RPC недоступна)
  const clientIds = Array.from(clientMessagesMap.keys());
  if (clientIds.length === 0) {
    return {
      conversations: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const recipientsData = await getRecipientsData(clientIds);

  // Формируем список бесед
  const allConversations: SupportConversation[] = [];

  clientMessagesMap.forEach((messages, clientId) => {
    const clientData = recipientsData.find(r => String(r.user_id) === String(clientId));

    let clientName = 'Клиент';
    if (clientData?.first_name) {
      clientName = clientData.first_name + (clientData.last_name ? ' ' + clientData.last_name : '');
    } else if (clientData?.email) {
      clientName = clientData.email;
    }

    // Сортируем сообщения по дате (новые первые)
    messages.sort((a, b) => b.created_at.localeCompare(a.created_at));

    // Считаем непрочитанные (от клиента к любому админу, где is_read = false)
    const unreadCount = messages.filter(m =>
      m.sender_id === clientId && !m.is_read
    ).length;

    allConversations.push({
      clientId,
      clientName,
      clientAvatar: clientData?.avatar_url || null,
      lastMessage: messages[0] || null,
      unreadCount,
    });
  });

  // Сортируем: сначала с новыми сообщениями
  allConversations.sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return b.lastMessage.created_at.localeCompare(a.lastMessage.created_at);
    }
    if (a.lastMessage && !b.lastMessage) return -1;
    if (!a.lastMessage && b.lastMessage) return 1;
    return a.clientName.localeCompare(b.clientName);
  });

  // Применяем пагинацию
  const totalCount = allConversations.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const conversations = allConversations.slice(startIndex, endIndex);

  return {
    conversations,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Получить сообщения поддержки с конкретным клиентом (для админов)
 */
export async function getAdminSupportMessages(
  clientId: string,
  limit: number = 50,
  before?: string
): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем всех админов
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('role', ADMIN_ROLES);

  const adminIds = admins?.map(a => a.id) || [];
  if (adminIds.length === 0) return [];

  // Получаем все сообщения поддержки с этим клиентом
  let query = supabase
    .from('messages')
    .select('*')
    .eq('is_support_message', true)
    .or(`and(sender_id.eq.${clientId},recipient_id.in.(${adminIds.join(',')})),and(sender_id.in.(${adminIds.join(',')}),recipient_id.eq.${clientId})`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching admin support messages:', error);
    throw new Error(`Failed to fetch admin support messages: ${error.message}`);
  }

  // Генерируем signed URLs для вложений
  const messagesWithUrls = await enrichMessagesWithSignedUrls(data || []);

  return messagesWithUrls.reverse();
}

/**
 * Пометить сообщения поддержки от клиента как прочитанные (для админов)
 */
export async function markAdminSupportMessagesAsRead(clientId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем всех админов
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('role', ADMIN_ROLES);

  const adminIds = admins?.map(a => a.id) || [];
  if (adminIds.length === 0) return;

  // Помечаем прочитанными все сообщения от этого клиента ко всем админам
  const { error } = await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('sender_id', clientId)
    .eq('is_support_message', true)
    .eq('is_read', false)
    .in('recipient_id', adminIds);

  if (error) {
    logger.error('Error marking admin support messages as read:', error);
  }
}

/**
 * Получить список бесед для администратора
 * Админ видит всех: специалистов, клиентов и других админов
 * Поддерживает пагинацию
 */
export async function getAdminConversations(
  params: PaginationParams = {}
): Promise<PaginatedConversations> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const recipients: RecipientInfo[] = [];
  // Отслеживаем добавленных пользователей, чтобы избежать дублирования
  // (один пользователь может быть и специалистом, и клиентом)
  const addedUserIds = new Set<string>();

  // 1. Получаем всех активных специалистов
  const { data: allSpecialists } = await supabase
    .from('specialists')
    .select('user_id')
    .eq('status', 'active');

  allSpecialists?.forEach(s => {
    if (s.user_id !== user.id) {
      recipients.push({ id: s.user_id, type: 'specialist' });
      addedUserIds.add(s.user_id);
    }
  });

  // 2. Получаем всех клиентов с активными назначениями
  const { data: clientAssignments } = await supabase
    .from('client_assignments')
    .select('client_user_id')
    .eq('status', 'active');

  const clientIds = new Set<string>();
  clientAssignments?.forEach(a => {
    // Пропускаем, если это текущий пользователь или уже добавлен как специалист
    if (a.client_user_id !== user.id && !addedUserIds.has(a.client_user_id)) {
      clientIds.add(a.client_user_id);
    }
  });

  // 2.1. Также добавляем клиентов, которые писали в поддержку (без назначений)
  const { data: supportMessages } = await supabase
    .from('messages')
    .select('sender_id, recipient_id')
    .eq('is_support_message', true);

  // Получаем ID админов для фильтрации
  const { data: adminUsers } = await supabase
    .from('users')
    .select('id')
    .in('role', ADMIN_ROLES);
  const adminUserIds = new Set(adminUsers?.map(a => a.id) || []);

  supportMessages?.forEach(msg => {
    // Определяем ID клиента (не-админ)
    const clientId = adminUserIds.has(msg.sender_id) ? msg.recipient_id : msg.sender_id;
    if (clientId && !adminUserIds.has(clientId) && clientId !== user.id && !addedUserIds.has(clientId)) {
      clientIds.add(clientId);
    }
  });

  clientIds.forEach(id => {
    recipients.push({ id, type: 'client' });
    addedUserIds.add(id);
  });

  // 3. Получаем других админов/support
  const { data: otherAdmins } = await supabase
    .from('users')
    .select('id')
    .in('role', ADMIN_ROLES)
    .neq('id', user.id);

  otherAdmins?.forEach(a => {
    // Пропускаем, если уже добавлен как специалист или клиент
    if (!addedUserIds.has(a.id)) {
      recipients.push({ id: a.id, type: 'admin' });
      addedUserIds.add(a.id);
    }
  });

  // Строим все беседы (с сортировкой по дате)
  const allConversations = await buildConversations(user.id, recipients);

  // Применяем пагинацию
  const totalCount = allConversations.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const conversations = allConversations.slice(startIndex, endIndex);

  return {
    conversations,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

// Время жизни signed URL (24 часа)
const SIGNED_URL_EXPIRY = 60 * 60 * 24;

/**
 * Хелпер: генерация signed URLs для вложений в сообщениях
 */
async function enrichMessagesWithSignedUrls<T extends { attachment_url?: string | null }>(
  messages: T[]
): Promise<T[]> {
  // Собираем пути к файлам
  const pathsToSign = messages
    .filter(m => m.attachment_url && !m.attachment_url.startsWith('http') && !m.attachment_url.startsWith('blob:'))
    .map(m => m.attachment_url as string);

  if (pathsToSign.length === 0) {
    return messages;
  }

  // Генерируем signed URLs пакетно
  const { data: signedUrls, error } = await supabase.storage
    .from('message-attachments')
    .createSignedUrls(pathsToSign, SIGNED_URL_EXPIRY);

  if (error) {
    logger.error('Error creating signed URLs:', error);
    return messages;
  }

  // Создаём маппинг путь -> signed URL
  const urlMap = new Map<string, string>();
  signedUrls?.forEach(item => {
    if (item.signedUrl) {
      urlMap.set(item.path, item.signedUrl);
    }
  });

  // Обновляем сообщения
  return messages.map(m => {
    if (m.attachment_url && urlMap.has(m.attachment_url)) {
      return { ...m, attachment_url: urlMap.get(m.attachment_url) };
    }
    return m;
  });
}

/**
 * Получить сообщения с конкретным пользователем
 */
export async function getMessages(
  recipientId: string,
  limit: number = 50,
  before?: string
): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  let query = supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching messages:', error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  // Генерируем signed URLs для вложений
  const messagesWithUrls = await enrichMessagesWithSignedUrls(data || []);

  // Возвращаем в хронологическом порядке
  return messagesWithUrls.reverse();
}

/**
 * Обогатить сообщение signed URL для вложения (для realtime сообщений)
 */
export async function enrichMessageWithSignedUrl<T extends { attachment_url?: string | null }>(
  message: T
): Promise<T> {
  if (!message.attachment_url) return message;
  if (message.attachment_url.startsWith('http') || message.attachment_url.startsWith('blob:')) {
    return message;
  }

  const signedUrl = await getAttachmentSignedUrl(message.attachment_url);
  if (signedUrl) {
    return { ...message, attachment_url: signedUrl };
  }
  return message;
}

/**
 * Генерация signed URL для приватного файла
 * @param filePath - путь к файлу в storage
 * @returns signed URL или null при ошибке
 */
export async function getAttachmentSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('message-attachments')
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

  if (error) {
    logger.error('Error creating signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Загрузить файл в Storage
 * Возвращает путь к файлу (не URL) - URL генерируется при загрузке сообщений
 */
export async function uploadAttachment(
  recipientId: string,
  file: File
): Promise<AttachmentInfo> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Ограничение размера (10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Файл слишком большой (максимум 10MB)');
  }

  // Генерируем уникальное имя файла
  const ext = file.name.split('.').pop() || '';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const filePath = `${user.id}/${recipientId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('message-attachments')
    .upload(filePath, file);

  if (uploadError) {
    logger.error('Error uploading attachment:', uploadError);
    throw new Error(`Ошибка загрузки файла: ${uploadError.message}`);
  }

  // Возвращаем путь к файлу (URL генерируется при загрузке сообщений)
  return {
    url: filePath, // Это путь, не URL!
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

/**
 * Отправить сообщение
 */
export async function sendMessage(
  recipientId: string,
  content: string,
  attachment?: AttachmentInfo
): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  if (!content.trim() && !attachment) {
    throw new Error('Сообщение не может быть пустым');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: content.trim(),
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
      attachment_size: attachment?.size || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error sending message:', error);
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return data as Message;
}

/**
 * Пометить сообщения как прочитанные
 */
export async function markMessagesAsRead(senderId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const { error } = await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('sender_id', senderId)
    .eq('recipient_id', user.id)
    .eq('is_read', false);

  if (error) {
    logger.error('Error marking messages as read:', error);
  }
}

/**
 * Получить количество непрочитанных сообщений
 */
export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false);

  if (error) {
    logger.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Подписка на новые сообщения (Realtime)
 * @param userId - ID текущего пользователя для фильтрации
 * @param onNewMessage - callback при получении нового сообщения
 *
 * Примечание: подписываемся на сообщения ГДЕ пользователь - получатель.
 * Свои сообщения добавляются оптимистично в handleSendMessage.
 */
export function subscribeToMessages(
  userId: string,
  onNewMessage: (message: Message) => void
): () => void {
  const subscription = supabase
    .channel(`messages:recipient_id=eq.${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();

  // Возвращаем функцию отписки
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Подписка на сообщения поддержки для админов (Realtime)
 * Админы должны видеть ВСЕ сообщения с is_support_message=true
 */
export function subscribeToSupportMessages(
  onNewMessage: (message: Message) => void
): () => void {
  // Используем broadcast channel для поддержки, т.к. фильтр по boolean не работает в Supabase Realtime
  // Подписываемся на ВСЕ новые сообщения и фильтруем на клиенте
  const subscription = supabase
    .channel('admin-support-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        const message = payload.new as Message;
        // Фильтруем только сообщения поддержки
        if (message.is_support_message === true) {
          onNewMessage(message);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

// ============================================
// Групповые чаты
// ============================================

export interface ChatGroup {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  // Данные пользователя (присоединяем)
  userName?: string;
  userAvatar?: string | null;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
  created_at: string;
  updated_at: string;
  // Данные отправителя (присоединяем)
  senderName?: string;
  senderAvatar?: string | null;
}

export interface GroupConversation {
  group: ChatGroup;
  members: ChatGroupMember[];
  lastMessage: GroupMessage | null;
  unreadCount: number;
}

/**
 * Результат пагинированного списка групповых чатов
 */
export interface PaginatedGroupConversations {
  conversations: GroupConversation[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Создать групповой чат
 */
export async function createChatGroup(
  name: string,
  memberIds: string[],
  description?: string
): Promise<ChatGroup> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Создаём группу
  const { data: group, error: groupError } = await supabase
    .from('chat_groups')
    .insert({
      name,
      description: description || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (groupError) {
    logger.error('Error creating chat group:', groupError);
    throw new Error(`Ошибка создания группы: ${groupError.message}`);
  }

  // Добавляем участников через RPC функцию (обходит RLS recursion)
  const { error: membersError } = await supabase.rpc('add_group_members_safe', {
    p_group_id: group.id,
    p_member_ids: memberIds,
    p_creator_id: user.id,
  });

  if (membersError) {
    logger.error('Error adding group members:', membersError);
    // Удаляем группу если не удалось добавить участников
    try {
      await supabase.from('chat_groups').delete().eq('id', group.id);
    } catch (deleteError) {
      logger.error('Error deleting orphaned group:', deleteError);
    }
    throw new Error(`Ошибка добавления участников: ${membersError.message}`);
  }

  return group as ChatGroup;
}

// Хелпер для получения имени пользователя
function createUserNameResolver(
  users: { id: string; email: string }[] | null,
  profiles: { user_id: string; first_name: string; last_name: string; avatar_url: string | null }[] | null,
  specialists: { user_id: string; display_name: string; avatar_url: string | null }[] | null
) {
  return (userId: string): string => {
    const spec = specialists?.find(s => s.user_id === userId);
    if (spec?.display_name) return spec.display_name;
    const profile = profiles?.find(p => p.user_id === userId);
    if (profile?.first_name) return profile.first_name + (profile.last_name ? ' ' + profile.last_name : '');
    const userRecord = users?.find(u => u.id === userId);
    return userRecord?.email || 'Пользователь';
  };
}

// Хелпер для получения аватара пользователя
function createUserAvatarResolver(
  profiles: { user_id: string; first_name: string; last_name: string; avatar_url: string | null }[] | null,
  specialists: { user_id: string; display_name: string; avatar_url: string | null }[] | null
) {
  return (userId: string): string | null => {
    const spec = specialists?.find(s => s.user_id === userId);
    if (spec?.avatar_url) return spec.avatar_url;
    const profile = profiles?.find(p => p.user_id === userId);
    return profile?.avatar_url || null;
  };
}

/**
 * Получить список групповых чатов пользователя
 * Поддерживает пагинацию
 */
export async function getChatGroups(
  params: PaginationParams = {}
): Promise<PaginatedGroupConversations> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем группы, в которых состоит пользователь
  const { data: memberships } = await supabase
    .from('chat_group_members')
    .select('group_id')
    .eq('user_id', user.id);

  if (!memberships || memberships.length === 0) {
    return {
      conversations: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const groupIds = memberships.map(m => m.group_id);

  // Сначала получаем участников групп, чтобы знать какие user_id нужны
  const { data: allMembers } = await supabase
    .from('chat_group_members')
    .select('*')
    .in('group_id', groupIds);

  // Собираем уникальные user_id участников
  const memberUserIds = [...new Set((allMembers || []).map(m => m.user_id))];

  // Параллельно получаем все данные (фильтруем по user_id участников)
  const [
    { data: groups },
    { data: users },
    { data: profiles },
    { data: specialists },
    { data: lastMessages },
    { data: readStatus },
    { data: allGroupMessages },
  ] = await Promise.all([
    supabase.from('chat_groups').select('*').in('id', groupIds),
    supabase.from('users').select('id, email').in('id', memberUserIds),
    supabase.from('profiles').select('user_id, first_name, last_name, avatar_url').in('user_id', memberUserIds),
    supabase.from('specialists').select('user_id, display_name, avatar_url').in('user_id', memberUserIds),
    supabase
      .from('group_messages')
      .select('*')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(groupIds.length * 2),
    supabase
      .from('group_message_reads')
      .select('*')
      .eq('user_id', user.id)
      .in('group_id', groupIds),
    // Получаем все сообщения для подсчёта непрочитанных (только нужные поля)
    supabase
      .from('group_messages')
      .select('id, group_id, sender_id, created_at')
      .in('group_id', groupIds)
      .neq('sender_id', user.id),
  ]);

  const getUserName = createUserNameResolver(users, profiles, specialists);
  const getUserAvatar = createUserAvatarResolver(profiles, specialists);

  // Предвычисляем непрочитанные сообщения для каждой группы
  const unreadCountsByGroup = new Map<string, number>();
  for (const groupId of groupIds) {
    const readInfo = readStatus?.find(r => r.group_id === groupId);
    const groupMsgs = (allGroupMessages || []).filter(m => m.group_id === groupId);

    let unreadCount = 0;
    if (readInfo?.last_read_at) {
      // Считаем сообщения после последнего прочтения
      unreadCount = groupMsgs.filter(m => m.created_at > readInfo.last_read_at).length;
    } else {
      // Все сообщения непрочитанные
      unreadCount = groupMsgs.length;
    }
    unreadCountsByGroup.set(groupId, unreadCount);
  }

  // Собираем данные по группам
  const allConversations: GroupConversation[] = [];

  for (const group of groups || []) {
    const members = (allMembers || [])
      .filter(m => m.group_id === group.id)
      .map(m => ({
        ...m,
        userName: getUserName(m.user_id),
        userAvatar: getUserAvatar(m.user_id),
      })) as ChatGroupMember[];

    // Последнее сообщение в группе
    const lastMsg = lastMessages?.find(m => m.group_id === group.id);
    const lastMessage: GroupMessage | null = lastMsg
      ? {
          ...lastMsg,
          senderName: getUserName(lastMsg.sender_id),
          senderAvatar: getUserAvatar(lastMsg.sender_id),
        }
      : null;

    allConversations.push({
      group: group as ChatGroup,
      members,
      lastMessage,
      unreadCount: unreadCountsByGroup.get(group.id) || 0,
    });
  }

  // Сортируем по последнему сообщению
  allConversations.sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return b.lastMessage.created_at.localeCompare(a.lastMessage.created_at);
    }
    if (a.lastMessage && !b.lastMessage) return -1;
    if (!a.lastMessage && b.lastMessage) return 1;
    return a.group.name.localeCompare(b.group.name);
  });

  // Применяем пагинацию
  const totalCount = allConversations.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const conversations = allConversations.slice(startIndex, endIndex);

  return {
    conversations,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Получить сообщения группового чата
 */
export async function getGroupMessages(
  groupId: string,
  limit: number = 50,
  before?: string
): Promise<GroupMessage[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  let query = supabase
    .from('group_messages')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data: messages, error } = await query;

  if (error) {
    logger.error('Error fetching group messages:', error);
    throw new Error(`Ошибка загрузки сообщений: ${error.message}`);
  }

  if (!messages || messages.length === 0) {
    return [];
  }

  // Получаем данные отправителей
  const senderIds = [...new Set(messages.map(m => m.sender_id))];
  const [
    { data: profiles },
    { data: specialists },
  ] = await Promise.all([
    supabase.from('profiles').select('user_id, first_name, last_name, avatar_url').in('user_id', senderIds),
    supabase.from('specialists').select('user_id, display_name, avatar_url').in('user_id', senderIds),
  ]);

  const getUserName = createUserNameResolver(null, profiles, specialists);
  const getUserAvatar = createUserAvatarResolver(profiles, specialists);

  // Добавляем данные отправителей
  const enrichedMessages: GroupMessage[] = messages.map(m => ({
    ...m,
    senderName: getUserName(m.sender_id),
    senderAvatar: getUserAvatar(m.sender_id),
  }));

  // Генерируем signed URLs для вложений
  const messagesWithUrls = await enrichMessagesWithSignedUrls(enrichedMessages);

  return messagesWithUrls.reverse();
}

/**
 * Отправить сообщение в групповой чат
 */
export async function sendGroupMessage(
  groupId: string,
  content: string,
  attachment?: AttachmentInfo
): Promise<GroupMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  if (!content.trim() && !attachment) {
    throw new Error('Сообщение не может быть пустым');
  }

  const { data, error } = await supabase
    .from('group_messages')
    .insert({
      group_id: groupId,
      sender_id: user.id,
      content: content.trim(),
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
      attachment_size: attachment?.size || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error sending group message:', error);
    throw new Error(`Ошибка отправки сообщения: ${error.message}`);
  }

  return data as GroupMessage;
}

/**
 * Пометить групповые сообщения как прочитанные
 */
export async function markGroupMessagesAsRead(
  groupId: string,
  lastMessageId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const { error } = await supabase
    .from('group_message_reads')
    .upsert({
      group_id: groupId,
      user_id: user.id,
      last_read_message_id: lastMessageId,
      last_read_at: new Date().toISOString(),
    }, {
      onConflict: 'group_id,user_id',
    });

  if (error) {
    logger.error('Error marking group messages as read:', error);
  }
}

/**
 * Добавить участника в группу (через RPC для обхода RLS recursion)
 */
export async function addGroupMember(
  groupId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc('add_single_group_member', {
    p_group_id: groupId,
    p_user_id: userId,
  });

  if (error) {
    logger.error('Error adding group member:', error);
    throw new Error(`Ошибка добавления участника: ${error.message}`);
  }
}

/**
 * Удалить участника из группы (или выйти самому)
 * Если текущий пользователь удаляет себя - используется прямой запрос
 * Если админ удаляет другого участника - используется RPC
 */
export async function removeGroupMember(
  groupId: string,
  userId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  // Если пользователь удаляет себя, используем прямой запрос (RLS разрешает)
  if (user?.id === userId) {
    const { error } = await supabase
      .from('chat_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error removing group member:', error);
      throw new Error(`Ошибка удаления участника: ${error.message}`);
    }
  } else {
    // Админ удаляет другого участника - используем RPC
    const { error } = await supabase.rpc('remove_group_member', {
      p_group_id: groupId,
      p_user_id: userId,
    });

    if (error) {
      logger.error('Error removing group member:', error);
      throw new Error(`Ошибка удаления участника: ${error.message}`);
    }
  }
}

/**
 * Обновить информацию о группе
 */
export async function updateChatGroup(
  groupId: string,
  updates: { name?: string; description?: string }
): Promise<ChatGroup> {
  const { data, error } = await supabase
    .from('chat_groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating chat group:', error);
    throw new Error(`Ошибка обновления группы: ${error.message}`);
  }

  return data as ChatGroup;
}

/**
 * Удалить групповой чат
 */
export async function deleteChatGroup(groupId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_groups')
    .delete()
    .eq('id', groupId);

  if (error) {
    logger.error('Error deleting chat group:', error);
    throw new Error(`Ошибка удаления группы: ${error.message}`);
  }
}

/**
 * Подписка на новые сообщения в групповом чате
 */
export function subscribeToGroupMessages(
  groupId: string,
  onNewMessage: (message: GroupMessage) => void
): () => void {
  const subscription = supabase
    .channel(`group_messages:group_id=eq.${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        onNewMessage(payload.new as GroupMessage);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Страница сообщений специалиста
 * Чат с клиентами и коллегами
 */

import { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Search,
  Send,
  Check,
  CheckCheck,
  Loader2,
  User,
  Stethoscope,
  Shield,
  Bell,
  BellOff,
  Paperclip,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import {
  Message,
  Conversation,
  AttachmentInfo,
  GroupConversation,
  GroupMessage,
  DEFAULT_PAGE_SIZE,
  getConversations,
  getMessages,
  sendMessage,
  uploadAttachment,
  markMessagesAsRead,
  subscribeToMessages,
  enrichMessageWithSignedUrl,
  getChatGroups,
  getGroupMessages,
  sendGroupMessage,
  markGroupMessagesAsRead,
  createChatGroup,
  subscribeToGroupMessages,
} from '@/lib/supabase-messages';
import { formatMessageTime, getInitials, pluralize, debounce } from '@/lib/utils';
import { MessageAttachment, AttachmentPreview } from '@/components/chat/MessageAttachment';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function SpecialistMessages() {
  const { toast } = useToast();
  const { specialistUser } = useSpecialistAuth();
  const { permission, requestPermission, notifyNewMessage } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadMessagesRequestId = useRef(0); // Для предотвращения race condition
  const clientIdFromUrl = searchParams.get('client'); // ID клиента для автовыбора беседы
  const selectedConversationRef = useRef<Conversation | null>(null);
  const selectedGroupRef = useRef<GroupConversation | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'client' | 'specialist' | 'admin'>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Пагинация личных чатов
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Пагинация групповых чатов
  const [groupCurrentPage, setGroupCurrentPage] = useState(1);
  const [groupTotalPages, setGroupTotalPages] = useState(1);
  const [groupTotalCount, setGroupTotalCount] = useState(0);

  // Групповые чаты
  const [activeTab, setActiveTab] = useState<'direct' | 'groups'>('direct');
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupConversation | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingGroupMessages, setIsLoadingGroupMessages] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const loadGroupMessagesRequestId = useRef(0);

  // Диалог создания группы
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Скролл к последнему сообщению (определяем ДО использования в useEffect)
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Загрузка бесед (определяем ДО использования в useEffect)
  const loadConversations = useCallback(async (page: number = 1, showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const result = await getConversations({ page, pageSize: DEFAULT_PAGE_SIZE });
      setConversations(result.conversations);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить беседы',
        variant: 'destructive',
      });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [toast]);

  // Загрузка бесед при монтировании
  useEffect(() => {
    if (specialistUser?.id) {
      loadConversations(1, true);
    }
  }, [specialistUser?.id, loadConversations]);

  // Обработчики пагинации личных чатов
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      loadConversations(currentPage - 1, false);
    }
  }, [currentPage, loadConversations]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      loadConversations(currentPage + 1, false);
    }
  }, [currentPage, totalPages, loadConversations]);

  // Debounced функция синхронизации счётчиков при фокусе окна
  const debouncedSyncCounters = useMemo(
    () => debounce(() => {
      loadConversations(currentPage, false);
    }, 2000),
    [loadConversations, currentPage]
  );

  // Синхронизация счётчиков при возврате фокуса на окно
  useEffect(() => {
    const handleFocus = () => {
      if (specialistUser?.id) {
        debouncedSyncCounters();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [specialistUser?.id, debouncedSyncCounters]);

  // Автовыбор беседы по clientId из URL
  useEffect(() => {
    if (clientIdFromUrl && conversations.length > 0 && !selectedConversation) {
      const targetConversation = conversations.find(
        conv => conv.recipientId === clientIdFromUrl
      );
      if (targetConversation) {
        setSelectedConversation(targetConversation);
        // Убираем параметр из URL после выбора
        setSearchParams({}, { replace: true });
      }
    }
  }, [clientIdFromUrl, conversations, selectedConversation, setSearchParams]);

  // Синхронизируем ref с состоянием для использования в callback подписки
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Подписка на новые сообщения
  useEffect(() => {
    if (!specialistUser?.id) return;

    const unsubscribe = subscribeToMessages(specialistUser.id, async (newMsg) => {
      try {
        const senderId = newMsg.sender_id;
        const currentConversation = selectedConversationRef.current;

        // Обогащаем сообщение signed URL если есть вложение
        const enrichedMsg = await enrichMessageWithSignedUrl(newMsg);

        // Проверяем, что текущая беседа не изменилась после async операции
        const stillSameConversation = selectedConversationRef.current?.recipientId === currentConversation?.recipientId;

        // Обновляем сообщения если это текущая беседа
        if (currentConversation && senderId === currentConversation.recipientId && stillSameConversation) {
          setMessages(prev => [...prev, enrichedMsg]);
          scrollToBottom();

          // Помечаем как прочитанное
          await markMessagesAsRead(senderId);

          // Обновляем беседу без загрузки (сбрасываем unread т.к. чат открыт)
          setConversations(prev => prev.map(conv =>
            conv.recipientId === senderId
              ? { ...conv, lastMessage: enrichedMsg, unreadCount: 0 }
              : conv
          ));
        } else {
          // Показываем уведомление если чат не открыт
          const senderConv = conversationsRef.current.find(c => c.recipientId === senderId);
          if (senderConv) {
            notifyNewMessage(senderConv.recipientName, enrichedMsg.content);
          }

          // Чат не открыт - увеличиваем счётчик непрочитанных
          setConversations(prev => prev.map(conv =>
            conv.recipientId === senderId
              ? { ...conv, lastMessage: enrichedMsg, unreadCount: conv.unreadCount + 1 }
              : conv
          ));
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    return () => unsubscribe();
  }, [specialistUser?.id, scrollToBottom, notifyNewMessage]);

  // Скролл при изменении сообщений
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const loadMessages = async (recipientId: string) => {
    // Увеличиваем ID запроса для предотвращения race condition
    const currentRequestId = ++loadMessagesRequestId.current;

    try {
      setIsLoadingMessages(true);
      const msgs = await getMessages(recipientId);

      // Проверяем, что этот запрос всё ещё актуален
      if (currentRequestId !== loadMessagesRequestId.current) {
        return; // Пользователь переключился на другую беседу
      }

      setMessages(msgs);

      // Помечаем как прочитанные
      await markMessagesAsRead(recipientId);

      // Обновляем счётчик в списке бесед
      setConversations(prev =>
        prev.map(conv =>
          conv.recipientId === recipientId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      // Игнорируем ошибки устаревших запросов
      if (currentRequestId !== loadMessagesRequestId.current) return;

      console.error('Error loading messages:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive',
      });
    } finally {
      // Сбрасываем loading только для актуального запроса
      if (currentRequestId === loadMessagesRequestId.current) {
        setIsLoadingMessages(false);
      }
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSelectedGroup(null); // Сбрасываем выбранную группу
    loadMessages(conversation.recipientId);
  };

  // === ГРУППОВЫЕ ЧАТЫ ===

  // Загрузка групповых бесед
  const loadGroupConversations = useCallback(async (page: number = 1) => {
    try {
      setIsLoadingGroups(true);
      const result = await getChatGroups({ page, pageSize: DEFAULT_PAGE_SIZE });
      setGroupConversations(result.conversations);
      setGroupCurrentPage(result.page);
      setGroupTotalPages(result.totalPages);
      setGroupTotalCount(result.totalCount);
      setGroupsLoaded(true);
    } catch (error) {
      console.error('Error loading group conversations:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить групповые чаты',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingGroups(false);
    }
  }, [toast]);

  // Загрузка групповых чатов при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'groups' && !groupsLoaded && !isLoadingGroups) {
      loadGroupConversations(1);
    }
  }, [activeTab, groupsLoaded, isLoadingGroups, loadGroupConversations]);

  // Обработчики пагинации групповых чатов
  const handleGroupPrevPage = useCallback(() => {
    if (groupCurrentPage > 1) {
      loadGroupConversations(groupCurrentPage - 1);
    }
  }, [groupCurrentPage, loadGroupConversations]);

  const handleGroupNextPage = useCallback(() => {
    if (groupCurrentPage < groupTotalPages) {
      loadGroupConversations(groupCurrentPage + 1);
    }
  }, [groupCurrentPage, groupTotalPages, loadGroupConversations]);

  const handleSelectGroup = async (group: GroupConversation) => {
    setSelectedGroup(group);
    setSelectedConversation(null); // Сбрасываем выбранную личную беседу

    const currentRequestId = ++loadGroupMessagesRequestId.current;

    try {
      setIsLoadingGroupMessages(true);
      const msgs = await getGroupMessages(group.group.id);

      if (currentRequestId !== loadGroupMessagesRequestId.current) return;

      setGroupMessages(msgs);

      // Отмечаем сообщения как прочитанные только если есть сообщения
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        await markGroupMessagesAsRead(group.group.id, lastMsg.id);

        // Проверяем race condition после await
        if (currentRequestId !== loadGroupMessagesRequestId.current) return;
      }

      // Обновляем счётчик непрочитанных
      setGroupConversations(prev =>
        prev.map(g =>
          g.group.id === group.group.id ? { ...g, unreadCount: 0 } : g
        )
      );
    } catch (error) {
      if (currentRequestId !== loadGroupMessagesRequestId.current) return;
      console.error('Error loading group messages:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения группы',
        variant: 'destructive',
      });
    } finally {
      if (currentRequestId === loadGroupMessagesRequestId.current) {
        setIsLoadingGroupMessages(false);
      }
    }
  };

  const handleSendGroupMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedGroup || !specialistUser?.id || isSending || isUploading) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const groupId = selectedGroup.group.id;
    const fileToUpload = selectedFile;

    // Оптимистичное сообщение
    const optimisticMessage: GroupMessage = {
      id: tempId,
      group_id: groupId,
      sender_id: specialistUser.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      senderName: 'Вы',
      attachment_url: fileToUpload ? URL.createObjectURL(fileToUpload) : null,
      attachment_name: fileToUpload?.name || null,
      attachment_type: fileToUpload?.type || null,
      attachment_size: fileToUpload?.size || null,
    };

    setGroupMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSelectedFile(null);
    scrollToBottom();
    setIsSending(true);

    try {
      let attachment: AttachmentInfo | undefined;

      if (fileToUpload) {
        setIsUploading(true);
        // Используем groupId как "recipientId" для пути в storage
        attachment = await uploadAttachment(groupId, fileToUpload);
        setIsUploading(false);
      }

      const sent = await sendGroupMessage(groupId, messageContent, attachment);
      // Обогащаем signed URL если есть вложение
      const enrichedSent = await enrichMessageWithSignedUrl(sent);
      setGroupMessages(prev => prev.map(m => {
        if (m.id === tempId) {
          // Освобождаем blob URL если был создан
          if (m.attachment_url?.startsWith('blob:')) {
            URL.revokeObjectURL(m.attachment_url);
          }
          return { ...enrichedSent, senderName: 'Вы' };
        }
        return m;
      }));

      // Обновляем последнее сообщение в списке групп
      setGroupConversations(prev =>
        prev.map(g =>
          g.group.id === groupId
            ? { ...g, lastMessage: { ...enrichedSent, senderName: 'Вы' } }
            : g
        )
      );
    } catch (error) {
      console.error('Error sending group message:', error);
      // Освобождаем blob URL при ошибке
      setGroupMessages(prev => {
        const msgToRemove = prev.find(m => m.id === tempId);
        if (msgToRemove?.attachment_url?.startsWith('blob:')) {
          URL.revokeObjectURL(msgToRemove.attachment_url);
        }
        return prev.filter(m => m.id !== tempId);
      });
      // Восстанавливаем сообщение и файл при ошибке
      setNewMessage(messageContent);
      if (fileToUpload) {
        setSelectedFile(fileToUpload);
      }
      setIsUploading(false);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Подписка на групповые сообщения
  useEffect(() => {
    if (!selectedGroup || !specialistUser?.id) return;

    const groupId = selectedGroup.group.id;
    const members = selectedGroup.members;

    const unsubscribe = subscribeToGroupMessages(groupId, async (newMsg) => {
      try {
        // Не добавляем свои сообщения (они добавляются оптимистично)
        if (newMsg.sender_id === specialistUser.id) return;

        // Добавляем имя отправителя из списка участников группы
        const sender = members.find(m => m.user_id === newMsg.sender_id);
        let enrichedMsg: GroupMessage = {
          ...newMsg,
          senderName: sender?.userName || 'Пользователь',
          senderAvatar: sender?.userAvatar || null,
        };

        // Обогащаем signed URL если есть вложение
        enrichedMsg = await enrichMessageWithSignedUrl(enrichedMsg);

        // Проверяем, что мы всё ещё просматриваем ту же группу после async операции
        if (selectedGroupRef.current?.group.id !== groupId) return;

        setGroupMessages(prev => [...prev, enrichedMsg]);
        scrollToBottom();

        // Помечаем как прочитанное
        await markGroupMessagesAsRead(groupId, newMsg.id);
      } catch (error) {
        console.error('Error processing group message:', error);
      }
    });

    return () => unsubscribe();
  }, [selectedGroup?.group.id, specialistUser?.id, scrollToBottom]);

  // Создание новой группы
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0 || isCreatingGroup) return;

    setIsCreatingGroup(true);
    try {
      await createChatGroup(newGroupName.trim(), selectedMembers);
      setShowCreateGroupDialog(false);
      setNewGroupName('');
      setSelectedMembers([]);
      await loadGroupConversations();
      toast({
        title: 'Группа создана',
        description: 'Групповой чат успешно создан',
      });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать группу',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Переключение участника при создании группы
  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Максимум 10 МБ
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Файл слишком большой',
        description: 'Максимальный размер файла — 10 МБ',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    // Сбрасываем input для возможности повторного выбора того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !specialistUser?.id || isSending) return;

    const messageContent = newMessage.trim() || (selectedFile ? `Файл: ${selectedFile.name}` : '');
    const tempId = `temp-${Date.now()}`;
    const recipientId = selectedConversation.recipientId;
    const fileToUpload = selectedFile;

    // Оптимистичное сообщение
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: specialistUser.id,
      recipient_id: recipientId,
      content: messageContent,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Временные данные для превью
      attachment_name: fileToUpload?.name,
      attachment_type: fileToUpload?.type,
      attachment_size: fileToUpload?.size,
    };

    // Сразу показываем сообщение
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSelectedFile(null);
    scrollToBottom();
    setIsSending(true);

    try {
      // Сначала загружаем файл, если есть
      let attachment: AttachmentInfo | undefined;
      if (fileToUpload) {
        setIsUploading(true);
        try {
          attachment = await uploadAttachment(recipientId, fileToUpload);
        } finally {
          setIsUploading(false);
        }
      }

      const sent = await sendMessage(recipientId, messageContent, attachment);
      // Обогащаем signed URL если есть вложение
      const enrichedSent = await enrichMessageWithSignedUrl(sent);

      // Заменяем оптимистичное сообщение реальным
      setMessages(prev => prev.map(m => m.id === tempId ? enrichedSent : m));

      // Обновляем последнее сообщение в беседе
      setConversations(prev =>
        prev.map(conv =>
          conv.recipientId === recipientId
            ? { ...conv, lastMessage: enrichedSent }
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);

      // Откат: удаляем оптимистичное сообщение и восстанавливаем текст
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageContent);
      if (fileToUpload) {
        setSelectedFile(fileToUpload);
      }

      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение. Попробуйте ещё раз.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Debounce для поиска - задержка фильтрации при быстром вводе
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Подсчёт по типам за один проход (на текущей странице)
  const counts = useMemo(() => {
    const result = { all: conversations.length, client: 0, specialist: 0, admin: 0 };
    for (const conv of conversations) {
      const type = conv.recipientType;
      if (type === 'client' || type === 'specialist' || type === 'admin') {
        result[type]++;
      }
    }
    return result;
  }, [conversations]);

  // Фильтрация бесед по поиску и типу
  const filteredConversations = useMemo(() => {
    const query = deferredSearchQuery.toLowerCase();
    return conversations.filter((conv) => {
      // Фильтр по типу
      if (filterType !== 'all' && conv.recipientType !== filterType) {
        return false;
      }
      // Фильтр по поиску
      if (!query) return true;
      return conv.recipientName.toLowerCase().includes(query) ||
        conv.specialization?.toLowerCase().includes(query) ||
        conv.adminRole?.toLowerCase().includes(query);
    });
  }, [conversations, deferredSearchQuery, filterType]);

  // Получаем метку типа собеседника
  const getRecipientTypeLabel = (conv: Conversation) => {
    if (conv.recipientType === 'specialist') {
      return conv.specialization || 'Коллега';
    }
    if (conv.recipientType === 'admin') {
      return conv.adminRole || 'Администратор';
    }
    return 'Клиент';
  };

  // Получаем стили для типа собеседника
  const getRecipientTypeStyles = (type: string) => {
    switch (type) {
      case 'specialist':
        return { bgClass: 'bg-blue-100 text-blue-600', textClass: 'text-blue-600' };
      case 'admin':
        return { bgClass: 'bg-purple-100 text-purple-600', textClass: 'text-purple-600' };
      default: // client
        return { bgClass: 'bg-green-100 text-green-600', textClass: 'text-green-600' };
    }
  };

  // Получаем иконку для типа собеседника
  const getRecipientIcon = (type: string) => {
    switch (type) {
      case 'specialist':
        return Stethoscope;
      case 'admin':
        return Shield;
      default:
        return User;
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-12rem)]">
        <Card className="h-full">
          <div className="flex h-full">
            <div className="w-80 border-r p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      <Card className="h-full">
        <div className="flex h-full">
          {/* Список бесед */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Сообщения</h2>
                <div className="flex items-center gap-1">
                  {activeTab === 'groups' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowCreateGroupDialog(true)}
                      title="Создать группу"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={requestPermission}
                    title={permission === 'granted' ? 'Уведомления включены' : 'Включить уведомления'}
                  >
                    {permission === 'granted' ? (
                      <Bell className="h-4 w-4 text-primary" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Вкладки */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'direct' | 'groups')} className="mb-3">
                <TabsList className="w-full">
                  <TabsTrigger value="direct" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Личные
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="flex-1">
                    <Users className="h-4 w-4 mr-1" />
                    Группы
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {activeTab === 'direct' && (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {/* Фильтры по типу */}
                  <div className="flex gap-1 flex-wrap">
                    <Button
                      variant={filterType === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType('all')}
                      className="text-xs h-7"
                    >
                      Все {totalCount > 0 && `(${totalCount})`}
                    </Button>
                    <Button
                      variant={filterType === 'client' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType('client')}
                      className="text-xs h-7"
                    >
                      <User className="w-3 h-3 mr-1" />
                      {counts.client}
                    </Button>
                    <Button
                      variant={filterType === 'specialist' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType('specialist')}
                      className="text-xs h-7"
                    >
                      <Stethoscope className="w-3 h-3 mr-1" />
                      {counts.specialist}
                    </Button>
                    <Button
                      variant={filterType === 'admin' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType('admin')}
                      className="text-xs h-7"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {counts.admin}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Личные беседы */}
            {activeTab === 'direct' && (
              <>
                <ScrollArea className="flex-1">
                  {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">
                        {searchQuery || filterType !== 'all' ? 'Ничего не найдено' : 'Нет собеседников'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredConversations.map((conv) => (
                        <button
                          key={conv.recipientId}
                          onClick={() => handleSelectConversation(conv)}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            selectedConversation?.recipientId === conv.recipientId
                              ? 'bg-primary/10'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {conv.recipientAvatar ? (
                                <img
                                  src={conv.recipientAvatar}
                                  alt={conv.recipientName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                  {getInitials(conv.recipientName)}
                                </div>
                              )}
                              {/* Иконка типа собеседника */}
                              {(() => {
                                const styles = getRecipientTypeStyles(conv.recipientType);
                                const Icon = getRecipientIcon(conv.recipientType);
                                return (
                                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${styles.bgClass}`}>
                                    <Icon className="w-3 h-3" />
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{conv.recipientName}</p>
                                {conv.lastMessage && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatMessageTime(conv.lastMessage.created_at)}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs truncate mb-0.5 ${getRecipientTypeStyles(conv.recipientType).textClass}`}>
                                {getRecipientTypeLabel(conv)}
                              </p>
                              {conv.lastMessage && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {conv.lastMessage.sender_id === specialistUser?.id ? 'Вы: ' : ''}
                                  {conv.lastMessage.content}
                                </p>
                              )}
                            </div>
                            {conv.unreadCount > 0 && (
                              <Badge className="ml-2">{conv.unreadCount}</Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Пагинация личных чатов */}
                {totalPages > 1 && (
                  <div className="p-2 border-t flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage <= 1}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {currentPage} / {totalPages} ({totalCount})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
                      className="h-8 px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Групповые чаты */}
            {activeTab === 'groups' && (
              <>
                <ScrollArea className="flex-1">
                  {isLoadingGroups ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : groupConversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">Нет групповых чатов</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowCreateGroupDialog(true)}
                        className="mt-2"
                      >
                        Создать группу
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2">
                      {groupConversations.map((group) => (
                        <button
                          key={group.group.id}
                          onClick={() => handleSelectGroup(group)}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            selectedGroup?.group.id === group.group.id
                              ? 'bg-primary/10'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{group.group.name}</p>
                                {group.lastMessage && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatMessageTime(group.lastMessage.created_at)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mb-0.5">
                                {group.members.length} {pluralize(group.members.length, 'участник', 'участника', 'участников')}
                              </p>
                              {group.lastMessage && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {group.lastMessage.senderName || 'Пользователь'}: {group.lastMessage.content}
                                </p>
                              )}
                            </div>
                            {group.unreadCount > 0 && (
                              <Badge className="ml-2">{group.unreadCount}</Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Пагинация групповых чатов */}
                {groupTotalPages > 1 && (
                  <div className="p-2 border-t flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGroupPrevPage}
                      disabled={groupCurrentPage <= 1}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {groupCurrentPage} / {groupTotalPages} ({groupTotalCount})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGroupNextPage}
                      disabled={groupCurrentPage >= groupTotalPages}
                      className="h-8 px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Область чата */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Заголовок чата */}
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="relative">
                    {selectedConversation.recipientAvatar ? (
                      <img
                        src={selectedConversation.recipientAvatar}
                        alt={selectedConversation.recipientName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {getInitials(selectedConversation.recipientName)}
                      </div>
                    )}
                    {(() => {
                      const styles = getRecipientTypeStyles(selectedConversation.recipientType);
                      const Icon = getRecipientIcon(selectedConversation.recipientType);
                      return (
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${styles.bgClass}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <p className="font-medium">{selectedConversation.recipientName}</p>
                    <p className={`text-sm ${getRecipientTypeStyles(selectedConversation.recipientType).textClass}`}>
                      {getRecipientTypeLabel(selectedConversation)}
                    </p>
                  </div>
                </div>

                {/* Сообщения */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Нет сообщений</p>
                      <p className="text-sm mt-1">
                        {selectedConversation.recipientType === 'specialist'
                          ? 'Начните беседу с коллегой'
                          : selectedConversation.recipientType === 'admin'
                          ? 'Начните беседу с администратором'
                          : 'Начните беседу с клиентом'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.sender_id === specialistUser?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              {/* Вложение */}
                              {message.attachment_url && message.attachment_name && message.attachment_type && message.attachment_size && (
                                <MessageAttachment
                                  url={message.attachment_url}
                                  name={message.attachment_name}
                                  type={message.attachment_type}
                                  size={message.attachment_size}
                                  isOwn={isOwn}
                                />
                              )}
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs opacity-70">
                                  {formatMessageTime(message.created_at)}
                                </span>
                                {isOwn && (
                                  message.is_read ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Ввод сообщения */}
                <div className="p-4 border-t space-y-2">
                  {/* Превью выбранного файла */}
                  {selectedFile && (
                    <AttachmentPreview
                      file={selectedFile}
                      onRemove={() => setSelectedFile(null)}
                    />
                  )}
                  <div className="flex gap-2">
                    {/* Скрытый input для файла */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending || isUploading}
                      title="Прикрепить файл"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Введите сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isSending || isUploading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                    >
                      {isSending || isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : selectedGroup ? (
              // Групповой чат
              <>
                {/* Заголовок группового чата */}
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedGroup.group.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedGroup.members.length} {pluralize(selectedGroup.members.length, 'участник', 'участника', 'участников')}
                    </p>
                  </div>
                </div>

                {/* Сообщения группы */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingGroupMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : groupMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Users className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Нет сообщений</p>
                      <p className="text-sm mt-1">Начните беседу в группе</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupMessages.map((message) => {
                        const isOwn = message.sender_id === specialistUser?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {!isOwn && (
                                <p className="text-xs font-medium mb-1 opacity-70">
                                  {message.senderName || 'Пользователь'}
                                </p>
                              )}
                              {message.content && (
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              )}
                              {message.attachment_url && message.attachment_name && message.attachment_type && message.attachment_size && (
                                <MessageAttachment
                                  url={message.attachment_url}
                                  name={message.attachment_name}
                                  type={message.attachment_type}
                                  size={message.attachment_size}
                                  isOwn={isOwn}
                                />
                              )}
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs opacity-70">
                                  {formatMessageTime(message.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Ввод сообщения в группу */}
                <div className="p-4 border-t space-y-2">
                  {selectedFile && (
                    <AttachmentPreview
                      file={selectedFile}
                      onRemove={() => setSelectedFile(null)}
                    />
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending || isUploading}
                      title="Прикрепить файл"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Введите сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendGroupMessage();
                        }
                      }}
                      disabled={isSending || isUploading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendGroupMessage}
                      disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                    >
                      {isSending || isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Выберите беседу</p>
                <p className="text-sm mt-1">Выберите собеседника из списка слева</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Диалог создания группы */}
      <Dialog open={showCreateGroupDialog} onOpenChange={(open) => {
        setShowCreateGroupDialog(open);
        if (!open) {
          setNewGroupName('');
          setSelectedMembers([]);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать групповой чат</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Название группы</Label>
              <Input
                id="groupName"
                placeholder="Введите название..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Участники ({selectedMembers.length} выбрано)</Label>
              <ScrollArea className="h-48 border rounded-md p-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.recipientId}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => toggleMember(conv.recipientId)}
                  >
                    <Checkbox
                      checked={selectedMembers.includes(conv.recipientId)}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {conv.recipientAvatar ? (
                        <img
                          src={conv.recipientAvatar}
                          alt={conv.recipientName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {getInitials(conv.recipientName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{conv.recipientName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getRecipientTypeLabel(conv)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateGroupDialog(false);
                setNewGroupName('');
                setSelectedMembers([]);
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || selectedMembers.length === 0 || isCreatingGroup}
            >
              {isCreatingGroup ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

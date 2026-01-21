/**
 * API для работы с консультациями (appointments) в календаре специалиста
 */

import { supabase } from './supabase';
import { logger } from './logger';

// Типы для работы с консультациями
export interface Appointment {
  id: string;
  user_id: string;
  profile_id: string | null;
  appointment_type_id: string;
  specialist_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: 'pending_specialist' | 'payment_pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meeting_format: 'online' | 'in_person' | null;
  video_room_url: string | null;
  notes: string | null;
  recurring_pattern: 'weekly' | 'monthly' | null;
  parent_appointment_id: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  appointment_type?: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  };
  profile?: {
    id: string;
    first_name: string;
    last_name: string | null;
  };
  client_user?: {
    id: string;
    email: string | null;
    phone: string | null;
  };
}

export interface Client {
  id: string;
  email: string | null;
  phone: string | null;
  region: string | null;
  profile?: {
    id: string;
    first_name: string;
    last_name: string | null;
  };
}

/**
 * Загрузить консультации специалиста за указанный период
 */
export async function getSpecialistAppointments(
  specialistId: string,
  startDate: Date,
  endDate: Date
): Promise<AppointmentWithDetails[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      appointment_type:appointment_types (id, name, duration_minutes, price),
      profile:profiles (id, first_name, last_name),
      client_user:users!appointments_user_id_fkey (id, email, phone)
    `)
    .eq('specialist_id', specialistId)
    .gte('scheduled_at', startDate.toISOString())
    .lte('scheduled_at', endDate.toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) {
    logger.error('Error loading appointments:', error);
    throw error;
  }

  return (data || []) as AppointmentWithDetails[];
}

/**
 * Загрузить список назначенных клиентов специалиста (из client_assignments)
 * Использует RPC функцию get_specialist_clients() для получения актуальных назначений
 */
export async function getAssignedClients(): Promise<Client[]> {
  // Вызываем RPC функцию, которая возвращает клиентов из client_assignments
  const { data: clientsData, error: clientsError } = await supabase
    .rpc('get_specialist_clients');

  if (clientsError) {
    logger.error('Error loading assigned clients:', clientsError);
    throw clientsError;
  }

  if (!clientsData || clientsData.length === 0) {
    return [];
  }

  // Загружаем профили клиентов
  const clientUserIds = clientsData.map((c: { client_user_id: string }) => c.client_user_id);
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, user_id, first_name, last_name')
    .in('user_id', clientUserIds);

  if (profilesError) {
    logger.error('Error loading profiles:', profilesError);
    // Не бросаем ошибку, профили могут отсутствовать
  }

  // Преобразуем в формат Client[]
  return clientsData.map((client: {
    client_user_id: string;
    client_email: string | null;
    client_phone: string | null;
    client_region: string | null;
  }) => {
    const profile = profilesData?.find(p => p.user_id === client.client_user_id);
    return {
      id: client.client_user_id,
      email: client.client_email,
      phone: client.client_phone,
      region: client.client_region,
      profile: profile ? {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
      } : undefined,
    };
  });
}

/**
 * @deprecated Используйте getAssignedClients() вместо этой функции.
 * Эта функция загружает клиентов из appointments, а не из client_assignments,
 * что может приводить к показу клиентов, которые уже не назначены специалисту.
 */
export async function getSpecialistClients(specialistId: string): Promise<Client[]> {
  logger.warn('getSpecialistClients is deprecated. Use getAssignedClients() instead.');

  // Загружаем уникальных клиентов из консультаций специалиста
  const { data: appointmentData, error: appointmentError } = await supabase
    .from('appointments')
    .select('user_id')
    .eq('specialist_id', specialistId);

  if (appointmentError) {
    logger.error('Error loading specialist clients:', appointmentError);
    throw appointmentError;
  }

  if (!appointmentData || appointmentData.length === 0) {
    return [];
  }

  // Получаем уникальные user_id
  const uniqueUserIds = [...new Set(appointmentData.map(a => a.user_id))];

  // Загружаем данные клиентов и профили параллельно
  const [usersResult, profilesResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, phone')
      .in('id', uniqueUserIds),
    supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name')
      .in('user_id', uniqueUserIds),
  ]);

  if (usersResult.error) {
    logger.error('Error loading users:', usersResult.error);
    throw usersResult.error;
  }

  if (profilesResult.error) {
    logger.error('Error loading profiles:', profilesResult.error);
    // Не бросаем ошибку, профили могут отсутствовать
  }

  // Объединяем данные
  return (usersResult.data || []).map(user => {
    const profile = profilesResult.data?.find(p => p.user_id === user.id);
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      profile: profile ? {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
      } : undefined,
    };
  });
}

/**
 * Создать новую консультацию
 */
export async function createAppointment(params: {
  userId: string;
  profileId?: string | null;
  specialistId: string;
  appointmentTypeId: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingFormat: 'online' | 'in_person' | null;
  notes?: string | null;
  recurringPattern?: 'weekly' | 'monthly' | null;
  recurringEndDate?: string | null;
  timezone?: string;
}): Promise<Appointment[]> {
  const {
    userId,
    profileId,
    specialistId,
    appointmentTypeId,
    scheduledAt,
    durationMinutes,
    meetingFormat,
    notes,
    recurringPattern,
    recurringEndDate,
    timezone = 'Europe/Moscow',
  } = params;

  const appointments: Partial<Appointment>[] = [];
  const baseDate = new Date(scheduledAt);

  // Создаём основную консультацию
  appointments.push({
    user_id: userId,
    profile_id: profileId || null,
    specialist_id: specialistId,
    appointment_type_id: appointmentTypeId,
    scheduled_at: scheduledAt,
    duration_minutes: durationMinutes,
    meeting_format: meetingFormat,
    notes: notes || null,
    recurring_pattern: recurringPattern || null,
    timezone,
    status: 'scheduled',
  });

  // Если повторяющаяся, создаём дополнительные консультации
  if (recurringPattern && recurringEndDate) {
    const endDate = new Date(recurringEndDate);
    let currentDate = new Date(baseDate);

    while (true) {
      if (recurringPattern === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (recurringPattern === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      if (currentDate > endDate) break;

      appointments.push({
        user_id: userId,
        profile_id: profileId || null,
        specialist_id: specialistId,
        appointment_type_id: appointmentTypeId,
        scheduled_at: currentDate.toISOString(),
        duration_minutes: durationMinutes,
        meeting_format: meetingFormat,
        notes: notes || null,
        recurring_pattern: recurringPattern,
        timezone,
        status: 'scheduled',
      });
    }
  }

  // Вставляем все консультации
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointments)
    .select();

  if (error) {
    logger.error('Error creating appointments:', error);
    throw error;
  }

  // Если есть повторяющиеся консультации, обновляем parent_appointment_id
  if (data && data.length > 1) {
    const parentId = data[0].id;
    const childIds = data.slice(1).map(a => a.id);

    await supabase
      .from('appointments')
      .update({ parent_appointment_id: parentId })
      .in('id', childIds);
  }

  return data as Appointment[];
}

/**
 * Обновить консультацию
 */
export async function updateAppointment(
  appointmentId: string,
  updates: Partial<Pick<Appointment, 'scheduled_at' | 'duration_minutes' | 'meeting_format' | 'notes' | 'status'>>
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating appointment:', error);
    throw error;
  }

  return data as Appointment;
}

/**
 * Удалить консультацию
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) {
    logger.error('Error deleting appointment:', error);
    throw error;
  }
}

/**
 * Удалить все повторяющиеся консультации
 */
export async function deleteAllRecurringAppointments(appointmentId: string): Promise<void> {
  // Сначала проверяем, есть ли parent_appointment_id
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('id, parent_appointment_id, recurring_pattern')
    .eq('id', appointmentId)
    .single();

  if (fetchError) {
    logger.error('Error fetching appointment:', fetchError);
    throw fetchError;
  }

  const parentId = appointment.parent_appointment_id || appointment.id;

  // Удаляем все связанные консультации
  const { error: deleteError } = await supabase
    .from('appointments')
    .delete()
    .or(`id.eq.${parentId},parent_appointment_id.eq.${parentId}`);

  if (deleteError) {
    logger.error('Error deleting recurring appointments:', deleteError);
    throw deleteError;
  }
}

/**
 * Загрузить типы консультаций (для специалистов)
 * Исключает admin_only типы - они доступны только через админку
 */
export async function getAppointmentTypes(): Promise<Array<{
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
}>> {
  const { data, error } = await supabase
    .from('appointment_types')
    .select('id, name, duration_minutes, price, description')
    .eq('is_active', true)
    .eq('admin_only', false)
    .order('name');

  if (error) {
    logger.error('Error loading appointment types:', error);
    throw error;
  }

  return data || [];
}

/**
 * Получить имя клиента
 */
export function getClientName(client: Client | null | undefined): string {
  if (!client) return 'Неизвестный клиент';

  if (client.profile) {
    const { first_name, last_name } = client.profile;
    return last_name ? `${first_name} ${last_name}` : first_name;
  }

  return client.email || client.phone || 'Клиент';
}

/**
 * Получить инициалы клиента
 */
export function getClientInitials(client: Client | null | undefined): string {
  if (!client) return '??';

  if (client.profile) {
    const { first_name, last_name } = client.profile;
    const firstInitial = first_name?.[0] || '';
    const lastInitial = last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || '??';
  }

  return (client.email?.[0] || '?').toUpperCase();
}

/**
 * Тип события изменения appointments
 */
export type AppointmentChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Подписка на изменения консультаций специалиста в реальном времени
 * Возвращает функцию отписки
 */
export function subscribeToAppointments(
  specialistId: string,
  onAppointmentChange: (
    event: AppointmentChangeEvent,
    appointment: Appointment | null,
    oldAppointment?: Appointment
  ) => void
): () => void {
  const channelName = `appointments:specialist_id=eq.${specialistId}`;

  const subscription = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'appointments',
        filter: `specialist_id=eq.${specialistId}`,
      },
      (payload) => {
        onAppointmentChange('INSERT', payload.new as Appointment);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'appointments',
        filter: `specialist_id=eq.${specialistId}`,
      },
      (payload) => {
        onAppointmentChange('UPDATE', payload.new as Appointment, payload.old as Appointment);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'appointments',
        filter: `specialist_id=eq.${specialistId}`,
      },
      (payload) => {
        onAppointmentChange('DELETE', null, payload.old as Appointment);
      }
    )
    .subscribe();

  // Возвращаем функцию отписки
  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Тип события изменения client_assignments
 */
export type ClientAssignmentChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Интерфейс для данных назначения клиента
 */
export interface ClientAssignment {
  id: string;
  specialist_id: string;
  client_user_id: string;
  assignment_type: 'primary' | 'consultant' | 'temporary';
  status: string;
  assigned_at: string;
  notes: string | null;
}

/**
 * Подписка на изменения назначений клиентов специалиста в реальном времени
 * Позволяет автоматически обновлять список клиентов при назначении/удалении
 * Возвращает функцию отписки
 */
export function subscribeToClientAssignments(
  specialistId: string,
  onAssignmentChange: (
    event: ClientAssignmentChangeEvent,
    assignment: ClientAssignment | null,
    oldAssignment?: ClientAssignment
  ) => void
): () => void {
  const channelName = `client_assignments:specialist_id=eq.${specialistId}`;

  const subscription = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'client_assignments',
        filter: `specialist_id=eq.${specialistId}`,
      },
      (payload) => {
        onAssignmentChange('INSERT', payload.new as ClientAssignment);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'client_assignments',
        filter: `specialist_id=eq.${specialistId}`,
      },
      (payload) => {
        onAssignmentChange('UPDATE', payload.new as ClientAssignment, payload.old as ClientAssignment);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'client_assignments',
        filter: `specialist_id=eq.${specialistId}`,
      },
      (payload) => {
        onAssignmentChange('DELETE', null, payload.old as ClientAssignment);
      }
    )
    .subscribe();

  // Возвращаем функцию отписки
  return () => {
    supabase.removeChannel(subscription);
  };
}

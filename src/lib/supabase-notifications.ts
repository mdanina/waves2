/**
 * API для работы с уведомлениями специалиста
 */

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SpecialistNotification {
  id: string;
  specialist_id: string;
  type: 'new_appointment' | 'cancelled_appointment' | 'new_client' | 'appointment_reminder' | 'new_message';
  title: string;
  message: string | null;
  appointment_id: string | null;
  client_user_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

/**
 * Получить уведомления специалиста (+ автоочистка старых прочитанных)
 */
export async function getNotifications(limit = 20): Promise<SpecialistNotification[]> {
  // Используем RPC функцию которая заодно чистит старые уведомления
  const { data, error } = await supabase.rpc('get_notifications_with_cleanup', {
    p_limit: limit,
  });

  if (error) {
    // Fallback на прямой запрос если функция не существует
    if (error.code === 'PGRST202') {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('specialist_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        console.error('Error fetching notifications:', fallbackError);
        throw fallbackError;
      }
      return fallbackData as SpecialistNotification[];
    }

    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data as SpecialistNotification[];
}

/**
 * Получить количество непрочитанных уведомлений
 */
export async function getUnreadCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_notifications_count');

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return data as number;
}

/**
 * Пометить уведомление как прочитанное
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  });

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return data as boolean;
}

/**
 * Пометить все уведомления как прочитанные
 */
export async function markAllAsRead(): Promise<number> {
  const { data, error } = await supabase.rpc('mark_all_notifications_read');

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }

  return data as number;
}

/**
 * Подписка на новые уведомления в реальном времени
 */
export function subscribeToNotifications(
  specialistId: string,
  onNewNotification: (notification: SpecialistNotification) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`specialist_notifications:${specialistId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'specialist_notifications',
        filter: `specialist_id=eq.${specialistId}`,
      },
      (payload) => {
        onNewNotification(payload.new as SpecialistNotification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Получить иконку для типа уведомления
 */
export function getNotificationIcon(type: SpecialistNotification['type']): string {
  switch (type) {
    case 'new_appointment':
      return '📅';
    case 'cancelled_appointment':
      return '❌';
    case 'new_client':
      return '👤';
    case 'appointment_reminder':
      return '⏰';
    case 'new_message':
      return '💬';
    default:
      return '🔔';
  }
}

/**
 * Форматирование времени уведомления
 */
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'только что';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} мин. назад`;
  } else if (diffHours < 24) {
    return `${diffHours} ч. назад`;
  } else if (diffDays === 1) {
    return 'вчера';
  } else if (diffDays < 7) {
    return `${diffDays} дн. назад`;
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  }
}

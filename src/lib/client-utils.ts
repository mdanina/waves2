/**
 * Общие утилиты для работы с данными клиентов и форматирования
 */

// Типы для профиля
interface ClientProfile {
  first_name: string;
  last_name?: string | null;
}

/**
 * Получить полное имя клиента
 */
export function getClientName(
  profile?: ClientProfile | null,
  email?: string | null
): string {
  if (profile) {
    const { first_name, last_name } = profile;
    return last_name ? `${first_name} ${last_name}` : first_name;
  }
  return email || 'Клиент';
}

/**
 * Получить инициалы клиента
 */
export function getClientInitials(
  profile?: ClientProfile | null,
  email?: string | null
): string {
  if (profile) {
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return (first + last).toUpperCase() || '??';
  }
  return (email?.[0] || '?').toUpperCase();
}

/**
 * Форматирование даты
 */
export function formatDate(
  dateString: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  }
): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('ru-RU', options);
}

/**
 * Форматирование даты и времени
 */
export function formatDateTime(dateString: string | Date | null | undefined): {
  date: string;
  time: string;
} {
  if (!dateString) return { date: '', time: '' };
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return {
    date: date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    }),
    time: date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

/**
 * Форматирование только времени
 */
export function formatTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Форматирование относительной даты (сегодня, вчера, N дней назад)
 */
export function formatRelativeDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Нет данных';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/**
 * Форматирование длительности в секундах
 */
export function formatDuration(seconds?: number | null): string {
  if (!seconds) return '—';
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}ч ${mins}м`;
  }
  return `${mins} мин`;
}

/**
 * Склонение существительных (клиент/клиента/клиентов)
 */
export function pluralize(
  count: number,
  one: string,
  few: string,
  many: string
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 19) {
    return many;
  }
  if (mod10 === 1) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }
  return many;
}

/**
 * Форматирование числа клиентов с правильным склонением
 */
export function formatClientsCount(count: number): string {
  return `${count} ${pluralize(count, 'клиент', 'клиента', 'клиентов')}`;
}

/**
 * Типы статусов консультаций
 */
export type AppointmentStatus = 'payment_pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

/**
 * Конфигурация для отображения статуса консультации
 */
export interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

/**
 * Получить конфигурацию для отображения статуса консультации
 */
export function getAppointmentStatusConfig(status: string): StatusConfig {
  switch (status) {
    case 'payment_pending':
      return { label: 'Ожидает оплаты', variant: 'secondary', className: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'completed':
      return { label: 'Завершена', variant: 'default' };
    case 'scheduled':
      return { label: 'Запланировано', variant: 'secondary' };
    case 'in_progress':
      return { label: 'Идёт', variant: 'outline', className: 'border-blue-500 text-blue-500' };
    case 'cancelled':
      return { label: 'Отменено', variant: 'destructive' };
    case 'no_show':
      return { label: 'Неявка', variant: 'destructive' };
    default:
      return { label: status, variant: 'outline' };
  }
}

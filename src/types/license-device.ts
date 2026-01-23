// Система привязки устройств к месту в лицензии (seat) с Trust Score
// Каждый участник лицензии (seat) имеет свой email и свои устройства

// Уровни доверия пользователя (для каждого seat отдельно)
export type TrustLevel = 'new' | 'standard' | 'trusted';

// Статус привязки устройства
export type SeatDeviceStatus = 'active' | 'pending_unbind' | 'unbound';

// Устройство, привязанное к месту в лицензии (seat)
export interface SeatDevice {
  id: string;
  seat_id: string;                  // Привязка к месту, не к лицензии

  // Идентификация устройства
  device_fingerprint: string;
  device_name: string;              // "iPhone 15 Pro", "MacBook Air"
  device_type: 'mobile' | 'tablet' | 'desktop';

  // Статус привязки
  status: SeatDeviceStatus;
  unbind_requested_at?: string;     // Когда запросили отвязку
  unbind_available_at?: string;     // Когда можно завершить (+ cooldown)
  unbind_code?: string;             // Код подтверждения (хранится хешированным на бэке)

  // Активность
  last_active_at: string;
  ip_region?: string;               // Для детекции подозрительной активности

  created_at: string;
}

// История отвязок (для подсчёта лимитов)
export interface DeviceUnbindHistory {
  id: string;
  seat_id: string;
  device_fingerprint: string;
  device_name: string;
  unbound_at: string;
  reason: 'user_request' | 'support' | 'auto_inactive' | 'suspicious';
}

// Конфигурация Trust Score
export interface TrustConfig {
  level: TrustLevel;
  maxDevices: number;
  unbindsPerMonth: number;
  cooldownHours: number;
  requiresEmailCode: boolean;
}

// Конфигурации для каждого уровня доверия
export const TRUST_CONFIGS: Record<TrustLevel, TrustConfig> = {
  new: {
    level: 'new',
    maxDevices: 3,
    unbindsPerMonth: 1,
    cooldownHours: 24,
    requiresEmailCode: true,
  },
  standard: {
    level: 'standard',
    maxDevices: 3,
    unbindsPerMonth: 1,
    cooldownHours: 24,
    requiresEmailCode: true,
  },
  trusted: {
    level: 'trusted',
    maxDevices: 3,
    unbindsPerMonth: 2,
    cooldownHours: 12,
    requiresEmailCode: true, // Всегда требуем код для безопасности
  },
};

// Пороги для повышения/понижения Trust Level
export const TRUST_THRESHOLDS = {
  // Месяцев без нарушений для перехода в trusted
  monthsToTrusted: 3,

  // Автоотвязка неактивных устройств (дней)
  autoUnbindInactiveDays: 90,

  // Подозрительная активность (понижает trust)
  suspiciousActivity: {
    maxRegionsPerWeek: 3,           // Разных IP-регионов за неделю
    maxUnbindsAtLimit: 3,           // Раз подряд использовал лимит отвязок
  },
};

// Привязка email к месту (seat) для идентификации в мобильном приложении
export interface SeatEmailBinding {
  seat_id: string;
  email: string;                    // Email для входа в мобильное приложение
  email_verified: boolean;
  bound_at: string;

  // Trust Score (для каждого seat отдельно)
  trust_level: TrustLevel;
  trust_level_updated_at: string;

  // Статистика (для аналитики и детекции абьюза)
  total_unbinds_count: number;
  last_unbind_at?: string;
  consecutive_limit_hits: number;   // Сколько раз подряд использовал весь лимит

  // Регионы активности (последние 7 дней)
  recent_regions: string[];
}

// Результат проверки возможности отвязки
export interface UnbindCheckResult {
  canUnbind: boolean;
  reason?: 'cooldown' | 'limit_reached' | 'pending_unbind' | 'last_device' | 'no_email';

  // Детали для UI
  cooldownEndsAt?: string;          // Когда закончится cooldown
  unbindsRemaining?: number;        // Сколько отвязок осталось в этом месяце
  unbindsResetAt?: string;          // Когда сбросится счётчик
  nextUnbindAvailableAt?: string;   // Когда можно будет отвязать
}

// Результат запроса на отвязку
export interface UnbindRequestResult {
  success: boolean;
  error?: string;

  // При успехе
  codeExpiresAt?: string;           // Когда истечёт код подтверждения
  unbindAvailableAt?: string;       // Когда устройство будет отвязано (после cooldown)
}

// Отображение уровней доверия
export const TRUST_LEVEL_LABELS: Record<TrustLevel, string> = {
  new: 'Новый',
  standard: 'Стандартный',
  trusted: 'Доверенный',
};

export const TRUST_LEVEL_DESCRIPTIONS: Record<TrustLevel, string> = {
  new: 'Первый месяц использования',
  standard: 'Стандартные условия',
  trusted: 'Расширенные возможности за стабильное использование',
};

// Форматирование времени до события
export function formatTimeRemaining(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs <= 0) return 'сейчас';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} ${pluralize(days, 'день', 'дня', 'дней')}`;
  }

  if (hours > 0) {
    return `${hours} ${pluralize(hours, 'час', 'часа', 'часов')}`;
  }

  return `${minutes} ${pluralize(minutes, 'минута', 'минуты', 'минут')}`;
}

// Склонение слов
function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

// Проверка, истёк ли период неактивности
export function isDeviceInactive(device: SeatDevice): boolean {
  const lastActive = new Date(device.last_active_at);
  const now = new Date();
  const daysSinceActive = Math.floor(
    (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceActive >= TRUST_THRESHOLDS.autoUnbindInactiveDays;
}

// Расчёт даты сброса лимита отвязок (rolling 30 дней)
export function getUnbindLimitResetDate(lastUnbindAt: string): Date {
  const lastUnbind = new Date(lastUnbindAt);
  return new Date(lastUnbind.getTime() + 30 * 24 * 60 * 60 * 1000);
}

// Алиасы для обратной совместимости (deprecated, удалить позже)
/** @deprecated Use SeatDevice instead */
export type LicenseDevice = SeatDevice;
/** @deprecated Use SeatDeviceStatus instead */
export type LicenseDeviceStatus = SeatDeviceStatus;
/** @deprecated Use SeatEmailBinding instead */
export type LicenseEmailBinding = SeatEmailBinding;

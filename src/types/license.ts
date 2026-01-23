// Типы планов лицензий
export type LicensePlanType = 'individual' | 'family';

// Статусы лицензии
export type LicenseStatus = 'active' | 'expired' | 'cancelled' | 'pending';

// План лицензии (то, что можно купить)
export interface LicensePlan {
  id: LicensePlanType;
  name: string;
  description: string;
  maxSeats: number; // Максимальное кол-во участников
  includesDevice: boolean;
  price: number; // Цена в рублях
  period: 'month' | 'year';
  features: string[];
}

// Доступные планы
export const LICENSE_PLANS: LicensePlan[] = [
  {
    id: 'individual',
    name: 'Базовый',
    description: 'Для одного участника',
    maxSeats: 1,
    includesDevice: true,
    price: 80000, // Полная цена
    period: 'month',
    features: [
      'Flex4 устройство',
      'Программа без ограничений',
      'Все типы тренировок (Концентрация, Спокойствие, Фокус)',
      'Персональный прогресс и аналитика',
      'Поддержка 24/7',
      'Гарантия на устройство',
    ],
  },
  {
    id: 'family',
    name: 'Родитель + Ребёнок',
    description: 'Семейный',
    maxSeats: 2,
    includesDevice: true,
    price: 120000, // Полная цена
    period: 'month',
    features: [
      'Flex4 устройство',
      'Программы для обоих (взрослые + дети)',
      'Профили для родителя и ребёнка',
      'Все типы тренировок (Концентрация, Спокойствие, Фокус)',
      'Персональный прогресс для каждого',
      'Поддержка 24/7',
      'Гарантия на устройство',
      'Приоритетная поддержка',
    ],
  },
];

// Лицензия пользователя
export interface License {
  id: string;
  user_id: string;
  plan_type: LicensePlanType;
  status: LicenseStatus;

  // Привязка к устройству
  device_id?: string;

  // Период действия
  starts_at: string;
  expires_at: string;

  // Оплата
  payment_id?: string;
  auto_renew: boolean;

  // Метаданные
  max_seats: number;
  created_at: string;
  updated_at: string;
}

// Место в лицензии (участник)
export interface LicenseSeat {
  id: string;
  license_id: string;
  profile_id: string;

  // Email для идентификации в мобильном приложении
  // Может отличаться от email аккаунта (например, у ребёнка свой email)
  app_email?: string;
  app_email_verified?: boolean;
  app_email_set_at?: string;

  // Связанный профиль (для отображения)
  profile?: {
    id: string;
    first_name: string;
    last_name?: string;
    type: 'parent' | 'child';
  };

  assigned_at: string;
}

// Отображение статусов лицензии
export const LICENSE_STATUS_LABELS: Record<LicenseStatus, string> = {
  active: 'Активна',
  expired: 'Истекла',
  cancelled: 'Отменена',
  pending: 'Ожидает оплаты',
};

export const LICENSE_STATUS_COLORS: Record<LicenseStatus, string> = {
  active: 'text-green-600',
  expired: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/20 text-destructive',
  pending: 'bg-honey/20 text-honey-dark',
};

// Функция для получения плана по типу
export function getLicensePlan(planType: LicensePlanType): LicensePlan | undefined {
  return LICENSE_PLANS.find(p => p.id === planType);
}

// Функция форматирования цены
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Функция для проверки истечения лицензии
export function isLicenseExpiringSoon(license: License, daysThreshold = 7): boolean {
  const expiresAt = new Date(license.expires_at);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
}

// Статусы устройства
export type DeviceStatus =
  | 'not_ordered'    // Не заказано
  | 'ordered'        // Заказано, ожидает отправки
  | 'shipped'        // Отправлено
  | 'in_transit'     // В пути
  | 'delivered'      // Доставлено
  | 'setup_pending'  // Ожидает настройки
  | 'setup_complete' // Настроено и готово к работе

// Устройство пользователя
export interface Device {
  id: string;
  user_id: string;
  serial_number?: string;
  model: string;
  status: DeviceStatus;

  // Адрес доставки
  shipping_address?: {
    full_name: string;
    phone: string;
    city: string;
    address: string;
    postal_code: string;
    comment?: string;
  };

  // Отслеживание доставки
  tracking_number?: string;
  carrier?: string; // 'sdek' | 'russian_post' | etc

  // Временные метки
  ordered_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  setup_completed_at?: string;

  created_at: string;
  updated_at: string;
}

// Чек-лист настройки устройства
export interface DeviceSetupStep {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  link?: string;
  linkText?: string;
}

export const DEVICE_SETUP_STEPS: Omit<DeviceSetupStep, 'completed'>[] = [
  {
    id: 'unpack',
    title: 'Распаковать нейроустройство',
    description: 'Проверьте комплектацию и целостность',
  },
  {
    id: 'charge',
    title: 'Зарядить нейроустройство и мобильное устройство',
    description: 'Полностью зарядите перед первым использованием',
  },
  {
    id: 'pair_device',
    title: 'Подключить нейроустройство к приложению',
    description: 'Следуйте инструкциям в приложении',
  },
  {
    id: 'test_signal',
    title: 'Проверить качество сигнала',
    description: 'Убедитесь, что устройство корректно считывает данные',
  },
  {
    id: 'complete_tutorial',
    title: 'Пройти обучение в приложении',
    description: 'Завершите вводный инструктаж',
  },
];

// FAQ по устройству
export interface DeviceFAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'setup' | 'usage' | 'troubleshooting' | 'care';
}

export const DEVICE_FAQ: DeviceFAQItem[] = [
  {
    id: 'what_included',
    category: 'setup',
    question: 'Что входит в комплект?',
    answer: 'В комплект входит: устройство нейрофидбэка, зарядный кабель USB-C, краткая инструкция по началу работы, чехол для хранения.',
  },
  {
    id: 'how_charge',
    category: 'setup',
    question: 'Как заряжать устройство?',
    answer: 'Подключите устройство к зарядному устройству через USB-C кабель. Полная зарядка занимает около 2 часов. Индикатор загорится зеленым, когда устройство полностью заряжено.',
  },
  {
    id: 'how_connect',
    category: 'setup',
    question: 'Как подключить устройство к телефону?',
    answer: 'Откройте приложение Waves, перейдите в раздел "Устройство", нажмите "Подключить". Убедитесь, что Bluetooth включен. Следуйте инструкциям на экране.',
  },
  {
    id: 'no_signal',
    category: 'troubleshooting',
    question: 'Устройство не ловит сигнал',
    answer: 'Убедитесь, что электроды плотно прилегают к коже. Протрите контактные площадки влажной салфеткой. Проверьте заряд устройства. Если проблема сохраняется, обратитесь в поддержку.',
  },
  {
    id: 'not_connecting',
    category: 'troubleshooting',
    question: 'Устройство не подключается к телефону',
    answer: 'Перезагрузите устройство и телефон. Убедитесь, что Bluetooth включен. Удалите устройство из списка сопряженных и подключите заново. Обновите приложение до последней версии.',
  },
  {
    id: 'battery_drain',
    category: 'troubleshooting',
    question: 'Батарея быстро разряжается',
    answer: 'Это может быть связано с активным Bluetooth-соединением. Выключайте устройство после тренировки. Если батарея разряжается менее чем за 4 часа активного использования, обратитесь в поддержку.',
  },
  {
    id: 'how_clean',
    category: 'care',
    question: 'Как ухаживать за устройством?',
    answer: 'Протирайте электроды влажной салфеткой после каждого использования. Храните в чехле в сухом месте. Не погружайте в воду. Избегайте падений и ударов.',
  },
  {
    id: 'session_duration',
    category: 'usage',
    question: 'Как часто проводить тренировки?',
    answer: 'Рекомендуемая частота — 3-5 тренировок в неделю по 20-30 минут. Не проводите более одной тренировки в день. Следуйте рекомендациям вашего специалиста.',
  },
];

// Отображение статусов доставки
export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  not_ordered: 'Не заказано',
  ordered: 'Заказ оформлен',
  shipped: 'Отправлено',
  in_transit: 'В пути',
  delivered: 'Доставлено',
  setup_pending: 'Ожидает настройки',
  setup_complete: 'Готово к работе',
};

export const DEVICE_STATUS_COLORS: Record<DeviceStatus, string> = {
  not_ordered: 'bg-muted text-muted-foreground',
  ordered: 'bg-honey/20 text-honey-dark',
  shipped: 'bg-sky-100 text-sky-700',
  in_transit: 'bg-sky-100 text-sky-700',
  delivered: 'bg-success/20 text-success',
  setup_pending: 'bg-coral/20 text-coral',
  setup_complete: 'bg-success/20 text-success',
};

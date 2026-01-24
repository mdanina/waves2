import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  autoCheck?: boolean; // Автоматически проверяется системой
  link?: string; // Ссылка для действия
  linkText?: string; // Текст ссылки
  requiresDevice?: boolean; // Требует доставки устройства (status === 'delivered')
  disabled?: boolean; // Пункт неактивен (например, требует доставки устройства)
  hideWhenDeviceDelivered?: boolean; // Скрывается после получения устройства
}

export interface OnboardingChecklistState {
  items: Record<string, boolean>;
  completedAt?: string; // Когда чек-лист был полностью завершен
  dismissedAt?: string; // Когда пользователь скрыл чек-лист
}

const STORAGE_KEY = 'waves_onboarding_checklist';

// Определение пунктов чек-листа
// НОВЫЙ ПОРЯДОК: лицензия → устройство → профили → остальное
export const CHECKLIST_ITEMS: Omit<ChecklistItem, 'completed'>[] = [
  {
    id: 'pay_licenses',
    title: 'Оплатить лицензию',
    description: 'Приобретите лицензию для начала работы',
    autoCheck: true, // Проверяется автоматически по наличию лицензий
    link: '/cabinet/licenses',
    linkText: 'Открыть',
  },
  {
    id: 'order_device',
    title: 'Заказать доставку устройства',
    description: 'Оформите заказ на устройство нейрофидбэка',
    autoCheck: true, // Проверяется автоматически по наличию заказанного устройства
    link: '/cabinet/device',
    linkText: 'Открыть',
  },
  {
    id: 'learn_neurofeedback',
    title: 'Познакомиться с методом нейрофидбэка',
    description: 'Узнайте, как работает технология',
    link: 'https://waves.ai/neurofeedback',
    linkText: 'Открыть',
  },
  {
    id: 'fill_profiles',
    title: 'Заполнить профили участников',
    description: 'Добавьте информацию о себе и членах семьи',
    autoCheck: true, // Проверяется автоматически по наличию профилей
    link: '/add-family-member',
    linkText: 'Создать нового',
  },
  {
    id: 'set_training_goals',
    title: 'Настроить цели тренировок',
    description: 'Выберите цели для каждого участника',
    autoCheck: false, // Ручная проверка пользователем
    link: '/cabinet/goals',
    linkText: 'Открыть',
  },
  {
    id: 'download_app',
    title: 'Скачать мобильное приложение',
    description: 'Установите приложение Waves на телефон',
    link: 'https://waves.ai/app',
    linkText: 'Скачать',
    requiresDevice: true, // Требует доставки устройства
  },
  {
    id: 'bind_licenses',
    title: 'Привязать лицензии к участнику и устройству',
    description: 'Настройте привязку лицензий к участникам и устройству',
    link: '/cabinet/licenses',
    linkText: 'Открыть',
    requiresDevice: true, // Требует доставки устройства
  },
  {
    id: 'test_device',
    title: 'Подключить и протестировать устройство',
    description: 'Убедитесь, что устройство работает корректно',
    link: '/cabinet/device',
    linkText: 'Открыть',
    requiresDevice: true, // Требует доставки устройства
  },
  {
    id: 'complete_tutorial',
    title: 'Пройти инструктаж в мобильном приложении',
    description: 'Завершите обучение в приложении',
    requiresDevice: true, // Требует доставки устройства
  },
];

interface UseOnboardingChecklistOptions {
  profilesCount?: number; // Количество заполненных профилей для автопроверки
  hasLicense?: boolean; // Есть ли лицензия
  hasDevice?: boolean; // Есть ли заказанное устройство
}

// Хелпер для проверки наличия лицензии из localStorage
function checkHasLicense(): boolean {
  try {
    const stored = localStorage.getItem('waves_licenses');
    if (!stored) return false;
    
    const licenses = JSON.parse(stored);
    if (!Array.isArray(licenses) || licenses.length === 0) {
      return false;
    }
    
    // Проверяем, есть ли хотя бы одна активная лицензия
    return licenses.some((license: any) => license.status === 'active');
  } catch {
    return false;
  }
}

// Хелпер для проверки наличия устройства из localStorage
function checkHasDevice(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    const stored = localStorage.getItem(`waves_device_${userId}`);
    return stored !== null;
  } catch {
    return false;
  }
}

// Хелпер для проверки доставки устройства (status === 'delivered')
function checkIsDeviceDelivered(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    const stored = localStorage.getItem(`waves_device_${userId}`);
    if (!stored) return false;
    const device = JSON.parse(stored);
    return device?.status === 'delivered' || 
           device?.status === 'setup_pending' || 
           device?.status === 'setup_complete';
  } catch {
    return false;
  }
}

export function useOnboardingChecklist(options: UseOnboardingChecklistOptions = {}) {
  const { user } = useAuth();
  const { profilesCount = 0 } = options;

  // Автоопределение наличия лицензии и устройства из localStorage
  const [autoChecks, setAutoChecks] = useState({
    hasLicense: options.hasLicense ?? checkHasLicense(),
    hasDevice: options.hasDevice ?? checkHasDevice(user?.id),
    isDeviceDelivered: checkIsDeviceDelivered(user?.id),
  });

  // Периодически проверяем наличие лицензии и устройства
  useEffect(() => {
    const checkStatus = () => {
      setAutoChecks({
        hasLicense: options.hasLicense ?? checkHasLicense(),
        hasDevice: options.hasDevice ?? checkHasDevice(user?.id),
        isDeviceDelivered: checkIsDeviceDelivered(user?.id),
      });
    };

    // Проверяем при монтировании
    checkStatus();

    // Слушаем изменения localStorage
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes('waves_licenses') || e.key?.includes('waves_device')) {
        checkStatus();
      }
    };

    window.addEventListener('storage', handleStorage);

    // Также проверяем периодически (для изменений в том же окне)
    const interval = setInterval(checkStatus, 2000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [user?.id, options.hasLicense, options.hasDevice]);

  const [state, setState] = useState<OnboardingChecklistState>(() => {
    if (typeof window === 'undefined') return { items: {} };

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user?.id || 'guest'}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading checklist state:', e);
    }
    return { items: {} };
  });

  // Загружаем состояние из БД при монтировании и смене пользователя
  useEffect(() => {
    if (!user?.id) return;

    const loadFromDB = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_checklist')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          logger.error('Error loading checklist from DB:', error);
          // Fallback на localStorage
          const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
          if (stored) {
            setState(JSON.parse(stored));
          }
          return;
        }

        if (data?.onboarding_checklist) {
          // Данные из БД имеют приоритет
          setState(data.onboarding_checklist);
          // Синхронизируем с localStorage
          localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(data.onboarding_checklist));
        } else {
          // Если в БД нет данных, пробуем загрузить из localStorage
          const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
          if (stored) {
            const localState = JSON.parse(stored);
            setState(localState);
            // Сохраняем в БД для синхронизации
            await supabase
              .from('users')
              .update({ onboarding_checklist: localState })
              .eq('id', user.id);
          } else {
            setState({ items: {} });
          }
        }
      } catch (e) {
        logger.error('Error loading checklist state:', e);
        // Fallback на localStorage
        const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
        if (stored) {
          setState(JSON.parse(stored));
        }
      }
    };

    loadFromDB();
  }, [user?.id]);

  // Сохраняем состояние в БД и localStorage при изменении
  useEffect(() => {
    if (!user?.id) return;

    const saveToDB = async () => {
      try {
        // Сохраняем в localStorage для быстрого доступа
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(state));

        // Сохраняем в БД
        const { error } = await supabase
          .from('users')
          .update({ onboarding_checklist: state })
          .eq('id', user.id);

        if (error) {
          logger.error('Error saving checklist to DB:', error);
        }
      } catch (e) {
        logger.error('Error saving checklist state:', e);
      }
    };

    // Дебаунсим сохранение в БД (не чаще раза в секунду)
    const timeoutId = setTimeout(saveToDB, 500);
    return () => clearTimeout(timeoutId);
  }, [state, user?.id]);

  // Формируем список элементов с учетом автопроверок
  const items = useMemo((): ChecklistItem[] => {
    return CHECKLIST_ITEMS.map(item => {
      let completed = state.items[item.id] || false;

      // Автопроверка: лицензия оплачена
      if (item.id === 'pay_licenses' && item.autoCheck) {
        completed = autoChecks.hasLicense;
      }

      // Автопроверка: устройство заказано
      if (item.id === 'order_device' && item.autoCheck) {
        completed = autoChecks.hasDevice;
      }

      // Автопроверка: профили заполнены если есть хотя бы 1 профиль
      if (item.id === 'fill_profiles' && item.autoCheck) {
        completed = profilesCount >= 1;
      }

      return {
        ...item,
        completed,
        // Если пункт требует доставки устройства, но устройство не доставлено - не показываем как выполненный
        disabled: item.requiresDevice && !autoChecks.isDeviceDelivered,
      };
    });
  }, [state.items, profilesCount, autoChecks]);

  // Подсчет прогресса
  const progress = useMemo(() => {
    const completed = items.filter(item => item.completed).length;
    const total = items.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }, [items]);

  // Все пункты выполнены
  const isCompleted = progress.completed === progress.total;

  // Чек-лист скрыт пользователем
  const isDismissed = !!state.dismissedAt;

  // Отметить пункт как выполненный
  const markCompleted = useCallback((itemId: string, completed: boolean = true) => {
    setState(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: completed,
      },
    }));
  }, []);

  // Переключить состояние пункта
  const toggleItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: !prev.items[itemId],
      },
    }));
  }, []);

  // Скрыть чек-лист
  const dismiss = useCallback(() => {
    setState(prev => ({
      ...prev,
      dismissedAt: new Date().toISOString(),
    }));
  }, []);

  // Показать чек-лист снова
  const restore = useCallback(() => {
    setState(prev => ({
      ...prev,
      dismissedAt: undefined,
    }));
  }, []);

  // Сбросить весь прогресс
  const reset = useCallback(() => {
    setState({ items: {} });
  }, []);

  return {
    items,
    progress,
    isCompleted,
    isDismissed,
    markCompleted,
    toggleItem,
    dismiss,
    restore,
    reset,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Device, DeviceStatus, DeviceSetupStep, DEVICE_SETUP_STEPS } from '@/types/device';

const STORAGE_KEY = 'waves_device';
const SETUP_STORAGE_KEY = 'waves_device_setup';

// Mock-данные для разработки
// В будущем заменить на запросы к Supabase
function getMockDevice(userId: string): Device | null {
  // Для демонстрации возвращаем null (устройство не заказано)
  // Можно изменить для тестирования разных состояний
  return null;
}

export function useDevice() {
  const { user } = useAuth();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Загрузка устройства
  useEffect(() => {
    if (!user?.id) {
      setDevice(null);
      setLoading(false);
      return;
    }

    // Пробуем загрузить из localStorage (mock)
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        const loadedDevice = JSON.parse(stored);
        // Если устройство доставлено или настроено, но нет серийного номера - добавляем
        if ((loadedDevice.status === 'delivered' || 
             loadedDevice.status === 'setup_pending' || 
             loadedDevice.status === 'setup_complete') && 
            !loadedDevice.serial_number) {
          loadedDevice.serial_number = 'WF-' + Math.random().toString(36).substring(2, 10).toUpperCase();
          localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(loadedDevice));
        }
        setDevice(loadedDevice);
      } else {
        // Mock: устройство не заказано
        setDevice(null);
      }
    } catch (e) {
      console.error('Error loading device:', e);
      setDevice(null);
    }
    setLoading(false);
  }, [user?.id]);

  // Сохранение устройства в localStorage
  const saveDevice = useCallback((newDevice: Device | null) => {
    if (!user?.id) return;

    if (newDevice) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newDevice));
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
    }
    setDevice(newDevice);
  }, [user?.id]);

  // Заказать устройство (mock)
  const orderDevice = useCallback(async (shippingAddress: Device['shipping_address']) => {
    if (!user?.id) throw new Error('User not authenticated');

    // Имитация API запроса
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newDevice: Device = {
      id: `device_${Date.now()}`,
      user_id: user.id,
      model: 'Waves Neurofeedback v1',
      status: 'ordered',
      shipping_address: shippingAddress,
      ordered_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveDevice(newDevice);
    return newDevice;
  }, [user?.id, saveDevice]);

  // Обновить статус устройства (для тестирования)
  const updateStatus = useCallback((status: DeviceStatus) => {
    if (!device) return;

    const updates: Partial<Device> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'shipped') {
      updates.shipped_at = new Date().toISOString();
      updates.tracking_number = 'SDEK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      updates.carrier = 'sdek';
    }

    if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
      // Добавляем моковый серийный номер при доставке
      if (!device.serial_number) {
        updates.serial_number = 'WF-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      }
    }

    if (status === 'setup_complete') {
      updates.setup_completed_at = new Date().toISOString();
      // Добавляем моковый серийный номер при завершении настройки, если его еще нет
      if (!device.serial_number) {
        updates.serial_number = 'WF-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      }
    }

    saveDevice({ ...device, ...updates });
  }, [device, saveDevice]);

  // Сбросить устройство (для тестирования)
  const resetDevice = useCallback(() => {
    saveDevice(null);
  }, [saveDevice]);

  return {
    device,
    loading,
    error,
    orderDevice,
    updateStatus,
    resetDevice,
    hasDevice: !!device,
    isOrdered: device?.status === 'ordered',
    isShipped: device?.status === 'shipped' || device?.status === 'in_transit',
    isDelivered: device?.status === 'delivered' || device?.status === 'setup_pending' || device?.status === 'setup_complete',
    isSetupComplete: device?.status === 'setup_complete',
  };
}

// Хук для чек-листа настройки устройства
export function useDeviceSetup() {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Загрузка прогресса
  useEffect(() => {
    if (!user?.id) return;

    try {
      const stored = localStorage.getItem(`${SETUP_STORAGE_KEY}_${user.id}`);
      if (stored) {
        setCompletedSteps(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.error('Error loading device setup:', e);
    }
  }, [user?.id]);

  // Сохранение прогресса
  useEffect(() => {
    if (!user?.id) return;

    try {
      localStorage.setItem(
        `${SETUP_STORAGE_KEY}_${user.id}`,
        JSON.stringify([...completedSteps])
      );
    } catch (e) {
      console.error('Error saving device setup:', e);
    }
  }, [completedSteps, user?.id]);

  const toggleStep = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  const markComplete = useCallback((stepId: string) => {
    setCompletedSteps(prev => new Set(prev).add(stepId));
  }, []);

  const reset = useCallback(() => {
    setCompletedSteps(new Set());
  }, []);

  const isStepComplete = useCallback((stepId: string) => {
    return completedSteps.has(stepId);
  }, [completedSteps]);

  const progress = {
    completed: completedSteps.size,
    total: 6, // DEVICE_SETUP_STEPS.length
    percentage: Math.round((completedSteps.size / 6) * 100),
  };

  const isAllComplete = completedSteps.size >= 6;

  return {
    completedSteps,
    toggleStep,
    markComplete,
    reset,
    isStepComplete,
    progress,
    isAllComplete,
  };
}

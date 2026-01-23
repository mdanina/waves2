import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sendVerificationCode } from '@/lib/emailService';
import {
  type SeatDevice,
  type SeatDeviceStatus,
  type TrustLevel,
  type TrustConfig,
  type UnbindCheckResult,
  type UnbindRequestResult,
  type DeviceUnbindHistory,
  type SeatEmailBinding,
  TRUST_CONFIGS,
  TRUST_THRESHOLDS,
  getUnbindLimitResetDate,
} from '@/types/license-device';

const STORAGE_KEY = 'waves_seat_devices';
const BINDING_STORAGE_KEY = 'waves_seat_email_binding';
const UNBIND_HISTORY_KEY = 'waves_seat_unbind_history';

// Генерация 6-значного кода
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Генерация device fingerprint (упрощённая версия для mock)
function generateDeviceFingerprint(): string {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const screen = typeof window !== 'undefined' ? window.screen : null;

  const data = [
    nav?.userAgent || 'unknown',
    nav?.language || 'unknown',
    screen?.width || 0,
    screen?.height || 0,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join('|');

  // Простой хеш
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

// Определение типа устройства
function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';

  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Определение имени устройства
function detectDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device';

  const ua = navigator.userAgent;

  // iOS
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';

  // Android
  const androidMatch = ua.match(/Android.*;\s*([^;)]+)/);
  if (androidMatch) return androidMatch[1].trim();

  // Desktop
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux PC';

  return 'Unknown Device';
}

export interface UseSeatDevicesOptions {
  seatId: string;
}

export function useSeatDevices({ seatId }: UseSeatDevicesOptions) {
  const { user } = useAuth();

  // Состояние
  const [devices, setDevices] = useState<SeatDevice[]>([]);
  const [binding, setBinding] = useState<SeatEmailBinding | null>(null);
  const [unbindHistory, setUnbindHistory] = useState<DeviceUnbindHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Для процесса отвязки
  const [pendingUnbindCode, setPendingUnbindCode] = useState<string | null>(null);
  const [pendingUnbindDeviceId, setPendingUnbindDeviceId] = useState<string | null>(null);

  // Загрузка данных из localStorage (mock)
  useEffect(() => {
    if (!user?.id || !seatId) {
      setDevices([]);
      setBinding(null);
      setLoading(false);
      return;
    }

    try {
      // Загружаем устройства
      const storedDevices = localStorage.getItem(`${STORAGE_KEY}_${seatId}`);
      if (storedDevices) {
        setDevices(JSON.parse(storedDevices));
      }

      // Загружаем binding (если есть)
      const storedBinding = localStorage.getItem(`${BINDING_STORAGE_KEY}_${seatId}`);
      if (storedBinding) {
        setBinding(JSON.parse(storedBinding));
      }
      // НЕ создаём binding автоматически - пользователь должен явно указать email

      // Загружаем историю отвязок
      const storedHistory = localStorage.getItem(`${UNBIND_HISTORY_KEY}_${seatId}`);
      if (storedHistory) {
        setUnbindHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Error loading seat devices:', e);
      setError(e instanceof Error ? e : new Error('Failed to load devices'));
    }

    setLoading(false);
  }, [user?.id, seatId]);

  // Сохранение устройств
  const saveDevices = useCallback((newDevices: SeatDevice[]) => {
    if (!seatId) return;
    localStorage.setItem(`${STORAGE_KEY}_${seatId}`, JSON.stringify(newDevices));
    setDevices(newDevices);
  }, [seatId]);

  // Сохранение binding
  const saveBinding = useCallback((newBinding: SeatEmailBinding) => {
    if (!seatId) return;
    localStorage.setItem(`${BINDING_STORAGE_KEY}_${seatId}`, JSON.stringify(newBinding));
    setBinding(newBinding);
  }, [seatId]);

  // Сохранение истории
  const saveHistory = useCallback((newHistory: DeviceUnbindHistory[]) => {
    if (!seatId) return;
    localStorage.setItem(`${UNBIND_HISTORY_KEY}_${seatId}`, JSON.stringify(newHistory));
    setUnbindHistory(newHistory);
  }, [seatId]);

  // Текущая конфигурация Trust Score
  const trustConfig: TrustConfig = useMemo(() => {
    return TRUST_CONFIGS[binding?.trust_level || 'new'];
  }, [binding?.trust_level]);

  // Количество отвязок за последние 30 дней
  const unbindsLast30Days = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return unbindHistory.filter(h =>
      h.reason === 'user_request' &&
      new Date(h.unbound_at) > thirtyDaysAgo
    ).length;
  }, [unbindHistory]);

  // Активные устройства (active + pending_unbind)
  const activeDevices = useMemo(() => {
    return devices.filter(d => d.status === 'active' || d.status === 'pending_unbind');
  }, [devices]);

  // Текущее устройство (если привязано)
  const currentDevice = useMemo(() => {
    const fingerprint = generateDeviceFingerprint();
    return devices.find(d => d.device_fingerprint === fingerprint && d.status === 'active');
  }, [devices]);

  // Можно ли добавить устройство
  const canAddDevice = useMemo(() => {
    return activeDevices.length < trustConfig.maxDevices;
  }, [activeDevices.length, trustConfig.maxDevices]);

  // Проверка, привязан ли email к seat
  const hasEmail = useMemo(() => {
    return !!binding?.email;
  }, [binding?.email]);

  // Установить email для seat
  const setEmail = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!seatId) {
      return { success: false, error: 'Seat ID не указан' };
    }

    // Проверяем, что email ещё не привязан
    if (binding?.email) {
      return { success: false, error: 'Email уже привязан к этому месту' };
    }

    // Создаём новый binding
    const newBinding: SeatEmailBinding = {
      seat_id: seatId,
      email: email.toLowerCase().trim(),
      email_verified: false, // Потребуется верификация
      bound_at: new Date().toISOString(),
      trust_level: 'new',
      trust_level_updated_at: new Date().toISOString(),
      total_unbinds_count: 0,
      consecutive_limit_hits: 0,
      recent_regions: [],
    };

    saveBinding(newBinding);
    return { success: true };
  }, [seatId, binding?.email, saveBinding]);

  // Верификация email (упрощённая - в реальности через код на почту)
  const verifyEmail = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!binding) {
      return { success: false, error: 'Email не привязан' };
    }

    // В реальности тут была бы отправка кода и его проверка
    // Для mock просто помечаем как verified
    saveBinding({
      ...binding,
      email_verified: true,
    });

    return { success: true };
  }, [binding, saveBinding]);

  // Добавить текущее устройство
  const addCurrentDevice = useCallback(async (): Promise<SeatDevice> => {
    if (!hasEmail) {
      throw new Error('Сначала укажите email для этого места в лицензии');
    }

    if (!canAddDevice) {
      throw new Error('Достигнут лимит устройств');
    }

    const fingerprint = generateDeviceFingerprint();

    // Проверяем, не привязано ли уже
    const existing = devices.find(d =>
      d.device_fingerprint === fingerprint && d.status === 'active'
    );
    if (existing) {
      return existing;
    }

    const newDevice: SeatDevice = {
      id: `sd_${Date.now()}`,
      seat_id: seatId,
      device_fingerprint: fingerprint,
      device_name: detectDeviceName(),
      device_type: detectDeviceType(),
      status: 'active',
      last_active_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const newDevices = [...devices, newDevice];
    saveDevices(newDevices);

    return newDevice;
  }, [hasEmail, canAddDevice, devices, seatId, saveDevices]);

  // Проверка возможности отвязки
  const checkCanUnbind = useCallback((deviceId: string): UnbindCheckResult => {
    // Проверяем наличие email
    if (!hasEmail) {
      return { canUnbind: false, reason: 'no_email' };
    }

    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      return { canUnbind: false, reason: 'last_device' };
    }

    // Уже в процессе отвязки
    if (device.status === 'pending_unbind') {
      return {
        canUnbind: false,
        reason: 'pending_unbind',
        cooldownEndsAt: device.unbind_available_at,
      };
    }

    // Последнее устройство
    if (activeDevices.length <= 1) {
      return { canUnbind: false, reason: 'last_device' };
    }

    // Проверяем лимит отвязок
    if (unbindsLast30Days >= trustConfig.unbindsPerMonth) {
      // Находим, когда сбросится лимит
      const oldestUnbind = unbindHistory
        .filter(h => h.reason === 'user_request')
        .sort((a, b) => new Date(a.unbound_at).getTime() - new Date(b.unbound_at).getTime())[0];

      const resetDate = oldestUnbind
        ? getUnbindLimitResetDate(oldestUnbind.unbound_at)
        : new Date();

      return {
        canUnbind: false,
        reason: 'limit_reached',
        unbindsRemaining: 0,
        unbindsResetAt: resetDate.toISOString(),
      };
    }

    return {
      canUnbind: true,
      unbindsRemaining: trustConfig.unbindsPerMonth - unbindsLast30Days,
    };
  }, [hasEmail, devices, activeDevices.length, unbindsLast30Days, trustConfig.unbindsPerMonth, unbindHistory]);

  // Запросить отвязку (отправляет код на email)
  const requestUnbind = useCallback(async (deviceId: string): Promise<UnbindRequestResult> => {
    const checkResult = checkCanUnbind(deviceId);

    if (!checkResult.canUnbind) {
      const errorMessages: Record<string, string> = {
        no_email: 'Email не привязан к этому месту',
        limit_reached: 'Достигнут лимит отвязок в этом месяце',
        last_device: 'Нельзя отвязать последнее устройство',
        pending_unbind: 'Устройство уже в процессе отвязки',
      };
      return {
        success: false,
        error: errorMessages[checkResult.reason || ''] || 'Невозможно отвязать устройство',
      };
    }

    const device = devices.find(d => d.id === deviceId);
    if (!device || !binding?.email) {
      return { success: false, error: 'Устройство или email не найдены' };
    }

    // Генерируем код
    const code = generateVerificationCode();
    const codeExpiresAt = new Date();
    codeExpiresAt.setMinutes(codeExpiresAt.getMinutes() + 10); // Код действует 10 минут

    // Отправляем код на email
    const emailResult = await sendVerificationCode({
      email: binding.email,
      code,
      deviceName: device.device_name,
      type: 'unbind_device',
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'Ошибка отправки кода' };
    }

    // Сохраняем код
    setPendingUnbindCode(code);
    setPendingUnbindDeviceId(deviceId);

    return {
      success: true,
      codeExpiresAt: codeExpiresAt.toISOString(),
    };
  }, [checkCanUnbind, devices, binding?.email]);

  // Подтвердить отвязку кодом
  const confirmUnbind = useCallback(async (code: string): Promise<UnbindRequestResult> => {
    if (!pendingUnbindDeviceId || !pendingUnbindCode) {
      return { success: false, error: 'Нет активного запроса на отвязку' };
    }

    if (code !== pendingUnbindCode) {
      return { success: false, error: 'Неверный код подтверждения' };
    }

    const device = devices.find(d => d.id === pendingUnbindDeviceId);
    if (!device) {
      return { success: false, error: 'Устройство не найдено' };
    }

    // Рассчитываем время cooldown
    const unbindAvailableAt = new Date();
    unbindAvailableAt.setHours(unbindAvailableAt.getHours() + trustConfig.cooldownHours);

    // Обновляем статус устройства
    const updatedDevices = devices.map(d =>
      d.id === pendingUnbindDeviceId
        ? {
          ...d,
          status: 'pending_unbind' as SeatDeviceStatus,
          unbind_requested_at: new Date().toISOString(),
          unbind_available_at: unbindAvailableAt.toISOString(),
        }
        : d
    );

    saveDevices(updatedDevices);

    // Очищаем pending состояние
    setPendingUnbindCode(null);
    setPendingUnbindDeviceId(null);

    return {
      success: true,
      unbindAvailableAt: unbindAvailableAt.toISOString(),
    };
  }, [pendingUnbindDeviceId, pendingUnbindCode, devices, trustConfig.cooldownHours, saveDevices]);

  // Отменить отвязку (пока в pending)
  const cancelUnbind = useCallback(async (deviceId: string): Promise<boolean> => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || device.status !== 'pending_unbind') {
      return false;
    }

    const updatedDevices = devices.map(d =>
      d.id === deviceId
        ? {
          ...d,
          status: 'active' as SeatDeviceStatus,
          unbind_requested_at: undefined,
          unbind_available_at: undefined,
        }
        : d
    );

    saveDevices(updatedDevices);
    return true;
  }, [devices, saveDevices]);

  // Завершить отвязку (когда cooldown истёк)
  const completeUnbind = useCallback(async (deviceId: string): Promise<boolean> => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || device.status !== 'pending_unbind') {
      return false;
    }

    // Проверяем, истёк ли cooldown
    if (device.unbind_available_at && new Date(device.unbind_available_at) > new Date()) {
      return false;
    }

    // Обновляем устройство
    const updatedDevices = devices.map(d =>
      d.id === deviceId
        ? { ...d, status: 'unbound' as SeatDeviceStatus }
        : d
    );
    saveDevices(updatedDevices);

    // Добавляем в историю
    const historyEntry: DeviceUnbindHistory = {
      id: `uh_${Date.now()}`,
      seat_id: seatId,
      device_fingerprint: device.device_fingerprint,
      device_name: device.device_name,
      unbound_at: new Date().toISOString(),
      reason: 'user_request',
    };
    saveHistory([...unbindHistory, historyEntry]);

    // Обновляем binding
    if (binding) {
      const newUnbindsCount = binding.total_unbinds_count + 1;
      const newConsecutiveHits = unbindsLast30Days + 1 >= trustConfig.unbindsPerMonth
        ? binding.consecutive_limit_hits + 1
        : 0;

      saveBinding({
        ...binding,
        total_unbinds_count: newUnbindsCount,
        last_unbind_at: new Date().toISOString(),
        consecutive_limit_hits: newConsecutiveHits,
      });
    }

    return true;
  }, [devices, seatId, unbindHistory, binding, unbindsLast30Days, trustConfig.unbindsPerMonth, saveDevices, saveHistory, saveBinding]);

  // Обновить активность текущего устройства
  const updateLastActive = useCallback(() => {
    if (!currentDevice) return;

    const updatedDevices = devices.map(d =>
      d.id === currentDevice.id
        ? { ...d, last_active_at: new Date().toISOString() }
        : d
    );
    saveDevices(updatedDevices);
  }, [currentDevice, devices, saveDevices]);

  // Обновить Trust Level (вызывается периодически или при определённых событиях)
  const updateTrustLevel = useCallback(() => {
    if (!binding) return;

    const boundAt = new Date(binding.bound_at);
    const now = new Date();
    const monthsActive = Math.floor(
      (now.getTime() - boundAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    let newTrustLevel: TrustLevel = binding.trust_level;

    // Повышение
    if (monthsActive >= TRUST_THRESHOLDS.monthsToTrusted &&
      binding.consecutive_limit_hits < TRUST_THRESHOLDS.suspiciousActivity.maxUnbindsAtLimit) {
      newTrustLevel = 'trusted';
    } else if (monthsActive >= 1) {
      newTrustLevel = 'standard';
    }

    // Понижение при подозрительной активности
    if (binding.consecutive_limit_hits >= TRUST_THRESHOLDS.suspiciousActivity.maxUnbindsAtLimit ||
      binding.recent_regions.length > TRUST_THRESHOLDS.suspiciousActivity.maxRegionsPerWeek) {
      newTrustLevel = 'new';
    }

    if (newTrustLevel !== binding.trust_level) {
      saveBinding({
        ...binding,
        trust_level: newTrustLevel,
        trust_level_updated_at: new Date().toISOString(),
      });
    }
  }, [binding, saveBinding]);

  // Автоматическое завершение pending отвязок при загрузке
  // Проверяем один раз после загрузки данных
  const hasCheckedPendingRef = useRef(false);

  useEffect(() => {
    if (loading || hasCheckedPendingRef.current || devices.length === 0) return;

    hasCheckedPendingRef.current = true;
    const now = new Date();

    // Находим устройства, у которых истёк cooldown
    const expiredPendingDevices = devices.filter(d =>
      d.status === 'pending_unbind' &&
      d.unbind_available_at &&
      new Date(d.unbind_available_at) <= now
    );

    // Завершаем их отвязку напрямую (не через completeUnbind, чтобы избежать циклов)
    if (expiredPendingDevices.length > 0) {
      const updatedDevices = devices.map(d => {
        if (expiredPendingDevices.some(pd => pd.id === d.id)) {
          return { ...d, status: 'unbound' as SeatDeviceStatus };
        }
        return d;
      });
      saveDevices(updatedDevices);

      // Добавляем в историю
      const newHistoryEntries: DeviceUnbindHistory[] = expiredPendingDevices.map(d => ({
        id: `uh_${Date.now()}_${d.id}`,
        seat_id: seatId,
        device_fingerprint: d.device_fingerprint,
        device_name: d.device_name,
        unbound_at: new Date().toISOString(),
        reason: 'user_request' as const,
      }));
      saveHistory([...unbindHistory, ...newHistoryEntries]);

      // Обновляем binding (счётчики отвязок)
      if (binding) {
        const newUnbindsCount = binding.total_unbinds_count + expiredPendingDevices.length;
        saveBinding({
          ...binding,
          total_unbinds_count: newUnbindsCount,
          last_unbind_at: new Date().toISOString(),
        });
      }
    }
  }, [loading, devices, seatId, unbindHistory, binding, saveDevices, saveHistory, saveBinding]);

  // Сброс для тестирования
  const resetAll = useCallback(() => {
    if (!seatId) return;
    localStorage.removeItem(`${STORAGE_KEY}_${seatId}`);
    localStorage.removeItem(`${BINDING_STORAGE_KEY}_${seatId}`);
    localStorage.removeItem(`${UNBIND_HISTORY_KEY}_${seatId}`);
    setDevices([]);
    setBinding(null);
    setUnbindHistory([]);
  }, [seatId]);

  return {
    // Данные
    devices,
    activeDevices,
    currentDevice,
    binding,
    unbindHistory,
    trustConfig,

    // Состояние
    loading,
    error,

    // Email
    hasEmail,
    setEmail,
    verifyEmail,

    // Лимиты
    canAddDevice,
    unbindsLast30Days,
    unbindsRemaining: trustConfig.unbindsPerMonth - unbindsLast30Days,

    // Действия
    addCurrentDevice,
    checkCanUnbind,
    requestUnbind,
    confirmUnbind,
    cancelUnbind,
    completeUnbind,
    updateLastActive,
    updateTrustLevel,

    // Процесс отвязки
    pendingUnbindDeviceId,
    hasPendingUnbindRequest: !!pendingUnbindCode,

    // Для тестирования (только DEV)
    resetAll,
    _mockCode: import.meta.env.DEV ? pendingUnbindCode : null,
  };
}

// Хук для автоматической привязки текущего устройства при входе
export function useAutoBindDevice(seatId: string | undefined) {
  const { user } = useAuth();
  const [isBinding, setIsBinding] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);
  const hasAttemptedBind = useRef(false);
  const hasUpdatedActivity = useRef(false);

  const seatDevices = useSeatDevices({
    seatId: seatId || '',
  });

  const { currentDevice, canAddDevice, addCurrentDevice, updateLastActive, loading, hasEmail } = seatDevices;

  // Стабильная проверка наличия текущего устройства (по ID, а не по reference)
  const currentDeviceId = currentDevice?.id;

  // Сброс рефов при изменении seatId
  const prevSeatIdRef = useRef(seatId);
  useEffect(() => {
    if (prevSeatIdRef.current !== seatId) {
      prevSeatIdRef.current = seatId;
      hasAttemptedBind.current = false;
      hasUpdatedActivity.current = false;
    }
  }, [seatId]);

  useEffect(() => {
    if (!seatId || !user?.id || loading) return;

    // Если email не привязан — не пытаемся привязать устройство
    if (!hasEmail) {
      setBindError('Сначала укажите email для этого места в лицензии');
      return;
    }

    // Если текущее устройство уже привязано — обновляем активность один раз
    if (currentDeviceId) {
      if (!hasUpdatedActivity.current) {
        hasUpdatedActivity.current = true;
        updateLastActive();
      }
      return;
    }

    // Предотвращаем повторные попытки привязки
    if (hasAttemptedBind.current) return;
    hasAttemptedBind.current = true;

    // Если можно добавить — добавляем автоматически
    if (canAddDevice) {
      setIsBinding(true);
      addCurrentDevice()
        .then(() => {
          setIsBinding(false);
        })
        .catch((e) => {
          setBindError(e.message);
          setIsBinding(false);
        });
    } else {
      setBindError('Достигнут лимит устройств. Отвяжите одно из устройств, чтобы продолжить.');
    }
  }, [seatId, user?.id, loading, currentDeviceId, canAddDevice, addCurrentDevice, updateLastActive, hasEmail]);

  return {
    isBinding,
    bindError,
    isDeviceBound: !!currentDevice,
    ...seatDevices,
  };
}

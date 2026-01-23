import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sendVerificationCode } from '@/lib/emailService';
import {
  type LicenseDevice,
  type LicenseDeviceStatus,
  type TrustLevel,
  type TrustConfig,
  type UnbindCheckResult,
  type UnbindRequestResult,
  type DeviceUnbindHistory,
  type LicenseEmailBinding,
  TRUST_CONFIGS,
  TRUST_THRESHOLDS,
  getUnbindLimitResetDate,
} from '@/types/license-device';

const STORAGE_KEY = 'waves_license_devices';
const BINDING_STORAGE_KEY = 'waves_license_email_binding';
const UNBIND_HISTORY_KEY = 'waves_unbind_history';

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

export interface UseLicenseDevicesOptions {
  licenseId: string;
}

export function useLicenseDevices({ licenseId }: UseLicenseDevicesOptions) {
  const { user } = useAuth();

  // Состояние
  const [devices, setDevices] = useState<LicenseDevice[]>([]);
  const [binding, setBinding] = useState<LicenseEmailBinding | null>(null);
  const [unbindHistory, setUnbindHistory] = useState<DeviceUnbindHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Для процесса отвязки
  const [pendingUnbindCode, setPendingUnbindCode] = useState<string | null>(null);
  const [pendingUnbindDeviceId, setPendingUnbindDeviceId] = useState<string | null>(null);

  // Загрузка данных из localStorage (mock)
  useEffect(() => {
    if (!user?.id || !licenseId) {
      setDevices([]);
      setBinding(null);
      setLoading(false);
      return;
    }

    try {
      // Загружаем устройства
      const storedDevices = localStorage.getItem(`${STORAGE_KEY}_${licenseId}`);
      if (storedDevices) {
        setDevices(JSON.parse(storedDevices));
      }

      // Загружаем binding
      const storedBinding = localStorage.getItem(`${BINDING_STORAGE_KEY}_${licenseId}`);
      if (storedBinding) {
        setBinding(JSON.parse(storedBinding));
      } else if (user.email) {
        // Создаём новый binding при первом входе
        const newBinding: LicenseEmailBinding = {
          license_id: licenseId,
          email: user.email,
          email_verified: true, // Предполагаем, что email уже верифицирован при регистрации
          bound_at: new Date().toISOString(),
          trust_level: 'new',
          trust_level_updated_at: new Date().toISOString(),
          total_unbinds_count: 0,
          consecutive_limit_hits: 0,
          recent_regions: [],
        };
        setBinding(newBinding);
        localStorage.setItem(`${BINDING_STORAGE_KEY}_${licenseId}`, JSON.stringify(newBinding));
      }

      // Загружаем историю отвязок
      const storedHistory = localStorage.getItem(`${UNBIND_HISTORY_KEY}_${licenseId}`);
      if (storedHistory) {
        setUnbindHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Error loading license devices:', e);
      setError(e instanceof Error ? e : new Error('Failed to load devices'));
    }

    setLoading(false);
  }, [user?.id, user?.email, licenseId]);

  // Сохранение устройств
  const saveDevices = useCallback((newDevices: LicenseDevice[]) => {
    if (!licenseId) return;
    localStorage.setItem(`${STORAGE_KEY}_${licenseId}`, JSON.stringify(newDevices));
    setDevices(newDevices);
  }, [licenseId]);

  // Сохранение binding
  const saveBinding = useCallback((newBinding: LicenseEmailBinding) => {
    if (!licenseId) return;
    localStorage.setItem(`${BINDING_STORAGE_KEY}_${licenseId}`, JSON.stringify(newBinding));
    setBinding(newBinding);
  }, [licenseId]);

  // Сохранение истории
  const saveHistory = useCallback((newHistory: DeviceUnbindHistory[]) => {
    if (!licenseId) return;
    localStorage.setItem(`${UNBIND_HISTORY_KEY}_${licenseId}`, JSON.stringify(newHistory));
    setUnbindHistory(newHistory);
  }, [licenseId]);

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

  // Добавить текущее устройство
  const addCurrentDevice = useCallback(async (): Promise<LicenseDevice> => {
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

    const newDevice: LicenseDevice = {
      id: `ld_${Date.now()}`,
      license_id: licenseId,
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
  }, [canAddDevice, devices, licenseId, saveDevices]);

  // Проверка возможности отвязки
  const checkCanUnbind = useCallback((deviceId: string): UnbindCheckResult => {
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
  }, [devices, activeDevices.length, unbindsLast30Days, trustConfig.unbindsPerMonth, unbindHistory]);

  // Запросить отвязку (отправляет код на email)
  const requestUnbind = useCallback(async (deviceId: string): Promise<UnbindRequestResult> => {
    const checkResult = checkCanUnbind(deviceId);

    if (!checkResult.canUnbind) {
      return {
        success: false,
        error: checkResult.reason === 'limit_reached'
          ? 'Достигнут лимит отвязок в этом месяце'
          : checkResult.reason === 'last_device'
            ? 'Нельзя отвязать последнее устройство'
            : 'Устройство уже в процессе отвязки',
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
          status: 'pending_unbind' as LicenseDeviceStatus,
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
          status: 'active' as LicenseDeviceStatus,
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
        ? { ...d, status: 'unbound' as LicenseDeviceStatus }
        : d
    );
    saveDevices(updatedDevices);

    // Добавляем в историю
    const historyEntry: DeviceUnbindHistory = {
      id: `uh_${Date.now()}`,
      license_id: licenseId,
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
  }, [devices, licenseId, unbindHistory, binding, unbindsLast30Days, trustConfig.unbindsPerMonth, saveDevices, saveHistory, saveBinding]);

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
          return { ...d, status: 'unbound' as LicenseDeviceStatus };
        }
        return d;
      });
      saveDevices(updatedDevices);

      // Добавляем в историю
      const newHistoryEntries: DeviceUnbindHistory[] = expiredPendingDevices.map(d => ({
        id: `uh_${Date.now()}_${d.id}`,
        license_id: licenseId,
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
  }, [loading, devices, licenseId, unbindHistory, binding, saveDevices, saveHistory, saveBinding]);

  // Сброс для тестирования
  const resetAll = useCallback(() => {
    if (!licenseId) return;
    localStorage.removeItem(`${STORAGE_KEY}_${licenseId}`);
    localStorage.removeItem(`${BINDING_STORAGE_KEY}_${licenseId}`);
    localStorage.removeItem(`${UNBIND_HISTORY_KEY}_${licenseId}`);
    setDevices([]);
    setBinding(null);
    setUnbindHistory([]);
  }, [licenseId]);

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

    // Для тестирования
    resetAll,
    _mockCode: pendingUnbindCode, // Только для разработки!
  };
}

// Хук для автоматической привязки текущего устройства при входе
export function useAutoBindDevice(licenseId: string | undefined) {
  const { user } = useAuth();
  const [isBinding, setIsBinding] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);
  const hasAttemptedBind = useRef(false);
  const hasUpdatedActivity = useRef(false);

  const licenseDevices = useLicenseDevices({
    licenseId: licenseId || '',
  });

  const { currentDevice, canAddDevice, addCurrentDevice, updateLastActive, loading } = licenseDevices;

  // Стабильная проверка наличия текущего устройства (по ID, а не по reference)
  const currentDeviceId = currentDevice?.id;

  useEffect(() => {
    if (!licenseId || !user?.id || loading) return;

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
  }, [licenseId, user?.id, loading, currentDeviceId, canAddDevice, addCurrentDevice, updateLastActive]);

  return {
    isBinding,
    bindError,
    isDeviceBound: !!currentDevice,
    ...licenseDevices,
  };
}

/**
 * React Hook for Push Notifications
 *
 * Provides easy-to-use interface for managing push notification subscriptions
 * with loading states, error handling, and reactive permission tracking.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  isIOS,
  isRunningAsPWA,
  isIOSPushSupported,
  getNotificationPermission,
  isSubscribedToPush,
  setupPushNotifications,
  unsubscribeFromPush,
  initializePushNotifications,
} from '@/lib/push-notifications';

export type PushStatus =
  | 'loading'           // Checking status
  | 'unsupported'       // Browser doesn't support push
  | 'ios-not-installed' // iOS but PWA not installed
  | 'permission-denied' // User denied permission
  | 'not-subscribed'    // Can subscribe but hasn't yet
  | 'subscribed'        // Currently subscribed
  | 'error';            // Something went wrong

export interface UsePushNotificationsReturn {
  /** Current status of push notifications */
  status: PushStatus;

  /** Whether push is supported in this browser */
  isSupported: boolean;

  /** Whether user is currently subscribed */
  isSubscribed: boolean;

  /** Whether an operation is in progress */
  isLoading: boolean;

  /** Error message if any */
  error: string | null;

  /** Is this an iOS device */
  isIOSDevice: boolean;

  /** Is running as installed PWA */
  isPWAInstalled: boolean;

  /** Subscribe to push notifications (will prompt for permission if needed) */
  subscribe: () => Promise<boolean>;

  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;

  /** Refresh status */
  refresh: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIOSDevice = isIOS();
  const isPWAInstalled = isRunningAsPWA();
  const isSupported = isPushSupported() && (!isIOSDevice || isIOSPushSupported());

  /**
   * Check and update current status
   */
  const checkStatus = useCallback(async () => {
    if (!isPushSupported()) {
      setStatus('unsupported');
      return;
    }

    if (isIOSDevice && !isIOSPushSupported()) {
      setStatus('unsupported');
      return;
    }

    if (isIOSDevice && !isPWAInstalled) {
      setStatus('ios-not-installed');
      return;
    }

    const permission = getNotificationPermission();

    if (permission === 'denied') {
      setStatus('permission-denied');
      return;
    }

    try {
      const subscribed = await isSubscribedToPush();
      setStatus(subscribed ? 'subscribed' : 'not-subscribed');
    } catch (err) {
      console.error('Error checking push status:', err);
      setStatus('error');
    }
  }, [isIOSDevice, isPWAInstalled]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    const init = async () => {
      await initializePushNotifications();
      await checkStatus();
    };
    init();
  }, [checkStatus]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await setupPushNotifications();

      switch (result) {
        case 'granted':
          setStatus('subscribed');
          return true;

        case 'denied':
          setStatus('permission-denied');
          setError('Вы отклонили разрешение на уведомления. Чтобы включить их, измените настройки в браузере.');
          return false;

        case 'unsupported':
          setStatus('unsupported');
          setError('Ваш браузер не поддерживает push-уведомления.');
          return false;

        case 'ios-not-pwa':
          setStatus('ios-not-installed');
          setError('На iOS сначала добавьте приложение на главный экран.');
          return false;

        case 'no-vapid':
          setStatus('error');
          setError('Push-уведомления не настроены на сервере.');
          return false;

        case 'error':
        default:
          setStatus('error');
          setError('Не удалось подписаться на уведомления. Попробуйте позже.');
          return false;
      }
    } catch (err) {
      console.error('Subscribe error:', err);
      setStatus('error');
      setError('Произошла ошибка при подписке на уведомления.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await unsubscribeFromPush();

      if (success) {
        setStatus('not-subscribed');
        return true;
      } else {
        setError('Не удалось отписаться от уведомлений.');
        return false;
      }
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError('Произошла ошибка при отписке от уведомлений.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh status
   */
  const refresh = useCallback(async () => {
    setStatus('loading');
    await checkStatus();
  }, [checkStatus]);

  return {
    status,
    isSupported,
    isSubscribed: status === 'subscribed',
    isLoading: status === 'loading' || isLoading,
    error,
    isIOSDevice,
    isPWAInstalled,
    subscribe,
    unsubscribe,
    refresh,
  };
}

export default usePushNotifications;

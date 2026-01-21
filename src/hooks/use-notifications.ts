/**
 * Хук для браузерных уведомлений и звуковых оповещений
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

// Создаём звук уведомления через Web Audio API
function createNotificationSound(): () => void {
  return () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      // Игнорируем ошибки (например, если AudioContext недоступен)
    }
  };
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const playSoundRef = useRef<() => void>(createNotificationSound());

  // Инициализация
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Запрос разрешения на уведомления
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Браузер не поддерживает уведомления');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Ошибка запроса разрешения:', error);
      return false;
    }
  }, []);

  // Воспроизведение звука
  const playSound = useCallback(() => {
    playSoundRef.current();
  }, []);

  // Показать уведомление
  const showNotification = useCallback((options: NotificationOptions) => {
    // Воспроизводим звук в любом случае
    playSound();

    // Показываем браузерное уведомление только если вкладка не активна
    if (document.hidden && permission === 'granted') {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
      });

      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          notification.close();
          options.onClick?.();
        };
      }

      // Автоматически закрываем через 5 секунд
      setTimeout(() => notification.close(), 5000);
    }
  }, [permission, playSound]);

  // Уведомление о новом сообщении
  const notifyNewMessage = useCallback((senderName: string, messagePreview: string, onClick?: () => void) => {
    showNotification({
      title: `Новое сообщение от ${senderName}`,
      body: messagePreview.length > 100 ? messagePreview.slice(0, 100) + '...' : messagePreview,
      tag: 'new-message',
      onClick,
    });
  }, [showNotification]);

  return {
    permission,
    requestPermission,
    playSound,
    showNotification,
    notifyNewMessage,
    isSupported: 'Notification' in window,
  };
}

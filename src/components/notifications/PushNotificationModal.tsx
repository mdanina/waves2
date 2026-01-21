/**
 * Push Notification Modal
 *
 * Modal that prompts users to enable push notifications
 * Typically shown after booking a free consultation
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, MessageSquare, Clock, AlertCircle, Smartphone } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const STORAGE_KEY = 'push_notification_modal_dismissed';

interface PushNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PushNotificationModal({
  open,
  onOpenChange,
  onSuccess
}: PushNotificationModalProps) {
  const {
    status,
    isSupported,
    isIOSDevice,
    isPWAInstalled,
    subscribe,
    isLoading,
    error
  } = usePushNotifications();

  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const handleEnable = async () => {
    setSubscribeError(null);
    const success = await subscribe();

    if (success) {
      // Mark as dismissed so we don't show again
      localStorage.setItem(STORAGE_KEY, 'enabled');
      onOpenChange(false);
      onSuccess?.();
    } else if (error) {
      setSubscribeError(error);
    }
  };

  const handleLater = () => {
    // Mark as dismissed
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    onOpenChange(false);
  };

  // Show iOS-specific message if needed
  const showIOSMessage = isIOSDevice && !isPWAInstalled;

  // Don't show if already subscribed
  if (status === 'subscribed') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Включить уведомления?
          </DialogTitle>
          <DialogDescription className="text-center">
            Чтобы не пропустить важные события, включите push-уведомления
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits list */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-sage-pale flex items-center justify-center">
                <Clock className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="font-medium text-sm">Напоминания о сессиях</p>
                <p className="text-xs text-muted-foreground">
                  Получайте уведомления за 36 часов и за 1 час до встречи
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-lavender-pale flex items-center justify-center">
                <Calendar className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-sm">Когда специалист ждёт</p>
                <p className="text-xs text-muted-foreground">
                  Узнайте мгновенно, когда специалист уже в комнате
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-lilac-pale flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-lilac" />
              </div>
              <div>
                <p className="font-medium text-sm">Новые сообщения</p>
                <p className="text-xs text-muted-foreground">
                  Не пропустите важные сообщения от специалиста
                </p>
              </div>
            </div>
          </div>

          {/* iOS warning */}
          {showIOSMessage && (
            <div className="flex items-start gap-3 p-3 bg-honey-pale rounded-lg border border-honey">
              <Smartphone className="h-5 w-5 text-honey-dark flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Для iOS</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Сначала добавьте приложение на главный экран: нажмите
                  <span className="inline-block mx-1">
                    <svg className="inline h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V13a1 1 0 11-2 0V6.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" />
                      <path d="M3 14a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                    </svg>
                  </span>
                  → «На экран Домой»
                </p>
              </div>
            </div>
          )}

          {/* Not supported warning */}
          {!isSupported && !showIOSMessage && (
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                Ваш браузер не поддерживает push-уведомления. Попробуйте Chrome, Firefox или Safari.
              </div>
            </div>
          )}

          {/* Error message */}
          {subscribeError && (
            <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">{subscribeError}</div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleEnable}
            disabled={isLoading || !isSupported || showIOSMessage}
            className="w-full"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
                Подключаем...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Включить уведомления
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleLater}
            disabled={isLoading}
            className="w-full text-muted-foreground"
          >
            Может быть позже
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Check if we should show the push notification modal
 * Returns false if user has already dismissed or enabled
 */
export function shouldShowPushModal(): boolean {
  // Check if already subscribed or dismissed
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'enabled' || stored === 'dismissed') {
    return false;
  }
  return true;
}

export default PushNotificationModal;

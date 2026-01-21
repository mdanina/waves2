/**
 * Push Notification Settings Component
 *
 * Allows users to enable/disable push notifications with
 * proper handling for different platforms (iOS, Android, Desktop).
 */

import { Bell, BellOff, Smartphone, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationSettings() {
  const {
    status,
    isSupported,
    isSubscribed,
    isLoading,
    error,
    isIOSDevice,
    isPWAInstalled,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  // iOS not installed as PWA - show installation instructions
  if (status === 'ios-not-installed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push-уведомления
          </CardTitle>
          <CardDescription>
            Получайте уведомления о новых сообщениях и записях
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Установите приложение на iPhone</p>
              <p className="text-sm text-muted-foreground mb-3">
                Чтобы получать push-уведомления на iOS, сначала добавьте Balansity на главный экран:
              </p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>Нажмите кнопку «Поделиться» внизу Safari</li>
                <li>Выберите «На экран Домой»</li>
                <li>Нажмите «Добавить»</li>
                <li>Откройте приложение с главного экрана</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Not supported
  if (status === 'unsupported') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push-уведомления
          </CardTitle>
          <CardDescription>
            Получайте уведомления о новых сообщениях и записях
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ваш браузер не поддерживает push-уведомления.
              {isIOSDevice && (
                <span className="block mt-1">
                  Для iOS требуется версия 16.4 или новее.
                </span>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Permission denied
  if (status === 'permission-denied') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push-уведомления
          </CardTitle>
          <CardDescription>
            Получайте уведомления о новых сообщениях и записях
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Уведомления заблокированы</p>
              <p className="text-sm text-muted-foreground">
                Вы ранее отклонили разрешение на уведомления.
                Чтобы включить их, измените настройки в браузере или в настройках сайта.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-success" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          Push-уведомления
        </CardTitle>
        <CardDescription>
          Получайте уведомления о новых сообщениях и записях
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-toggle" className="text-base">
              Включить уведомления
            </Label>
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? 'Вы будете получать уведомления на это устройство'
                : 'Разрешите уведомления, чтобы не пропустить важные сообщения'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="push-toggle"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Status indicator */}
        {isSubscribed && (
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            Уведомления включены
          </div>
        )}

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* iOS hint about PWA */}
        {isIOSDevice && isPWAInstalled && !isSubscribed && (
          <p className="text-xs text-muted-foreground">
            Вы используете Balansity как приложение. Включите уведомления, чтобы получать оповещения.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for inline use (e.g., in a settings list)
 */
export function PushNotificationToggle() {
  const {
    status,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  // Don't show if not supported or iOS not installed
  if (status === 'unsupported' || status === 'ios-not-installed' || status === 'permission-denied') {
    return null;
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="h-5 w-5 text-success" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">Push-уведомления</p>
          <p className="text-xs text-muted-foreground">
            {isSubscribed ? 'Включены' : 'Выключены'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

export default PushNotificationSettings;

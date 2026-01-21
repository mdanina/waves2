/**
 * Telegram Notification Settings Component
 *
 * Allows users to link/unlink their Telegram account
 * for receiving notifications via Telegram bot.
 * Features QR code and countdown timer for linking.
 */

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Link2, Link2Off, Loader2, AlertCircle, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTelegramLink } from '@/hooks/useTelegramLink';

export function TelegramNotificationSettings() {
  const {
    status,
    linkToken,
    isLoading,
    error,
    generateToken,
    unlink,
    toggleNotifications,
    getDeepLink,
    getQRCodeUrl,
    refreshStatus,
  } = useTelegramLink();

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showLinkingUI, setShowLinkingUI] = useState(false);

  // Countdown timer for token expiration
  useEffect(() => {
    if (!linkToken) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((linkToken.expiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setShowLinkingUI(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [linkToken]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartLinking = async () => {
    const token = await generateToken();
    if (token) {
      setShowLinkingUI(true);
    }
  };

  const handleRefreshToken = async () => {
    await generateToken();
  };

  const handleUnlink = async () => {
    const success = await unlink();
    if (success) {
      setShowLinkingUI(false);
    }
  };

  const handleToggleNotifications = async () => {
    await toggleNotifications(!status.isActive);
  };

  // Periodically check if link was established
  useEffect(() => {
    if (!showLinkingUI || !linkToken) return;

    const checkInterval = setInterval(async () => {
      await refreshStatus();
    }, 3000); // Check every 3 seconds

    return () => clearInterval(checkInterval);
  }, [showLinkingUI, linkToken, refreshStatus]);

  // Auto-hide linking UI when linked
  useEffect(() => {
    if (status.isLinked && showLinkingUI) {
      setShowLinkingUI(false);
    }
  }, [status.isLinked, showLinkingUI]);

  // Already linked - show status and controls
  if (status.isLinked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#0088cc]" />
            Telegram
          </CardTitle>
          <CardDescription>
            Получайте уведомления о консультациях в Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Подключён
              {status.telegramUsername && (
                <span className="text-muted-foreground ml-1">@{status.telegramUsername}</span>
              )}
              {!status.telegramUsername && status.telegramFirstName && (
                <span className="text-muted-foreground ml-1">({status.telegramFirstName})</span>
              )}
            </span>
          </div>

          {/* Toggle notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tg-toggle" className="text-base">
                Уведомления включены
              </Label>
              <p className="text-sm text-muted-foreground">
                {status.isActive
                  ? 'Вы будете получать уведомления в Telegram'
                  : 'Уведомления приостановлены'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Switch
                id="tg-toggle"
                checked={status.isActive}
                onCheckedChange={handleToggleNotifications}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Unlink button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnlink}
            disabled={isLoading}
            className="text-muted-foreground"
          >
            <Link2Off className="h-4 w-4 mr-2" />
            Отключить Telegram
          </Button>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Not linked - show linking UI or button to start
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Telegram
        </CardTitle>
        <CardDescription>
          Получайте уведомления о консультациях в Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showLinkingUI ? (
          <>
            {/* Benefits */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Подключите Telegram, чтобы получать:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Напоминания о консультациях</li>
                <li>Ссылки на видеокомнаты</li>
                <li>Уведомления о новых сообщениях</li>
              </ul>
            </div>

            <Button onClick={handleStartLinking} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Подключение...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Подключить Telegram
                </>
              )}
            </Button>
          </>
        ) : linkToken ? (
          <>
            {/* QR Code and instructions */}
            <div className="text-center space-y-4">
              <p className="text-sm font-medium">
                Отсканируйте QR-код или перейдите{' '}
                <a
                  href={getDeepLink(linkToken.token, linkToken.botUsername)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  по ссылке
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <img
                    src={getQRCodeUrl(getDeepLink(linkToken.token, linkToken.botUsername), 200)}
                    alt="QR-код для подключения Telegram"
                    width={200}
                    height={200}
                    className="block"
                  />
                </div>
              </div>

              {/* Warning */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Не передавайте ссылку и QR-код третьим лицам.
                </AlertDescription>
              </Alert>

              {/* Timer */}
              <div className="text-sm text-muted-foreground">
                Деактивируем ссылку и QR-код через{' '}
                <span className="font-mono font-medium text-foreground">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Refresh button */}
              {timeRemaining < 60 && (
                <Button variant="outline" size="sm" onClick={handleRefreshToken} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Обновить код
                </Button>
              )}

              {/* Cancel button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkingUI(false)}
                className="text-muted-foreground"
              >
                Отмена
              </Button>
            </div>
          </>
        ) : null}

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default TelegramNotificationSettings;

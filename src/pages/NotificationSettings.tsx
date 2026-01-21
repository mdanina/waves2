/**
 * Notification Settings Page
 *
 * Allows users to manage their notification preferences
 * including Push notifications and Telegram integration.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { PushNotificationSettings } from '@/components/settings/PushNotificationSettings';
import { TelegramNotificationSettings } from '@/components/settings/TelegramNotificationSettings';

export default function NotificationSettings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Back button and title */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Уведомления</h1>
              <p className="text-muted-foreground">
                Настройте способы получения уведомлений
              </p>
            </div>
          </div>
        </div>

        {/* Settings cards */}
        <div className="space-y-6">
          {/* Push notifications */}
          <PushNotificationSettings />

          {/* Telegram notifications */}
          <TelegramNotificationSettings />
        </div>

        {/* Info section */}
        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="font-medium text-foreground mb-2">О чём мы уведомляем</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Напоминания о консультациях за 36 часов и за 1 час</li>
            <li>• Когда специалист ждёт вас в видеокомнате</li>
            <li>• Новые сообщения от специалиста</li>
            <li>• Важные обновления по вашим записям</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

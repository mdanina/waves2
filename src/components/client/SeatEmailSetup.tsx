import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Alert } from '@/components/design-system/Alert';
import { useSeatDevices } from '@/hooks/useSeatDevices';
import { useAuth } from '@/contexts/AuthContext';
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Smartphone,
  HelpCircle,
} from 'lucide-react';

interface SeatEmailSetupProps {
  seatId: string;
  profileName?: string;
  profileType?: 'parent' | 'child';
  className?: string;
  onEmailSet?: (email: string) => void;
}

export function SeatEmailSetup({
  seatId,
  profileName,
  profileType,
  className,
  onEmailSet,
}: SeatEmailSetupProps) {
  const { user } = useAuth();
  const { binding, hasEmail, setEmail, verifyEmail } = useSeatDevices({ seatId });

  const [inputEmail, setInputEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Предлагаем email пользователя по умолчанию
  const suggestedEmail = user?.email || '';

  const handleSetEmail = async () => {
    const emailToSet = inputEmail.trim().toLowerCase();

    if (!emailToSet) {
      setError('Введите email');
      return;
    }

    // Простая валидация email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToSet)) {
      setError('Введите корректный email');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await setEmail(emailToSet);

    if (result.success) {
      // Автоматически верифицируем (в реальности — через код на почту)
      await verifyEmail();
      onEmailSet?.(emailToSet);
    } else {
      setError(result.error || 'Ошибка при привязке email');
    }

    setIsSubmitting(false);
  };

  const handleUseSuggestedEmail = () => {
    setInputEmail(suggestedEmail);
  };

  // Если email уже привязан — показываем статус
  if (hasEmail && binding) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <Mail className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-green-900">Email для приложения</span>
              {binding.email_verified && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>
            <div className="text-green-700 truncate">{binding.email}</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Этот email используется для входа в мобильное приложение
          {profileName && ` (профиль: ${profileName})`}.
        </p>
      </div>
    );
  }

  // Форма для ввода email
  return (
    <div className={cn('space-y-4', className)}>
      {/* Объяснение */}
      <Alert
        variant="info"
        title="Укажите email для мобильного приложения"
        message={
          profileType === 'child'
            ? 'Этот email будет использоваться для входа ребёнка в мобильное приложение. Можно указать email ребёнка или ваш собственный.'
            : 'Этот email будет использоваться для входа в мобильное приложение и для подтверждения отвязки устройств.'
        }
        icon={<Smartphone className="w-5 h-5" />}
      />

      {/* Подсказка */}
      <button
        type="button"
        onClick={() => setShowHelp(!showHelp)}
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <HelpCircle className="w-4 h-4" />
        Зачем нужен email?
      </button>

      {showHelp && (
        <div className="p-4 bg-cloud/50 rounded-xl text-sm space-y-2">
          <p>
            <strong>Email нужен для:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Идентификации пользователя в мобильном приложении</li>
            <li>Загрузки личных данных и прогресса тренировок</li>
            <li>Получения кодов подтверждения при отвязке устройств</li>
            <li>Уведомлений о важных событиях</li>
          </ul>
          <p className="text-muted-foreground">
            У каждого участника лицензии (родителя и ребёнка) должен быть свой email.
            Email нельзя изменить после привязки.
          </p>
        </div>
      )}

      {/* Поле ввода */}
      <div className="space-y-3">
        <div>
          <label htmlFor={`email-${seatId}`} className="block text-sm font-medium mb-2">
            Email {profileName && `для ${profileName}`}
          </label>
          <input
            id={`email-${seatId}`}
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="example@mail.com"
            className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Предложение использовать email аккаунта */}
        {suggestedEmail && inputEmail !== suggestedEmail && (
          <button
            type="button"
            onClick={handleUseSuggestedEmail}
            className="text-sm text-primary hover:underline"
          >
            Использовать {suggestedEmail}
          </button>
        )}
      </div>

      {/* Ошибка */}
      {error && (
        <Alert
          variant="error"
          message={error}
          icon={<AlertCircle className="w-5 h-5" />}
          onClose={() => setError(null)}
        />
      )}

      {/* Кнопка */}
      <button
        onClick={handleSetEmail}
        disabled={isSubmitting || !inputEmail.trim()}
        className={cn(
          'w-full px-4 py-3 rounded-xl font-medium transition-colors',
          'bg-primary text-white hover:bg-primary/90',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isSubmitting ? 'Сохранение...' : 'Привязать email'}
      </button>

      {/* Предупреждение */}
      <p className="text-xs text-muted-foreground text-center">
        Email нельзя изменить после привязки
      </p>
    </div>
  );
}

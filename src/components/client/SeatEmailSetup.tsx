import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Alert } from '@/components/design-system/Alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
        <div className="rounded-2xl border-2 p-4 backdrop-blur-sm bg-gradient-to-r from-[rgba(255,138,91,0.2)] to-[rgba(255,138,91,0.1)] border-[rgba(255,138,91,0.3)]">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5 text-coral">
              {binding.email_verified ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1 text-[#1a1a1a]">Email для приложения</h4>
              <p className="text-sm text-[#1a1a1a]">{binding.email}</p>
            </div>
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
        variant="coral"
        title="Укажите email для мобильного приложения"
        message={
          profileType === 'child'
            ? 'Этот email будет использоваться для входа ребёнка в мобильное приложение. Можно указать email ребёнка или ваш собственный.'
            : 'Этот email будет использоваться для входа в мобильное приложение и для подтверждения отвязки устройств.'
        }
        icon={<Smartphone className="w-5 h-5" />}
      />

      {/* Подсказка */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowHelp(!showHelp)}
        className="h-auto p-0 text-sm text-primary hover:underline"
      >
        <HelpCircle className="w-4 h-4" />
        Зачем нужен email?
      </Button>

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
        <div className="space-y-2">
          <Label htmlFor={`email-${seatId}`}>
            Email {profileName && `для ${profileName}`}
          </Label>
          <Input
            id={`email-${seatId}`}
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="example@mail.com"
          />
        </div>
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
      <Button
        onClick={handleSetEmail}
        disabled={isSubmitting || !inputEmail.trim()}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? 'Сохранение...' : 'Привязать email'}
      </Button>

      {/* Предупреждение */}
      <p className="text-xs text-coral text-center font-medium">
        Email нельзя изменить после привязки
      </p>
    </div>
  );
}

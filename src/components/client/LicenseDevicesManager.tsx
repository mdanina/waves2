import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/design-system/Modal';
import { Alert } from '@/components/design-system/Alert';
import { useLicenseDevices } from '@/hooks/useLicenseDevices';
import {
  type LicenseDevice,
  TRUST_LEVEL_LABELS,
  TRUST_LEVEL_DESCRIPTIONS,
  formatTimeRemaining,
} from '@/types/license-device';
import {
  Smartphone,
  Tablet,
  Monitor,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

// Иконки устройств (вынесены из компонента для оптимизации)
function DeviceIcon({ type }: { type: LicenseDevice['device_type'] }) {
  switch (type) {
    case 'mobile':
      return <Smartphone className="w-5 h-5" />;
    case 'tablet':
      return <Tablet className="w-5 h-5" />;
    default:
      return <Monitor className="w-5 h-5" />;
  }
}

// Иконка Trust Level
function TrustIcon({ level }: { level: string | undefined }) {
  switch (level) {
    case 'trusted':
      return <ShieldCheck className="w-4 h-4 text-green-500" />;
    case 'standard':
      return <Shield className="w-4 h-4 text-blue-500" />;
    default:
      return <ShieldAlert className="w-4 h-4 text-amber-500" />;
  }
}

interface LicenseDevicesManagerProps {
  licenseId: string;
  className?: string;
}

export function LicenseDevicesManager({ licenseId, className }: LicenseDevicesManagerProps) {
  const {
    activeDevices,
    currentDevice,
    binding,
    trustConfig,
    unbindsRemaining,
    checkCanUnbind,
    requestUnbind,
    confirmUnbind,
    cancelUnbind,
    _mockCode,
  } = useLicenseDevices({ licenseId });

  // Состояние UI
  const [selectedDevice, setSelectedDevice] = useState<LicenseDevice | null>(null);
  const [showUnbindModal, setShowUnbindModal] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Защита от отрицательных значений
  const safeUnbindsRemaining = Math.max(0, unbindsRemaining);

  // Обработчик запроса отвязки
  const handleRequestUnbind = async (device: LicenseDevice) => {
    setError(null);
    setSelectedDevice(device);

    const check = checkCanUnbind(device.id);
    if (!check.canUnbind) {
      const errorMessages: Record<string, string> = {
        limit_reached: `Лимит отвязок исчерпан. Следующая отвязка будет доступна ${check.unbindsResetAt ? formatTimeRemaining(check.unbindsResetAt) : 'позже'}`,
        last_device: 'Нельзя отвязать последнее устройство',
        pending_unbind: 'Устройство уже в процессе отвязки',
        cooldown: `Подождите до окончания периода ожидания`,
      };
      setError(errorMessages[check.reason || ''] || 'Невозможно отвязать устройство');
      return;
    }

    setShowUnbindModal(true);
  };

  // Подтверждение намерения отвязать
  const handleConfirmIntent = async () => {
    if (!selectedDevice) return;

    setIsSubmitting(true);
    setError(null);

    const result = await requestUnbind(selectedDevice.id);

    if (result.success) {
      setShowUnbindModal(false);
      setShowCodeInput(true);
      setSuccessMessage('Код подтверждения отправлен на вашу почту');
    } else {
      setError(result.error || 'Ошибка при отправке кода');
    }

    setIsSubmitting(false);
  };

  // Подтверждение кодом
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await confirmUnbind(verificationCode);

    if (result.success) {
      setShowCodeInput(false);
      setVerificationCode('');
      setSelectedDevice(null);
      setSuccessMessage(`Устройство будет отвязано через ${trustConfig.cooldownHours} ч.`);
    } else {
      setError(result.error || 'Неверный код');
    }

    setIsSubmitting(false);
  };

  // Отмена отвязки
  const handleCancelUnbind = async (device: LicenseDevice) => {
    const success = await cancelUnbind(device.id);
    if (success) {
      setSuccessMessage('Отвязка отменена');
    }
  };

  // Закрытие модалок
  const handleCloseModals = () => {
    setShowUnbindModal(false);
    setShowCodeInput(false);
    setVerificationCode('');
    setSelectedDevice(null);
    setError(null);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Заголовок с Trust Level */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Привязанные устройства</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrustIcon level={binding?.trust_level} />
          <span>{TRUST_LEVEL_LABELS[binding?.trust_level || 'new']}</span>
        </div>
      </div>

      {/* Информация о лимитах */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-cloud/50 rounded-2xl p-4">
          <div className="text-2xl font-semibold">
            {activeDevices.length}/{trustConfig.maxDevices}
          </div>
          <div className="text-sm text-muted-foreground">Устройств</div>
        </div>
        <div className="bg-cloud/50 rounded-2xl p-4">
          <div className="text-2xl font-semibold">
            {safeUnbindsRemaining}/{trustConfig.unbindsPerMonth}
          </div>
          <div className="text-sm text-muted-foreground">Отвязок в месяц</div>
        </div>
      </div>

      {/* Trust Level описание */}
      <Alert
        variant="info"
        message={TRUST_LEVEL_DESCRIPTIONS[binding?.trust_level || 'new']}
        icon={<Info className="w-5 h-5" />}
      />

      {/* Уведомления */}
      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Список устройств */}
      <div className="space-y-3">
        {activeDevices.map((device) => {
          const isCurrent = currentDevice?.id === device.id;
          const isPending = device.status === 'pending_unbind';

          return (
            <div
              key={device.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors',
                isCurrent
                  ? 'border-primary/30 bg-primary/5'
                  : isPending
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-border bg-white'
              )}
            >
              {/* Иконка устройства */}
              <div className={cn(
                'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                isCurrent ? 'bg-primary/10 text-primary' : 'bg-cloud text-muted-foreground'
              )}>
                <DeviceIcon type={device.device_type} />
              </div>

              {/* Информация */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{device.device_name}</span>
                  {isCurrent && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Текущее
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isPending ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Clock className="w-3 h-3" />
                      Отвязка через {device.unbind_available_at && formatTimeRemaining(device.unbind_available_at)}
                    </span>
                  ) : (
                    <span>
                      Добавлено {new Date(device.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>

              {/* Действия */}
              <div className="flex-shrink-0">
                {isPending ? (
                  <button
                    onClick={() => handleCancelUnbind(device)}
                    className="p-2 rounded-xl text-amber-600 hover:bg-amber-100 transition-colors"
                    title="Отменить отвязку"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : !isCurrent ? (
                  <button
                    onClick={() => handleRequestUnbind(device)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Отвязать устройство"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          );
        })}

        {/* Пустые слоты */}
        {Array.from({ length: trustConfig.maxDevices - activeDevices.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-border/50"
          >
            <div className="w-12 h-12 rounded-xl bg-cloud/50 flex items-center justify-center text-muted-foreground/50">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-muted-foreground/50">Свободный слот</div>
          </div>
        ))}
      </div>

      {/* Подсказка */}
      <p className="text-sm text-muted-foreground">
        Устройства привязываются автоматически при входе в приложение.
        Для отвязки устройства потребуется подтверждение по email.
      </p>

      {/* Модалка подтверждения отвязки */}
      <Modal
        isOpen={showUnbindModal}
        onClose={handleCloseModals}
        title="Отвязать устройство?"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Вы уверены, что хотите отвязать устройство <strong>{selectedDevice?.device_name}</strong>?
          </p>

          <Alert
            variant="warning"
            message={`После подтверждения устройство будет отвязано через ${trustConfig.cooldownHours} часов. В течение этого времени вы сможете отменить отвязку.`}
            icon={<AlertTriangle className="w-5 h-5" />}
          />

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCloseModals}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-border hover:bg-cloud transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirmIntent}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Отправка...' : 'Отвязать'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Модалка ввода кода */}
      <Modal
        isOpen={showCodeInput}
        onClose={handleCloseModals}
        title="Введите код подтверждения"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Мы отправили 6-значный код на вашу почту <strong>{binding?.email}</strong>
          </p>

          {/* Mock код для разработки (только в DEV режиме) */}
          {import.meta.env.DEV && _mockCode && (
            <Alert
              variant="info"
              title="Тестовый режим"
              message={`Код подтверждения: ${_mockCode}`}
            />
          )}

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-2xl tracking-widest px-4 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none transition-colors"
            autoFocus
          />

          {error && (
            <Alert variant="error" message={error} />
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCloseModals}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-border hover:bg-cloud transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleVerifyCode}
              disabled={isSubmitting || verificationCode.length !== 6}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Проверка...' : 'Подтвердить'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

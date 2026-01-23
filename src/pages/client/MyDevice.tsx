import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SerifHeading } from '@/components/design-system/SerifHeading';
import {
  Circle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Smartphone,
  MapPin,
  Clock,
  Settings,
  AlertCircle,
  Sparkles,
  Wifi,
  Package,
} from 'lucide-react';
import { Uicon } from '@/components/icons/Uicon';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useDevice, useDeviceSetup } from '@/hooks/useDevice';
import {
  Device,
  DEVICE_STATUS_LABELS,
  DEVICE_STATUS_COLORS,
  DEVICE_SETUP_STEPS,
  DEVICE_FAQ,
} from '@/types/device';

export default function MyDevice() {
  const navigate = useNavigate();
  const {
    device,
    loading,
    orderDevice,
    updateStatus,
    resetDevice,
    hasDevice,
    isDelivered,
    isSetupComplete,
  } = useDevice();

  // Проверяем, есть ли лицензия
  // В useLicenses лицензии хранятся в состоянии, но можно проверить через sessionStorage
  // или просто показывать сообщение, если пользователь пришел со страницы лицензий
  const [hasLicense, setHasLicense] = useState(() => {
    // Проверяем флаг в sessionStorage, который устанавливается после покупки
    return sessionStorage.getItem('license_purchased') === 'true';
  });

  const {
    toggleStep,
    isStepComplete,
    progress: setupProgress,
    isAllComplete: isSetupAllComplete,
  } = useDeviceSetup();

  const [isOrdering, setIsOrdering] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    address: '',
    postal_code: '',
    comment: '',
  });

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderForm.full_name || !orderForm.phone || !orderForm.city || !orderForm.address) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsOrdering(true);
    try {
      await orderDevice({
        full_name: orderForm.full_name,
        phone: orderForm.phone,
        city: orderForm.city,
        address: orderForm.address,
        postal_code: orderForm.postal_code,
        comment: orderForm.comment || undefined,
      });
      toast.success('Заказ оформлен! Мы свяжемся с вами для подтверждения.');
      setShowOrderForm(false);
    } catch (error) {
      toast.error('Ошибка при оформлении заказа');
    } finally {
      setIsOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-8">
      {/* Заголовок */}
      <div className="mb-8">
        <SerifHeading size="2xl" className="mb-2">
          Моё устройство
        </SerifHeading>
      </div>

      {/* Состояние: Нет устройства */}
      {!hasDevice && !showOrderForm && (
        <Card className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border-0 p-6 sm:p-8">
          <div className="text-center max-w-md mx-auto">
            {hasLicense ? (
              <>
                <SerifHeading size="xl" className="mb-3">
                  Дооформите доставку устройства
                </SerifHeading>
                <p className="text-muted-foreground mb-6">
                  Вы приобрели лицензию с устройством. Теперь нужно указать адрес доставки, чтобы мы могли отправить вам устройство.
                </p>
                <Button
                  size="lg"
                  onClick={() => setShowOrderForm(true)}
                  className="bg-gradient-to-r from-coral to-coral-light hover:opacity-90"
                >
                  <Package className="h-5 w-5 mr-2" />
                  Указать адрес доставки
                </Button>
              </>
            ) : (
              <>
                <SerifHeading size="xl" className="mb-3">
                  У вас ещё нет устройства
                </SerifHeading>
                <p className="text-muted-foreground mb-6">
                  Устройство нейрофидбэка входит в состав лицензии.
                  Оформите заказ, и мы доставим его вам.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate('/cabinet/licenses')}
                  className="bg-gradient-to-r from-coral to-coral-light hover:opacity-90"
                >
                  <Package className="h-5 w-5 mr-2" />
                  Купить лицензию с устройством
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Форма заказа */}
      {!hasDevice && showOrderForm && (
        <Card className="glass-elegant border-2 p-6 sm:p-8">
          <div className="mb-6">
            <SerifHeading size="lg">Оформление заказа</SerifHeading>
          </div>

          <form onSubmit={handleOrderSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">ФИО получателя *</Label>
                <Input
                  id="full_name"
                  value={orderForm.full_name}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Иванов Иван Иванович"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={orderForm.phone}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 (999) 123-45-67"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Город *</Label>
                <Input
                  id="city"
                  value={orderForm.city}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Москва"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Индекс</Label>
                <Input
                  id="postal_code"
                  value={orderForm.postal_code}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="123456"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Адрес доставки *</Label>
              <Textarea
                id="address"
                value={orderForm.address}
                onChange={(e) => setOrderForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Улица, дом, квартира"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Комментарий к заказу</Label>
              <Textarea
                id="comment"
                value={orderForm.comment}
                onChange={(e) => setOrderForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Домофон, подъезд, время доставки..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={isOrdering}
                className="flex-1"
              >
                {isOrdering ? 'Оформление...' : 'Оформить заказ'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOrderForm(false)}
              >
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Устройство заказано - отслеживание */}
      {hasDevice && device && !isDelivered && (
        <div className="space-y-6">
          {/* Статус заказа */}
          <Card className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
            <div className="flex items-center justify-between mb-6">
              <SerifHeading size="lg">Статус заказа</SerifHeading>
              <Badge 
                className={cn(
                  (device.status === 'ordered' || device.status === 'shipped' || device.status === 'in_transit')
                    ? 'border-0 !from-transparent !to-transparent text-[#1a1a1a]'
                    : DEVICE_STATUS_COLORS[device.status]
                )}
                style={(device.status === 'ordered' || device.status === 'shipped' || device.status === 'in_transit') ? {
                  background: 'transparent',
                  backgroundImage: 'none',
                  border: 'none',
                  color: '#1a1a1a'
                } : undefined}
              >
                {DEVICE_STATUS_LABELS[device.status]}
              </Badge>
            </div>

            {/* Прогресс-бар доставки */}
            <DeliveryProgress device={device} />

            {/* Информация о доставке */}
            {device.tracking_number && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Uicon name="truck" style="rr" className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Отслеживание</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Номер отслеживания: <span className="font-mono">{device.tracking_number}</span>
                </p>
                {device.carrier === 'sdek' && (
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-auto mt-1 text-coral hover:text-coral"
                    onClick={() => window.open(`https://www.cdek.ru/track.html?order_id=${device.tracking_number}`, '_blank')}
                  >
                    Отследить на сайте СДЭК
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            )}

            {/* Адрес доставки */}
            {device.shipping_address && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Адрес доставки</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {device.shipping_address.full_name}<br />
                  {device.shipping_address.city}, {device.shipping_address.address}
                  {device.shipping_address.postal_code && `, ${device.shipping_address.postal_code}`}
                </p>
              </div>
            )}
          </Card>

          {/* FAQ на случай проблем */}
          <FAQSection />

          {/* DEBUG: Управление статусом */}
          {import.meta.env.DEV && (
            <DevModeControls device={device} updateStatus={updateStatus} resetDevice={resetDevice} />
          )}
        </div>
      )}

      {/* Устройство доставлено - настройка */}
      {hasDevice && device && isDelivered && !isSetupComplete && (
        <div className="space-y-6">
          {/* Поздравление с доставкой */}
          <Card className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{
                  background: 'linear-gradient(108deg, rgba(34, 197, 94, 0.25) 0%, rgba(34, 197, 94, 0.14) 100%)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <Uicon name="check-circle-2" style="rr" className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <SerifHeading size="lg">Устройство доставлено!</SerifHeading>
                <p className="text-muted-foreground">
                  Теперь настройте его, следуя чек-листу ниже
                </p>
              </div>
            </div>
          </Card>

          {/* Чек-лист настройки */}
          <Card className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
            <div className="flex items-center justify-between mb-6">
              <SerifHeading size="lg">Настройка устройства</SerifHeading>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-coral to-coral-light transition-all duration-500"
                    style={{ width: `${setupProgress.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {setupProgress.completed}/{setupProgress.total}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {DEVICE_SETUP_STEPS.map((step, index) => {
                const completed = isStepComplete(step.id);
                const isCurrent = !completed && index === setupProgress.completed;
                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl transition-all duration-200',
                      isCurrent && !completed && 'bg-white/50',
                      completed && 'opacity-60',
                      !completed && 'cursor-pointer hover:bg-white/50'
                    )}
                    onClick={() => !completed && toggleStep(step.id)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {completed ? (
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                          style={{
                            background: 'linear-gradient(108deg, rgba(34, 197, 94, 0.25) 0%, rgba(34, 197, 94, 0.14) 100%)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                          }}
                        >
                          <Uicon name="check-circle-2" style="rr" className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div 
                          className={cn(
                            'w-6 h-6 rounded-full border flex items-center justify-center transition-colors',
                            isCurrent && 'border-coral'
                          )}
                          style={{
                            background: isCurrent 
                              ? 'linear-gradient(108deg, rgba(255, 138, 91, 0.25) 0%, rgba(255, 138, 91, 0.14) 100%)'
                              : 'linear-gradient(108deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.14) 100%)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: isCurrent 
                              ? '1px solid rgba(255, 138, 91, 0.3)'
                              : '1px solid rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <span className="text-xs font-medium text-foreground">
                            {index + 1}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'transition-all',
                            completed && 'line-through text-muted-foreground'
                          )}>
                            {step.title}
                          </p>
                        </div>
                        {step.link && !completed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-coral hover:text-coral hover:bg-coral/10 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(step.link, '_blank');
                            }}
                          >
                            <span className="text-xs mr-1">{step.linkText || 'Открыть'}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isSetupAllComplete && (
              <div className="mt-6 pt-6 border-t border-border/50 text-center">
                <Button
                  onClick={() => updateStatus('setup_complete')}
                  className="bg-gradient-to-r from-success to-success/80"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Завершить настройку
                </Button>
              </div>
            )}
          </Card>

          {/* FAQ */}
          <FAQSection />

          {/* DEBUG */}
          {import.meta.env.DEV && (
            <DevModeControls device={device} updateStatus={updateStatus} resetDevice={resetDevice} />
          )}
        </div>
      )}

      {/* Устройство настроено - информация */}
      {hasDevice && device && isSetupComplete && (
        <div className="space-y-6">
          {/* Информация об устройстве */}
          <Card className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-coral/20 to-coral/10 flex items-center justify-center">
                <Wifi className="h-8 w-8 text-coral" />
              </div>
              <div>
                <SerifHeading size="lg">
                  {device.model === 'Waves Neurofeedback v1' ? 'Flex 4' : device.model}
                </SerifHeading>
                <Badge 
                  className="mt-1 text-xs text-green-600 border-0"
                  style={{ 
                    background: 'rgba(34, 197, 94, 0.2)',
                    backgroundImage: 'none'
                  }}
                >
                  <Uicon name="check-circle-2" style="rr" className="h-3 w-3 mr-1" />
                  Готово к работе
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Дата получения</p>
              <div className="flex items-center justify-between gap-4">
                {device.delivered_at ? (
                  <p className="text-sm">{new Date(device.delivered_at).toLocaleDateString('ru-RU')}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
                {device.serial_number ? (
                  <p className="font-mono text-sm text-foreground">{device.serial_number}</p>
                ) : (
                  <p className="font-mono text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </Card>

          {/* FAQ */}
          <FAQSection />

          {/* DEBUG */}
          {import.meta.env.DEV && (
            <DevModeControls device={device} updateStatus={updateStatus} resetDevice={resetDevice} />
          )}
        </div>
      )}
    </div>
  );
}

// Компонент прогресс-бара доставки
function DeliveryProgress({ device }: { device: Device }) {
  const steps = [
    { id: 'ordered', label: 'Заказ оформлен', iconName: 'box' },
    { id: 'shipped', label: 'Отправлено', iconName: 'envelope' },
    { id: 'in_transit', label: 'В пути', iconName: 'truck' },
    { id: 'delivered', label: 'Доставлено', iconName: 'check-circle-2' },
  ];

  const currentIndex = steps.findIndex(s => s.id === device.status);

  return (
    <div className="relative">
      {/* Линия прогресса */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#1a1a1a]/10">
        <div
          className="h-full bg-gradient-to-r from-coral to-coral-light transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Шаги */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isComplete = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isComplete
                    ? 'border-2 border-coral bg-white'
                    : 'border-2 border-[#1a1a1a]/20 bg-white'
                )}
              >
                <Uicon
                  name={step.iconName}
                  style="rr"
                  className={cn(
                    'h-5 w-5',
                    isComplete ? 'text-coral' : 'text-muted-foreground/50'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-xs mt-2 text-center max-w-[80px]',
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// FAQ секция
function FAQSection() {
  const categories = [
    { id: 'setup', label: 'Настройка' },
    { id: 'usage', label: 'Использование' },
    { id: 'troubleshooting', label: 'Устранение проблем' },
    { id: 'care', label: 'Уход' },
  ] as const;

  return (
    <Card className="glass-elegant border-2 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Uicon name="help-circle" style="rr" className="h-5 w-5 text-muted-foreground" />
        <SerifHeading size="lg">Частые вопросы</SerifHeading>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {DEVICE_FAQ.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="border border-border/50 rounded-lg px-4"
          >
            <AccordionTrigger className="text-left hover:no-underline py-4">
              <span className="text-sm font-medium">{item.question}</span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-6 pt-6 border-t border-border/50 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Не нашли ответ на свой вопрос?
        </p>
        <Button
          variant="outline"
          onClick={() => window.open('https://t.me/waves_support_bot', '_blank')}
        >
          <Uicon name="help-circle" style="rr" className="h-4 w-4 mr-2" />
          Написать в поддержку
        </Button>
      </div>
    </Card>
  );
}

// Dev-mode контролы для тестирования
function DevModeControls({
  device,
  updateStatus,
  resetDevice,
}: {
  device: Device;
  updateStatus: (status: Device['status']) => void;
  resetDevice: () => void;
}) {
  return (
    <Card className="border-2 border-dashed border-amber-300 bg-amber-50/50 p-4">
      <p className="text-xs font-medium text-amber-700 mb-3">DEV MODE</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={resetDevice}>
          → No Device
        </Button>
        <Button size="sm" variant="outline" onClick={() => updateStatus('ordered')}>
          → Ordered
        </Button>
        <Button size="sm" variant="outline" onClick={() => updateStatus('shipped')}>
          → Shipped
        </Button>
        <Button size="sm" variant="outline" onClick={() => updateStatus('in_transit')}>
          → In Transit
        </Button>
        <Button size="sm" variant="outline" onClick={() => updateStatus('delivered')}>
          → Delivered
        </Button>
        <Button size="sm" variant="outline" onClick={() => updateStatus('setup_complete')}>
          → Setup Complete
        </Button>
        <Button size="sm" variant="destructive" onClick={resetDevice}>
          Reset
        </Button>
      </div>
    </Card>
  );
}

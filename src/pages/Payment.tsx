import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppointment, useAppointmentType, useCreateAppointment } from "@/hooks/useAppointments";
import { usePackage } from "@/hooks/usePackages";
import { useCreatePayment, usePayment } from "@/hooks/usePayments";
import { formatAmount, verifyPaymentWithAPI } from "@/lib/payment";
import { formatAppointmentTime } from "@/lib/moscowTime";
import { Loader2, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

// Типы для виджета ЮKassa
declare global {
  interface Window {
    YooMoneyCheckoutWidget?: {
      new (config: {
        confirmation_token: string;
        error_callback: (error: any) => void;
        success_callback: () => void;
      }): {
        render: (elementId: string) => void;
        destroy: () => void;
      };
    };
  }
}

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");
  const packageId = searchParams.get("package_id");
  const type = searchParams.get("type"); // "appointment" или "package"
  const paymentId = searchParams.get("payment_id");
  
  // Новые параметры для создания записи после оплаты
  const appointmentTypeIdFromUrl = searchParams.get("appointment_type_id");
  const scheduledAtFromUrl = searchParams.get("scheduled_at");
  const profileIdFromUrl = searchParams.get("profile_id");
  const specialistIdFromUrl = searchParams.get("specialist_id");

  const { data: appointment } = useAppointment(appointmentId);
  // Используем appointment_type_id из существующей записи или из URL
  const appointmentTypeId = appointment?.appointment_type_id || appointmentTypeIdFromUrl;
  const { data: appointmentType } = useAppointmentType(appointmentTypeId || null);
  const { data: pkg } = usePackage(packageId);
  const { data: existingPayment } = usePayment(paymentId);
  const createPayment = useCreatePayment();
  const createAppointment = useCreateAppointment();

  const [isProcessing, setIsProcessing] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);
  const widgetRef = useRef<any>(null);

  // Определяем, что оплачиваем
  // Для консультаций: используем существующую запись или данные из URL
  const paymentItem = type === "appointment" 
    ? (appointment || (appointmentType && scheduledAtFromUrl ? { appointment_type_id: appointmentTypeId, scheduled_at: scheduledAtFromUrl } : null))
    : pkg;
  const amount = type === "appointment"
    ? appointmentType?.price || 0
    : pkg?.price || 0;

  // Загрузка скрипта виджета ЮKassa
  useEffect(() => {
    if (window.YooMoneyCheckoutWidget) {
      setWidgetLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js';
    script.async = true;
    script.onload = () => {
      setWidgetLoaded(true);
    };
    script.onerror = () => {
      toast.error('Не удалось загрузить виджет оплаты');
    };
    document.body.appendChild(script);

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.destroy();
        } catch (e) {
          // Игнорируем ошибки при уничтожении виджета
        }
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Инициализация виджета при получении confirmation_token
  useEffect(() => {
    if (!widgetLoaded || !confirmationToken || !window.YooMoneyCheckoutWidget) {
      return;
    }

    // Уничтожаем предыдущий виджет, если есть
    if (widgetRef.current) {
      try {
        widgetRef.current.destroy();
      } catch (e) {
        // Игнорируем ошибки
      }
    }

    try {
      const checkout = new window.YooMoneyCheckoutWidget!({
        confirmation_token: confirmationToken,
        error_callback: function (error: any) {
          console.error('YooKassa widget error:', error);
          toast.error('Ошибка при оплате: ' + (error.error || 'Неизвестная ошибка'));
        },
        success_callback: async function () {
          toast.success('Оплата успешно завершена!');
          
          // Получаем payment_id из URL или из созданного платежа
          const currentPaymentId = paymentId || (createPayment.data?.payment?.id);
          if (currentPaymentId) {
            try {
              await verifyPaymentWithAPI(currentPaymentId);
              
              // Если это консультация и нет appointment_id, создаем запись после оплаты
              if (type === "appointment") {
                if (appointmentId) {
                  // Существующая запись - просто переходим к подтверждению
                  navigate(`/appointments/confirmation?appointment_id=${appointmentId}&payment_id=${currentPaymentId}`);
                } else if (appointmentTypeId && scheduledAtFromUrl) {
                  // Новая запись - создаем после оплаты
                  try {
                    const newAppointment = await createAppointment.mutateAsync({
                      appointmentTypeId,
                      scheduledAt: scheduledAtFromUrl,
                      profileId: profileIdFromUrl || null,
                      specialistId: specialistIdFromUrl || null,
                    });
                    
                    // Связываем с платежом (обновление произойдет через webhook, но делаем и здесь для надежности)
                    navigate(`/appointments/confirmation?appointment_id=${newAppointment.id}&payment_id=${currentPaymentId}`);
                  } catch (error) {
                    console.error('Error creating appointment after payment:', error);
                    toast.error('Оплата прошла, но не удалось создать запись. Обратитесь в поддержку.');
                    // Все равно переходим к подтверждению, т.к. оплата прошла
                    navigate(`/appointments/confirmation?payment_id=${currentPaymentId}`);
                  }
                } else {
                  navigate(`/appointments/confirmation?payment_id=${currentPaymentId}`);
                }
              } else if (type === "package" && packageId) {
                navigate(`/appointments/confirmation?package_id=${packageId}&payment_id=${currentPaymentId}`);
              }
            } catch (error) {
              console.error('Error verifying payment:', error);
              toast.error('Ошибка при проверке платежа');
            }
          }
        },
      });

      widgetRef.current = checkout;
      checkout.render('payment-form');
    } catch (error) {
      console.error('Error initializing YooKassa widget:', error);
      toast.error('Ошибка при инициализации виджета оплаты');
    }
  }, [widgetLoaded, confirmationToken, paymentId, type, appointmentId, packageId, navigate, createPayment.data, appointmentTypeId, scheduledAtFromUrl, profileIdFromUrl, specialistIdFromUrl, createAppointment]);

  useEffect(() => {
    // Если есть существующий платеж и он завершен, перенаправляем на подтверждение
    if (existingPayment && existingPayment.status === "completed") {
      if (type === "appointment" && appointmentId) {
        navigate(`/appointments/confirmation?appointment_id=${appointmentId}`);
      } else if (type === "package" && packageId) {
        navigate(`/appointments/confirmation?package_id=${packageId}`);
      }
    }
  }, [existingPayment, type, appointmentId, packageId, navigate]);

  const handlePayment = async () => {
    if (!paymentItem) {
      toast.error("Не удалось определить детали заказа");
      return;
    }

    // Если консультация бесплатная, пропускаем оплату
    if (type === "appointment" && amount === 0) {
      // Для бесплатной консультации просто переходим к подтверждению
      if (appointmentId) {
        navigate(`/appointments/confirmation?appointment_id=${appointmentId}`);
      }
      return;
    }

    if (amount === 0) {
      toast.error("Не удалось определить сумму платежа");
      return;
    }

    setIsProcessing(true);

    try {
      // Создаем платеж
      // В metadata передаем либо appointment_id (для обратной совместимости),
      // либо данные для создания новой записи после оплаты
      const metadata: any = {
        type,
        package_id: packageId,
      };
      
      if (appointmentId) {
        // Обратная совместимость: если есть appointment_id
        metadata.appointment_id = appointmentId;
        metadata.appointment_type_id = appointmentType?.id;
      } else if (appointmentTypeId && scheduledAtFromUrl) {
        // Новый формат: передаем данные для создания записи после оплаты
        metadata.appointment_type_id = appointmentTypeId;
        metadata.scheduled_at = scheduledAtFromUrl;
        if (profileIdFromUrl) {
          metadata.profile_id = profileIdFromUrl;
        }
      }
      
      const result = await createPayment.mutateAsync({
        amount,
        currency: "RUB",
        paymentMethod: "yookassa",
        metadata,
      });

      // Если есть confirmation_token, показываем виджет
      if (result.paymentUrl) {
        // paymentUrl теперь содержит confirmation_token
        setConfirmationToken(result.paymentUrl);
        toast.success("Виджет оплаты загружается...");
      } else {
        toast.error("Не удалось получить данные для оплаты");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Ошибка при создании платежа");
    } finally {
      setIsProcessing(false);
    }
  };

  // Проверяем, есть ли данные для отображения
  const hasAppointmentData = type === "appointment" && (appointment || (appointmentType && scheduledAtFromUrl));
  const hasPackageData = type === "package" && pkg;
  
  const backgroundStyle = {
    background: 'var(--bg-golden-hour)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'
  };

  if (!hasAppointmentData && !hasPackageData) {
    return (
      <div className="min-h-screen bg-background" style={backgroundStyle}>
        <Header />
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {type === "appointment" ? "Консультация" : "Пакет"} не найден
            </p>
            <Button onClick={() => navigate("/cabinet")}>
              Вернуться в кабинет
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={backgroundStyle}>
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Оплата</h1>
          <p className="text-muted-foreground">
            Подтвердите детали и завершите оплату
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Детали заказа</h2>
          
          {type === "appointment" && appointmentType && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Тип консультации:</span>
                <span className="font-medium">{appointmentType.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Длительность:</span>
                <span className="font-medium">{appointmentType.duration_minutes} минут</span>
              </div>
              {(appointment?.scheduled_at || scheduledAtFromUrl) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Дата и время:</span>
                  <span className="font-medium">
                    {formatAppointmentTime(appointment?.scheduled_at || scheduledAtFromUrl!)}
                  </span>
                </div>
              )}
            </div>
          )}

          {type === "package" && pkg && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Пакет:</span>
                <span className="font-medium">{pkg.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Количество сессий:</span>
                <span className="font-medium">{pkg.session_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Тип консультации:</span>
                <span className="font-medium">{pkg.appointment_type?.name}</span>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Итого:</span>
            <span className="text-2xl font-bold text-primary">
              {formatAmount(amount)}
            </span>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Способ оплаты
          </h2>
          {confirmationToken ? (
            <div>
              <p className="text-muted-foreground mb-4">
                Оплата будет произведена через ЮKassa
              </p>
              <div id="payment-form" className="min-h-[400px]"></div>
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground">
                Оплата будет произведена через ЮKassa
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Нажмите кнопку "Оплатить" для начала оплаты
              </p>
            </div>
          )}
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || createPayment.isPending || !!confirmationToken}
            className="flex-1"
            size="lg"
          >
            {isProcessing || createPayment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Обработка...
              </>
            ) : amount === 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Подтвердить (бесплатно)
              </>
            ) : confirmationToken ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Виджет оплаты загружен
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Оплатить {formatAmount(amount)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


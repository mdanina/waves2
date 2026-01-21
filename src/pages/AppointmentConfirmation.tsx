import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppointment, useAppointmentType } from "@/hooks/useAppointments";
import { usePackagePurchase, usePackage } from "@/hooks/usePackages";
import { useProfiles } from "@/hooks/useProfiles";
import { CheckCircle2, Calendar, Clock, User } from "lucide-react";
import { formatAppointmentTime } from "@/lib/moscowTime";
import { Loader2 } from "lucide-react";
import { PushNotificationModal, shouldShowPushModal } from "@/components/notifications/PushNotificationModal";

export default function AppointmentConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");
  const packageId = searchParams.get("package_id");
  const paymentId = searchParams.get("payment_id");

  const { data: appointment, isLoading: appointmentLoading } = useAppointment(appointmentId);
  const appointmentTypeId = appointment?.appointment_type_id;
  const { data: appointmentType } = useAppointmentType(appointmentTypeId || null);
  const { data: packagePurchase, isLoading: packageLoading } = usePackagePurchase(packageId);
  const packageIdFromPurchase = packagePurchase?.package_id;
  const { data: pkg } = usePackage(packageIdFromPurchase || null);
  const { data: profiles } = useProfiles();

  // Push notification modal state
  const [showPushModal, setShowPushModal] = useState(false);

  const isLoading = appointmentLoading || packageLoading;

  // Check if this is a free consultation and show push notification modal
  useEffect(() => {
    // Only show for free consultations (price === 0)
    if (appointment && appointmentType && appointmentType.price === 0) {
      // Check if we should show the modal (not dismissed before)
      if (shouldShowPushModal()) {
        // Small delay to let the user see the success page first
        const timeout = setTimeout(() => {
          setShowPushModal(true);
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [appointment, appointmentType]);

  // Находим профиль по ID для отображения имени
  const profile = appointment?.profile_id 
    ? profiles?.find(p => p.id === appointment.profile_id)
    : null;
  
  const profileDisplayName = profile 
    ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`
    : appointment?.profile_id 
      ? null // Если профиль не найден, но ID есть
      : "Для меня (родитель)";

  useEffect(() => {
    // Если нет ни консультации, ни покупки пакета, перенаправляем
    // Но только если мы точно знаем, что данных нет (не в процессе загрузки)
    // И если есть appointment_id или package_id в URL - даем больше времени на загрузку
    if (!isLoading && !appointment && !packagePurchase) {
      // Если есть ID в URL, но данные еще не загрузились - даем еще немного времени
      if (appointmentId || packageId) {
        const timeout = setTimeout(() => {
          if (!appointment && !packagePurchase) {
            navigate("/cabinet");
          }
        }, 2000); // Даем 2 секунды на загрузку
        return () => clearTimeout(timeout);
      } else {
        // Если нет ID в URL - сразу перенаправляем
        navigate("/cabinet");
      }
    }
  }, [appointment, packagePurchase, isLoading, navigate, appointmentId, packageId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            {appointment ? "Консультация записана!" : "Пакет успешно приобретен!"}
          </h1>

          <p className="text-muted-foreground mb-8">
            {appointment
              ? "Ваша консультация успешно записана и оплачена"
              : "Ваш пакет сессий успешно приобретен"}
          </p>

          {/* Детали консультации */}
          {appointment && (
            <div className="mb-8 space-y-4 text-left bg-muted/50 p-6 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Дата и время</p>
                  <p className="font-medium">
                    {formatAppointmentTime(appointment.scheduled_at)}
                  </p>
                </div>
              </div>

              {appointmentType && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Тип консультации</p>
                    <p className="font-medium">
                      {appointmentType.name} ({appointmentType.duration_minutes} минут)
                    </p>
                  </div>
                </div>
              )}

              {profileDisplayName && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Для кого</p>
                    <p className="font-medium">{profileDisplayName}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Детали пакета */}
          {packagePurchase && pkg && (
            <div className="mb-8 space-y-4 text-left bg-muted/50 p-6 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Пакет</p>
                  <p className="font-medium">{pkg.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Оставшиеся сессии</p>
                  <p className="font-medium">{packagePurchase.sessions_remaining} сессий</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/cabinet")}
            >
              Вернуться в кабинет
            </Button>
            {appointment && (
              <Button onClick={() => navigate("/appointments")}>
                Записаться еще
              </Button>
            )}
            {packagePurchase && (
              <Button onClick={() => navigate("/packages")}>
                Посмотреть пакеты
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Push Notification Modal - shown after free consultation booking */}
      <PushNotificationModal
        open={showPushModal}
        onOpenChange={setShowPushModal}
      />
    </div>
  );
}


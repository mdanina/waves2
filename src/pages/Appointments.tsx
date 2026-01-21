import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
// import backgroundImage from "@/assets/bg.png"; // Temporarily using mesh gradient instead
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppointmentTypes, useActiveFreeConsultation, useCompletedFreeConsultation, useAppointmentsWithType, useCancelAppointment, useFreeConsultationExpiry, FREE_CONSULTATION_EXPIRY_DAYS } from "@/hooks/useAppointments";
import { useProfiles } from "@/hooks/useProfiles";
import { useAssessmentsForProfiles } from "@/hooks/useAssessments";
import { hasFreeConsultationAvailable } from "@/lib/appointmentStorage";
import { Video, Check, Gift, Lock, Calendar, Clock, User, X, AlertTriangle, MessageSquare } from "lucide-react";
import { formatAmount } from "@/lib/payment";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Appointments() {
  const navigate = useNavigate();
  const { data: appointmentTypes, isLoading } = useAppointmentTypes();
  const { data: activeFreeConsultation, isLoading: freeConsultationLoading } = useActiveFreeConsultation();
  const { data: completedFreeConsultation } = useCompletedFreeConsultation();
  const { data: expiryData, isLoading: expiryLoading } = useFreeConsultationExpiry();
  const { data: appointmentsWithType, isLoading: appointmentsLoading } = useAppointmentsWithType();
  const { data: profiles } = useProfiles();
  const cancelAppointment = useCancelAppointment();
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null);
  const [freeConsultationAvailable, setFreeConsultationAvailable] = useState<boolean>(false);

  // Получаем профили детей
  const childProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(p => p.type === 'child');
  }, [profiles]);

  // Получаем завершенные чекапы для всех детей
  const childProfileIds = useMemo(() => childProfiles.map(p => p.id), [childProfiles]);
  const { data: completedCheckups } = useAssessmentsForProfiles(childProfileIds, 'checkup');

  // Проверяем, есть ли хотя бы один завершенный чекап
  const hasCompletedCheckup = useMemo(() => {
    if (!completedCheckups) return false;
    return Object.values(completedCheckups).some(
      assessment => assessment?.status === 'completed'
    );
  }, [completedCheckups]);

  // Проверяем доступность бесплатной консультации (флаг не установлен)
  // Обновляем при изменении activeFreeConsultation или appointmentsWithType,
  // чтобы синхронизировать состояние после отмены консультации
  useEffect(() => {
    async function checkAvailability() {
      const available = await hasFreeConsultationAvailable();
      setFreeConsultationAvailable(available);
    }
    checkAvailability();
  }, [activeFreeConsultation, appointmentsWithType]);

  // Разделяем консультации на бесплатные и платные
  const { freeConsultations, paidConsultations } = useMemo(() => {
    if (!appointmentTypes) return { freeConsultations: [], paidConsultations: [] };
    
    const free = appointmentTypes.filter(type => type.price === 0);
    const paid = appointmentTypes.filter(type => type.price > 0);
    
    return { freeConsultations: free, paidConsultations: paid };
  }, [appointmentTypes]);

  // Проверяем, истек ли срок бесплатной консультации
  const isFreeConsultationExpired = expiryData?.expired ?? false;
  const daysLeftForFreeConsultation = expiryData?.daysLeft ?? null;

  // Фильтруем бесплатные консультации:
  // Показываем только если:
  // 1. Есть хотя бы один завершенный чекап
  // 2. Флаг free_consultation_created не установлен (консультация еще не использована)
  // 3. Нет активной бесплатной консультации (scheduled)
  // 4. Не истек срок (14 дней с момента завершения чекапа)
  const visibleFreeConsultations = useMemo(() => {
    if (!freeConsultations.length) return [];

    // Если есть активная бесплатная консультация - скрываем бесплатные из списка
    if (activeFreeConsultation) {
      return [];
    }

    // Если нет завершенного чекапа - не показываем
    if (!hasCompletedCheckup) {
      return [];
    }

    // Если флаг установлен (консультация уже использована) - не показываем
    if (!freeConsultationAvailable) {
      return [];
    }

    // Если истек срок (14 дней) - не показываем
    if (isFreeConsultationExpired) {
      return [];
    }

    return freeConsultations;
  }, [freeConsultations, activeFreeConsultation, hasCompletedCheckup, freeConsultationAvailable, isFreeConsultationExpired]);

  // Платные консультации доступны только если:
  // 1. Есть активная бесплатная консультация (scheduled/in_progress) - можно записаться параллельно
  // 2. ИЛИ бесплатная консультация уже завершена (completed)
  // Примечание: истечение срока НЕ разблокирует платные - нужно обратиться в поддержку
  const paidConsultationsEnabled = !!activeFreeConsultation || !!completedFreeConsultation;

  // Фильтруем предстоящие консультации (только scheduled)
  const upcomingAppointments = useMemo(() => {
    if (!appointmentsWithType) return [];
    return appointmentsWithType.filter(apt => apt.status === 'scheduled');
  }, [appointmentsWithType]);

  // Функция для получения имени профиля
  const getProfileName = (profileId: string | null) => {
    if (!profileId) return "Для меня (родитель)";
    const profile = profiles?.find(p => p.id === profileId);
    if (!profile) return "Профиль не найден";
    return `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`;
  };

  const handleConfirm = () => {
    if (selectedTypeId) {
      navigate(`/appointments/booking?type=${selectedTypeId}`);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment.mutateAsync(appointmentId);
      setCancelDialogOpen(null);
    } catch (error) {
      // Ошибка уже обработана в хуке через toast
    }
  };

  const backgroundStyle = {
    background: 'var(--bg-golden-hour)',
    backgroundAttachment: 'fixed'
  };

  if (isLoading || freeConsultationLoading || appointmentsLoading || expiryLoading) {
    return (
      <div className="min-h-screen bg-background" style={backgroundStyle}>
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={backgroundStyle}>
      <Header />
      
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Записаться на консультацию</h1>
          <p className="text-muted-foreground">Выберите тип консультации</p>
        </div>

        {/* Шаги */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              1
            </div>
            <span className="font-medium">Выберите тип консультации</span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
              2
            </div>
            <span>Выберите дату и время</span>
          </div>
        </div>

        {/* Типы консультаций */}
        {appointmentTypes && appointmentTypes.length > 0 ? (
          <RadioGroup value={selectedTypeId || undefined} onValueChange={setSelectedTypeId}>
            <div className="space-y-4 mb-8">
              {/* Предупреждение об истечении срока бесплатной консультации */}
              {hasCompletedCheckup && freeConsultationAvailable && !activeFreeConsultation && isFreeConsultationExpired && (
                <Card className="p-4 border-destructive bg-destructive/10">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">
                        Срок бесплатной консультации истёк
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Бесплатная 30-минутная консультация с координатором была доступна в течение {FREE_CONSULTATION_EXPIRY_DAYS} дней после завершения чекапа.
                        Для записи к специалисту, пожалуйста, свяжитесь с нашей поддержкой.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => navigate('/cabinet/messages')}
                      >
                        Написать в поддержку
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Бесплатные консультации */}
              {visibleFreeConsultations.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    Бесплатные консультации
                  </h2>
                  {/* Информация об оставшемся сроке */}
                  {daysLeftForFreeConsultation !== null && daysLeftForFreeConsultation > 0 && (
                    <Card className={`p-3 ${daysLeftForFreeConsultation <= 3 ? 'border-warning bg-warning/10' : 'border-muted bg-muted/50'}`}>
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${daysLeftForFreeConsultation <= 3 ? 'text-warning' : 'text-muted-foreground'}`} />
                        <p className={`text-sm ${daysLeftForFreeConsultation <= 3 ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                          {daysLeftForFreeConsultation <= 3
                            ? `Осталось ${daysLeftForFreeConsultation} ${daysLeftForFreeConsultation === 1 ? 'день' : daysLeftForFreeConsultation <= 4 ? 'дня' : 'дней'} для записи на бесплатную консультацию`
                            : `Бесплатная консультация доступна ещё ${daysLeftForFreeConsultation} ${daysLeftForFreeConsultation === 1 ? 'день' : daysLeftForFreeConsultation <= 4 ? 'дня' : 'дней'}`
                          }
                        </p>
                      </div>
                    </Card>
                  )}
                  {visibleFreeConsultations.map((type) => (
                    <Card
                      key={type.id}
                      className={`p-6 cursor-pointer transition-all ${
                        selectedTypeId === type.id
                          ? "border-2 border-primary bg-primary/5"
                          : "border border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedTypeId(type.id)}
                    >
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                        <Label
                          htmlFor={type.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-semibold text-foreground">
                                  {type.name}
                                </h3>
                                <Badge variant="default" className="bg-success text-success-foreground">
                                  Бесплатно
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-2">
                                {type.duration_minutes} минут
                              </p>
                              {type.description && (
                                <p className="text-sm text-muted-foreground">
                                  {type.description}
                                </p>
                              )}
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="pointer-events-none"
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Видеозвонок
                              </Button>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Платные консультации */}
              {paidConsultations.length > 0 && (
                <div className="space-y-4">
                  {visibleFreeConsultations.length > 0 && (
                    <h2 className="text-lg font-semibold text-foreground mt-6">
                      Платные консультации
                    </h2>
                  )}
                  {/* Карточка-подсказка о записи через поддержку */}
                  {!paidConsultationsEnabled && (
                    <Card className="p-4 border-primary/30 bg-primary/5">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">
                            Хотите записаться к специалисту напрямую?
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Напишите нам, расскажите о своём запросе, и мы подберём подходящего специалиста.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => navigate('/cabinet/messages')}
                          >
                            Написать в поддержку
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                  {paidConsultations.map((type) => {
                    const isDisabled = !paidConsultationsEnabled;
                    return (
                    <Card
                      key={type.id}
                      className={`p-6 transition-all ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed border border-border"
                          : selectedTypeId === type.id
                          ? "border-2 border-primary bg-primary/5 cursor-pointer"
                          : "border border-border hover:border-primary/50 cursor-pointer"
                      }`}
                      onClick={() => !isDisabled && setSelectedTypeId(type.id)}
                    >
                      <div className="flex items-start gap-4">
                        <RadioGroupItem 
                          value={type.id} 
                          id={type.id} 
                          className="mt-1" 
                          disabled={isDisabled}
                        />
                        <Label
                          htmlFor={type.id}
                          className={`flex-1 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-semibold text-foreground">
                                  {type.name}
                                </h3>
                                <span className="text-lg font-bold text-primary">
                                  {formatAmount(type.price)}
                                </span>
                                {isDisabled && (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-muted-foreground mb-2">
                                {type.duration_minutes} минут
                              </p>
                              {isDisabled ? (
                                <p className="text-sm text-muted-foreground italic">
                                  Сначала пройдите бесплатную консультацию
                                </p>
                              ) : type.description ? (
                                <p className="text-sm text-muted-foreground">
                                  {type.description}
                                </p>
                              ) : null}
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="pointer-events-none"
                                disabled={isDisabled}
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Видеозвонок
                              </Button>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </Card>
                  );
                  })}
                </div>
              )}
            </div>
          </RadioGroup>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Нет доступных типов консультаций. Пожалуйста, обратитесь к администратору.
            </p>
          </Card>
        )}

        {/* Кнопка подтверждения */}
        {selectedTypeId && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleConfirm}
              className="min-w-[200px]"
            >
              <Check className="h-4 w-4 mr-2" />
              Подтвердить тип консультации
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


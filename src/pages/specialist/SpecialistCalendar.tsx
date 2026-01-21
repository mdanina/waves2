/**
 * Страница календаря специалиста
 * Полный перенос функционала из PsiPilot CalendarPage
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { useToast } from '@/hooks/use-toast';
import { AppointmentList } from '@/components/specialist/calendar';
import {
  getSpecialistAppointments,
  getAssignedClients,
  deleteAppointment,
  deleteAllRecurringAppointments,
  subscribeToAppointments,
  type AppointmentWithDetails,
  type Client,
} from '@/lib/supabase-appointments';
import { getMySchedule, type SpecialistSchedule } from '@/lib/supabase-specialist-schedule';
import { SpecialistCalendarFeedDialog } from '@/components/specialist/SpecialistCalendarFeedDialog';

export default function SpecialistCalendar() {
  const { specialistUser } = useSpecialistAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [schedule, setSchedule] = useState<SpecialistSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Для удаления повторяющихся консультаций
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<AppointmentWithDetails | null>(null);
  const [deleteAllRecurring, setDeleteAllRecurring] = useState(false);

  // Получаем ID специалиста (только из профиля специалиста)
  const specialistId = specialistUser?.specialist?.id;

  // Загружаем все данные (клиенты + консультации + расписание) параллельно
  const loadData = useCallback(async (showRefreshing = false) => {
    if (!specialistId) return;

    try {
      if (showRefreshing) setIsRefreshing(true);

      const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0, 23, 59, 59);

      // Загружаем клиентов (из назначений), консультации и расписание параллельно
      const [clientsData, appointmentsData, scheduleData] = await Promise.all([
        getAssignedClients(),
        getSpecialistAppointments(specialistId, monthStart, monthEnd),
        getMySchedule().catch(() => null), // Если расписание не настроено, используем null
      ]);

      setClients(clientsData);
      setAppointments(appointmentsData);
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные календаря',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [specialistId, calendarMonth, toast]);

  // Загружаем только консультации при смене месяца (клиенты уже загружены)
  const loadAppointments = useCallback(async () => {
    if (!specialistId) return;

    try {
      setIsRefreshing(true);
      const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0, 23, 59, 59);

      const data = await getSpecialistAppointments(specialistId, monthStart, monthEnd);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить консультации',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [specialistId, calendarMonth, toast]);

  // Отслеживание, была ли уже первоначальная загрузка
  const initialLoadDoneRef = useRef(false);

  // Первоначальная загрузка при появлении specialistId
  useEffect(() => {
    if (specialistId && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      loadData();
    }
  }, [specialistId, loadData]);

  // При смене месяца загружаем только консультации (пропускаем первую загрузку)
  useEffect(() => {
    // Пропускаем если первоначальная загрузка ещё не завершена
    if (isLoading || !initialLoadDoneRef.current) return;

    loadAppointments();
  }, [calendarMonth, isLoading, loadAppointments]);

  // Realtime подписка на изменения консультаций
  useEffect(() => {
    if (!specialistId) return;

    const unsubscribe = subscribeToAppointments(specialistId, (event, appointment, oldAppointment) => {
      // Проверяем, попадает ли консультация в текущий месяц
      const checkInCurrentMonth = (apt: { scheduled_at?: string } | null) => {
        if (!apt?.scheduled_at) return false;
        const aptDate = new Date(apt.scheduled_at);
        const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
        const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0, 23, 59, 59);
        return aptDate >= monthStart && aptDate <= monthEnd;
      };

      switch (event) {
        case 'INSERT':
          if (appointment && checkInCurrentMonth(appointment)) {
            // Добавляем новую консультацию (нужно загрузить полные данные с joins)
            loadAppointments();
          }
          break;
        case 'UPDATE':
          if (appointment && (checkInCurrentMonth(appointment) || checkInCurrentMonth(oldAppointment))) {
            // Обновляем консультацию
            loadAppointments();
          }
          break;
        case 'DELETE':
          if (oldAppointment && checkInCurrentMonth(oldAppointment)) {
            // Удаляем консультацию из списка
            setAppointments(prev => prev.filter(apt => apt.id !== oldAppointment.id));
          }
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [specialistId, calendarMonth, loadAppointments]);

  const handleDeleteAppointment = async (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    // Проверяем, повторяющаяся ли это консультация
    const isRecurring = appointment.recurring_pattern || appointment.parent_appointment_id;

    if (isRecurring) {
      setAppointmentToDelete(appointment);
      setDeleteDialogOpen(true);
      return;
    }

    // Не повторяющаяся — удаляем сразу
    await performDelete(appointmentId, false);
  };

  const performDelete = async (appointmentId: string, deleteAll: boolean) => {
    try {
      if (deleteAll) {
        await deleteAllRecurringAppointments(appointmentId);
        toast({
          title: 'Успешно',
          description: 'Все повторяющиеся консультации удалены',
        });
      } else {
        await deleteAppointment(appointmentId);
        toast({
          title: 'Успешно',
          description: 'Консультация удалена',
        });
      }
      await loadAppointments();
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить консультацию',
        variant: 'destructive',
      });
    }
  };

  // Фильтруем консультации для выбранной даты
  const dayAppointments = appointments.filter((appointment) => {
    if (!appointment.scheduled_at) return false;
    return isSameDay(new Date(appointment.scheduled_at), selectedDate);
  });

  // Предрассчитанный Map дат для оптимизации modifiers
  // O(n) один раз вместо O(n*m) при каждом рендере календаря
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, { hasOnline: boolean; hasInPerson: boolean }>();

    for (const apt of appointments) {
      if (!apt.scheduled_at) continue;
      const dateKey = new Date(apt.scheduled_at).toDateString();
      const existing = map.get(dateKey) || { hasOnline: false, hasInPerson: false };

      if (apt.meeting_format === 'in_person') {
        existing.hasInPerson = true;
      } else if (apt.meeting_format === 'online') {
        existing.hasOnline = true;
      }

      map.set(dateKey, existing);
    }

    return map;
  }, [appointments]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header skeleton */}
        <div className="border-b bg-background px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="lg:w-1/2 p-6 flex items-center justify-center">
            <Skeleton className="h-80 w-80" />
          </div>
          <div className="lg:w-1/2 p-6">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Календарь</h1>
          <div className="flex items-center gap-2">
            {specialistId && (
              <SpecialistCalendarFeedDialog specialistId={specialistId} />
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Calendar */}
        <div className="lg:w-1/2 border-b lg:border-b-0 lg:border-r bg-background p-4 md:p-6 flex flex-col items-center justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            className="w-fit"
            classNames={{
              months: 'flex justify-center',
              month: 'space-y-6',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-lg font-semibold',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'mx-auto',
              head_cell: 'text-sm font-medium w-[72px] h-12',
              cell: 'h-[72px] w-[72px]',
              day: "h-[72px] w-[72px] text-lg font-medium relative [&.has-online-appointment]:after:content-[''] [&.has-online-appointment]:after:absolute [&.has-online-appointment]:after:bottom-2 [&.has-online-appointment]:after:left-1/2 [&.has-online-appointment]:after:-translate-x-1/2 [&.has-online-appointment]:after:h-1.5 [&.has-online-appointment]:after:w-1.5 [&.has-online-appointment]:after:rounded-full [&.has-online-appointment]:after:bg-blue-500 [&.has-inperson-appointment]:after:content-[''] [&.has-inperson-appointment]:after:absolute [&.has-inperson-appointment]:after:bottom-2 [&.has-inperson-appointment]:after:left-1/2 [&.has-inperson-appointment]:after:-translate-x-1/2 [&.has-inperson-appointment]:after:h-1.5 [&.has-inperson-appointment]:after:w-1.5 [&.has-inperson-appointment]:after:rounded-full [&.has-inperson-appointment]:after:bg-primary",
              day_selected: 'border-2 border-primary rounded-full bg-transparent text-foreground hover:border-primary hover:bg-transparent focus:border-primary focus:bg-transparent',
            }}
            modifiers={{
              hasOnlineAppointment: (date) => {
                const dayData = appointmentsByDate.get(date.toDateString());
                return !!dayData?.hasOnline && !dayData?.hasInPerson;
              },
              hasInPersonAppointment: (date) => {
                return appointmentsByDate.get(date.toDateString())?.hasInPerson ?? false;
              },
            }}
            modifiersClassNames={{
              hasOnlineAppointment: 'has-online-appointment',
              hasInPersonAppointment: 'has-inperson-appointment',
            }}
          />
        </div>

        {/* Right Panel - Schedule */}
        <div className="lg:w-1/2 p-4 md:p-6 flex-1 min-h-0">
          <div className="bg-card rounded-lg border border-border shadow-sm h-full flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 pb-3 md:pb-4 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-center flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">
                    {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ru })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-3 md:pt-4">
              <AppointmentList
                appointments={dayAppointments}
                clients={clients}
                selectedDate={selectedDate}
                schedule={schedule}
                onDelete={handleDeleteAppointment}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Recurring Appointment Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление повторяющейся консультации</AlertDialogTitle>
            <AlertDialogDescription>
              Эта консультация является частью повторяющейся серии. Что вы хотите сделать?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="deleteOption"
                checked={!deleteAllRecurring}
                onChange={() => setDeleteAllRecurring(false)}
                className="w-4 h-4"
              />
              <span className="text-sm">Удалить только эту консультацию</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="deleteOption"
                checked={deleteAllRecurring}
                onChange={() => setDeleteAllRecurring(true)}
                className="w-4 h-4"
              />
              <span className="text-sm">Удалить все последующие консультации</span>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setAppointmentToDelete(null);
              setDeleteAllRecurring(false);
            }}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (appointmentToDelete) {
                  performDelete(appointmentToDelete.id, deleteAllRecurring);
                }
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

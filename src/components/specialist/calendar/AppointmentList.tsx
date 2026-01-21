/**
 * Компонент списка консультаций
 * Упрощённый вид: только записанные консультации без пустых слотов
 */

import { format, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, Video, Users, Trash2, Repeat, CalendarOff, Plus, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AppointmentWithDetails, Client } from '@/lib/supabase-appointments';
import { getClientName } from '@/lib/supabase-appointments';
import type { SpecialistSchedule } from '@/lib/supabase-specialist-schedule';

interface AppointmentListProps {
  appointments: AppointmentWithDetails[];
  clients: Client[];
  selectedDate: Date;
  schedule?: SpecialistSchedule | null;
  onDelete?: (appointmentId: string) => void;
  onCreateAtTime?: (time: string) => void;
}

// Маппинг дня недели (getDay возвращает 0-6, где 0 = воскресенье)
const DAY_MAP: Record<number, string> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

export function AppointmentList({
  appointments,
  clients,
  selectedDate,
  schedule,
  onDelete,
  onCreateAtTime,
}: AppointmentListProps) {
  const navigate = useNavigate();

  // Проверяем, является ли день рабочим
  const dayOfWeek = DAY_MAP[getDay(selectedDate)];
  const isWorkDay = schedule?.work_days?.includes(dayOfWeek) ?? true;

  const getClientForAppointment = (appointment: AppointmentWithDetails): Client | null => {
    return clients.find(c => c.id === appointment.user_id) || null;
  };

  const getAppointmentEndTime = (appointment: AppointmentWithDetails) => {
    if (!appointment.scheduled_at) return '';
    const start = new Date(appointment.scheduled_at);
    const duration = appointment.duration_minutes || 45;
    const end = new Date(start.getTime() + duration * 60 * 1000);
    return format(end, 'HH:mm', { locale: ru });
  };

  const handleAppointmentClick = (appointmentId: string) => {
    navigate(`/specialist/sessions/${appointmentId}`);
  };

  // Сортируем консультации по времени
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (!a.scheduled_at || !b.scheduled_at) return 0;
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
  });

  // Если день не рабочий, показываем сообщение
  if (!isWorkDay) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarOff className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Выходной день</p>
        <p className="text-sm text-muted-foreground mt-1">
          В этот день консультации не запланированы
        </p>
      </div>
    );
  }

  // Если нет консультаций на этот день
  if (sortedAppointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          У вас сегодня нет консультаций
        </p>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          {format(selectedDate, 'd MMMM, EEEE', { locale: ru })}
        </p>
        {onCreateAtTime && (
          <Button onClick={() => onCreateAtTime('')} className="gap-2">
            <Plus className="w-4 h-4" />
            Новая консультация
          </Button>
        )}
      </div>
    );
  }

  // Показываем только записанные консультации
  return (
    <div className="space-y-3">
      {sortedAppointments.map((appointment) => {
        const startTime = appointment.scheduled_at
          ? format(new Date(appointment.scheduled_at), 'HH:mm')
          : '';
        const endTime = getAppointmentEndTime(appointment);
        const formatType = appointment.meeting_format;
        const client = getClientForAppointment(appointment);
        const clientName = appointment.profile
          ? (appointment.profile.last_name
              ? `${appointment.profile.first_name} ${appointment.profile.last_name}`
              : appointment.profile.first_name)
          : getClientName(client);

        return (
          <div
            key={appointment.id}
            className={cn(
              'p-4 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md',
              formatType === 'online' && 'border-l-4 border-l-blue-500',
              formatType === 'in_person' && 'border-l-4 border-l-primary',
              !formatType && 'border-l-4 border-l-muted-foreground'
            )}
            onClick={() => handleAppointmentClick(appointment.id)}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Время */}
              <div className="flex-shrink-0 text-center min-w-[70px]">
                <p className="text-lg font-bold text-foreground">{startTime}</p>
                <p className="text-xs text-muted-foreground">до {endTime}</p>
              </div>

              {/* Информация о клиенте */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground truncate">
                    {clientName}
                  </span>
                  {(appointment.recurring_pattern || appointment.parent_appointment_id) && (
                    <Repeat className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" title="Повторяющаяся" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {appointment.status === 'payment_pending' && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-amber-100 text-amber-800 border-amber-300"
                    >
                      <CreditCard className="w-3 h-3 mr-1" />
                      Ожидает оплаты
                    </Badge>
                  )}
                  {formatType && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        formatType === 'online' && 'border-blue-500 text-blue-600',
                        formatType === 'in_person' && 'border-primary text-primary'
                      )}
                    >
                      {formatType === 'online' ? (
                        <><Video className="w-3 h-3 mr-1" /> Онлайн</>
                      ) : (
                        <><Users className="w-3 h-3 mr-1" /> Очно</>
                      )}
                    </Badge>
                  )}
                  {appointment.appointment_type && (
                    <span className="text-xs text-muted-foreground">
                      {appointment.appointment_type.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Кнопка удаления */}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(appointment.id);
                  }}
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Кнопка добавления внизу списка */}
      {onCreateAtTime && (
        <Button
          variant="outline"
          className="w-full gap-2 mt-4"
          onClick={() => onCreateAtTime('')}
        >
          <Plus className="w-4 h-4" />
          Добавить консультацию
        </Button>
      )}
    </div>
  );
}

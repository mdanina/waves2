/**
 * Диалог создания консультации
 * Адаптировано из PsiPilot CreateAppointmentDialog
 */

import { useState, useEffect } from 'react';
import { Calendar, Loader2, Check, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, startOfToday, isBefore, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Client } from '@/lib/supabase-appointments';
import { getClientName, getClientInitials, getAppointmentTypes } from '@/lib/supabase-appointments';

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  specialistId: string;
  defaultDate?: Date;
  defaultTime?: string;
  defaultClientId?: string;
  onCreateAppointment: (params: {
    userId: string;
    profileId?: string | null;
    appointmentTypeId: string;
    scheduledAt: string;
    durationMinutes: number;
    meetingFormat: 'online' | 'in_person' | null;
    recurringPattern?: 'weekly' | 'monthly' | null;
    recurringEndDate?: string | null;
    timezone?: string;
  }) => Promise<void>;
}

interface AppointmentType {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
}

// Маппинг регионов на часовые пояса (все города из RegionSelect)
const REGION_TIMEZONES: Record<string, string> = {
  // UTC+3
  'Москва': 'Europe/Moscow',
  'Санкт-Петербург': 'Europe/Moscow',
  'Казань': 'Europe/Moscow',
  'Нижний Новгород': 'Europe/Moscow',
  'Ростов-на-Дону': 'Europe/Moscow',
  'Воронеж': 'Europe/Moscow',
  'Волгоград': 'Europe/Moscow',
  // UTC+4
  'Самара': 'Europe/Samara',
  // UTC+5
  'Екатеринбург': 'Asia/Yekaterinburg',
  'Челябинск': 'Asia/Yekaterinburg',
  'Уфа': 'Asia/Yekaterinburg',
  'Пермь': 'Asia/Yekaterinburg',
  // UTC+6
  'Омск': 'Asia/Omsk',
  // UTC+7
  'Новосибирск': 'Asia/Krasnoyarsk',
  'Красноярск': 'Asia/Krasnoyarsk',
};

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  clients,
  specialistId,
  defaultDate,
  defaultTime,
  defaultClientId,
  onCreateAppointment,
}: CreateAppointmentDialogProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientId || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate || new Date());
  const [selectedTime, setSelectedTime] = useState(defaultTime || '09:00');
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingFormat, setMeetingFormat] = useState<'online' | 'in_person'>('online');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  // Загружаем типы консультаций
  useEffect(() => {
    if (open) {
      setIsLoadingTypes(true);
      getAppointmentTypes()
        .then((types) => {
          setAppointmentTypes(types);
          if (types.length > 0 && !selectedTypeId) {
            setSelectedTypeId(types[0].id);
            setDurationMinutes(types[0].duration_minutes);
          }
        })
        .catch((error) => {
          console.error('Error loading appointment types:', error);
        })
        .finally(() => {
          setIsLoadingTypes(false);
        });
    }
  }, [open]);

  // Обновляем дату, время и клиента при открытии диалога
  useEffect(() => {
    if (open) {
      const today = startOfToday();
      if (defaultDate) {
        const dateToUse = isBefore(defaultDate, today) ? new Date() : defaultDate;
        setSelectedDate(dateToUse);
      } else {
        setSelectedDate(new Date());
      }
      if (defaultTime) {
        const dateToCheck = defaultDate && !isBefore(defaultDate, today) ? defaultDate : new Date();
        if (isToday(dateToCheck)) {
          const [hours, minutes] = defaultTime.split(':').map(Number);
          const timeToCheck = new Date();
          timeToCheck.setHours(hours, minutes, 0, 0);
          if (isBefore(timeToCheck, new Date())) {
            const now = new Date();
            now.setHours(now.getHours() + 1, 0, 0, 0);
            setSelectedTime(format(now, 'HH:mm'));
          } else {
            setSelectedTime(defaultTime);
          }
        } else {
          setSelectedTime(defaultTime);
        }
      } else {
        const dateToCheck = defaultDate && !isBefore(defaultDate, today) ? defaultDate : new Date();
        if (isToday(dateToCheck)) {
          const now = new Date();
          now.setHours(now.getHours() + 1, 0, 0, 0);
          setSelectedTime(format(now, 'HH:mm'));
        } else {
          setSelectedTime('09:00');
        }
      }
      // Устанавливаем клиента по умолчанию
      if (defaultClientId) {
        setSelectedClientId(defaultClientId);
      }
    }
  }, [open, defaultDate, defaultTime, defaultClientId]);

  const resetState = () => {
    setSelectedClientId('');
    setSelectedDate(defaultDate || new Date());
    setSelectedTime(defaultTime || '09:00');
    setMeetingFormat('online');
    setIsRecurring(false);
    setIsCreating(false);
    if (appointmentTypes.length > 0) {
      setSelectedTypeId(appointmentTypes[0].id);
      setDurationMinutes(appointmentTypes[0].duration_minutes);
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleCreate = async () => {
    if (!selectedDate || !selectedClientId || !selectedTypeId) {
      return;
    }

    setIsCreating(true);

    try {
      // Объединяем дату и время
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // Проверяем, что консультация не в прошлом
      const now = new Date();
      if (isBefore(scheduledDateTime, now)) {
        throw new Error('Нельзя создать консультацию в прошлом. Выберите будущую дату и время.');
      }

      const client = clients.find(c => c.id === selectedClientId);
      const recurringPattern = isRecurring ? 'weekly' : undefined;
      const recurringEndDate = isRecurring
        ? new Date(scheduledDateTime.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      await onCreateAppointment({
        userId: selectedClientId,
        profileId: client?.profile?.id || null,
        appointmentTypeId: selectedTypeId,
        scheduledAt: scheduledDateTime.toISOString(),
        durationMinutes,
        meetingFormat,
        recurringPattern,
        recurringEndDate,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow',
      });

      handleClose();
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Проверяем валидность даты/времени
  const isValidDateTime = selectedDate && selectedTime && (() => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);
    return !isBefore(scheduledDateTime, new Date());
  })();

  const canCreate = selectedDate && isValidDateTime && selectedClientId && selectedTypeId;

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Вычисляем московское время для выбранной даты и времени
  const getMoscowTime = () => {
    if (!selectedDate || !selectedTime) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const localDateTime = new Date(selectedDate);
    localDateTime.setHours(hours, minutes, 0, 0);

    return localDateTime.toLocaleTimeString('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Вычисляем время клиента, если есть регион
  const getClientTime = () => {
    if (!selectedDate || !selectedTime || !selectedClient?.region) return null;
    const clientTimezone = REGION_TIMEZONES[selectedClient.region];
    if (!clientTimezone) return null;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const localDateTime = new Date(selectedDate);
    localDateTime.setHours(hours, minutes, 0, 0);

    return localDateTime.toLocaleTimeString('ru-RU', {
      timeZone: clientTimezone,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Новая консультация</DialogTitle>
          <p className="text-sm text-muted-foreground">Запланируйте консультацию с клиентом</p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Выбор клиента */}
            <div className="space-y-3">
              <Label>Клиент</Label>
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  У вас пока нет назначенных клиентов. Координатор должен назначить вам клиентов.
                </p>
              ) : (
                <>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите клиента" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <span>{getClientName(client)}</span>
                            {client.region && (
                              <span className="text-muted-foreground text-xs flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {client.region}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedClient && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {getClientInitials(selectedClient)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {getClientName(selectedClient)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{selectedClient.email || selectedClient.phone || 'Нет контакта'}</span>
                          {selectedClient.region && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-background rounded">
                              <MapPin className="w-3 h-3" />
                              {selectedClient.region}
                            </span>
                          )}
                        </div>
                      </div>
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Тип консультации */}
            <div className="space-y-2">
              <Label>Тип консультации</Label>
              {isLoadingTypes ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Загрузка...
                </div>
              ) : (
                <Select
                  value={selectedTypeId}
                  onValueChange={(value) => {
                    setSelectedTypeId(value);
                    const type = appointmentTypes.find(t => t.id === value);
                    if (type) {
                      setDurationMinutes(type.duration_minutes);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.duration_minutes} мин.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Дата и время */}
            <div className="space-y-3">
              <Label>Дата и время</Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs">Дата</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !selectedDate && 'text-muted-foreground'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, 'd MMMM yyyy', { locale: ru })
                        ) : (
                          <span>Выберите дату</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        disabled={(date) => isBefore(date, startOfToday())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-xs">Время</Label>
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full"
                    min={isToday(selectedDate || new Date()) ? format(new Date(), 'HH:mm') : undefined}
                  />
                </div>
              </div>

              {/* Показываем время в разных часовых поясах */}
              {selectedDate && selectedTime && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>МСК: {getMoscowTime()}</span>
                  </div>
                  {selectedClient?.region && getClientTime() && getMoscowTime() !== getClientTime() && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedClient.region}: {getClientTime()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-xs">Продолжительность</Label>
                <Select value={durationMinutes.toString()} onValueChange={(v) => setDurationMinutes(Number(v))}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 минут</SelectItem>
                    <SelectItem value="45">45 минут</SelectItem>
                    <SelectItem value="60">1 час</SelectItem>
                    <SelectItem value="90">1.5 часа</SelectItem>
                    <SelectItem value="120">2 часа</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Формат встречи */}
            <div className="space-y-2">
              <Label>Формат</Label>
              <RadioGroup value={meetingFormat} onValueChange={(v) => setMeetingFormat(v as 'online' | 'in_person')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="cursor-pointer">Онлайн</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in_person" id="in_person" />
                  <Label htmlFor="in_person" className="cursor-pointer">Очно</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Повторяющаяся встреча */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Повторяющаяся встреча</Label>
                  <p className="text-xs text-muted-foreground">
                    Встреча будет повторяться каждую неделю в этот же день и время
                  </p>
                </div>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Отмена
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Сохранение...
              </>
            ) : (
              'Сохранить'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

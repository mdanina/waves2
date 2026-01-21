/**
 * Единый диалог создания консультации
 * По умолчанию - запись с оплатой, бесплатная - как опция
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Loader2, Check, MapPin, Clock, Link2, Copy, Mail, Search, User, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, startOfToday, isBefore, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Client } from '@/lib/supabase-appointments';
import { getClientName, getClientInitials, getAppointmentTypes } from '@/lib/supabase-appointments';

interface CreateUnifiedAppointmentDialogProps {
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
  onSuccess?: () => void;
}

interface AppointmentType {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string | null;
  type: string;
  dob: string | null;
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

export function CreateUnifiedAppointmentDialog({
  open,
  onOpenChange,
  clients,
  specialistId,
  defaultDate,
  defaultTime,
  defaultClientId,
  onCreateAppointment,
  onSuccess,
}: CreateUnifiedAppointmentDialogProps) {
  // Режим записи: по умолчанию с оплатой (isPaid = true)
  const [isFreeAppointment, setIsFreeAppointment] = useState(false);

  // Основные поля
  const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientId || '');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate || new Date());
  const [selectedTime, setSelectedTime] = useState(defaultTime || '10:00');
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState(45);

  // Поля для бесплатной записи
  const [meetingFormat, setMeetingFormat] = useState<'online' | 'in_person'>('online');
  const [isRecurring, setIsRecurring] = useState(false);

  // Поля для платной записи
  const [sendEmail, setSendEmail] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Профили клиента
  const [clientProfiles, setClientProfiles] = useState<Profile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  // Поиск по клиентам
  const [clientSearch, setClientSearch] = useState('');

  // Состояние загрузки
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  // Загружаем типы консультаций
  useEffect(() => {
    if (open) {
      setIsLoadingTypes(true);
      getAppointmentTypes()
        .then((types) => {
          // Если платная запись - показываем только платные типы
          // Если бесплатная - показываем все
          const filteredTypes = isFreeAppointment
            ? types
            : types.filter(t => t.price > 0);
          setAppointmentTypes(filteredTypes);

          // Выбираем первый тип если текущий не подходит
          if (filteredTypes.length > 0) {
            const currentTypeValid = filteredTypes.some(t => t.id === selectedTypeId);
            if (!currentTypeValid) {
              setSelectedTypeId(filteredTypes[0].id);
              setDurationMinutes(filteredTypes[0].duration_minutes);
            }
          } else {
            setSelectedTypeId('');
          }
        })
        .catch((error) => {
          console.error('Error loading appointment types:', error);
        })
        .finally(() => {
          setIsLoadingTypes(false);
        });
    }
  }, [open, isFreeAppointment]);

  // Загрузка профилей клиента
  useEffect(() => {
    if (!selectedClientId) {
      setClientProfiles([]);
      setSelectedProfile('');
      return;
    }

    const loadProfiles = async () => {
      setIsLoadingProfiles(true);

      // Пробуем RPC функцию
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_client_profiles', { p_client_user_id: selectedClientId });

      if (!rpcError && rpcData && rpcData.length > 0) {
        setClientProfiles(rpcData);
        setIsLoadingProfiles(false);
        return;
      }

      // Fallback: прямой запрос к profiles
      const { data: directData, error: directError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, type, dob')
        .eq('user_id', selectedClientId);

      if (directError) {
        console.error('Error loading profiles:', directError);
        setClientProfiles([]);
      } else {
        setClientProfiles(directData || []);
      }
      setIsLoadingProfiles(false);
    };

    loadProfiles();
  }, [selectedClientId]);

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
          setSelectedTime('10:00');
        }
      }
      if (defaultClientId) {
        setSelectedClientId(defaultClientId);
      }
    }
  }, [open, defaultDate, defaultTime, defaultClientId]);

  // Фильтрация клиентов по поиску
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const query = clientSearch.toLowerCase();
    return clients.filter(client => {
      const name = getClientName(client).toLowerCase();
      const email = client.email?.toLowerCase() || '';
      const phone = client.phone || '';
      return name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [clients, clientSearch]);

  const resetState = () => {
    setIsFreeAppointment(false);
    setSelectedClientId('');
    setSelectedProfile('');
    setSelectedDate(defaultDate || new Date());
    setSelectedTime(defaultTime || '10:00');
    setMeetingFormat('online');
    setIsRecurring(false);
    setSendEmail(true);
    setPaymentUrl(null);
    setCopied(false);
    setClientProfiles([]);
    setClientSearch('');
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

  // Создание бесплатной записи
  const handleCreateFree = async () => {
    if (!selectedDate || !selectedClientId || !selectedTypeId) {
      return;
    }

    setIsCreating(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

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
        profileId: selectedProfile || client?.profile?.id || null,
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
      toast.error(error instanceof Error ? error.message : 'Ошибка создания записи');
    } finally {
      setIsCreating(false);
    }
  };

  // Создание платной записи
  const handleCreatePaid = async () => {
    if (!selectedClientId || !selectedTypeId || !selectedDate) {
      return;
    }

    setIsCreating(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      if (isBefore(scheduledAt, new Date())) {
        throw new Error('Нельзя создать запись на прошедшее время');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Требуется авторизация');
      }

      // Получаем API URL с поддержкой относительных путей
      const envUrl = import.meta.env.VITE_API_URL || '';
      let apiUrl = envUrl;
      if (envUrl && !envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        apiUrl = `${origin}${envUrl.startsWith('/') ? envUrl : `/${envUrl}`}`;
      }
      const response = await fetch(`${apiUrl}/api/specialist/appointments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: selectedClientId,
          profileId: selectedProfile || null,
          appointmentTypeId: selectedTypeId,
          scheduledAt: scheduledAt.toISOString(),
          sendEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка создания записи');
      }

      const data = await response.json();
      setPaymentUrl(data.payment_url);
      toast.success('Запись создана, ссылка на оплату сформирована');
      onSuccess?.();
    } catch (error) {
      console.error('Error creating paid appointment:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка создания записи');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreate = () => {
    if (isFreeAppointment) {
      handleCreateFree();
    } else {
      handleCreatePaid();
    }
  };

  const handleCopyUrl = useCallback(() => {
    if (paymentUrl) {
      navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      toast.success('Ссылка скопирована');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [paymentUrl]);

  // Валидация
  const isValidDateTime = selectedDate && selectedTime && (() => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);
    return !isBefore(scheduledDateTime, new Date());
  })();

  const canCreate = selectedDate && isValidDateTime && selectedClientId && selectedTypeId;

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedType = appointmentTypes.find(t => t.id === selectedTypeId);

  const getProfileDisplayName = (profile: Profile) => {
    const name = profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name;
    const type = profile.type === 'child' ? 'ребёнок' : profile.type === 'parent' ? 'родитель' : profile.type;
    return `${name} (${type})`;
  };

  // Вычисляем московское время
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

  // Вычисляем время клиента
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
          <DialogTitle>Создать запись на консультацию</DialogTitle>
          <DialogDescription>
            {isFreeAppointment
              ? 'Бесплатная консультация без оплаты'
              : 'Клиент получит ссылку на оплату'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto max-h-[55vh] pr-2">
          <div className="space-y-6 py-4">
            {/* Результат - ссылка на оплату (только для платной записи) */}
            {paymentUrl && (
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="ml-2">
                  <div className="space-y-3">
                    <p className="font-medium text-green-800">
                      Запись создана! Ссылка на оплату:
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={paymentUrl}
                        readOnly
                        className="text-xs bg-white"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyUrl}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {sendEmail && (
                      <p className="text-sm text-green-700 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email со ссылкой отправлен клиенту
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!paymentUrl && (
              <>
                {/* Выбор клиента */}
                <div className="space-y-3">
                  <Label>Клиент *</Label>
                  {clients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      У вас пока нет назначенных клиентов. Координатор должен назначить вам клиентов.
                    </p>
                  ) : (
                    <>
                      {/* Поиск по клиентам - всегда показываем */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Поиск по имени, email или телефону..."
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <Select value={selectedClientId} onValueChange={(id) => {
                        setSelectedClientId(id);
                        setSelectedProfile(''); // Сбрасываем профиль при смене клиента
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите клиента" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredClients.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              Клиенты не найдены
                            </div>
                          ) : (
                            filteredClients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                <div className="flex items-center gap-2">
                                  <span>{getClientName(client)}</span>
                                  {client.email && (
                                    <span className="text-muted-foreground text-xs">
                                      ({client.email})
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          )}
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

                {/* Выбор профиля - улучшенный UI с карточками */}
                {selectedClientId && (
                  <div className="space-y-2">
                    <Label>На кого запись</Label>
                    {isLoadingProfiles ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Загрузка профилей...
                      </div>
                    ) : clientProfiles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Профили не найдены
                      </p>
                    ) : clientProfiles.length === 1 ? (
                      // Если профиль один - показываем его без выбора
                      <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-3">
                        {clientProfiles[0].type === 'child' ? (
                          <Baby className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{getProfileDisplayName(clientProfiles[0])}</p>
                        </div>
                      </div>
                    ) : (
                      // Если профилей несколько - показываем выбор карточками
                      <div className="grid gap-2">
                        {clientProfiles.map((profile) => (
                          <div
                            key={profile.id}
                            onClick={() => setSelectedProfile(selectedProfile === profile.id ? '' : profile.id)}
                            className={cn(
                              'p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3',
                              selectedProfile === profile.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            <div className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center',
                              selectedProfile === profile.id ? 'bg-primary/20' : 'bg-muted'
                            )}>
                              {profile.type === 'child' ? (
                                <Baby className="w-4 h-4" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {profile.first_name} {profile.last_name || ''}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {profile.type === 'parent' && 'Родитель'}
                                {profile.type === 'child' && 'Ребёнок'}
                                {profile.type === 'partner' && 'Партнёр'}
                              </p>
                            </div>
                            {selectedProfile === profile.id && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground">
                          Выберите, на кого записать консультацию
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Тип консультации - автовыбор первого доступного типа */}
                {isLoadingTypes ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Загрузка типов консультаций...
                  </div>
                ) : appointmentTypes.length === 0 ? (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-destructive">
                      {isFreeAppointment
                        ? 'Нет доступных типов консультаций'
                        : 'Нет платных типов консультаций. Включите "Бесплатная консультация" или добавьте платные типы.'}
                    </p>
                  </div>
                ) : selectedType && (
                  // Показываем информацию о выбранном типе (первый доступный)
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium">{selectedType.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedType.duration_minutes} мин.
                      {selectedType.price > 0 && ` • ${selectedType.price} ₽`}
                    </p>
                  </div>
                )}

                {/* Дата и время */}
                <div className="space-y-3">
                  <Label>Дата и время *</Label>

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

                  {/* Время в разных часовых поясах */}
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

                  {selectedDate && !isValidDateTime && (
                    <p className="text-xs text-destructive">
                      Выберите время в будущем
                    </p>
                  )}

                  {/* Продолжительность (только для бесплатной) */}
                  {isFreeAppointment && (
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
                  )}
                </div>

                {/* Формат встречи (только для бесплатной) */}
                {isFreeAppointment && (
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
                )}

                {/* Повторяющаяся встреча (только для бесплатной) */}
                {isFreeAppointment && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Повторяющаяся встреча</Label>
                        <p className="text-xs text-muted-foreground">
                          Встреча будет повторяться каждую неделю
                        </p>
                      </div>
                      <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                    </div>
                  </div>
                )}

                {/* Email уведомление (только для платной) */}
                {!isFreeAppointment && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Отправить email со ссылкой</Label>
                      <p className="text-xs text-muted-foreground">
                        Клиент получит письмо со ссылкой на оплату
                      </p>
                    </div>
                    <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                  </div>
                )}

                {/* Переключатель бесплатной консультации - внизу формы */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Бесплатная консультация</Label>
                    <p className="text-xs text-muted-foreground">
                      {isFreeAppointment
                        ? 'Запись без оплаты'
                        : 'Консультация с оплатой'}
                    </p>
                  </div>
                  <Switch
                    checked={isFreeAppointment}
                    onCheckedChange={setIsFreeAppointment}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            {paymentUrl ? 'Закрыть' : 'Отмена'}
          </Button>
          {!paymentUrl && (
            <Button onClick={handleCreate} disabled={!canCreate || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Создание...
                </>
              ) : isFreeAppointment ? (
                'Создать запись'
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Создать и получить ссылку
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

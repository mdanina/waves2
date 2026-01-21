/**
 * Диалог создания записи с оплатой (для специалистов)
 * Специалист может записать только своих назначенных клиентов
 * Специалист автоматически назначается на созданную запись
 */

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Loader2, Check, Link2, Copy, Mail } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, startOfToday, isBefore } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Client } from '@/lib/supabase-appointments';
import { getClientName } from '@/lib/supabase-appointments';

interface CreateSpecialistPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
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
  birth_date: string | null;
}

export function CreateSpecialistPaymentDialog({
  open,
  onOpenChange,
  clients,
  onSuccess,
}: CreateSpecialistPaymentDialogProps) {
  // Состояние формы
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [sendEmail, setSendEmail] = useState(true);

  // Результат
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Профили выбранного клиента
  const [clientProfiles, setClientProfiles] = useState<Profile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  // Типы консультаций
  const { data: appointmentTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ['appointment-types-paid'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .gt('price', 0)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data as AppointmentType[];
    },
    enabled: open,
  });

  // Загрузка профилей клиента
  useEffect(() => {
    if (!selectedClientId) {
      setClientProfiles([]);
      setSelectedProfile('');
      return;
    }

    setIsLoadingProfiles(true);
    supabase
      .from('profiles')
      .select('id, first_name, last_name, type, birth_date')
      .eq('user_id', selectedClientId)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading profiles:', error);
          setClientProfiles([]);
        } else {
          setClientProfiles(data || []);
        }
        setIsLoadingProfiles(false);
      });
  }, [selectedClientId]);

  // Сброс состояния при закрытии
  useEffect(() => {
    if (!open) {
      setSelectedClientId('');
      setSelectedProfile('');
      setSelectedTypeId('');
      setSelectedDate(undefined);
      setSelectedTime('10:00');
      setSendEmail(true);
      setPaymentUrl(null);
      setCopied(false);
      setClientProfiles([]);
    }
  }, [open]);

  // Мутация создания записи
  const createAppointment = useMutation({
    mutationFn: async () => {
      if (!selectedClientId || !selectedTypeId || !selectedDate) {
        throw new Error('Заполните все обязательные поля');
      }

      // Формируем дату и время
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // Проверяем, что дата не в прошлом
      if (isBefore(scheduledAt, new Date())) {
        throw new Error('Нельзя создать запись на прошедшее время');
      }

      // Получаем токен
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

      return response.json();
    },
    onSuccess: (data) => {
      setPaymentUrl(data.payment_url);
      toast.success('Запись создана, ссылка на оплату сформирована');
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCopyUrl = useCallback(() => {
    if (paymentUrl) {
      navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      toast.success('Ссылка скопирована');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [paymentUrl]);

  const getProfileDisplayName = (profile: Profile) => {
    const name = profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name;
    const type = profile.type === 'child' ? 'ребёнок' : profile.type === 'parent' ? 'родитель' : profile.type;
    return `${name} (${type})`;
  };

  const selectedType = appointmentTypes.find(t => t.id === selectedTypeId);

  const canCreate = selectedClientId && selectedTypeId && selectedDate && selectedTime;

  // Проверяем валидность времени (не в прошлом)
  const isValidDateTime = selectedDate && selectedTime && (() => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);
    return !isBefore(scheduledDateTime, new Date());
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Создать запись с оплатой</DialogTitle>
          <DialogDescription>
            Создайте запись для клиента и отправьте ссылку на оплату
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Результат - ссылка на оплату */}
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
                <div className="space-y-2">
                  <Label>Клиент *</Label>
                  {clients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      У вас нет назначенных клиентов
                    </p>
                  ) : (
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите клиента" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {getClientName(client)}
                            {client.email && (
                              <span className="text-muted-foreground text-xs ml-2">
                                ({client.email})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Выбор профиля */}
                {selectedClientId && (
                  <div className="space-y-2">
                    <Label>Профиль (на кого запись)</Label>
                    {isLoadingProfiles ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Загрузка...
                      </div>
                    ) : (
                      <Select value={selectedProfile || '__none__'} onValueChange={(v) => setSelectedProfile(v === '__none__' ? '' : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите профиль (опционально)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Без указания профиля</SelectItem>
                          {clientProfiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {getProfileDisplayName(profile)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Тип консультации */}
                <div className="space-y-2">
                  <Label>Тип консультации *</Label>
                  {isLoadingTypes ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Загрузка...
                    </div>
                  ) : (
                    <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип консультации" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointmentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} — {type.price} ₽
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedType && (
                    <p className="text-xs text-muted-foreground">
                      Продолжительность: {selectedType.duration_minutes} мин. | Стоимость: {selectedType.price} ₽
                    </p>
                  )}
                </div>

                {/* Дата и время */}
                <div className="space-y-3">
                  <Label>Дата и время *</Label>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Дата</Label>
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
                      <Label className="text-xs">Время</Label>
                      <Input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {selectedDate && !isValidDateTime && (
                    <p className="text-xs text-destructive">
                      Выберите время в будущем
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Отправить email со ссылкой</Label>
                    <p className="text-xs text-muted-foreground">
                      Клиент получит письмо со ссылкой на оплату
                    </p>
                  </div>
                  <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {paymentUrl ? 'Закрыть' : 'Отмена'}
          </Button>
          {!paymentUrl && (
            <Button
              onClick={() => createAppointment.mutate()}
              disabled={!canCreate || !isValidDateTime || createAppointment.isPending}
            >
              {createAppointment.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Создание...
                </>
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

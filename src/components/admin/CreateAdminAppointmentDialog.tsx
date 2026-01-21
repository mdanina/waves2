/**
 * Диалог создания консультации админом (горячий флоу)
 * - Поиск пользователя
 * - Выбор профиля
 * - Выбор специалиста
 * - Выбор типа консультации
 * - Генерация ссылки на оплату
 */

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Loader2, Check, Search, Link2, Copy, Mail, User, MapPin, Clock } from 'lucide-react';
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
import { format, startOfToday, isBefore, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';

interface CreateAdminAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialists: Array<{
    id: string;
    display_name: string;
    specialization_codes: string[];
    current_clients_count: number;
    max_clients: number;
    accepts_new_clients: boolean;
  }>;
  onSuccess?: () => void;
}

interface SearchedUser {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  region: string | null;
}

// Маппинг типов консультаций на специализации
const APPOINTMENT_TYPE_SPECIALIZATIONS: Record<string, string[]> = {
  'Первичная встреча': ['coordinator'],
  'Повторная встреча с координатором': ['coordinator'], // Особая логика - только назначенный координатор клиента
  'Детский психолог': ['child_psychologist', 'psychologist', 'clinical_psychologist'],
  'Нейропсихолог': ['neuropsychologist'],
  'Психиатр': ['psychiatrist'],
  'Невролог': ['neurologist'],
  'Семейный психолог': ['family_therapist', 'psychologist'],
  'Логопед': ['logopedist'],
};

// Тип встречи, требующий назначенного координатора клиента
const COORDINATOR_FOLLOWUP_TYPE = 'Повторная встреча с координатором';

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

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  type: string;
  birth_date: string | null;
}

interface AppointmentType {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
}

interface CreateAppointmentResult {
  success: boolean;
  appointment_id: string;
  is_free?: boolean;
  payment_id?: string;
  payment_url?: string;
  expires_at?: string;
}

// API base URL с поддержкой относительных путей
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL || '';
  if (!envUrl) return '';
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) return envUrl;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const path = envUrl.startsWith('/') ? envUrl : `/${envUrl}`;
  return `${origin}${path}`;
}
const API_BASE_URL = getApiBaseUrl();

export function CreateAdminAppointmentDialog({
  open,
  onOpenChange,
  specialists,
  onSuccess,
}: CreateAdminAppointmentDialogProps) {
  const { session } = useAuth();

  // Поиск пользователя
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>('');

  // Выбор специалиста и типа
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');

  // Дата и время
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('10:00');

  // Отправка email
  const [sendEmail, setSendEmail] = useState(true);

  // Результат создания
  const [creationResult, setCreationResult] = useState<CreateAppointmentResult | null>(null);

  // Поиск пользователей
  const searchUsers = useCallback(async (query: string): Promise<SearchedUser[]> => {
    if (!session?.access_token || query.length < 2) return [];

    const response = await fetch(`${API_BASE_URL}/api/admin/users/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search users');
    }

    const data = await response.json();
    return data.users || [];
  }, [session?.access_token]);

  // Query для поиска пользователей
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['admin-user-search', searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: searchQuery.length >= 2 && !selectedUser,
    staleTime: 30000,
  });

  // Загрузка профилей выбранного пользователя
  const { data: userProfiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['admin-user-profiles', selectedUser?.id],
    queryFn: async (): Promise<UserProfile[]> => {
      if (!session?.access_token || !selectedUser?.id) return [];

      const response = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUser.id}/profiles`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }

      const data = await response.json();
      return data.profiles || [];
    },
    enabled: !!selectedUser?.id,
  });

  // Загрузка типов консультаций
  const { data: appointmentTypes, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['appointment-types'],
    queryFn: async (): Promise<AppointmentType[]> => {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Загрузка назначенного координатора клиента (для повторной встречи с координатором)
  const { data: clientCoordinatorId } = useQuery({
    queryKey: ['client-coordinator', selectedUser?.id],
    queryFn: async (): Promise<string | null> => {
      if (!selectedUser?.id) return null;

      // Ищем назначение клиента к специалисту с координаторской специализацией
      const { data, error } = await supabase
        .from('client_assignments')
        .select(`
          specialist_id,
          specialists!inner (
            id,
            specialization_codes
          )
        `)
        .eq('client_user_id', selectedUser.id)
        .eq('status', 'active')
        .limit(10);

      if (error) {
        console.error('Error fetching client coordinator:', error);
        return null;
      }

      // Ищем специалиста с coordinator в specialization_codes
      const coordinatorAssignment = data?.find((assignment: any) =>
        assignment.specialists?.specialization_codes?.includes('coordinator')
      );

      return coordinatorAssignment?.specialist_id || null;
    },
    enabled: !!selectedUser?.id,
  });

  // Мутация для создания записи
  const createAppointmentMutation = useMutation({
    mutationFn: async (params: {
      userId: string;
      profileId?: string;
      appointmentTypeId: string;
      scheduledAt: string;
      specialistId?: string;
      sendEmail: boolean;
    }): Promise<CreateAppointmentResult> => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/appointments/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create appointment');
      }

      return response.json();
    },
    onSuccess: (result) => {
      setCreationResult(result);
      if (result.is_free) {
        toast.success('Бесплатная запись создана', {
          description: sendEmail
            ? 'Подтверждение отправлено на email клиента'
            : 'Запись успешно создана',
        });
      } else {
        toast.success('Запись создана', {
          description: sendEmail
            ? 'Ссылка на оплату отправлена на email клиента'
            : 'Скопируйте ссылку на оплату для клиента',
        });
      }
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Ошибка создания записи', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
    },
  });

  // Устанавливаем первый тип по умолчанию
  useEffect(() => {
    if (appointmentTypes?.length && !selectedTypeId) {
      setSelectedTypeId(appointmentTypes[0].id);
    }
  }, [appointmentTypes, selectedTypeId]);

  // Сбросить выбранный профиль при смене пользователя
  useEffect(() => {
    setSelectedProfile('');
  }, [selectedUser?.id]);

  // Сбросить специалиста при смене типа консультации
  useEffect(() => {
    setSelectedSpecialist('');
  }, [selectedTypeId]);

  const resetState = () => {
    setSearchQuery('');
    setSelectedUser(null);
    setSelectedProfile('');
    setSelectedSpecialist('');
    setSelectedTypeId('');
    setSelectedDate(new Date());
    setSelectedTime('10:00');
    setSendEmail(true);
    setCreationResult(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleCreate = async () => {
    if (!selectedDate || !selectedUser || !selectedTypeId) {
      return;
    }

    // Объединяем дату и время
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    // Проверяем, что консультация не в прошлом
    const now = new Date();
    if (isBefore(scheduledDateTime, now)) {
      toast.error('Нельзя создать консультацию в прошлом');
      return;
    }

    await createAppointmentMutation.mutateAsync({
      userId: selectedUser.id,
      profileId: selectedProfile || undefined,
      appointmentTypeId: selectedTypeId,
      scheduledAt: scheduledDateTime.toISOString(),
      specialistId: selectedSpecialist || undefined,
      sendEmail,
    });
  };

  const copyPaymentUrl = () => {
    if (creationResult?.payment_url) {
      navigator.clipboard.writeText(creationResult.payment_url);
      toast.success('Ссылка скопирована');
    }
  };

  // Проверяем валидность даты/времени
  const isValidDateTime = selectedDate && selectedTime && (() => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);
    return !isBefore(scheduledDateTime, new Date());
  })();

  const canCreate = selectedDate && isValidDateTime && selectedUser && selectedTypeId;

  const getUserDisplayName = (user: SearchedUser) => {
    if (user.first_name) {
      return user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.first_name;
    }
    return user.email || user.phone || 'Пользователь';
  };

  const getProfileDisplayName = (profile: UserProfile) => {
    const name = profile.first_name
      ? (profile.last_name ? `${profile.first_name} ${profile.last_name}` : profile.first_name)
      : 'Без имени';
    const type = profile.type === 'child' ? 'ребёнок' : 'взрослый';
    return `${name} (${type})`;
  };

  const selectedType = appointmentTypes?.find(t => t.id === selectedTypeId);

  // Проверяем, является ли выбранный тип повторной встречей с координатором
  const isCoordinatorFollowup = selectedType?.name === COORDINATOR_FOLLOWUP_TYPE;

  // Фильтруем специалистов по типу консультации
  const availableSpecialists = specialists.filter(s => {
    // Базовая фильтрация по доступности
    if (!s.accepts_new_clients) return false;

    // Если выбран тип консультации - фильтруем по специализации
    if (selectedType) {
      // Особая логика для повторной встречи с координатором
      if (isCoordinatorFollowup) {
        // Показываем ТОЛЬКО назначенного координатора клиента
        return s.id === clientCoordinatorId;
      }

      const requiredSpecs = APPOINTMENT_TYPE_SPECIALIZATIONS[selectedType.name] || [];
      // Если нет маппинга - показываем всех доступных специалистов
      if (requiredSpecs.length === 0) return true;
      // Проверяем, есть ли у специалиста хотя бы одна из требуемых специализаций
      return s.specialization_codes.some(code => requiredSpecs.includes(code));
    }

    return true;
  });

  // Вычисляем московское время для выбранной даты и времени
  const getMoscowTime = () => {
    if (!selectedDate || !selectedTime) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const localDateTime = new Date(selectedDate);
    localDateTime.setHours(hours, minutes, 0, 0);

    // Форматируем время в московском часовом поясе
    return localDateTime.toLocaleTimeString('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Вычисляем время клиента, если есть регион
  const getClientTime = () => {
    if (!selectedDate || !selectedTime || !selectedUser?.region) return null;
    const clientTimezone = REGION_TIMEZONES[selectedUser.region];
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

  // Если уже создали запись - показываем результат
  if (creationResult) {
    // Для бесплатных записей - другой результат
    if (creationResult.is_free) {
      return (
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Бесплатная запись создана
              </DialogTitle>
              <DialogDescription>
                {sendEmail ? 'Подтверждение отправлено клиенту на email' : 'Запись успешно создана'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Запись создана и подтверждена. Клиенту не требуется оплата.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Закрыть
              </Button>
              <Button onClick={resetState}>
                Создать ещё
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    // Для платных записей - показываем ссылку на оплату
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Запись создана
            </DialogTitle>
            <DialogDescription>
              Ссылка на оплату {sendEmail ? 'отправлена клиенту' : 'готова для копирования'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <Link2 className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-2">
                <span className="font-medium">Ссылка на оплату:</span>
                <code className="text-xs bg-muted p-2 rounded block break-all">
                  {creationResult.payment_url}
                </code>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={copyPaymentUrl} variant="outline" className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Скопировать
              </Button>
              <Button
                onClick={() => window.open(creationResult.payment_url, '_blank')}
                variant="outline"
                className="flex-1"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Открыть
              </Button>
            </div>

            {creationResult.expires_at && (
              <div className="text-sm text-muted-foreground">
                <p>Срок оплаты: {format(new Date(creationResult.expires_at), 'd MMMM yyyy, HH:mm', { locale: ru })} (МСК)</p>
                <p className="mt-1">После истечения срока запись будет автоматически отменена.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Закрыть
            </Button>
            <Button onClick={resetState}>
              Создать ещё
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Создать запись с оплатой</DialogTitle>
          <DialogDescription>
            Создайте запись для клиента и отправьте ссылку на оплату
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Поиск пользователя */}
            <div className="space-y-3">
              <Label>Клиент</Label>

              {!selectedUser ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск по email, телефону или имени..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {isSearching && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Поиск...
                    </div>
                  )}

                  {searchResults && searchResults.length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          className="w-full p-3 text-left hover:bg-muted/50 border-b last:border-b-0 flex items-center gap-3"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchQuery('');
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{getUserDisplayName(user)}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">{user.email || user.phone || '—'}</span>
                              {user.region && (
                                <span className="flex items-center gap-1 shrink-0">
                                  <MapPin className="w-3 h-3" />
                                  {user.region}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 && !isSearching && searchResults?.length === 0 && (
                    <p className="text-sm text-muted-foreground">Пользователи не найдены</p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{getUserDisplayName(selectedUser)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{selectedUser.email || selectedUser.phone || '—'}</span>
                      {selectedUser.region && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-background rounded">
                          <MapPin className="w-3 h-3" />
                          {selectedUser.region}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    Изменить
                  </Button>
                </div>
              )}
            </div>

            {/* Выбор профиля (если есть) */}
            {selectedUser && userProfiles && userProfiles.length > 0 && (
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
                      {userProfiles.map((profile) => (
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
              <Label>Тип консультации</Label>
              {isLoadingTypes ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Загрузка...
                </div>
              ) : (
                <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} — {type.price} ₽
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedType && (
                <p className="text-xs text-muted-foreground">
                  Продолжительность: {selectedType.duration_minutes} мин. • Стоимость: {selectedType.price} ₽
                </p>
              )}
            </div>

            {/* Выбор специалиста (опционально) */}
            <div className="space-y-2">
              <Label>Специалист (опционально)</Label>
              <Select value={selectedSpecialist || '__none__'} onValueChange={(v) => setSelectedSpecialist(v === '__none__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Назначить позже" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Назначить позже</SelectItem>
                  {availableSpecialists.length > 0 ? (
                    availableSpecialists.map((specialist) => (
                      <SelectItem key={specialist.id} value={specialist.id}>
                        <div className="flex items-center gap-2">
                          <span>{specialist.display_name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({specialist.current_clients_count}/{specialist.max_clients})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_specialists__" disabled>
                      Нет доступных специалистов
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedType && availableSpecialists.length === 0 && (
                <p className="text-xs text-amber-600">
                  {isCoordinatorFollowup && !clientCoordinatorId
                    ? 'У клиента нет назначенного координатора. Сначала проведите первичную встречу и назначьте координатора.'
                    : `Нет доступных специалистов для типа «${selectedType.name}». Можно назначить позже.`}
                </p>
              )}
            </div>

            {/* Дата и время */}
            <div className="space-y-3">
              <Label>Дата и время</Label>

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
                  {selectedUser?.region && getClientTime() && getMoscowTime() !== getClientTime() && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedUser.region}: {getClientTime()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Отправка email */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="cursor-pointer">Отправить email</Label>
                  <p className="text-xs text-muted-foreground">
                    Ссылка на оплату будет отправлена клиенту
                  </p>
                </div>
              </div>
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
            </div>

            {/* Предупреждение о сроке оплаты */}
            <Alert>
              <AlertDescription className="text-sm">
                После создания записи клиенту будет дано <strong>24 часа</strong> на оплату.
                Если оплата не поступит — запись автоматически отменится.
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={createAppointmentMutation.isPending}>
            Отмена
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canCreate || createAppointmentMutation.isPending}
          >
            {createAppointmentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Создание...
              </>
            ) : (
              'Создать запись'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

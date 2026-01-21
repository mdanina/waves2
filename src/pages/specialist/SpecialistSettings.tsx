/**
 * Страница настроек специалиста
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Shield,
  Clock,
  Monitor,
  Mail,
  Loader2,
  Save,
  Coffee,
  Brain,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { supabase } from '@/lib/supabase';
import { getMySchedule, saveSchedule } from '@/lib/supabase-specialist-schedule';
import { TemplatesManager } from '@/components/specialist/TemplatesManager';

export default function SpecialistSettings() {
  const { toast } = useToast();
  const { specialistUser, refreshSpecialistProfile } = useSpecialistAuth();
  const specialist = specialistUser?.specialist;

  // Уведомления (загружаются из профиля специалиста)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [newClientNotifications, setNewClientNotifications] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Загружаем настройки уведомлений из профиля
  useEffect(() => {
    if (specialist?.notification_settings) {
      setEmailNotifications(specialist.notification_settings.email_notifications ?? true);
      setAppointmentReminders(specialist.notification_settings.appointment_reminders ?? true);
      setNewClientNotifications(specialist.notification_settings.new_client_notifications ?? true);
    }
  }, [specialist?.notification_settings]);

  // Безопасность
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Рабочие часы
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [workDays, setWorkDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [breakStartTime, setBreakStartTime] = useState('');
  const [breakEndTime, setBreakEndTime] = useState('');
  const [slotDuration, setSlotDuration] = useState(60);
  const [bufferTime, setBufferTime] = useState(15);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

  // Загрузка расписания при монтировании
  useEffect(() => {
    loadSchedule();
  }, []);

  // Сохранение настроек уведомлений
  const handleSaveNotifications = async () => {
    if (!specialist?.id) return;

    try {
      setIsSavingNotifications(true);

      const { error } = await supabase
        .from('specialists')
        .update({
          notification_settings: {
            email_notifications: emailNotifications,
            appointment_reminders: appointmentReminders,
            new_client_notifications: newClientNotifications,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', specialist.id);

      if (error) throw error;

      // Обновляем данные в контексте
      await refreshSpecialistProfile();

      toast({
        title: 'Настройки сохранены',
        description: 'Настройки уведомлений успешно обновлены',
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки уведомлений',
        variant: 'destructive',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const loadSchedule = async () => {
    try {
      setIsLoadingSchedule(true);
      const schedule = await getMySchedule();

      if (schedule) {
        setWorkStartTime(schedule.work_start_time.slice(0, 5));
        setWorkEndTime(schedule.work_end_time.slice(0, 5));
        setWorkDays(schedule.work_days);
        setBreakStartTime(schedule.break_start_time?.slice(0, 5) || '');
        setBreakEndTime(schedule.break_end_time?.slice(0, 5) || '');
        setSlotDuration(schedule.default_slot_duration);
        setBufferTime(schedule.buffer_between_appointments);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (workDays.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите хотя бы один рабочий день',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSavingSchedule(true);

      await saveSchedule({
        workStartTime,
        workEndTime,
        workDays,
        breakStartTime: breakStartTime || null,
        breakEndTime: breakEndTime || null,
        defaultSlotDuration: slotDuration,
        bufferBetweenAppointments: bufferTime,
      });

      toast({
        title: 'Расписание сохранено',
        description: 'Ваше рабочее расписание успешно обновлено',
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить расписание',
        variant: 'destructive',
      });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен содержать минимум 8 символов',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsChangingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Пароль изменён',
        description: 'Ваш пароль успешно обновлён',
      });

      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить пароль',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const toggleWorkDay = (day: string) => {
    setWorkDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const dayLabels: Record<string, string> = {
    mon: 'Пн',
    tue: 'Вт',
    wed: 'Ср',
    thu: 'Чт',
    fri: 'Пт',
    sat: 'Сб',
    sun: 'Вс',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-muted-foreground">
          Управление настройками аккаунта и предпочтениями
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Расписание
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Безопасность
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Шаблоны AI
          </TabsTrigger>
        </TabsList>

        {/* Уведомления */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email-уведомления
              </CardTitle>
              <CardDescription>
                Настройте какие уведомления вы хотите получать на почту
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Уведомления о записях</Label>
                  <p className="text-sm text-muted-foreground">
                    Получать уведомления о новых записях от клиентов
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Напоминания о консультациях</Label>
                  <p className="text-sm text-muted-foreground">
                    Получать напоминания за 30 минут до консультации
                  </p>
                </div>
                <Switch
                  checked={appointmentReminders}
                  onCheckedChange={setAppointmentReminders}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Новые клиенты</Label>
                  <p className="text-sm text-muted-foreground">
                    Уведомления о назначении новых клиентов
                  </p>
                </div>
                <Switch
                  checked={newClientNotifications}
                  onCheckedChange={setNewClientNotifications}
                />
              </div>
              <Separator />
              <Button
                onClick={handleSaveNotifications}
                disabled={isSavingNotifications}
              >
                {isSavingNotifications ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить настройки
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Расписание */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Рабочие часы
              </CardTitle>
              <CardDescription>
                Укажите ваши рабочие часы для отображения доступных слотов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingSchedule ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start-time">Начало рабочего дня</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={workStartTime}
                        onChange={(e) => setWorkStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-time">Конец рабочего дня</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={workEndTime}
                        onChange={(e) => setWorkEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Рабочие дни</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(dayLabels).map(([key, label]) => (
                        <Button
                          key={key}
                          variant={workDays.includes(key) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleWorkDay(key)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-muted-foreground" />
                      <Label>Перерыв (опционально)</Label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="break-start">Начало перерыва</Label>
                        <Input
                          id="break-start"
                          type="time"
                          value={breakStartTime}
                          onChange={(e) => setBreakStartTime(e.target.value)}
                          placeholder="Например, 13:00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="break-end">Конец перерыва</Label>
                        <Input
                          id="break-end"
                          type="time"
                          value={breakEndTime}
                          onChange={(e) => setBreakEndTime(e.target.value)}
                          placeholder="Например, 14:00"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="slot-duration">Длительность консультации (мин)</Label>
                      <Input
                        id="slot-duration"
                        type="number"
                        min={15}
                        max={180}
                        step={15}
                        value={slotDuration}
                        onChange={(e) => setSlotDuration(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buffer-time">Перерыв между консультациями (мин)</Label>
                      <Input
                        id="buffer-time"
                        type="number"
                        min={0}
                        max={60}
                        step={5}
                        value={bufferTime}
                        onChange={(e) => setBufferTime(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveSchedule}
                    disabled={isSavingSchedule}
                  >
                    {isSavingSchedule ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Сохранить расписание
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Безопасность */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Изменение пароля
              </CardTitle>
              <CardDescription>
                Измените пароль для входа в аккаунт
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Новый пароль</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Изменить пароль'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Активные сессии</CardTitle>
              <CardDescription>
                Управление активными сессиями на других устройствах
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Текущее устройство</p>
                    <p className="text-sm text-muted-foreground">
                      Активна сейчас
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Текущая
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Шаблоны AI */}
        <TabsContent value="templates" className="space-y-4">
          <TemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

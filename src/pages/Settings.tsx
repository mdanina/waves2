/**
 * Страница настроек профиля клиента
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  Shield,
  User,
  MapPin,
  Clock,
  Mail,
  Phone,
  Loader2,
  Save,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getCurrentUserData, updateUserData } from '@/lib/userStorage';
import { TIMEZONES, getUserTimezone } from '@/lib/moscowTime';
import { PushNotificationSettings } from '@/components/settings/PushNotificationSettings';
import { TelegramNotificationSettings } from '@/components/settings/TelegramNotificationSettings';
import { SerifHeading } from '@/components/ui/serif-heading';

// Регионы (тот же список, что в RegionSelect)
const REGIONS = [
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Самара",
  "Омск",
  "Ростов-на-Дону",
  "Уфа",
  "Красноярск",
  "Воронеж",
  "Пермь",
  "Волгоград",
];

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  // Получаем таб из URL параметра
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Личные данные
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Безопасность
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Уведомления
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Регион и часовой пояс
  const [region, setRegion] = useState('');
  const [timezone, setTimezone] = useState('');
  const [isSavingRegion, setIsSavingRegion] = useState(false);

  // Загрузка данных пользователя
  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setIsLoadingProfile(true);

      // Получаем данные из users таблицы
      const userData = await getCurrentUserData();

      if (userData) {
        setEmail(user.email || '');
        setPhone(userData.phone || '');
        setRegion(userData.region || '');
        setEmailNotifications(userData.marketing_consent ?? true);
      }

      // Получаем настройки часового пояса из localStorage
      const savedTimezone = localStorage.getItem('user_timezone');
      setTimezone(savedTimezone || getUserTimezone());
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Сохранение email
  const handleSaveEmail = async () => {
    if (!email || email === user?.email) return;

    try {
      setIsSavingProfile(true);

      // Обновляем email в auth.users (требует подтверждения)
      const { error: authError } = await supabase.auth.updateUser({
        email: email,
      });

      if (authError) throw authError;

      // Также обновляем email в public.users для синхронизации с админкой и специалистом
      await updateUserData({ email });

      toast({
        title: 'Подтвердите email',
        description: 'На новый адрес отправлено письмо для подтверждения',
      });
    } catch (error) {
      console.error('Error updating email:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить email',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Сохранение телефона
  const handleSavePhone = async () => {
    if (!phone) return;

    try {
      setIsSavingProfile(true);

      await updateUserData({ phone });

      toast({
        title: 'Телефон сохранён',
        description: 'Номер телефона успешно обновлён',
      });
    } catch (error) {
      console.error('Error updating phone:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить телефон',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Смена пароля
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

  // Сохранение настроек уведомлений
  const handleSaveNotifications = async () => {
    try {
      setIsSavingNotifications(true);

      await updateUserData({
        marketing_consent: emailNotifications,
      });

      toast({
        title: 'Настройки сохранены',
        description: 'Настройки уведомлений обновлены',
      });
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Сохранение региона и часового пояса
  const handleSaveRegion = async () => {
    try {
      setIsSavingRegion(true);

      await updateUserData({ region });

      // Сохраняем часовой пояс в localStorage
      localStorage.setItem('user_timezone', timezone);

      toast({
        title: 'Настройки сохранены',
        description: 'Регион и часовой пояс обновлены',
      });
    } catch (error) {
      console.error('Error saving region:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    } finally {
      setIsSavingRegion(false);
    }
  };

  const backgroundStyle = {
    background: 'var(--bg-golden-hour)',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
  };

  if (isLoadingProfile) {
    return (
      <div style={backgroundStyle} className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div style={backgroundStyle}>
      {/* Main Content */}
      <div className="container mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <SerifHeading size="2xl" className="mb-2">
            Настройки
          </SerifHeading>
          <p className="text-muted-foreground">
            Управление профилем и предпочтениями
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Уведомления</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Безопасность</span>
            </TabsTrigger>
            <TabsTrigger value="region" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Регион</span>
            </TabsTrigger>
          </TabsList>

          {/* Профиль */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email
                </CardTitle>
                <CardDescription>
                  Адрес электронной почты для входа и уведомлений
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                  />
                </div>
                <Button
                  onClick={handleSaveEmail}
                  disabled={isSavingProfile || email === user?.email}
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Изменить email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Телефон
                </CardTitle>
                <CardDescription>
                  Номер телефона для связи
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <Button
                  onClick={handleSavePhone}
                  disabled={isSavingProfile || !phone}
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Сохранить телефон
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Уведомления */}
          <TabsContent value="notifications" className="space-y-4">
            {/* Push-уведомления */}
            <PushNotificationSettings />

            {/* Telegram */}
            <TelegramNotificationSettings />

            {/* Инструкция по установке PWA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                  Установить приложение
                </CardTitle>
                <CardDescription>
                  Добавьте Waves на главный экран для быстрого доступа
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">На iPhone / iPad:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Откройте сайт в Safari</li>
                    <li>Нажмите кнопку «Поделиться» (квадрат со стрелкой вверх внизу экрана)</li>
                    <li>Пролистайте вниз и нажмите «На экран Домой»</li>
                    <li>Нажмите «Добавить»</li>
                  </ol>

                  <p className="font-medium text-foreground pt-2">На Android:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Откройте сайт в Chrome</li>
                    <li>Нажмите три точки в правом верхнем углу</li>
                    <li>Выберите «Добавить на главный экран» или «Установить приложение»</li>
                    <li>Подтвердите установку</li>
                  </ol>

                  <p className="pt-2 text-xs">
                    После установки приложение будет работать как обычное приложение на вашем телефоне.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Email-уведомления */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email-уведомления
                </CardTitle>
                <CardDescription>
                  Уведомления на электронную почту
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Маркетинговые рассылки</Label>
                    <p className="text-sm text-muted-foreground">
                      Новости, акции и полезные материалы
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
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
                <CardTitle>Выход из аккаунта</CardTitle>
                <CardDescription>
                  Завершить текущую сессию
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => {
                    signOut();
                    navigate('/');
                  }}
                >
                  Выйти из аккаунта
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Регион и часовой пояс */}
          <TabsContent value="region" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Регион
                </CardTitle>
                <CardDescription>
                  Ваше местоположение для подбора специалистов
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Регион проживания</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Выберите регион" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Часовой пояс
                </CardTitle>
                <CardDescription>
                  Время консультаций будет отображаться в вашем часовом поясе
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Часовой пояс</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Выберите часовой пояс" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSaveRegion}
                  disabled={isSavingRegion}
                >
                  {isSavingRegion ? (
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
        </Tabs>
      </div>
    </div>
  );
}

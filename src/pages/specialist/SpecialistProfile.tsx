/**
 * Страница профиля специалиста
 * Редактирование личной информации и публичного профиля
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  Camera,
  Loader2,
  Save,
  Globe,
  Video,
  ExternalLink,
  Star,
} from 'lucide-react';
import EducationEditor from '@/components/specialist/EducationEditor';
import { useToast } from '@/hooks/use-toast';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Разрешённые видеохостинги (российские + международные на случай VPN)
const ALLOWED_VIDEO_HOSTS = [
  // Российские
  'rutube.ru',
  'vk.com',
  'vkvideo.ru',
  'dzen.ru',
  'ok.ru',
  'my.mail.ru',
  'kinescope.io',
  // Международные (на случай если заработают)
  'youtube.com',
  'youtu.be',
  'vimeo.com',
];

/**
 * Валидатор URL видео с whitelist доменов
 * Защищает от javascript:, data:, file:// и других опасных схем
 */
function isAllowedVideoUrl(url: string): boolean {
  if (!url) return true; // Пустой URL разрешён

  try {
    const parsed = new URL(url);

    // Только HTTPS (или HTTP для локальной разработки)
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return false;
    }

    // Проверяем hostname по whitelist
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_VIDEO_HOSTS.some(allowed =>
      hostname === allowed || hostname.endsWith('.' + allowed)
    );
  } catch {
    return false;
  }
}

// Схема валидации профиля
const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(100, 'Имя слишком длинное (максимум 100 символов)'),
  bio: z
    .string()
    .max(2000, 'Описание слишком длинное (максимум 2000 символов)')
    .optional()
    .or(z.literal('')),
  experienceYears: z
    .number()
    .min(0, 'Опыт не может быть отрицательным')
    .max(70, 'Некорректное значение опыта')
    .optional()
    .nullable(),
  videoIntroUrl: z
    .string()
    .refine(isAllowedVideoUrl, {
      message: 'Разрешены только ссылки с: Rutube, VK Video, Дзен, OK.ru, Kinescope, YouTube, Vimeo',
    })
    .optional()
    .or(z.literal('')),
});

// Направления работы (темы, с которыми работает специалист)
const WORK_DIRECTIONS = [
  { code: 'child_psychology', label: 'Детская психология' },
  { code: 'family_therapy', label: 'Семейная терапия' },
  { code: 'cbt', label: 'КПТ' },
  { code: 'trauma', label: 'Работа с травмой' },
  { code: 'anxiety', label: 'Тревожные расстройства' },
  { code: 'depression', label: 'Депрессия' },
  { code: 'adhd', label: 'СДВГ' },
  { code: 'autism', label: 'Аутизм' },
  { code: 'eating_disorders', label: 'Расстройства питания' },
  { code: 'parenting', label: 'Родительство' },
];

// Интерфейс специализации из БД
interface Specialization {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export default function SpecialistProfile() {
  const { toast } = useToast();
  const { specialistUser, refreshSpecialistProfile } = useSpecialistAuth();
  const specialist = specialistUser?.specialist;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Форма профиля
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [selectedWorkDirections, setSelectedWorkDirections] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [acceptsNewClients, setAcceptsNewClients] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [videoIntroUrl, setVideoIntroUrl] = useState('');

  // Специализации из БД
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<string | null>(null);

  // Загрузка специализаций из БД
  useEffect(() => {
    const loadSpecializations = async () => {
      const { data, error } = await supabase
        .from('specializations')
        .select('id, code, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error loading specializations:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить список специализаций',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        setSpecializations(data);
      }
    };
    loadSpecializations();
  }, [toast]);

  // Загрузка данных профиля
  useEffect(() => {
    if (specialist) {
      setDisplayName(specialist.display_name || '');
      setBio(specialist.bio || '');
      setExperienceYears(specialist.experience_years || '');
      setSelectedWorkDirections(specialist.specialization_codes || []);
      setIsAvailable(specialist.is_available);
      setAcceptsNewClients(specialist.accepts_new_clients);
      setAvatarUrl(specialist.avatar_url || null);
      setVideoIntroUrl(specialist.video_intro_url || '');
      setSelectedSpecializationId(specialist.specialization_id || null);
    }
  }, [specialist]);

  // Загрузка аватара
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !specialistUser) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, выберите изображение',
        variant: 'destructive',
      });
      return;
    }

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ошибка',
        description: 'Файл слишком большой. Максимум 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingAvatar(true);

      // Генерируем уникальное имя файла
      const fileExt = file.name.split('.').pop();
      const fileName = `${specialistUser.id}/${Date.now()}.${fileExt}`;

      // Загружаем файл
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = urlData.publicUrl;

      // Обновляем в базе
      const { error: updateError } = await supabase
        .from('specialists')
        .update({
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', specialist!.id);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      await refreshSpecialistProfile();

      toast({
        title: 'Аватар обновлён',
        description: 'Новое фото успешно загружено',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить фото',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      // Сбрасываем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Переключение направления работы
  const toggleWorkDirection = (code: string) => {
    setSelectedWorkDirections(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  // Сохранение профиля с валидацией
  const handleSave = async () => {
    if (!specialist) return;

    // Валидация данных
    const validationResult = profileSchema.safeParse({
      displayName,
      bio,
      experienceYears: experienceYears === '' ? null : experienceYears,
      videoIntroUrl,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      toast({
        title: 'Ошибка валидации',
        description: firstError.message,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('specialists')
        .update({
          display_name: displayName,
          bio: bio || null,
          experience_years: experienceYears || null,
          specialization_id: selectedSpecializationId,
          specialization_codes: selectedWorkDirections,
          is_available: isAvailable,
          accepts_new_clients: acceptsNewClients,
          video_intro_url: videoIntroUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', specialist.id);

      if (error) throw error;

      // Обновляем данные в контексте
      await refreshSpecialistProfile();

      toast({
        title: 'Профиль обновлён',
        description: 'Изменения успешно сохранены',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изменения',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Получить инициалы
  const getInitials = () => {
    if (displayName) {
      const parts = displayName.split(' ');
      return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
    return specialistUser?.email?.[0]?.toUpperCase() || '?';
  };

  if (!specialist) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Мой профиль</h1>
        <p className="text-muted-foreground">
          Управление личной информацией и публичным профилем
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Боковая панель - Аватар и статус */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <h2 className="mt-4 text-xl font-semibold">
                {displayName || specialistUser?.email}
              </h2>
              <p className="text-sm text-muted-foreground">
                {specialistUser?.email}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge variant={isAvailable ? 'default' : 'secondary'}>
                  {isAvailable ? 'Доступен' : 'Не в сети'}
                </Badge>
                {acceptsNewClients && (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    Принимает клиентов
                  </Badge>
                )}
              </div>

              {/* Рейтинг */}
              {specialist.rating_count > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(specialist.rating_avg || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-none text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold">
                        {(specialist.rating_avg || 0).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      {specialist.rating_count}{' '}
                      {(() => {
                        const count = specialist.rating_count || 0;
                        const lastDigit = count % 10;
                        const lastTwoDigits = count % 100;
                        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'оценок';
                        if (lastDigit === 1) return 'оценка';
                        if (lastDigit >= 2 && lastDigit <= 4) return 'оценки';
                        return 'оценок';
                      })()}
                    </p>
                  </div>
                </>
              )}

              <Separator className="my-4" />

              <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>Статус онлайн</span>
                  </div>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={setIsAvailable}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Новые клиенты</span>
                  </div>
                  <Switch
                    checked={acceptsNewClients}
                    onCheckedChange={setAcceptsNewClients}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Основная форма */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Информация профиля</CardTitle>
            <CardDescription>
              Эта информация будет отображаться клиентам
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Имя */}
            <div className="space-y-2">
              <Label htmlFor="display-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Отображаемое имя
              </Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Как вас будут видеть клиенты"
              />
            </div>

            {/* О себе */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                О себе
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите о своём опыте, подходе к работе, образовании..."
                rows={4}
              />
            </div>

            {/* Опыт работы */}
            <div className="space-y-2">
              <Label htmlFor="experience" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Опыт работы (лет)
              </Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Количество лет опыта"
                className="w-32"
              />
            </div>

            {/* Специализация (из справочника БД) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Специализация
              </Label>
              <select
                value={selectedSpecializationId || ''}
                onChange={(e) => setSelectedSpecializationId(e.target.value || null)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Выберите специализацию</option>
                {specializations.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Основная профессиональная специализация
              </p>
            </div>

            {/* Направления работы */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Направления работы
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Темы и запросы, с которыми вы работаете
              </p>
              <div className="flex flex-wrap gap-2">
                {WORK_DIRECTIONS.map((dir) => (
                  <Badge
                    key={dir.code}
                    variant={selectedWorkDirections.includes(dir.code) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleWorkDirection(dir.code)}
                  >
                    {dir.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Видеовизитка */}
            <div className="space-y-2">
              <Label htmlFor="video-intro" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Видеовизитка
              </Label>
              <Input
                id="video-intro"
                value={videoIntroUrl}
                onChange={(e) => setVideoIntroUrl(e.target.value)}
                placeholder="https://rutube.ru/video/... или https://vk.com/video..."
              />
              <p className="text-xs text-muted-foreground">
                Поддерживаются: Rutube, VK Video, Дзен, OK.ru, Kinescope, YouTube, Vimeo.
              </p>
              {videoIntroUrl && (
                <a
                  href={videoIntroUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Открыть видео
                </a>
              )}
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить изменения
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Контактная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Контактная информация</CardTitle>
          <CardDescription>
            Информация из вашего аккаунта (только для чтения)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{specialistUser?.email || 'Не указан'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-medium">Не указан</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Образование */}
      <EducationEditor specialistId={specialist.id} />
    </div>
  );
}

/**
 * Компонент карточки профиля специалиста для клиента
 * Показывает информацию о специалисте без контактных данных
 * Включает возможность запросить смену специалиста
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  GraduationCap,
  Briefcase,
  Video,
  Play,
  RefreshCw,
  Loader2,
  Building2,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Специализации с их локализованными названиями
const SPECIALIZATIONS_MAP: Record<string, string> = {
  child_psychology: 'Детская психология',
  family_therapy: 'Семейная терапия',
  cbt: 'КПТ',
  trauma: 'Работа с травмой',
  anxiety: 'Тревожные расстройства',
  depression: 'Депрессия',
  adhd: 'СДВГ',
  autism: 'Аутизм',
  eating_disorders: 'Расстройства питания',
  parenting: 'Родительство',
  psychologist: 'Психолог',
  psychiatrist: 'Психиатр',
  psychotherapist: 'Психотерапевт',
  clinical_psychologist: 'Клинический психолог',
  child_psychologist: 'Детский психолог',
  family_therapist: 'Семейный терапевт',
  neuropsychologist: 'Нейропсихолог',
  logopedist: 'Логопед',
  defectologist: 'Дефектолог',
  art_therapist: 'Арт-терапевт',
  cbt_specialist: 'Специалист по КПТ',
  coordinator: 'Координатор',
};

const EDUCATION_TYPES: Record<string, string> = {
  higher: 'Высшее образование',
  additional: 'Дополнительное образование',
  certification: 'Сертификация',
  course: 'Курс',
};

interface SpecialistData {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  experience_years: number | null;
  specialization_codes: string[];
  video_intro_url: string | null;
  is_available: boolean;
  rating_avg: number | null;
  rating_count: number | null;
}

interface EducationData {
  id: string;
  institution: string;
  specialty: string | null;
  degree: string | null;
  year_start: number | null;
  year_end: number | null;
  education_type: string;
}

interface SpecialistProfileCardProps {
  specialistId?: string;
  showChangeButton?: boolean;
  onSpecialistChange?: () => void;
}

export default function SpecialistProfileCard({
  specialistId,
  showChangeButton = true,
  onSpecialistChange,
}: SpecialistProfileCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [specialist, setSpecialist] = useState<SpecialistData | null>(null);
  const [education, setEducation] = useState<EducationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  // Загрузка данных специалиста
  useEffect(() => {
    loadSpecialistData();
  }, [specialistId, user]);

  const loadSpecialistData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      let specialistData: SpecialistData | null = null;

      if (specialistId) {
        // Если передан ID специалиста, загружаем его напрямую
        const { data, error } = await supabase
          .from('specialists')
          .select('*')
          .eq('id', specialistId)
          .single();

        if (error) throw error;
        specialistData = data;
      } else {
        // Иначе ищем назначенного специалиста через client_assignments
        const { data: assignment, error: assignmentError } = await supabase
          .from('client_assignments')
          .select('specialist_id')
          .eq('client_user_id', user.id)
          .eq('status', 'active')
          .single();

        if (assignmentError) {
          if (assignmentError.code === 'PGRST116') {
            // Нет назначенного специалиста
            setSpecialist(null);
            setIsLoading(false);
            return;
          }
          throw assignmentError;
        }

        const { data, error } = await supabase
          .from('specialists')
          .select('*')
          .eq('id', assignment.specialist_id)
          .single();

        if (error) throw error;
        specialistData = data;
      }

      setSpecialist(specialistData);

      // Загружаем образование специалиста
      if (specialistData) {
        const { data: educationData } = await supabase
          .from('specialist_education')
          .select('*')
          .eq('specialist_id', specialistData.id)
          .order('year_end', { ascending: false, nullsFirst: false });

        setEducation(educationData || []);

        // Проверяем наличие pending запроса на смену
        const { data: pendingRequest } = await supabase
          .from('specialist_change_requests')
          .select('id')
          .eq('client_user_id', user.id)
          .eq('status', 'pending')
          .single();

        setHasPendingRequest(!!pendingRequest);
      }
    } catch (error) {
      console.error('Error loading specialist data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные специалиста',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Извлечение YouTube/Vimeo video ID для embed
  const getVideoEmbedUrl = (url: string): string | null => {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
  };

  // Запрос на смену специалиста
  const handleChangeRequest = async () => {
    if (!user || !specialist) return;

    try {
      setIsSubmittingChange(true);

      const { error } = await supabase.from('specialist_change_requests').insert({
        client_user_id: user.id,
        current_specialist_id: specialist.id,
        reason: changeReason || null,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Запрос отправлен',
        description: 'Координатор рассмотрит ваш запрос на смену специалиста',
      });

      setIsChangeDialogOpen(false);
      setChangeReason('');
      setHasPendingRequest(true);
      onSpecialistChange?.();
    } catch (error) {
      console.error('Error submitting change request:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить запрос',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingChange(false);
    }
  };

  // Получить инициалы
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  };

  // Форматировать годы образования
  const formatYears = (start: number | null, end: number | null) => {
    if (start && end) return `${start} - ${end}`;
    if (end) return `${end}`;
    if (start) return `с ${start}`;
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!specialist) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Вам пока не назначен специалист. После установочной встречи координатор
            подберёт для вас подходящего специалиста.
          </p>
        </CardContent>
      </Card>
    );
  }

  const videoEmbedUrl = specialist.video_intro_url
    ? getVideoEmbedUrl(specialist.video_intro_url)
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Ваш специалист
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Основная информация */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={specialist.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {getInitials(specialist.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{specialist.display_name}</h3>
              {specialist.experience_years && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Briefcase className="h-4 w-4" />
                  Опыт работы: {specialist.experience_years} лет
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={specialist.is_available ? 'default' : 'secondary'}>
                  {specialist.is_available ? 'Доступен' : 'Не в сети'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Специализации */}
          {specialist.specialization_codes.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Специализации:</p>
              <div className="flex flex-wrap gap-2">
                {specialist.specialization_codes.map((code) => (
                  <Badge key={code} variant="outline">
                    {SPECIALIZATIONS_MAP[code] || code}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Описание */}
          {specialist.bio && (
            <div>
              <p className="text-sm font-medium mb-2">О специалисте:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {specialist.bio}
              </p>
            </div>
          )}

          {/* Видеовизитка */}
          {specialist.video_intro_url && (
            <div>
              <p className="text-sm font-medium mb-2">Видеовизитка:</p>
              <Button
                variant="outline"
                onClick={() => setIsVideoOpen(true)}
                className="w-full sm:w-auto"
              >
                <Play className="mr-2 h-4 w-4" />
                Смотреть видео
              </Button>
            </div>
          )}

          {/* Образование */}
          {education.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Образование:
              </p>
              <div className="space-y-3">
                {education.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-muted/50 rounded-lg space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{item.institution}</span>
                    </div>
                    {item.specialty && (
                      <p className="text-sm text-muted-foreground pl-6">
                        {item.specialty}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pl-6">
                      {formatYears(item.year_start, item.year_end) && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatYears(item.year_start, item.year_end)}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-muted rounded">
                        {EDUCATION_TYPES[item.education_type] || item.education_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка смены специалиста */}
          {showChangeButton && (
            <>
              <Separator />
              {hasPendingRequest ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Ваш запрос на смену специалиста рассматривается</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsChangeDialogOpen(true)}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Запросить смену специалиста
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Диалог видео */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-3xl w-[90vw] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Видеовизитка {specialist.display_name}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {videoEmbedUrl ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={videoEmbedUrl}
                  title="Видеовизитка специалиста"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Видео доступно по{' '}
                  <a
                    href={specialist.video_intro_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    ссылке
                  </a>
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог запроса смены */}
      <Dialog open={isChangeDialogOpen} onOpenChange={setIsChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Запросить смену специалиста</DialogTitle>
            <DialogDescription>
              Если вы чувствуете, что текущий специалист вам не подходит, вы можете
              запросить смену. Координатор подберет вам другого специалиста.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="change-reason">
                Причина смены (необязательно)
              </Label>
              <Textarea
                id="change-reason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Опишите, почему вы хотите сменить специалиста..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Это поможет координатору лучше подобрать нового специалиста
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeDialogOpen(false)}
              disabled={isSubmittingChange}
            >
              Отмена
            </Button>
            <Button onClick={handleChangeRequest} disabled={isSubmittingChange}>
              {isSubmittingChange ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Отправить запрос'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

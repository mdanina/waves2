import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search, User, Loader2, Users, ExternalLink, Video, Calendar, Clock, CreditCard,
  Copy, FileText, KeyRound, Download, Check, Edit, UserCog, RefreshCw, Eye
} from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getDocumentUrl, getCategoryLabel } from '@/lib/supabase-client-documents';

// Типы назначений
const assignmentTypeLabels: Record<string, string> = {
  primary: 'Основной',
  consultant: 'Консультант',
  temporary: 'Временный',
};

// Функция для расчёта возраста
function calculateAge(dob: string | null): string | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Для детей до года показываем месяцы
  if (age < 1) {
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 +
                   (today.getMonth() - birthDate.getMonth());
    return `${months} мес.`;
  }

  // Склонение слова "год"
  const lastDigit = age % 10;
  const lastTwoDigits = age % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${age} лет`;
  }
  if (lastDigit === 1) {
    return `${age} год`;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${age} года`;
  }
  return `${age} лет`;
}

// Названия категорий для оценок
const categoryNames: Record<string, string> = {
  // v2 checkup categories
  emotion_regulation: 'Регуляция эмоций',
  behavior: 'Поведение',
  executive_functions: 'Исполнительные функции',
  sensory_processing: 'Сенсорная обработка',
  communication: 'Коммуникация и речь',
  social_cognition: 'Социальное познание',
  identity: 'Самооценка',
  learning: 'Обучение',
  motivation: 'Мотивация',
  trauma: 'Травматический опыт',
  // SDQ legacy
  emotional: 'Эмоциональные симптомы',
  conduct: 'Проблемы поведения',
  hyperactivity: 'Гиперактивность',
  peer_problems: 'Проблемы со сверстниками',
  prosocial: 'Просоциальное поведение',
  total_difficulties: 'Общие трудности',
  // Parent
  anxiety: 'Тревожность',
  depression: 'Депрессия',
  total_score: 'Общий балл',
  // Family
  family_stress: 'Семейный стресс',
  partner_relationship: 'Отношения с партнёром',
  coparenting: 'Совместное воспитание',
};

// Названия типов оценок
const assessmentTypeNames: Record<string, string> = {
  checkup: 'Чекап',
  parent: 'Родитель',
  family: 'Семья',
};

// Статусы результатов
const statusColors: Record<string, string> = {
  typical: 'bg-green-100 text-green-800',
  borderline: 'bg-yellow-100 text-yellow-800',
  concerning: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  typical: 'Норма',
  borderline: 'Пограничный',
  concerning: 'Требует внимания',
};

// Статусы консультаций
const appointmentStatusLabels: Record<string, string> = {
  payment_pending: 'Ожидает оплаты',
  scheduled: 'Запланирована',
  in_progress: 'В процессе',
  completed: 'Завершена',
  cancelled: 'Отменена',
  no_show: 'Неявка',
};

const appointmentStatusColors: Record<string, string> = {
  payment_pending: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

export default function SupportTools() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>('');
  const [selectedAssignmentType, setSelectedAssignmentType] = useState<string>('primary');
  const [selectedAssignmentStatus, setSelectedAssignmentStatus] = useState<string>('active');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);

  const queryClient = useQueryClient();

  // Последние пользователи (показываем до поиска)
  const { data: recentUsers, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['support-recent-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  // Результаты поиска
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['support-users', searchQuery],
    queryFn: async () => {
      // Поиск по email/phone в users
      const { data: usersByEmailPhone } = await supabase
        .from('users')
        .select('id, email, phone, created_at')
        .or(`email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(10);

      // Поиск по ФИО в profiles
      const { data: profilesByName } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .limit(10);

      // Собираем уникальные user_id из profiles
      const userIdsFromProfiles = [...new Set(profilesByName?.map(p => p.user_id) || [])];

      // Получаем пользователей по id из profiles (если есть)
      let usersByName: any[] = [];
      if (userIdsFromProfiles.length > 0) {
        const { data } = await supabase
          .from('users')
          .select('id, email, phone, created_at')
          .in('id', userIdsFromProfiles);
        usersByName = data || [];
      }

      // Объединяем результаты, убирая дубликаты
      const allUsers = [...(usersByEmailPhone || []), ...usersByName];
      const uniqueUsers = allUsers.filter((user, index, self) =>
        index === self.findIndex(u => u.id === user.id)
      );

      // Добавляем имена из profiles к пользователям
      const profilesMap = new Map(
        (profilesByName || []).map(p => [p.user_id, { first_name: p.first_name, last_name: p.last_name }])
      );

      return uniqueUsers.slice(0, 10).map(user => ({
        ...user,
        profile_name: profilesMap.get(user.id)
          ? `${profilesMap.get(user.id)?.first_name || ''} ${profilesMap.get(user.id)?.last_name || ''}`.trim()
          : null
      }));
    },
    enabled: searchQuery.length > 2,
  });

  // Показываем результаты поиска или последних пользователей
  const users = searchQuery.length > 2 ? searchResults : recentUsers;
  const isLoading = searchQuery.length > 2 ? isLoadingSearch : isLoadingRecent;

  const { data: userData } = useQuery({
    queryKey: ['support-user-data', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;

      // Используем Promise.allSettled для graceful degradation
      const [userResult, profilesResult, assessmentsResult, appointmentsResult] = await Promise.allSettled([
        supabase.from('users').select('*').eq('id', selectedUserId).single(),
        supabase.from('profiles').select('*').eq('user_id', selectedUserId),
        supabase
          .from('assessments')
          .select('*, profile:profiles!inner(user_id, first_name, last_name)')
          .eq('profile.user_id', selectedUserId)
          .order('completed_at', { ascending: false, nullsFirst: false })
          .limit(20),
        supabase
          .from('appointments')
          .select('*, appointment_type:appointment_types(id, name, duration_minutes, price)')
          .eq('user_id', selectedUserId)
          .order('scheduled_at', { ascending: false })
          .limit(20),
      ]);

      return {
        user: userResult.status === 'fulfilled' ? userResult.value.data : null,
        profiles: profilesResult.status === 'fulfilled' ? (profilesResult.value.data || []) : [],
        assessments: assessmentsResult.status === 'fulfilled' ? (assessmentsResult.value.data || []) : [],
        appointments: appointmentsResult.status === 'fulfilled' ? (appointmentsResult.value.data || []) : [],
      };
    },
    enabled: !!selectedUserId,
  });

  // Документы пользователя
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['support-user-documents', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_user_id', selectedUserId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedUserId,
  });

  // Назначения пользователя (специалисты)
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['support-user-assignments', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const { data, error } = await supabase
        .from('client_assignments')
        .select(`
          *,
          specialist:specialists(id, display_name, specialization_codes),
          profile:profiles(id, first_name, last_name, type)
        `)
        .eq('client_user_id', selectedUserId)
        .eq('status', 'active')
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedUserId,
  });

  // Список всех специалистов для переназначения
  const { data: specialists } = useQuery({
    queryKey: ['support-available-specialists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specialists')
        .select('id, display_name, specialization_codes, is_available, accepts_new_clients')
        .eq('is_available', true)
        .order('display_name');

      if (error) throw error;
      return data || [];
    },
    enabled: isReassignDialogOpen,
  });

  // Профили пользователя для выбора при назначении
  const { data: userProfiles } = useQuery({
    queryKey: ['support-user-profiles', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, type')
        .eq('user_id', selectedUserId)
        .order('type');

      if (error) throw error;
      return data || [];
    },
    enabled: isReassignDialogOpen && !!selectedUserId,
  });

  // Мутация для назначения/переназначения специалиста
  const reassignMutation = useMutation({
    mutationFn: async ({
      clientUserId,
      specialistId,
      assignmentType,
      assignmentStatus,
      profileId,
      oldAssignmentId,
    }: {
      clientUserId: string;
      specialistId: string;
      profileId?: string;
      assignmentType: string;
      assignmentStatus: string;
      oldAssignmentId?: string;
    }) => {
      // Если есть старое назначение - завершаем его
      if (oldAssignmentId) {
        const { error: endError } = await supabase
          .from('client_assignments')
          .update({
            status: 'completed',
            ended_at: new Date().toISOString(),
          })
          .eq('id', oldAssignmentId);

        if (endError) throw endError;
      }

      // Создаём новое назначение
      const { data: userData } = await supabase.auth.getUser();
      const { error: createError } = await supabase
        .from('client_assignments')
        .insert({
          client_user_id: clientUserId,
          specialist_id: specialistId,
          assignment_type: assignmentType,
          profile_id: profileId || null,
          assigned_by: userData.user?.id,
          status: assignmentStatus,
          started_at: new Date().toISOString(),
        });

      if (createError) throw createError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-user-assignments', selectedUserId] });
      toast.success('Специалист назначен');
      setIsReassignDialogOpen(false);
      setSelectedSpecialistId('');
      setSelectedAssignmentType('primary');
      setSelectedAssignmentStatus('active');
      setSelectedProfileId('');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  // Обработчик переназначения
  const handleReassign = () => {
    if (!selectedUserId || !selectedSpecialistId) {
      toast.error('Выберите специалиста');
      return;
    }

    const currentAssignment = assignments?.find((a: any) => a.assignment_type === 'primary');

    reassignMutation.mutate({
      clientUserId: selectedUserId,
      specialistId: selectedSpecialistId,
      assignmentType: selectedAssignmentType,
      assignmentStatus: selectedAssignmentStatus,
      profileId: selectedProfileId || undefined,
      oldAssignmentId: selectedAssignmentType === 'primary' ? currentAssignment?.id : undefined,
    });
  };

  // Функция копирования в буфер
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success('Скопировано в буфер');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  // Функция сброса пароля
  const handleResetPassword = async () => {
    if (!userData?.user?.email) {
      toast.error('У пользователя нет email');
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userData.user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success(`Ссылка для сброса пароля отправлена на ${userData.user.email}`);
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Функция скачивания документа
  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const url = await getDocumentUrl(filePath);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      toast.error(`Ошибка загрузки: ${error.message}`);
    }
  };

  // Функция для рендера результатов оценки
  const renderAssessmentResults = (assessment: any) => {
    if (assessment.status !== 'completed' || !assessment.results_summary) {
      return null;
    }

    const results = assessment.results_summary;
    const categories = results.categories || results.category_results || {};
    const worryTags = results.worry_tags || [];

    // Определяем версию
    const isV2 = results.version === 2 || Object.keys(categories).some(k =>
      ['emotion_regulation', 'executive_functions', 'sensory_processing'].includes(k)
    );

    return (
      <div className="mt-3 pt-3 border-t space-y-2">
        {isV2 && (
          <p className="text-xs text-muted-foreground">v2 (10 шкал)</p>
        )}

        {Object.keys(categories).length > 0 && (
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(categories).map(([key, value]: [string, any]) => {
              const score = typeof value === 'object' ? value.score : value;
              const status = typeof value === 'object' ? value.status : null;

              return (
                <div key={key} className="flex items-center justify-between text-xs py-1 px-2 bg-muted/50 rounded">
                  <span className="truncate mr-2">{categoryNames[key] || key}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{score}</span>
                    {status && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusColors[status] || ''}`}>
                        {statusLabels[status] || status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {worryTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs text-muted-foreground">Теги:</span>
            {worryTags.map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Инструменты поддержки</h1>
        <p className="text-muted-foreground mt-1">
          Быстрый доступ к данным пользователей
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поиск пользователя</CardTitle>
          <CardDescription>Найдите пользователя для просмотра его данных</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по email, телефону или ФИО..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          {users && users.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                {searchQuery.length > 2 ? 'Результаты поиска' : 'Последние пользователи'}
              </p>
              {users.map((user: any) => {
                const displayInfo = user.profile_name
                  ? `${user.profile_name} (${user.email || user.phone || user.id})`
                  : user.email || user.phone || user.id;
                return (
                  <Button
                    key={user.id}
                    variant={selectedUserId === user.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span className="truncate">{displayInfo}</span>
                  </Button>
                );
              })}
            </div>
          )}

          {!isLoading && users && users.length === 0 && searchQuery.length > 2 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Пользователи не найдены
            </p>
          )}
        </CardContent>
      </Card>

      {userData && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Информация о пользователе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Email с копированием */}
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2">
                  <p className="flex-1">{userData.user?.email || '—'}</p>
                  {userData.user?.email && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(userData.user.email, 'email')}
                    >
                      {copiedField === 'email' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Телефон с копированием */}
              <div>
                <Label className="text-xs text-muted-foreground">Телефон</Label>
                <div className="flex items-center gap-2">
                  <p className="flex-1">{userData.user?.phone || '—'}</p>
                  {userData.user?.phone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(userData.user.phone, 'phone')}
                    >
                      {copiedField === 'phone' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* ID с копированием */}
              <div>
                <Label className="text-xs text-muted-foreground">ID пользователя</Label>
                <div className="flex items-center gap-2">
                  <p className="flex-1 font-mono text-xs">{userData.user?.id || '—'}</p>
                  {userData.user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(userData.user.id, 'id')}
                    >
                      {copiedField === 'id' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Регион</Label>
                <p>{userData.user?.region || '—'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Роль</Label>
                <p>{userData.user?.role || 'user'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Дата регистрации</Label>
                <p>{userData.user?.created_at
                  ? new Date(userData.user.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : '—'}</p>
              </div>

              {/* Быстрые действия */}
              <div className="pt-3 border-t space-y-2">
                <Label className="text-xs text-muted-foreground">Быстрые действия</Label>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/admin/users?search=${encodeURIComponent(userData.user?.email || userData.user?.phone || '')}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Редактировать
                    </Button>
                  </Link>
                  {userData.user?.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetPassword}
                      disabled={isResettingPassword}
                    >
                      {isResettingPassword ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <KeyRound className="h-3 w-3 mr-1" />
                      )}
                      Сбросить пароль
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Профили ({userData.profiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userData.profiles.map((profile: any) => {
                  const age = calculateAge(profile.dob);
                  return (
                    <div key={profile.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {profile.first_name} {profile.last_name || ''}
                        </p>
                        <Badge variant={profile.type === 'parent' ? 'secondary' : 'default'}>
                          {profile.type === 'parent' ? 'Родитель' : 'Ребёнок'}
                        </Badge>
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        {age && <span>{age}</span>}
                        {profile.dob && (
                          <span>
                            {new Date(profile.dob).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {userData.profiles.length === 0 && (
                  <p className="text-sm text-muted-foreground">Нет профилей</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Специалист/Координатор */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Назначенные специалисты ({assignments?.length || 0})
                </CardTitle>
                <CardDescription>Специалисты, работающие с клиентом</CardDescription>
              </div>
              <div className="flex gap-2">
                <Link to="/admin/assignments">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Все назначения
                  </Button>
                </Link>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsReassignDialogOpen(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {assignments && assignments.length > 0 ? 'Переназначить' : 'Назначить'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAssignments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : assignments && assignments.length > 0 ? (
                <div className="space-y-2">
                  {assignments.map((assignment: any) => {
                    const profileLabel = assignment.profile
                      ? `${assignment.profile.first_name || ''} ${assignment.profile.last_name || ''}`.trim() +
                        (assignment.profile.type === 'child' ? ' (ребёнок)' :
                         assignment.profile.type === 'parent' ? ' (родитель)' : '')
                      : null;
                    return (
                    <div key={assignment.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserCog className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {assignment.specialist?.display_name || 'Без имени'}
                            </p>
                            {profileLabel && (
                              <p className="text-sm text-muted-foreground">
                                Для: {profileLabel}
                              </p>
                            )}
                            {assignment.specialist?.specialization_codes?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {assignment.specialist.specialization_codes.map((code: string) => (
                                  <Badge key={code} variant="outline" className="text-xs">
                                    {code}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              assignment.assignment_type === 'primary'
                                ? 'bg-blue-100 text-blue-800'
                                : assignment.assignment_type === 'consultant'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {assignmentTypeLabels[assignment.assignment_type] || assignment.assignment_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Назначен: {new Date(assignment.assigned_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        {assignment.notes && (
                          <span>Заметки: {assignment.notes}</span>
                        )}
                      </div>
                    </div>
                  );})}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Специалист не назначен. Нажмите "Назначить" для выбора специалиста.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Оценки - расширенная карточка */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Оценки ({userData.assessments.length})</CardTitle>
                <CardDescription>Отсортированы по дате завершения (новые сверху)</CardDescription>
              </div>
              <Link to="/admin/assessments">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Все оценки
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userData.assessments.map((assessment: any) => (
                  <div key={assessment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {assessmentTypeNames[assessment.assessment_type] || assessment.assessment_type}
                        </Badge>
                        <Badge variant={assessment.status === 'completed' ? 'default' :
                                       assessment.status === 'abandoned' ? 'destructive' : 'secondary'}>
                          {assessment.status === 'completed' ? 'Завершена' :
                           assessment.status === 'in_progress' ? 'В процессе' :
                           assessment.status === 'abandoned' ? 'Прервана' :
                           assessment.status}
                        </Badge>
                        {assessment.is_paid && (
                          <Badge className="bg-green-100 text-green-800">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Оплачена
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {assessment.status === 'completed' && assessment.results_summary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAssessment(assessment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Link to={`/admin/assessments?id=${assessment.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      {assessment.profile?.first_name && (
                        <span>Профиль: {assessment.profile.first_name} {assessment.profile.last_name || ''}</span>
                      )}
                      {assessment.completed_at && (
                        <span>Завершена: {new Date(assessment.completed_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      )}
                      {!assessment.completed_at && assessment.created_at && (
                        <span>Создана: {new Date(assessment.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}</span>
                      )}
                    </div>
                  </div>
                ))}
                {userData.assessments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Нет оценок</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Консультации - расширенная карточка */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Консультации ({userData.appointments.length})</CardTitle>
                <CardDescription>Отсортированы по дате (новые сверху)</CardDescription>
              </div>
              <Link to="/admin/appointments">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Все консультации
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userData.appointments.map((appointment: any) => (
                  <div key={appointment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Calendar className="h-4 w-4" />
                          {new Date(appointment.scheduled_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                          <span className="text-muted-foreground ml-1">
                            {new Date(appointment.scheduled_at).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          appointmentStatusColors[appointment.status] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {appointmentStatusLabels[appointment.status] || appointment.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {appointment.video_room_url &&
                         !['completed', 'cancelled', 'no_show'].includes(appointment.status) && (
                          <a
                            href={appointment.video_room_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm" className="text-blue-600">
                              <Video className="h-4 w-4 mr-1" />
                              Войти
                            </Button>
                          </a>
                        )}
                        <Link to={`/admin/appointments?id=${appointment.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Информация о типе консультации */}
                    {appointment.appointment_type && (
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-medium">{appointment.appointment_type.name}</span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {appointment.appointment_type.duration_minutes} мин
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CreditCard className="h-3 w-3" />
                          {appointment.appointment_type.price === 0
                            ? 'Бесплатно'
                            : `${appointment.appointment_type.price.toLocaleString('ru-RU')} ₽`}
                        </div>
                      </div>
                    )}

                    {/* Заметки */}
                    {appointment.notes && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">Заметки:</span> {appointment.notes}
                      </div>
                    )}
                  </div>
                ))}
                {userData.appointments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Нет консультаций</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Документы клиента */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Документы ({documents?.length || 0})
              </CardTitle>
              <CardDescription>Загруженные файлы клиента</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.file_name}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(doc.category)}
                            </Badge>
                            <span>
                              {(doc.file_size_bytes / 1024).toFixed(1)} KB
                            </span>
                            <span>
                              {new Date(doc.created_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Нет документов</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Диалог переназначения специалиста */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить специалиста</DialogTitle>
            <DialogDescription>
              Выберите специалиста и тип назначения для клиента
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Специалист</Label>
              <Select value={selectedSpecialistId} onValueChange={setSelectedSpecialistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите специалиста" />
                </SelectTrigger>
                <SelectContent>
                  {specialists?.map((specialist: any) => (
                    <SelectItem key={specialist.id} value={specialist.id}>
                      <div className="flex items-center gap-2">
                        <span>{specialist.display_name}</span>
                        {!specialist.accepts_new_clients && (
                          <Badge variant="outline" className="text-xs">
                            Не принимает
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Тип назначения</Label>
              <Select value={selectedAssignmentType} onValueChange={setSelectedAssignmentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Основной специалист</SelectItem>
                  <SelectItem value="consultant">Консультант</SelectItem>
                  <SelectItem value="temporary">Временный</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                При выборе "Основной" предыдущий основной специалист будет заменён
              </p>
            </div>

            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={selectedAssignmentStatus} onValueChange={setSelectedAssignmentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активно</SelectItem>
                  <SelectItem value="paused">Приостановлено</SelectItem>
                  <SelectItem value="completed">Завершено</SelectItem>
                  <SelectItem value="cancelled">Отменено</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userProfiles && userProfiles.length > 0 && (
              <div className="space-y-2">
                <Label>Профиль (член семьи)</Label>
                <Select value={selectedProfileId || 'none'} onValueChange={(v) => setSelectedProfileId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите профиль (опционально)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не указывать</SelectItem>
                    {userProfiles.map((profile: any) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name || ''}
                        {profile.type === 'child' && ' (ребёнок)'}
                        {profile.type === 'parent' && ' (родитель)'}
                        {profile.type === 'partner' && ' (партнёр)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Укажите, с каким членом семьи будет работать специалист
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReassignDialogOpen(false);
                setSelectedSpecialistId('');
                setSelectedAssignmentType('primary');
                setSelectedAssignmentStatus('active');
                setSelectedProfileId('');
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleReassign}
              disabled={!selectedSpecialistId || reassignMutation.isPending}
            >
              {reassignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Назначить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Боковая панель с результатами оценки */}
      <Sheet open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Результаты {selectedAssessment?.assessment_type === 'checkup' ? 'чекапа' :
                         selectedAssessment?.assessment_type === 'parent' ? 'оценки родителя' :
                         selectedAssessment?.assessment_type === 'family' ? 'семейной оценки' : 'оценки'}
            </SheetTitle>
          </SheetHeader>

          {selectedAssessment && (
            <div className="mt-6 space-y-4">
              {/* Информация о профиле */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Профиль:</strong> {selectedAssessment.profile?.first_name || '—'} {selectedAssessment.profile?.last_name || ''}</p>
                <p><strong>Дата завершения:</strong> {selectedAssessment.completed_at
                  ? new Date(selectedAssessment.completed_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '—'}</p>
                {selectedAssessment.results_summary?.version === 2 && (
                  <p><strong>Версия:</strong> v2 (10 шкал)</p>
                )}
                {selectedAssessment.results_summary?.age_group && (
                  <p><strong>Возрастная группа:</strong> {
                    selectedAssessment.results_summary.age_group === 'preschool' ? 'Дошкольник (3-6)' :
                    selectedAssessment.results_summary.age_group === 'elementary' ? 'Младший школьник (7-11)' :
                    selectedAssessment.results_summary.age_group === 'teenager' ? 'Подросток (12-18)' :
                    selectedAssessment.results_summary.age_group
                  }</p>
                )}
              </div>

              {/* Результаты по категориям */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Результаты по шкалам:</p>
                {selectedAssessment.results_summary &&
                  Object.entries(selectedAssessment.results_summary)
                    .filter(([key]) => categoryNames[key])
                    .map(([key, value]: [string, any]) => {
                      const score = typeof value === 'object' ? value.score : value;
                      const status = typeof value === 'object' ? value.status : null;

                      return (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <span className="text-sm">{categoryNames[key]}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{score}</span>
                            {status && (
                              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[status] || ''}`}>
                                {statusLabels[status] || status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                }
              </div>

              {/* Worry tags если есть */}
              {selectedAssessment.results_summary?.worry_tags?.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Теги беспокойства:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedAssessment.results_summary.worry_tags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Кнопка перехода */}
              <div className="pt-4 border-t">
                <Link to={`/admin/assessments?id=${selectedAssessment.id}`}>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Открыть в разделе Оценки
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import consultationIllustration from "@/assets/friendly-and-clean-vector-style-illustration-of-a-.png";
import checkupIllustration from "@/assets/minimalistic-and-friendly-vector-style-illustratio (1).png";
import parentFemaleAvatar from "@/assets/friendly-and-clean-face-of-an-adult-person--gender.png";
import parentMaleAvatar from "@/assets/friendly-and-clean-face-of-an-adult-person--gender (1).png";
import childFemaleAvatar from "@/assets/friendly-and-clean-face-of-a-white-girl-7-yo--soft.png";
import childMaleAvatar from "@/assets/friendly-and-clean-face-of-a-white-boy-7-yo--soft- (1).png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SerifHeading } from "@/components/design-system/SerifHeading";
import { WellnessCard } from "@/components/design-system/WellnessCard";
import { User, CheckCircle2, Clock, MapPin, Users, LogOut, Tag, History, Calendar, X, Video, MessageSquare, ChevronRight, ChevronLeft, Briefcase, Eye, HelpCircle, CreditCard, AlertCircle, Pencil, Trash2, Plus, Settings, Bell } from "lucide-react";
import { toast } from "sonner";
import { calculateAge, isEligibleForCheckup, deleteProfile, CHECKUP_MIN_AGE, CHECKUP_MAX_AGE } from "@/lib/profileStorage";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { useProfiles } from "@/hooks/useProfiles";
import { useAssessmentsForProfiles, useActiveAssessmentsForProfiles } from "@/hooks/useAssessments";
import { useAppointmentsWithType, useCancelAppointment } from "@/hooks/useAppointments";
import { supabase } from "@/lib/supabase";
import { formatAppointmentTime } from "@/lib/moscowTime";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SpecialistProfileCard from "@/components/SpecialistProfileCard";
import RatingModal from "@/components/RatingModal";
import { CalendarFeedDialog } from "@/components/CalendarFeedDialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { logger } from "@/lib/logger";
import { getPendingRating, PendingRating } from "@/lib/supabase-ratings";
import { getUnreadCount, subscribeToMessages } from "@/lib/supabase-messages";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/lib/supabase";
type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface MemberWithAssessment extends Profile {
  checkupAssessment?: Assessment | null;
  activeCheckupAssessment?: Assessment | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentProfileId, setCurrentProfile } = useCurrentProfile();
  const cancelAppointment = useCancelAppointment();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string | null>(null);
  const [pendingRating, setPendingRating] = useState<PendingRating | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  
  // Хуки для горизонтальной прокрутки карточек семьи (всегда на верхнем уровне)
  const familyScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftFamily, setCanScrollLeftFamily] = useState(false);
  const [canScrollRightFamily, setCanScrollRightFamily] = useState(true);
  const [currentFamilyIndex, setCurrentFamilyIndex] = useState(0);
  
  // Используем React Query для кеширования
  const { data: profiles, isLoading: profilesLoading, error: profilesError } = useProfiles();
  const { data: appointmentsWithType, isLoading: appointmentsLoading, error: appointmentsError } = useAppointmentsWithType();
  
  // Отладочное логирование
  useEffect(() => {
    logger.log('Dashboard data state:', {
      profiles: profiles?.length || 0,
      profilesLoading,
      profilesError: profilesError?.message,
      appointments: appointmentsWithType?.length || 0,
      appointmentsLoading,
      appointmentsError: appointmentsError?.message,
      user: user?.id
    });
  }, [profiles, profilesLoading, profilesError, appointmentsWithType, appointmentsLoading, appointmentsError, user]);
  
  const profileIds = useMemo(() => {
    if (!profiles || !Array.isArray(profiles)) return [];
    return profiles.map(p => p.id);
  }, [profiles]);
  
  const { 
    data: assessmentsMap, 
    isLoading: assessmentsLoading 
  } = useAssessmentsForProfiles(profileIds, 'checkup');

  const { 
    data: activeAssessmentsMap, 
    isLoading: activeAssessmentsLoading 
  } = useActiveAssessmentsForProfiles(profileIds, 'checkup');

  // Загружаем чекапы типа 'parent' для родителя
  const parentProfileId = useMemo(() => {
    if (!profiles || !Array.isArray(profiles)) return null;
    const parent = profiles.find(p => p.type === 'parent');
    return parent?.id || null;
  }, [profiles]);

  const { 
    data: parentAssessmentsMap, 
    isLoading: parentAssessmentsLoading 
  } = useAssessmentsForProfiles(parentProfileId ? [parentProfileId] : [], 'parent');

  const { 
    data: activeParentAssessmentsMap, 
    isLoading: activeParentAssessmentsLoading 
  } = useActiveAssessmentsForProfiles(parentProfileId ? [parentProfileId] : [], 'parent');

  // Вычисляем members с оценками
  const familyMembers = useMemo(() => {
    if (!profiles || !Array.isArray(profiles)) return [];
    const assessments = assessmentsMap || {};
    const activeAssessments = activeAssessmentsMap || {};
    const parentAssessments = parentAssessmentsMap || {};
    const activeParentAssessments = activeParentAssessmentsMap || {};
    
    return profiles.map(profile => {
      // Для родителя используем чекапы типа 'parent', для детей - 'checkup'
      if (profile.type === 'parent') {
        return {
          ...profile,
          checkupAssessment: parentAssessments[profile.id] || null,
          activeCheckupAssessment: activeParentAssessments[profile.id] || null,
        };
      } else {
        return {
          ...profile,
          checkupAssessment: assessments[profile.id] || null,
          activeCheckupAssessment: activeAssessments[profile.id] || null,
        };
      }
    });
  }, [profiles, assessmentsMap, activeAssessmentsMap, parentAssessmentsMap, activeParentAssessmentsMap]);

  // Показываем загрузку только если нет данных И идет загрузка
  // Если есть кешированные данные, показываем контент сразу
  const isLoadingProfiles = profilesLoading && !profiles;
  const isLoadingAssessments = assessmentsLoading && assessmentsMap === undefined && profileIds.length > 0;
  const isLoadingActiveAssessments = activeAssessmentsLoading && activeAssessmentsMap === undefined && profileIds.length > 0;
  const isLoadingParentAssessments = parentAssessmentsLoading && parentAssessmentsMap === undefined && parentProfileId !== null;
  const isLoadingActiveParentAssessments = activeParentAssessmentsLoading && activeParentAssessmentsMap === undefined && parentProfileId !== null;
  const loading = isLoadingProfiles || isLoadingAssessments || isLoadingActiveAssessments || isLoadingParentAssessments || isLoadingActiveParentAssessments;

  // Обновляем статусы консультаций при загрузке дашборда
  // ПРИМЕЧАНИЕ: Cron job автоматически обновляет статусы каждые 5 минут,
  // но мы также обновляем при загрузке для актуальности данных
  useEffect(() => {
    async function updateStatuses() {
      try {
        await supabase.rpc('update_appointment_statuses');
      } catch (error) {
        console.error('Error updating appointment statuses:', error);
        // Не показываем ошибку пользователю, т.к. это фоновое обновление
        // Cron job все равно обновит статусы автоматически
      }
    }
    updateStatuses();
  }, []);

  // Загрузка счётчика непрочитанных сообщений
  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const count = await getUnreadCount();
        setUnreadMessages(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    }
    if (user?.id) {
      loadUnreadCount();
    }
  }, [user?.id]);

  // Realtime подписка на новые сообщения для обновления счётчика
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToMessages(user.id, async () => {
      const count = await getUnreadCount();
      setUnreadMessages(count);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Проверка незаоценённых консультаций для показа модалки оценки
  useEffect(() => {
    async function checkPendingRating() {
      const pending = await getPendingRating();
      if (pending) {
        setPendingRating(pending);
        setShowRatingModal(true);
      }
    }
    if (user?.id) {
      checkPendingRating();
    }
  }, [user?.id]);

  // Получаем имя родителя для приветствия
  const parentName = useMemo(() => {
    if (!profiles || !Array.isArray(profiles)) return null;
    const parentProfile = profiles.find(p => p.type === 'parent');
    return parentProfile?.first_name || null;
  }, [profiles]);

  // Функция для выбора аватара на основе типа профиля и пола
  const getAvatarImage = useCallback((member: MemberWithAssessment) => {
    if (member.type === 'parent') {
      return member.gender === 'male' ? parentMaleAvatar : parentFemaleAvatar;
    } else if (member.type === 'child') {
      return member.gender === 'male' ? childMaleAvatar : childFemaleAvatar;
    }
    // Fallback на женский аватар для других типов
    return parentFemaleAvatar;
  }, []);

  // Фильтруем предстоящие консультации (scheduled, in_progress, payment_pending, исключаем completed и cancelled)
  const upcomingAppointments = useMemo(() => {
    if (!appointmentsWithType) return [];
    return appointmentsWithType.filter(apt =>
      apt.status === 'scheduled' || apt.status === 'in_progress' || apt.status === 'payment_pending'
    );
  }, [appointmentsWithType]);

  // Функция для получения имени профиля
  const getProfileName = useCallback((profileId: string | null) => {
    if (!profileId) return "Для меня (родитель)";
    const profile = profiles?.find(p => p.id === profileId);
    if (!profile) return "Профиль не найден";
    return `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`;
  }, [profiles]);

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment.mutateAsync(appointmentId);
      setCancelDialogOpen(null);
    } catch (error) {
      // Ошибка уже обработана в хуке через toast
    }
  };


  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteProfile(memberId);
      await queryClient.invalidateQueries({ queryKey: ['profiles', user?.id] });
      setDeleteMemberId(null);
      toast.success("Член семьи удален");
    } catch (error) {
      logger.error('Error deleting profile:', error);
      toast.error('Ошибка при удалении члена семьи');
    }
  };

  // Функции для горизонтальной прокрутки карточек семьи
  const checkFamilyScrollability = useCallback(() => {
    if (!familyScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = familyScrollRef.current;
    setCanScrollLeftFamily(scrollLeft > 0);
    setCanScrollRightFamily(scrollLeft < scrollWidth - clientWidth - 10);
    
    const cardWidth = 320 + 16;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setCurrentFamilyIndex(Math.max(0, Math.min(newIndex, familyMembers.length - 1)));
  }, [familyMembers.length]);

  useEffect(() => {
    if (familyMembers.length === 0) return;
    
    checkFamilyScrollability();
    const container = familyScrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkFamilyScrollability);
      window.addEventListener('resize', checkFamilyScrollability);
      return () => {
        container.removeEventListener('scroll', checkFamilyScrollability);
        window.removeEventListener('resize', checkFamilyScrollability);
      };
    }
  }, [familyMembers, checkFamilyScrollability]);

  const scrollFamily = useCallback((direction: 'left' | 'right') => {
    if (!familyScrollRef.current) return;
    const cardWidth = 320 + 16;
    const scrollAmount = cardWidth;
    const currentScroll = familyScrollRef.current.scrollLeft;
    let newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    newScroll = Math.max(0, Math.min(newScroll, familyScrollRef.current.scrollWidth - familyScrollRef.current.clientWidth));

    familyScrollRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });

    const newIndex = Math.round(newScroll / cardWidth);
    setCurrentFamilyIndex(Math.max(0, Math.min(newIndex, familyMembers.length - 1)));
  }, [familyMembers.length]);

  const goToFamilyCard = useCallback((index: number) => {
    if (!familyScrollRef.current) return;
    const cardWidth = 320 + 16;
    familyScrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
    setCurrentFamilyIndex(index);
  }, []);

  // Проверка возможности прохождения чекапа
  const canStartCheckup = useMemo(() => {
    const children = familyMembers.filter(m => m.type === 'child');

    if (children.length === 0) {
      return { allowed: false, reason: 'no_children' };
    }

    // Фильтруем детей по возрасту (только те, кто подходит для чекапа: 3-18 лет)
    const eligibleChildren = children.filter(child => isEligibleForCheckup(child.dob).eligible);

    if (eligibleChildren.length === 0) {
      return { allowed: false, reason: 'no_eligible_children' };
    }

    // ПРОВЕРКА 1: Есть ли активный чекап (status = 'in_progress' и нет completed_at)
    const activeCheckup = eligibleChildren.find(child => {
      const active = child.activeCheckupAssessment;
      return active && 
             active.status === 'in_progress' && 
             !active.completed_at;
    });
    
    if (activeCheckup) {
      return { allowed: true, reason: 'active_checkup_exists' };
    }

    // ПРОВЕРКА 2: Находим последний ЗАВЕРШЕННЫЙ чекап (status = 'completed' и есть completed_at)
    const completedCheckups = eligibleChildren
      .map(child => {
        const completed = child.checkupAssessment;
        // Только явно завершенные чекапы
        if (completed && 
            completed.status === 'completed' && 
            completed.completed_at) {
          return new Date(completed.completed_at);
        }
        return null;
      })
      .filter((date): date is Date => date !== null);

    const lastCheckupDate = completedCheckups.length > 0
      ? new Date(Math.max(...completedCheckups.map(d => d.getTime())))
      : null;

    // ПРОВЕРКА 3: Если нет завершенных чекапов - можно пройти
    if (!lastCheckupDate) {
      return { allowed: true, reason: 'no_previous_checkup' };
    }

    // ПРОВЕРКА 4: Если есть новый ребенок, добавленный после последнего чекапа - можно пройти
    const childrenCreatedDates = eligibleChildren
      .map(child => new Date(child.created_at))
      .filter(date => !isNaN(date.getTime()));

    const newestChildDate = childrenCreatedDates.length > 0
      ? new Date(Math.max(...childrenCreatedDates.map(d => d.getTime())))
      : null;
    
    if (newestChildDate && newestChildDate > lastCheckupDate) {
      return { allowed: true, reason: 'new_child_added' };
    }
    
    // ПРОВЕРКА 5: Если прошло 30 дней с последнего чекапа - можно пройти
    const daysSinceLastCheckup = Math.floor(
      (Date.now() - lastCheckupDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastCheckup >= 30) {
      return { allowed: true, reason: 'month_passed' };
    }
    
    // ПРОВЕРКА 6: Иначе - нельзя пройти, показываем бейдж
    const daysRemaining = 30 - daysSinceLastCheckup;
    return { 
      allowed: false, 
      reason: 'too_soon',
      daysRemaining,
      lastCheckupDate 
    };
  }, [familyMembers]);

  // Проверка наличия хотя бы одного завершённого чекапа (для доступа к консультациям)
  const hasAnyCompletedCheckup = useMemo(() => {
    const children = familyMembers.filter(m => m.type === 'child');
    return children.some(child => child.checkupAssessment?.status === 'completed');
  }, [familyMembers]);

  // Проверка: есть ли только маленькие дети (до 3 лет) и нет eligible детей
  const hasOnlyYoungChildren = useMemo(() => {
    const children = familyMembers.filter(m => m.type === 'child');
    if (children.length === 0) return false;

    // Проверяем, все ли дети слишком маленькие
    const allTooYoung = children.every(child => {
      const elig = isEligibleForCheckup(child.dob);
      return !elig.eligible && elig.reason === 'too_young';
    });

    return allTooYoung;
  }, [familyMembers]);

  // Мемоизация обработчика клика
  const handleCheckupClick = useCallback(() => {
    logger.log('Checkup card clicked');

    // Находим всех детей
    const children = familyMembers.filter(m => m.type === 'child');

    if (children.length === 0) {
      // Нет детей - предлагаем добавить
      navigate("/family-members");
      return;
    }

    // Фильтруем eligible детей (3-18 лет)
    const eligibleChildren = children.filter(child => isEligibleForCheckup(child.dob).eligible);

    // Проверяем возможность прохождения чекапа
    if (!canStartCheckup.allowed) {
      if (canStartCheckup.reason === 'no_eligible_children') {
        // Все дети слишком маленькие или слишком взрослые
        const youngChildren = children.filter(child => {
          const elig = isEligibleForCheckup(child.dob);
          return !elig.eligible && elig.reason === 'too_young';
        });

        if (youngChildren.length > 0) {
          toast.error(
            'Чекап предназначен для детей от 3 до 18 лет. ' +
            'Ваш ребёнок ещё слишком маленький для прохождения чекапа.'
          );
        } else {
          toast.error(
            'Чекап предназначен для детей от 3 до 18 лет.'
          );
        }
        return;
      }

      if (canStartCheckup.reason === 'too_soon') {
        const daysRemaining = canStartCheckup.daysRemaining || 0;
        const lastCheckupDate = canStartCheckup.lastCheckupDate
          ? new Date(canStartCheckup.lastCheckupDate).toLocaleDateString('ru-RU')
          : '';

        toast.error(
          `Чекап можно пройти только раз в месяц или после добавления нового ребенка. ` +
          `Последний чекап был пройден ${lastCheckupDate}. ` +
          `Повторно можно будет пройти через ${daysRemaining} ${daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}.`
        );
      }
      return;
    }

    // Если есть активный чекап - продолжаем его
    if (canStartCheckup.reason === 'active_checkup_exists') {
      const childWithActiveCheckup = eligibleChildren.find(child => child.activeCheckupAssessment);
      if (childWithActiveCheckup) {
        logger.log('Resuming checkup for child:', childWithActiveCheckup.first_name);
        setCurrentProfileId(childWithActiveCheckup.id);
        setCurrentProfile(childWithActiveCheckup);
        navigate(`/checkup-intro/${childWithActiveCheckup.id}`);
        return;
      }
    }

    // Разрешаем начать новый чекап с первым eligible ребенком
    const firstEligibleChild = eligibleChildren[0];
    if (firstEligibleChild) {
      logger.log('Starting checkup for child:', firstEligibleChild.first_name);
      setCurrentProfileId(firstEligibleChild.id);
      setCurrentProfile(firstEligibleChild);
      navigate(`/checkup-intro/${firstEligibleChild.id}`);
    }
  }, [familyMembers, navigate, setCurrentProfileId, setCurrentProfile, canStartCheckup]);

  // Обработка ошибок загрузки
  useEffect(() => {
    if (profilesError) {
      logger.error('Error loading profiles:', profilesError);
      toast.error('Не удалось загрузить данные. Попробуйте обновить страницу.');
    }
  }, [profilesError]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-8">
        {/* Отображение ошибок загрузки */}
        {(profilesError || appointmentsError) && (
          <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive mb-2">
              {profilesError && `Ошибка загрузки профилей: ${profilesError instanceof Error ? profilesError.message : 'Неизвестная ошибка'}`}
              {appointmentsError && `Ошибка загрузки консультаций: ${appointmentsError instanceof Error ? appointmentsError.message : 'Неизвестная ошибка'}`}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Обновить страницу
            </Button>
          </div>
        )}
        
        {/* Предстоящие консультации */}
        {upcomingAppointments.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <SerifHeading size="xl">
                Ваши предстоящие консультации
              </SerifHeading>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/cabinet/settings?tab=notifications")}
                  className="text-xs sm:text-sm"
                >
                  <Bell className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Настроить уведомления</span>
                </Button>
                <CalendarFeedDialog />
              </div>
            </div>
            {upcomingAppointments.length === 1 ? (
              // Одна консультация - показываем как обычно
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`rounded-xl border border-white/30 p-4 sm:p-6 text-card-foreground shadow-soft overflow-hidden ${appointment.status === 'payment_pending' ? 'border-amber-300/50' : ''}`}
                    style={{
                      background: appointment.status === 'payment_pending'
                        ? 'linear-gradient(108deg, rgba(255, 193, 7, 0.35) 0%, rgba(255, 193, 7, 0.2) 100%)'
                        : 'linear-gradient(108deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.25) 100%)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}
                  >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-3 min-w-0">
                      {/* Статус оплаты */}
                      <div className="flex items-center gap-2">
                        {appointment.status === 'payment_pending' ? (
                          <Badge variant="secondary" className="bg-honey-pale text-foreground border-honey hover:bg-honey-pale font-light">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Ожидает оплаты
                          </Badge>
                        ) : (appointment as any).payment_id ? (
                          <Badge variant="secondary" className="bg-sage-pale text-foreground border-sage hover:bg-sage-pale font-light">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Оплачено
                          </Badge>
                        ) : null}
                        {appointment.status === 'in_progress' && (
                          <Badge variant="default" className="bg-success hover:bg-success font-light">
                            <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />
                            Идет сейчас
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white flex-shrink-0">
                          <Calendar className="h-5 w-5 text-ink" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">Дата и время</p>
                          <p className="font-medium truncate">
                            {formatAppointmentTime(appointment.scheduled_at)}
                          </p>
                        </div>
                      </div>
                      {appointment.appointment_type && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white flex-shrink-0">
                            <Clock className="h-5 w-5 text-ink" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground">Тип консультации</p>
                            <p className="font-medium truncate">
                              {appointment.appointment_type.name} ({appointment.appointment_type.duration_minutes} минут)
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white flex-shrink-0">
                          <User className="h-5 w-5 text-ink" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">Для кого</p>
                          <p className="font-medium truncate">{getProfileName(appointment.profile_id)}</p>
                        </div>
                      </div>
                      {/* Информация о сроке оплаты для payment_pending */}
                      {appointment.status === 'payment_pending' && (appointment as any).payment_expires_at && (
                        <div className="p-3 bg-honey-pale border border-honey rounded-lg">
                          <p className="text-sm text-foreground">
                            <strong>Срок оплаты:</strong>{' '}
                            {new Date((appointment as any).payment_expires_at).toLocaleString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Europe/Moscow'
                            })} (МСК)
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            После истечения срока запись будет автоматически отменена
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 md:ml-0 w-full md:w-auto md:min-w-[200px]">
                      {/* Специалист */}
                      {(appointment as any).specialist && (
                        <div
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors mb-2"
                          onClick={() => setSelectedSpecialistId((appointment as any).specialist.id)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={(appointment as any).specialist.avatar_url || undefined} />
                            <AvatarFallback>
                              {(appointment as any).specialist.display_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Специалист</p>
                            <p className="font-medium">{(appointment as any).specialist.display_name}</p>
                            {(appointment as any).specialist.experience_years && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                Опыт: {(appointment as any).specialist.experience_years} лет
                              </p>
                            )}
                          </div>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {/* Кнопка входа в видеоконсультацию (только для оплаченных) */}
                      {appointment.status !== 'payment_pending' && (appointment as any).video_room_url && (() => {
                        const scheduledTime = new Date(appointment.scheduled_at);
                        const now = new Date();
                        const minutesUntilStart = (scheduledTime.getTime() - now.getTime()) / 1000 / 60;
                        const isVideoAvailable = appointment.status === 'in_progress' || minutesUntilStart <= 15;

                        return isVideoAvailable ? (
                          <Button
                            variant={appointment.status === 'in_progress' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => window.open((appointment as any).video_room_url, '_blank')}
                            className={appointment.status === 'in_progress' ? 'bg-success hover:bg-success/90' : ''}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            {appointment.status === 'in_progress' ? 'Войти сейчас' : 'Войти в комнату'}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="opacity-50"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Доступно за 15 мин
                          </Button>
                        );
                      })()}

                      {/* Кнопка оплаты для payment_pending */}
                      {appointment.status === 'payment_pending' && (
                        <p className="text-xs text-muted-foreground text-center">
                          Ссылка на оплату отправлена на email
                        </p>
                      )}

                      {/* Кнопка отмены (не для payment_pending) */}
                      {appointment.status !== 'payment_pending' && (
                        <AlertDialog open={cancelDialogOpen === appointment.id} onOpenChange={(open) => setCancelDialogOpen(open ? appointment.id : null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-muted/50 font-light">
                              <X className="h-4 w-4 mr-2" />
                              Отменить
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Отменить консультацию?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вы уверены, что хотите отменить консультацию? Это действие нельзя отменить.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Нет, оставить</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Да, отменить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              // Несколько консультаций - горизонтальный слайдер
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {upcomingAppointments.map((appointment) => (
                    <CarouselItem key={appointment.id} className="pl-2 md:pl-4 basis-full md:basis-[calc(50%-8px)] lg:basis-[calc(50%-8px)]">
                      <div
                        className={`rounded-xl border border-white/30 p-4 sm:p-6 text-card-foreground shadow-soft overflow-hidden h-full ${appointment.status === 'payment_pending' ? 'border-amber-300/50' : ''}`}
                        style={{
                          background: appointment.status === 'payment_pending'
                            ? 'linear-gradient(108deg, rgba(255, 193, 7, 0.35) 0%, rgba(255, 193, 7, 0.2) 100%)'
                            : 'linear-gradient(108deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.25) 100%)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)'
                        }}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex-1 space-y-3 min-w-0">
                            {/* Статус оплаты */}
                            <div className="flex items-center gap-2">
                              {appointment.status === 'payment_pending' ? (
                                <Badge variant="secondary" className="bg-honey-pale text-foreground border-honey hover:bg-honey-pale font-light">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Ожидает оплаты
                                </Badge>
                              ) : (appointment as any).payment_id ? (
                                <Badge variant="secondary" className="bg-sage-pale text-foreground border-sage hover:bg-sage-pale font-light">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Оплачено
                                </Badge>
                              ) : null}
                              {appointment.status === 'in_progress' && (
                                <Badge variant="default" className="bg-success hover:bg-success font-light">
                                  <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />
                                  Идет сейчас
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white flex-shrink-0">
                                <Calendar className="h-5 w-5 text-ink" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-muted-foreground">Дата и время</p>
                                <p className="font-medium truncate">
                                  {formatAppointmentTime(appointment.scheduled_at)}
                                </p>
                              </div>
                            </div>
                            {appointment.appointment_type && (
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white flex-shrink-0">
                                  <Clock className="h-5 w-5 text-ink" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-muted-foreground">Тип консультации</p>
                                  <p className="font-medium truncate">
                                    {appointment.appointment_type.name} ({appointment.appointment_type.duration_minutes} минут)
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white flex-shrink-0">
                                <User className="h-5 w-5 text-ink" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-muted-foreground">Для кого</p>
                                <p className="font-medium truncate">{getProfileName(appointment.profile_id)}</p>
                              </div>
                            </div>
                            {/* Информация о сроке оплаты для payment_pending */}
                            {appointment.status === 'payment_pending' && (appointment as any).payment_expires_at && (
                              <div className="p-3 bg-honey-pale border border-honey rounded-lg">
                                <p className="text-sm text-foreground">
                                  <strong>Срок оплаты:</strong>{' '}
                                  {new Date((appointment as any).payment_expires_at).toLocaleString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Europe/Moscow'
                                  })} (МСК)
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  После истечения срока запись будет автоматически отменена
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 w-full">
                            {/* Специалист */}
                            {(appointment as any).specialist && (
                              <div
                                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors mb-2"
                                onClick={() => setSelectedSpecialistId((appointment as any).specialist.id)}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={(appointment as any).specialist.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {(appointment as any).specialist.display_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm text-muted-foreground">Специалист</p>
                                  <p className="font-medium">{(appointment as any).specialist.display_name}</p>
                                  {(appointment as any).specialist.experience_years && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Briefcase className="h-3 w-3" />
                                      Опыт: {(appointment as any).specialist.experience_years} лет
                                    </p>
                                  )}
                                </div>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            {/* Кнопка входа в видеоконсультацию (только для оплаченных) */}
                            {appointment.status !== 'payment_pending' && (appointment as any).video_room_url && (() => {
                              const scheduledTime = new Date(appointment.scheduled_at);
                              const now = new Date();
                              const minutesUntilStart = (scheduledTime.getTime() - now.getTime()) / 1000 / 60;
                              const isVideoAvailable = appointment.status === 'in_progress' || minutesUntilStart <= 15;

                              return isVideoAvailable ? (
                                <Button
                                  variant={appointment.status === 'in_progress' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => window.open((appointment as any).video_room_url, '_blank')}
                                  className={appointment.status === 'in_progress' ? 'bg-success hover:bg-success/90' : ''}
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  {appointment.status === 'in_progress' ? 'Войти сейчас' : 'Войти в комнату'}
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className="opacity-50"
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  Доступно за 15 мин
                                </Button>
                              );
                            })()}

                            {/* Кнопка оплаты для payment_pending */}
                            {appointment.status === 'payment_pending' && (
                              <p className="text-xs text-muted-foreground text-center">
                                Ссылка на оплату отправлена на email
                              </p>
                            )}

                            {/* Кнопка отмены (не для payment_pending) */}
                            {appointment.status !== 'payment_pending' && (
                              <AlertDialog open={cancelDialogOpen === appointment.id} onOpenChange={(open) => setCancelDialogOpen(open ? appointment.id : null)}>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-muted/50 font-light">
                                    <X className="h-4 w-4 mr-2" />
                                    Отменить
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Отменить консультацию?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Вы уверены, что хотите отменить консультацию? Это действие нельзя отменить.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Нет, оставить</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleCancelAppointment(appointment.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Да, отменить
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <CarouselPrevious className="static translate-y-0 h-8 w-8" />
                  <CarouselNext className="static translate-y-0 h-8 w-8" />
                </div>
              </Carousel>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : null}

        {/* Portal Cards */}
        <div className="mb-8">
          <SerifHeading size="xl" className="mb-4">
            С чего начать?
          </SerifHeading>
        </div>

        {/* Предупреждение для семей только с маленькими детьми */}
        {hasOnlyYoungChildren && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Чекап для детей до {CHECKUP_MIN_AGE} лет пока недоступен</p>
              <p className="mt-1 text-amber-700">
                Наш чекап разработан для детей от {CHECKUP_MIN_AGE} до {CHECKUP_MAX_AGE} лет.
                Однако вы можете получить консультацию специалиста для себя как родителя.
                Для этого напишите в поддержку — мы поможем записаться.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={() => window.open('https://t.me/waves_support_bot', '_blank', 'noopener,noreferrer')}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Написать в поддержку
              </Button>
            </div>
          </div>
        )}

        <div className="mb-12 grid gap-6 md:grid-cols-2 md:items-stretch">
            {/* Левая колонка: Шаг 1 + уведомление */}
            <div className="flex flex-col gap-4 h-full">
              {/* Шаг 1: Психологический чекап семьи */}
              <WellnessCard 
                className={`group relative overflow-hidden p-8 transition-all flex flex-col ${
                  canStartCheckup.allowed
                    ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                    : 'cursor-not-allowed opacity-75'
                }`}
                gradient={canStartCheckup.allowed ? 'pink' : undefined}
                hover={canStartCheckup.allowed}
                style={{ height: '100%', minHeight: '340px' }}
                onClick={(e) => {
                  if (!canStartCheckup.allowed) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  e.preventDefault();
                  e.stopPropagation();
                  handleCheckupClick();
                }}
                role="button"
                tabIndex={canStartCheckup.allowed ? 0 : -1}
                onKeyDown={(e) => {
                  if (!canStartCheckup.allowed) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCheckupClick();
                  }
                }}
              >
                {/* Желтый круг с номером шага 1 */}
                <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-honey flex items-center justify-center shadow-soft pointer-events-none z-10">
                  <span className="text-ink font-light text-xl">1</span>
                </div>
                <div 
                  className="flex flex-col items-center text-center justify-center flex-1"
                  onClick={(e) => {
                    if (!canStartCheckup.allowed) {
                      e.stopPropagation();
                      return;
                    }
                    e.stopPropagation();
                    handleCheckupClick();
                  }}
                >
                  <img 
                    src={checkupIllustration} 
                    alt="Проверка психического здоровья семьи" 
                    className={`mb-6 h-40 w-auto object-contain transition-transform pointer-events-none ${
                      canStartCheckup.allowed ? 'group-hover:scale-110' : ''
                    }`}
                  />
                  <SerifHeading size="lg" className={`mb-2 transition-colors pointer-events-none ${
                    canStartCheckup.allowed ? 'group-hover:text-coral' : 'text-muted-foreground'
                  }`}>
                    Пройти чекап
                  </SerifHeading>
                  {canStartCheckup.allowed && canStartCheckup.reason === 'active_checkup_exists' && (
                    <p className={`text-lg font-medium pointer-events-none ${
                      canStartCheckup.allowed ? 'text-muted-foreground' : 'text-muted-foreground/70'
                    }`}>
                      Продолжить проверку
                    </p>
                  )}
                  {/* Предупреждение о повторном прохождении чекапа внутри карточки */}
                  {!canStartCheckup.allowed && canStartCheckup.reason === 'too_soon' && (
                    <div className="mt-4 flex justify-center">
                      <Badge variant="secondary" className="bg-muted text-muted-foreground border border-border/50 px-4 py-2 rounded-full font-light hover:bg-muted">
                        <Calendar className="h-3.5 w-3.5 mr-2" />
                        {canStartCheckup.daysRemaining 
                          ? `Повторно можно пройти через ${canStartCheckup.daysRemaining} ${canStartCheckup.daysRemaining === 1 ? 'день' : canStartCheckup.daysRemaining < 5 ? 'дня' : 'дней'}`
                          : 'Чекап можно пройти только раз в месяц или после добавления нового ребенка'
                        }
                      </Badge>
                    </div>
                  )}
                </div>
              </WellnessCard>
            </div>

            {/* Правая колонка: Шаг 2 */}
            <div>
              {/* Шаг 2: Получить консультацию */}
            <WellnessCard
              className={`group relative overflow-hidden p-8 transition-all flex flex-col ${
                hasAnyCompletedCheckup
                  ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                  : 'cursor-not-allowed opacity-75'
              }`}
              gradient={hasAnyCompletedCheckup ? 'lavender' : undefined}
              hover={hasAnyCompletedCheckup}
              style={{ height: '100%', minHeight: '340px' }}
              onClick={() => hasAnyCompletedCheckup && navigate("/appointments")}
              role={hasAnyCompletedCheckup ? "button" : undefined}
              tabIndex={hasAnyCompletedCheckup ? 0 : -1}
              onKeyDown={(e) => {
                if (hasAnyCompletedCheckup && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  navigate("/appointments");
                }
              }}
            >
              {/* Желтый круг с номером шага 2 */}
              <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-honey flex items-center justify-center shadow-soft pointer-events-none z-10">
                <span className="text-ink font-light text-xl">2</span>
              </div>
              <div className="flex flex-col items-center text-center justify-center flex-1">
                <img
                  src={consultationIllustration}
                  alt="Waves Portal"
                  className={`mb-6 h-40 w-auto object-contain transition-transform pointer-events-none ${
                    hasAnyCompletedCheckup ? 'group-hover:scale-110' : ''
                  }`}
                />
                <SerifHeading size="lg" className={`mb-2 transition-colors pointer-events-none ${
                  hasAnyCompletedCheckup
                    ? 'text-foreground group-hover:text-coral'
                    : 'text-muted-foreground'
                }`}>
                  Получить консультацию
                </SerifHeading>
                {!hasAnyCompletedCheckup && (
                  <div className="mt-4 flex justify-center">
                    <Badge variant="secondary" className="bg-muted text-muted-foreground border border-border/50 px-4 py-2 rounded-full font-light hover:bg-muted">
                      <Calendar className="h-3.5 w-3.5 mr-2" />
                      Для доступа к консультациям пройдите чекап
                    </Badge>
                  </div>
                )}
              </div>
            </WellnessCard>
            </div>
          </div>

        {/* Support Section */}
        <div className="mb-12">
          <SerifHeading size="xl" className="mb-4">Есть вопросы?</SerifHeading>
          <Card
            className="border-2 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            style={{
              background: 'linear-gradient(108deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.25) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            <p className="text-muted-foreground mb-4">
              Напишите в поддержку, чтобы решить любые проблемы или записаться к специалисту напрямую без предварительной диагностики.
            </p>
            <Button onClick={() => window.open('https://t.me/waves_support_bot', '_blank', 'noopener,noreferrer')}>
              <HelpCircle className="h-4 w-4 mr-2" />
              Написать в поддержку
            </Button>
          </Card>
        </div>

        {/* Your Family Section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <SerifHeading size="xl">Ваша семья</SerifHeading>
            {familyMembers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 font-light"
                onClick={() => navigate("/add-family-member", { state: { from: 'cabinet' } })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить члена семьи
              </Button>
            )}
          </div>
          {familyMembers.length === 0 ? (
            <Card className="border-2 bg-card p-8 text-center">
              <p className="text-muted-foreground mb-4">Пока нет членов семьи</p>
              <Button 
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 font-light"
                onClick={() => navigate("/add-family-member", { state: { from: 'cabinet' } })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить члена семьи
              </Button>
            </Card>
          ) : (
                <div className="relative">
                  {/* Кнопка навигации влево */}
                  {canScrollLeftFamily && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-md"
                      onClick={() => scrollFamily('left')}
                      aria-label="Предыдущая карточка"
                    >
                      <ChevronLeft className="h-5 w-5 text-ink" />
                    </Button>
                  )}

                  {/* Кнопка навигации вправо */}
                  {canScrollRightFamily && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-md"
                      onClick={() => scrollFamily('right')}
                      aria-label="Следующая карточка"
                    >
                      <ChevronRight className="h-5 w-5 text-ink" />
                    </Button>
                  )}

                  <div 
                    ref={familyScrollRef}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                    style={{ 
                      scrollbarWidth: 'none', 
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch',
                      touchAction: 'pan-x'
                    }}
                    onScroll={checkFamilyScrollability}
                  >
                    {familyMembers.map((member) => {
                      const age = member.dob ? calculateAge(member.dob) : null;
                      const hasCompletedCheckup = member.checkupAssessment?.status === 'completed';
                      const checkupDate = member.checkupAssessment?.completed_at 
                        ? new Date(member.checkupAssessment.completed_at).toLocaleDateString('ru-RU')
                        : null;
                      
                      return (
                        <Card
                          key={member.id}
                          className="min-w-[320px] flex-shrink-0 flex flex-col border-2 p-6 shadow-sm transition-all hover:shadow-md"
                          style={{
                            background: 'linear-gradient(108deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.25) 100%)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          }}
                        >
                          <div className="flex flex-col items-center text-center flex-1">
                            <img 
                              src={getAvatarImage(member)}
                              alt={`${member.first_name} ${member.last_name || ''}`}
                              className="h-20 w-20 rounded-full object-cover mb-4"
                            />
                            <div className="flex items-center gap-3 mb-2">
                              <SerifHeading size="lg">
                                {member.first_name} {member.last_name || ''}
                              </SerifHeading>
                            </div>
                            {age !== null && (
                              <p className="text-muted-foreground mb-2">{age} лет</p>
                            )}
                            {hasCompletedCheckup && (
                              <Badge variant="default" className="bg-success text-success-foreground hover:bg-success font-light mb-2">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Чекап завершен
                              </Badge>
                            )}
                            {hasCompletedCheckup && checkupDate && (
                              <p className="text-sm text-muted-foreground mb-4">
                                Завершен: {checkupDate}
                              </p>
                            )}
                            <div className="flex flex-col gap-2 mt-auto w-full">
                              {hasCompletedCheckup && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => navigate(`/results-report?profileId=${member.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Посмотреть результаты
                                </Button>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 font-light"
                                  onClick={() => navigate(`/edit-family-member/${member.id}`, { state: { from: 'cabinet' } })}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Редактировать
                                </Button>
                                <AlertDialog open={deleteMemberId === member.id} onOpenChange={(open) => setDeleteMemberId(open ? member.id : null)}>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="flex-1 text-muted-foreground hover:text-destructive hover:bg-muted/50 font-light"
                                      onClick={() => setDeleteMemberId(member.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Удалить
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Удалить члена семьи?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Вы уверены, что хотите удалить {member.first_name} {member.last_name || ''}? Это действие нельзя будет отменить.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteMember(member.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Удалить
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Точки навигации */}
                  {familyMembers.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      {familyMembers.map((_, index) => (
                        <button
                          key={index}
                          className={`h-2 w-2 rounded-full transition-colors ${
                            index === currentFamilyIndex ? 'bg-honey' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
                          }`}
                          onClick={() => goToFamilyCard(index)}
                          aria-label={`Перейти к карточке ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
          )}
        </div>

      {/* Specialist Profile Dialog */}
      <Dialog open={!!selectedSpecialistId} onOpenChange={(open) => !open && setSelectedSpecialistId(null)}>
        <DialogContent 
          className="max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto p-0 bg-background"
          style={{
            background: 'var(--bg-golden-hour)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="px-6 pb-6 pt-6">
            {selectedSpecialistId && (
              <SpecialistProfileCard
                specialistId={selectedSpecialistId}
                showChangeButton={true}
                onSpecialistChange={() => setSelectedSpecialistId(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Modal */}
      {pendingRating && (
        <RatingModal
          pendingRating={pendingRating}
          open={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setPendingRating(null);
          }}
          onSubmitted={async () => {
            setShowRatingModal(false);
            setPendingRating(null);
            // Проверяем, есть ли ещё незаоценённые консультации
            const nextPending = await getPendingRating();
            if (nextPending) {
              setPendingRating(nextPending);
              setShowRatingModal(true);
            }
          }}
        />
      )}
    </div>
  );
}

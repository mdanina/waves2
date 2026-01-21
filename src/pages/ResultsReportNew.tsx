import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useState, useCallback, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Gift } from "lucide-react";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveFreeConsultation, useAppointmentsWithType } from "@/hooks/useAppointments";
import { hasFreeConsultationAvailable } from "@/lib/appointmentStorage";
import { calculateAge } from "@/lib/profileStorage";
import { useResultsData } from "@/hooks/useResultsData";
import { SummaryCards } from "@/components/ResultsReport/SummaryCards";
import { ChildCheckupSection } from "@/components/ResultsReport/ChildCheckupSection";
import { ParentSection } from "@/components/ResultsReport/ParentSection";
import { FamilySection } from "@/components/ResultsReport/FamilySection";

import { toast } from "sonner";

// Legacy код отключен, но сохранён для справки. Установить true для отображения.
const SHOW_LEGACY_SECTIONS = false;

export default function ResultsReportNew() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();
  const [searchParams] = useSearchParams();
  const { currentProfileId } = useCurrentProfile();
  const { user, loading: authLoading } = useAuth();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [freeConsultationAvailable, setFreeConsultationAvailable] = useState<boolean>(false);

  // Получаем assessmentId из URL для просмотра конкретного отчета из истории
  const assessmentId = searchParams.get('assessmentId');

  // Используем хук для загрузки данных
  const {
    loading,
    parentProfile,
    partnerProfile,
    childrenCheckups,
    parentAssessment,
    familyAssessment,
  } = useResultsData(user, authLoading, assessmentId);
  
  // Для обратной совместимости: если передан profileId, показываем данные этого ребенка
  const selectedProfileId = params.profileId || searchParams.get('profileId') || currentProfileId;
  
  // Мемоизация вычисления selectedChildCheckup
  const selectedChildCheckup = useMemo(() => {
    return selectedProfileId 
      ? childrenCheckups.find(c => c.profile.id === selectedProfileId)
      : childrenCheckups[0]; // Или первый ребенок, если не указан
  }, [selectedProfileId, childrenCheckups]);

  // Мемоизация toggleSection - критично для предотвращения ре-рендеров
  const toggleSection = useCallback((section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);
  
  // Проверяем активную бесплатную консультацию
  const { data: activeFreeConsultation } = useActiveFreeConsultation();
  const { data: appointmentsWithType } = useAppointmentsWithType();

  // Проверяем доступность бесплатной консультации (флаг не установлен)
  // Обновляем при изменении activeFreeConsultation или appointmentsWithType,
  // чтобы синхронизировать состояние после отмены консультации
  useEffect(() => {
    async function checkAvailability() {
      const available = await hasFreeConsultationAvailable();
      setFreeConsultationAvailable(available);
    }
    checkAvailability();
  }, [activeFreeConsultation, appointmentsWithType]);

  // Проверяем, есть ли хотя бы один завершенный чекап
  const hasCompletedCheckup = useMemo(() => {
    return childrenCheckups.length > 0;
  }, [childrenCheckups]);

  // Показываем кнопку только если:
  // 1. Есть завершенный чекап
  // 2. Бесплатная консультация доступна (флаг не установлен)
  // 3. Нет активной бесплатной консультации
  const showFreeConsultationButton = hasCompletedCheckup && freeConsultationAvailable && !activeFreeConsultation;

  const backgroundStyle = {
    background: 'var(--bg-mesh-vibrant-2)',
    backgroundAttachment: 'fixed'
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen bg-background flex items-center justify-center"
        style={backgroundStyle}
      >
        <div className="text-center">
          <p className="text-muted-foreground">Загрузка результатов...</p>
        </div>
      </div>
    );
  }

  if (!selectedChildCheckup && childrenCheckups.length === 0) {
    return (
      <div 
        className="min-h-screen bg-background flex items-center justify-center"
        style={backgroundStyle}
      >
        <div className="text-center">
          <p className="text-muted-foreground">Результаты не найдены</p>
          <Button onClick={() => navigate("/cabinet")} className="mt-4">
            Вернуться в кабинет
          </Button>
        </div>
      </div>
    );
  }

  // Используем выбранного ребенка или первого доступного
  const currentChild = selectedChildCheckup || childrenCheckups[0];
  const profile = currentChild?.profile;
  const checkupResults = currentChild?.results;
  const checkupAssessment = currentChild?.assessment;

  // Вычисляем возраст
  const age = profile?.dob ? calculateAge(profile.dob) : null;

  // Форматируем дату завершения
  const completedDate = checkupAssessment?.completed_at 
    ? new Date(checkupAssessment.completed_at).toLocaleDateString('ru-RU', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      })
    : 'Неизвестно';

  return (
    <div 
      className="min-h-screen bg-background-light"
      style={backgroundStyle}
    >
      <Header />

      <div className="container mx-auto max-w-5xl px-4 py-12">
        {/* Header */}
        <div className="relative mb-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Ваши результаты
            </h1>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Badge variant="secondary" className="bg-white text-muted-foreground border border-border/50 px-4 py-2 rounded-full font-light hover:bg-white text-sm">
                {completedDate}
              </Badge>
              {profile && (
                <Badge variant="secondary" className="bg-white text-muted-foreground border border-border/50 px-4 py-2 rounded-full font-light hover:bg-white text-sm">
                  {profile.first_name} {profile.last_name || ''}
                </Badge>
              )}
            </div>
            {showFreeConsultationButton && (
              <Button
                size="lg"
                onClick={() => navigate("/appointments")}
                className="w-full max-w-lg mx-auto bg-secondary hover:bg-secondary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-base font-semibold py-10 min-h-[80px]"
              >
                <Gift className="mr-4 !h-10 !w-10 flex-shrink-0" />
                <span className="text-center leading-tight">
                  Получить первую бесплатную консультацию<br />
                  с вашим персональным координатором
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="mb-12">
          <p className="text-center text-muted-foreground mb-8 font-medium">
            Эти результаты основаны на опроснике, который вы заполнили о своей семье.
          </p>
          <SummaryCards
            childrenCheckups={childrenCheckups}
            parentAssessment={parentAssessment}
            familyAssessment={familyAssessment}
          />
        </div>

        {/* Children's Mental Health - показываем для каждого ребенка */}
        {childrenCheckups.map((childData) => (
          <ChildCheckupSection
            key={childData.profile.id}
            childData={childData}
            openSections={openSections}
            toggleSection={toggleSection}
          />
        ))}

        {/* Legacy code - удалить после проверки */}
        {SHOW_LEGACY_SECTIONS && childrenCheckups.map((childData) => {
          const childProfile = childData.profile;
          const childResults = childData.results;
          
          return (
            <div key={childProfile.id} className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8">
                Ментальное здоровье {childProfile.first_name}
              </h2>
              
              {/* Worries Section - только о ребенке */}
              {(() => {
                // Используем теги из assessment (зафиксированные на момент чекапа), если есть, иначе из профиля
                const assessmentWorryTags = childData.assessment?.worry_tags as { child?: string[]; personal?: string[]; family?: string[] } | null;
                const childWorryTags = assessmentWorryTags?.child || childProfile.worry_tags?.filter(w => childWorries.includes(w)) || [];
                if (childWorryTags.length === 0) return null;
                
                return (
                  <div className="mb-8 border-l-4 border-lavender pl-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                        <span className="text-sm font-medium text-white">●</span>
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">Беспокойства о {childProfile.first_name}</h3>
                    </div>
                  <p className="mb-4 text-foreground/70">
                    Беспокойства, которыми вы поделились о {childProfile.first_name}
                  </p>
                    <div className="flex flex-wrap gap-2">
                      {childWorryTags.map((worry, index) => (
                        <span key={index} className="rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                          {worry}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

          {/* Emotional Challenges */}
          {childResults.emotional && (
            <div className="mb-8 border-l-4 border-lavender pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                  <span className="text-sm font-medium text-white">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Эмоциональные трудности</h3>
              </div>

              <div className="mb-6">
                <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.emotional.status)}`}>
                  {getStatusText(childResults.emotional.status)}
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                  <div 
                    className={`h-full ${
                      childResults.emotional.status === 'concerning' ? 'bg-coral' :
                      childResults.emotional.status === 'borderline' ? 'bg-yellow-400' :
                      'bg-secondary'
                    }`}
                    style={{ width: `${getProgressPercentage(childResults.emotional.score, 20)}%` }}
                  ></div>
                </div>
              </div>

            <div className="space-y-3">
              <Collapsible open={openSections['alice-emotional-mean']} onOpenChange={() => toggleSection('alice-emotional-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['alice-emotional-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    Эмоциональные трудности вашего ребенка <strong>выше, чем у многих детей того же возраста.</strong> Это означает, что ваш ребенок подвержен повышенному риску тревожного расстройства или депрессии. Чем раньше мы поможем детям, тем быстрее они смогут вернуться на правильный путь и процветать!
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections['alice-emotional-do']} onOpenChange={() => toggleSection('alice-emotional-do')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                    <div className="flex items-center gap-3">
                     <Lightbulb className="h-5 w-5 text-sky-blue" />
                    <span className="font-medium text-foreground">Что я могу сделать?</span>
                  </div>
                  {openSections['alice-emotional-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Позвольте вашему ребенку испытывать свои чувства без осуждения.</strong> Когда вы минимизируете чувства вашего ребенка, вы (непреднамеренно) посылаете сообщение, что вы не комфортны с эмоциями вашего ребенка.
                    </li>
                    <li>
                      <strong>Поощряйте вашего ребенка к самосостраданию.</strong> Если вы слышите, как они говорят о себе негативно, переформулируйте, чтобы сосредоточиться на усилиях, а не на достижениях.
                    </li>
                    <li>
                      <strong>Пожалуйста, рассмотрите возможность оценки ментального здоровья.</strong> Waves имеет отличные научно обоснованные методы лечения, помогающие детям с эмоциональными трудностями. Мы здесь для вашей семьи.
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
          )}

          {/* Behavioral Challenges */}
          {childResults.conduct && (
            <div className="mb-8 border-l-4 border-lavender pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                  <span className="text-sm font-medium text-white">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Поведенческие трудности</h3>
              </div>

              <div className="mb-6">
                <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.conduct.status)}`}>
                  {getStatusText(childResults.conduct.status)}
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                  <div 
                    className={`h-full ${
                      childResults.conduct.status === 'concerning' ? 'bg-coral' :
                      childResults.conduct.status === 'borderline' ? 'bg-yellow-400' :
                      'bg-secondary'
                    }`}
                    style={{ width: `${getProgressPercentage(childResults.conduct.score, 20)}%` }}
                  ></div>
                </div>
              </div>

            <div className="space-y-3">
              <Collapsible open={openSections['alice-behavioral-mean']} onOpenChange={() => toggleSection('alice-behavioral-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['alice-behavioral-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    Поведенческие трудности вашего ребенка <strong>выше, чем у многих детей того же возраста.</strong> Поведенческие трудности обычно являются внешним выражением внутренних эмоциональных переживаний ребенка. Поэтому поведенческие трудности распространены при многих типах проблем, включая тревожность, депрессию и СДВГ.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections['alice-behavioral-do']} onOpenChange={() => toggleSection('alice-behavioral-do')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                    <div className="flex items-center gap-3">
                     <Lightbulb className="h-5 w-5 text-sky-blue" />
                    <span className="font-medium text-foreground">Что я могу сделать?</span>
                  </div>
                  {openSections['alice-behavioral-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Установите четкие ожидания о том, как вы хотите, чтобы ваш ребенок вел себя.</strong> Сосредоточьтесь на том, чтобы говорить ребенку, что он может делать, и тратьте меньше времени на то, чтобы говорить ему все, что он не может делать. Чем конкретнее, тем лучше!
                    </li>
                    <li>
                      <strong>Сохраняйте спокойствие.</strong> Когда взрослые способны сохранять самообладание, они передают ощущение спокойствия и контроля своему ребенку. Мы должны регулировать свои собственные чувства и поведение, чтобы помочь нашим детям регулировать их чувства и поведение.
                    </li>
                    <li>
                      <strong>Обратитесь за поддержкой.</strong> В Waves мы смотрим на общую картину. Специалист Waves поможет выяснить первопричину поведенческих трудностей вашего ребенка и разработать персонализированный план ухода.
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
          )}

          {/* Activity Challenges */}
          {childResults.hyperactivity && (
            <div className="mb-8 border-l-4 border-lavender pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                  <span className="text-sm font-medium text-white">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Трудности с активностью</h3>
              </div>

              <div className="mb-6">
                <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.hyperactivity.status)}`}>
                  {getStatusText(childResults.hyperactivity.status)}
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                  <div 
                    className={`h-full ${
                      childResults.hyperactivity.status === 'concerning' ? 'bg-coral' :
                      childResults.hyperactivity.status === 'borderline' ? 'bg-yellow-400' :
                      'bg-secondary'
                    }`}
                    style={{ width: `${getProgressPercentage(childResults.hyperactivity.score, 20)}%` }}
                  ></div>
                </div>
              </div>

            <div className="space-y-3">
              <Collapsible open={openSections['alice-activity-mean']} onOpenChange={() => toggleSection('alice-activity-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['alice-activity-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    Уровень активности вашего ребенка и способность концентрироваться находятся <strong>в пределах типичного диапазона для детей того же возраста.</strong> Это, вероятно, указывает на то, что ваш ребенок не подвержен значительному риску синдрома дефицита внимания и гиперактивности (СДВГ). Если вы беспокоитесь об уровне активности вашего ребенка или отвлекаемости, оценка может исключить опасения по поводу СДВГ.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections['alice-activity-do']} onOpenChange={() => toggleSection('alice-activity-do')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                    <div className="flex items-center gap-3">
                     <Lightbulb className="h-5 w-5 text-sky-blue" />
                    <span className="font-medium text-foreground">Что я могу сделать?</span>
                  </div>
                  {openSections['alice-activity-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    Если у вас есть вопросы или беспокойства об уровне активности или концентрации вашего ребенка, рекомендуется проконсультироваться со специалистом. В Waves мы можем помочь определить, нужна ли дополнительная оценка или поддержка.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
          )}

          {/* Social Challenges */}
          {childResults.peer_problems && (
            <div className="mb-8 border-l-4 border-lavender pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                  <span className="text-sm font-medium text-white">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Социальные трудности</h3>
              </div>

              <div className="mb-6">
                <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.peer_problems.status)}`}>
                  {getStatusText(childResults.peer_problems.status)}
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                  <div 
                    className={`h-full ${
                      childResults.peer_problems.status === 'concerning' ? 'bg-coral' :
                      childResults.peer_problems.status === 'borderline' ? 'bg-yellow-400' :
                      'bg-secondary'
                    }`}
                    style={{ width: `${getProgressPercentage(childResults.peer_problems.score, 24)}%` }}
                  ></div>
                </div>
              </div>

            <div className="space-y-3">
              <Collapsible open={openSections['alice-social-mean']} onOpenChange={() => toggleSection('alice-social-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['alice-social-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    У вашего ребенка <strong>больше трудностей в отношениях с другими детьми, чем у многих детей того же возраста.</strong> Социальные навыки трудны для некоторых детей. Важно попытаться понять, почему у вашего ребенка возникают трудности со сверстниками. Проблемы ментального здоровья вашего ребенка могут мешать отношениям.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections['alice-social-do']} onOpenChange={() => toggleSection('alice-social-do')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                    <div className="flex items-center gap-3">
                     <Lightbulb className="h-5 w-5 text-sky-blue" />
                    <span className="font-medium text-foreground">Что я могу сделать?</span>
                  </div>
                  {openSections['alice-social-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Поощряйте социальные взаимодействия.</strong> Создавайте возможности для вашего ребенка играть и общаться с другими детьми в безопасной и поддерживающей обстановке.
                    </li>
                    <li>
                      <strong>Учите социальным навыкам.</strong> Объясняйте и моделируйте способы общения, делиться, по очереди и решать конфликты.
                    </li>
                    <li>
                      <strong>Обратитесь за поддержкой.</strong> Специалисты Waves могут помочь вашему ребенку развить социальные навыки и справиться с трудностями в отношениях со сверстниками.
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
          )}

          {/* Impact Section - Три субдомена влияния */}
          {(childResults.impact_child || childResults.impact_parent || childResults.impact_family || childResults.impact) && (
            <div className="mb-8 border-l-4 border-lavender pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                  <span className="text-sm font-medium text-white">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Влияние</h3>
              </div>

              <div className="space-y-4">
                {/* Влияние на ребёнка */}
                {childResults.impact_child && (
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-4">Влияние на ребёнка</h4>
                    <div className="mb-6">
                      <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.impact_child.status)}`}>
                        {getStatusText(childResults.impact_child.status)}
                      </span>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                        <div 
                          className={`h-full ${
                            childResults.impact_child.status === 'concerning' ? 'bg-coral' :
                            'bg-secondary'
                          }`}
                          style={{ width: `${getProgressPercentage(childResults.impact_child.score, 3)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Влияние на родителя */}
                {childResults.impact_parent && (
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-4">Влияние на родителя</h4>
                    <div className="mb-6">
                      <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.impact_parent.status)}`}>
                        {getStatusText(childResults.impact_parent.status)}
                      </span>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                        <div 
                          className={`h-full ${
                            childResults.impact_parent.status === 'concerning' ? 'bg-coral' :
                            'bg-secondary'
                          }`}
                          style={{ width: `${getProgressPercentage(childResults.impact_parent.score, 6)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Влияние на семью */}
                {childResults.impact_family && (
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-4">Влияние на семью</h4>
                    <div className="mb-6">
                      <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.impact_family.status)}`}>
                        {getStatusText(childResults.impact_family.status)}
                      </span>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                        <div 
                          className={`h-full ${
                            childResults.impact_family.status === 'concerning' ? 'bg-coral' :
                            'bg-secondary'
                          }`}
                          style={{ width: `${getProgressPercentage(childResults.impact_family.score, 18)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Обратная совместимость: старый формат impact */}
                {childResults.impact && !childResults.impact_child && !childResults.impact_parent && !childResults.impact_family && (
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-4">{childProfile.first_name}</h4>
                    <div className="mb-6">
                      <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${
                        childResults.impact.status === 'high_impact' ? 'text-white bg-coral' :
                        childResults.impact.status === 'medium_impact' ? 'text-white bg-yellow-500' :
                        'text-white bg-secondary'
                      }`}>
                        {childResults.impact.status === 'high_impact' ? 'Высокое влияние' :
                         childResults.impact.status === 'medium_impact' ? 'Среднее влияние' :
                         'Низкое влияние'}
                      </span>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                        <div 
                          className={`h-full ${
                            childResults.impact.status === 'high_impact' ? 'bg-coral' :
                            childResults.impact.status === 'medium_impact' ? 'bg-yellow-400' :
                            'bg-secondary'
                          }`}
                          style={{ width: `${getProgressPercentage(childResults.impact.score, 2)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Collapsible open={openSections['impact-mean']} onOpenChange={() => toggleSection('impact-mean')} className="mt-6">
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['impact-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    Когда мы говорим о ментальном здоровье, речь идет не о симптомах; речь идет о вашей жизни. Ментальное здоровье вашего ребенка влияет на его жизнь, вашу жизнь и жизнь вашей семьи!
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections['impact-do']} onOpenChange={() => toggleSection('impact-do')} className="mt-3">
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                    <div className="flex items-center gap-3">
                     <Lightbulb className="h-5 w-5 text-sky-blue" />
                    <span className="font-medium text-foreground">Что я могу сделать?</span>
                  </div>
                  {openSections['impact-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    В Waves мы поддерживаем вашего ребенка и вашу семью, чтобы снизить влияние трудностей и укрепить сильные стороны. Проще говоря, мы здесь, чтобы помочь вам и вашей семье процветать!
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Child's Recap */}
          <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-sky-blue/80 to-sky-blue/60">
            <div className="flex items-center justify-between p-6">
              <h3 className="text-2xl font-bold text-white">Итоги {childProfile.first_name}</h3>
              <div className="h-16 w-16 rounded-full bg-white/20"></div>
            </div>
            <div className="space-y-4 bg-white p-6">
              {childResults.emotional && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Эмоции</span>
                    <span className={`text-sm ${
                      childResults.emotional.status === 'concerning' ? 'text-coral' :
                      childResults.emotional.status === 'borderline' ? 'text-yellow-500' :
                      'text-secondary'
                    }`}>
                      • {getStatusText(childResults.emotional.status)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                    <div 
                      className={`h-full ${
                        childResults.emotional.status === 'concerning' ? 'bg-coral' :
                        childResults.emotional.status === 'borderline' ? 'bg-yellow-400' :
                        'bg-secondary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.emotional.score, 20)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {childResults.conduct && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Поведение</span>
                    <span className={`text-sm ${
                      childResults.conduct.status === 'concerning' ? 'text-coral' :
                      childResults.conduct.status === 'borderline' ? 'text-yellow-500' :
                      'text-secondary'
                    }`}>
                      • {getStatusText(childResults.conduct.status)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                    <div 
                      className={`h-full ${
                        childResults.conduct.status === 'concerning' ? 'bg-coral' :
                        childResults.conduct.status === 'borderline' ? 'bg-yellow-400' :
                        'bg-secondary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.conduct.score, 20)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {childResults.hyperactivity && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Активность</span>
                    <span className={`text-sm ${
                      childResults.hyperactivity.status === 'concerning' ? 'text-coral' :
                      childResults.hyperactivity.status === 'borderline' ? 'text-yellow-500' :
                      'text-secondary'
                    }`}>
                      • {getStatusText(childResults.hyperactivity.status)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                    <div 
                      className={`h-full ${
                        childResults.hyperactivity.status === 'concerning' ? 'bg-coral' :
                        childResults.hyperactivity.status === 'borderline' ? 'bg-yellow-400' :
                        'bg-secondary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.hyperactivity.score, 20)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {childResults.peer_problems && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Социальное</span>
                    <span className={`text-sm ${
                      childResults.peer_problems.status === 'concerning' ? 'text-coral' :
                      childResults.peer_problems.status === 'borderline' ? 'text-yellow-500' :
                      'text-secondary'
                    }`}>
                      • {getStatusText(childResults.peer_problems.status)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                    <div 
                      className={`h-full ${
                        childResults.peer_problems.status === 'concerning' ? 'bg-coral' :
                        childResults.peer_problems.status === 'borderline' ? 'bg-yellow-400' :
                        'bg-secondary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.peer_problems.score, 24)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {childResults.total_difficulties !== undefined && (
                <div className="mt-4 pt-4 border-t">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Общие трудности</span>
                  </div>
                </div>
              )}
            </div>
          </div>
            </div>
          );
        })}

        {/* Your Mental Health */}
        <ParentSection
          parentProfile={parentProfile}
          parentAssessment={parentAssessment}
          openSections={openSections}
          toggleSection={toggleSection}
        />

        {/* Legacy code - удалить после проверки */}
        {SHOW_LEGACY_SECTIONS && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">Ваше ментальное здоровье</h2>
          
          {/* Worries Section - о себе - показываем всегда, если есть worry tags */}
          {(() => {
            // Отладка: логируем все данные профиля родителя
            if (parentProfile) {
              logger.log('Parent profile data:', {
                id: parentProfile.id,
                first_name: parentProfile.first_name,
                allWorryTags: parentProfile.worry_tags,
                worryTagsType: typeof parentProfile.worry_tags,
                worryTagsIsArray: Array.isArray(parentProfile.worry_tags),
                personalWorriesList: personalWorries
              });
            }
            
            // Используем теги из assessment (зафиксированные на момент чекапа), если есть, иначе из профиля
            const assessmentWorryTags = parentAssessment?.worry_tags as { child?: string[]; personal?: string[]; family?: string[] } | null;
            const personalWorryTags = assessmentWorryTags?.personal || parentProfile?.worry_tags?.filter(w => personalWorries.includes(w)) || [];
            
            // Отладка: логируем отфильтрованные worry tags
            logger.log('Filtered personal worry tags:', {
              personalWorryTags,
              count: personalWorryTags.length,
              fromAssessment: !!assessmentWorryTags?.personal
            });
            
            if (personalWorryTags.length > 0) {
              return (
                <div className="mb-8 border-l-4 border-lavender pl-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                      <span className="text-sm font-medium text-white">●</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Беспокойства о себе</h3>
                  </div>
                  <p className="mb-4 text-foreground/70">
                    Беспокойства, которыми вы поделились о себе
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {personalWorryTags.map((worry, index) => (
                      <span key={index} className="rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                        {worry}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}
          
          {parentAssessment ? (
            <>
              <p className="text-foreground/70 mb-4">
                Результаты родительской оценки {parentAssessment.completed_at 
                  ? new Date(parentAssessment.completed_at).toLocaleDateString('ru-RU')
                  : ''}
              </p>
            
            {parentAssessment.results_summary ? (
              (() => {
                const parentResults = parentAssessment.results_summary as ParentResults;
                return (
                  <div className="space-y-6">
                    {parentResults.anxiety && (
                      <div className="rounded-lg border border-border bg-white p-6">
                        <h3 className="text-xl font-bold text-foreground mb-4">Тревожность</h3>
                        <div className="mb-6">
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(parentResults.anxiety.status)}`}>
                            {getStatusText(parentResults.anxiety.status)}
                          </span>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                            <div 
                              className={`h-full ${
                                parentResults.anxiety.status === 'concerning' ? 'bg-coral' :
                                parentResults.anxiety.status === 'borderline' ? 'bg-yellow-400' :
                                'bg-secondary'
                              }`}
                              style={{ width: `${getProgressPercentage(parentResults.anxiety.score, 6)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Collapsible open={openSections['parent-anxiety-mean']} onOpenChange={() => toggleSection('parent-anxiety-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                                <span className="font-medium text-foreground">Что это значит?</span>
                              </div>
                              {openSections['parent-anxiety-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                              <p className="text-foreground">
                                {parentResults.anxiety.status === 'concerning' 
                                  ? 'Эти результаты показывают, что вы <strong>испытываете значительные симптомы тревожности.</strong> Это может влиять на вашу способность заботиться о себе и вашей семье.'
                                  : parentResults.anxiety.status === 'borderline'
                                  ? 'Эти результаты показывают, что вы <strong>можете испытывать некоторые симптомы тревожности.</strong> Важно обратить внимание на свое эмоциональное благополучие.'
                                  : 'Эти результаты показывают, что вы <strong>не испытываете значительных симптомов тревожности.</strong> Один из способов поддерживать эмоциональный баланс - найти способы снизить стресс и создать радость в вашей жизни.'}
                              </p>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible open={openSections['parent-anxiety-do']} onOpenChange={() => toggleSection('parent-anxiety-do')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                    <div className="flex items-center gap-3">
                     <Lightbulb className="h-5 w-5 text-sky-blue" />
                                <span className="font-medium text-foreground">Что я могу сделать?</span>
                              </div>
                              {openSections['parent-anxiety-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                              <ul className="list-inside space-y-3 text-foreground">
                                <li>
                                  <strong>Заботьтесь о себе.</strong> Найдите время для отдыха, физической активности и занятий, которые приносят вам радость.
                                </li>
                                <li>
                                  <strong>Обратитесь за поддержкой.</strong> Поговорите с друзьями, семьей или специалистом о своих переживаниях.
                                </li>
                                <li>
                                  <strong>Рассмотрите профессиональную помощь.</strong> В Waves мы можем помочь вам справиться с тревожностью и улучшить ваше эмоциональное благополучие.
                                </li>
                              </ul>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                    )}
                    
                    {parentResults.depression && (
                      <div className="rounded-lg border border-border bg-white p-6">
                        <h3 className="text-xl font-bold text-foreground mb-4">Депрессия</h3>
                        <div className="mb-6">
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(parentResults.depression.status)}`}>
                            {getStatusText(parentResults.depression.status)}
                          </span>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                            <div 
                              className={`h-full ${
                                parentResults.depression.status === 'concerning' ? 'bg-coral' :
                                parentResults.depression.status === 'borderline' ? 'bg-yellow-400' :
                                'bg-secondary'
                              }`}
                              style={{ width: `${getProgressPercentage(parentResults.depression.score, 6)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Collapsible open={openSections['parent-depression-mean']} onOpenChange={() => toggleSection('parent-depression-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                                <span className="font-medium text-foreground">Что это значит?</span>
                              </div>
                              {openSections['parent-depression-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                              <p className="text-foreground">
                                {parentResults.depression.status === 'concerning' 
                                  ? 'Эти результаты показывают, что вы <strong>испытываете высокие депрессивные симптомы.</strong> Это может влиять на вашу способность заботиться о себе и вашей семье.'
                                  : parentResults.depression.status === 'borderline'
                                  ? 'Эти результаты показывают, что вы <strong>можете испытывать некоторые депрессивные симптомы.</strong> Важно обратить внимание на свое эмоциональное благополучие.'
                                  : 'Эти результаты показывают, что вы <strong>не испытываете высоких депрессивных симптомов.</strong> Продолжайте заботиться о себе и своем эмоциональном благополучии.'}
                              </p>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible open={openSections['parent-depression-do']} onOpenChange={() => toggleSection('parent-depression-do')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                    <div className="flex items-center gap-3">
                     <Lightbulb className="h-5 w-5 text-sky-blue" />
                                <span className="font-medium text-foreground">Что я могу сделать?</span>
                              </div>
                              {openSections['parent-depression-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                              <ul className="list-inside space-y-3 text-foreground">
                                <li>
                                  <strong>Не оставайтесь один на один с проблемой.</strong> Обратитесь к близким людям или специалисту за поддержкой.
                                </li>
                                <li>
                                  <strong>Заботьтесь о физическом здоровье.</strong> Регулярная физическая активность, достаточный сон и здоровое питание могут помочь улучшить настроение.
                                </li>
                                <li>
                                  <strong>Рассмотрите профессиональную помощь.</strong> В Waves мы можем помочь вам справиться с депрессивными симптомами и улучшить ваше эмоциональное благополучие.
                                </li>
                              </ul>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-lg border border-border bg-white p-6">
                <p className="text-foreground">
                  Родительская оценка завершена, но результаты еще не рассчитаны.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-border bg-white p-6">
            <p className="text-foreground/70">
              Родительская оценка не завершена. Пройдите опрос о себе, чтобы увидеть результаты здесь.
            </p>
          </div>
        )}
        </div>
        )}

        {/* Legacy Parent Section - скрываем, если нет данных */}
        {SHOW_LEGACY_SECTIONS && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">Ваше ментальное здоровье</h2>

            {/* Anxiety */}
            <div className="mb-8 border-l-4 border-lavender pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                  <span className="text-sm font-medium text-white">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Тревожность</h3>
              </div>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
                  Все в порядке
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                  <div className="h-full w-[50%] bg-secondary"></div>
                </div>
              </div>

              <Collapsible open={openSections['you-anxiety-mean']} onOpenChange={() => toggleSection('you-anxiety-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['you-anxiety-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    Эти результаты показывают, что вы <strong>не испытываете значительных симптомов тревожности.</strong> Один из способов поддерживать эмоциональный баланс - найти способы снизить стресс и создать радость в вашей жизни.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Depression */}
            <div className="mb-8 border-l-4 border-lavender pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                  <span className="text-sm font-medium text-white">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Депрессия</h3>
              </div>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
                  Все в порядке
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                  <div className="h-full w-[45%] bg-secondary"></div>
                </div>
              </div>

              <Collapsible open={openSections['you-depression-mean']} onOpenChange={() => toggleSection('you-depression-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['you-depression-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    Эти результаты показывают, что вы <strong>не испытываете высоких депрессивных симптомов.</strong>
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Your Recap */}
            <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-300">
              <div className="flex items-center justify-between p-6">
                <h3 className="text-2xl font-bold text-white">Ваши итоги</h3>
                <div className="h-16 w-16 rounded-full bg-white/20"></div>
              </div>
              <div className="space-y-4 bg-white p-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Тревожность</span>
                    <span className="text-sm text-primary">• Все в порядке</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                    <div className="h-full w-[50%] bg-secondary"></div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Депрессия</span>
                    <span className="text-sm text-primary">• Все в порядке</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                    <div className="h-full w-[45%] bg-secondary"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Your Family's Mental Health */}
        <FamilySection
          parentProfile={parentProfile}
          partnerProfile={partnerProfile}
          familyAssessment={familyAssessment}
          openSections={openSections}
          toggleSection={toggleSection}
        />

        {/* Legacy code - удалить после проверки */}
        {SHOW_LEGACY_SECTIONS && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">Ментальное здоровье вашей семьи</h2>
            <p className="text-foreground/70 mb-4">
              Результаты семейной оценки {familyAssessment.completed_at 
                ? new Date(familyAssessment.completed_at).toLocaleDateString('ru-RU')
                : ''}
            </p>
            
            {/* Worries Section - о семье */}
            {(() => {
              // Используем теги из assessment (зафиксированные на момент чекапа), если есть, иначе из профилей
              const assessmentWorryTags = familyAssessment?.worry_tags as { child?: string[]; personal?: string[]; family?: string[] } | null;
              const familyWorryTags = assessmentWorryTags?.family || 
                                     partnerProfile?.worry_tags?.filter(w => familyWorries.includes(w)) || 
                                     parentProfile?.worry_tags?.filter(w => familyWorries.includes(w)) || [];
              if (familyWorryTags.length === 0) return null;
              
              return (
                <div className="mb-8 border-l-4 border-lavender pl-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                      <span className="text-sm font-medium text-white">●</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Беспокойства о семье</h3>
                  </div>
                  <p className="mb-4 text-foreground/70">
                    Беспокойства, которыми вы поделились о семье
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {familyWorryTags.map((worry, index) => (
                      <span key={index} className="rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                        {worry}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
            
            {familyAssessment.results_summary ? (
              (() => {
                const familyResults = familyAssessment.results_summary as FamilyResults;
                return (
                  <div className="space-y-6">
                    {familyResults.family_stress && (
                      <div className="rounded-lg border border-border bg-white p-6">
                        <h3 className="text-xl font-bold text-foreground mb-4">Семейный стресс</h3>
                        <div className="mb-6">
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.family_stress.status)}`}>
                            {getStatusText(familyResults.family_stress.status)}
                          </span>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                            <div 
                              className={`h-full ${
                                familyResults.family_stress.status === 'concerning' ? 'bg-coral' :
                                familyResults.family_stress.status === 'borderline' ? 'bg-yellow-400' :
                                'bg-secondary'
                              }`}
                              style={{ width: `${getProgressPercentage(familyResults.family_stress.score, 4)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Collapsible open={openSections['family-stress-mean']} onOpenChange={() => toggleSection('family-stress-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                                <span className="font-medium text-foreground">Что это значит?</span>
                              </div>
                              {openSections['family-stress-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                              <p className="text-foreground">
                                {familyResults.family_stress.status === 'concerning' 
                                  ? 'Ваша семья в настоящее время <strong>испытывает высокий уровень стресса.</strong> Это может влиять на всех членов семьи и вашу способность справляться с ежедневными задачами.'
                                  : familyResults.family_stress.status === 'borderline'
                                  ? 'Ваша семья может <strong>испытывать некоторый уровень стресса.</strong> Важно обратить внимание на то, как это влияет на семейную динамику.'
                                  : 'Ваша семья в настоящее время <strong>справляется с ежедневным жизненным стрессом.</strong> Продолжайте поддерживать открытое общение и заботу друг о друге.'}
                              </p>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible open={openSections['family-stress-do']} onOpenChange={() => toggleSection('family-stress-do')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                    <div className="flex items-center gap-3">
                     <Lightbulb className="h-5 w-5 text-sky-blue" />
                                <span className="font-medium text-foreground">Что я могу сделать?</span>
                              </div>
                              {openSections['family-stress-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                              <ul className="list-inside space-y-3 text-foreground">
                                <li>
                                  <strong>Установите границы.</strong> Определите, что важно для вашей семьи, и научитесь говорить "нет" дополнительным обязательствам.
                                </li>
                                <li>
                                  <strong>Проводите время вместе.</strong> Регулярное время для семьи без отвлекающих факторов может помочь укрепить связи.
                                </li>
                                <li>
                                  <strong>Обратитесь за поддержкой.</strong> В Waves мы можем помочь вашей семье найти способы справиться со стрессом и улучшить семейную динамику.
                                </li>
                              </ul>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                    )}
                    
                    {familyResults.partner_relationship && (
                      <div className="rounded-lg border border-border bg-white p-6">
                        <h3 className="text-xl font-bold text-foreground mb-4">Отношения с партнером</h3>
                        <div className="mb-6">
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.partner_relationship.status)}`}>
                            {getStatusText(familyResults.partner_relationship.status)}
                          </span>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                            <div 
                              className={`h-full ${
                                familyResults.partner_relationship.status === 'concerning' ? 'bg-coral' :
                                familyResults.partner_relationship.status === 'borderline' ? 'bg-yellow-400' :
                                'bg-secondary'
                              }`}
                              style={{ width: `${getProgressPercentage(familyResults.partner_relationship.score, 10)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Collapsible open={openSections['family-partner-mean']} onOpenChange={() => toggleSection('family-partner-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                                <span className="font-medium text-foreground">Что это значит?</span>
                              </div>
                              {openSections['family-partner-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                              <p className="text-foreground">
                                {familyResults.partner_relationship.status === 'concerning' 
                                  ? 'Вы сообщили, что в настоящее время испытываете <strong>конфликт или трудности в отношениях с вашим партнером.</strong> Это может влиять на всю семью.'
                                  : familyResults.partner_relationship.status === 'borderline'
                                  ? 'В ваших отношениях с партнером <strong>могут быть некоторые трудности.</strong> Важно обратить внимание на эти аспекты.'
                                  : 'Ваши отношения с партнером <strong>выглядят стабильными.</strong> Продолжайте поддерживать открытое общение и заботу друг о друге.'}
                              </p>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible open={openSections['family-partner-do']} onOpenChange={() => toggleSection('family-partner-do')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                    <div className="flex items-center gap-3">
                     <Lightbulb className="h-5 w-5 text-sky-blue" />
                                <span className="font-medium text-foreground">Что я могу сделать?</span>
                              </div>
                              {openSections['family-partner-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                              <ul className="list-inside space-y-3 text-foreground">
                                <li>
                                  <strong>Общайтесь открыто.</strong> Выделяйте время для честных разговоров о потребностях и чувствах каждого партнера.
                                </li>
                                <li>
                                  <strong>Ищите компромиссы.</strong> Работайте вместе над решениями, которые учитывают потребности обоих партнеров.
                                </li>
                                <li>
                                  <strong>Рассмотрите парную терапию.</strong> В Waves мы можем помочь вам улучшить общение и укрепить ваши отношения.
                                </li>
                              </ul>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                    )}
                    
                    {familyResults.coparenting && (
                      <div className="rounded-lg border border-border bg-white p-6">
                        <h3 className="text-xl font-bold text-foreground mb-4">Совместное воспитание</h3>
                        <div className="mb-6">
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.coparenting.status)}`}>
                            {getStatusText(familyResults.coparenting.status)}
                          </span>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                            <div 
                              className={`h-full ${
                                familyResults.coparenting.status === 'concerning' ? 'bg-coral' :
                                familyResults.coparenting.status === 'borderline' ? 'bg-yellow-400' :
                                'bg-secondary'
                              }`}
                              style={{ width: `${getProgressPercentage(familyResults.coparenting.score, 10)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Collapsible open={openSections['family-coparenting-mean']} onOpenChange={() => toggleSection('family-coparenting-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                                <span className="font-medium text-foreground">Что это значит?</span>
                              </div>
                              {openSections['family-coparenting-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                              <p className="text-foreground">
                                {familyResults.coparenting.status === 'concerning' 
                                  ? 'Вы указали, что <strong>сложно работать вместе с вашим со-родителем(ями)</strong> для воспитания вашего ребенка(детей), и это может привести к конфликту.'
                                  : familyResults.coparenting.status === 'borderline'
                                  ? 'В совместном воспитании <strong>могут быть некоторые трудности.</strong> Важно обратить внимание на эти аспекты.'
                                  : 'Вы <strong>эффективно работаете вместе</strong> с вашим со-родителем(ями) для воспитания вашего ребенка(детей). Продолжайте поддерживать открытое общение и сотрудничество.'}
                              </p>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible open={openSections['family-coparenting-do']} onOpenChange={() => toggleSection('family-coparenting-do')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                    <div className="flex items-center gap-3">
                     <Lightbulb className="h-5 w-5 text-sky-blue" />
                                <span className="font-medium text-foreground">Что я могу сделать?</span>
                              </div>
                              {openSections['family-coparenting-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                              <ul className="list-inside space-y-3 text-foreground">
                                <li>
                                  <strong>Установите общие правила.</strong> Работайте вместе над созданием согласованных правил и ожиданий для вашего ребенка.
                                </li>
                                <li>
                                  <strong>Поддерживайте открытое общение.</strong> Регулярно обсуждайте вопросы воспитания и стремитесь к компромиссам.
                                </li>
                                <li>
                                  <strong>Рассмотрите поддержку специалиста.</strong> В Waves мы можем помочь вам улучшить совместное воспитание и создать более сплоченную семейную команду.
                                </li>
                              </ul>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-lg border border-border bg-white p-6">
                <p className="text-foreground">
                  Семейная оценка завершена, но результаты еще не рассчитаны.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Legacy Family Section - скрываем, если нет данных */}
        {SHOW_LEGACY_SECTIONS && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">Ментальное здоровье вашей семьи</h2>

            {/* Worries */}
            <div className="mb-8 border-l-4 border-lavender pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                  <span className="text-sm font-medium text-white">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Беспокойства</h3>
              </div>
              <p className="mb-4 text-foreground/70">Беспокойства, которыми вы поделились о вашей семье</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                  Ментальное здоровье партнера
                </span>
              </div>
            </div>

            {/* Family Stress */}
            <div className="mb-8 border-l-4 border-lavender pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                  <span className="text-sm font-medium text-white">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Семейный стресс</h3>
              </div>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
                  Все в порядке
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                  <div className="h-full w-[40%] bg-secondary"></div>
                </div>
              </div>

              <Collapsible open={openSections['family-stress-mean']} onOpenChange={() => toggleSection('family-stress-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['family-stress-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    Ваша семья в настоящее время справляется с ежедневным жизненным стрессом.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Partner Relationship */}
            <div className="mb-8 border-l-4 border-lavender pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                  <span className="text-sm font-medium text-white">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Отношения с партнером</h3>
              </div>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                  Тревожно
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                  <div className="h-full w-[90%] bg-coral"></div>
                </div>
              </div>

              <Collapsible open={openSections['family-partner-mean']} onOpenChange={() => toggleSection('family-partner-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['family-partner-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    Вы сообщили, что в настоящее время испытываете <strong>конфликт или трудности в отношениях с вашим партнером.</strong>
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Co-Parenting */}
            <div className="mb-8 border-l-4 border-lavender pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                  <span className="text-sm font-medium text-white">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Совместное воспитание</h3>
              </div>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                  Тревожно
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                  <div className="h-full w-[85%] bg-coral"></div>
                </div>
              </div>

              <Collapsible open={openSections['family-coparenting-mean']} onOpenChange={() => toggleSection('family-coparenting-mean')}>
                 <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                    <div className="flex items-center gap-3">
                     <MessageCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['family-coparenting-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                  <p className="text-foreground">
                    Вы указали, что <strong>сложно работать вместе с вашим со-родителем(ями)</strong> для воспитания вашего ребенка(детей), и это может привести к конфликту.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Your Family's Recap */}
            <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-sky-blue to-sky-blue/80">
              <div className="flex items-center justify-between p-6">
                <h3 className="text-2xl font-bold text-white">Итоги вашей семьи</h3>
                <div className="h-16 w-16 rounded-full bg-white/20"></div>
              </div>
              <div className="space-y-4 bg-white p-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Семейный стресс</span>
                    <span className="text-sm text-primary">• Все в порядке</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                    <div className="h-full w-[40%] bg-secondary"></div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Я и мой партнер</span>
                    <span className="text-sm text-coral">• Тревожно</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                    <div className="h-full w-[90%] bg-coral"></div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Совместное воспитание</span>
                    <span className="text-sm text-coral">• Тревожно</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                    <div className="h-full w-[85%] bg-coral"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Saved Notice */}
        <div className="mb-8 rounded-lg border border-border bg-white p-6">
          <div className="flex items-center gap-3">
            <Save className="h-6 w-6 text-primary" />
            <p className="text-foreground">
              Этот отчет сохранен в вашей{" "}
              <button 
                onClick={() => navigate("/checkup-history")}
                className="font-medium text-primary underline hover:no-underline"
              >
                Истории отчетов
              </button>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => navigate("/cabinet")}
            className="w-full max-w-md"
          >
            Вернуться в личный кабинет
          </Button>
        </div>
      </div>
    </div>
  );
}

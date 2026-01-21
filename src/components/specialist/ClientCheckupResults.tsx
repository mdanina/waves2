/**
 * Компонент для отображения результатов чекапов клиента в ЛК специалиста
 * Показывает краткие результаты: ребенок, родитель (себя), семья
 * С возможностью просмотра детальных ответов на вопросы
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Baby,
  User,
  Users,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  Calendar,
  Eye,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getStatusText, getProgressPercentage } from '@/utils/resultsCalculations';
import { answerOptions, getQuestionsForAgeGroup } from '@/data/checkupQuestions';
import type { AgeGroup } from '@/data/checkupQuestions';
import { parentQuestions, frequencyOptions as parentFrequencyOptions } from '@/data/parentQuestions';
import { familyQuestions, wellbeingOptions, relationshipOptions, frequencyOptions as familyFrequencyOptions } from '@/data/familyQuestions';
import type { Database } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];
type Answer = Database['public']['Tables']['answers']['Row'];

type ScaleStatus = 'concerning' | 'borderline' | 'typical';
interface ScaleResult {
  score: number;
  max_score?: number;
  status: ScaleStatus;
}

// Старая структура v1 (SDQ - 5 шкал)
interface CheckupResultsV1 {
  emotional?: ScaleResult;
  conduct?: ScaleResult;
  hyperactivity?: ScaleResult;
  peer_problems?: ScaleResult;
  prosocial?: ScaleResult;
  total_difficulties?: number;
}

// Новая структура v2 (10 шкал)
interface CheckupResultsV2 {
  version: 2;
  age_group?: AgeGroup;
  emotion_regulation?: ScaleResult;
  behavior?: ScaleResult;
  executive_functions?: ScaleResult;
  sensory_processing?: ScaleResult;
  communication?: ScaleResult;
  social_cognition?: ScaleResult;
  identity?: ScaleResult;
  learning?: ScaleResult;
  motivation?: ScaleResult;
  trauma?: ScaleResult;
  calculated_at?: string;
}

type CheckupResults = CheckupResultsV1 | CheckupResultsV2;

// Проверка версии результатов
function isCheckupResultsV2(results: CheckupResults): results is CheckupResultsV2 {
  return 'version' in results && results.version === 2;
}

// Конфигурация шкал v2
const v2ScaleConfig = [
  { key: 'emotion_regulation', label: 'Регуляция эмоций', maxScore: 24 },
  { key: 'behavior', label: 'Поведение', maxScore: 16 },
  { key: 'executive_functions', label: 'Исполнительные функции', maxScore: 28 },
  { key: 'sensory_processing', label: 'Сенсорная обработка', maxScore: 20 },
  { key: 'communication', label: 'Коммуникация и речь', maxScore: 20 },
  { key: 'social_cognition', label: 'Социальное познание', maxScore: 24 },
  { key: 'identity', label: 'Самооценка', maxScore: 12 },
  { key: 'learning', label: 'Обучение', maxScore: 12 },
  { key: 'motivation', label: 'Мотивация', maxScore: 16 },
  { key: 'trauma', label: 'Травматический опыт', maxScore: 12 },
] as const;

// Конфигурация шкал v1
const v1ScaleConfig = [
  { key: 'emotional', label: 'Эмоциональные трудности', maxScore: 10 },
  { key: 'conduct', label: 'Поведенческие трудности', maxScore: 10 },
  { key: 'hyperactivity', label: 'Гиперактивность', maxScore: 10 },
  { key: 'peer_problems', label: 'Проблемы со сверстниками', maxScore: 10 },
] as const;

interface ParentResults {
  anxiety?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  depression?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

interface FamilyResults {
  family_stress?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  partner_relationship?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  coparenting?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

interface ChildCheckupData {
  profile: Profile;
  assessment: Assessment;
  results: CheckupResults;
  ageGroup?: AgeGroup;
}

interface ClientCheckupResultsProps {
  clientUserId: string;
}

// Иконка статуса
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'concerning':
      return <AlertCircle className="h-4 w-4 text-coral" />;
    case 'borderline':
      return <MinusCircle className="h-4 w-4 text-yellow-500" />;
    case 'typical':
      return <CheckCircle2 className="h-4 w-4 text-secondary" />;
    default:
      return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

// Цвет прогресс-бара
function getProgressColor(status: string): string {
  switch (status) {
    case 'concerning':
      return 'bg-coral';
    case 'borderline':
      return 'bg-yellow-400';
    case 'typical':
      return 'bg-secondary';
    default:
      return 'bg-muted';
  }
}

// Строка результата
function ResultRow({
  label,
  status,
  score,
  maxScore,
}: {
  label: string;
  status: string;
  score: number;
  maxScore: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <StatusIcon status={status} />
          <span>{label}</span>
        </div>
        <span className="text-muted-foreground">{getStatusText(status)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/50">
        <div
          className={`h-full ${getProgressColor(status)}`}
          style={{ width: `${getProgressPercentage(score, maxScore)}%` }}
        />
      </div>
    </div>
  );
}

// Компонент диалога с детальными ответами
function AnswersDialog({
  open,
  onOpenChange,
  assessmentId,
  assessmentType,
  ageGroup,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  assessmentType: 'checkup' | 'parent' | 'family';
  ageGroup?: AgeGroup;
  title: string;
}) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && assessmentId) {
      loadAnswers();
    }
  }, [open, assessmentId]);

  const loadAnswers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('question_id', { ascending: true });

      if (error) throw error;
      setAnswers(data || []);
    } catch (error) {
      console.error('Error loading answers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuestionText = (questionId: number) => {
    let questions: { id: number; text: string }[] = [];
    switch (assessmentType) {
      case 'checkup':
        // Используем вопросы для нужной возрастной группы
        questions = getQuestionsForAgeGroup(ageGroup || 'elementary');
        break;
      case 'parent':
        questions = parentQuestions;
        break;
      case 'family':
        questions = familyQuestions;
        break;
    }
    const question = questions.find((q) => q.id === questionId);
    return question?.text || `Вопрос ${questionId}`;
  };

  const getAnswerText = (questionId: number, value: number) => {
    // Определяем опции в зависимости от типа оценки и вопроса
    if (assessmentType === 'checkup') {
      // Для v2 все вопросы используют одинаковые answerOptions (0-4)
      return answerOptions.find((o) => o.value === value)?.label || `${value}`;
    }

    if (assessmentType === 'parent') {
      return parentFrequencyOptions.find((o) => o.value === value)?.label || `${value}`;
    }

    if (assessmentType === 'family') {
      const question = familyQuestions.find((q) => q.id === questionId);
      if (question?.answerType === 'wellbeing') {
        return wellbeingOptions.find((o) => o.value === value)?.label || `${value}`;
      }
      if (question?.answerType === 'relationship') {
        return relationshipOptions.find((o) => o.value === value)?.label || `${value}`;
      }
      return familyFrequencyOptions.find((o) => o.value === value)?.label || `${value}`;
    }

    return `${value}`;
  };

  const getAnswerColor = (value: number, maxValue: number) => {
    const ratio = value / maxValue;
    if (ratio >= 0.75) return 'text-coral';
    if (ratio >= 0.5) return 'text-yellow-600';
    if (ratio >= 0.25) return 'text-yellow-500';
    return 'text-secondary';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : answers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Ответы не найдены
            </p>
          ) : (
            <div className="space-y-4">
              {answers.map((answer, index) => {
                // Для v2 чекапа все вопросы используют шкалу 0-4
                const maxValue = 4;
                return (
                  <div
                    key={answer.id}
                    className="p-3 rounded-lg bg-muted/30 border"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {getQuestionText(answer.question_id)}
                        </p>
                        <p className={`text-sm font-medium mt-1 ${getAnswerColor(answer.value, maxValue)}`}>
                          {getAnswerText(answer.question_id, answer.value)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function ClientCheckupResults({ clientUserId }: ClientCheckupResultsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [childrenCheckups, setChildrenCheckups] = useState<ChildCheckupData[]>([]);
  const [parentAssessment, setParentAssessment] = useState<Assessment | null>(null);
  const [familyAssessment, setFamilyAssessment] = useState<Assessment | null>(null);

  // Состояние для диалога с ответами
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    assessmentId: string;
    assessmentType: 'checkup' | 'parent' | 'family';
    ageGroup?: AgeGroup;
    title: string;
  }>({
    open: false,
    assessmentId: '',
    assessmentType: 'checkup',
    ageGroup: undefined,
    title: '',
  });

  useEffect(() => {
    loadCheckupData();
  }, [clientUserId]);

  const loadCheckupData = async () => {
    try {
      setIsLoading(true);

      // Загружаем все профили клиента
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', clientUserId);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) {
        setIsLoading(false);
        return;
      }

      const profileIds = profiles.map((p) => p.id);

      // Загружаем все завершенные оценки одним запросом
      const { data: allAssessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select('*')
        .in('profile_id', profileIds)
        .eq('status', 'completed')
        .in('assessment_type', ['parent', 'family', 'checkup']);

      if (assessmentsError) throw assessmentsError;

      // Разделяем по типам
      const parentAssessments = allAssessments?.filter((a) => a.assessment_type === 'parent') || [];
      const familyAssessments = allAssessments?.filter((a) => a.assessment_type === 'family') || [];
      const checkupAssessments = allAssessments?.filter((a) => a.assessment_type === 'checkup') || [];

      // Профили по типам
      const parentProfile = profiles.find((p) => p.type === 'parent');
      const children = profiles.filter((p) => p.type === 'child');

      // Находим parent и family оценки
      let foundParentAssess: Assessment | null = null;
      let foundFamilyAssess: Assessment | null = null;

      if (parentProfile) {
        foundParentAssess = parentAssessments.find((a) => a.profile_id === parentProfile.id) || null;
        foundFamilyAssess = familyAssessments.find((a) => a.profile_id === parentProfile.id) || null;
      }

      // Если не нашли по профилю родителя, берем первую найденную
      if (!foundParentAssess && parentAssessments.length > 0) {
        foundParentAssess = parentAssessments[0];
      }
      if (!foundFamilyAssess && familyAssessments.length > 0) {
        foundFamilyAssess = familyAssessments[0];
      }

      setParentAssessment(foundParentAssess);
      setFamilyAssessment(foundFamilyAssess);

      // Обрабатываем чекапы детей
      const childrenData: ChildCheckupData[] = [];
      const checkupsMap = new Map(checkupAssessments.map((a) => [a.profile_id, a]));

      for (const child of children) {
        const checkupAssessment = checkupsMap.get(child.id);
        if (checkupAssessment && checkupAssessment.results_summary) {
          const results = checkupAssessment.results_summary as CheckupResults;
          childrenData.push({
            profile: child,
            assessment: checkupAssessment,
            results,
            ageGroup: (checkupAssessment.age_group as AgeGroup) ||
              (isCheckupResultsV2(results) ? results.age_group : undefined),
          });
        }
      }

      setChildrenCheckups(childrenData);
    } catch (error) {
      console.error('Error loading checkup data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAnswersDialog = (
    assessmentId: string,
    assessmentType: 'checkup' | 'parent' | 'family',
    title: string,
    ageGroup?: AgeGroup
  ) => {
    setDialogState({
      open: true,
      assessmentId,
      assessmentType,
      ageGroup,
      title,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Результаты чекапов</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Если нет ни одной оценки
  if (childrenCheckups.length === 0 && !parentAssessment && !familyAssessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Результаты чекапов</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Клиент еще не прошел ни одного чекапа
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Результаты чекапов</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Чекапы детей */}
          {childrenCheckups.map((childData) => {
            const isV2 = isCheckupResultsV2(childData.results);

            return (
              <div key={childData.profile.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Baby className="h-5 w-5 text-primary" />
                  <span className="font-medium">Ребенок: {childData.profile.first_name}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {childData.assessment.completed_at && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(childData.assessment.completed_at)}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        openAnswersDialog(
                          childData.assessment.id,
                          'checkup',
                          `Ответы: ${childData.profile.first_name}`,
                          childData.ageGroup
                        )
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ответы
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 pl-7">
                  {isV2 ? (
                    // Новая версия v2 - 10 шкал
                    <>
                      {v2ScaleConfig.map(({ key, label, maxScore }) => {
                        const result = (childData.results as CheckupResultsV2)[key as keyof CheckupResultsV2] as ScaleResult | undefined;
                        if (!result || typeof result !== 'object' || !('status' in result)) return null;
                        return (
                          <ResultRow
                            key={key}
                            label={label}
                            status={result.status}
                            score={result.score}
                            maxScore={result.max_score || maxScore}
                          />
                        );
                      })}
                    </>
                  ) : (
                    // Старая версия v1 - 4 шкалы SDQ
                    <>
                      {v1ScaleConfig.map(({ key, label, maxScore }) => {
                        const result = (childData.results as CheckupResultsV1)[key as keyof CheckupResultsV1] as ScaleResult | undefined;
                        if (!result || typeof result !== 'object' || !('status' in result)) return null;
                        return (
                          <ResultRow
                            key={key}
                            label={label}
                            status={result.status}
                            score={result.score}
                            maxScore={result.max_score || maxScore}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
                <Separator className="mt-4" />
              </div>
            );
          })}

          {/* Чекап родителя (себя) */}
          {parentAssessment && parentAssessment.results_summary && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-primary" />
                <span className="font-medium">Чекап себя</span>
                <div className="ml-auto flex items-center gap-2">
                  {parentAssessment.completed_at && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(parentAssessment.completed_at)}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      openAnswersDialog(parentAssessment.id, 'parent', 'Ответы: Чекап себя')
                    }
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ответы
                  </Button>
                </div>
              </div>
              <div className="space-y-3 pl-7">
                {(() => {
                  const results = parentAssessment.results_summary as ParentResults;
                  return (
                    <>
                      {results.anxiety && (
                        <ResultRow
                          label="Тревожность"
                          status={results.anxiety.status}
                          score={results.anxiety.score}
                          maxScore={6}
                        />
                      )}
                      {results.depression && (
                        <ResultRow
                          label="Депрессия"
                          status={results.depression.status}
                          score={results.depression.score}
                          maxScore={6}
                        />
                      )}
                    </>
                  );
                })()}
              </div>
              <Separator className="mt-4" />
            </div>
          )}

          {/* Чекап семьи */}
          {familyAssessment && familyAssessment.results_summary && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Чекап семьи</span>
                <div className="ml-auto flex items-center gap-2">
                  {familyAssessment.completed_at && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(familyAssessment.completed_at)}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      openAnswersDialog(familyAssessment.id, 'family', 'Ответы: Чекап семьи')
                    }
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ответы
                  </Button>
                </div>
              </div>
              <div className="space-y-3 pl-7">
                {(() => {
                  const results = familyAssessment.results_summary as FamilyResults;
                  return (
                    <>
                      {results.family_stress && (
                        <ResultRow
                          label="Семейный стресс"
                          status={results.family_stress.status}
                          score={results.family_stress.score}
                          maxScore={4}
                        />
                      )}
                      {results.partner_relationship && (
                        <ResultRow
                          label="Отношения с партнером"
                          status={results.partner_relationship.status}
                          score={results.partner_relationship.score}
                          maxScore={10}
                        />
                      )}
                      {results.coparenting && (
                        <ResultRow
                          label="Совместное воспитание"
                          status={results.coparenting.status}
                          score={results.coparenting.score}
                          maxScore={10}
                        />
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог с ответами */}
      <AnswersDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}
        assessmentId={dialogState.assessmentId}
        assessmentType={dialogState.assessmentType}
        ageGroup={dialogState.ageGroup}
        title={dialogState.title}
      />
    </>
  );
}

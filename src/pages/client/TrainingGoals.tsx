import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SerifHeading } from '@/components/design-system/SerifHeading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Target,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Calendar,
  Clock,
  Lightbulb,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/hooks/useProfiles';
import {
  GoalId,
  Goal,
  GoalAnswer,
  ProfileGoals,
  GoalRecommendations,
  TRAINING_GOALS,
  getGoalById,
  generateRecommendations,
} from '@/types/goals';

// Шаги флоу
type FlowStep = 'select_profile' | 'select_goals' | 'questionnaire' | 'results';

// Хук для хранения целей (localStorage mock)
function useProfileGoals() {
  const { user } = useAuth();
  const STORAGE_KEY = 'waves_profile_goals';

  const [goalsMap, setGoalsMap] = useState<Record<string, ProfileGoals>>({});

  useEffect(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        setGoalsMap(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading goals:', e);
    }
  }, [user?.id]);

  const saveGoals = useCallback((profileId: string, data: Omit<ProfileGoals, 'profileId' | 'updatedAt'>) => {
    if (!user?.id) return;

    const profileGoals: ProfileGoals = {
      profileId,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    setGoalsMap(prev => {
      const next = { ...prev, [profileId]: profileGoals };
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(next));
      return next;
    });
  }, [user?.id]);

  const getGoalsForProfile = useCallback((profileId: string) => {
    return goalsMap[profileId] || null;
  }, [goalsMap]);

  return { goalsMap, saveGoals, getGoalsForProfile };
}

export default function TrainingGoals() {
  const navigate = useNavigate();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { saveGoals, getGoalsForProfile } = useProfileGoals();

  // Состояние флоу
  const [step, setStep] = useState<FlowStep>('select_profile');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<GoalId[]>([]);
  const [currentQuestionGoalIndex, setCurrentQuestionGoalIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<GoalId, GoalAnswer[]>>({});
  const [recommendations, setRecommendations] = useState<GoalRecommendations | null>(null);

  // Текущая цель в опроснике
  const currentGoal = useMemo(() => {
    if (selectedGoals.length === 0) return null;
    return getGoalById(selectedGoals[currentQuestionGoalIndex]);
  }, [selectedGoals, currentQuestionGoalIndex]);

  // Текущий вопрос
  const currentQuestion = useMemo(() => {
    if (!currentGoal) return null;
    return currentGoal.questions[currentQuestionIndex];
  }, [currentGoal, currentQuestionIndex]);

  // Общий прогресс опросника
  const questionnaireProgress = useMemo(() => {
    if (selectedGoals.length === 0) return { current: 0, total: 0, percentage: 0 };

    let total = 0;
    let current = 0;

    for (let i = 0; i < selectedGoals.length; i++) {
      const goal = getGoalById(selectedGoals[i]);
      if (!goal) continue;

      total += goal.questions.length;

      if (i < currentQuestionGoalIndex) {
        current += goal.questions.length;
      } else if (i === currentQuestionGoalIndex) {
        current += currentQuestionIndex;
      }
    }

    return {
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    };
  }, [selectedGoals, currentQuestionGoalIndex, currentQuestionIndex]);

  // Выбранный профиль
  const selectedProfile = useMemo(() => {
    if (!selectedProfileId || !profiles) return null;
    return profiles.find(p => p.id === selectedProfileId) || null;
  }, [selectedProfileId, profiles]);

  // Переключение цели
  const toggleGoal = (goalId: GoalId) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(g => g !== goalId);
      }
      return [...prev, goalId];
    });
  };

  // Обработка ответа
  const handleAnswer = (value: string | string[] | number) => {
    if (!currentGoal || !currentQuestion) return;

    setAnswers(prev => {
      const goalAnswers = prev[currentGoal.id] || [];
      const existingIndex = goalAnswers.findIndex(a => a.questionId === currentQuestion.id);

      const newAnswer: GoalAnswer = {
        questionId: currentQuestion.id,
        value,
      };

      if (existingIndex >= 0) {
        goalAnswers[existingIndex] = newAnswer;
      } else {
        goalAnswers.push(newAnswer);
      }

      return { ...prev, [currentGoal.id]: goalAnswers };
    });
  };

  // Получение текущего ответа
  const getCurrentAnswer = (): string | string[] | number | undefined => {
    if (!currentGoal || !currentQuestion) return undefined;
    const goalAnswers = answers[currentGoal.id] || [];
    const answer = goalAnswers.find(a => a.questionId === currentQuestion.id);
    return answer?.value;
  };

  // Переход к следующему вопросу
  const nextQuestion = () => {
    if (!currentGoal) return;

    // Если есть ещё вопросы в текущей цели
    if (currentQuestionIndex < currentGoal.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return;
    }

    // Если есть ещё цели
    if (currentQuestionGoalIndex < selectedGoals.length - 1) {
      setCurrentQuestionGoalIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      return;
    }

    // Конец опросника - генерируем рекомендации
    const recs = generateRecommendations(selectedGoals, answers);
    setRecommendations(recs);
    setStep('results');
  };

  // Переход к предыдущему вопросу
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      return;
    }

    if (currentQuestionGoalIndex > 0) {
      const prevGoal = getGoalById(selectedGoals[currentQuestionGoalIndex - 1]);
      setCurrentQuestionGoalIndex(prev => prev - 1);
      setCurrentQuestionIndex(prevGoal ? prevGoal.questions.length - 1 : 0);
    }
  };

  // Сохранение результатов
  const saveResults = () => {
    if (!selectedProfileId || !recommendations) return;

    saveGoals(selectedProfileId, {
      goals: selectedGoals,
      answers,
      recommendations,
    });

    toast.success('Цели сохранены!');
    navigate('/cabinet/licenses');
  };

  // Проверка: можно ли перейти к следующему шагу
  const canProceed = useMemo(() => {
    switch (step) {
      case 'select_profile':
        return !!selectedProfileId;
      case 'select_goals':
        return selectedGoals.length > 0;
      case 'questionnaire':
        const answer = getCurrentAnswer();
        return answer !== undefined && (Array.isArray(answer) ? answer.length > 0 : true);
      default:
        return false;
    }
  }, [step, selectedProfileId, selectedGoals, getCurrentAnswer]);

  if (profilesLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Заголовок */}
      <div className="mb-8">
        <SerifHeading size="2xl" className="mb-2">
          Цели тренировок
        </SerifHeading>
        <p className="text-muted-foreground">
          {step === 'select_profile' && 'Выберите, для кого настраиваем цели'}
          {step === 'select_goals' && 'Что хотите улучшить?'}
          {step === 'questionnaire' && 'Расскажите подробнее'}
          {step === 'results' && 'Ваш персональный план'}
        </p>
      </div>

      {/* Шаг 1: Выбор профиля */}
      {step === 'select_profile' && (
        <div className="space-y-4">
          <Card className="glass-elegant border-2 p-6">
            <h3 className="font-medium mb-4">Для кого выбираем цели?</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {profiles?.map((profile) => {
                const existingGoals = getGoalsForProfile(profile.id);
                const isSelected = selectedProfileId === profile.id;

                return (
                  <div
                    key={profile.id}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      isSelected
                        ? 'border-coral bg-coral/5'
                        : 'border-border/50 hover:border-coral/50'
                    )}
                    onClick={() => setSelectedProfileId(profile.id)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-muted">
                        {profile.first_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {profile.first_name} {profile.last_name || ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile.type === 'parent' ? 'Родитель' : 'Ребёнок'}
                      </p>
                      {existingGoals && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Цели выбраны
                        </Badge>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-coral flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep('select_goals')}
              disabled={!canProceed}
              className="bg-gradient-to-r from-coral to-coral-light"
            >
              Продолжить
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Шаг 2: Выбор целей */}
      {step === 'select_goals' && (
        <div className="space-y-4">
          {/* Выбранный профиль */}
          {selectedProfile && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {selectedProfile.first_name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                Цели для <strong>{selectedProfile.first_name}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={() => setStep('select_profile')}
              >
                Изменить
              </Button>
            </div>
          )}

          <Card className="glass-elegant border-2 p-6">
            <h3 className="font-medium mb-4">
              Выберите цели <span className="text-muted-foreground font-normal">(можно несколько)</span>
            </h3>
            <div className="space-y-3">
              {TRAINING_GOALS.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id);

                return (
                  <div
                    key={goal.id}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      isSelected
                        ? 'border-coral bg-coral/5'
                        : 'border-border/50 hover:border-coral/50'
                    )}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <div className="text-2xl flex-shrink-0">{goal.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      isSelected
                        ? 'border-coral bg-coral'
                        : 'border-muted-foreground/30'
                    )}>
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep('select_profile')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад
            </Button>
            <Button
              onClick={() => {
                setCurrentQuestionGoalIndex(0);
                setCurrentQuestionIndex(0);
                setAnswers({});
                setStep('questionnaire');
              }}
              disabled={!canProceed}
              className="bg-gradient-to-r from-coral to-coral-light"
            >
              Продолжить
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Шаг 3: Опросник */}
      {step === 'questionnaire' && currentGoal && currentQuestion && (
        <div className="space-y-4">
          {/* Прогресс */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-coral to-coral-light transition-all duration-300"
                style={{ width: `${questionnaireProgress.percentage}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {questionnaireProgress.current + 1}/{questionnaireProgress.total}
            </span>
          </div>

          <Card className="glass-elegant border-2 p-6">
            {/* Текущая цель */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{currentGoal.icon}</span>
              <span className="text-sm text-muted-foreground">{currentGoal.title}</span>
            </div>

            {/* Вопрос */}
            <h3 className="font-medium text-lg mb-6">{currentQuestion.text}</h3>

            {/* Варианты ответа */}
            {currentQuestion.type === 'single' && (
              <div className="space-y-2">
                {currentQuestion.options.map((option) => {
                  const isSelected = getCurrentAnswer() === option.value;

                  return (
                    <div
                      key={option.id}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        isSelected
                          ? 'border-coral bg-coral/5'
                          : 'border-border/50 hover:border-coral/50'
                      )}
                      onClick={() => handleAnswer(option.value)}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        isSelected
                          ? 'border-coral bg-coral'
                          : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'multiple' && (
              <div className="space-y-2">
                {currentQuestion.options.map((option) => {
                  const currentValues = (getCurrentAnswer() as string[]) || [];
                  const isSelected = currentValues.includes(option.value as string);

                  return (
                    <div
                      key={option.id}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        isSelected
                          ? 'border-coral bg-coral/5'
                          : 'border-border/50 hover:border-coral/50'
                      )}
                      onClick={() => {
                        if (isSelected) {
                          handleAnswer(currentValues.filter(v => v !== option.value));
                        } else {
                          handleAnswer([...currentValues, option.value as string]);
                        }
                      }}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        isSelected
                          ? 'border-coral bg-coral'
                          : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                if (currentQuestionIndex === 0 && currentQuestionGoalIndex === 0) {
                  setStep('select_goals');
                } else {
                  prevQuestion();
                }
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад
            </Button>
            <Button
              onClick={nextQuestion}
              disabled={!canProceed}
              className="bg-gradient-to-r from-coral to-coral-light"
            >
              {currentQuestionGoalIndex === selectedGoals.length - 1 &&
               currentQuestionIndex === (currentGoal?.questions.length || 1) - 1
                ? 'Завершить'
                : 'Далее'
              }
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Шаг 4: Результаты */}
      {step === 'results' && recommendations && (
        <div className="space-y-6">
          {/* Успех */}
          <Card className="glass-elegant border-2 p-6 text-center bg-gradient-to-br from-success/5 to-success/10">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-success" />
            </div>
            <SerifHeading size="xl" className="mb-2">
              Цели для {selectedProfile?.first_name} готовы!
            </SerifHeading>
            <p className="text-muted-foreground">
              На основе ваших ответов мы подготовили персональные рекомендации
            </p>
          </Card>

          {/* Выбранные цели */}
          <Card className="glass-elegant border-2 p-6">
            <h3 className="font-medium mb-4">Выбранные цели</h3>
            <div className="flex flex-wrap gap-2">
              {selectedGoals.map(goalId => {
                const goal = getGoalById(goalId);
                if (!goal) return null;
                return (
                  <Badge key={goalId} variant="secondary" className="text-sm py-1.5 px-3">
                    {goal.icon} {goal.title}
                  </Badge>
                );
              })}
            </div>
          </Card>

          {/* Рекомендации */}
          <Card className="glass-elegant border-2 p-6">
            <h3 className="font-medium mb-4">Рекомендуемый план</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-coral" />
                <p className="text-2xl font-bold">{recommendations.sessionsPerWeek}</p>
                <p className="text-sm text-muted-foreground">тренировок в неделю</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-coral" />
                <p className="text-2xl font-bold">{recommendations.sessionDuration}</p>
                <p className="text-sm text-muted-foreground">минут за сессию</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-coral" />
                <p className="text-2xl font-bold capitalize">
                  {recommendations.intensity === 'light' && 'Лёгкая'}
                  {recommendations.intensity === 'moderate' && 'Умеренная'}
                  {recommendations.intensity === 'intensive' && 'Интенсивная'}
                </p>
                <p className="text-sm text-muted-foreground">интенсивность</p>
              </div>
            </div>
          </Card>

          {/* Советы */}
          {recommendations.tips.length > 0 && (
            <Card className="glass-elegant border-2 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-honey" />
                <h3 className="font-medium">Советы для эффективных тренировок</h3>
              </div>
              <ul className="space-y-2">
                {recommendations.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-coral">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Действия */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={saveResults}
              className="flex-1 bg-gradient-to-r from-coral to-coral-light"
            >
              Сохранить и перейти к лицензиям
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep('select_goals');
                setAnswers({});
                setRecommendations(null);
              }}
            >
              Изменить цели
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

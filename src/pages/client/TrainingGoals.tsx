import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SerifHeading } from '@/components/design-system/SerifHeading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileAvatar } from '@/components/avatars/ProfileAvatar';
import { Uicon } from '@/components/icons/Uicon';
import {
  Check,
  User,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/hooks/useProfiles';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getDativeName } from '@/lib/profileStorage';
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

// Хук для хранения целей (localStorage + БД)
function useProfileGoals() {
  const { user } = useAuth();
  const STORAGE_KEY = 'waves_profile_goals';

  const [goalsMap, setGoalsMap] = useState<Record<string, ProfileGoals>>({});

  useEffect(() => {
    if (!user?.id) return;
    
    const loadGoals = async () => {
      try {
        // Загружаем из localStorage
        const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
        if (stored) {
          setGoalsMap(JSON.parse(stored));
        }

        // Загружаем из БД
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, training_goals')
          .eq('user_id', user.id);

        if (error) {
          logger.error('Error loading training goals from DB:', error);
          return;
        }

        if (profiles) {
          const dbGoalsMap: Record<string, ProfileGoals> = {};
          profiles.forEach(profile => {
            if (profile.training_goals) {
              dbGoalsMap[profile.id] = profile.training_goals as ProfileGoals;
            }
          });

          // Объединяем: приоритет у БД, но если в localStorage есть более свежие данные, используем их
          if (Object.keys(dbGoalsMap).length > 0) {
            setGoalsMap(prev => {
              const merged = { ...dbGoalsMap, ...prev };
              // Сохраняем обратно в localStorage для синхронизации
              localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (e) {
        logger.error('Error loading goals:', e);
      }
    };

    loadGoals();
  }, [user?.id]);

  const saveGoals = useCallback(async (profileId: string, data: Omit<ProfileGoals, 'profileId' | 'updatedAt'>) => {
    if (!user?.id) return;

    const profileGoals: ProfileGoals = {
      profileId,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Сохраняем в localStorage
    setGoalsMap(prev => {
      const next = { ...prev, [profileId]: profileGoals };
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(next));
      return next;
    });

    // Сохраняем в БД
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          training_goals: profileGoals,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) {
        logger.error('Error saving training goals to database:', error);
      } else {
        logger.log('Training goals saved to database successfully');
      }
    } catch (error) {
      logger.error('Error saving training goals:', error);
    }
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
  const saveResults = async () => {
    if (!selectedProfileId || !recommendations) return;

    try {
      await saveGoals(selectedProfileId, {
        goals: selectedGoals,
        answers,
        recommendations,
      });

      toast.success('Цели сохранены!');
    } catch (error) {
      logger.error('Error saving goals:', error);
      toast.error('Ошибка при сохранении целей');
    }
  };

  // Проверка: есть ли профили без сохраненных целей
  const profilesWithoutGoals = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(profile => !getGoalsForProfile(profile.id));
  }, [profiles, getGoalsForProfile]);

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

  // Если профилей нет - показываем уведомление
  if (!profiles || profiles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="glass-elegant p-8 text-center" style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
          <div className="space-y-4">
            <SerifHeading size="xl" className="mb-2">
              Пока не подключены участники
            </SerifHeading>
            <p className="text-muted-foreground">
              Раздел будет доступен после добавления участников.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-8">
      {/* Заголовок */}
      {step !== 'results' && (
        <div className="mb-8">
          <SerifHeading size="2xl" className="mb-2">
            {step === 'select_profile' && 'Для кого выбираем цели?'}
            {step === 'select_goals' && 'Что хотите улучшить?'}
            {step === 'questionnaire' && 'Расскажите подробнее'}
          </SerifHeading>
        </div>
      )}

      {/* Шаг 1: Выбор профиля */}
      {step === 'select_profile' && (
        <div className="space-y-4">
          <Card className="glass-elegant p-6" style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
            <div className="grid gap-3 md:grid-cols-2">
              {profiles?.map((profile) => {
                const existingGoals = getGoalsForProfile(profile.id);
                const isSelected = selectedProfileId === profile.id;

                return (
                  <div
                    key={profile.id}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all bg-white',
                      isSelected
                        ? 'bg-coral-light/5'
                        : 'hover:bg-coral-light/5'
                    )}
                    style={isSelected ? {
                      boxShadow: '0 0 0 2px rgba(255, 182, 153, 0.6), 0 0 0 4px rgba(255, 182, 153, 0.3), 0 0 30px rgba(255, 182, 153, 0.4)'
                    } : undefined}
                    onClick={() => {
                      setSelectedProfileId(profile.id);
                      
                      // Если у профиля есть сохраненные цели, загружаем их и переходим к результатам
                      if (existingGoals) {
                        setSelectedGoals(existingGoals.goals || []);
                        setAnswers(existingGoals.answers || {});
                        setRecommendations(existingGoals.recommendations || null);
                        setStep('results');
                      }
                    }}
                  >
                    <ProfileAvatar
                      type={(profile.type || 'parent') as 'parent' | 'child'}
                      gender={(profile.gender || 'female') as 'male' | 'female'}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {profile.first_name} {profile.last_name || ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile.type === 'parent' ? 'Родитель' : 'Ребёнок'}
                      </p>
                      {existingGoals && existingGoals.goals && existingGoals.goals.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {existingGoals.goals.map(goalId => {
                            const goal = getGoalById(goalId);
                            if (!goal) return null;
                            return (
                              <Badge 
                                key={goalId}
                                className="text-xs text-coral-light border-0 whitespace-nowrap"
                                style={{ 
                                  background: 'rgba(255, 182, 153, 0.2)',
                                  backgroundImage: 'none'
                                }}
                              >
                                {goal.title}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep('select_goals')}
              disabled={!canProceed}
            >
              Продолжить
              <Uicon name="chevron-right" style="rr" className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Шаг 2: Выбор целей */}
      {step === 'select_goals' && (
        <div className="space-y-4">
          {/* Выбранный профиль */}

          <Card className="glass-elegant p-6" style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
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
                      'flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all bg-white',
                      isSelected
                        ? 'bg-coral-light/5'
                        : 'hover:bg-coral-light/5'
                    )}
                    style={isSelected ? {
                      boxShadow: '0 0 0 2px rgba(255, 182, 153, 0.6), 0 0 0 4px rgba(255, 182, 153, 0.3), 0 0 30px rgba(255, 182, 153, 0.4)'
                    } : undefined}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <div className="text-2xl flex-shrink-0">{goal.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
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
              <Uicon name="chevron-left" style="rr" className="h-4 w-4 mr-1" />
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
            >
              Продолжить
              <Uicon name="chevron-right" style="rr" className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Шаг 3: Опросник */}
      {step === 'questionnaire' && currentGoal && currentQuestion && (
        <div className="space-y-4">
          {/* Прогресс */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden border border-border/50">
              <div
                className="h-full bg-gradient-to-r from-coral to-coral-light transition-all duration-300 rounded-full"
                style={{ width: `${questionnaireProgress.percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground">
              {questionnaireProgress.current + 1}/{questionnaireProgress.total}
            </span>
          </div>

          <Card className="glass-elegant p-6" style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
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
                        'flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all bg-white',
                        isSelected
                          ? 'bg-coral-light/5'
                          : 'hover:bg-coral-light/5'
                      )}
                      style={isSelected ? {
                        boxShadow: '0 0 0 2px rgba(255, 182, 153, 0.6), 0 0 0 4px rgba(255, 182, 153, 0.3), 0 0 30px rgba(255, 182, 153, 0.4)'
                      } : undefined}
                      onClick={() => handleAnswer(option.value)}
                    >
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
                        'flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all bg-white',
                        isSelected
                          ? 'bg-coral-light/5'
                          : 'hover:bg-coral-light/5'
                      )}
                      style={isSelected ? {
                        boxShadow: '0 0 0 2px rgba(255, 182, 153, 0.6), 0 0 0 4px rgba(255, 182, 153, 0.3), 0 0 30px rgba(255, 182, 153, 0.4)'
                      } : undefined}
                      onClick={() => {
                        if (isSelected) {
                          handleAnswer(currentValues.filter(v => v !== option.value));
                        } else {
                          handleAnswer([...currentValues, option.value as string]);
                        }
                      }}
                    >
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
              <Uicon name="chevron-left" style="rr" className="h-4 w-4 mr-1" />
              Назад
            </Button>
            <Button
              onClick={nextQuestion}
              disabled={!canProceed}
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
          <div className="p-6 text-center">
            <SerifHeading size="xl" className="mb-2">
              Цели для {selectedProfile ? getDativeName(selectedProfile.first_name, selectedProfile.gender) : ''} готовы!
            </SerifHeading>
            <p className="text-muted-foreground">
              На основе ваших ответов мы подготовили персональные рекомендации
            </p>
          </div>

          {/* Выбранные цели */}
          <Card className="bg-white p-6 border-0">
            <h3 className="font-medium mb-4">Выбранные цели</h3>
            <div className="flex flex-wrap gap-2">
              {selectedGoals.map(goalId => {
                const goal = getGoalById(goalId);
                if (!goal) return null;
                return (
                  <Badge key={goalId} variant="secondary">
                    {goal.title}
                  </Badge>
                );
              })}
            </div>
          </Card>

          {/* Рекомендации */}
          <Card className="bg-white p-4 sm:p-6 border-0">
            <h3 className="font-medium mb-4 sm:mb-6 text-[#1a1a1a]">Рекомендуемый план</h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              {/* Тренировок в неделю */}
              <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#ffecd2] via-[#ffd7ba] to-[#fcb69f] p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_6px_30px_rgba(0,0,0,0.1)] hover:scale-[1.02]">
                <div className="relative z-10">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center mb-3 sm:mb-4" style={{ lineHeight: 0 }}>
                    <Uicon name="calendar" style="rr" className="h-5 w-5 sm:h-6 sm:w-6 text-[#1a1a1a]" />
                  </div>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-1">{recommendations.sessionsPerWeek}</p>
                  <p className="text-xs sm:text-sm text-[#1a1a1a]/80 font-medium">тренировок в неделю</p>
                </div>
              </div>

              {/* Минут за сессию */}
              <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#FFE5F0] via-[#FFD4E8] to-[#FFC0E0] p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_6px_30px_rgba(0,0,0,0.1)] hover:scale-[1.02]">
                <div className="relative z-10">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/40 backdrop-blur-sm flex items-center justify-center mb-3 sm:mb-4" style={{ lineHeight: 0 }}>
                    <Uicon name="clock" style="rr" className="h-5 w-5 sm:h-6 sm:w-6 text-[#1a1a1a]" />
                  </div>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-1">{recommendations.sessionDuration}</p>
                  <p className="text-xs sm:text-sm text-[#1a1a1a]/80 font-medium">минут за сессию</p>
                </div>
              </div>

              {/* Интенсивность */}
              <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#e6dff5] via-[#d4c5f0] to-[#c8b8e8] p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_6px_30px_rgba(0,0,0,0.1)] hover:scale-[1.02]">
                <div className="relative z-10">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center mb-3 sm:mb-4" style={{ lineHeight: 0 }}>
                    <Uicon name="target" style="rr" className="h-5 w-5 sm:h-6 sm:w-6 text-[#1a1a1a]" />
                  </div>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1a1a1a] mb-1 capitalize break-words">
                    {recommendations.intensity === 'light' && 'Лёгкая'}
                    {recommendations.intensity === 'moderate' && 'Умеренная'}
                    {recommendations.intensity === 'intensive' && 'Интенсивная'}
                  </p>
                  <p className="text-xs sm:text-sm text-[#1a1a1a]/80 font-medium">интенсивность</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Советы */}
          {recommendations.tips.length > 0 && (
            <Card className="bg-white p-6 border-0">
              <h3 className="font-medium mb-4">Советы для эффективных тренировок</h3>
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
              variant="outline"
              onClick={() => {
                setStep('select_goals');
                setAnswers({});
                setRecommendations(null);
              }}
            >
              Редактировать
            </Button>
            {profilesWithoutGoals.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setStep('select_profile');
                  setSelectedProfileId(null);
                  setSelectedGoals([]);
                  setAnswers({});
                  setRecommendations(null);
                  setCurrentQuestionGoalIndex(0);
                  setCurrentQuestionIndex(0);
                }}
              >
                Настроить для другого пользователя
              </Button>
            )}
            <Button
              onClick={saveResults}
              className="flex-1"
            >
              Сохранить
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

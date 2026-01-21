import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  getQuestionsForAgeGroup,
  getScalesForAgeGroup,
  answerOptions,
  type AgeGroup,
  type Question,
} from "@/data/checkupQuestions";
import { useAssessment } from "@/hooks/useAssessment";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { getProfile, getAgeGroup, getPrepositionalName } from "@/lib/profileStorage";
import { findNextChildWithoutCheckup } from "@/lib/assessmentStorage";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { reverseScore4 as reverseScore, unreverseScore4 as unreverseScore } from "@/utils/scoring";
import type { Database } from "@/lib/supabase";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface Answer {
  questionId: number;
  value: number | null;
}

const TRANSITION_DELAY_MS = 300;

export default function CheckupQuestions() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();
  const [searchParams] = useSearchParams();
  const startIndex = parseInt(searchParams.get("start") || "1") - 1;
  const { currentProfileId, setCurrentProfileId, setCurrentProfile } = useCurrentProfile();

  // Используем profileId из URL или из контекста
  const profileId = params.profileId || currentProfileId;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('elementary');

  // Получаем вопросы для текущей возрастной группы
  const questions = useMemo(() => getQuestionsForAgeGroup(ageGroup), [ageGroup]);

  // Используем хук для работы с оценкой
  const {
    assessmentId,
    currentStep,
    loading,
    saveAnswer,
    getSavedAnswer,
    savedAnswers,
    complete
  } = useAssessment({
    assessmentType: 'checkup',
    totalSteps: questions.length,
    profileId: profileId,
  });

  // Загружаем профиль и определяем возрастную группу
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (profileId) {
        try {
          const loadedProfile = await getProfile(profileId);
          if (!cancelled && loadedProfile) {
            setProfile(loadedProfile);

            // Определяем возрастную группу по дате рождения
            const childAgeGroup = getAgeGroup(loadedProfile.dob);
            setAgeGroup(childAgeGroup);

            logger.log('Child age group determined:', {
              profileId: loadedProfile.id,
              dob: loadedProfile.dob,
              ageGroup: childAgeGroup,
            });
          }
        } catch (error) {
          if (!cancelled) {
            logger.error('Error loading profile:', error);
          }
        }
      }
    }
    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  // Сохраняем возрастную группу в assessment при её изменении
  useEffect(() => {
    async function saveAgeGroup() {
      if (assessmentId && ageGroup) {
        try {
          await supabase
            .from('assessments')
            .update({ age_group: ageGroup })
            .eq('id', assessmentId);
        } catch (error) {
          logger.error('Error saving age_group to assessment:', error);
        }
      }
    }
    saveAgeGroup();
  }, [assessmentId, ageGroup]);

  // Восстанавливаем индекс вопроса из URL параметра start (приоритет) или из сохраненного шага
  // Если есть параметр start в URL, используем его (это значит, что мы вернулись с interlude)
  const hasStartParam = searchParams.has("start");
  const initialIndex = hasStartParam
    ? startIndex
    : (profileId && currentStep > 1 ? currentStep - 1 : 0);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<Answer[]>(
    questions.map((q) => ({
      questionId: q.id,
      value: null
    }))
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Пересоздаем массив ответов при смене набора вопросов
  useEffect(() => {
    setAnswers(
      questions.map((q) => ({
        questionId: q.id,
        value: null
      }))
    );
    setIsInitialized(false);
  }, [questions]);

  // Ref для хранения таймеров, чтобы можно было их очистить
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Восстанавливаем ответы и позицию при загрузке (только один раз)
  // Зависимости оптимизированы для предотвращения лишних перезапусков
  const startParam = searchParams.get("start");
  useEffect(() => {
    // Ждём пока загрузятся данные и currentStep будет актуальным
    if (!loading && profileId && !isInitialized && questions.length > 0 && savedAnswers.size >= 0) {
      // Проверяем, есть ли уже сохраненные ответы (используем savedAnswers напрямую)
      const hasSavedAnswers = questions.some(q => savedAnswers.has(q.id));

      if (hasSavedAnswers) {
        const restoredAnswers = questions.map((q) => {
          const savedValue = savedAnswers.get(q.id) ?? null;
          // Если вопрос обратный и есть сохраненное значение, применяем обратное преобразование для отображения
          if (q.isReverse && savedValue !== null && savedValue >= 0) {
            return {
              questionId: q.id,
              value: unreverseScore(savedValue),
            };
          }
          return {
            questionId: q.id,
            value: savedValue,
          };
        });
        setAnswers(restoredAnswers);
      }

      // Восстанавливаем позицию: приоритет URL параметра, затем сохраненного шага
      if (startParam) {
        // Параметр start в URL
        const startIdx = parseInt(startParam) - 1;
        if (startIdx >= 0 && startIdx < questions.length) {
          setCurrentQuestionIndex(startIdx);
        }
      } else if (currentStep > 1) {
        // Восстанавливаем из сохранённого шага в БД
        const stepIndex = currentStep - 1;
        if (stepIndex >= 0 && stepIndex < questions.length) {
          setCurrentQuestionIndex(stepIndex);
        }
      }

      setIsInitialized(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profileId, currentStep, isInitialized, startParam, questions]);

  // Скролл вверх при смене вопроса (должен быть до ранних return)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentQuestionIndex]);

  // Cleanup таймеров при размонтировании компонента (должен быть до ранних return)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Мемоизированный обработчик ответа для предотвращения лишних ререндеров кнопок
  const handleAnswer = useCallback(async (value: number) => {
    const question = questions[currentQuestionIndex];
    if (!question) {
      logger.error('Current question is not defined');
      return;
    }

    try {
      // Обновляем локальное состояние (functional update для оптимизации)
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[currentQuestionIndex] = {
          questionId: question.id,
          value,
        };
        return newAnswers;
      });

      // Применяем reverse scoring для обратных вопросов ПРИ СОХРАНЕНИИ
      const valueToSave = question.isReverse === true ? reverseScore(value) : value;

      // Сохраняем в базу данных
      if (profileId) {
        try {
          await saveAnswer(
            question.id,
            `checkup_${question.id.toString().padStart(2, '0')}`,
            question.scale,
            valueToSave,
            'default',
            currentQuestionIndex + 1
          );
        } catch (error) {
          logger.error('Error saving answer:', error);
        }
      }

      // Очищаем предыдущий таймер
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Автоматически переходим к следующему вопросу
      timeoutRef.current = setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          if (profileId) {
            window.history.replaceState({}, '', `/checkup-questions/${profileId}`);
          }
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          // Завершаем чекап
          if (profileId) {
            (async () => {
              try {
                await complete();
                const nextChild = await findNextChildWithoutCheckup(profileId);
                if (nextChild) {
                  setCurrentProfileId(nextChild.id);
                  setCurrentProfile(nextChild);
                  navigate(`/checkup-intro/${nextChild.id}`);
                } else {
                  navigate("/parent-intro");
                }
              } catch (error) {
                logger.error('Error completing assessment:', error);
                navigate("/parent-intro");
              }
            })();
          } else {
            navigate("/parent-intro");
          }
        }
        timeoutRef.current = null;
      }, TRANSITION_DELAY_MS);
    } catch (error) {
      logger.error('Error in handleAnswer:', error);
    }
  }, [currentQuestionIndex, questions, profileId, saveAnswer, complete, navigate, setCurrentProfileId, setCurrentProfile]);

  // Мемоизированный обработчик пропуска вопроса
  const handleSkip = useCallback(async () => {
    const question = questions[currentQuestionIndex];
    if (!question) return;

    // Сохраняем пропущенный ответ
    if (profileId) {
      await saveAnswer(
        question.id,
        `checkup_${question.id.toString().padStart(2, '0')}`,
        question.scale,
        -1,
        'default',
        currentQuestionIndex + 1
      );
    }

    // Обновляем локальное состояние
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = {
        questionId: question.id,
        value: -1,
      };
      return newAnswers;
    });

    // Очищаем предыдущий таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Переходим к следующему вопросу
    timeoutRef.current = setTimeout(async () => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        if (profileId) {
          try {
            await complete();
            const nextChild = await findNextChildWithoutCheckup(profileId);
            if (nextChild) {
              setCurrentProfileId(nextChild.id);
              setCurrentProfile(nextChild);
              navigate(`/checkup-intro/${nextChild.id}`);
            } else {
              navigate("/parent-intro");
            }
          } catch (error) {
            logger.error('Error checking next child:', error);
            navigate("/parent-intro");
          }
        } else {
          navigate("/parent-intro");
        }
      }
      timeoutRef.current = null;
    }, TRANSITION_DELAY_MS);
  }, [currentQuestionIndex, questions, profileId, saveAnswer, complete, navigate, setCurrentProfileId, setCurrentProfile]);

  // Проверка на существование вопроса
  if (!questions || questions.length === 0) {
    logger.error('questions is not defined or empty');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Ошибка загрузки вопросов</p>
        </div>
      </div>
    );
  }

  if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
    navigate("/checkup-intro");
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    navigate("/checkup-intro");
    return null;
  }

  // Вычисляем после проверок
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Склоненное имя ребенка для заголовка (предложный падеж: "о ком?")
  const childNamePrepositional = profile
    ? getPrepositionalName(profile.first_name, profile.gender as 'male' | 'female' | 'other' | null)
    : 'вашем ребенке';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="border-b border-border bg-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1 bg-primary-foreground/20" />
            <span className="text-sm font-medium text-primary-foreground">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          <div className="space-y-6">
            <p className="text-center text-muted-foreground">
              Пожалуйста, ответьте на следующие вопросы о {childNamePrepositional}.
              Оценивайте ситуацию за последние шесть месяцев.
            </p>

            <h2 className="text-center text-3xl font-bold text-foreground">
              {currentQuestion.text}
            </h2>

            <div className="space-y-3 pt-8">
              {answerOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full rounded-lg border border-border bg-card px-6 py-4 text-center text-base font-medium text-card-foreground transition-all hover:border-primary hover:bg-secondary/50 active:scale-[0.98]"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="pt-8 text-center">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                Пропустить
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

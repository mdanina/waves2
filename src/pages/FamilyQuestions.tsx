import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { familyQuestions, wellbeingOptions, relationshipOptions, frequencyOptions } from "@/data/familyQuestions";
import { useAssessment } from "@/hooks/useAssessment";
import { reverseScore5, unreverseScore5 } from "@/utils/scoring";

interface Answer {
  questionId: number;
  value: number | null;
}

const TRANSITION_DELAY_MS = 300;

export default function FamilyQuestions() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();
  
  const {
    currentStep,
    loading,
    saveAnswer,
    getSavedAnswer,
    complete,
    assessmentId
  } = useAssessment({
    assessmentType: 'family',
    totalSteps: familyQuestions.length,
    profileId: params.profileId,
  });

  // Инициализируем индекс на основе сохраненного шага или 0
  const initialIndex = !loading && currentStep > 1 ? currentStep - 1 : 0;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<Answer[]>(
    familyQuestions.map((q) => ({ 
      questionId: q.id, 
      value: null 
    }))
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Восстанавливаем ответы при загрузке (только один раз)
  useEffect(() => {
    if (!loading && assessmentId && !isInitialized) {
      const restoredAnswers = familyQuestions.map((q) => {
        const savedValue = getSavedAnswer(q.id);
        // Если вопрос обратный и есть сохраненное значение, применяем обратное преобразование для отображения
        if (q.isReverse && savedValue !== null && savedValue >= 0 && savedValue <= 5) {
          return {
            questionId: q.id,
            value: unreverseScore5(savedValue),
          };
        }
        return {
          questionId: q.id,
          value: savedValue,
        };
      });
      setAnswers(restoredAnswers);

      // Устанавливаем индекс только один раз при инициализации
      if (currentStep > 1) {
        const stepIndex = currentStep - 1;
        if (stepIndex >= 0 && stepIndex < familyQuestions.length) {
          setCurrentQuestionIndex(stepIndex);
        }
      }
      setIsInitialized(true);
    }
  }, [loading, assessmentId, currentStep, isInitialized, getSavedAnswer]);

  // Скролл вверх при смене вопроса (должен быть до ранних return)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentQuestionIndex]);

  if (currentQuestionIndex < 0 || currentQuestionIndex >= familyQuestions.length) {
    navigate("/family-intro");
    return null;
  }

  const currentQuestion = familyQuestions[currentQuestionIndex];
  if (!currentQuestion) {
    navigate("/family-intro");
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / familyQuestions.length) * 100;

  const getAnswerOptions = () => {
    switch (currentQuestion.answerType) {
      case 'wellbeing':
        return wellbeingOptions;
      case 'relationship':
        return relationshipOptions;
      case 'frequency':
        return frequencyOptions;
      default:
        return [];
    }
  };

  const currentAnswerOptions = getAnswerOptions();

  const handleAnswer = async (value: number) => {
    try {
      if (!currentQuestion) {
        console.error('Current question is not defined');
        return;
      }

      // Обновляем локальное состояние
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = {
        questionId: currentQuestion.id,
        value,
      };
      setAnswers(newAnswers);

      // Применяем reverse scoring для обратных вопросов ПРИ СОХРАНЕНИИ
      const valueToSave = currentQuestion.isReverse === true ? reverseScore5(value) : value;

      // Сохраняем в базу данных (assessmentId проверяется внутри saveAnswer)
      try {
        await saveAnswer(
          currentQuestion.id,
          `family_${currentQuestion.id.toString().padStart(2, '0')}`,
          currentQuestion.category,
          valueToSave, // Сохраняем уже преобразованное значение
          currentQuestion.answerType,
          currentQuestionIndex + 1
        );
      } catch (error) {
        console.error('Error saving answer:', error);
        // Продолжаем выполнение даже если сохранение не удалось
      }

      // Автоматически переходим к следующему вопросу
      setTimeout(async () => {
        if (currentQuestionIndex < familyQuestions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          // Завершаем оценку и ЖДЁМ завершения перед навигацией
          // complete() сам проверяет наличие assessmentId
          await complete();
          navigate("/checkup-results");
        }
      }, TRANSITION_DELAY_MS);
    } catch (error) {
      console.error('Error in handleAnswer:', error);
    }
  };

  const handleSkip = async () => {
    // Сохраняем пропущенный ответ (используем -1 как маркер пропущенного вопроса)
    // saveAnswer сам проверяет наличие assessmentId
    await saveAnswer(
      currentQuestion.id,
      `family_${currentQuestion.id.toString().padStart(2, '0')}`,
      currentQuestion.category,
      -1, // -1 означает пропущенный вопрос
      currentQuestion.answerType,
      currentQuestionIndex + 1
    );

    // Обновляем локальное состояние
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      value: -1,
    };
    setAnswers(newAnswers);

    // Переходим к следующему вопросу
    setTimeout(async () => {
      if (currentQuestionIndex < familyQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Завершаем оценку и ЖДЁМ завершения перед навигацией
        await complete();
        navigate("/checkup-results");
      }
    }, TRANSITION_DELAY_MS);
  };

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
              {currentQuestionIndex + 1} / {familyQuestions.length}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          <div className="rounded-lg bg-secondary/30 px-6 py-3 text-center">
            <span className="font-medium text-secondary-foreground">
              {currentQuestion.category}
            </span>
          </div>

          <div className="space-y-6">
            <h2 className="text-center text-3xl font-bold text-foreground">
              {currentQuestion.text}
            </h2>

            <div className="space-y-3 pt-8">
              {currentAnswerOptions.map((option) => (
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
              {currentQuestionIndex < familyQuestions.length - 1 ? (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Пропустить
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Завершить
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

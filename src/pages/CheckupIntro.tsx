import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { getProfile, isEligibleForCheckup, CHECKUP_MIN_AGE, CHECKUP_MAX_AGE } from "@/lib/profileStorage";
import { useAssessment } from "@/hooks/useAssessment";
import { checkupQuestions } from "@/data/checkupQuestions";
import type { Database } from "@/lib/supabase";
import childFemaleAvatar from "@/assets/friendly-and-clean-face-of-a-white-girl-7-yo--soft.png";
import childMaleAvatar from "@/assets/friendly-and-clean-face-of-a-white-boy-7-yo--soft- (1).png";

type Profile = Database['public']['Tables']['profiles']['Row'];

const TOTAL_QUESTIONS = checkupQuestions.length; // 31

export default function CheckupIntro() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();
  const { currentProfileId } = useCurrentProfile();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: 'too_young' | 'too_old' | 'no_dob';
    age?: number;
  } | null>(null);

  // Используем profileId из URL или из контекста
  const profileId = params.profileId || currentProfileId;

  // Получаем данные о прогрессе чекапа
  const { currentStep, savedAnswers, loading: assessmentLoading } = useAssessment({
    assessmentType: 'checkup',
    totalSteps: TOTAL_QUESTIONS,
    profileId: profileId,
  });

  // Вычисляем прогресс на основе сохранённых ответов
  const progress = useMemo(() => {
    const answeredCount = savedAnswers.size;
    return (answeredCount / TOTAL_QUESTIONS) * 100;
  }, [savedAnswers.size]);

  const displayStep = useMemo(() => {
    // Показываем следующий вопрос, на который нужно ответить
    return Math.min(currentStep, TOTAL_QUESTIONS);
  }, [currentStep]);

  // Функция для выбора аватара на основе пола ребенка
  const getAvatarImage = useCallback((profile: Profile | null) => {
    if (!profile) {
      return childFemaleAvatar; // Fallback
    }
    return profile.gender === 'male' ? childMaleAvatar : childFemaleAvatar;
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (profileId) {
        try {
          const loadedProfile = await getProfile(profileId);
          setProfile(loadedProfile);

          // Проверяем возраст ребенка
          if (loadedProfile) {
            const elig = isEligibleForCheckup(loadedProfile.dob);
            setEligibility(elig);
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [profileId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-muted/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground">
              {assessmentLoading ? "..." : `${displayStep} / ${TOTAL_QUESTIONS}`}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-20">
        <div className="space-y-12 text-center">
          <img
            src={getAvatarImage(profile)}
            alt={profile ? `${profile.first_name}` : "Ребенок"}
            className="mx-auto h-80 w-80 rounded-full object-cover"
          />

          {eligibility && !eligibility.eligible ? (
            // Ребенок не подходит по возрасту
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-foreground">
                {eligibility.reason === 'too_young' ? (
                  <>
                    {profile?.first_name || 'Ребенок'} ещё слишком {profile?.gender === 'male' ? 'мал' : 'мала'} для чекапа
                  </>
                ) : eligibility.reason === 'too_old' ? (
                  <>
                    Чекап предназначен для детей до {CHECKUP_MAX_AGE} лет
                  </>
                ) : (
                  <>Не указана дата рождения</>
                )}
              </h1>
              <p className="text-lg text-muted-foreground">
                {eligibility.reason === 'too_young' ? (
                  <>
                    Наш чекап разработан для детей от {CHECKUP_MIN_AGE} до {CHECKUP_MAX_AGE} лет.
                    {profile?.first_name ? ` ${profile.first_name}` : ' Ребенку'} сейчас {eligibility.age} {eligibility.age === 1 ? 'год' : eligibility.age && eligibility.age < 5 ? 'года' : 'лет'}.
                    Вы сможете пройти чекап, когда {profile?.gender === 'male' ? 'ему' : 'ей'} исполнится {CHECKUP_MIN_AGE} года.
                  </>
                ) : eligibility.reason === 'too_old' ? (
                  <>
                    Наш чекап разработан для детей от {CHECKUP_MIN_AGE} до {CHECKUP_MAX_AGE} лет.
                    Для взрослых мы предлагаем другие инструменты оценки.
                  </>
                ) : (
                  <>Пожалуйста, укажите дату рождения в профиле ребенка.</>
                )}
              </p>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="h-14 w-full max-w-md text-base font-medium"
              >
                Вернуться на главную
              </Button>
            </div>
          ) : (
            // Ребенок подходит по возрасту - показываем обычный интро
            <>
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-foreground">
                  {profile ? (
                    <>Давайте сосредоточимся на <span className="font-bold">{profile.first_name}</span>.</>
                  ) : (
                    <>Давайте сосредоточимся на ребенке.</>
                  )}
                </h1>
              </div>

              <Button
                size="lg"
                onClick={() => {
                  if (profileId) {
                    navigate(`/checkup-questions/${profileId}`);
                  } else {
                    navigate("/checkup");
                  }
                }}
                className="h-14 w-full max-w-md text-base font-medium"
                disabled={assessmentLoading}
              >
                {savedAnswers.size > 0 ? "Продолжим" : "Начнем"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

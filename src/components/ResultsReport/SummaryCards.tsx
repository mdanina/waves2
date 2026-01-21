import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/lib/supabase';
import type { ChildCheckupData, ScaleResult } from '@/hooks/useResultsData';
import { isCheckupResultsV2 } from '@/hooks/useResultsData';
import { getStatusText, getStatusEmoji } from '@/utils/resultsCalculations';
import { calculateAge } from '@/lib/profileStorage';
import type { ScaleType } from '@/data/checkupQuestions';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface ParentResults {
  anxiety?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  depression?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  total?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

interface FamilyResults {
  family_stress?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  partner_relationship?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  coparenting?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

// Краткие названия для 10 шкал V2
const scaleLabels: Record<ScaleType, string> = {
  emotion_regulation: 'Эмоции',
  behavior: 'Поведение',
  executive_functions: 'Внимание',
  sensory_processing: 'Сенсорика',
  communication: 'Речь',
  social_cognition: 'Социальное',
  identity: 'Самооценка',
  learning: 'Обучение',
  motivation: 'Мотивация',
  trauma: 'Травма',
};

// Порядок отображения шкал
const scaleOrder: ScaleType[] = [
  'emotion_regulation',
  'behavior',
  'executive_functions',
  'sensory_processing',
  'communication',
  'social_cognition',
  'identity',
  'learning',
  'motivation',
  'trauma',
];

interface SummaryCardsProps {
  childrenCheckups: ChildCheckupData[];
  parentAssessment: Assessment | null;
  familyAssessment: Assessment | null;
}

export function SummaryCards({ childrenCheckups, parentAssessment, familyAssessment }: SummaryCardsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Подсчитываем общее количество карточек
  const totalCards = childrenCheckups.length + (parentAssessment ? 1 : 0) + (familyAssessment ? 1 : 0);

  // Проверяем возможность прокрутки и обновляем индекс
  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    
    // Обновляем индекс на основе текущей позиции прокрутки
    const cardWidth = 320 + 16; // min-w-[320px] + gap-4
    const newIndex = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(Math.max(0, Math.min(newIndex, totalCards - 1)));
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [childrenCheckups, parentAssessment, familyAssessment]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const cardWidth = 320 + 16; // min-w-[320px] + gap-4
    const scrollAmount = cardWidth;
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });

    // Обновляем индекс для точек навигации
    const newIndex = Math.round(newScroll / scrollAmount);
    setCurrentIndex(Math.max(0, Math.min(newIndex, totalCards - 1)));
  };

  return (
    <div className="relative">
      {/* Кнопка навигации влево */}
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-md"
          onClick={() => scroll('left')}
          aria-label="Предыдущая карточка"
        >
          <ChevronLeft className="h-5 w-5 text-ink" />
        </Button>
      )}

      {/* Кнопка навигации вправо */}
      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-md"
          onClick={() => scroll('right')}
          aria-label="Следующая карточка"
        >
          <ChevronRight className="h-5 w-5 text-ink" />
        </Button>
      )}

      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={checkScrollability}
      >
        {/* Child Cards - показываем всех детей */}
        {childrenCheckups.map((childData) => {
          const childProfile = childData.profile;
          const childResults = childData.results;
          const childAge = childProfile.dob ? calculateAge(childProfile.dob) : null;
          const isV2 = isCheckupResultsV2(childResults);

          return (
            <div
              key={childProfile.id}
              className="min-w-[320px] flex-1 rounded-xl bg-gradient-lavender p-6 text-ink shadow-soft"
            >
              <div className="mb-4">
                <h3 className="text-xl font-extrabold text-ink">
                  {childProfile.first_name} {childProfile.last_name || ''}
                </h3>
                {childAge !== null && (
                  <p className="text-sm text-ink/70">{childAge} лет</p>
                )}
              </div>
              <div className="space-y-2">
                {isV2 ? (
                  // V2: показываем все 10 шкал компактно
                  <>
                    {scaleOrder.map((scaleKey) => {
                      const result = childResults[scaleKey] as ScaleResult | undefined;
                      if (!result) return null;

                      return (
                        <div key={scaleKey}>
                          <p className="font-medium text-ink text-sm">{scaleLabels[scaleKey]}</p>
                          <p className="text-sm text-ink/80">
                            {getStatusEmoji(result.status)} {getStatusText(result.status)}
                          </p>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  // V1: старые 4 шкалы
                  <>
                    {childResults.emotional && (
                      <div>
                        <p className="font-medium text-ink">Эмоции</p>
                        <p className="text-sm text-ink/80">
                          {getStatusEmoji(childResults.emotional.status)} {getStatusText(childResults.emotional.status)}
                        </p>
                      </div>
                    )}
                    {childResults.conduct && (
                      <div>
                        <p className="font-medium text-ink">Поведение</p>
                        <p className="text-sm text-ink/80">
                          {getStatusEmoji(childResults.conduct.status)} {getStatusText(childResults.conduct.status)}
                        </p>
                      </div>
                    )}
                    {childResults.peer_problems && (
                      <div>
                        <p className="font-medium text-ink">Социальное</p>
                        <p className="text-sm text-ink/80">
                          {getStatusEmoji(childResults.peer_problems.status)} {getStatusText(childResults.peer_problems.status)}
                        </p>
                      </div>
                    )}
                    {childResults.hyperactivity && (
                      <div>
                        <p className="font-medium text-ink">Активность</p>
                        <p className="text-sm text-ink/80">
                          {getStatusEmoji(childResults.hyperactivity.status)} {getStatusText(childResults.hyperactivity.status)}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* You Card */}
        {parentAssessment && (
          <div className="min-w-[320px] flex-1 rounded-xl bg-gradient-honey p-6 text-ink shadow-soft">
            <div className="mb-4">
              <h3 className="text-xl font-extrabold text-ink">Вы</h3>
            </div>
            <div className="space-y-2">
              {parentAssessment.results_summary ? (
                (() => {
                  const parentResults = parentAssessment.results_summary as ParentResults;
                  return (
                    <>
                      {parentResults.anxiety && (
                        <div>
                          <p className="font-medium text-ink">Тревожность</p>
                          <p className="text-sm text-ink/80">
                            {getStatusEmoji(parentResults.anxiety.status)} {getStatusText(parentResults.anxiety.status)}
                          </p>
                        </div>
                      )}
                      {parentResults.depression && (
                        <div>
                          <p className="font-medium text-ink">Депрессия</p>
                          <p className="text-sm text-ink/80">
                            {getStatusEmoji(parentResults.depression.status)} {getStatusText(parentResults.depression.status)}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                <>
                  <p className="text-sm text-ink/80">
                    Родительская оценка завершена
                  </p>
                  {parentAssessment.completed_at && (
                    <p className="text-xs text-ink/70">
                      {new Date(parentAssessment.completed_at).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Family Card */}
        {familyAssessment && (
          <div className="min-w-[320px] flex-1 rounded-xl bg-gradient-sage p-6 text-ink shadow-soft">
            <div className="mb-4">
              <h3 className="text-xl font-extrabold text-ink">Семья</h3>
            </div>
            <div className="space-y-2">
              {familyAssessment.results_summary ? (
                (() => {
                  const familyResults = familyAssessment.results_summary as FamilyResults;
                  return (
                    <>
                      {familyResults.family_stress && (
                        <div>
                          <p className="font-medium text-ink">Семейный стресс</p>
                          <p className="text-sm text-ink/80">
                            {getStatusEmoji(familyResults.family_stress.status)} {getStatusText(familyResults.family_stress.status)}
                          </p>
                        </div>
                      )}
                      {familyResults.partner_relationship && (
                        <div>
                          <p className="font-medium text-ink">Отношения с партнером</p>
                          <p className="text-sm text-ink/80">
                            {getStatusEmoji(familyResults.partner_relationship.status)} {getStatusText(familyResults.partner_relationship.status)}
                          </p>
                        </div>
                      )}
                      {familyResults.coparenting && (
                        <div>
                          <p className="font-medium text-ink">Совместное воспитание</p>
                          <p className="text-sm text-ink/80">
                            {getStatusEmoji(familyResults.coparenting.status)} {getStatusText(familyResults.coparenting.status)}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                <>
                  <p className="text-sm text-ink/80">
                    Семейная оценка завершена
                  </p>
                  {familyAssessment.completed_at && (
                    <p className="text-xs text-ink/70">
                      {new Date(familyAssessment.completed_at).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Точки навигации */}
      {totalCards > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalCards }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!scrollContainerRef.current) return;
                const cardWidth = 320 + 16;
                scrollContainerRef.current.scrollTo({
                  left: index * cardWidth,
                  behavior: 'smooth'
                });
                setCurrentIndex(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-ink'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Перейти к карточке ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

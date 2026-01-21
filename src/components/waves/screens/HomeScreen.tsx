import React, { useState, useRef, useEffect } from 'react';
import { Flame, Play, Info } from 'lucide-react';
import { StreakBadge } from '../../design-system/StreakBadge';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface HomeScreenProps {
  childName?: string;
  profileType: 'waves' | 'waves-kids';
  onProfileTypeChange: (type: 'waves' | 'waves-kids') => void;
  onStartTraining: (type: string) => void;
  onTutorial?: () => void;
  streak?: number;
  recommendedTraining?: {
    type: string;
    frequency: string;
  };
}

// Компонент карточки тренировки с адаптивным шрифтом
function TrainingTypeCard({ 
  title, 
  subtitle, 
  image, 
  duration, 
  onClick 
}: { 
  title: string; 
  subtitle: string; 
  image: string; 
  duration: string; 
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [fontSize, setFontSize] = useState(15.5);
  const [subtitleSize, setSubtitleSize] = useState(10.5);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const updateFontSize = () => {
      const width = card.offsetWidth;
      // Адаптируем размер шрифта заголовка в зависимости от ширины карточки
      // Минимальная ширина ~120px, максимальная ~300px
      // Размер шрифта от 14px до 22px (увеличено на 1pt ≈ 1.5px)
      const calculatedSize = Math.max(14, Math.min(22, width * 0.08 + 1.5)) * 1.01;
      setFontSize(calculatedSize);
      
      // Размер подзаголовка пропорционально меньше (увеличено на 1pt ≈ 1.5px)
      const calculatedSubtitleSize = Math.max(10, Math.min(14, width * 0.05 + 1.5)) * 1.01;
      setSubtitleSize(calculatedSubtitleSize);
    };

    updateFontSize();

    const resizeObserver = new ResizeObserver(updateFontSize);
    resizeObserver.observe(card);

    // Также слушаем изменения размера окна
    window.addEventListener('resize', updateFontSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateFontSize);
    };
  }, []);

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      className="text-left transition-all hover:scale-[1.02] relative overflow-hidden rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_30px_rgba(0,0,0,0.1)]"
    >
      <img 
        src={image} 
        alt={title} 
        className={`w-full h-auto rounded-[20px] ${image === '/card4.png' ? '[@media(min-width:431px)]:scale-[1.01]' : ''}`}
      />
      <div className="absolute inset-0 p-6 sm:p-5 md:p-6 pl-4 sm:pl-4 [@media(max-width:430px)]:p-8 [@media(max-width:430px)]:pl-5 flex flex-col justify-between items-start">
        <span className="inline-block bg-white/80 backdrop-blur-sm text-[#1a1a1a] text-[9px] sm:text-[10px] md:text-xs font-medium px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full self-start -ml-1">
          {duration}
        </span>
        <div className="flex flex-col -ml-1 min-w-0 w-full pr-0.5">
          <SerifHeading 
            size="xl" 
            className="mb-0.5 sm:mb-1 break-words leading-tight"
            style={{ fontSize: `${fontSize}px` }}
          >
            {title}
          </SerifHeading>
          <p 
            className="text-[#1a1a1a]/70 leading-relaxed break-words"
            style={{ fontSize: `${subtitleSize}px` }}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}

export function HomeScreen({
  childName = 'Миша',
  profileType,
  onProfileTypeChange,
  onStartTraining,
  onTutorial,
  streak = 5,
  recommendedTraining = {
    type: 'Концентрация (Theta/Beta 4-7 / 15-20 Hz)',
    frequency: '15-20 мин',
  },
}: HomeScreenProps) {
  const [showTutorial, setShowTutorial] = useState(true);

  return (
    <div 
      className="min-h-screen pb-16 [@media(min-width:431px)]:pb-24"
      style={{
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="px-16 py-6 space-y-6">
        {/* Streak */}
        {streak > 0 && (
          <div className="flex items-center justify-center pt-6">
            <StreakBadge days={streak} />
          </div>
        )}
        {/* Центральный заголовок */}
        <div className="flex justify-center">
          <h1 className="font-serif font-medium leading-tight tracking-tight text-[#1a1a1a] text-center" style={{ fontFamily: 'var(--font-serif)' }}>
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">Привет, {childName}!</span>
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Хороший день для тренировки</span>
          </h1>
        </div>

        {/* Карточка инструктажа для новых */}
        {showTutorial && onTutorial && (
          <button
            onClick={onTutorial}
            className="w-full text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div 
              className="relative p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
              style={{
                borderRadius: '20px',
                background: 'linear-gradient(108deg, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.07) 100%)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTutorial(false);
                }}
                className="absolute top-2 right-2 text-[#1a1a1a]/40 hover:text-[#1a1a1a]/60 z-10 text-lg sm:text-xl"
              >
                ×
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#1a1a1a]/70" />
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-[#1a1a1a]">Пройти инструктаж</h3>
                  <p className="text-xs sm:text-sm text-[#1a1a1a]/70">Узнайте, как работает нейрофидбек</p>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Рекомендуемая тренировка */}
        <WellnessCard>
          <h2 className="text-base sm:text-lg font-semibold text-[#1a1a1a] mb-2">Рекомендуемая тренировка</h2>
          <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-4">{recommendedTraining.type}</p>
          <PillButton
            onClick={() => onStartTraining('tbr')}
            variant="gradientMeshOrange"
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Начать
          </PillButton>
        </WellnessCard>

        {/* Карточки тренировок по типам */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-[#1a1a1a] text-left mb-4 [@media(max-width:430px)]:text-center">Типы тренировок</h2>
          <div className="grid grid-cols-1 [@media(min-width:431px)]:grid-cols-2 gap-3 [@media(max-width:430px)]:scale-[0.969] [@media(max-width:430px)]:origin-center [@media(max-width:430px)]:justify-items-center mt-4 [@media(max-width:430px)]:-mt-4">
            <TrainingTypeCard
              title="Концентрация"
              subtitle="Theta/Beta (4-7 / 15-20 Hz)"
              image="/card1.png"
              duration="16 МИН"
              onClick={() => onStartTraining('tbr')}
            />
            <TrainingTypeCard
              title="Спокойствие"
              subtitle="Alpha (8-12 Hz)"
              image="/card2.png"
              duration="16 МИН"
              onClick={() => onStartTraining('alpha')}
            />
            <TrainingTypeCard
              title="Фокус"
              subtitle="Low-Beta (12-15 Hz)"
              image="/card3.png"
              duration="16 МИН"
              onClick={() => onStartTraining('smr')}
            />
            <TrainingTypeCard
              title="Дыхание"
              subtitle="Без устройства"
              image="/card4.png"
              duration="10 МИН"
              onClick={() => onStartTraining('breathing')}
            />
          </div>
        </div>
      </div>

    </div>
  );
}


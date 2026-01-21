import React, { useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';
import { Logo } from '../../design-system/Logo';
import { CardStack } from '../../design-system/CardStack';

interface TutorialScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export function TutorialScreen({ onBack, onComplete }: TutorialScreenProps) {
  const [step, setStep] = useState<'video' | 'explanation' | 'demo' | 'complete'>('video');
  const [demoCompleted, setDemoCompleted] = useState(false);

  if (step === 'video') {
    return (
      <div 
        className="flex flex-col min-h-screen"
        style={{
          backgroundImage: 'url(/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex-1 px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8">
          <div className="flex items-center mb-4 sm:mb-6">
            <button onClick={onBack} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#1a1a1a]">Инструктаж</SerifHeading>
          </div>
          <div className="w-full h-48 sm:h-56 md:h-64 bg-white rounded-2xl mb-4 sm:mb-6 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl md:text-6xl">📹</span>
          </div>
          <p className="text-center text-xs sm:text-sm md:text-base text-[#1a1a1a]/70 mb-4 sm:mb-6">
            Видео: что такое нейрофидбек (1-2 мин)
          </p>
          <PillButton onClick={() => setStep('explanation')} variant="gradientMesh" className="w-full">
            Далее
          </PillButton>
        </div>
      </div>
    );
  }

  if (step === 'explanation') {
    const explanationCards = [
      {
        id: 1,
        title: 'Будем тренировать волну Фокус (Low-Beta)',
        gradient: 'blue' as const,
        tag: 'Фокус',
      },
      {
        id: 2,
        title: 'Линия идёт вверх, когда ты сосредоточен',
        gradient: 'lavender' as const,
        tag: 'Сосредоточенность',
      },
      {
        id: 3,
        title: 'Расслабься и наблюдай',
        gradient: 'pink' as const,
        tag: 'Расслабление',
      },
    ];

    return (
      <div 
        className="flex flex-col min-h-screen"
        style={{
          backgroundImage: 'url(/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex items-center px-4 py-4">
          <button onClick={() => setStep('video')} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl text-[#1a1a1a]">Объяснение</SerifHeading>
        </div>

        <div className="flex-1 px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8 overflow-y-auto">
          <div className="mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-[#1a1a1a] text-center mb-4 sm:mb-6">
              Прокрутите карточки, чтобы узнать, как работает нейрофидбек
            </p>
            <div className="flex justify-center">
              <div style={{ transform: 'translateX(-3px)' }}>
                <CardStack items={explanationCards} className="!w-[280px]" />
              </div>
            </div>
          </div>
          <PillButton onClick={() => setStep('demo')} variant="gradientMesh" className="w-full mb-3">
            Далее
          </PillButton>
        </div>
      </div>
    );
  }

  if (step === 'demo') {
    return (
      <div 
        className="flex flex-col min-h-screen"
        style={{
          backgroundImage: 'url(/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex items-center px-4 py-4">
          <button onClick={() => setStep('explanation')} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl text-[#1a1a1a]">Демо-тренировка</SerifHeading>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8">
          <div className="mb-4 sm:mb-6">
            <Logo size="xl" variant="default" />
          </div>
          <p className="text-center text-xs sm:text-sm md:text-base text-[#1a1a1a]/70 mb-4 sm:mb-6">Демо-тренировка (2-3 мин)</p>
          <PillButton
            onClick={() => {
              setDemoCompleted(true);
              setTimeout(() => setStep('complete'), 2000);
            }}
            variant="gradientMesh"
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Начать демо
          </PillButton>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center justify-center px-4 sm:px-8 md:px-16 py-6 sm:py-8 md:py-12 min-h-screen"
      style={{
        backgroundImage: 'url(/bg2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-sm text-center">
        <SerifHeading size="2xl" className="mb-3 sm:mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
          Отлично! Теперь ты готов к настоящим тренировкам 👏
        </SerifHeading>
        <PillButton onClick={onComplete} variant="gradientMesh" className="w-full">
          Начать тренировку
        </PillButton>
      </div>
    </div>
  );
}


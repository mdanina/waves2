import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SerifHeading } from '../../design-system/SerifHeading';
import { GradientMesh } from '../../design-system/GradientMesh';

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'hold2';

interface BreathingTrainingScreenProps {
  pattern: { inhale: number; hold: number; exhale: number; hold2: number };
  onComplete: (endReason: 'completed' | 'early' | 'technical', timeElapsed: number, technicalIssue?: string) => void;
}

export function BreathingTrainingScreen({
  pattern,
  onComplete,
}: BreathingTrainingScreenProps) {
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [countdown, setCountdown] = useState(pattern.inhale);
  const [cycle, setCycle] = useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const phaseProgressRef = React.useRef<number>(0); // Точный прогресс фазы от 0 до 1
  const trainingStartTimeRef = React.useRef<number>(Date.now()); // Время начала тренировки

  useEffect(() => {
    let startTime = Date.now();
    const currentPhaseDuration = pattern[phase] * 1000; // в миллисекундах
    
    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, currentPhaseDuration - elapsed);
      const newCountdown = Math.ceil(remaining / 1000);
      
      // Обновляем точный прогресс фазы для плавной анимации
      phaseProgressRef.current = Math.max(0, Math.min(1, 1 - remaining / currentPhaseDuration));
      
      if (remaining <= 0) {
        // Переход к следующей фазе
        const nextPhase = getNextPhase(phase);
        setPhase(nextPhase);
        const nextDuration = pattern[nextPhase];
        setCountdown(nextDuration);
        phaseProgressRef.current = 0;
        startTime = Date.now();
        // Перезапускаем таймер с новой фазой
        timerRef.current = setTimeout(updateTimer, 50) as unknown as NodeJS.Timeout;
      } else {
        setCountdown(newCountdown);
        // Обновляем каждые 50мс для плавной анимации
        timerRef.current = setTimeout(updateTimer, 50) as unknown as NodeJS.Timeout;
      }
    };
    
    phaseProgressRef.current = 0;
    updateTimer();
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [phase, pattern]);

  const getNextPhase = (current: BreathingPhase): BreathingPhase => {
    switch (current) {
      case 'inhale':
        return 'hold';
      case 'hold':
        return 'exhale';
      case 'exhale':
        return 'hold2';
      case 'hold2':
        setCycle((prev) => prev + 1);
        return 'inhale';
    }
  };

  const getPhaseDuration = (p: BreathingPhase): number => {
    return pattern[p];
  };

  const getPhaseText = (p: BreathingPhase): string => {
    switch (p) {
      case 'inhale':
        return 'Вдох';
      case 'hold':
        return 'Пауза';
      case 'exhale':
        return 'Выдох';
      case 'hold2':
        return 'Пауза';
    }
  };

  const getCircleScale = (): number => {
    // Используем точный прогресс фазы для плавной анимации
    const progress = phaseProgressRef.current;
    
    switch (phase) {
      case 'inhale':
        // Плавно увеличивается от 0.5 до 1.0
        return 0.5 + progress * 0.5;
      case 'hold':
        // Остается на максимуме 1.0
        return 1.0;
      case 'exhale':
        // Плавно уменьшается от 1.0 до 0.5
        return 1.0 - progress * 0.5;
      case 'hold2':
        // Остается на минимуме 0.5
        return 0.5;
    }
  };
  
  // Сбрасываем время начала тренировки при монтировании компонента
  React.useEffect(() => {
    trainingStartTimeRef.current = Date.now();
  }, []);
  
  // Состояние для принудительного обновления компонента при изменении прогресса
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  // Обновляем компонент каждые 50мс для плавной анимации
  React.useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate();
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <button
        onClick={() => {
          // Останавливаем таймер при закрытии
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          // Вычисляем прошедшее время тренировки в секундах
          const timeElapsed = Math.floor((Date.now() - trainingStartTimeRef.current) / 1000);
          // Завершаем сессию - это приведет к показу экрана завершения, затем чек-аута, и возврату на главный экран
          onComplete('early', timeElapsed);
        }}
        className="absolute top-0 left-1/2 -translate-x-1/2 z-20 bg-black/30 backdrop-blur-sm rounded-b-xl px-3 py-2 flex items-center justify-center text-white hover:bg-black/40 transition-all"
        title="Завершить тренировку"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex flex-col items-center justify-center px-16 relative bg-white min-h-screen">
        <div className="relative z-10">
          <div className="text-center mb-8">
            <SerifHeading size="2xl" className="mb-2 text-3xl sm:text-4xl md:text-5xl">{getPhaseText(phase)}</SerifHeading>
          </div>

          {/* Анимация круга с счетчиком в центре */}
          <div className="mb-8 flex justify-center items-center relative" style={{ minHeight: '200px' }}>
            <div 
              className="relative"
              style={{ 
                transform: `scale(${getCircleScale()})`,
                transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <GradientMesh 
                size={200} 
                variant="iridescent" 
                animated 
                opacity={0.8}
              />
            </div>
            {/* Счетчик в центре круга */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-4xl font-mono text-white drop-shadow-lg">{countdown}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


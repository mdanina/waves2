import React, { useState, useEffect, useRef } from 'react';
import { Clock, X } from 'lucide-react';
import { Logo } from '../../design-system/Logo';
import { GradientMesh } from '../../design-system/GradientMesh';

type TrainingEndReason = 'completed' | 'early' | 'technical';

interface ActiveTrainingScreenProps {
  trainingType?: string;
  duration?: number; // в секундах, по умолчанию 4 минуты (240 сек)
  onComplete: (reason: TrainingEndReason, timeElapsed: number, technicalIssue?: string) => void;
  onTechnicalIssue?: () => void; // Обработчик технических проблем (потеря сигнала, отвалились электроды)
}

export function ActiveTrainingScreen({
  trainingType = 'tbr',
  duration = 240, // 4 минуты по умолчанию
  onComplete,
  onTechnicalIssue,
}: ActiveTrainingScreenProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const hideTimerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeElapsed < duration) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => {
          if (prev + 1 >= duration) {
            onComplete('completed', duration); // Полное завершение
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeElapsed, duration, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeElapsed / duration) * 100;

  const handleTimerClick = () => {
    // Очищаем предыдущий таймер скрытия, если был
    if (hideTimerTimeoutRef.current) {
      clearTimeout(hideTimerTimeoutRef.current);
    }

    // Показываем плашку
    setShowTimer(true);

    // Через секунду скрываем плавно
    hideTimerTimeoutRef.current = setTimeout(() => {
      setShowTimer(false);
    }, 1000);
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(232, 213, 242, 0.4) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(201, 228, 245, 0.4) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(255, 209, 220, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 10% 80%, rgba(255, 244, 204, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 90% 20%, rgba(255, 229, 217, 0.3) 0%, transparent 50%),
          linear-gradient(135deg, #E8D5F2 0%, #C9E4F5 25%, #FFD1DC 50%, #FFF4CC 75%, #FFE5D9 100%)
        `,
        backgroundSize: '200% 200%',
        animation: 'gradientShift 15s ease infinite',
      }}
    >
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
      
      {/* Визуальная обратная связь - видео/анимация */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <Logo size="xl" variant="white" />
      </div>

      {/* Закладки вверху */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {/* Закладка с часами */}
        <button
          onClick={handleTimerClick}
          className="bg-black/30 backdrop-blur-sm rounded-b-xl px-3 py-2 flex items-center justify-center text-white hover:bg-black/40 transition-all"
        >
          <Clock className="w-4 h-4" />
        </button>
        {/* Закладка завершения тренировки */}
        <button
          onClick={() => onComplete('early', timeElapsed)}
          className="bg-black/30 backdrop-blur-sm rounded-b-xl px-3 py-2 flex items-center justify-center text-white hover:bg-black/40 transition-all"
          title="Завершить тренировку"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Плашка с таймером - выдвигается сверху */}
      <div
        className={`absolute top-0 left-0 right-0 z-10 transition-transform duration-300 ${
          showTimer ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-black/70 backdrop-blur-md rounded-b-2xl p-4 sm:p-5 md:p-6 text-white">
          <div className="text-center">
            <p className="text-xl sm:text-2xl md:text-3xl font-mono mb-2 sm:mb-3">
              {formatTime(timeElapsed)} / {formatTime(duration)}
            </p>
            <div className="w-full bg-white/20 rounded-full h-2 sm:h-2.5 mb-1.5 sm:mb-2">
              <div
                className="bg-white h-2 sm:h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs sm:text-sm text-white/70">
              {Math.round(progress)}% завершено
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}


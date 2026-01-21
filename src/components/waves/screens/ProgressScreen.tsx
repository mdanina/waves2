import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface TrainingSession {
  id: string;
  date: string;
  type: string;
  duration: number; // в минутах
  timeElapsed: number; // в секундах
  timeInZone: number;
  endReason: 'completed' | 'early' | 'technical';
  points?: number;
}

interface ProgressScreenProps {
  userName?: string;
  onBack?: () => void;
  sessions?: TrainingSession[];
  onSessionClick?: (sessionId: string) => void;
}

export function ProgressScreen({ userName, onBack, sessions, onSessionClick }: ProgressScreenProps) {
  // Mock данные, если не переданы
  const defaultSessions: TrainingSession[] = [
    { id: '1', date: '05.01.2026', type: 'Концентрация', duration: 16, timeElapsed: 960, timeInZone: 68, endReason: 'completed', points: 850 },
    { id: '2', date: '04.01.2026', type: 'Спокойствие', duration: 16, timeElapsed: 960, timeInZone: 72, endReason: 'completed', points: 920 },
    { id: '3', date: '03.01.2026', type: 'Фокус', duration: 16, timeElapsed: 960, timeInZone: 65, endReason: 'completed', points: 780 },
    { id: '4', date: '02.01.2026', type: 'Концентрация', duration: 16, timeElapsed: 960, timeInZone: 70, endReason: 'completed', points: 880 },
    { id: '5', date: '01.01.2026', type: 'Дыхание', duration: 10, timeElapsed: 600, timeInZone: 0, endReason: 'completed' },
  ];

  const displaySessions = sessions && sessions.length > 0 ? sessions : defaultSessions;
  const sessionsCompleted = displaySessions.length;
  const totalMinutes = displaySessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div 
      className="min-h-screen pb-20"
      style={{
        backgroundImage: 'url(/bg2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="px-16 py-6">
        <div className="mb-6">
          <SerifHeading size="2xl" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">Прогресс</SerifHeading>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <WellnessCard gradient="lavender" className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <p className="text-xs sm:text-sm md:text-base text-gray-600">Тренировок</p>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1a1a1a]">{sessionsCompleted}</p>
          </WellnessCard>
          <WellnessCard gradient="pink" className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <p className="text-xs sm:text-sm md:text-base text-gray-600">Минут</p>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1a1a1a]">{totalMinutes}</p>
          </WellnessCard>
        </div>

        {/* История тренировок */}
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[#1a1a1a] mb-4">История тренировок</h2>
          <div className="space-y-3">
            {displaySessions.map((session) => (
              <WellnessCard
                key={session.id}
                className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Card clicked:', session.id, 'onSessionClick:', onSessionClick);
                  if (onSessionClick) {
                    onSessionClick(session.id);
                  } else {
                    console.warn('onSessionClick is not provided');
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onSessionClick) {
                      onSessionClick(session.id);
                    }
                  }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-[#1a1a1a]">{session.date}</p>
                    <p className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/70">{session.type}</p>
                  </div>
                  {session.points && (
                    <div className="text-right">
                      <p className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/70">Очки</p>
                      <p className="text-sm sm:text-base md:text-lg font-semibold text-[#1a1a1a]">{session.points}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs sm:text-sm md:text-base text-[#1a1a1a]/70 mb-2">
                  <span>{session.duration} мин</span>
                  {session.timeInZone > 0 && (
                    <>
                      <span>•</span>
                      <span>{session.timeInZone}% в зоне</span>
                    </>
                  )}
                  {session.endReason === 'early' && session.type !== 'Дыхание' && (
                    <>
                      <span>•</span>
                      <span className="text-xs sm:text-sm md:text-base text-orange-600">Досрочно завершено</span>
                    </>
                  )}
                  {session.endReason === 'technical' && (
                    <>
                      <span>•</span>
                      <span className="text-xs sm:text-sm md:text-base text-red-600">Прервано</span>
                    </>
                  )}
                </div>
                {session.timeInZone > 0 && (
                  <div className="w-full bg-[#1a1a1a]/10 rounded-full h-2">
                    <div
                      className="bg-[#a8d8ea] h-2 rounded-full"
                      style={{ width: `${session.timeInZone}%` }}
                    ></div>
                  </div>
                )}
              </WellnessCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { ArrowLeft, Filter, TrendingUp } from 'lucide-react';
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
  technicalIssue?: string;
  points?: number;
}

interface TrainingHistoryScreenProps {
  onBack: () => void;
  sessions?: TrainingSession[]; // Передаем историю из родительского компонента
}

export function TrainingHistoryScreen({ onBack, sessions: propSessions }: TrainingHistoryScreenProps) {
  const [filter, setFilter] = useState<'all' | 'tbr' | 'alpha' | 'smr' | 'breathing'>('all');
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');

  // Используем переданные данные или mock данные для демо
  const defaultSessions: TrainingSession[] = [
    { id: '1', date: '05.01.2026', type: 'Концентрация', duration: 16, timeElapsed: 960, timeInZone: 68, endReason: 'completed', points: 850 },
    { id: '2', date: '04.01.2026', type: 'Спокойствие', duration: 16, timeElapsed: 960, timeInZone: 72, endReason: 'completed', points: 920 },
    { id: '3', date: '03.01.2026', type: 'Фокус', duration: 16, timeElapsed: 960, timeInZone: 65, endReason: 'completed', points: 780 },
    { id: '4', date: '02.01.2026', type: 'Концентрация', duration: 16, timeElapsed: 960, timeInZone: 70, endReason: 'completed', points: 880 },
    { id: '5', date: '01.01.2026', type: 'Дыхание', duration: 10, timeElapsed: 600, timeInZone: 0, endReason: 'completed' },
  ];
  
  const sessions = propSessions && propSessions.length > 0 ? propSessions : defaultSessions;

  const filteredSessions = sessions.filter((session) => {
    if (filter !== 'all' && session.type.toLowerCase() !== filter) return false;
    return true;
  });

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <div className="flex items-center px-4 py-4 border-b border-[#1a1a1a]/10 bg-white/80 backdrop-blur-sm">
        <button onClick={onBack} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <SerifHeading size="xl" className="text-3xl sm:text-4xl md:text-5xl">История тренировок</SerifHeading>
      </div>

      <div className="flex-1 px-16 py-6">
        {/* Фильтры */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#1a1a1a]/70" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="flex-1 px-4 py-2 bg-white/50 border border-[#1a1a1a]/10 rounded-lg"
            >
              <option value="all">Все типы</option>
              <option value="tbr">Концентрация</option>
              <option value="alpha">Спокойствие</option>
              <option value="smr">Фокус</option>
              <option value="breathing">Дыхание</option>
            </select>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="w-full px-4 py-2 bg-white/50 border border-[#1a1a1a]/10 rounded-lg"
          >
            <option value="all">За всё время</option>
            <option value="week">За неделю</option>
            <option value="month">За месяц</option>
          </select>
        </div>

        {/* Список тренировок */}
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <WellnessCard key={session.id} className="p-4">
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
                {session.endReason === 'early' && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600">Досрочно завершено</span>
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
  );
}


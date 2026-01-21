import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';
import { MoodChart } from '../../design-system/MoodChart';

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
  rating?: number; // оценка тренировки (1-5)
  mood?: string; // изменение настроения (better/same/worse)
  concentration?: number; // уровень концентрации после тренировки (1-5)
}

interface TrainingDetailScreenProps {
  session: TrainingSession | null;
  onBack: () => void;
}

export function TrainingDetailScreen({ session, onBack }: TrainingDetailScreenProps) {
  // Генерируем данные для графика динамики (симуляция данных за сессию)
  // В реальном приложении эти данные будут приходить с сервера
  const chartData = useMemo<Array<{ time: string; value: number }>>(() => {
    if (!session) return [] as Array<{ time: string; value: number }>;
    
    const data: Array<{ time: string; value: number }> = [];
    const intervals = Math.floor(session.duration / 2); // Точка каждые 2 минуты
    // Используем ID сессии как seed для стабильной генерации
    const seed = parseInt(session.id) || 0;
    
    for (let i = 0; i <= intervals; i++) {
      const time = i * 2;
      // Псевдослучайное значение на основе seed и времени
      const pseudoRandom = ((seed + time) * 9301 + 49297) % 233280 / 233280;
      // Симулируем динамику: начинаем низко, поднимаемся, затем стабилизируемся
      const value = Math.min(10, Math.max(0, 
        3 + (time / session.duration) * 5 + Math.sin(time / 3) * 1.5 + (pseudoRandom - 0.5) * 1
      ));
      data.push({
        time: `${time} мин`,
        value: Math.round(value * 10) / 10,
      });
    }
    return data;
  }, [session]);

  if (!session) {
    return (
      <div 
        className="flex flex-col min-h-screen"
        style={{
          backgroundImage: 'url(/bg2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex items-center px-4 py-4">
          <button onClick={onBack} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl">Детали тренировки</SerifHeading>
        </div>
        <div className="flex-1 flex items-center justify-center px-16">
          <p className="text-[#1a1a1a]/70">Тренировка не найдена</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col min-h-screen"
      style={{
        backgroundImage: 'url(/bg2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex items-center px-4 py-4">
        <button onClick={onBack} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl">Детали тренировки</SerifHeading>
      </div>

      <div className="flex-1 px-4 sm:px-8 md:px-16 py-4 sm:py-6 overflow-y-auto pb-16 [@media(min-width:431px)]:pb-24">
        {/* Основная информация */}
        <WellnessCard className="mb-4 sm:mb-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-0.5 sm:mb-1">Дата</p>
                <p className="text-sm sm:text-base font-semibold text-[#1a1a1a]">{session.date}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-0.5 sm:mb-1">Тип тренировки</p>
                <p className="text-sm sm:text-base font-semibold text-[#1a1a1a]">{session.type}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-0.5 sm:mb-1">Длительность</p>
                <p className="text-sm sm:text-base font-semibold text-[#1a1a1a]">{session.duration} мин</p>
              </div>
            </div>
            {session.endReason === 'early' && session.type !== 'Дыхание' && (
              <div className="p-2 sm:p-3 bg-orange-50 rounded-lg">
                <p className="text-xs sm:text-sm text-orange-800">Тренировка завершена досрочно</p>
              </div>
            )}
            {session.endReason === 'technical' && (
              <div className="p-2 sm:p-3 bg-red-50 rounded-lg">
                <p className="text-xs sm:text-sm text-red-800">
                  {session.technicalIssue || 'Тренировка прервана из-за технических проблем'}
                </p>
              </div>
            )}
          </div>
        </WellnessCard>

        {/* Оценка и изменения состояния */}
        {(session.rating || session.mood || session.concentration) && (
          <WellnessCard className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#1a1a1a] mb-3 sm:mb-4">Оценка тренировки</h3>
            <div className="space-y-3 sm:space-y-4">
              {session.rating && (
                <div>
                  <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1.5 sm:mb-2">Оценка тренировки</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 sm:gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-xl sm:text-2xl ${
                            star <= session.rating!
                              ? 'text-[#F3B83A]'
                              : 'text-[#1a1a1a]/20'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm text-[#1a1a1a]/70">
                      {session.rating} из 5
                    </span>
                  </div>
                </div>
              )}
              
              {session.mood && (
                <div>
                  <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1.5 sm:mb-2">Изменение настроения</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">
                      {session.mood === 'better' ? '😊' : session.mood === 'same' ? '😐' : '😟'}
                    </span>
                    <span className="text-sm sm:text-base text-[#1a1a1a] font-medium">
                      {session.mood === 'better' ? 'Лучше' : session.mood === 'same' ? 'Так же' : 'Хуже'}
                    </span>
                  </div>
                </div>
              )}
              
              {session.concentration && (
                <div>
                  <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1.5 sm:mb-2">Уровень концентрации после тренировки</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">
                      {session.concentration === 1 ? '😵' :
                       session.concentration === 2 ? '😐' :
                       session.concentration === 3 ? '🙂' :
                       session.concentration === 4 ? '😊' : '🤓'}
                    </span>
                    <span className="text-sm sm:text-base text-[#1a1a1a] font-medium">
                      {session.concentration === 1 ? 'Рассеян' :
                       session.concentration === 2 ? 'Немного' :
                       session.concentration === 3 ? 'Нормально' :
                       session.concentration === 4 ? 'Хорошо' : 'Отлично'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </WellnessCard>
        )}

        {/* График динамики - показываем для всех тренировок, кроме технических проблем */}
        {session.endReason !== 'technical' && chartData.length > 0 && (
          <WellnessCard className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#1a1a1a] mb-3 sm:mb-4">Динамика в течение сессии</h3>
            <MoodChart
              data={chartData.map(d => ({ day: d.time, mood: d.value }))}
              color="#a8d8ea"
            />
            <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs sm:text-sm text-[#1a1a1a]/70">
              <span>Время</span>
              <span>Уровень концентрации</span>
            </div>
          </WellnessCard>
        )}

        {/* Прогресс-бар времени в зоне */}
        {session.timeInZone > 0 && (
          <WellnessCard>
            <h3 className="text-base sm:text-lg font-semibold text-[#1a1a1a] mb-3 sm:mb-4">Время в зоне</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-[#1a1a1a]/70">Процент времени выше порога</span>
                <span className="font-semibold text-[#1a1a1a]">{session.timeInZone}%</span>
              </div>
              <div className="w-full bg-[#1a1a1a]/10 rounded-full h-3 sm:h-4">
                <div
                  className="bg-gradient-to-r from-[#a8d8ea] to-[#6ab9e7] h-3 sm:h-4 rounded-full transition-all"
                  style={{ width: `${session.timeInZone}%` }}
                ></div>
              </div>
              {session.points && (
                <p className="text-xs sm:text-sm text-[#1a1a1a]/60 mt-1.5 sm:mt-2">
                  Абсолютное время над порогом: {Math.round((session.duration * 60 * session.timeInZone) / 100)} сек
                </p>
              )}
            </div>
          </WellnessCard>
        )}
      </div>
    </div>
  );
}


import React from 'react';
import { Flame, AlertTriangle, RefreshCw } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { StreakBadge } from '../../design-system/StreakBadge';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

type TrainingEndReason = 'completed' | 'early' | 'technical';

interface TechnicalIssueInfo {
  title: string;
  description: string;
  recommendations: string[];
}

interface TrainingCompleteScreenProps {
  userName: string;
  duration: number; // Длительность в минутах (для отображения)
  timeElapsed: number; // Реальное время тренировки в секундах
  timeInZone: number;
  streak: number;
  endReason?: TrainingEndReason; // Причина завершения тренировки
  technicalIssue?: string; // Описание технической проблемы (если есть)
  trainingType?: string; // Тип тренировки ('breathing' для дыхательной)
  onComplete: () => void;
  onRetry?: () => void; // Обработчик повторного запуска тренировки
}

export function TrainingCompleteScreen({
  userName,
  duration,
  timeElapsed,
  timeInZone,
  streak,
  endReason = 'completed',
  technicalIssue,
  trainingType,
  onComplete,
  onRetry,
}: TrainingCompleteScreenProps) {
  const isCompleted = endReason === 'completed';
  const isTechnical = endReason === 'technical';
  const isEarly = endReason === 'early';
  
  // Форматируем время для отображения: минуты и секунды
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) {
      return `${secs} сек`;
    }
    if (secs === 0) {
      return `${mins} мин`;
    }
    return `${mins} мин ${secs} сек`;
  };

  // Определяем тип технической проблемы и рекомендации
  const getTechnicalIssueInfo = (issue?: string): TechnicalIssueInfo => {
    const issueLower = (issue || '').toLowerCase();
    
    // Потеря сигнала / проблемы с электродами
    if (issueLower.includes('сигнал') || issueLower.includes('электрод') || issueLower.includes('подключение')) {
      return {
        title: 'Потерян сигнал с устройства',
        description: 'Связь с устройством прервалась во время тренировки.',
        recommendations: [
          'Проверьте, что электроды плотно прилегают к коже',
          'Убедитесь, что устройство включено и находится рядом',
          'Проверьте соединение кабелей электродов',
          'Очистите кожу в месте установки электродов (используйте спирт)',
          'Убедитесь, что Bluetooth включен на вашем устройстве',
        ],
      };
    }
    
    // Проблемы с Bluetooth
    if (issueLower.includes('bluetooth') || issueLower.includes('блютуз') || issueLower.includes('связь')) {
      return {
        title: 'Проблема с подключением Bluetooth',
        description: 'Не удалось поддерживать стабильное соединение с устройством.',
        recommendations: [
          'Проверьте, что Bluetooth включен на вашем телефоне',
          'Убедитесь, что устройство находится в радиусе 3-5 метров',
          'Перезапустите Bluetooth на телефоне',
          'Проверьте, что устройство не подключено к другому устройству',
          'Попробуйте переподключить устройство в настройках',
        ],
      };
    }
    
    // Низкое качество сигнала
    if (issueLower.includes('качество') || issueLower.includes('шум') || issueLower.includes('помех')) {
      return {
        title: 'Низкое качество сигнала',
        description: 'Сигнал с электродов слишком слабый или содержит помехи.',
        recommendations: [
          'Убедитесь, что электроды плотно прилегают к коже',
          'Проверьте, что кожа очищена и сухая в месте установки',
          'Попробуйте переместить электроды в другое место',
          'Убедитесь, что электроды не повреждены',
          'Проверьте уровень заряда устройства',
        ],
      };
    }
    
    // Отключение устройства
    if (issueLower.includes('отключ') || issueLower.includes('выключ') || issueLower.includes('разряд')) {
      return {
        title: 'Устройство отключилось',
        description: 'Устройство отключилось во время тренировки.',
        recommendations: [
          'Проверьте уровень заряда устройства',
          'Убедитесь, что устройство включено',
          'Проверьте состояние батареи в настройках приложения',
          'Если устройство разряжено, зарядите его перед следующей тренировкой',
          'Проверьте, что устройство не перешло в режим энергосбережения',
        ],
      };
    }
    
    // Общие рекомендации по умолчанию
    return {
      title: 'Техническая проблема',
      description: issue || 'Произошла техническая проблема во время тренировки.',
      recommendations: [
        'Проверьте подключение устройства и электродов',
        'Убедитесь, что Bluetooth включен',
        'Перезапустите приложение',
        'Проверьте, что устройство включено и заряжено',
        'Если проблема повторяется, обратитесь в поддержку',
      ],
    };
  };

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
        {/* Анимация */}
        {isCompleted ? (
          <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-4 sm:mb-5 md:mb-6 animate-bounce">🎉</div>
        ) : isTechnical ? (
          <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-4 sm:mb-5 md:mb-6">⚠️</div>
        ) : (
          <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-4 sm:mb-5 md:mb-6">👍</div>
        )}

        <SerifHeading size="2xl" className="mb-4 sm:mb-6 md:mb-8 text-4xl sm:text-5xl md:text-6xl">
          {isCompleted
            ? `Отличная тренировка, ${userName}!`
            : isTechnical
            ? `Тренировка прервана, ${userName}`
            : `Тренировка завершена, ${userName}`}
        </SerifHeading>

        {/* Статистика */}
        <WellnessCard className="mb-4 sm:mb-5 md:mb-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/70">Длительность</span>
              <span className="text-sm sm:text-base md:text-lg font-semibold text-[#1a1a1a]">{formatTime(timeElapsed)}</span>
            </div>
            {isCompleted && (
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/70">Время «в зоне»</span>
                <span className="text-sm sm:text-base md:text-lg font-semibold text-[#1a1a1a]">{timeInZone}%</span>
              </div>
            )}
          </div>
        </WellnessCard>

        {/* Streak - показываем только если тренировка завершена полностью */}
        {isCompleted && streak > 0 && (
          <div className="mb-4 sm:mb-5 md:mb-6">
            <StreakBadge days={streak} />
            {streak >= 4 && (
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-2">
                Завтра будет {streak + 1}!
              </p>
            )}
          </div>
        )}

        {/* Детальное сообщение для технических проблем */}
        {isTechnical && (() => {
          const issueInfo = getTechnicalIssueInfo(technicalIssue);
          return (
            <div className="rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white/40 backdrop-blur-md border-2 border-white/50 mb-4 sm:mb-5 md:mb-6 text-left">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-sm sm:text-base md:text-lg font-semibold text-[#1a1a1a] mb-1.5 sm:mb-2">
                    {issueInfo.title}
                  </p>
                  <p className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/80">
                    {issueInfo.description}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs sm:text-sm md:text-base font-semibold text-[#1a1a1a] mb-1.5 sm:mb-2">
                    Рекомендации по исправлению:
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {issueInfo.recommendations.map((rec, index) => (
                      <li key={index} className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/80 flex items-start gap-2">
                        <span className="text-[#b8a0d6] mt-1 flex-shrink-0">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Сообщение для досрочно завершенной тренировки - не показываем для дыхательной тренировки */}
        {endReason === 'early' && trainingType !== 'breathing' && (
          <div className="rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white/40 backdrop-blur-md border-2 border-white/50 mb-4 sm:mb-5 md:mb-6">
            <p className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/80">
              Тренировка была завершена досрочно. Для лучших результатов рекомендуется проходить тренировку полностью.
            </p>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="space-y-2 sm:space-y-3">
          {isTechnical && onRetry && (
            <PillButton 
              onClick={onRetry} 
              variant="gradientMesh" 
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Пройти сессию заново
            </PillButton>
          )}
          <PillButton 
            onClick={onComplete} 
            variant={isTechnical && onRetry ? "secondary" : "gradientMesh"} 
            className="w-full"
          >
            Готово
          </PillButton>
        </div>
      </div>
    </div>
  );
}


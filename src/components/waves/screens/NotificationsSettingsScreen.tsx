import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Toggle } from '../../design-system/Toggle';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface NotificationsSettingsScreenProps {
  onBack: () => void;
}

export function NotificationsSettingsScreen({ onBack }: NotificationsSettingsScreenProps) {
  const [trainingReminders, setTrainingReminders] = useState(true);
  const [trainingTime, setTrainingTime] = useState('18:00');
  const [streakNotifications, setStreakNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [achievements, setAchievements] = useState(true);
  const [tipsAndArticles, setTipsAndArticles] = useState(false);

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <div className="flex items-center px-4 py-4 border-b border-[#1a1a1a]/10 bg-white/80 backdrop-blur-sm">
        <button onClick={onBack} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl">Уведомления</SerifHeading>
      </div>

      <div className="flex-1 px-16 py-8">
        <div className="space-y-6">
          {/* Напоминания о тренировках */}
          <WellnessCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-[#1a1a1a]">Напоминания о тренировках</p>
              </div>
              <Toggle checked={trainingReminders} onChange={setTrainingReminders} />
            </div>
            {trainingReminders && (
              <div className="mt-3">
                <label className="block text-sm text-[#1a1a1a]/70 mb-2">Время</label>
                <input
                  type="time"
                  value={trainingTime}
                  onChange={(e) => setTrainingTime(e.target.value)}
                  className="w-full px-4 py-2 bg-white/50 border border-[#1a1a1a]/10 rounded-lg"
                />
              </div>
            )}
          </WellnessCard>

          {/* Streak-уведомления */}
          <WellnessCard className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#1a1a1a]">Streak-уведомления</p>
              <Toggle checked={streakNotifications} onChange={setStreakNotifications} />
            </div>
          </WellnessCard>

          {/* Еженедельный отчёт */}
          <WellnessCard className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#1a1a1a]">Еженедельный отчёт</p>
              <Toggle checked={weeklyReport} onChange={setWeeklyReport} />
            </div>
          </WellnessCard>

          {/* Достижения */}
          <WellnessCard className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#1a1a1a]">Достижения</p>
              <Toggle checked={achievements} onChange={setAchievements} />
            </div>
          </WellnessCard>

          {/* Советы и статьи */}
          <WellnessCard className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#1a1a1a]">Советы и статьи</p>
              <Toggle checked={tipsAndArticles} onChange={setTipsAndArticles} />
            </div>
          </WellnessCard>
        </div>
      </div>
    </div>
  );
}


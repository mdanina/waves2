import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { WellnessCard } from '../../design-system/WellnessCard';

interface OfflineModeScreenProps {
  isOnline: boolean;
}

export function OfflineModeScreen({ isOnline }: OfflineModeScreenProps) {
  if (isOnline) {
    return (
      <WellnessCard gradient="blue" className="border-b border-[#1a1a1a]/10 px-4 py-3 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#a8d8ea]" />
        <p className="text-sm text-[#1a1a1a]">Данные синхронизированы ✓</p>
      </WellnessCard>
    );
  }

  return (
    <WellnessCard gradient="coral" className="border-b border-[#1a1a1a]/10 px-4 py-3">
      <div className="flex items-center gap-3 mb-3">
        <WifiOff className="w-5 h-5 text-[#ff8a65]" />
        <p className="font-semibold text-[#1a1a1a]">Нет подключения к интернету</p>
      </div>
      <div className="ml-8 space-y-2 text-sm">
        <div>
          <p className="font-semibold text-[#1a1a1a] mb-1">Доступно офлайн:</p>
          <ul className="space-y-1 text-[#1a1a1a]/80">
            <li>✅ Тренировки (до 3 закэшированных)</li>
            <li>✅ Дыхательные упражнения</li>
            <li>✅ Просмотр истории</li>
            <li>✅ Библиотека (загруженные статьи)</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[#1a1a1a] mb-1">Недоступно офлайн:</p>
          <ul className="space-y-1 text-[#1a1a1a]/80">
            <li>❌ Синхронизация прогресса</li>
          </ul>
        </div>
      </div>
    </WellnessCard>
  );
}


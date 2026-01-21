import React from 'react';
import { TrendingUp, Play } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface InsightsEmptyScreenProps {
  onStartTraining: () => void;
}

export function InsightsEmptyScreen({ onStartTraining }: InsightsEmptyScreenProps) {
  return (
    <div className="flex flex-col bg-white min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center px-16 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[#1a1a1a]/10 to-[#1a1a1a]/5 rounded-full flex items-center justify-center">
            <TrendingUp className="w-20 h-20 text-[#1a1a1a]/40" />
          </div>

          <SerifHeading size="2xl" className="mb-4 text-3xl sm:text-4xl md:text-5xl">Пока нет данных для аналитики</SerifHeading>
          <p className="text-[#1a1a1a]/70 mb-6">
            Завершите несколько тренировок, и здесь появятся:
          </p>

          <WellnessCard className="p-6 mb-6 text-left">
            <ul className="space-y-2 text-[#1a1a1a]/80">
              <li>• Прогресс по сессиям</li>
              <li>• Тренды улучшения</li>
            </ul>
          </WellnessCard>

          <PillButton onClick={onStartTraining} variant="gradientMesh" className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Начать тренировку
          </PillButton>
        </div>
      </div>
    </div>
  );
}


import React from 'react';
import { CheckCircle2, Circle, Play } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface FirstTrainingScreenProps {
  onStartTutorial: () => void;
}

export function FirstTrainingScreen({ onStartTutorial }: FirstTrainingScreenProps) {
  return (
    <div className="flex flex-col bg-white min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center px-16 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-6">🎉</div>

          <SerifHeading size="2xl" className="mb-8 text-3xl sm:text-4xl md:text-5xl">
            Всё готово для первой тренировки!
          </SerifHeading>

          <WellnessCard className="p-6 mb-6 text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#a8d8ea]" />
                <span className="text-[#1a1a1a]">Устройство получено</span>
              </div>
              <div className="flex items-center gap-3">
                <Circle className="w-6 h-6 text-[#1a1a1a]/30" />
                <span className="text-[#1a1a1a]/70">Пройти инструктаж (~5 мин)</span>
              </div>
              <div className="flex items-center gap-3">
                <Circle className="w-6 h-6 text-[#1a1a1a]/30" />
                <span className="text-[#1a1a1a]/70">Первая тренировка (~15 мин)</span>
              </div>
            </div>
          </WellnessCard>

          <PillButton onClick={onStartTutorial} variant="gradientMesh" className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Начать инструктаж
          </PillButton>
        </div>
      </div>
    </div>
  );
}


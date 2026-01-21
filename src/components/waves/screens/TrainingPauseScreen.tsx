import React from 'react';
import { Play, X } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface TrainingPauseScreenProps {
  reason?: string;
  onResume: () => void;
  onFinish: () => void;
}

export function TrainingPauseScreen({ reason, onResume, onFinish }: TrainingPauseScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
      <WellnessCard className="w-full max-w-sm p-6 text-center">
        <SerifHeading size="2xl" className="mb-4 text-3xl sm:text-4xl md:text-5xl">Пауза</SerifHeading>
        {reason && (
          <p className="text-[#1a1a1a]/70 mb-6">Причина: {reason}</p>
        )}

        <div className="space-y-3">
          <PillButton onClick={onResume} variant="gradientMesh" className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Продолжить
          </PillButton>
          <PillButton onClick={onFinish} variant="secondary" className="w-full">
            <X className="w-4 h-4 mr-2" />
            Завершить
          </PillButton>
        </div>
      </WellnessCard>
    </div>
  );
}


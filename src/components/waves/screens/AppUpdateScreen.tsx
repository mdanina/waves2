import React from 'react';
import { Download, X } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface AppUpdateScreenProps {
  isMandatory?: boolean;
  onUpdate: () => void;
  onLater?: () => void;
}

export function AppUpdateScreen({ isMandatory = false, onUpdate, onLater }: AppUpdateScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
      <WellnessCard className="w-full max-w-sm p-6">
        <SerifHeading size="xl" className="mb-2 text-2xl sm:text-3xl md:text-4xl">Доступна новая версия</SerifHeading>
        <p className="text-[#1a1a1a]/70 mb-6">
          Обновите приложение для получения новых функций и исправлений
        </p>

        <div className="space-y-3">
          <PillButton onClick={onUpdate} variant="gradientMesh" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Обновить
          </PillButton>
          {!isMandatory && onLater && (
            <PillButton onClick={onLater} variant="secondary" className="w-full">
              Позже
            </PillButton>
          )}
        </div>
      </WellnessCard>
    </div>
  );
}


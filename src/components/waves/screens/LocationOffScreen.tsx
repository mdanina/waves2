import React from 'react';
import { MapPin } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';

interface LocationOffScreenProps {
  onOpenSettings: () => void;
}

export function LocationOffScreen({ onOpenSettings }: LocationOffScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center px-16 py-12 bg-white min-h-screen">
      <div className="w-full max-w-sm text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#ff8a65]/30 to-[#ff8a65]/50 rounded-full flex items-center justify-center">
          <MapPin className="w-16 h-16 text-[#ff8a65]" />
        </div>

        <SerifHeading size="2xl" className="mb-4 text-3xl sm:text-4xl md:text-5xl">Геолокация</SerifHeading>
        <p className="text-[#1a1a1a]/70 mb-6">
          Требуется для Bluetooth. Мы не отслеживаем ваше местоположение.
        </p>

        <PillButton onClick={onOpenSettings} variant="gradientMesh" className="w-full">
          Открыть настройки
        </PillButton>
      </div>
    </div>
  );
}


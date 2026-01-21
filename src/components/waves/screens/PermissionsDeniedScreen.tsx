import React from 'react';
import { Settings } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';

interface PermissionsDeniedScreenProps {
  onOpenSettings: () => void;
  onCancel: () => void;
}

export function PermissionsDeniedScreen({ onOpenSettings, onCancel }: PermissionsDeniedScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center px-16 py-12 bg-white min-h-screen">
      <div className="w-full max-w-sm text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#ff8a65]/30 to-[#ff8a65]/50 rounded-full flex items-center justify-center">
          <Settings className="w-16 h-16 text-[#ff8a65]" />
        </div>

        <SerifHeading size="2xl" className="mb-4 text-3xl sm:text-4xl md:text-5xl">Нужны разрешения</SerifHeading>
        <p className="text-[#1a1a1a]/70 mb-6">
          Для работы приложения необходимы разрешения на Bluetooth и геолокацию.
          Без них мы не сможем подключить устройство Flex4.
        </p>

        <div className="space-y-3">
          <PillButton onClick={onOpenSettings} variant="gradientMesh" className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Открыть настройки
          </PillButton>
          <PillButton onClick={onCancel} variant="secondary" className="w-full">
            Отмена
          </PillButton>
        </div>
      </div>
    </div>
  );
}


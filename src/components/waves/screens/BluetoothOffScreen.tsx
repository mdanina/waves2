import React from 'react';
import { Bluetooth } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';

interface BluetoothOffScreenProps {
  onEnable: () => void;
  onCancel: () => void;
}

export function BluetoothOffScreen({ onEnable, onCancel }: BluetoothOffScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center px-16 py-12 bg-white min-h-screen">
      <div className="w-full max-w-sm text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#ff8a65]/30 to-[#ff8a65]/50 rounded-full flex items-center justify-center relative">
          <Bluetooth className="w-16 h-16 text-[#ff8a65]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-1 bg-[#ff8a65] rotate-45"></div>
          </div>
        </div>

        <SerifHeading size="2xl" className="mb-4 text-3xl sm:text-4xl md:text-5xl">Bluetooth выключен</SerifHeading>
        <p className="text-[#1a1a1a]/70 mb-6">
          Для подключения Flex4 необходимо включить Bluetooth
        </p>

        <div className="space-y-3">
          <PillButton onClick={onEnable} variant="gradientMesh" className="w-full">
            Включить
          </PillButton>
          <PillButton onClick={onCancel} variant="secondary" className="w-full">
            Отмена
          </PillButton>
        </div>
      </div>
    </div>
  );
}


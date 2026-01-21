import React from 'react';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';

interface DeviceNotFoundScreenProps {
  onRetry: () => void;
  onSupport: () => void;
}

export function DeviceNotFoundScreen({ onRetry, onSupport }: DeviceNotFoundScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center px-16 py-12 bg-white min-h-screen">
      <div className="w-full max-w-sm text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#ff8a65]/30 to-[#ff8a65]/50 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-16 h-16 text-[#ff8a65]" />
        </div>

        <SerifHeading size="2xl" className="mb-4 text-3xl sm:text-4xl md:text-5xl">Устройство не найдено</SerifHeading>
        <p className="text-[#1a1a1a]/70 mb-8">
          Убедитесь, что Flex4 включён и рядом
        </p>

        <div className="space-y-3">
          <PillButton onClick={onRetry} variant="gradientMesh" className="w-full">
            Попробовать снова
          </PillButton>

          <button
            onClick={onSupport}
            className="w-full flex items-center justify-center gap-2 text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Проблемы?</span>
          </button>
        </div>
      </div>
    </div>
  );
}


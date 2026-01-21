import React from 'react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';

interface PermissionsExplanationScreenProps {
  onContinue: () => void;
  onBack?: () => void;
}

export function PermissionsExplanationScreen({ onContinue, onBack }: PermissionsExplanationScreenProps) {
  return (
    <div 
      className="flex flex-col min-h-screen"
      style={{
        backgroundImage: 'url(/bg2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex-1 flex items-center justify-center px-16 py-12">
        <div className="w-full max-w-sm text-center">
          <SerifHeading size="xl" className="mb-4 text-3xl sm:text-4xl md:text-5xl">
            Для подключения устройства нужны разрешения
          </SerifHeading>

          <div className="space-y-3 mb-8 text-left">
            <div className="rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📡</span>
                <div>
                  <p className="font-semibold text-[#1a1a1a]">Bluetooth</p>
                  <p className="text-sm text-[#1a1a1a]/70">для связи с Flex4</p>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-semibold text-[#1a1a1a]">Геолокация</p>
                  <p className="text-sm text-[#1a1a1a]/70">требуется для BT на Android</p>
                </div>
              </div>
            </div>
          </div>

          <PillButton onClick={onContinue} variant="gradientMesh" className="w-full mb-3">
            Понятно
          </PillButton>
          
          {onBack && (
            <button
              onClick={onBack}
              className="w-full text-center text-[#1a1a1a]/70 hover:text-[#1a1a1a] py-3 text-sm transition-colors"
            >
              Назад
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';

interface WearingInstructionScreenProps {
  onBack: () => void;
  onReady: () => void;
}

export function WearingInstructionScreen({ onBack, onReady }: WearingInstructionScreenProps) {
  return (
    <div 
      className="flex flex-col min-h-screen"
      style={{
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex items-center px-4 py-4">
        <button onClick={onBack} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl">Инструкция</SerifHeading>
      </div>

      <div className="flex-1 px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8">
        {/* Видео/GIF placeholder */}
        <div className="w-full h-48 sm:h-56 md:h-64 bg-white rounded-2xl mb-4 sm:mb-6 flex items-center justify-center">
          <span className="text-4xl sm:text-5xl md:text-6xl">📹</span>
        </div>

        <SerifHeading size="xl" className="mb-4 text-3xl sm:text-4xl md:text-5xl">Наденьте устройство на ребёнка</SerifHeading>

        <div className="space-y-4 mb-6">
          <div className="rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white/30 backdrop-blur-md border border-white/30">
            <div className="flex items-start gap-3">
              <span className="text-xl sm:text-2xl">👂</span>
              <p className="text-sm sm:text-base text-[#1a1a1a]/80">Датчики за ушами — на кожу</p>
            </div>
          </div>

          <div className="rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white/30 backdrop-blur-md border border-white/30">
            <div className="flex items-start gap-3">
              <span className="text-xl sm:text-2xl">💇</span>
              <div>
                <p className="text-sm sm:text-base text-[#1a1a1a]/80 mb-1">Длинные волосы?</p>
                <button className="text-[#a8d8ea] hover:text-[#8bc9e0] text-xs sm:text-sm">
                  Смотреть дополнительные инструкции
                </button>
              </div>
            </div>
          </div>
        </div>

        <PillButton onClick={onReady} variant="gradientMesh" className="w-full mb-3">
          Готово
        </PillButton>
        
        <button
          onClick={onBack}
          className="w-full text-center text-[#1a1a1a]/70 hover:text-[#1a1a1a] py-3 text-xs sm:text-sm transition-colors"
        >
          Назад
        </button>
      </div>
    </div>
  );
}


import React from 'react';
import { Package, Wind, Video, ArrowLeft } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface DeviceInTransitScreenProps {
  deliveryDate?: string;
  trackingNumber?: string;
  onBreathingExercise?: () => void;
  onVideo?: () => void;
  onBack?: () => void;
}

export function DeviceInTransitScreen({
  deliveryDate = '8 января',
  trackingNumber,
  onBreathingExercise,
  onVideo,
  onBack,
}: DeviceInTransitScreenProps) {
  return (
    <div className="flex flex-col bg-white min-h-screen">
      {/* Шапка с кнопкой назад */}
      {onBack && (
        <div className="flex items-center px-4 py-4 border-b border-[#1a1a1a]/10 bg-white/80 backdrop-blur-sm">
          <button onClick={onBack} className="p-2 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <SerifHeading size="xl" className="flex-1 text-center text-2xl sm:text-3xl md:text-4xl">Устройство в пути</SerifHeading>
          <div className="w-10"></div>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center px-16 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[#a8d8ea]/30 to-[#a8d8ea]/50 rounded-full flex items-center justify-center">
            <Package className="w-20 h-20 text-[#a8d8ea]" />
          </div>

          <SerifHeading size="2xl" className="mb-2 text-3xl sm:text-4xl md:text-5xl">Ваш Flex4 в пути! 📦</SerifHeading>
          <p className="text-[#1a1a1a]/70 mb-4">Статус: Ожидается доставка {deliveryDate}</p>

          {trackingNumber && (
            <a
              href="#"
              className="text-[#a8d8ea] hover:text-[#8bc9e0] text-sm underline mb-8 block"
            >
              Трек-номер: {trackingNumber}
            </a>
          )}

          <WellnessCard className="p-6 mb-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-4">Что можно сделать сейчас:</h2>
            <div className="space-y-3">
              {onBreathingExercise && (
                <button
                  onClick={onBreathingExercise}
                  className="w-full flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-[#1a1a1a]/10 hover:bg-white/70 text-left transition-all"
                >
                  <Wind className="w-5 h-5 text-[#a8d8ea]" />
                  <span className="text-[#1a1a1a]">Попробовать дыхательные упражнения</span>
                </button>
              )}
              {onVideo && (
                <button
                  onClick={onVideo}
                  className="w-full flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-[#1a1a1a]/10 hover:bg-white/70 text-left transition-all"
                >
                  <Video className="w-5 h-5 text-[#a8d8ea]" />
                  <span className="text-[#1a1a1a]">Посмотреть видео «Что такое нейрофидбек»</span>
                </button>
              )}
            </div>
          </WellnessCard>
        </div>
      </div>
    </div>
  );
}


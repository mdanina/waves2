import React from 'react';
import { CheckCircle2, X, Home } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface DeviceConnectedScreenProps {
  deviceId: string;
  batteryLevel?: number;
  onContinue: () => void;
  onClose?: () => void;
  onHome?: () => void;
  onBack?: () => void;
}

export function DeviceConnectedScreen({
  deviceId,
  batteryLevel = 85,
  onContinue,
  onClose,
  onHome,
  onBack,
}: DeviceConnectedScreenProps) {
  return (
    <div className="flex flex-col bg-white min-h-screen">
      {/* Шапка с кнопками */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-between px-4 py-4 border-b border-[#1a1a1a]/10">
        {onClose ? (
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>
        ) : null}
        <div className="flex-1"></div>
        {onHome && (
          <button
            onClick={onHome}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2"
            title="На главный экран"
          >
            <Home className="w-6 h-6" />
            <span className="text-sm">Главная</span>
          </button>
        )}
        {!onHome && !onClose && <div></div>}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-16 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#a8d8ea]/30 to-[#a8d8ea]/50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-[#a8d8ea]" />
          </div>

          <SerifHeading size="2xl" className="mb-4 text-3xl sm:text-4xl md:text-5xl">Устройство подключено</SerifHeading>

          <WellnessCard className="mb-6 text-left">
            <div className="mb-2">
              <p className="text-sm text-gray-600">Серийный номер</p>
              <p className="font-semibold text-gray-900">{deviceId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Заряд</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-[#1a1a1a]/10 rounded-full h-2">
                  <div
                    className="bg-[#a8d8ea] h-2 rounded-full"
                    style={{ width: `${batteryLevel}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-[#1a1a1a]">{batteryLevel}%</span>
              </div>
            </div>
          </WellnessCard>

          <PillButton onClick={onContinue} variant="gradientMesh" className="w-full mb-3">
            Продолжить
          </PillButton>
          
          {onBack && (
            <button
              onClick={onBack}
              className="w-full text-center text-[#1a1a1a]/70 hover:text-[#1a1a1a] py-3 text-sm transition-colors mb-3"
            >
              Назад
            </button>
          )}
          
          {onHome && (
            <button
              onClick={onHome}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 py-2 text-sm"
            >
              <Home className="w-4 h-4" />
              <span>На главный экран</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


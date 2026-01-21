import React from 'react';
import { Bell } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';

interface PushNotificationsRequestScreenProps {
  childName?: string;
  onEnable: () => void;
  onSkip: () => void;
}

export function PushNotificationsRequestScreen({
  childName = 'Миша',
  onEnable,
  onSkip,
}: PushNotificationsRequestScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center px-16 py-12 bg-white min-h-screen">
      <div className="w-full max-w-sm text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#a8d8ea]/30 to-[#a8d8ea]/50 rounded-full flex items-center justify-center">
          <Bell className="w-16 h-16 text-[#a8d8ea]" />
        </div>

        <SerifHeading size="2xl" className="mb-4 text-3xl sm:text-4xl md:text-5xl">
          Хотите напоминания о тренировках?
        </SerifHeading>
        <p className="text-[#1a1a1a]/70 mb-8">
          Мы напомним, когда пора тренироваться, и расскажем о прогрессе {childName}
        </p>

        <div className="space-y-3">
          <PillButton onClick={onEnable} variant="gradientMesh" className="w-full">
            Включить уведомления
          </PillButton>
          <button onClick={onSkip} className="w-full text-[#1a1a1a]/50 hover:text-[#1a1a1a]/70 text-sm">
            Не сейчас
          </button>
        </div>
      </div>
    </div>
  );
}


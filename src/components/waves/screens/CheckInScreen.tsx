import React, { useState } from 'react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';
import { EmojiSelector } from '../../design-system/EmojiSelector';

interface CheckInScreenProps {
  childName?: string;
  onContinue: (data: { emotion: string; concentration: number }) => void;
  onBack?: () => void;
}

const emotions = [
  { emoji: '😊', label: 'Доволен', value: 'happy' },
  { emoji: '😰', label: 'Тревожно', value: 'anxious' },
  { emoji: '😔', label: 'Подавлен', value: 'depressed' },
  { emoji: '😃', label: 'Мотивирован', value: 'motivated' },
  { emoji: '😑', label: 'Без мотивации', value: 'unmotivated' },
  { emoji: '😢', label: 'Грустно', value: 'sad' },
  { emoji: '😤', label: 'Раздражён', value: 'irritated' },
  { emoji: '😄', label: 'Счастлив', value: 'very_happy' },
  { emoji: '😱', label: 'Паника', value: 'panic' },
  { emoji: '⚡', label: 'Энергичен', value: 'energetic' },
];

const concentrationLevels = [
  { emoji: '😵', label: 'Рассеян', value: 1 },
  { emoji: '😐', label: 'Немного', value: 2 },
  { emoji: '🙂', label: 'Нормально', value: 3 },
  { emoji: '😊', label: 'Хорошо', value: 4 },
  { emoji: '🤓', label: 'Отлично', value: 5 },
];

export function CheckInScreen({ childName = 'ребёнок', onContinue, onBack }: CheckInScreenProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [concentration, setConcentration] = useState<number | null>(null);

  const canContinue = selectedEmotion !== null && concentration !== null;

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <div className="flex-1 px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8">
        <SerifHeading size="2xl" className="mb-6 sm:mb-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
          Как {childName} себя чувствует сейчас?
        </SerifHeading>

        {/* Секция Эмоции */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Эмоции</h2>
          <div className="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
            {emotions.map((emotion) => {
              const isSelected = selectedEmotion === emotion.value;
              return (
                <button
                  key={emotion.value}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedEmotion(null);
                    } else {
                      setSelectedEmotion(emotion.value);
                    }
                  }}
                  className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                    isSelected ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl transition-all ${
                      isSelected
                        ? 'bg-white shadow-[0_4px_15px_rgba(0,0,0,0.1)] scale-110'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                  >
                    {emotion.emoji}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs md:text-sm transition-opacity ${
                      isSelected ? 'opacity-100 font-medium' : 'opacity-60'
                    }`}
                  >
                    {emotion.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Секция Концентрация */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Концентрация</h2>
          <div className="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
            {concentrationLevels.map((level) => {
              const isSelected = concentration === level.value;
              return (
                <button
                  key={level.value}
                  onClick={() => setConcentration(level.value)}
                  className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                    isSelected ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl transition-all ${
                      isSelected
                        ? 'bg-white shadow-[0_4px_15px_rgba(0,0,0,0.1)] scale-110'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                  >
                    {level.emoji}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs md:text-sm transition-opacity ${
                      isSelected ? 'opacity-100 font-medium' : 'opacity-60'
                    }`}
                  >
                    {level.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <PillButton
          onClick={() => {
            if (canContinue) {
              onContinue({
                emotion: selectedEmotion!,
                concentration: concentration!,
              });
            }
          }}
          variant="gradientMesh"
          className="w-full mb-3"
          disabled={!canContinue}
        >
          Продолжить
        </PillButton>
        
        {onBack && (
          <button
            onClick={onBack}
            className="w-full text-center text-[#1a1a1a]/70 hover:text-[#1a1a1a] py-3 text-xs sm:text-sm transition-colors"
          >
            Назад
          </button>
        )}
      </div>
    </div>
  );
}


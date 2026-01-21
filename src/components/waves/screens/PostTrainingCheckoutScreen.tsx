import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface PostTrainingCheckoutScreenProps {
  childName?: string;
  onComplete: (data: { mood: string; concentration: number; rating: number }) => void;
  onSkip: () => void;
}

const moodOptions = [
  { emoji: '😊', label: 'Лучше', value: 'better' },
  { emoji: '😐', label: 'Так же', value: 'same' },
  { emoji: '😟', label: 'Хуже', value: 'worse' },
];

const concentrationLevels = [
  { emoji: '😵', label: 'Рассеян', value: 1 },
  { emoji: '😐', label: 'Немного', value: 2 },
  { emoji: '🙂', label: 'Нормально', value: 3 },
  { emoji: '😊', label: 'Хорошо', value: 4 },
  { emoji: '🤓', label: 'Отлично', value: 5 },
];

export function PostTrainingCheckoutScreen({
  childName = 'ребёнок',
  onComplete,
  onSkip,
}: PostTrainingCheckoutScreenProps) {
  const [mood, setMood] = useState<string | null>(null);
  const [concentration, setConcentration] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(3); // По умолчанию 3, если пользователь не двигал слайдер

  const canComplete = mood !== null && concentration !== null;

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <div className="flex-1 px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <SerifHeading size="2xl" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            Как {childName} себя чувствует после тренировки?
          </SerifHeading>
          <button onClick={onSkip} className="text-[#1a1a1a]/40 hover:text-[#1a1a1a]/60">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Настроение */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Настроение</h2>
          <div className="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
            {moodOptions.map((option) => {
              const isSelected = mood === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setMood(option.value)}
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
                    {option.emoji}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs md:text-sm transition-opacity ${
                      isSelected ? 'opacity-100 font-medium' : 'opacity-60'
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Концентрация */}
        <div className="mb-4 sm:mb-6 md:mb-8">
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

        {/* Понравилась тренировка */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Понравилась тренировка?</h2>
          <div className="relative py-4 sm:py-5 md:py-6">
            {/* Slider track */}
            <div className="relative h-2 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-visible shadow-inner">
              {/* Fill */}
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
              style={{
                width: `${(rating - 1) / 4 * 100}%`,
                background: `linear-gradient(to right, #F3B83A, #F3B83A80)`,
                boxShadow: `0 0 20px #F3B83A30`,
              }}
              />
            </div>
            
            {/* Thumb */}
            <div
              className="absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200 flex items-center justify-center pointer-events-none top-1/2 -translate-y-1/2"
              style={{
                left: `calc(${(rating - 1) / 4 * 100}% - 20px)`,
                background: `radial-gradient(circle at 30% 30%, #F3B83Aff, #F3B83Acc, #F3B83A99)`,
                boxShadow: `0 6px 20px #F3B83A50, 0 2px 8px #F3B83A40, inset 0 1px 2px rgba(255,255,255,0.3)`,
              }}
            >
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white/90 rounded-full shadow-sm" />
            </div>
            
            {/* Input */}
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
            />
            
          </div>
        </div>

        <PillButton
          onClick={() => {
            if (canComplete) {
              onComplete({
                mood: mood!,
                concentration: concentration!,
                rating: rating!,
              });
            }
          }}
          variant="gradientMesh"
          className="w-full mb-4"
          disabled={!canComplete}
        >
          Готово
        </PillButton>

        <button onClick={onSkip} className="w-full text-center text-[#1a1a1a]/50 hover:text-[#1a1a1a]/70 text-xs sm:text-sm md:text-base">
          Пропустить
        </button>
      </div>
    </div>
  );
}


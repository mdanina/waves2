import React, { useState } from 'react';
import { Play, Zap } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { Tag } from '../../design-system/Tag';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  waves: string;
  duration: number;
  eyesOpen: boolean;
  current?: boolean;
}

interface TrainingSelectionScreenProps {
  currentProgram: TrainingProgram;
  onStart: () => void;
  onChangeProgram: () => void;
  onQuickSession?: () => void;
  onBack?: () => void;
}

export function TrainingSelectionScreen({
  currentProgram,
  onStart,
  onChangeProgram,
  onQuickSession,
  onBack,
}: TrainingSelectionScreenProps) {
  // Определяем карточку в зависимости от типа программы
  const getCardImage = (programId: string, programName: string): string => {
    const id = programId.toLowerCase();
    const name = programName.toLowerCase();
    
    if (id === 'alpha' || name.includes('спокойствие')) {
      return '/card2.png';
    }
    if (id === 'smr' || name.includes('фокус')) {
      return '/card3.png';
    }
    if (id === 'breathing' || name.includes('дыхание')) {
      return '/card4.png';
    }
    // По умолчанию для 'tbr' или 'Концентрация'
    return '/card1.png';
  };

  const cardImage = getCardImage(currentProgram.id, currentProgram.name);

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
      <div className="flex-1 px-16 py-8">
        {/* Текущая программа */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl">Текущая программа</SerifHeading>
            <button
              onClick={onChangeProgram}
              className="text-xs sm:text-sm text-[#1a1a1a] hover:text-[#1a1a1a]/70 transition-colors"
            >
              Сменить
            </button>
          </div>
          <button
            className="w-full text-left transition-all hover:scale-[1.02] relative overflow-hidden rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_30px_rgba(0,0,0,0.1)]"
          >
            <img 
              src={cardImage} 
              alt={currentProgram.name} 
              className="w-full h-auto"
            />
            <div className="absolute inset-0 p-6 pl-4 flex flex-col justify-between items-start">
              <span className="inline-block bg-white/80 backdrop-blur-sm text-[#1a1a1a] text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1 rounded-full self-start -ml-1">
                {currentProgram.duration} МИН
              </span>
              <div className="flex flex-col -ml-1 w-full">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-[#1a1a1a] font-medium px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm shadow-sm mb-2 self-start">
                  {currentProgram.eyesOpen ? '👁 Глаза открыты' : '👁 Глаза закрыты'}
                </span>
                <SerifHeading size="xl" className="mb-1 text-2xl sm:text-3xl md:text-4xl">{currentProgram.name}</SerifHeading>
                <p className="text-xs sm:text-sm text-[#1a1a1a]/70 leading-relaxed">{currentProgram.waves}</p>
              </div>
            </div>
          </button>
        </div>

        <PillButton onClick={onStart} variant="gradientMesh" className="w-full mb-3">
          <Play className="w-4 h-4 mr-2" />
          Начать тренировку
        </PillButton>

        {onBack && (
          <button
            onClick={onBack}
            className="w-full text-center text-[#1a1a1a]/70 hover:text-[#1a1a1a] py-3 text-xs sm:text-sm transition-colors mb-3"
          >
            Назад
          </button>
        )}

        {onQuickSession && (
          <button
            onClick={onQuickSession}
            className="w-full flex items-center justify-center gap-2 text-[#1a1a1a]/70 hover:text-[#1a1a1a] py-2"
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Мало времени? Быстрая сессия</span>
          </button>
        )}
      </div>
    </div>
  );
}


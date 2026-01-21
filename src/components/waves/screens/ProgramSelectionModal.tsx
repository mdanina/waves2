import React from 'react';
import { X, Check } from 'lucide-react';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface Program {
  id: string;
  name: string;
  eyesOpen: boolean;
  waves: string;
  duration?: number;
  current?: boolean;
}

interface ProgramSelectionModalProps {
  programs: Program[];
  currentProgramId: string;
  onSelect: (programId: string) => void;
  onClose: () => void;
}

export function ProgramSelectionModal({
  programs,
  currentProgramId,
  onSelect,
  onClose,
}: ProgramSelectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#1a1a1a]/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl">Выберите программу</SerifHeading>
          <button onClick={onClose} className="p-2 hover:bg-[#1a1a1a]/10 rounded-full">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
          {programs.map((program) => (
            <button
              key={program.id}
              onClick={() => {
                onSelect(program.id);
                onClose();
              }}
              className="w-full text-left transition-all hover:scale-[1.02]"
            >
              <WellnessCard
                gradient={program.id === currentProgramId ? 'blue' : undefined}
                hover
                className="p-3 sm:p-4"
              >
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-[#1a1a1a]">{program.name}</h3>
                  {program.id === currentProgramId && (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#a8d8ea]" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#1a1a1a]/70">
                  <span>{program.eyesOpen ? '👁 Глаза открыты' : '👁 Глаза закрыты'}</span>
                  <span>•</span>
                  <span>{program.waves}</span>
                </div>
              </WellnessCard>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


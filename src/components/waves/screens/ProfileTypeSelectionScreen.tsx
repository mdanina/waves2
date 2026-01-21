import React from 'react';
import { SerifHeading } from '../../design-system/SerifHeading';

interface ProfileTypeSelectionScreenProps {
  onSelect: (type: 'waves' | 'waves-kids') => void;
}

export function ProfileTypeSelectionScreen({ onSelect }: ProfileTypeSelectionScreenProps) {
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
      <div className="flex-1 flex items-start justify-center px-16" style={{ paddingTop: '77px' }}>
        <div className="w-full max-w-md">
          <SerifHeading size="2xl" className="mb-6 sm:mb-8 text-center text-3xl sm:text-4xl md:text-5xl">
            Выберите профиль
          </SerifHeading>

          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => onSelect('waves')}
              className="w-full text-left transition-all hover:scale-[1.02]"
            >
              <div className="rounded-[20px] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white/30 backdrop-blur-md border border-white/30 transition-all duration-300 hover:shadow-[0_6px_30px_rgba(0,0,0,0.15)] hover:bg-white/40">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#1a1a1a] mb-1.5 sm:mb-2">Waves</h2>
                    <p className="text-sm sm:text-base md:text-lg text-[#1a1a1a]/70">Для взрослых</p>
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelect('waves-kids')}
              className="w-full text-left transition-all hover:scale-[1.02]"
            >
              <div className="rounded-[20px] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white/30 backdrop-blur-md border border-white/30 transition-all duration-300 hover:shadow-[0_6px_30px_rgba(0,0,0,0.15)] hover:bg-white/40">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#1a1a1a] mb-1.5 sm:mb-2">Waves Kids</h2>
                    <p className="text-sm sm:text-base md:text-lg text-[#1a1a1a]/70">Для детей</p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


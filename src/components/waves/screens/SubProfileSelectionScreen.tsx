import React from 'react';
import { Plus } from 'lucide-react';
import { SerifHeading } from '../../design-system/SerifHeading';

interface SubProfile {
  id: string;
  name: string;
  age?: number;
  avatar?: string;
}

interface SubProfileSelectionScreenProps {
  profiles: SubProfile[];
  profileType: 'waves' | 'waves-kids';
  onSelect: (profileId: string) => void;
  onAdd?: () => void;
  onBack?: () => void;
  onLogout?: () => void;
  canAdd?: boolean;
}

export function SubProfileSelectionScreen({
  profiles,
  profileType,
  onSelect,
  onAdd,
  onBack,
  onLogout,
  canAdd = false,
}: SubProfileSelectionScreenProps) {
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
            Выберите пользователя
          </SerifHeading>

          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => onSelect(profile.id)}
                className="w-full text-left transition-all hover:scale-[1.02]"
              >
                <div className="rounded-[20px] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white/30 backdrop-blur-md border border-white/30 transition-all duration-300 hover:shadow-[0_6px_30px_rgba(0,0,0,0.15)] hover:bg-white/40">
                  <div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#1a1a1a] mb-1.5 sm:mb-2">{profile.name}</h3>
                    {profile.age && (
                      <p className="text-sm sm:text-base md:text-lg text-[#1a1a1a]/70">{profile.age} лет</p>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {canAdd && onAdd && (
              <button
                onClick={onAdd}
                className="w-full text-left transition-all hover:scale-[1.02]"
              >
                <div className="rounded-[20px] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white/30 backdrop-blur-md border border-white/30 transition-all duration-300 hover:shadow-[0_6px_30px_rgba(0,0,0,0.15)] hover:bg-white/40">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#1a1a1a]/70" />
                    <span className="text-lg sm:text-xl md:text-2xl font-semibold text-[#1a1a1a]">Добавить пользователя</span>
                  </div>
                </div>
              </button>
            )}
          </div>

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
    </div>
  );
}


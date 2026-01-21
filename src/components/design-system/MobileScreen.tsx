import React from 'react';
import { cn } from '@/lib/utils';

interface MobileScreenProps {
  children: React.ReactNode;
  className?: string;
  showNotch?: boolean;
}

export function MobileScreen({ children, className, showNotch = true }: MobileScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div
        className={cn(
          'relative w-full max-w-[390px] bg-white rounded-[40px] shadow-2xl overflow-hidden',
          className
        )}
        style={{ aspectRatio: '9/19.5' }}
      >
        {/* Phone frame */}
        <div className="absolute inset-0 border-[14px] border-black rounded-[40px] pointer-events-none z-50" />
        
        {/* Notch */}
        {showNotch && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-3xl z-50" />
        )}

        {/* Content */}
        <div className="relative w-full h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

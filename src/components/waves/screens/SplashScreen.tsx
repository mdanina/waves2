import React from 'react';
import { SerifHeading } from '../../design-system/SerifHeading';
import { Logo } from '../../design-system/Logo';

export function SplashScreen() {
  return (
    <div 
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="text-center">
        <div className="mb-8">
          {/* Логотип Waves */}
          <div className="mx-auto mb-4 animate-pulse">
            <Logo size="xl" variant="default" />
          </div>
          <SerifHeading size="4xl" className="text-white">Waves</SerifHeading>
        </div>
      </div>
    </div>
  );
}


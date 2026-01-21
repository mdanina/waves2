import React from 'react';
import { cn } from '@/lib/utils';

type GradientVariant = 'peach' | 'lavender' | 'cream' | 'pink';

interface GradientBackgroundProps {
  variant: GradientVariant;
  className?: string;
  children?: React.ReactNode;
}

const gradientStyles: Record<GradientVariant, string> = {
  peach: 'bg-gradient-to-br from-[#ffecd2] via-[#ffd7ba] to-[#fcb69f]',
  lavender: 'bg-gradient-to-br from-[#e6dff5] via-[#d4c5f0] to-[#c8b8e8]',
  cream: 'bg-gradient-to-br from-[#fef3e2] via-[#ffecd2] to-[#ffd7ba]',
  pink: 'bg-gradient-to-br from-[#ffd6e8] via-[#ffc9df] to-[#ffb5d5]',
};

const overlayGradients: Record<GradientVariant, string> = {
  peach: 'rgba(255, 234, 210, 0.3)',
  lavender: 'rgba(230, 223, 245, 0.3)',
  cream: 'rgba(254, 243, 226, 0.3)',
  pink: 'rgba(255, 214, 232, 0.3)',
};

export function GradientBackground({ variant, className, children }: GradientBackgroundProps) {
  return (
    <div 
      className={cn('min-h-screen w-full relative', className)}
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Gradient overlay with reduced opacity */}
      <div 
        className={cn('absolute inset-0 pointer-events-none', gradientStyles[variant])}
        style={{
          opacity: 0.25,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

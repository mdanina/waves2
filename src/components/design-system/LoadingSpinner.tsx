import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  gradient?: 'coral' | 'lavender' | 'blue' | 'pink' | 'yellow';
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md',
  gradient = 'coral',
  className
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const gradients = {
    coral: 'border-t-[#ff8a65]',
    lavender: 'border-t-[#b8a0d6]',
    blue: 'border-t-[#47BDF7]',
    pink: 'border-t-[#ffb5c5]',
    yellow: 'border-t-[#F3B83A]',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'rounded-full border-muted animate-spin',
        sizes[size],
        gradients[gradient]
      )} />
    </div>
  );
}

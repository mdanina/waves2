import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  gradient?: 'coral' | 'lavender' | 'blue' | 'pink' | 'yellow';
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({ 
  value,
  max = 100,
  gradient = 'coral',
  showLabel = false,
  label,
  size = 'md',
  className
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const gradients = {
    coral: 'from-[#ff8a65] to-[#ff6f4a]',
    lavender: 'from-[#b8a0d6] to-[#9b7ec4]',
    blue: 'from-[#47BDF7] to-[#6ab9e7]',
    pink: 'from-[#ffb5c5] to-[#ff9fb3]',
    yellow: 'from-[#F3B83A] to-[#FFD54F]',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {showLabel && <span className="text-sm font-medium">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizes[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            'bg-gradient-to-r shadow-md',
            gradients[gradient]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

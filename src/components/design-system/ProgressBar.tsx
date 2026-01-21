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
    coral: 'from-coral to-coral-light',
    lavender: 'from-lavender to-lavender-light',
    blue: 'from-soft-blue to-soft-blue/80',
    pink: 'from-soft-pink to-soft-pink/80',
    yellow: 'from-honey to-honey-light',
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
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          {showLabel && <span className="text-sm font-medium">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn(
        'w-full bg-muted rounded-full overflow-hidden',
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

import React from 'react';
import { cn } from '@/lib/utils';

interface TagProps {
  label: string;
  gradient?: 'coral' | 'lavender' | 'blue' | 'pink' | 'gray';
  onRemove?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function Tag({ 
  label,
  gradient = 'coral',
  onRemove,
  size = 'md',
  className
}: TagProps) {
  const gradients = {
    coral: 'from-coral/20 to-coral/10 text-coral border-coral/30',
    lavender: 'from-lavender/20 to-lavender/10 text-lavender border-lavender/30',
    blue: 'from-soft-blue/20 to-soft-blue/10 text-soft-blue border-soft-blue/30',
    pink: 'from-soft-pink/20 to-soft-pink/10 text-soft-pink border-soft-pink/30',
    gray: 'from-cloud to-cream text-muted-foreground border-muted',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border',
      'bg-gradient-to-r backdrop-blur-sm font-medium',
      gradients[gradient],
      sizes[size],
      className
    )}>
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

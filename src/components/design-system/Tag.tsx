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
    coral: 'from-[#ff8a65]/20 to-[#ff6f4a]/10 text-[#ff8a65] border-[#ff8a65]/30',
    lavender: 'from-[#b8a0d6]/20 to-[#9b7ec4]/10 text-[#b8a0d6] border-[#b8a0d6]/30',
    blue: 'from-[#a8d8ea]/20 to-[#8bc9e0]/10 text-[#a8d8ea] border-[#a8d8ea]/30',
    pink: 'from-[#ffb5c5]/20 to-[#ff9fb3]/10 text-[#ffb5c5] border-[#ffb5c5]/30',
    gray: 'from-gray-100 to-gray-50 text-gray-700 border-gray-300',
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

import React from 'react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

export function FloatingActionButton({ 
  icon, 
  label, 
  active = false, 
  onClick,
  size = 'lg',
  className 
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 transition-all duration-200',
        'hover:scale-105 active:scale-95',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center shadow-md transition-all',
          sizeClasses[size],
          active 
            ? 'bg-[#1a1a1a] text-white' 
            : 'bg-white text-[#1a1a1a] hover:bg-[#f5f5f5]'
        )}
      >
        {icon}
      </div>
      {label && (
        <span className={cn(
          'text-[10px] font-medium transition-colors',
          active ? 'text-[#1a1a1a]' : 'text-[#999999]'
        )}>
          {label}
        </span>
      )}
    </button>
  );
}

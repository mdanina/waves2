import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface EmojisOption {
  emoji: string;
  label: string;
  value: string;
}

interface EmojiSelectorProps {
  options: EmojisOption[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function EmojiSelector({ options, defaultValue, onChange, className }: EmojiSelectorProps) {
  const [selected, setSelected] = useState(defaultValue || options[0]?.value);

  const handleSelect = (value: string) => {
    setSelected(value);
    onChange?.(value);
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleSelect(option.value)}
          className={cn(
            'flex flex-col items-center gap-1 transition-all duration-200',
            'hover:scale-110'
          )}
        >
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all',
              selected === option.value
                ? 'bg-white shadow-[0_4px_15px_rgba(0,0,0,0.1)] scale-110'
                : 'bg-white/50 hover:bg-white/80'
            )}
          >
            {option.emoji}
          </div>
          <span
            className={cn(
              'text-xs transition-opacity',
              selected === option.value ? 'opacity-100 font-medium' : 'opacity-60'
            )}
          >
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}

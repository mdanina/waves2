import React from 'react';
import { cn } from '@/lib/utils';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  className?: string;
}

export function RadioGroup({ 
  options, 
  value, 
  onChange,
  name,
  className 
}: RadioGroupProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-start gap-3 cursor-pointer group"
        >
          <div className="relative mt-0.5">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              className="sr-only"
            />
            <div className={cn(
              'w-6 h-6 rounded-full border-2 transition-all duration-200',
              'flex items-center justify-center',
              value === option.value
                ? 'border-coral bg-gradient-to-br from-coral/10 to-coral/5'
                : 'border-muted bg-white group-hover:border-coral/50'
            )}>
              {value === option.value && (
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-coral to-coral-light" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{option.label}</div>
            {option.description && (
              <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

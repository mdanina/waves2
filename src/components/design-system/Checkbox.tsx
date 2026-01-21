import React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ 
  label, 
  checked = false, 
  onChange,
  disabled = false,
  className 
}: CheckboxProps) {
  return (
    <label className={cn(
      'flex items-center gap-3 cursor-pointer',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={cn(
          'w-6 h-6 rounded-lg border-2 transition-all duration-200',
          'flex items-center justify-center',
          checked 
            ? 'bg-gradient-to-br from-[#ff8a65] to-[#ff6f4a] border-[#ff8a65] shadow-md shadow-[#ff8a65]/30' 
            : 'bg-white border-gray-300'
        )}>
          {checked && (
            <svg 
              className="w-4 h-4 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Toggle({ 
  checked,
  defaultChecked = false,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className
}: ToggleProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = checked !== undefined ? checked : internalChecked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    if (checked === undefined) {
      setInternalChecked(newValue);
    }
    onChange?.(newValue);
  };

  const sizes = {
    sm: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
    md: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'translate-x-6' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' }
  };

  const sizeConfig = sizes[size];

  return (
    <label className={cn(
      'flex items-center gap-3 cursor-pointer',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}>
      <div className="relative">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
        />
        <div className={cn(
          sizeConfig.track,
          'rounded-full transition-all duration-300',
          isChecked
            ? 'bg-gradient-to-r from-[#F3B83A] to-[#FFD54F] shadow-md shadow-[#F3B83A]/30'
            : 'bg-gray-200'
        )}>
          <div className={cn(
            sizeConfig.thumb,
            'absolute top-0.5 left-0.5 bg-white rounded-full',
            'transition-transform duration-300 shadow-md',
            isChecked && sizeConfig.translate
          )} />
        </div>
      </div>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}
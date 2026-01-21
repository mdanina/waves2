import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ 
  label, 
  error, 
  icon,
  className,
  ...props 
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  };

  return (
    <div className="w-full">
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          {...props}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            'w-full px-4 py-3 rounded-2xl border-2 transition-all duration-200',
            'bg-white/80 backdrop-blur-sm',
            'focus:outline-none',
            isFocused ? 'border-honey shadow-lg shadow-honey/20' : 'border-muted',
            error && 'border-red-300',
            icon && 'pl-12',
            label && 'pt-6 pb-3',
            className
          )}
        />
        {label && (
          <label
            className={cn(
              'absolute left-4 transition-all duration-200 pointer-events-none',
              icon && 'left-12',
              isFocused || hasValue
                ? 'top-1.5 text-xs text-muted-foreground'
                : 'top-1/2 -translate-y-1/2 text-muted-foreground'
            )}
          >
            {label}
          </label>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1 ml-4">{error}</p>
      )}
    </div>
  );
}
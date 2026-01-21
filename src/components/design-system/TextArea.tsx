import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxLength?: number;
  showCount?: boolean;
}

export function TextArea({ 
  label, 
  error,
  maxLength,
  showCount = false,
  className,
  ...props 
}: TextAreaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(props.defaultValue?.toString().length || 0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    props.onChange?.(e);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          {...props}
          maxLength={maxLength}
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
            'bg-white/80 backdrop-blur-sm resize-none',
            'focus:outline-none',
            isFocused ? 'border-[#ff8a65] shadow-lg shadow-[#ff8a65]/20' : 'border-gray-200',
            error && 'border-red-300',
            label && 'pt-6',
            className
          )}
        />
        {label && (
          <label className="absolute left-4 top-3 text-xs text-gray-500">
            {label}
          </label>
        )}
      </div>
      <div className="flex justify-between mt-1 ml-4 text-sm">
        {error && <p className="text-red-500">{error}</p>}
        {showCount && maxLength && (
          <p className="text-gray-400 ml-auto">
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

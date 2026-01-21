import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface DropdownSelectorProps {
  options: string[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function DropdownSelector({ options, defaultValue, onChange, className }: DropdownSelectorProps) {
  const [selected, setSelected] = useState(defaultValue || options[0]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    setSelected(value);
    onChange?.(value);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm flex items-center gap-2 hover:bg-white transition-colors"
      >
        <span className="text-sm font-medium">{selected}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-lg overflow-hidden z-20 min-w-[120px]">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors',
                  selected === option && 'bg-gray-50 font-medium'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface BottomNavigationProps {
  items: NavItem[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function BottomNavigation({ items, defaultValue, onChange, className }: BottomNavigationProps) {
  const [selected, setSelected] = useState(defaultValue || items[0]?.value);

  const handleSelect = (value: string) => {
    setSelected(value);
    onChange?.(value);
  };

  return (
    <div className={cn('fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100', className)}>
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-around">
        {items.map((item) => {
          const isActive = selected === item.value;
          return (
            <button
              key={item.value}
              onClick={() => handleSelect(item.value)}
              className="flex flex-col items-center gap-1 transition-all duration-200"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200',
                  isActive ? 'bg-[#1a1a1a] text-white scale-110' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                {item.icon}
              </div>
              <span
                className={cn(
                  'text-xs transition-all duration-200',
                  isActive ? 'text-[#1a1a1a] font-medium' : 'text-gray-400'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

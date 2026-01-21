import React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineItem {
  time: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  gradient?: 'coral' | 'lavender' | 'blue' | 'pink';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  const gradients = {
    coral: 'from-[#ff8a65] to-[#ff6f4a]',
    lavender: 'from-[#b8a0d6] to-[#9b7ec4]',
    blue: 'from-[#a8d8ea] to-[#8bc9e0]',
    pink: 'from-[#ffb5c5] to-[#ff9fb3]',
  };

  return (
    <div className={cn('space-y-6', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex gap-4">
          {/* Timeline line and icon */}
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-gradient-to-br shadow-md',
              item.gradient ? gradients[item.gradient] : gradients.coral
            )}>
              {item.icon || (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            {index < items.length - 1 && (
              <div className="w-0.5 h-full min-h-[40px] bg-gradient-to-b from-gray-300 to-transparent mt-2" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-6">
            <div className="text-xs text-gray-500 mb-1">{item.time}</div>
            <h4 className="font-medium mb-1">{item.title}</h4>
            {item.description && (
              <p className="text-sm text-gray-600">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  days: number;
  showWeekDays?: boolean;
  activeDay?: number; // 0 = Monday, 1 = Tuesday, etc.
  className?: string;
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StreakBadge({ 
  days, 
  showWeekDays = false,
  activeDay,
  className 
}: StreakBadgeProps) {
  // If activeDay is not provided, use today's day (0 = Monday)
  const currentDay = activeDay !== undefined 
    ? activeDay 
    : (new Date().getDay() + 6) % 7; // Convert Sunday (0) to last day (6)

  return (
    <div className={cn(showWeekDays ? 'flex flex-col items-center gap-3' : 'inline-flex', className)}>
      {/* Streak badge */}
      <div className="inline-flex items-center gap-2 bg-white text-[#1a1a1a] px-4 py-2 rounded-full shadow-md">
        <Flame className="w-4 h-4 text-[#1a1a1a]" />
        <span className="text-xs font-medium uppercase tracking-wider">{days} ДНЕЙ ПОДРЯД</span>
      </div>

      {/* Week days indicator */}
      {showWeekDays && (
        <div className="flex items-center gap-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                'flex flex-col items-center gap-1',
                'transition-all duration-200'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                  'transition-all duration-200',
                  index === currentDay
                    ? 'bg-[#1a1a1a] text-white shadow-md scale-110'
                    : 'bg-[#f5f5f5] text-[#999999]'
                )}
              >
                {day.charAt(0)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

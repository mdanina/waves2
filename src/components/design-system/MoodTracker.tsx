import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface MoodTrackerProps {
  streak?: number;
  onMoodSelect?: (mood: string) => void;
  className?: string;
}

const moods = [
  { emoji: '😔', label: 'Fri', value: 'sad', selected: false },
  { emoji: '😐', label: 'Sat', value: 'neutral', selected: false },
  { emoji: '😊', label: 'Sun', value: 'good', selected: false },
  { emoji: '😴', label: 'Mon', value: 'tired', selected: false },
  { emoji: '😄', label: 'Tue', value: 'happy', selected: true },
];

export function MoodTracker({ streak = 7, onMoodSelect, className }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState('happy');

  const handleMoodClick = (value: string) => {
    setSelectedMood(value);
    onMoodSelect?.(value);
  };

  return (
    <div className={cn('bg-white rounded-[28px] p-6 shadow-sm', className)}>
      {/* Streak Header */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-[#F3B83A] text-xs">🔥</span>
        <span className="text-[10px] uppercase tracking-[0.1em] text-[#F3B83A] font-medium">
          {streak} Day Streak
        </span>
      </div>

      {/* Mood Selector */}
      <div className="flex items-center justify-between gap-2">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => handleMoodClick(mood.value)}
            className={cn(
              'flex flex-col items-center gap-2 transition-all duration-200',
              'hover:scale-105 active:scale-95'
            )}
          >
            <div
              className={cn(
                'w-[52px] h-[52px] rounded-full flex items-center justify-center text-2xl',
                'transition-all duration-200',
                selectedMood === mood.value
                  ? 'bg-[#1a1a1a] shadow-md'
                  : 'bg-[#f5f5f5] hover:bg-[#eeeeee]'
              )}
            >
              {mood.emoji}
            </div>
            <span
              className={cn(
                'text-[10px] font-medium transition-colors',
                selectedMood === mood.value ? 'text-[#1a1a1a]' : 'text-[#999999]'
              )}
            >
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

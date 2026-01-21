import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SliderLabel {
  value: number;
  label: string;
}

interface VerticalSliderProps {
  min?: number;
  max?: number;
  defaultValue?: number;
  labels?: SliderLabel[];
  color?: string;
  onChange?: (value: number) => void;
  className?: string;
}

export function VerticalSlider({
  min = 0,
  max = 10,
  defaultValue = 5,
  labels,
  color = '#F3B83A',
  onChange,
  className,
}: VerticalSliderProps) {
  const [value, setValue] = useState(defaultValue);
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={cn('flex items-center gap-6', className)}>
      {/* Labels */}
      {labels && (
        <div className="flex flex-col-reverse justify-between h-[300px] text-sm">
          {labels.map((label, index) => (
            <div
              key={index}
              className={cn(
                'transition-all duration-200',
                Math.abs(value - label.value) < 1.5 ? 'font-medium opacity-100' : 'opacity-50'
              )}
            >
              {label.label}
            </div>
          ))}
        </div>
      )}

      {/* Slider */}
      <div className="relative h-[300px] w-3">
        {/* Track */}
        <div className="absolute w-full h-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
          {/* Fill with gradient */}
          <div
            className="absolute bottom-0 w-full rounded-full transition-all duration-200"
            style={{
              height: `${percentage}%`,
              background: `linear-gradient(to top, ${color}, ${color}80)`,
              boxShadow: `0 0 20px ${color}30`,
            }}
          />
        </div>

        {/* Thumb with gradient and shadow */}
        <div
          className="absolute w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center pointer-events-none -ml-[18px]"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${color}ff, ${color}cc, ${color}99)`,
            bottom: `calc(${percentage}% - 24px)`,
            boxShadow: `0 6px 20px ${color}50, 0 2px 8px ${color}40, inset 0 1px 2px rgba(255,255,255,0.3)`,
          }}
        >
          <div className="w-3 h-3 bg-white/90 rounded-full shadow-sm" />
        </div>

        {/* Invisible input for interaction - rotated to vertical */}
        <input
          type="range"
          min={min}
          max={max}
          step={0.1}
          value={value}
          onChange={handleChange}
          orient="vertical"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
          style={{
            writingMode: 'bt-lr',
            WebkitAppearance: 'slider-vertical',
          }}
        />
      </div>

      {/* Value indicator */}
      <div className="flex items-center gap-1 text-sm opacity-60">
        <span>{value.toFixed(1)}</span>
      </div>
    </div>
  );
}
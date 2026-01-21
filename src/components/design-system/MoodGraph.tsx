import React from 'react';
import { cn } from '@/lib/utils';
import { DropdownSelector } from './DropdownSelector';

interface MoodGraphProps {
  title?: string;
  subtitle?: string;
  data?: Array<{ day: string; value: number }>;
  showDropdown?: boolean;
  dropdownOptions?: string[];
  defaultDropdownValue?: string;
  onDropdownChange?: (value: string) => void;
  className?: string;
}

const defaultData = [
  { day: 'M', value: 3.5 },
  { day: 'T', value: 3.0 },
  { day: 'W', value: 3.2 },
  { day: 'T', value: 3.7 },
  { day: 'F', value: 3.4 },
  { day: 'S', value: 3.8 },
  { day: 'S', value: 3.7 },
];

export function MoodGraph({ 
  title = '3.6 average mood',
  subtitle = 'You focus on health and you feel great',
  data = defaultData,
  showDropdown = false,
  dropdownOptions = ['Weeks', 'Months', 'Year'],
  defaultDropdownValue = 'Weeks',
  onDropdownChange,
  className 
}: MoodGraphProps) {
  // Create smooth wave path
  const width = 240;
  const height = 100;
  const padding = 20;
  const pointWidth = (width - padding * 2) / (data.length - 1);

  // Normalize values to fit in graph
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => ({
    x: padding + i * pointWidth,
    y: height - padding - ((d.value - minValue) / range) * (height - padding * 2),
  }));

  // Create smooth curve using quadratic bezier curves
  const pathD = points.reduce((path, point, i) => {
    if (i === 0) {
      return `M ${point.x} ${point.y}`;
    }
    const prevPoint = points[i - 1];
    const midX = (prevPoint.x + point.x) / 2;
    return `${path} Q ${prevPoint.x} ${prevPoint.y}, ${midX} ${(prevPoint.y + point.y) / 2} Q ${point.x} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  return (
    <div className={cn('bg-white rounded-[28px] p-6 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">😊</span>
          <div>
            <h3 className="text-sm font-medium text-[#1a1a1a]">{title}</h3>
            <p className="text-[10px] text-[#999999] mt-0.5">{subtitle}</p>
          </div>
        </div>
        {showDropdown && (
          <DropdownSelector
            options={dropdownOptions}
            defaultValue={defaultDropdownValue}
            onChange={onDropdownChange}
          />
        )}
      </div>

      {/* Graph */}
      <div className="relative">
        <svg width={width} height={height} className="w-full">
          {/* Grid lines */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#f0f0f0"
            strokeWidth="1"
          />
          
          {/* Wave path */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e4a5f0" />
              <stop offset="50%" stopColor="#c9a0e8" />
              <stop offset="100%" stopColor="#b89ed6" />
            </linearGradient>
          </defs>

          {/* Day labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={points[i].x}
              y={height - 5}
              textAnchor="middle"
              className="text-[10px] fill-[#999999]"
            >
              {d.day}
            </text>
          ))}
        </svg>
      </div>

      {/* Mood 3.7 label */}
      <div className="mt-3 text-right">
        <span className="text-xs text-[#999999]">Mood</span>
        <span className="text-xs text-[#1a1a1a] font-medium ml-1">3.7</span>
      </div>
    </div>
  );
}

import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { cn } from '@/lib/utils';

interface MoodChartProps {
  data: Array<{ day: string; mood: number }>;
  className?: string;
  color?: string;
}

export function MoodChart({ data, className, color = '#b8a0d6' }: MoodChartProps) {
  return (
    <div className={cn('w-full h-[200px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis hide domain={[0, 10]} />
          <Area
            type="monotone"
            dataKey="mood"
            stroke={color}
            strokeWidth={3}
            fill="url(#moodGradient)"
            dot={{ fill: color, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

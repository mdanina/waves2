import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  gradient?: 'blue' | 'pink' | 'coral' | 'lavender';
  icon?: React.ReactNode;
  className?: string;
}

const gradientClasses = {
  blue: 'bg-gradient-to-br from-[#6ab9e7] to-[#5aa8d8]',
  pink: 'bg-gradient-to-br from-[#ffb5d5] to-[#ff99c2]',
  coral: 'bg-gradient-to-br from-[#ff8a5b] to-[#ffc4a8]',
  lavender: 'bg-gradient-to-br from-[#e4a5f0] to-[#c9a0e8]',
};

export function StatCard({ label, value, unit, gradient = 'blue', icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-[28px] p-6 min-h-[160px] flex flex-col justify-between',
        'shadow-sm',
        gradientClasses[gradient],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-[#1a1a1a]/60 font-medium">{label}</p>
        {icon && <div className="opacity-50">{icon}</div>}
      </div>
      <div className="mt-auto">
        <div className="flex items-baseline gap-1">
          <span className="text-6xl font-light text-[#1a1a1a] tracking-tight">{value}</span>
          {unit && <span className="text-3xl font-light text-[#1a1a1a]/70">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
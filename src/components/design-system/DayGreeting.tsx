import React from 'react';
import { cn } from '@/lib/utils';

interface DayGreetingProps {
  greeting?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function DayGreeting({ 
  greeting = 'Good Evening', 
  title = 'New Day\nFresh Start!',
  subtitle,
  className 
}: DayGreetingProps) {
  const lines = title.split('\n');

  return (
    <div className={cn('text-center', className)}>
      {/* Greeting badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-6">
        <span className="text-sm">☀️</span>
        <span className="text-xs font-medium text-[#1a1a1a]">{greeting}</span>
      </div>

      {/* Main title with serif font */}
      <h1 className="mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        {lines.map((line, i) => (
          <div key={i} className="text-[40px] leading-[1.1] font-normal text-[#1a1a1a]">
            {line}
          </div>
        ))}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-[#999999] mt-2">{subtitle}</p>
      )}
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';

interface WellnessCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  gradient?: 'coral' | 'blue' | 'pink' | 'lavender';
  hover?: boolean;
}

const gradientClasses = {
  coral: 'bg-gradient-to-br from-[#ffd4c4] via-[#ffb299] to-[#ff8a65]',
  blue: 'bg-gradient-to-br from-[#E8F5FE] via-[#D4EDFC] to-[#C0E5FA]',
  pink: 'bg-gradient-to-br from-[#FFE8F0] via-[#FFD6E8] to-[#FFC4E0]',
  lavender: 'bg-[#F0E8F8]',
};

export function WellnessCard({ children, className, gradient, hover = false, ...props }: WellnessCardProps) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]',
        gradient ? gradientClasses[gradient] : 'bg-white',
        hover && 'transition-all duration-300 hover:shadow-[0_6px_30px_rgba(0,0,0,0.1)] hover:scale-[1.02]',
        className
      )}
    >
      {children}
    </div>
  );
}
import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface ActionCardProps {
  title: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export function ActionCard({ title, subtitle, onClick, className }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full bg-white rounded-[24px] px-6 py-4',
        'flex items-center justify-between',
        'shadow-sm border border-black/5',
        'transition-all duration-200',
        'hover:shadow-md hover:scale-[1.01] active:scale-[0.99]',
        className
      )}
    >
      <div className="text-left">
        <h3 className="text-[15px] font-medium text-[#1a1a1a]">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[#999999] mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="w-7 h-7 rounded-full bg-[#f5f5f5] flex items-center justify-center flex-shrink-0">
        <ArrowRight className="w-4 h-4 text-[#1a1a1a]" />
      </div>
    </button>
  );
}

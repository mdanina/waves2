import React from 'react';
import { cn } from '@/lib/utils';

interface InfoBadgeProps {
  icon?: React.ReactNode;
  text: string;
  className?: string;
}

export function InfoBadge({ icon, text, className }: InfoBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full',
        className
      )}
    >
      {icon && <span className="flex items-center opacity-70">{icon}</span>}
      <span className="text-sm opacity-70">{text}</span>
    </div>
  );
}

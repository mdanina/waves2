import React from 'react';
import { cn } from '@/lib/utils';

interface SerifHeadingProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xl' | '2xl' | '3xl' | '4xl';
  style?: React.CSSProperties;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const sizeClasses = {
  xl: 'text-3xl',
  '2xl': 'text-4xl',
  '3xl': 'text-5xl',
  '4xl': 'text-6xl',
};

export function SerifHeading({ 
  children, 
  className, 
  size = '2xl', 
  style,
  as: Component = 'h1'
}: SerifHeadingProps) {
  return (
    <Component
      className={cn(
        'font-serif font-medium leading-tight tracking-tight text-[#1a1a1a]',
        sizeClasses[size],
        className
      )}
      style={{ fontFamily: 'var(--font-serif)', ...style }}
    >
      {children}
    </Component>
  );
}

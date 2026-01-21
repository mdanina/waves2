import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  variant?: 'default' | 'white' | 'monochrome';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
  '2xl': 'w-32 h-32', // 128px - уменьшено в 2 раза
};

export function Logo({ size = 'md', className, variant = 'default' }: LogoProps) {
  // Используем файл логотипа из public
  const logoPath = '/logo.png';

  const variantClasses = {
    default: '',
    white: 'brightness-0 invert', // Инвертирует цвета для белого варианта
    monochrome: 'brightness-0', // Делает монохромным
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        className
      )}
    >
      <img 
        src={logoPath} 
        alt="Waves" 
        className={cn(
          sizeClasses[size],
          'object-contain max-w-full h-auto',
          variantClasses[variant]
        )} 
      />
    </div>
  );
}


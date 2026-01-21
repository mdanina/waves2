'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'coral' | 'yellow' | 'outline' | 'black' | 'gradientMesh' | 'gradientMeshPeach' | 'gradientMeshMint' | 'gradientMeshRose' | 'gradientMeshCoral' | 'gradientMeshOrange' | 'gradientMeshBlue';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]',
  secondary: 'bg-white text-[#1a1a1a] hover:bg-gray-50 shadow-[0_2px_10px_rgba(0,0,0,0.08)]',
  coral: 'bg-[#ff8a65] text-white hover:bg-[#ff9775]',
  yellow: 'bg-[#F3B83A] text-white hover:bg-[#FFD54F] shadow-md',
  outline: 'bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white',
  black: 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] shadow-sm',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

// Градиенты для gradient mesh кнопок
const gradientMeshStyles = {
  gradientMesh: {
    colors: ['#E8D5F2', '#D4C5F0', '#C9E4F5', '#C9E4F5', '#A8D4EB', '#FFD1DC', '#FFD1DC', '#FFC9DF', '#FFF4CC', '#FFF4CC', '#FFE5D9', '#E8D5F2'],
  },
  gradientMeshPeach: {
    colors: ['#FFD7BA', '#FFC9A3', '#FFB88C', '#FFB88C', '#FFA675', '#FFD7BA', '#FFD7BA', '#FFC9A3', '#FFB88C', '#FFB88C', '#FFA675', '#FFD7BA'],
  },
  gradientMeshMint: {
    colors: ['#D5F2E3', '#C2E8D4', '#C9E4F5', '#C9E4F5', '#B3D9F0', '#D5F2E3'],
  },
  gradientMeshRose: {
    colors: ['#FFD1DC', '#FFC2D1', '#FFF4CC', '#FFF4CC', '#FFE5D9', '#FFD1DC'],
  },
  gradientMeshCoral: {
    colors: ['#FFCBB3', '#FFE5D9', '#C9E4F5', '#C9E4F5', '#B3D9F0', '#FFCBB3'],
  },
  gradientMeshOrange: {
    colors: ['#FFE5D9', '#FFD7BA', '#FFCBB3', '#FFCBB3', '#FFB8A3', '#FFE5D9', '#FFE5D9', '#FFD7BA', '#FFCBB3', '#FFCBB3', '#FFB8A3', '#FFE5D9'],
  },
  gradientMeshBlue: {
    colors: ['#E8F5FE', '#D4EDFC', '#C0E5FA', '#A8D8EA', '#8BC9E0', '#E8F5FE', '#E8F5FE', '#D4EDFC', '#C0E5FA', '#A8D8EA', '#8BC9E0', '#E8F5FE'],
  },
};

export function PillButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  icon,
  ...props
}: PillButtonProps) {
  const isGradientMesh = variant.startsWith('gradientMesh');

  if (isGradientMesh) {
    const gradientConfig = gradientMeshStyles[variant as keyof typeof gradientMeshStyles];
    const colors = gradientConfig.colors;

    return (
      <motion.button
        onClick={onClick}
        className={cn(
          'rounded-full font-medium transition-all duration-200 flex items-center gap-2 justify-center relative',
          'text-white shadow-lg hover:shadow-xl',
          sizeClasses[size],
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {/* Анимированный градиентный фон */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            background: [
              `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
              `linear-gradient(135deg, ${colors[2]}, ${colors[3] || colors[0]}, ${colors[4] || colors[1]})`,
              `linear-gradient(135deg, ${colors[4] || colors[0]}, ${colors[5] || colors[1]}, ${colors[0]})`,
              `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Внутренний радиальный градиент для глубины */}
          <div
            className="absolute inset-0 rounded-full opacity-70"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${colors[1]}80, transparent 70%)`,
            }}
          />
        </motion.div>
        
        {/* Эффект свечения при наведении */}
        <motion.div
          className="absolute -inset-1 rounded-full opacity-0 blur-xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${colors[0]}, transparent 70%)`,
          }}
          whileHover={{ opacity: 0.4 }}
        />

        {/* Контент кнопки */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
          {icon && <span className="flex items-center">{icon}</span>}
        </span>
      </motion.button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full font-medium transition-all duration-200 flex items-center gap-2 justify-center',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
      {icon && <span className="flex items-center">{icon}</span>}
    </button>
  );
}
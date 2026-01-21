import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  gradient?: 'coral' | 'lavender' | 'blue' | 'pink';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

export function Avatar({ 
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  gradient = 'coral',
  status,
  className
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const gradients = {
    coral: 'from-[#ff8a65] to-[#ff6f4a]',
    lavender: 'from-[#b8a0d6] to-[#9b7ec4]',
    blue: 'from-[#a8d8ea] to-[#8bc9e0]',
    pink: 'from-[#ffb5c5] to-[#ff9fb3]',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-muted-foreground',
    busy: 'bg-red-500',
  };

  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <div className={cn(
        'rounded-full overflow-hidden flex items-center justify-center',
        'font-medium text-white',
        sizes[size],
        !src && `bg-gradient-to-br ${gradients[gradient]}`
      )}>
        {src ? (
          <img 
            src={src} 
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{fallback ? getInitials(fallback) : '?'}</span>
        )}
      </div>
      {status && (
        <div className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-white',
          statusSizes[size],
          statusColors[status]
        )} />
      )}
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ 
  variant = 'info',
  title,
  message,
  icon,
  onClose,
  className
}: AlertProps) {
  const styles = {
    info: {
      container: 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200',
      icon: 'text-blue-500',
      text: 'text-blue-900'
    },
    success: {
      container: 'bg-gradient-to-r from-green-50 to-green-100/50 border-green-200',
      icon: 'text-green-500',
      text: 'text-green-900'
    },
    warning: {
      container: 'bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-yellow-200',
      icon: 'text-yellow-500',
      text: 'text-yellow-900'
    },
    error: {
      container: 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-200',
      icon: 'text-red-500',
      text: 'text-red-900'
    }
  };

  const defaultIcons = {
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  const style = styles[variant];

  return (
    <div className={cn(
      'rounded-2xl border-2 p-4 backdrop-blur-sm',
      style.container,
      className
    )}>
      <div className="flex gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', style.icon)}>
          {icon || defaultIcons[variant]}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className={cn('font-medium mb-1', style.text)}>{title}</h4>
          )}
          <p className={cn('text-sm', style.text)}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={cn('flex-shrink-0 hover:opacity-70 transition-opacity', style.icon)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';

interface TopNavigationProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  title?: string | React.ReactNode;
  greeting?: string;
  showTime?: boolean;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  className?: string;
}

export function TopNavigation({
  leftIcon,
  rightIcon,
  title,
  greeting,
  showTime = false,
  onLeftClick,
  onRightClick,
  className,
}: TopNavigationProps) {
  const [currentTime, setCurrentTime] = React.useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  React.useEffect(() => {
    if (showTime) {
      const interval = setInterval(() => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showTime]);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Time row */}
      {showTime && (
        <div className="flex items-center justify-between px-6 py-2">
          <span className="text-sm font-medium text-[#1a1a1a]">{currentTime}</span>
        </div>
      )}
      
      {/* Navigation row */}
      <div className={cn('flex items-center justify-between px-6', showTime ? 'py-2' : 'py-4')}>
        <button
          onClick={onLeftClick}
          className="w-10 h-10 flex items-center justify-center text-[#1a1a1a] hover:bg-black/5 rounded-full transition-colors"
        >
          {leftIcon}
        </button>

        <div className="flex-1 flex justify-center">
          {greeting && (
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <span className="text-sm">☀️</span>
              <span className="text-sm font-medium">{greeting}</span>
            </div>
          )}
          {title && typeof title === 'string' ? (
            <span className="text-base font-medium">{title}</span>
          ) : (
            title
          )}
        </div>

        <button
          onClick={onRightClick}
          className="w-10 h-10 flex items-center justify-center text-[#1a1a1a] hover:bg-black/5 rounded-full transition-colors"
        >
          {rightIcon}
        </button>
      </div>
    </div>
  );
}

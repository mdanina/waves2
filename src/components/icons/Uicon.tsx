import React from 'react';
import { cn } from '@/lib/utils';

export type UiconStyle = 'rr' | 'br' | 'sr' | 'ss' | 'rs' | 'bs'; // Regular Rounded, Bold Rounded, Solid Rounded, Solid Straight, Regular Straight, Bold Straight

interface UiconProps {
  name: string;
  style?: UiconStyle;
  className?: string;
  size?: number | string;
}

// Mapping of lucide icon names to Uicons names
const iconNameMap: Record<string, string> = {
  'home': 'home',
  'target': 'target',
  'smartphone': 'smartphone',
  'credit-card': 'credit-card',
  'trending-up': 'arrow-trend-up',
  'help-circle': 'question',
  'log-out': 'exit',
  'sparkles': 'sparkles',
  'user-plus': 'user-plus',
  'users': 'users',
  'calendar': 'calendar',
  'clock': 'clock',
  'history': 'history',
  'message-square': 'message-square',
  'settings': 'settings',
  'tag': 'tag',
  'chevron-right': 'chevron-right',
  'chevron-left': 'chevron-left',
  'check': 'check',
  'x': 'x',
  'package': 'package',
  'envelope': 'envelope',
  'truck': 'car',
  'check-circle-2': 'check-circle',
  'check-circle': 'check-circle',
  'circle': 'circle',
  'chevron-down': 'chevron-down',
  'chevron-up': 'chevron-up',
  'external-link': 'external-link',
  'alert-circle': 'alert-circle',
  'box': 'box',
  'wifi': 'wifi',
  'pencil': 'pencil',
  'trash': 'trash',
  'trash-2': 'trash',
  'user': 'user',
  'play': 'play',
  'pause': 'pause',
  'stop': 'stop',
};

export function Uicon({ name, style = 'rr', className, size }: UiconProps) {
  const iconName = iconNameMap[name.toLowerCase()] || name.toLowerCase();
  const iconClass = `fi fi-${style}-${iconName}`;
  
  const styleProps: React.CSSProperties = {};
  if (size) {
    if (typeof size === 'number') {
      styleProps.fontSize = `${size}px`;
    } else {
      styleProps.fontSize = size;
    }
  }

  // Ensure the icon has display: inline-flex for proper sizing and centers properly
  return (
    <i 
      className={cn(iconClass, className, 'leading-none')} 
      style={{ ...styleProps, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle', lineHeight: 1 }}
      aria-hidden="true"
    />
  );
}

// Export commonly used icons as named components for convenience
export const UiconHome = (props: Omit<UiconProps, 'name'>) => <Uicon name="home" {...props} />;
export const UiconTarget = (props: Omit<UiconProps, 'name'>) => <Uicon name="target" {...props} />;
export const UiconSmartphone = (props: Omit<UiconProps, 'name'>) => <Uicon name="smartphone" {...props} />;
export const UiconCreditCard = (props: Omit<UiconProps, 'name'>) => <Uicon name="credit-card" {...props} />;
export const UiconTrendingUp = (props: Omit<UiconProps, 'name'>) => <Uicon name="trending-up" {...props} />;
export const UiconHelpCircle = (props: Omit<UiconProps, 'name'>) => <Uicon name="help-circle" {...props} />;
export const UiconLogOut = (props: Omit<UiconProps, 'name'>) => <Uicon name="log-out" {...props} />;
export const UiconCalendar = (props: Omit<UiconProps, 'name'>) => <Uicon name="calendar" {...props} />;
export const UiconClock = (props: Omit<UiconProps, 'name'>) => <Uicon name="clock" {...props} />;
export const UiconChevronRight = (props: Omit<UiconProps, 'name'>) => <Uicon name="chevron-right" {...props} />;
export const UiconChevronLeft = (props: Omit<UiconProps, 'name'>) => <Uicon name="chevron-left" {...props} />;

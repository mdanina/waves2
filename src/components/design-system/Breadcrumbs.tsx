import React from 'react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

export function Breadcrumbs({ 
  items, 
  separator,
  className 
}: BreadcrumbsProps) {
  const defaultSeparator = (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <span className="flex items-center">
              {separator || defaultSeparator}
            </span>
          )}
          {index === items.length - 1 ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-gray-500 hover:text-[#ff8a65] transition-colors"
            >
              {item.label}
            </button>
          ) : item.href ? (
            <a
              href={item.href}
              className="text-gray-500 hover:text-[#ff8a65] transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-500">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
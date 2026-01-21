import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  variant?: 'pills' | 'underline';
  className?: string;
}

export function Tabs({ 
  tabs, 
  defaultTab,
  variant = 'pills',
  className 
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation */}
      <div className={cn(
        'flex gap-2',
        variant === 'underline' ? 'border-b-2 border-gray-200' : ''
      )}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 transition-all duration-200',
              'font-medium text-sm',
              variant === 'pills' && 'rounded-full',
              variant === 'underline' && 'border-b-2 -mb-0.5',
              activeTab === tab.id
                ? variant === 'pills'
                  ? 'bg-gradient-to-r from-[#ff8a65] to-[#ff6f4a] text-white shadow-md'
                  : 'border-[#ff8a65] text-[#ff8a65]'
                : variant === 'pills'
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              'transition-opacity duration-200',
              activeTab === tab.id ? 'block' : 'hidden'
            )}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

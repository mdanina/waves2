import React from 'react';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: string;
  buttonText?: string;
  gradient?: 'peach' | 'lavender' | 'cream' | 'pink';
  onButtonClick?: () => void;
  className?: string;
}

const gradientClasses = {
  peach: 'bg-gradient-to-tr from-[#fef9f5] via-[#ffe8dc] to-[#ffb5a0]',
  lavender: 'bg-gradient-to-tr from-[#faf8fc] via-[#f0e8f8] to-[#d4b8e8]',
  cream: 'bg-gradient-to-tr from-[#fefcf8] via-[#fff5e8] to-[#ffe5c0]',
  pink: 'bg-gradient-to-tr from-[#fef8fb] via-[#ffe8f0] to-[#ffc0d8]',
};

export function QuestionCard({
  question,
  buttonText = 'Reflect',
  gradient = 'peach',
  onButtonClick,
  className,
}: QuestionCardProps) {
  return (
    <div
      className={cn(
        'rounded-[28px] p-8 flex flex-col justify-between min-h-[200px]',
        'shadow-sm',
        gradientClasses[gradient],
        className
      )}
    >
      <p className="text-[15px] leading-relaxed text-[#8b5a47] mb-6 font-normal">
        {question}
      </p>
      <button
        onClick={onButtonClick}
        className={cn(
          'self-start px-6 py-2.5 rounded-full bg-[#2a2a2a] text-white',
          'text-sm font-medium transition-all duration-200',
          'hover:bg-[#3a3a3a] hover:shadow-md active:scale-95',
          'shadow-sm'
        )}
      >
        {buttonText}
      </button>
    </div>
  );
}
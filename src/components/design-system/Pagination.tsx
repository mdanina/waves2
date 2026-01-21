import React from 'react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
  className?: string;
}

export function Pagination({ 
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
  className
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftSide = Math.max(1, currentPage - 1);
      const rightSide = Math.min(totalPages, currentPage + 1);
      
      if (leftSide > 2) pages.push(1, '...');
      else if (leftSide === 2) pages.push(1);
      
      for (let i = leftSide; i <= rightSide; i++) {
        pages.push(i);
      }
      
      if (rightSide < totalPages - 1) pages.push('...', totalPages);
      else if (rightSide === totalPages - 1) pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <nav className={cn('flex items-center gap-2', className)}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'px-3 py-2 rounded-xl font-medium text-sm transition-all duration-200',
          currentPage === 1
            ? 'text-muted-foreground cursor-not-allowed'
            : 'text-foreground hover:bg-cloud'
        )}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page Numbers */}
      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={cn(
            'min-w-[40px] h-10 rounded-xl font-medium text-sm transition-all duration-200',
            page === currentPage
              ? 'bg-gradient-to-r from-coral to-coral-light text-white shadow-md'
              : page === '...'
                ? 'cursor-default text-muted-foreground'
                : 'text-foreground hover:bg-cloud'
          )}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'px-3 py-2 rounded-xl font-medium text-sm transition-all duration-200',
          currentPage === totalPages
            ? 'text-muted-foreground cursor-not-allowed'
            : 'text-foreground hover:bg-cloud'
        )}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  describe('rendering', () => {
    it('should render a skeleton element', () => {
      render(<Skeleton data-testid="skeleton" />);

      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      render(<Skeleton data-testid="skeleton" />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton.tagName).toBe('DIV');
    });
  });

  describe('styling', () => {
    it('should have animate-pulse class', () => {
      render(<Skeleton data-testid="skeleton" />);

      expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse');
    });

    it('should have rounded-md class', () => {
      render(<Skeleton data-testid="skeleton" />);

      expect(screen.getByTestId('skeleton')).toHaveClass('rounded-md');
    });

    it('should have bg-muted class', () => {
      render(<Skeleton data-testid="skeleton" />);

      expect(screen.getByTestId('skeleton')).toHaveClass('bg-muted');
    });

    it('should support custom className', () => {
      render(<Skeleton className="custom-class" data-testid="skeleton" />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('custom-class');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should support width and height styles', () => {
      render(
        <Skeleton
          data-testid="skeleton"
          style={{ width: '100px', height: '20px' }}
        />
      );

      expect(screen.getByTestId('skeleton')).toHaveStyle({ width: '100px', height: '20px' });
    });
  });

  describe('HTML attributes', () => {
    it('should support data attributes', () => {
      render(<Skeleton data-custom="value" data-testid="skeleton" />);

      expect(screen.getByTestId('skeleton')).toHaveAttribute('data-custom', 'value');
    });

    it('should support aria attributes', () => {
      render(<Skeleton aria-label="Loading content" data-testid="skeleton" />);

      expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-label', 'Loading content');
    });
  });

  describe('children', () => {
    it('should render children', () => {
      render(
        <Skeleton data-testid="skeleton">
          <span>Child content</span>
        </Skeleton>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should work without children', () => {
      render(<Skeleton data-testid="skeleton" />);

      expect(screen.getByTestId('skeleton')).toBeEmptyDOMElement();
    });
  });
});

describe('Skeleton composition patterns', () => {
  it('should work as text placeholder', () => {
    render(<Skeleton className="h-4 w-full" data-testid="text-skeleton" />);

    const skeleton = screen.getByTestId('text-skeleton');
    expect(skeleton).toHaveClass('h-4');
    expect(skeleton).toHaveClass('w-full');
  });

  it('should work as avatar placeholder', () => {
    render(<Skeleton className="h-12 w-12 rounded-full" data-testid="avatar-skeleton" />);

    const skeleton = screen.getByTestId('avatar-skeleton');
    expect(skeleton).toHaveClass('rounded-full');
    expect(skeleton).toHaveClass('h-12');
    expect(skeleton).toHaveClass('w-12');
  });

  it('should work as card placeholder', () => {
    render(
      <div data-testid="card-skeleton" className="space-y-4 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );

    expect(screen.getByTestId('card-skeleton').children).toHaveLength(3);
  });
});

describe('Skeleton accessibility', () => {
  it('should be hidden from screen readers when used decoratively', () => {
    render(<Skeleton aria-hidden="true" data-testid="decorative-skeleton" />);

    expect(screen.getByTestId('decorative-skeleton')).toHaveAttribute('aria-hidden', 'true');
  });

  it('should support role attribute', () => {
    render(<Skeleton role="status" data-testid="status-skeleton" />);

    expect(screen.getByTestId('status-skeleton')).toHaveAttribute('role', 'status');
  });
});

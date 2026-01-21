import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ error }: { error?: Error }) => {
  if (error) {
    throw error;
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error for expected errors in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('normal rendering', () => {
    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should catch errors and show fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
    });

    it('should show error message text', () => {
      render(
        <ErrorBoundary>
          <ThrowError error={new Error('Test')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Произошла непредвиденная ошибка/)).toBeInTheDocument();
    });

    it('should show "Вернуться на главную" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError error={new Error('Test')} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Вернуться на главную/i })).toBeInTheDocument();
    });

    it('should show "Обновить страницу" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError error={new Error('Test')} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Обновить страницу/i })).toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError error={new Error('Test')} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    });

    it('should not render default UI when custom fallback is provided', () => {
      const customFallback = <div>Custom</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError error={new Error('Test')} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Что-то пошло не так')).not.toBeInTheDocument();
    });
  });

  describe('UI structure', () => {
    it('should have centered layout', () => {
      render(
        <ErrorBoundary>
          <ThrowError error={new Error('Test')} />
        </ErrorBoundary>
      );

      const container = screen.getByText('Что-то пошло не так').closest('div');
      expect(container).toHaveClass('text-center');
    });

    it('should have proper heading styling', () => {
      render(
        <ErrorBoundary>
          <ThrowError error={new Error('Test')} />
        </ErrorBoundary>
      );

      const heading = screen.getByText('Что-то пошло не так');
      expect(heading.tagName).toBe('H1');
      expect(heading).toHaveClass('text-2xl');
      expect(heading).toHaveClass('font-bold');
    });
  });

  describe('edge cases', () => {
    it('should handle error without message', () => {
      render(
        <ErrorBoundary>
          <ThrowError error={new Error()} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
    });

    it('should handle deeply nested errors', () => {
      render(
        <ErrorBoundary>
          <div>
            <div>
              <div>
                <ThrowError error={new Error('Nested')} />
              </div>
            </div>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
    });
  });
});

describe('ErrorBoundary component export', () => {
  it('should be a valid React component', () => {
    expect(ErrorBoundary).toBeDefined();
    expect(typeof ErrorBoundary).toBe('function');
  });
});

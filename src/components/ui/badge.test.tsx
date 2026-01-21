import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from './badge';

describe('Badge', () => {
  describe('rendering', () => {
    it('should render with children', () => {
      render(<Badge>New</Badge>);

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      render(<Badge data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge.tagName).toBe('DIV');
    });
  });

  describe('variants', () => {
    it('should apply default variant classes', () => {
      render(<Badge data-testid="badge">Default</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveClass('bg-primary');
      expect(badge).toHaveClass('text-primary-foreground');
    });

    it('should apply secondary variant classes', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveClass('bg-secondary');
      expect(badge).toHaveClass('text-secondary-foreground');
    });

    it('should apply destructive variant classes', () => {
      render(<Badge variant="destructive" data-testid="badge">Error</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveClass('bg-destructive');
      expect(badge).toHaveClass('text-destructive-foreground');
    });

    it('should apply outline variant classes', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveClass('text-foreground');
      // Should not have background color
      expect(badge).not.toHaveClass('bg-primary');
    });
  });

  describe('styling', () => {
    it('should have rounded-full class', () => {
      render(<Badge data-testid="badge">Pill</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveClass('rounded-full');
    });

    it('should have correct padding', () => {
      render(<Badge data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-0.5');
    });

    it('should have text-xs class', () => {
      render(<Badge data-testid="badge">Small text</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveClass('text-xs');
    });

    it('should have font-semibold class', () => {
      render(<Badge data-testid="badge">Bold</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveClass('font-semibold');
    });

    it('should have border class', () => {
      render(<Badge data-testid="badge">Border</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveClass('border');
    });
  });

  describe('custom className', () => {
    it('should merge custom className', () => {
      render(<Badge className="custom-class" data-testid="badge">Custom</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveClass('custom-class');
      // Should still have default classes
      expect(badge).toHaveClass('rounded-full');
    });

    it('should allow overriding default classes', () => {
      render(<Badge className="rounded-none" data-testid="badge">Square</Badge>);
      const badge = screen.getByTestId('badge');

      // tailwind-merge should handle conflicting classes
      expect(badge).toHaveClass('rounded-none');
    });
  });

  describe('badgeVariants', () => {
    it('should return correct classes for default', () => {
      const classes = badgeVariants();

      expect(classes).toContain('bg-primary');
      expect(classes).toContain('rounded-full');
    });

    it('should return correct classes for secondary variant', () => {
      const classes = badgeVariants({ variant: 'secondary' });

      expect(classes).toContain('bg-secondary');
    });

    it('should return correct classes for destructive variant', () => {
      const classes = badgeVariants({ variant: 'destructive' });

      expect(classes).toContain('bg-destructive');
    });

    it('should return correct classes for outline variant', () => {
      const classes = badgeVariants({ variant: 'outline' });

      expect(classes).toContain('text-foreground');
      expect(classes).not.toContain('bg-primary');
    });
  });

  describe('accessibility', () => {
    it('should support custom data attributes', () => {
      render(<Badge data-status="active" data-testid="badge">Active</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveAttribute('data-status', 'active');
    });

    it('should support role attribute', () => {
      render(<Badge role="status" data-testid="badge">Status</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should have focus ring styles', () => {
      render(<Badge data-testid="badge">Focus</Badge>);
      const badge = screen.getByTestId('badge');

      expect(badge).toHaveClass('focus:outline-none');
      expect(badge).toHaveClass('focus:ring-2');
    });
  });

  describe('use cases', () => {
    it('should work well for status indicators', () => {
      render(
        <div>
          <Badge variant="secondary">Draft</Badge>
          <Badge>Published</Badge>
          <Badge variant="destructive">Archived</Badge>
        </div>
      );

      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Archived')).toBeInTheDocument();
    });

    it('should work well for counts', () => {
      render(<Badge>5</Badge>);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should work well for labels', () => {
      render(<Badge variant="outline">Premium</Badge>);

      expect(screen.getByText('Premium')).toBeInTheDocument();
    });
  });
});

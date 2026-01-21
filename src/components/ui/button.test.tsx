import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from './button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
    });

    it('should render as button element by default', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');

      expect(button.tagName).toBe('BUTTON');
    });

    it('should forward ref correctly', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Test</Button>);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('variants', () => {
    it('should apply default variant classes', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-ink');
      expect(button).toHaveClass('text-white');
    });

    it('should apply secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('text-ink');
    });

    it('should apply honey variant classes', () => {
      render(<Button variant="honey">Honey</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-honey');
      expect(button).toHaveClass('text-ink');
    });

    it('should apply ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('text-ink');
    });

    it('should apply destructive variant classes', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-destructive');
    });

    it('should apply link variant classes', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('text-honey');
    });

    it('should apply outline variant classes', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('border');
    });
  });

  describe('sizes', () => {
    it('should apply default size classes', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('px-6');
    });

    it('should apply small size classes', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('text-sm');
    });

    it('should apply large size classes', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-12');
      expect(button).toHaveClass('px-8');
      expect(button).toHaveClass('text-lg');
    });

    it('should apply icon size classes', () => {
      render(<Button size="icon">+</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('w-11');
    });
  });

  describe('states', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');

      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should handle click events', () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', () => {
      const onClick = vi.fn();
      render(
        <Button onClick={onClick} disabled>
          Click
        </Button>,
      );

      fireEvent.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('asChild', () => {
    it('should render as Slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>,
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('custom className', () => {
    it('should merge custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('custom-class');
      // Should still have default classes
      expect(button).toHaveClass('bg-ink');
    });
  });

  describe('buttonVariants', () => {
    it('should return correct classes for default', () => {
      const classes = buttonVariants();
      expect(classes).toContain('bg-ink');
      expect(classes).toContain('h-11');
    });

    it('should return correct classes for specific variant and size', () => {
      const classes = buttonVariants({ variant: 'secondary', size: 'sm' });
      expect(classes).toContain('bg-white');
      expect(classes).toContain('h-9');
    });
  });

  describe('accessibility', () => {
    it('should have focus-visible styles', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('should support custom type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should support aria attributes', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-label', 'Close dialog');
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  describe('rendering', () => {
    it('should render input element', () => {
      render(<Input />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should forward ref correctly', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text..." />);

      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
    });
  });

  describe('types', () => {
    it('should render text input by default', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');

      // Input without type behaves as text, but may not have explicit type attribute
      expect(input.tagName).toBe('INPUT');
    });

    it('should render email input', () => {
      render(<Input type="email" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render tel input', () => {
      render(<Input type="tel" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render search input', () => {
      render(<Input type="search" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('type', 'search');
    });
  });

  describe('styling', () => {
    it('should have rounded-full class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveClass('rounded-full');
    });

    it('should have correct height', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveClass('h-11');
    });

    it('should have full width', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveClass('w-full');
    });

    it('should have white background', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveClass('bg-white');
    });

    it('should have border', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveClass('border');
      expect(input).toHaveClass('border-input');
    });
  });

  describe('states', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('should support readOnly', () => {
      render(<Input readOnly data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('readOnly');
    });

    it('should support required', () => {
      render(<Input required data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toBeRequired();
    });
  });

  describe('events', () => {
    it('should handle onChange', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Input onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(onChange).toHaveBeenCalled();
    });

    it('should handle onFocus', () => {
      const onFocus = vi.fn();
      render(<Input onFocus={onFocus} data-testid="input" />);

      fireEvent.focus(screen.getByTestId('input'));

      expect(onFocus).toHaveBeenCalled();
    });

    it('should handle onBlur', () => {
      const onBlur = vi.fn();
      render(<Input onBlur={onBlur} data-testid="input" />);

      const input = screen.getByTestId('input');
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(onBlur).toHaveBeenCalled();
    });

    it('should handle onKeyDown', () => {
      const onKeyDown = vi.fn();
      render(<Input onKeyDown={onKeyDown} data-testid="input" />);

      fireEvent.keyDown(screen.getByTestId('input'), { key: 'Enter' });

      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe('value handling', () => {
    it('should support controlled value', () => {
      render(<Input value="controlled" onChange={() => {}} data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveValue('controlled');
    });

    it('should support defaultValue', () => {
      render(<Input defaultValue="default" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveValue('default');
    });
  });

  describe('custom className', () => {
    it('should merge custom className', () => {
      render(<Input className="custom-class" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveClass('custom-class');
      // Should still have default classes
      expect(input).toHaveClass('rounded-full');
    });
  });

  describe('accessibility', () => {
    it('should support aria-label', () => {
      render(<Input aria-label="Username" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('aria-label', 'Username');
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="helper" data-testid="input" />
          <span id="helper">Helper text</span>
        </>,
      );
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('aria-describedby', 'helper');
    });

    it('should support aria-invalid', () => {
      render(<Input aria-invalid="true" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have focus-visible styles', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveClass('focus-visible:outline-none');
      expect(input).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('file input', () => {
    it('should render file input', () => {
      render(<Input type="file" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('type', 'file');
    });

    it('should have file-specific styles', () => {
      render(<Input type="file" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveClass('file:border-0');
      expect(input).toHaveClass('file:bg-transparent');
    });
  });

  describe('input attributes', () => {
    it('should support min and max for number input', () => {
      render(<Input type="number" min="0" max="100" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('should support pattern attribute', () => {
      render(<Input pattern="[0-9]+" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('pattern', '[0-9]+');
    });

    it('should support maxLength', () => {
      render(<Input maxLength={10} data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should support autoComplete', () => {
      render(<Input autoComplete="email" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('autoComplete', 'email');
    });

    it('should support name attribute', () => {
      render(<Input name="username" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('name', 'username');
    });

    it('should support id attribute', () => {
      render(<Input id="user-input" data-testid="input" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('id', 'user-input');
    });
  });
});

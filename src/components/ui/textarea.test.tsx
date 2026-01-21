import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './textarea';

describe('Textarea', () => {
  describe('rendering', () => {
    it('should render textarea element', () => {
      render(<Textarea />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render as textarea tag', () => {
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should forward ref correctly', () => {
      const ref = vi.fn();
      render(<Textarea ref={ref} />);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('should render with placeholder', () => {
      render(<Textarea placeholder="Enter description..." />);

      expect(screen.getByPlaceholderText('Enter description...')).toBeInTheDocument();
    });
  });

  describe('value handling', () => {
    it('should support controlled value', () => {
      render(<Textarea value="test content" onChange={() => {}} data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveValue('test content');
    });

    it('should support defaultValue', () => {
      render(<Textarea defaultValue="default content" data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveValue('default content');
    });

    it('should handle onChange', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Textarea onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'hello');

      expect(onChange).toHaveBeenCalled();
    });

    it('should handle multiline input', async () => {
      const user = userEvent.setup();
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea');
      await user.type(textarea, 'line 1{enter}line 2');

      expect(textarea).toHaveValue('line 1\nline 2');
    });
  });

  describe('states', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Textarea disabled data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toBeDisabled();
    });

    it('should support readOnly', () => {
      render(<Textarea readOnly data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveAttribute('readOnly');
    });

    it('should support required', () => {
      render(<Textarea required data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toBeRequired();
    });
  });

  describe('styling', () => {
    it('should have min-height class', () => {
      render(<Textarea data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveClass('min-h-[80px]');
    });

    it('should have border', () => {
      render(<Textarea data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveClass('border');
    });

    it('should have rounded corners', () => {
      render(<Textarea data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveClass('rounded-md');
    });

    it('should have full width', () => {
      render(<Textarea data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveClass('w-full');
    });

    it('should support custom className', () => {
      render(<Textarea className="custom-class" data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveClass('custom-class');
    });
  });

  describe('events', () => {
    it('should handle onFocus', () => {
      const onFocus = vi.fn();
      render(<Textarea onFocus={onFocus} data-testid="textarea" />);

      fireEvent.focus(screen.getByTestId('textarea'));

      expect(onFocus).toHaveBeenCalled();
    });

    it('should handle onBlur', () => {
      const onBlur = vi.fn();
      render(<Textarea onBlur={onBlur} data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea');
      fireEvent.focus(textarea);
      fireEvent.blur(textarea);

      expect(onBlur).toHaveBeenCalled();
    });

    it('should handle onKeyDown', () => {
      const onKeyDown = vi.fn();
      render(<Textarea onKeyDown={onKeyDown} data-testid="textarea" />);

      fireEvent.keyDown(screen.getByTestId('textarea'), { key: 'Enter' });

      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe('attributes', () => {
    it('should support rows attribute', () => {
      render(<Textarea rows={5} data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '5');
    });

    it('should support maxLength', () => {
      render(<Textarea maxLength={500} data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveAttribute('maxLength', '500');
    });

    it('should support name attribute', () => {
      render(<Textarea name="description" data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveAttribute('name', 'description');
    });

    it('should support id attribute', () => {
      render(<Textarea id="bio-input" data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveAttribute('id', 'bio-input');
    });
  });

  describe('accessibility', () => {
    it('should support aria-label', () => {
      render(<Textarea aria-label="Enter your bio" data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveAttribute('aria-label', 'Enter your bio');
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Textarea aria-describedby="helper" data-testid="textarea" />
          <span id="helper">Maximum 500 characters</span>
        </>
      );

      expect(screen.getByTestId('textarea')).toHaveAttribute('aria-describedby', 'helper');
    });

    it('should support aria-invalid', () => {
      render(<Textarea aria-invalid="true" data-testid="textarea" />);

      expect(screen.getByTestId('textarea')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have focus-visible styles', () => {
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('focus-visible:outline-none');
      expect(textarea).toHaveClass('focus-visible:ring-2');
    });

    it('should have disabled styles', () => {
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('disabled:cursor-not-allowed');
      expect(textarea).toHaveClass('disabled:opacity-50');
    });
  });

  describe('resize behavior', () => {
    it('should allow vertical resize by default', () => {
      render(<Textarea data-testid="textarea" />);

      // Textarea should not have resize-none by default
      const textarea = screen.getByTestId('textarea');
      expect(textarea).not.toHaveClass('resize-none');
    });
  });
});

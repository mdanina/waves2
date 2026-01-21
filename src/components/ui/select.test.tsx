import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from './select';

// Note: Radix UI Select has issues with jsdom's lack of pointer capture support.
// These tests focus on static rendering and initial state.

describe('Select', () => {
  describe('rendering', () => {
    it('should render select trigger', () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('should show placeholder', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Выберите вариант" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText('Выберите вариант')).toBeInTheDocument();
    });

    it('should not show content initially', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Hidden Option</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.queryByText('Hidden Option')).not.toBeInTheDocument();
    });
  });

  describe('SelectTrigger', () => {
    it('should have combobox role', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should have base styling classes', () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('flex');
      expect(trigger).toHaveClass('h-10');
      expect(trigger).toHaveClass('w-full');
      expect(trigger).toHaveClass('rounded-md');
      expect(trigger).toHaveClass('border');
    });

    it('should support custom className', () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger" data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger');
    });

    it('should support disabled state', () => {
      render(
        <Select disabled>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Disabled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId('trigger')).toBeDisabled();
    });
  });

  describe('controlled mode', () => {
    it('should show selected value', () => {
      render(
        <Select defaultValue="selected">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="selected">Selected Value</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByRole('combobox')).toHaveTextContent('Selected Value');
    });

    it('should work with controlled value', () => {
      render(
        <Select value="controlled">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="controlled">Controlled Value</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByRole('combobox')).toHaveTextContent('Controlled Value');
    });
  });

  describe('accessibility', () => {
    it('should have aria-expanded attribute', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have aria-autocomplete attribute', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-autocomplete', 'none');
    });
  });

  describe('in Russian context', () => {
    it('should display Russian placeholder', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Выберите регион" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="moscow">Москва</SelectItem>
            <SelectItem value="spb">Санкт-Петербург</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText('Выберите регион')).toBeInTheDocument();
    });

    it('should display selected Russian value', () => {
      render(
        <Select value="parent">
          <SelectTrigger>
            <SelectValue placeholder="Тип отношения" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="parent">Родитель</SelectItem>
            <SelectItem value="child">Ребёнок</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByRole('combobox')).toHaveTextContent('Родитель');
    });
  });
});

describe('SelectLabel styling', () => {
  it('should have correct display name', () => {
    expect(SelectLabel.displayName).toBeDefined();
  });
});

describe('SelectSeparator styling', () => {
  it('should have correct display name', () => {
    expect(SelectSeparator.displayName).toBeDefined();
  });
});

describe('SelectGroup', () => {
  it('should be exported', () => {
    expect(SelectGroup).toBeDefined();
  });
});

describe('Select displayNames', () => {
  it('should have displayName for SelectTrigger', () => {
    expect(SelectTrigger.displayName).toBeDefined();
  });

  it('should have displayName for SelectContent', () => {
    expect(SelectContent.displayName).toBeDefined();
  });

  it('should have displayName for SelectItem', () => {
    expect(SelectItem.displayName).toBeDefined();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert', () => {
  describe('rendering', () => {
    it('should render alert element', () => {
      render(<Alert data-testid="alert" />);
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });

    it('should have role="alert"', () => {
      render(<Alert />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(<Alert>Alert content</Alert>);
      expect(screen.getByText('Alert content')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should apply default variant styles', () => {
      render(<Alert data-testid="alert" />);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('bg-background');
      expect(alert).toHaveClass('text-foreground');
    });

    it('should apply destructive variant styles', () => {
      render(<Alert variant="destructive" data-testid="alert" />);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('text-destructive');
    });
  });

  describe('styling', () => {
    it('should have base styles', () => {
      render(<Alert data-testid="alert" />);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('rounded-lg');
      expect(alert).toHaveClass('border');
      expect(alert).toHaveClass('p-4');
    });

    it('should support custom className', () => {
      render(<Alert className="custom-class" data-testid="alert" />);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('custom-class');
      expect(alert).toHaveClass('rounded-lg');
    });
  });
});

describe('AlertTitle', () => {
  describe('rendering', () => {
    it('should render title element', () => {
      render(<AlertTitle data-testid="alert-title">Title</AlertTitle>);
      expect(screen.getByTestId('alert-title')).toBeInTheDocument();
    });

    it('should render as h5 element', () => {
      render(<AlertTitle data-testid="alert-title">Title</AlertTitle>);
      expect(screen.getByTestId('alert-title').tagName).toBe('H5');
    });

    it('should render title text', () => {
      render(<AlertTitle>Alert Title</AlertTitle>);
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have font-medium class', () => {
      render(<AlertTitle data-testid="alert-title">Title</AlertTitle>);
      expect(screen.getByTestId('alert-title')).toHaveClass('font-medium');
    });

    it('should have mb-1 class', () => {
      render(<AlertTitle data-testid="alert-title">Title</AlertTitle>);
      expect(screen.getByTestId('alert-title')).toHaveClass('mb-1');
    });

    it('should support custom className', () => {
      render(
        <AlertTitle className="custom-title" data-testid="alert-title">
          Title
        </AlertTitle>
      );
      expect(screen.getByTestId('alert-title')).toHaveClass('custom-title');
    });
  });
});

describe('AlertDescription', () => {
  describe('rendering', () => {
    it('should render description element', () => {
      render(<AlertDescription data-testid="alert-desc">Description</AlertDescription>);
      expect(screen.getByTestId('alert-desc')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      render(<AlertDescription data-testid="alert-desc">Description</AlertDescription>);
      expect(screen.getByTestId('alert-desc').tagName).toBe('DIV');
    });

    it('should render description text', () => {
      render(<AlertDescription>Alert description text</AlertDescription>);
      expect(screen.getByText('Alert description text')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have text-sm class', () => {
      render(<AlertDescription data-testid="alert-desc">Desc</AlertDescription>);
      expect(screen.getByTestId('alert-desc')).toHaveClass('text-sm');
    });

    it('should support custom className', () => {
      render(
        <AlertDescription className="custom-desc" data-testid="alert-desc">
          Desc
        </AlertDescription>
      );
      expect(screen.getByTestId('alert-desc')).toHaveClass('custom-desc');
    });
  });
});

describe('Alert composition', () => {
  it('should render complete alert with title and description', () => {
    render(
      <Alert data-testid="alert">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>This is a warning message.</AlertDescription>
      </Alert>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('This is a warning message.')).toBeInTheDocument();
  });

  it('should render destructive alert for errors', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('text-destructive');
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should render alert with only description', () => {
    render(
      <Alert>
        <AlertDescription>Simple message</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Simple message')).toBeInTheDocument();
  });

  it('should render alert with only title', () => {
    render(
      <Alert>
        <AlertTitle>Notice</AlertTitle>
      </Alert>
    );

    expect(screen.getByText('Notice')).toBeInTheDocument();
  });
});

describe('Alert accessibility', () => {
  it('should have proper alert role for screen readers', () => {
    render(
      <Alert>
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>Please read this message.</AlertDescription>
      </Alert>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should support aria-label', () => {
    render(<Alert aria-label="Error notification" data-testid="alert" />);
    expect(screen.getByTestId('alert')).toHaveAttribute('aria-label', 'Error notification');
  });

  it('should support aria-describedby', () => {
    render(
      <>
        <Alert aria-describedby="desc" data-testid="alert" />
        <span id="desc">Description for screen readers</span>
      </>
    );
    expect(screen.getByTestId('alert')).toHaveAttribute('aria-describedby', 'desc');
  });
});

describe('Alert with icons', () => {
  it('should render alert with icon', () => {
    render(
      <Alert data-testid="alert">
        <svg data-testid="icon" />
        <AlertTitle>Info</AlertTitle>
      </Alert>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('should have proper styles for icon positioning', () => {
    render(<Alert data-testid="alert" />);
    const alert = screen.getByTestId('alert');
    // Alert has styles for icon positioning
    expect(alert.className).toContain('[&>svg');
  });
});

describe('Alert in Russian context', () => {
  it('should render with Russian text', () => {
    render(
      <Alert>
        <AlertTitle>Внимание</AlertTitle>
        <AlertDescription>Пожалуйста, проверьте данные.</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Внимание')).toBeInTheDocument();
    expect(screen.getByText('Пожалуйста, проверьте данные.')).toBeInTheDocument();
  });

  it('should render error alert with Russian text', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>Произошла ошибка при сохранении.</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Ошибка')).toBeInTheDocument();
    expect(screen.getByText('Произошла ошибка при сохранении.')).toBeInTheDocument();
  });
});

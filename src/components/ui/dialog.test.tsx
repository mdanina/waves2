import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog';

describe('Dialog', () => {
  describe('rendering', () => {
    it('should render trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger data-testid="trigger">Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('should not render content initially', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Hidden content</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });

    it('should render content when open', () => {
      render(
        <Dialog defaultOpen>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Visible Title</DialogTitle>
            <DialogDescription>Visible content</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Visible Title')).toBeInTheDocument();
      expect(screen.getByText('Visible content')).toBeInTheDocument();
    });
  });

  describe('open/close behavior', () => {
    it('should open dialog on trigger click', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog opened</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      fireEvent.click(screen.getByText('Open Dialog'));
      expect(screen.getByText('Dialog opened')).toBeInTheDocument();
    });

    it('should have close button', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Close button should be present (with sr-only "Close" text)
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  describe('controlled mode', () => {
    it('should work with controlled open state', () => {
      const { rerender } = render(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Controlled</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByText('Controlled')).not.toBeInTheDocument();

      rerender(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Controlled</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Controlled')).toBeInTheDocument();
    });

    it('should call onOpenChange when closing', () => {
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Click close button
      fireEvent.click(screen.getByText('Close'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe('DialogHeader', () => {
  it('should render header element', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader data-testid="header">
            <DialogTitle>Header Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should have flex layout', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader data-testid="header">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('header')).toHaveClass('flex');
    expect(screen.getByTestId('header')).toHaveClass('flex-col');
  });

  it('should support custom className', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader className="custom-header" data-testid="header">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('header')).toHaveClass('custom-header');
  });
});

describe('DialogFooter', () => {
  it('should render footer element', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter data-testid="footer">
            <button>Cancel</button>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render footer buttons', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter>
            <button>Отмена</button>
            <button>Подтвердить</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Отмена')).toBeInTheDocument();
    expect(screen.getByText('Подтвердить')).toBeInTheDocument();
  });

  it('should have responsive layout classes', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter data-testid="footer">Buttons</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('flex-col-reverse');
    expect(footer).toHaveClass('sm:flex-row');
  });
});

describe('DialogTitle', () => {
  it('should render title text', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>My Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('My Dialog Title')).toBeInTheDocument();
  });

  it('should have proper heading styles', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle data-testid="title">Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const title = screen.getByTestId('title');
    expect(title).toHaveClass('text-lg');
    expect(title).toHaveClass('font-semibold');
  });

  it('should support custom className', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle className="custom-title" data-testid="title">
            Title
          </DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('title')).toHaveClass('custom-title');
  });
});

describe('DialogDescription', () => {
  it('should render description text', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>This is the dialog description.</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('This is the dialog description.')).toBeInTheDocument();
  });

  it('should have muted text style', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription data-testid="desc">Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const desc = screen.getByTestId('desc');
    expect(desc).toHaveClass('text-sm');
    expect(desc).toHaveClass('text-muted-foreground');
  });
});

describe('DialogContent', () => {
  it('should render dialog content', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent data-testid="content">
          <DialogTitle>Content Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('should support custom className', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent className="custom-content" data-testid="content">
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('content')).toHaveClass('custom-content');
  });

  it('should have base styling classes', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent data-testid="content">
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByTestId('content');
    expect(content).toHaveClass('fixed');
    expect(content).toHaveClass('border');
    expect(content).toHaveClass('bg-background');
  });
});

describe('Dialog accessibility', () => {
  it('should have proper dialog role', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Accessible Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should have aria-labelledby pointing to title', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('should have aria-describedby when description is present', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description text</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('close button should have accessible name', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // sr-only text "Close" provides accessible name
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});

describe('Dialog in Russian context', () => {
  it('should render Russian dialog content', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите продолжить?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button>Отмена</button>
            <button>Да, продолжить</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Подтверждение')).toBeInTheDocument();
    expect(screen.getByText('Вы уверены, что хотите продолжить?')).toBeInTheDocument();
    expect(screen.getByText('Отмена')).toBeInTheDocument();
    expect(screen.getByText('Да, продолжить')).toBeInTheDocument();
  });
});

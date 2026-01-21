import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

describe('Card', () => {
  describe('rendering', () => {
    it('should render card with children', () => {
      render(<Card>Card content</Card>);

      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');

      expect(card.tagName).toBe('DIV');
    });

    it('should forward ref correctly', () => {
      const ref = vi.fn();
      render(<Card ref={ref}>Test</Card>);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('styling', () => {
    it('should have rounded border', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('rounded-xl');
    });

    it('should have border', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('border');
    });

    it('should have background', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('bg-card');
    });

    it('should have shadow', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('shadow-soft');
    });
  });

  describe('custom className', () => {
    it('should merge custom className', () => {
      render(<Card className="custom-class" data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-xl');
    });
  });
});

describe('CardHeader', () => {
  it('should render children', () => {
    render(<CardHeader>Header content</CardHeader>);

    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('should have padding', () => {
    render(<CardHeader data-testid="header">Test</CardHeader>);
    const header = screen.getByTestId('header');

    expect(header).toHaveClass('p-6');
  });

  it('should have flex column layout', () => {
    render(<CardHeader data-testid="header">Test</CardHeader>);
    const header = screen.getByTestId('header');

    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('flex-col');
  });

  it('should have vertical spacing', () => {
    render(<CardHeader data-testid="header">Test</CardHeader>);
    const header = screen.getByTestId('header');

    expect(header).toHaveClass('space-y-1.5');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<CardHeader ref={ref}>Test</CardHeader>);

    expect(ref).toHaveBeenCalled();
  });
});

describe('CardTitle', () => {
  it('should render as h3 element', () => {
    render(<CardTitle>Title</CardTitle>);

    const title = screen.getByText('Title');
    expect(title.tagName).toBe('H3');
  });

  it('should have text styling', () => {
    render(<CardTitle data-testid="title">Test</CardTitle>);
    const title = screen.getByTestId('title');

    expect(title).toHaveClass('text-2xl');
    expect(title).toHaveClass('font-semibold');
  });

  it('should have tracking-tight', () => {
    render(<CardTitle data-testid="title">Test</CardTitle>);
    const title = screen.getByTestId('title');

    expect(title).toHaveClass('tracking-tight');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<CardTitle ref={ref}>Test</CardTitle>);

    expect(ref).toHaveBeenCalled();
  });
});

describe('CardDescription', () => {
  it('should render as p element', () => {
    render(<CardDescription>Description</CardDescription>);

    const desc = screen.getByText('Description');
    expect(desc.tagName).toBe('P');
  });

  it('should have muted text color', () => {
    render(<CardDescription data-testid="desc">Test</CardDescription>);
    const desc = screen.getByTestId('desc');

    expect(desc).toHaveClass('text-muted-foreground');
  });

  it('should have small text size', () => {
    render(<CardDescription data-testid="desc">Test</CardDescription>);
    const desc = screen.getByTestId('desc');

    expect(desc).toHaveClass('text-sm');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<CardDescription ref={ref}>Test</CardDescription>);

    expect(ref).toHaveBeenCalled();
  });
});

describe('CardContent', () => {
  it('should render children', () => {
    render(<CardContent>Content here</CardContent>);

    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('should have horizontal padding', () => {
    render(<CardContent data-testid="content">Test</CardContent>);
    const content = screen.getByTestId('content');

    expect(content).toHaveClass('p-6');
  });

  it('should have no top padding', () => {
    render(<CardContent data-testid="content">Test</CardContent>);
    const content = screen.getByTestId('content');

    expect(content).toHaveClass('pt-0');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<CardContent ref={ref}>Test</CardContent>);

    expect(ref).toHaveBeenCalled();
  });
});

describe('CardFooter', () => {
  it('should render children', () => {
    render(<CardFooter>Footer content</CardFooter>);

    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('should be flex container', () => {
    render(<CardFooter data-testid="footer">Test</CardFooter>);
    const footer = screen.getByTestId('footer');

    expect(footer).toHaveClass('flex');
  });

  it('should align items center', () => {
    render(<CardFooter data-testid="footer">Test</CardFooter>);
    const footer = screen.getByTestId('footer');

    expect(footer).toHaveClass('items-center');
  });

  it('should have padding', () => {
    render(<CardFooter data-testid="footer">Test</CardFooter>);
    const footer = screen.getByTestId('footer');

    expect(footer).toHaveClass('p-6');
    expect(footer).toHaveClass('pt-0');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<CardFooter ref={ref}>Test</CardFooter>);

    expect(ref).toHaveBeenCalled();
  });
});

describe('Card composition', () => {
  it('should render complete card with all parts', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main content of the card</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>,
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description text')).toBeInTheDocument();
    expect(screen.getByText('Main content of the card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('should work without header', () => {
    render(
      <Card>
        <CardContent>Content only</CardContent>
      </Card>,
    );

    expect(screen.getByText('Content only')).toBeInTheDocument();
  });

  it('should work without footer', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>,
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('accessibility', () => {
  it('should support role attribute', () => {
    render(<Card role="article" data-testid="card">Article</Card>);

    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('should support aria-label', () => {
    render(<Card aria-label="User profile card" data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');

    expect(card).toHaveAttribute('aria-label', 'User profile card');
  });
});

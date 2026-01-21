// Error Boundary для обработки ошибок React компонентов
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send to Sentry if configured (async, don't block)
    import('@/lib/sentry').then(({ captureException }) => {
      captureException(error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      }).catch(() => {
        // Silently fail if Sentry is not installed
      });
    }).catch(() => {
      // Silently fail if Sentry module can't be loaded
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Перенаправление на соответствующую главную страницу в зависимости от текущего раздела
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      window.location.href = '/admin/dashboard';
    } else if (path.startsWith('/specialist')) {
      window.location.href = '/specialist/dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Что-то пошло не так</h1>
            <p className="text-muted-foreground">
              Произошла непредвиденная ошибка. Попробуйте обновить страницу.
            </p>
            {this.state.error && import.meta.env.DEV && (
              <details className="text-xs text-left bg-muted p-4 rounded overflow-auto max-h-60">
                <summary className="cursor-pointer font-semibold mb-2">Детали ошибки (dev)</summary>
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleReset} variant="default">
                Вернуться на главную
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Обновить страницу
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}











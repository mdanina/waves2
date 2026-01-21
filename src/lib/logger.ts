// Система логирования для проекта
// Отключает логи в production, но всегда показывает ошибки

const isDev = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

interface LogLevel {
  log: 'log';
  info: 'info';
  warn: 'warn';
  error: 'error';
}

class Logger {
  private shouldLog(level: keyof LogLevel): boolean {
    if (level === 'error') return true; // Всегда логируем ошибки
    return isDev && !isTest;
  }

  log(...args: unknown[]): void {
    if (this.shouldLog('log')) {
      console.log('[LOG]', ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: unknown[]): void {
    console.error('[ERROR]', ...args);
    
    // Send critical errors to Sentry in production (async, don't block)
    if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD) {
      // Only send Error objects to Sentry
      const errorArg = args.find(arg => arg instanceof Error);
      if (errorArg instanceof Error) {
        import('./sentry').then(({ captureException }) => {
          captureException(errorArg, {
            logger: 'logger.ts',
            additionalArgs: args.filter(arg => !(arg instanceof Error)),
          }).catch(() => {
            // Silently fail if Sentry is not installed
          });
        }).catch(() => {
          // Silently fail if Sentry module can't be loaded
        });
      }
    }
  }
}

export const logger = new Logger();











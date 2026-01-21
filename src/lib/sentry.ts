/**
 * Sentry configuration and initialization
 * Only initializes in production environment
 * 
 * Note: Sentry is optional - if @sentry/react is not installed, functions will be no-ops
 * 
 * To enable Sentry:
 * 1. Install: npm install @sentry/react
 * 2. Add VITE_SENTRY_DSN to your .env.production
 * 3. Restart the dev server
 */

// Stub implementations - will be replaced with real Sentry if package is installed
// This prevents Vite from trying to resolve @sentry/react at build time

let sentryInitialized = false;

/**
 * Initialize Sentry (no-op if package not installed)
 */
export async function initSentry() {
  // Only try to load Sentry if DSN is configured
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  // Try to dynamically load Sentry at runtime
  try {
    // Use string concatenation to prevent Vite from statically analyzing
    const sentryPackage = '@' + 'sentry' + '/' + 'react';
    const Sentry = await import(/* @vite-ignore */ sentryPackage);
    
    const environment = import.meta.env.MODE || 'development';
    const isProduction = import.meta.env.PROD;

    if (!isProduction) {
      const enableInDev = import.meta.env.VITE_SENTRY_ENABLE_IN_DEV === 'true';
      if (!enableInDev) {
        return;
      }
    }

    Sentry.init({
      dsn,
      environment,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event, hint) {
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            if (
              error.message.includes('chrome-extension://') ||
              error.message.includes('moz-extension://') ||
              error.message.includes('safari-extension://')
            ) {
              return null;
            }
          }
        }
        return event;
      },
    });
    
    sentryInitialized = true;
  } catch (error) {
    // Sentry package not installed - that's fine
    if (import.meta.env.PROD) {
      console.warn('[Sentry] Package not installed. Error tracking disabled.');
    }
  }
}

/**
 * Set user context for Sentry (no-op if not installed)
 */
export async function setSentryUser(user: { id: string; email?: string; name?: string } | null) {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  
  try {
    const sentryPackage = '@' + 'sentry' + '/' + 'react';
    const Sentry = await import(/* @vite-ignore */ sentryPackage);
    Sentry.setUser(user ? { id: user.id, email: user.email, username: user.name } : null);
  } catch {
    // Sentry not installed - ignore
  }
}

/**
 * Manually capture an exception (no-op if not installed)
 */
export async function captureException(error: Error, context?: Record<string, any>) {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  
  try {
    const sentryPackage = '@' + 'sentry' + '/' + 'react';
    const Sentry = await import(/* @vite-ignore */ sentryPackage);
    Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
    });
  } catch {
    // Sentry not installed - ignore
  }
}

/**
 * Capture a message (no-op if not installed)
 */
export async function captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' | 'log' = 'info') {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  
  try {
    const sentryPackage = '@' + 'sentry' + '/' + 'react';
    const Sentry = await import(/* @vite-ignore */ sentryPackage);
    Sentry.captureMessage(message, level);
  } catch {
    // Sentry not installed - ignore
  }
}

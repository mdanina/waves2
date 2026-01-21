/**
 * PWA Install Hook
 * Allows PWA install prompt on all devices
 */

import { useEffect } from 'react';

/**
 * Hook to control PWA install prompt
 * Currently allows the default browser behavior on all devices
 */
export function usePWAInstallControl() {
  useEffect(() => {
    // Let the browser handle the install prompt naturally
    // No custom logic needed - browser will show prompt when appropriate
  }, []);
}

/**
 * Component that controls PWA install behavior
 * Add this to your App tree to control when install prompt appears
 */
export function PWAInstallController(): null {
  usePWAInstallControl();
  return null;
}

export default usePWAInstallControl;

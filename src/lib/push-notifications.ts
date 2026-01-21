/**
 * PWA Push Notifications Library
 *
 * Handles Service Worker registration, push subscription management,
 * and integration with Supabase backend.
 */

import { supabase } from '@/lib/supabase';

// VAPID public key - must match the one in queue-worker
// This should be set via environment variable
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Check if push notifications are supported in this browser
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check if we're running as an installed PWA (standalone mode)
 */
export function isRunningAsPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Check if iOS device
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Check if iOS version supports web push (16.4+)
 */
export function isIOSPushSupported(): boolean {
  if (!isIOS()) return true; // Not iOS, assume supported

  // Try to detect iOS version
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    // iOS 16.4 and later support web push
    return major > 16 || (major === 16 && minor >= 4);
  }

  // If can't detect, assume modern browser
  return true;
}

/**
 * Register Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration.scope);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Get existing Service Worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  // Check if already granted
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Convert URL-safe base64 to Uint8Array (for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID public key not configured');
    return null;
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    console.error('No Service Worker registration');
    return null;
  }

  try {
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('Existing push subscription found');
      return subscription;
    }

    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log('Push subscription created:', subscription.endpoint);

    // Save subscription to backend
    await saveSubscriptionToBackend(subscription);

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return false;
  }

  try {
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return true; // Already unsubscribed
    }

    // Unsubscribe from browser
    await subscription.unsubscribe();

    // Remove from backend
    await removeSubscriptionFromBackend(subscription.endpoint);

    console.log('Push subscription removed');
    return true;
  } catch (error) {
    console.error('Push unsubscribe failed:', error);
    return false;
  }
}

/**
 * Check if currently subscribed to push
 */
export async function isSubscribedToPush(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return false;
  }

  try {
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * Get device info for subscription
 */
function getDeviceInfo(): { userAgent: string; deviceType: string; browser: string } {
  const ua = navigator.userAgent;

  // Detect device type
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    deviceType = /iPad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }

  // Detect browser
  let browser = 'other';
  if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) {
    browser = 'chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'safari';
  } else if (/Firefox/i.test(ua)) {
    browser = 'firefox';
  } else if (/Edge|Edg/i.test(ua)) {
    browser = 'edge';
  }

  return {
    userAgent: ua.substring(0, 500), // Limit length
    deviceType,
    browser,
  };
}

/**
 * Save push subscription to Supabase
 */
async function saveSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON();

  if (!json.keys) {
    throw new Error('Subscription has no keys');
  }

  const deviceInfo = getDeviceInfo();

  const { error } = await supabase.rpc('register_push_subscription', {
    p_endpoint: json.endpoint!,
    p_p256dh: json.keys.p256dh,
    p_auth: json.keys.auth,
    p_user_agent: deviceInfo.userAgent,
    p_device_type: deviceInfo.deviceType,
    p_browser: deviceInfo.browser,
  });

  if (error) {
    console.error('Failed to save push subscription:', error);
    throw error;
  }

  console.log('Push subscription saved to backend');
}

/**
 * Remove push subscription from Supabase
 */
async function removeSubscriptionFromBackend(endpoint: string): Promise<void> {
  const { error } = await supabase.rpc('unregister_push_subscription', {
    p_endpoint: endpoint,
  });

  if (error) {
    console.error('Failed to remove push subscription:', error);
    // Don't throw - subscription is already removed from browser
  }
}

/**
 * Full push notification setup flow
 * Returns: 'granted' | 'denied' | 'unsupported' | 'ios-not-pwa' | 'error'
 */
export async function setupPushNotifications(): Promise<
  'granted' | 'denied' | 'unsupported' | 'ios-not-pwa' | 'no-vapid' | 'error'
> {
  // Check basic support
  if (!isPushSupported()) {
    return 'unsupported';
  }

  // Check VAPID key
  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID public key not configured');
    return 'no-vapid';
  }

  // iOS specific checks
  if (isIOS()) {
    if (!isIOSPushSupported()) {
      return 'unsupported'; // iOS version too old
    }

    if (!isRunningAsPWA()) {
      return 'ios-not-pwa'; // Need to install PWA first
    }
  }

  try {
    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return 'error';
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return 'denied';
    }

    // Subscribe to push
    const subscription = await subscribeToPush();
    if (!subscription) {
      return 'error';
    }

    return 'granted';
  } catch (error) {
    console.error('Push setup error:', error);
    return 'error';
  }
}

/**
 * Initialize push notifications on app start
 * Only registers SW and checks existing subscription, doesn't prompt user
 */
export async function initializePushNotifications(): Promise<void> {
  if (!isPushSupported()) {
    return;
  }

  try {
    // Register service worker
    await registerServiceWorker();

    // If already subscribed, refresh the subscription in backend
    const isSubscribed = await isSubscribedToPush();
    if (isSubscribed && Notification.permission === 'granted') {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        // Refresh subscription in backend (in case keys changed)
        await saveSubscriptionToBackend(subscription);
      }
    }
  } catch (error) {
    console.error('Push initialization error:', error);
  }
}

/**
 * Waves Service Worker
 * Minimal implementation focused on Push Notifications
 * No aggressive caching to avoid update issues
 */

const SW_VERSION = '1.2.0';

// Install event - activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + SW_VERSION);
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v' + SW_VERSION);
  event.waitUntil(
    // Take control of all clients immediately
    self.clients.claim()
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'Waves',
    body: 'У вас новое уведомление',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'waves-notification',
    data: {}
  };

  // Try to parse push data
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload,
        data: payload.data || {}
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      // Use text as body if JSON parsing fails
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    tag: data.tag || 'waves-notification',
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    // iOS requires these for proper display
    silent: false,
    renotify: data.renotify || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);

  // Close the notification
  event.notification.close();

  // Get the action and data
  const action = event.action;
  const data = event.notification.data || {};

  // Determine the URL to open
  let urlToOpen = '/';

  if (data.url) {
    urlToOpen = data.url;
  } else if (data.video_room_url && data.urgent) {
    // Urgent: "вас ждут в комнате" - открыть видеокомнату напрямую
    urlToOpen = data.video_room_url;
  } else if (data.type) {
    // Route based on notification type
    switch (data.type) {
      // === Уведомления для специалистов ===
      case 'new_appointment':
      case 'cancelled_appointment':
      case 'appointment_reminder':
        urlToOpen = data.appointmentId
          ? `/specialist/appointments?id=${data.appointmentId}`
          : '/specialist/calendar';
        break;
      case 'new_client':
        urlToOpen = '/specialist/clients';
        break;

      // === Уведомления для клиентов ===
      case 'specialist_assigned':
        urlToOpen = '/cabinet';
        break;
      case 'session_reminder_36h':
      case 'session_reminder_1h':
        urlToOpen = data.video_room_url || '/cabinet';
        break;
      case 'first_session_memo':
        urlToOpen = data.memo_url || '/first-session-guide';
        break;
      case 'specialist_waiting':
        // Специалист ждёт - открыть видеокомнату
        urlToOpen = data.video_room_url || '/cabinet';
        break;
      case 'payment_success':
        urlToOpen = '/cabinet';
        break;
      case 'marketing':
        urlToOpen = data.target_url || '/';
        break;

      // === Общее для всех ===
      case 'new_message':
        // Определяем куда вести - в ЛК специалиста или клиента
        if (data.is_support) {
          urlToOpen = '/cabinet/messages';
        } else {
          urlToOpen = data.conversationId
            ? `/messages?conversation=${data.conversationId}`
            : '/messages';
        }
        break;

      default:
        urlToOpen = '/';
    }
  }

  // Handle action buttons if clicked
  if (action === 'view') {
    // Default behavior - open the URL
  } else if (action === 'dismiss') {
    // Just close the notification (already done above)
    return;
  }

  event.waitUntil(
    // Try to focus existing window or open new one
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window to focus
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.navigate(urlToOpen).then(() => client.focus());
          }
        }
        // No existing window, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event - track dismissed notifications
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  // Could send analytics here if needed
});

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

// Push subscription change event - handle subscription updates
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');

  event.waitUntil(
    // Re-subscribe and update the server
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      // The applicationServerKey will be provided by the app
    }).then((subscription) => {
      // Send new subscription to server
      return fetch('/api/push/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldEndpoint: event.oldSubscription ? event.oldSubscription.endpoint : null,
          newSubscription: subscription.toJSON()
        })
      });
    }).catch((error) => {
      console.error('[SW] Failed to re-subscribe:', error);
    })
  );
});

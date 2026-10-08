// STREAKO Purchase List - Service Worker
// Enables background push notifications and offline caching.

const CACHE_NAME = 'streako-purchase-v1';
const OFFLINE_URLS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  return self.clients.claim();
});

// Handle notification tap → open Purchase List page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || '/purchase-list';
  const itemId = data.itemId || null;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'PURCHASE_REMINDER_TAP', itemId, url });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle push messages from server (Web Push)
self.addEventListener('push', (event) => {
  let payload = { title: 'STREAKO Reminder', body: 'You have a pending purchase.', itemId: null };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch (e) { /* ignore parse error */ }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'streako-purchase-' + (payload.itemId || Date.now()),
      data: { url: '/purchase-list', itemId: payload.itemId }
    })
  );
});

// Background sync: check pending reminders
self.addEventListener('sync', (event) => {
  if (event.tag === 'streako-purchase-check') {
    event.waitUntil(checkPendingReminders());
  }
});

async function checkPendingReminders() {
  try {
    const allClients = await clients.matchAll({ includeUncontrolled: true });
    allClients.forEach((client) =>
      client.postMessage({ type: 'PURCHASE_CHECK_REMINDERS' })
    );
  } catch (e) { /* ignore */ }
}

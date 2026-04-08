const CACHE_NAME = 'ultragol-live-v8';
const urlsToCache = [
  '/',
  '/styles.css',
  '/favicon.png',
  '/ultragol-logo.png'
];

// URLs que NUNCA deben cachearse (siempre actualización en tiempo real)
const NO_CACHE_URLS = [
  'app.js',
  'index.html',
  'goleadores.html',
  'noticias.html',
  'marcadores',
  'transmisiones',
  'ultragol-api'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})))
          .catch(err => {
            console.log('Cache addAll error:', err);
          });
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Si es una URL que NO debe cachearse, siempre ir a la red
  if (NO_CACHE_URLS.some(noCache => url.includes(noCache))) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Para el resto, usar estrategia de cache primero
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Si falla, servir la página de juego offline
          if (event.request.mode === 'navigate' || event.request.destination === 'document') {
            return caches.match('/offline-fallback.html') 
              || new Response('Loading offline game...', { status: 200 });
          }
          return caches.match(event.request, { ignoreSearch: true });
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Handle incoming push messages
self.addEventListener('push', (event) => {
  let data = { title: 'UltraGol ⚽', body: 'Nueva actualización disponible' };
  try {
    if (event.data) data = event.data.json();
  } catch (_) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body || data.mensaje || '',
    icon: data.icon || data.icono || '/app-icon.png',
    badge: '/favicon.png',
    tag: data.tag || `ug-${Date.now()}`,
    data: { url: data.url || '/' },
    vibrate: [150, 80, 150],
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || data.titulo || 'UltraGol ⚽', options)
  );
});

// Handle notification click — open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if found
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

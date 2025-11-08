const CACHE_NAME = 'ultragol-live-v2';
const urlsToCache = [
  '/ULTRA/',
  '/ULTRA/styles.css',
  '/ULTRA/trending-box.css',
  '/ULTRA/pwa-install-banner.css',
  '/ULTRA/favicon.png',
  '/ULTRA/ultragol-logo.png'
];

// URLs que NUNCA deben cachearse (siempre actualización en tiempo real)
const NO_CACHE_URLS = [
  '/ULTRA/app.js',
  '/ULTRA/index.html',
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

const CACHE_NAME = 'ultragol-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/animations.css',
  '/css/firebase-features.css',
  '/css/cookie-banner.css',
  '/css/app-download-banner.css',
  '/css/professional-hero.css',
  '/css/gemini-chat.css',
  '/css/live-scoreboard.css',
  '/css/pwa-install-banner.css',
  '/js/main.js',
  '/js/firebase-config.js',
  '/js/firebase-auth.js',
  '/js/gemini-chat.js',
  '/js/pwa-install.js',
  '/favicon.png'
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

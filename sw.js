// IMPORTANTE: Cambiar la versión cada vez que hagas actualizaciones
const CACHE_NAME = 'ultragol-v5-sw-timeout-fix-20251109';

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
  '/css/notifications.css',
  '/js/main.js',
  '/js/firebase-config.js',
  '/js/firebase-auth.js',
  '/js/gemini-chat.js',
  '/js/pwa-install.js',
  '/js/notifications.js',
  '/favicon.png',
  '/app-icon.png',
  '/manifest.json'
];

// Instala y cachea los archivos
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando versión:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Todos los archivos cacheados correctamente');
        return self.skipWaiting(); // Activa el nuevo SW inmediatamente
      })
      .catch(err => {
        console.error('[Service Worker] Error al cachear archivos:', err);
      })
  );
});

// Activa y elimina la caché vieja
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando nueva versión:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Caché actualizada correctamente');
      return self.clients.claim(); // Toma control de todas las páginas inmediatamente
    })
  );
});

// Intercepta peticiones y sirve desde caché o red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Devuelve desde caché
          return response;
        }
        
        // Si no está en caché, busca en la red
        return fetch(event.request).then(networkResponse => {
          // Si la respuesta es válida, la cachea
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(err => {
          console.log('[Service Worker] Error de red:', err);
          // Intenta devolver desde caché como fallback
          return caches.match(event.request);
        });
      })
  );
});

// Maneja clicks en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click received:', event.notification.tag);
  
  event.notification.close();
  
  // Obtiene la URL del data de la notificación
  const relativeUrl = event.notification.data?.url || '/';
  
  // Normaliza a URL absoluta para comparación
  const absoluteUrl = new URL(relativeUrl, self.location.origin).href;
  
  console.log('[Service Worker] Opening URL:', absoluteUrl);
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Si ya hay una ventana abierta con esta URL, enfócala
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        console.log('[Service Worker] Checking client:', client.url);
        if (client.url === absoluteUrl && 'focus' in client) {
          console.log('[Service Worker] Focusing existing window');
          return client.focus();
        }
      }
      
      // Si hay alguna ventana del sitio abierta, enfócala y navégala
      if (clientList.length > 0 && 'focus' in clientList[0]) {
        console.log('[Service Worker] Focusing existing window and navigating');
        return clientList[0].focus().then(client => {
          if ('navigate' in client) {
            return client.navigate(absoluteUrl);
          }
          return client;
        });
      }
      
      // Si no hay ventana abierta, abre una nueva
      if (clients.openWindow) {
        console.log('[Service Worker] Opening new window');
        return clients.openWindow(absoluteUrl);
      }
    })
  );
});

const CACHE_NAME = 'ventas-app-v2'; // cambia esto en cada deploy si quieres forzar actualización

const urlsToCache = [
  '/',
  '/index.html',
  '/ventas-app.jsx',
  '/manifest.json',
  '/icon-192.png'
];

// Instalar
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activar y limpiar cachés viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: network first (clave para que NO se quede vieja)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // opcional: actualizar cache
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

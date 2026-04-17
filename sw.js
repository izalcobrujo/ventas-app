const CACHE_NAME = 'ventas-app-v4';
const urlsToCache = ['./', './index.html', './manifest.json', './icon-192.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of urlsToCache) {
        try {
          const response = await fetch(url, { cache: 'no-store' });
          if (response.ok) await cache.put(url, response.clone());
        } catch (err) { console.warn('Error cacheando:', url); }
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => { if (key !== CACHE_NAME) return caches.delete(key); }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

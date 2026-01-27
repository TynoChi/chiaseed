const CACHE_NAME = 'quiz-app-v2.3.5';
const ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/ui.js',
  './assets/js/api.js',
  './assets/js/engine.js',
  './assets/js/auth.js',
  './assets/js/config.js',
  './assets/js/utils.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force immediate activation
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS);
      })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip caching for API requests and non-GET methods
  if (url.hostname.includes('fayempire.com') || event.request.method !== 'GET') {
    return; // Let the browser handle these normally
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Update cache with new version if it's a valid internal request
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(err => {
            console.error('Fetch failed:', err);
            return cachedResponse; // Fallback to cache on error
          });

        // Return cached version immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

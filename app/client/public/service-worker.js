// Service Worker for Meditation Center Attendance PWA

const CACHE_NAME = 'attendance-app-v2-no-cache';
const urlsToCache = [
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Install the service worker and cache only static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Intercept fetch requests - NO CACHING for API calls and dynamic content
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Don't cache API requests or dynamic content
  if (url.pathname.startsWith('/api/') || 
      url.pathname.includes('dashboard') || 
      url.pathname.includes('attendance') ||
      event.request.method !== 'GET') {
    // Always fetch from network for API calls and dynamic content
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Only cache static assets like icons and manifest
  if (urlsToCache.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  } else {
    // For all other requests, always fetch from network
    event.respondWith(fetch(event.request));
  }
}); 
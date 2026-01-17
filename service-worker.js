// Simple service worker: cache-first for app shell
const CACHE_NAME = 'radar-neon-v1';
const FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev) => {
  // Serve from cache, fallback to network
  ev.respondWith(
    caches.match(ev.request).then(r => r || fetch(ev.request).catch(() => {
      // fallback: could return an offline page if provided
      return caches.match('./index.html');
    }))
  );
});
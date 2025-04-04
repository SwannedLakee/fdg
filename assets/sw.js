const CACHE_NAME = 'pwa-fdg-v1';
const urlsToCache = [
    '/assets/js/paliLookup.js',
    '/assets/js/autopali.js',
    '/ru/index.php',
    '/index.php',
    '/assets/img/icon-192x192.png',
    '/assets/img/icon-512x512.png',
        '/read/index.html',
            '/r/index.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});
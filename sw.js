// Finance Tracker — Service Worker
const CACHE = 'finance-v1';
const ASSETS = ['./finance-app.html', './manifest.json'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // Network-first for Google APIs (always need fresh data)
    if (e.request.url.includes('googleapis.com') || e.request.url.includes('accounts.google.com')) {
        return; // pass through
    }
    // Cache-first for app shell
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});

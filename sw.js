// Finance Tracker — Service Worker
const CACHE = 'finance-v7';
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
    // Pass Google API calls straight through (always need fresh data, never cached)
    if (e.request.url.includes('googleapis.com') || e.request.url.includes('accounts.google.com')) {
        return;
    }
    // Network-first for the app shell: always try to fetch the latest finance-app.html
    // (or manifest.json) first, and only fall back to the cached copy if the network
    // request fails (offline). This means app updates show up on next reload without
    // needing to remember to bump CACHE every time finance-app.html changes — the old
    // cache-first strategy silently kept serving a stale page until CACHE was bumped.
    e.respondWith(
        fetch(e.request).then(res => {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
            return res;
        }).catch(() => caches.match(e.request))
    );
});

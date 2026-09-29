// Finance Tracker — Service Worker
const CACHE = 'finance-v8';
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

// Chart.js is a pinned, versioned file — it never changes, so keep a copy and
// serve it from the phone instead of re-downloading it on every open.
const CHART_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';

// How long to wait for the network before showing the saved copy of the app.
// On a weak signal a fetch can hang for a long time before failing outright.
const SHELL_TIMEOUT_MS = 2500;

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    if (e.request.url === CHART_URL) {
        e.respondWith(caches.open(CACHE).then(c =>
            c.match(e.request).then(hit => hit || fetch(e.request).then(res => {
                if (res.ok || res.type === 'opaque') c.put(e.request, res.clone());
                return res;
            }))
        ));
        return;
    }

    // Only ever handle the app's own files. Everything else cross-origin goes
    // straight to the network, untouched and uncached — above all the Apps Script
    // calls to script.google.com. Each of those carries a unique cache-busting
    // timestamp, so caching them only grew the phone's storage without limit.
    let sameOrigin = false;
    try { sameOrigin = new URL(e.request.url).origin === self.location.origin; } catch (_) {}
    if (!sameOrigin) return;

    // Network-first for the app shell, so updates show up on the next open
    // without bumping CACHE — but only for SHELL_TIMEOUT_MS. If the network is
    // slower than that, show the saved copy now and let the download finish in
    // the background to refresh the cache for next time.
    e.respondWith((async () => {
        const cache   = await caches.open(CACHE);
        const network = fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
        });
        const cached = await cache.match(e.request);
        if (!cached) return network;           // first visit — nothing saved yet
        const timeout = new Promise(res => setTimeout(() => res(null), SHELL_TIMEOUT_MS));
        const winner  = await Promise.race([network.catch(() => null), timeout]);
        if (winner) return winner;
        e.waitUntil(network.catch(() => {}));  // keep updating the cache in the background
        return cached;
    })());
});

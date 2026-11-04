const CACHE_NAME = 'stempelkarte-v2'

const STATIC_ASSETS = ['/manifest.json', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)))
    self.skipWaiting()
})

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    )
    self.clients.claim()
})

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url)

    // Nur GET und nur http(s) — fixt den chrome-extension Fehler
    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) return

    // API: nie cachen
    if (url.pathname.startsWith('/api/')) return

    // HTML/Navigation: IMMER Netzwerk zuerst — fixt das Stale-Bundle-Problem
    if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')))
        return
    }

    // Assets (haben Vite-Hashes im Namen): Cache first
    event.respondWith(
        caches.match(event.request).then(cached =>
                cached || fetch(event.request).then(response => {
                    if (response.ok) {
                        const clone = response.clone()
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
                    }
                    return response
                })
        )
    )
})
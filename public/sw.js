const CACHE_NAME = 'three-glasses-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(event.request)
        cache.put(event.request, response.clone())
        return response
      } catch {
        const cached = await cache.match(event.request)
        if (cached) return cached
        throw new Error('Offline and no cached response for ' + event.request.url)
      }
    }),
  )
})

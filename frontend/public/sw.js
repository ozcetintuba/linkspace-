// Linkspace Progressive Web App (PWA) Service Worker
const CACHE_NAME = 'linkspace-v1.0.0'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
]

// Kurulum (Install) Aşaması - Çekirdek Varlıkları Önbelleğe Al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// Etkinleştirme (Activate) Aşaması - Eski Sürümleri Temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// İstekleri Yakalama (Fetch) Stratejisi
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // Sadece HTTP/HTTPS GET isteklerini işle
  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  // 1. API İstekleri: Network-First (Canlı veri öncelikli, bağlantı yoksa hata toleransı)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Çevrimdışısınız (Offline)' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )
    return
  }

  // 2. Sayfa Navigasyonu (SPA): Network-First, offline ise önbellekteki /index.html'i sun
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html')
      })
    )
    return
  }

  // 3. Statik Varlıklar (JS, CSS, Font, Görseller): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return networkResponse
      }).catch(() => {
        // Çevrimdışı fallback
        return cachedResponse
      })

      return cachedResponse || fetchPromise
    })
  )
})


// Linkspace Progressive Web App (PWA) Service Worker - Offline-First & Background Sync
const CACHE_NAME = 'linkspace-static-v1.1.0'
const API_CACHE_NAME = 'linkspace-api-cache-v1'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
]

// Kurulum (Install) - Statik Varlıkları Önbelleğe Al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// Etkinleştirme (Activate) - Eski Sürümleri Temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== API_CACHE_NAME) {
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

  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  // 1. API İstekleri: Network-First with Cache Fallback (Profil, Linkler, Ayarlar)
  if (url.pathname.startsWith('/api/profile') || url.pathname.startsWith('/api/settings')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(() => {
          // Ağ koptuğunda (metro, tünel, uçak) önbellekteki son veriyi sun
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              const headers = new Headers(cachedResponse.headers)
              headers.set('X-Linkspace-Offline', 'true')
              return cachedResponse.blob().then((blob) => {
                return new Response(blob, {
                  status: 200,
                  statusText: 'OK (Offline Cache)',
                  headers
                })
              })
            }
            // Hiç önbellek yoksa nazik hata JSON'ı
            return new Response(
              JSON.stringify({ 
                error: 'Çevrimdışısınız (Offline)',
                offline: true,
                message: 'İnternet bağlantısı algılanamadı. Bağlantınız kurulduğunda profil otomatik tazelenecektir.' 
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'X-Linkspace-Offline': 'true' }
              }
            )
          })
        })
    )
    return
  }

  // Diğer Genel API'lar
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Çevrimdışısınız (Offline)', offline: true }), {
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
        return cachedResponse
      })

      return cachedResponse || fetchPromise
    })
  )
})

// 4. Background Sync: Çevrimdışı Tıklama Kuyruğunu Senkronize Etme
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-link-clicks') {
    event.waitUntil(notifyClientsToFlushClicks())
  }
})

// İstemcilere (sayfaya) çevrimdışı tıklamaları fırlatmasını bildir
const notifyClientsToFlushClicks = async () => {
  const clients = await self.clients.matchAll({ type: 'window' })
  for (const client of clients) {
    client.postMessage({ type: 'FLUSH_OFFLINE_CLICKS' })
  }
}

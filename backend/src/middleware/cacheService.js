import crypto from 'crypto'

/**
 * ⚡ Yüksek Hızlı Bellek İçi Önbellek & ETag / TTL Servisi
 * linkspace - In-Memory Caching & Conditional HTTP 304 Not Modified Engine
 */

class CacheService {
  constructor() {
    this.store = new Map()
    this.totalHits = 0
    this.totalMisses = 0

    // Periyodik önbellek temizleyici (Her 30 saniyede bir süresi biten anahtarları süpürür)
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store.entries()) {
        if (now >= entry.expiresAt) {
          this.store.delete(key)
        }
      }
    }, 30000)

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }

  /**
   * JSON veya string veri için hafif ve hızlı ETag hash'i üretir
   */
  generateETag(content) {
    const str = typeof content === 'string' ? content : JSON.stringify(content)
    const hash = crypto.createHash('sha1').update(str).digest('hex').slice(0, 16)
    return `W/"${hash}"`
  }

  /**
   * Express Middleware'i: GET rotaları için TTL ve ETag kontrolü sağlar
   * @param {number} ttlSeconds - Önbellek geçerlilik süresi (varsayılan: 60 saniye)
   * @param {function} keyGenerator - Özel önbellek anahtar üreticisi (opsiyonel)
   */
  middleware(ttlSeconds = 60, keyGenerator = null) {
    return (req, res, next) => {
      // Yalnızca GET istekleri önbelleğe alınır
      if (req.method !== 'GET') {
        return next()
      }

      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `${req.baseUrl || ''}${req.path || req.url}`

      const now = Date.now()
      const cached = this.store.get(cacheKey)

      // 1. Önbellekte geçerli bir kayıt var mı? (CACHE HIT)
      if (cached && now < cached.expiresAt) {
        this.totalHits++
        cached.hitCount = (cached.hitCount || 0) + 1

        const clientETag = req.headers['if-none-match']

        // İstemcinin tarayıcı önbelleği güncel ise 304 Not Modified dön (Sıfır gövde transferi)
        if (clientETag && clientETag === cached.etag) {
          res.setHeader('ETag', cached.etag)
          res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`)
          res.setHeader('X-Cache', 'HIT-304')
          return res.status(304).end()
        }

        // Değilse önbellekteki veriyi dön
        res.setHeader('ETag', cached.etag)
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`)
        res.setHeader('X-Cache', 'HIT')
        return res.json(cached.data)
      }

      // 2. Önbellekte yok veya süresi dolmuş (CACHE MISS)
      this.totalMisses++
      res.setHeader('X-Cache', 'MISS')

      // res.json metodunu sarmalayarak (wrap) başarılı yanıtı önbelleğe kaydet
      const originalJson = res.json.bind(res)
      res.json = (body) => {
        // Yalnızca 200 OK yanıtlarını önbelleğe al
        if (res.statusCode === 200 && body !== undefined && body !== null) {
          try {
            const etag = this.generateETag(body)
            this.store.set(cacheKey, {
              data: body,
              etag,
              expiresAt: Date.now() + ttlSeconds * 1000,
              createdAt: Date.now(),
              hitCount: 0
            })

            res.setHeader('ETag', etag)
            res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`)
          } catch (e) {
            console.warn('⚠️ Önbellek yazma hatası:', e.message)
          }
        }
        return originalJson(body)
      }

      next()
    }
  }

  /**
   * Belirli bir desene (pattern) uyan önbellek anahtarlarını geçersiz kılar
   * @param {string} pattern - Temizlenecek anahtar veya desen (Örn: 'profile', 'links')
   */
  invalidate(pattern) {
    let deletedCount = 0
    const lowerPattern = pattern.toLowerCase()

    for (const key of this.store.keys()) {
      if (key.toLowerCase().includes(lowerPattern)) {
        this.store.delete(key)
        deletedCount++
      }
    }
    return deletedCount
  }

  /**
   * Tüm önbelleği sıfırlar
   */
  clearAll() {
    const count = this.store.size
    this.store.clear()
    return count
  }

  /**
   * Anlık önbellek istatistiklerini raporlar
   */
  getStats() {
    const totalRequests = this.totalHits + this.totalMisses
    const hitRate = totalRequests > 0 
      ? Math.round((this.totalHits / totalRequests) * 100) 
      : 0

    const now = Date.now()
    const activeKeys = []
    for (const [key, entry] of this.store.entries()) {
      activeKeys.push({
        key,
        hitCount: entry.hitCount || 0,
        ttlRemainingSeconds: Math.max(0, Math.ceil((entry.expiresAt - now) / 1000)),
        etag: entry.etag
      })
    }

    return {
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      totalRequests,
      hitRate, // Yüzde (%)
      activeKeysCount: this.store.size,
      activeKeys
    }
  }
}

// Global tekil (singleton) önbellek servisi
export const cacheService = new CacheService()

/**
 * Rotalarda doğrudan kullanılabilen yardımcı middleware
 */
export const cacheMiddleware = (ttlSeconds = 60, keyGen = null) => {
  return cacheService.middleware(ttlSeconds, keyGen)
}

/**
 * Bağlantı veya profil güncellendiğinde ilgili önbellekleri süpüren yardımcı
 */
export const invalidateCache = (pattern) => {
  return cacheService.invalidate(pattern)
}

export default cacheService

/**
 * 🛡️ Rate Limiting & Brute-Force Koruması Middleware'i
 * linkspace - Yüksek Performanslı Bellek İçi Kayan Pencere (Sliding Window) Algoritması
 */

export class InMemoryRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000 // Varsayılan 15 dakika
    this.max = options.max || 100 // Pencere başına maksimum istek
    this.message = options.message || { error: 'Çok fazla istek yapıldı. Lütfen bir süre sonra tekrar deneyin.' }
    this.statusCode = options.statusCode || 429
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator
    this.skip = options.skip || (() => false)
    
    // IP bazlı kayıt deposu: key -> { count, resetTime }
    this.hits = new Map()

    // Periyodik çöp toplayıcı (Memory leak önleme - her 60 saniyede bir süresi bitenleri süpürür)
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, record] of this.hits.entries()) {
        if (now >= record.resetTime) {
          this.hits.delete(key)
        }
      }
    }, 60000)

    // Sunucu kapanırken veya testlerde node process'in asılı kalmasını engeller
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  defaultKeyGenerator(req) {
    const forwarded = req.headers['x-forwarded-for']
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    return req.ip || req.socket?.remoteAddress || '127.0.0.1'
  }

  middleware() {
    return (req, res, next) => {
      // İstek atlanacak mı kontrolü (Örn: OPTIONS)
      if (req.method === 'OPTIONS' || this.skip(req)) {
        return next()
      }

      const key = this.keyGenerator(req)
      const now = Date.now()
      let record = this.hits.get(key)

      if (!record || now >= record.resetTime) {
        record = {
          count: 1,
          resetTime: now + this.windowMs
        }
        this.hits.set(key, record)
      } else {
        record.count++
      }

      const remaining = Math.max(0, this.max - record.count)
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000)

      // Standart IETF RateLimit başlıkları
      res.setHeader('RateLimit-Limit', this.max)
      res.setHeader('RateLimit-Remaining', remaining)
      res.setHeader('RateLimit-Reset', resetSeconds)

      if (record.count > this.max) {
        res.setHeader('Retry-After', resetSeconds)
        return res.status(this.statusCode).json(
          typeof this.message === 'function' ? this.message(req, res) : this.message
        )
      }

      next()
    }
  }

  resetKey(key) {
    this.hits.delete(key)
  }

  clearAll() {
    this.hits.clear()
  }
}

/**
 * Genel API Limitleyici:
 * 15 dakikada IP başına 300 istek (Gezinme, arama ve genel operasyonlar için geniş sınır)
 */
export const globalLimiter = new InMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    error: 'Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfterMinutes: 15
  }
}).middleware()

/**
 * Kimlik Doğrulama Limitleyici (Brute-Force Kalkanı):
 * /api/auth/login ve /api/auth/register için 15 dakikada en fazla 10 deneme
 */
export const authLimiter = new InMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Çok fazla başarısız veya ardışık giriş denemesi yapıldı. Güvenliğiniz için 15 dakika kilitlendi.',
    code: 'AUTH_BRUTE_FORCE_LOCKED',
    retryAfterMinutes: 15
  }
}).middleware()

/**
 * İletişim Formu Spam Limitleyici:
 * /api/messages için 15 dakikada en fazla 5 mesaj
 */
export const messagesLimiter = new InMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Kısa süre içinde çok sayıda mesaj ilettiniz. Lütfen spam koruması gereği biraz bekleyin.',
    code: 'MESSAGE_SPAM_DETECTED',
    retryAfterMinutes: 15
  }
}).middleware()

/**
 * Yapay Zeka Biyografi Asistanı Limitleyici:
 * /api/ai/generate-bio için 1 dakikada en fazla 12 üretim isteği
 */
export const aiLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 12,
  message: {
    error: 'AI biyografi üretim sınırına ulaştınız. Lütfen bir dakika bekledikten sonra tekrar deneyin.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
    retryAfterSeconds: 60
  }
}).middleware()

/**
 * Analitik & QR Okuma Limitleyici:
 * /api/analytics/visit için 5 dakikada 120 istek (Flood saldırılarını önler)
 */
export const analyticsLimiter = new InMemoryRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 120,
  message: {
    error: 'Analitik istek sınırı aşıldı.',
    code: 'ANALYTICS_RATE_LIMIT_EXCEEDED'
  }
}).middleware()

export default InMemoryRateLimiter

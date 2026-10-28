/**
 * 🔒 Güvenlik Başlıkları (Security Headers) Middleware'i
 * linkspace - HTTP Sertleştirme ve Güvenlik Standartları
 */

export const securityHeaders = (req, res, next) => {
  // MIME sniffing saldırılarını engelle
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // Clickjacking saldırılarını engelle (Yalnızca aynı kaynaktan iframe'e izin verir)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')

  // Eski tarayıcılar için XSS filtre koruması
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // HTTPS zorunluluğu (HSTS - 1 Yıl)
  if (process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Güvenli Referrer politikası (Analitik ve kaynak takibini korurken hassas URL parametrelerini gizler)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Gereksiz donanım izinlerini kısıtla
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Sunucu imzasını kaldır (Fingerprinting koruması)
  res.removeHeader('X-Powered-By')

  next()
}

export default securityHeaders

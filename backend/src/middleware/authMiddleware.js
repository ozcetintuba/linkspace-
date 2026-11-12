import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_linktree_jwt_key_2026_x99!'

/**
 * JWT Doğrulama Middleware'i
 * İstek başlığındaki (Authorization: Bearer <token>) belirteci kontrol eder.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Bu işlem için yetkilendirme gereklidir. Lütfen giriş yapın.' 
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.' })
    }
    return res.status(401).json({ error: 'Geçersiz veya bozulmuş yetkilendirme belirteci.' })
  }
}

/**
 * İsteğe Bağlı JWT Doğrulama Middleware'i
 * Token varsa çözer ve req.user'a atar, yoksa veya geçersizse anonim devam eder.
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      req.user = jwt.verify(token, JWT_SECRET)
    } catch (e) {
      req.user = null
    }
  }
  next()
}

/**
 * Yönetici (Admin) Yetki Kontrol Middleware'i
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Bu işlem için oturum açmanız gereklidir.' })
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem yalnızca sistem yöneticisi tarafından yapılabilir.' })
  }
  next()
}

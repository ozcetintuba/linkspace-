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

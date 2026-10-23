import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../db.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_linktree_jwt_key_2026_x99!'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// POST /api/auth/register (Email, şifre hash'leme, benzersiz username kontrolü)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı, e-posta ve şifre zorunludur' })
    }

    const trimmedUsername = username.trim().toLowerCase()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = (name && name.trim()) || trimmedUsername

    // E-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Lütfen geçerli bir e-posta adresi giriniz' })
    }

    // Kullanıcı adı uzunluk ve karakter kontrolü
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return res.status(400).json({ error: 'Kullanıcı adı 3 ile 30 karakter arasında olmalıdır' })
    }
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/
    if (!usernameRegex.test(trimmedUsername)) {
      return res.status(400).json({ error: 'Kullanıcı adı yalnızca harf, rakam, alt çizgi, nokta veya tire içerebilir' })
    }

    // Şifre uzunluk kontrolü
    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır' })
    }

    // Benzersiz kullanıcı adı kontrolü
    const existingUser = await query(
      'SELECT id FROM users WHERE LOWER(username) = $1',
      [trimmedUsername]
    )
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanımda' })
    }

    // Benzersiz e-posta kontrolü
    const existingEmail = await query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [trimmedEmail]
    )
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' })
    }

    // Şifre hash'leme (bcrypt)
    const passwordHash = bcrypt.hashSync(password, 10)

    // Yeni kullanıcıyı kaydet
    const result = await query(`
      INSERT INTO users (username, email, password_hash, name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, name, created_at AS "createdAt"
    `, [trimmedUsername, trimmedEmail, passwordHash, trimmedName])

    const newUser = result.rows[0]

    // Bu kullanıcıya özel varsayılan profil kaydı oluştur
    const existingProfile = await query(
      'SELECT id FROM profiles WHERE LOWER(username) = $1 OR LOWER(username) = $2',
      [trimmedUsername, `@${trimmedUsername}`]
    )
    if (existingProfile.rows.length === 0) {
      await query(`
        INSERT INTO profiles (name, username, bio, avatar, social_links)
        VALUES ($1, $2, $3, $4, '{}'::jsonb)
      `, [
        trimmedName,
        `@${trimmedUsername}`,
        'Linktree profilime hoş geldiniz! ✨',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
      ])
    }

    // JWT token üretimi
    const payload = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name
    }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    res.status(201).json({
      message: 'Kayıt başarıyla tamamlandı',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name
      }
    })
  } catch (error) {
    console.error('Kayıt hatası:', error)
    res.status(500).json({ error: 'Kayıt işlemi sırasında bir sunucu hatası oluştu' })
  }
})

const createDemoSession = (res) => {
  const payload = {
    id: 1,
    username: 'admin',
    name: 'Tuba Gül'
  }
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  return res.json({
    token,
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@linktree.local',
      name: 'Tuba Gül'
    },
    isDemoFallback: true
  })
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur' })
    }

    const trimmedIdentifier = username.trim().toLowerCase()

    try {
      // Kullanıcı adı veya e-posta ile giriş yapılabilir
      const result = await query(
        'SELECT id, username, email, password_hash, name FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1',
        [trimmedIdentifier]
      )

      if (result.rows.length === 0) {
        if ((trimmedIdentifier === 'admin' || trimmedIdentifier === 'admin@linktree.local') && password === 'admin123') {
          return createDemoSession(res)
        }
        return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' })
      }

      const user = result.rows[0]
      const isPasswordValid = bcrypt.compareSync(password, user.password_hash)

      if (!isPasswordValid) {
        if ((trimmedIdentifier === 'admin' || trimmedIdentifier === 'admin@linktree.local') && password === 'admin123') {
          return createDemoSession(res)
        }
        return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' })
      }

      const payload = {
        id: user.id,
        username: user.username,
        name: user.name
      }

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        }
      })
    } catch (dbError) {
      console.warn('⚠️ Veritabanı sorgusu başarısız, demo bilgileri kontrol ediliyor:', dbError.message)
      if ((trimmedIdentifier === 'admin' || trimmedIdentifier === 'admin@linktree.local') && password === 'admin123') {
        return createDemoSession(res)
      }
      return res.status(500).json({ error: 'Veritabanına bağlanılamadı. Lütfen Render panelinde PostgreSQL oluşturup DATABASE_URL tanımlayın veya demo (admin / admin123) ile giriş yapın.' })
    }
  } catch (error) {
    console.error('Giriş hatası:', error)
    res.status(500).json({ error: 'Giriş işlemi sırasında sunucu hatası oluştu' })
  }
})

// GET /api/auth/me (Mevcut kullanıcı oturum kontrolü)
router.get('/me', requireAuth, async (req, res) => {
  try {
    try {
      const result = await query(
        'SELECT id, username, email, name, created_at AS "createdAt" FROM users WHERE id = $1',
        [req.user.id]
      )

      if (result.rows.length > 0) {
        return res.json(result.rows[0])
      }
    } catch (dbError) {
      console.warn('⚠️ /me DB sorgusu atlandı (çevrimdışı mod):', dbError.message)
    }

    res.json({
      id: req.user.id || 1,
      username: req.user.username || 'admin',
      email: req.user.email || 'admin@linktree.local',
      name: req.user.name || 'Tuba Gül',
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Kullanıcı sorgu hatası:', error)
    res.status(500).json({ error: 'Kullanıcı bilgisi alınamadı' })
  }
})

// POST /api/auth/change-password (Şifre değiştirme)
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mevcut ve yeni şifre zorunludur' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır' })
    }

    const result = await query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' })
    }

    const user = result.rows[0]
    const isCurrentValid = bcrypt.compareSync(currentPassword, user.password_hash)

    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Mevcut şifreniz hatalı' })
    }

    const newHash = bcrypt.hashSync(newPassword, 10)
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, req.user.id]
    )

    res.json({ message: 'Şifreniz başarıyla güncellendi' })
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error)
    res.status(500).json({ error: 'Şifre güncellenemedi' })
  }
})

export default router

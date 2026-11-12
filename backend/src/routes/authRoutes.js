import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../db.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import { invalidateCache } from '../middleware/cacheService.js'
import {
  RESERVED_USERNAMES,
  mockUsers,
  allocateMockUserId,
  findMockUserByIdentifier,
  ensureMockUserState
} from '../mockState.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_linktree_jwt_key_2026_x99!'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// POST /api/auth/register (Onaylı Üyelik Başvurusu - Yeni Üyeler 'pending' Olarak Kaydedilir)
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, name } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı, e-posta ve şifre gereklidir' })
    }

    const trimmedUsername = username.trim().toLowerCase().replace(/^@/, '')
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = (name && name.trim()) ? name.trim() : trimmedUsername

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return res.status(400).json({ error: 'Kullanıcı adı 3 ile 30 karakter arasında olmalıdır' })
    }

    if (!/^[a-z0-9._-]+$/.test(trimmedUsername)) {
      return res.status(400).json({ error: 'Kullanıcı adı yalnızca küçük harf, rakam, nokta, alt çizgi ve tire içerebilir' })
    }

    if (RESERVED_USERNAMES.has(trimmedUsername)) {
      return res.status(400).json({ error: 'Bu kullanıcı adı sistem tarafından ayrılmıştır. Lütfen başka bir kullanıcı adı seçin.' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter uzunluğunda olmalıdır' })
    }

    const passwordHash = bcrypt.hashSync(password, 10)
    const defaultAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${trimmedUsername}`

    try {
      // Kullanıcı adı veya e-posta benzersizlik kontrolü
      const existingCheck = await query(
        'SELECT id FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
        [trimmedUsername, trimmedEmail]
      )

      if (existingCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Bu kullanıcı adı veya e-posta adresi zaten kullanılıyor' })
      }

      // Yeni üyeyi 'user' rolü ve 'pending' (Yönetici Onayı Bekliyor) durumuyla oluştur
      const insertUser = await query(`
        INSERT INTO users (username, email, password_hash, name, role, status)
        VALUES ($1, $2, $3, $4, 'user', 'pending')
        RETURNING id, username, email, name, role, status, created_at AS "createdAt"
      `, [trimmedUsername, trimmedEmail, passwordHash, trimmedName])

      const newUser = insertUser.rows[0]

      // Yeni üye için izole profil ve varsayılan tema/link oluştur
      await query(`
        INSERT INTO profiles (user_id, name, username, bio, avatar, avatar_mode, is_verified, social_links)
        VALUES ($1, $2, $3, $4, $5, 'photo', false, '{}'::jsonb)
      `, [
        newUser.id,
        trimmedName,
        `@${trimmedUsername}`,
        `${trimmedName} kişisel linkspace profili ✨`,
        defaultAvatar
      ])

      await query(`
        INSERT INTO settings (user_id, key, value)
        VALUES ($1, 'theme', 'midnight')
        ON CONFLICT (user_id, key) DO NOTHING
      `, [newUser.id])

      await query(`
        INSERT INTO links (id, user_id, title, url, is_active, icon, custom_color, clicks, order_index, grid_span)
        VALUES ($1, $2, $3, $4, true, 'globe', 'default', 0, 0, 'full')
      `, [Date.now(), newUser.id, `${trimmedName} Web Sitesi`, 'https://github.com'])

      invalidateCache('profile')

      return res.status(201).json({
        success: true,
        pendingApproval: true,
        message: 'Üyelik başvurunuz alındı! Hesabınız yönetici onayından sonra aktif edilecektir.',
        user: {
          id: newUser.id,
          username: newUser.username,
          profileUsername: newUser.username,
          email: newUser.email,
          name: newUser.name,
          role: 'user',
          status: 'pending'
        }
      })
    } catch (dbErr) {
      // DB çevrimdışıysa bellek içi onaylı üyelik kuyruğuna kaydet
      console.warn('⚠️ [DB Çevrimdışı] Üyelik başvurusu belleğe kaydediliyor:', dbErr.message)

      const duplicateMock = mockUsers.some(u =>
        u.username.toLowerCase() === trimmedUsername ||
        (u.profileUsername && u.profileUsername.toLowerCase() === trimmedUsername) ||
        (u.email && u.email.toLowerCase() === trimmedEmail)
      )
      if (duplicateMock) {
        return res.status(409).json({ error: 'Bu kullanıcı adı veya e-posta adresi zaten kullanılıyor' })
      }

      const offlineUser = {
        id: allocateMockUserId(),
        username: trimmedUsername,
        profileUsername: trimmedUsername,
        name: trimmedName,
        email: trimmedEmail,
        passwordHash,
        role: 'user',
        status: 'pending',
        avatar: defaultAvatar,
        bio: `${trimmedName} kişisel linkspace profili ✨`,
        isVerified: false,
        linkCount: 1,
        profileUrl: `/@${trimmedUsername}`,
        layoutStyle: 'list',
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      }
      ensureMockUserState(offlineUser)
      mockUsers.unshift(offlineUser)
      invalidateCache('profile')

      return res.status(201).json({
        success: true,
        pendingApproval: true,
        offlineFallback: true,
        message: 'Üyelik başvurunuz alındı! Hesabınız yönetici onayından sonra aktif edilecektir.',
        user: {
          id: offlineUser.id,
          username: offlineUser.username,
          profileUsername: offlineUser.profileUsername,
          email: offlineUser.email,
          name: offlineUser.name,
          role: 'user',
          status: 'pending'
        }
      })
    }
  } catch (error) {
    console.error('Kayıt hatası:', error)
    res.status(500).json({ error: 'Kayıt işlemi sırasında bir sunucu hatası oluştu' })
  }
})

// POST /api/auth/login (Kullanıcı Adı / E-Posta & Şifre ile Oturum Açma)
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı veya e-posta ile şifre gereklidir' })
    }

    const cleanIdentifier = username.trim().toLowerCase().replace(/^@/, '')
    let matchedUser = null
    let profileUsername = cleanIdentifier

    try {
      const result = await query(`
        SELECT 
          u.id, u.username, u.email, u.password_hash, u.name,
          COALESCE(u.role, 'user') AS "role",
          COALESCE(u.status, 'active') AS "status",
          p.username AS "profileHandle"
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE LOWER(u.username) = $1 
           OR LOWER(u.email) = $1
           OR LOWER(REPLACE(COALESCE(p.username, ''), '@', '')) = $1
        LIMIT 1
      `, [cleanIdentifier])

      if (result.rows.length > 0) {
        const dbRow = result.rows[0]
        const isPasswordValid = bcrypt.compareSync(password, dbRow.password_hash)
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' })
        }

        matchedUser = {
          id: dbRow.id,
          username: dbRow.username,
          email: dbRow.email,
          name: dbRow.name,
          role: dbRow.role || (dbRow.id === 1 ? 'admin' : 'user'),
          status: dbRow.status || 'active'
        }
        profileUsername = (dbRow.profileHandle || dbRow.username || '').replace(/^@/, '')
      } else {
        // DB'de yoksa yetkisiz
        const mockFallback = findMockUserByIdentifier(cleanIdentifier)
        if (!mockFallback || !bcrypt.compareSync(password, mockFallback.passwordHash)) {
          return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' })
        }
        matchedUser = mockFallback
        profileUsername = (mockFallback.profileUsername || mockFallback.username || '').replace(/^@/, '')
      }
    } catch (dbError) {
      console.warn('⚠️ [DB Çevrimdışı] Bellek içi kullanıcı doğrulaması kullanılıyor:', dbError.message)
      const mockFallback = findMockUserByIdentifier(cleanIdentifier)
      if (!mockFallback || !bcrypt.compareSync(password, mockFallback.passwordHash)) {
        return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' })
      }
      matchedUser = mockFallback
      profileUsername = (mockFallback.profileUsername || mockFallback.username || '').replace(/^@/, '')
    }

    // Onay & Askı Durumu Kontrolü
    if (matchedUser.status === 'pending') {
      return res.status(403).json({
        error: 'Hesabınız henüz yönetici onayı bekliyor. Yönetici onayladıktan sonra giriş yapabilirsiniz.',
        status: 'pending'
      })
    }

    if (matchedUser.status === 'suspended') {
      return res.status(403).json({
        error: 'Hesabınız yönetici tarafından askıya alınmıştır. Destek için iletişime geçin.',
        status: 'suspended'
      })
    }

    const payload = {
      id: matchedUser.id,
      username: matchedUser.username,
      name: matchedUser.name,
      role: matchedUser.role || 'user',
      status: matchedUser.status || 'active'
    }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    res.json({
      token,
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        profileUsername,
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role || 'user',
        status: matchedUser.status || 'active'
      }
    })
  } catch (error) {
    console.error('Giriş hatası:', error)
    res.status(500).json({ error: 'Oturum açılırken bir sunucu hatası oluştu' })
  }
})

// GET /api/auth/me (Geçerli Oturum Bilgisini Al)
router.get('/me', requireAuth, async (req, res) => {
  try {
    try {
      const result = await query(`
        SELECT 
          u.id, u.username, u.email, u.name,
          COALESCE(u.role, 'user') AS "role",
          COALESCE(u.status, 'active') AS "status",
          p.username AS "profileHandle"
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.id = $1
        LIMIT 1
      `, [req.user.id])

      if (result.rows.length > 0) {
        const u = result.rows[0]
        if (u.status !== 'active') {
          return res.status(403).json({ error: 'Hesap aktif değil', status: u.status })
        }
        return res.json({
          id: u.id,
          username: u.username,
          profileUsername: (u.profileHandle || u.username || '').replace(/^@/, ''),
          email: u.email,
          name: u.name,
          role: u.role || (u.id === 1 ? 'admin' : 'user'),
          status: u.status
        })
      }
    } catch (dbError) {
      console.warn('⚠️ [DB Çevrimdışı] Oturum bilgisi bellekten dönülüyor:', dbError.message)
    }

    const mockUser = mockUsers.find(u => u.id === req.user.id || u.username === req.user.username)
    if (mockUser) {
      if (mockUser.status !== 'active') {
        return res.status(403).json({ error: 'Hesap aktif değil', status: mockUser.status })
      }
      return res.json({
        id: mockUser.id,
        username: mockUser.username,
        profileUsername: (mockUser.profileUsername || mockUser.username).replace(/^@/, ''),
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        status: mockUser.status
      })
    }

    return res.json({
      id: req.user.id,
      username: req.user.username,
      profileUsername: req.user.username,
      name: req.user.name,
      role: req.user.role || 'user',
      status: 'active'
    })
  } catch (error) {
    console.error('Oturum kontrol hatası:', error)
    res.status(500).json({ error: 'Kullanıcı bilgileri alınamadı' })
  }
})

// POST /api/auth/change-password (Şifre Değiştirme)
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gereklidir' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Yeni şifre en az 6 karakter uzunluğunda olmalıdır' })
    }

    try {
      const result = await query(
        'SELECT id, password_hash FROM users WHERE id = $1',
        [req.user.id]
      )

      if (result.rows.length > 0) {
        const user = result.rows[0]
        if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
          return res.status(401).json({ error: 'Mevcut şifreniz yanlış' })
        }

        const newHash = bcrypt.hashSync(newPassword, 10)
        await query(
          'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newHash, user.id]
        )

        return res.json({ message: 'Şifreniz başarıyla güncellendi' })
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Şifre bellekte güncelleniyor:', dbErr.message)
    }

    const mockUser = mockUsers.find(u => u.id === req.user.id || u.username === req.user.username)
    if (!mockUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' })
    }
    if (!bcrypt.compareSync(currentPassword, mockUser.passwordHash)) {
      return res.status(401).json({ error: 'Mevcut şifreniz yanlış' })
    }
    mockUser.passwordHash = bcrypt.hashSync(newPassword, 10)
    return res.json({ message: 'Şifreniz başarıyla güncellendi' })
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error)
    res.status(500).json({ error: 'Şifre değiştirilirken bir hata oluştu' })
  }
})

export default router

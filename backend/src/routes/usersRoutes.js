import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Bellek içi yedek kullanıcılar listesi (Veritabanı çevrimdışı veya demo modunda kesintisiz çalışması için)
export const mockUsers = [
  {
    id: 1,
    username: 'tubagul',
    name: 'Tuba Gül',
    email: 'admin@linktree.local',
    role: 'admin',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'Full-Stack Web Geliştirici & UI/UX Meraklısı 🚀\nModern web teknolojileri ve açık kaynak projeler üretiyorum.',
    isVerified: true,
    linkCount: 4,
    profileUrl: '/@tubagul',
    layoutStyle: 'bento',
    createdAt: '2026-10-15T10:00:00.000Z',
    lastSeen: '2026-11-10T11:45:00.000Z'
  },
  {
    id: 2,
    username: 'mert.dev',
    name: 'Mert Yılmaz',
    email: 'mert.yilmaz@devmail.io',
    role: 'user',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    bio: 'Senior Backend Engineer • Node.js & Go • Açık Kaynak Geliştirici 💻',
    isVerified: true,
    linkCount: 3,
    profileUrl: '/@mert.dev',
    layoutStyle: 'list',
    createdAt: '2026-10-22T14:20:00.000Z',
    lastSeen: '2026-11-10T09:30:00.000Z'
  },
  {
    id: 3,
    username: 'selin.design',
    name: 'Selin Kaya',
    email: 'selin.design@creatives.co',
    role: 'user',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    bio: 'Product & Brand Designer • Design Systems • Minimalist UI/UX 🎨',
    isVerified: true,
    linkCount: 5,
    profileUrl: '/@selin.design',
    layoutStyle: 'bento',
    createdAt: '2026-10-28T09:15:00.000Z',
    lastSeen: '2026-11-09T17:10:00.000Z'
  },
  {
    id: 4,
    username: 'can.tech',
    name: 'Can Demir',
    email: 'can.demir@cloudtech.com',
    role: 'user',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Cloud Architect & DevOps • AWS Certified • Kubernetes & CI/CD ☁️',
    isVerified: false,
    linkCount: 2,
    profileUrl: '/@can.tech',
    layoutStyle: 'list',
    createdAt: '2026-11-04T16:45:00.000Z',
    lastSeen: '2026-11-08T12:00:00.000Z'
  }
]

// 1. GET /api/users (Tüm kayıtlı kullanıcıları ve profil özetlerini getir)
router.get('/', requireAuth, async (req, res) => {
  try {
    try {
      const result = await query(`
        SELECT 
          u.id, 
          u.username, 
          u.email, 
          u.name, 
          COALESCE(u.role, 'user') AS "role",
          u.created_at AS "createdAt",
          COALESCE(p.avatar, '') AS "avatar",
          COALESCE(p.bio, '') AS "bio",
          COALESCE(p.is_verified, true) AS "isVerified",
          COALESCE(p.layout_style, 'list') AS "layoutStyle",
          (
            SELECT COUNT(*)::int 
            FROM links l 
            WHERE l.is_active = true
          ) AS "linkCount"
        FROM users u
        LEFT JOIN profiles p ON LOWER(REPLACE(p.username, '@', '')) = LOWER(u.username)
        ORDER BY u.created_at DESC
      `)

      if (result.rows.length > 0) {
        const enrichedUsers = result.rows.map(user => ({
          ...user,
          profileUrl: `/@${user.username.replace(/^@/, '')}`
        }))
        return res.json({
          success: true,
          count: enrichedUsers.length,
          data: enrichedUsers
        })
      }
    } catch (dbError) {
      console.warn('⚠️ [DB Çevrimdışı] Kullanıcılar bellek listesinden getiriliyor:', dbError.message)
    }

    // Veritabanı sorgusu boşsa veya çevrimdışıysa mockUsers listesini dön
    return res.json({
      success: true,
      count: mockUsers.length,
      data: mockUsers
    })
  } catch (error) {
    console.error('Kullanıcı listesi hatası:', error)
    res.status(500).json({ error: 'Kullanıcılar alınırken bir sunucu hatası oluştu' })
  }
})

// 2. GET /api/users/stats (Yönetici İstatistik KPI Özeti)
router.get('/stats', requireAuth, async (req, res) => {
  try {
    try {
      const usersRes = await query('SELECT COUNT(*)::int AS count FROM users')
      const profilesRes = await query('SELECT COUNT(*)::int AS count FROM profiles')
      const linksRes = await query('SELECT COUNT(*)::int AS count FROM links WHERE is_active = true')
      const recentUsersRes = await query(`
        SELECT COUNT(*)::int AS count 
        FROM users 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `)

      return res.json({
        success: true,
        data: {
          totalUsers: usersRes.rows[0]?.count || mockUsers.length,
          activeProfiles: profilesRes.rows[0]?.count || mockUsers.length,
          totalLinks: linksRes.rows[0]?.count || 14,
          newUsersThisMonth: recentUsersRes.rows[0]?.count || 2
        }
      })
    } catch (dbError) {
      console.warn('⚠️ [DB Çevrimdışı] Kullanıcı istatistikleri bellekten hesaplanıyor')
    }

    const totalUsers = mockUsers.length
    const totalLinks = mockUsers.reduce((sum, u) => sum + (u.linkCount || 0), 0)

    res.json({
      success: true,
      data: {
        totalUsers,
        activeProfiles: totalUsers,
        totalLinks,
        newUsersThisMonth: 2
      }
    })
  } catch (error) {
    console.error('İstatistik hatası:', error)
    res.status(500).json({ error: 'İstatistikler alınamadı' })
  }
})

// 3. POST /api/users (Yönetici Paneli Üzerinden Yeni Kullanıcı Hesabı Tanımlama)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, username, email, password, role = 'user', bio = '' } = req.body

    if (!name || !username || !email) {
      return res.status(400).json({ error: 'İsim, kullanıcı adı ve e-posta zorunludur' })
    }

    const trimmedUsername = username.trim().toLowerCase().replace(/^@/, '')
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()
    const rawPassword = password || '123456'

    // Kullanıcı adı geçerlilik kontrolü
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return res.status(400).json({ error: 'Kullanıcı adı 3 ile 30 karakter arasında olmalıdır' })
    }

    try {
      // Benzersiz kullanıcı adı kontrolü
      const existingUser = await query(
        'SELECT id FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
        [trimmedUsername, trimmedEmail]
      )

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Bu kullanıcı adı veya e-posta adresi zaten kullanımda' })
      }

      const passwordHash = bcrypt.hashSync(rawPassword, 10)

      const userResult = await query(`
        INSERT INTO users (username, email, password_hash, name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email, name, role, created_at AS "createdAt"
      `, [trimmedUsername, trimmedEmail, passwordHash, trimmedName, role])

      const newUser = userResult.rows[0]

      // Otomatik profil kaydı oluştur
      const defaultAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${trimmedUsername}`
      await query(`
        INSERT INTO profiles (name, username, bio, avatar, social_links)
        VALUES ($1, $2, $3, $4, '{}'::jsonb)
        ON CONFLICT DO NOTHING
      `, [trimmedName, `@${trimmedUsername}`, bio || `${trimmedName} kişisel profil sayfası ✨`, defaultAvatar])

      const createdObj = {
        ...newUser,
        avatar: defaultAvatar,
        bio: bio || `${trimmedName} kişisel profil sayfası ✨`,
        isVerified: false,
        linkCount: 0,
        profileUrl: `/@${trimmedUsername}`,
        layoutStyle: 'list'
      }

      mockUsers.unshift(createdObj)
      return res.status(201).json({
        success: true,
        message: 'Kullanıcı başarıyla oluşturuldu',
        data: createdObj
      })
    } catch (dbError) {
      console.warn('⚠️ [DB Çevrimdışı] Kullanıcı belleğe ekleniyor:', dbError.message)
    }

    // Mock kayıt
    const existsInMock = mockUsers.some(u => u.username.toLowerCase() === trimmedUsername || u.email.toLowerCase() === trimmedEmail)
    if (existsInMock) {
      return res.status(409).json({ error: 'Bu kullanıcı adı veya e-posta zaten kullanımda' })
    }

    const fallbackUser = {
      id: Date.now(),
      username: trimmedUsername,
      name: trimmedName,
      email: trimmedEmail,
      role,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${trimmedUsername}`,
      bio: bio || `${trimmedName} kişisel bağlantıları ✨`,
      isVerified: false,
      linkCount: 0,
      profileUrl: `/@${trimmedUsername}`,
      layoutStyle: 'list',
      createdAt: new Date().toISOString()
    }

    mockUsers.unshift(fallbackUser)
    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu (Bellek Modu)',
      data: fallbackUser
    })
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error)
    res.status(500).json({ error: 'Kullanıcı oluşturulamadı' })
  }
})

// 4. DELETE /api/users/:id (Kullanıcı Silme)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10)

    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID formatı' })
    }

    // Ana yönetici hesabını koruma
    if (targetId === 1) {
      return res.status(403).json({ error: 'Ana yönetici hesabı sistem güvenliği için silinemez' })
    }

    try {
      const userRes = await query('SELECT username FROM users WHERE id = $1', [targetId])
      if (userRes.rows.length === 0) {
        // Mock'ta var mı kontrol et
        const mockIdx = mockUsers.findIndex(u => u.id === targetId)
        if (mockIdx !== -1) {
          mockUsers.splice(mockIdx, 1)
          return res.json({ success: true, message: 'Kullanıcı hesabı başarıyla silindi' })
        }
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' })
      }

      const username = userRes.rows[0].username

      // Kullanıcıyı ve profilini sil
      await query('DELETE FROM users WHERE id = $1', [targetId])
      await query('DELETE FROM profiles WHERE LOWER(REPLACE(username, \'@\', \'\')) = $1', [username.toLowerCase()])

      // Mock listesinden de çıkar
      const mockIdx = mockUsers.findIndex(u => u.id === targetId)
      if (mockIdx !== -1) {
        mockUsers.splice(mockIdx, 1)
      }

      return res.json({ success: true, message: 'Kullanıcı ve profili başarıyla silindi' })
    } catch (dbError) {
      console.warn('⚠️ [DB Çevrimdışı] Bellekten kullanıcı siliniyor:', dbError.message)
    }

    const mockIdx = mockUsers.findIndex(u => u.id === targetId)
    if (mockIdx !== -1) {
      mockUsers.splice(mockIdx, 1)
      return res.json({ success: true, message: 'Kullanıcı hesabı başarıyla silindi' })
    }

    res.status(404).json({ error: 'Kullanıcı bulunamadı' })
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error)
    res.status(500).json({ error: 'Kullanıcı silinemedi' })
  }
})

// 5. PUT /api/users/:id (Kullanıcı Bilgilerini Güncelleme)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10)
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID formatı' })
    }

    const { name, username, email, role, bio, isVerified, status, layoutStyle } = req.body

    const mockIdx = mockUsers.findIndex(u => u.id === targetId)
    if (mockIdx !== -1) {
      const current = mockUsers[mockIdx]
      const updated = {
        ...current,
        name: name !== undefined ? name.trim() : current.name,
        username: username !== undefined ? username.trim().toLowerCase().replace(/^@/, '') : current.username,
        email: email !== undefined ? email.trim().toLowerCase() : current.email,
        role: role !== undefined ? role : current.role,
        bio: bio !== undefined ? bio : current.bio,
        isVerified: isVerified !== undefined ? Boolean(isVerified) : current.isVerified,
        status: status !== undefined ? status : (current.status || 'active'),
        layoutStyle: layoutStyle !== undefined ? layoutStyle : (current.layoutStyle || 'bento')
      }
      mockUsers[mockIdx] = updated
      return res.json({ success: true, message: 'Kullanıcı başarıyla güncellendi', data: updated })
    }

    res.status(404).json({ error: 'Kullanıcı bulunamadı' })
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error)
    res.status(500).json({ error: 'Kullanıcı güncellenemedi' })
  }
})

// 6. PUT /api/users/:id/toggle-verify (Doğrulama Rozeti Aç/Kapat)
router.put('/:id/toggle-verify', requireAuth, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10)
    const mockIdx = mockUsers.findIndex(u => u.id === targetId)
    if (mockIdx !== -1) {
      mockUsers[mockIdx].isVerified = !mockUsers[mockIdx].isVerified
      return res.json({ 
        success: true, 
        message: mockUsers[mockIdx].isVerified ? 'Kullanıcı doğrulandı' : 'Doğrulama rozeti kaldırıldı',
        data: mockUsers[mockIdx]
      })
    }
    res.status(404).json({ error: 'Kullanıcı bulunamadı' })
  } catch (error) {
    res.status(500).json({ error: 'Doğrulama durumu değiştirilemedi' })
  }
})

// 7. PUT /api/users/:id/toggle-status (Hesap Durumu Aktif/Askıda Değiştir)
router.put('/:id/toggle-status', requireAuth, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10)
    if (targetId === 1) {
      return res.status(403).json({ error: 'Ana yönetici hesabı askıya alınamaz' })
    }
    const mockIdx = mockUsers.findIndex(u => u.id === targetId)
    if (mockIdx !== -1) {
      const nextStatus = mockUsers[mockIdx].status === 'suspended' ? 'active' : 'suspended'
      mockUsers[mockIdx].status = nextStatus
      return res.json({ 
        success: true, 
        message: nextStatus === 'suspended' ? 'Hesap askıya alındı' : 'Hesap yeniden aktifleştirildi',
        data: mockUsers[mockIdx]
      })
    }
    res.status(404).json({ error: 'Kullanıcı bulunamadı' })
  } catch (error) {
    res.status(500).json({ error: 'Hesap durumu değiştirilemedi' })
  }
})

// 8. POST /api/users/batch (Toplu Kullanıcı İşlemleri)
router.post('/batch', requireAuth, async (req, res) => {
  try {
    const { ids, action } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'İşlem yapılacak kullanıcılar belirtilmedi' })
    }

    let affectedCount = 0
    ids.forEach(id => {
      const targetId = parseInt(id, 10)
      const u = mockUsers.find(x => x.id === targetId)
      if (!u) return

      if (action === 'verify') {
        u.isVerified = true
        affectedCount++
      } else if (action === 'unverify') {
        u.isVerified = false
        affectedCount++
      } else if (action === 'suspend' && targetId !== 1) {
        u.status = 'suspended'
        affectedCount++
      } else if (action === 'activate') {
        u.status = 'active'
        affectedCount++
      } else if (action === 'delete' && targetId !== 1) {
        const idx = mockUsers.findIndex(x => x.id === targetId)
        if (idx !== -1) {
          mockUsers.splice(idx, 1)
          affectedCount++
        }
      }
    })

    res.json({ success: true, message: `${affectedCount} kullanıcı üzerinde işlem tamamlandı`, affectedCount })
  } catch (error) {
    res.status(500).json({ error: 'Toplu işlem gerçekleştirilemedi' })
  }
})

export default router


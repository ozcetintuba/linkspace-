import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js'
import { invalidateCache } from '../middleware/cacheService.js'
import {
  RESERVED_USERNAMES,
  mockUsers,
  mockProfilesByUserId,
  mockLinksByUserId,
  mockSettingsByUserId,
  mockMessagesByUserId,
  allocateMockUserId,
  ensureMockUserState,
  formatUserSummary
} from '../mockState.js'

export { mockUsers }

const router = Router()

// 1. GET /api/users (Tüm kayıtlı kullanıcıları ve profil özetlerini getir - Yalnızca Admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    try {
      const result = await query(`
        SELECT 
          u.id, 
          COALESCE(NULLIF(REPLACE(p.username, '@', ''), ''), u.username) AS "username",
          u.username AS "loginUsername",
          u.email, 
          COALESCE(p.name, u.name) AS "name", 
          COALESCE(u.role, 'user') AS "role",
          COALESCE(u.status, 'active') AS "status",
          u.created_at AS "createdAt",
          COALESCE(p.avatar, '') AS "avatar",
          COALESCE(p.bio, '') AS "bio",
          COALESCE(p.is_verified, false) AS "isVerified",
          COALESCE(p.layout_style, 'list') AS "layoutStyle",
          (
            SELECT COUNT(*)::int 
            FROM links l 
            WHERE l.user_id = u.id AND l.is_active = true
          ) AS "linkCount"
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        ORDER BY 
          CASE WHEN COALESCE(u.status, 'active') = 'pending' THEN 0 ELSE 1 END,
          u.created_at DESC
      `)

      if (result.rows.length > 0) {
        const enrichedUsers = result.rows.map(user => ({
          ...user,
          profileUrl: `/@${(user.username || '').replace(/^@/, '')}`
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

    const fallbackList = mockUsers
      .map(formatUserSummary)
      .sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (b.status === 'pending' && a.status !== 'pending') return 1
        return new Date(b.createdAt) - new Date(a.createdAt)
      })

    return res.json({
      success: true,
      count: fallbackList.length,
      data: fallbackList
    })
  } catch (error) {
    console.error('Kullanıcı listesi hatası:', error)
    res.status(500).json({ error: 'Kullanıcılar alınırken bir sunucu hatası oluştu' })
  }
})

// 2. GET /api/users/stats (Yönetici İstatistik KPI Özeti - Yalnızca Admin)
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    try {
      const usersRes = await query('SELECT COUNT(*)::int AS count FROM users')
      const pendingRes = await query("SELECT COUNT(*)::int AS count FROM users WHERE status = 'pending'")
      const suspendedRes = await query("SELECT COUNT(*)::int AS count FROM users WHERE status = 'suspended'")
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
          totalUsers: usersRes.rows[0]?.count || 0,
          pendingUsers: pendingRes.rows[0]?.count || 0,
          suspendedUsers: suspendedRes.rows[0]?.count || 0,
          activeProfiles: profilesRes.rows[0]?.count || 0,
          totalLinks: linksRes.rows[0]?.count || 0,
          newUsersThisMonth: recentUsersRes.rows[0]?.count || 0
        }
      })
    } catch (dbError) {
      console.warn('⚠️ [DB Çevrimdışı] Kullanıcı istatistikleri bellekten hesaplanıyor')
    }

    const summary = mockUsers.map(formatUserSummary)
    res.json({
      success: true,
      data: {
        totalUsers: summary.length,
        pendingUsers: summary.filter(u => u.status === 'pending').length,
        suspendedUsers: summary.filter(u => u.status === 'suspended').length,
        activeProfiles: summary.filter(u => u.status === 'active').length,
        totalLinks: summary.reduce((sum, u) => sum + (u.linkCount || 0), 0),
        newUsersThisMonth: summary.length
      }
    })
  } catch (error) {
    console.error('İstatistik hatası:', error)
    res.status(500).json({ error: 'İstatistikler alınamadı' })
  }
})

// 3. POST /api/users (Yönetici Panelinden Doğrudan Kullanıcı Tanımlama - Yalnızca Admin)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, username, email, password, role = 'user', status = 'active', bio = '' } = req.body

    if (!name || !username || !email) {
      return res.status(400).json({ error: 'İsim, kullanıcı adı ve e-posta zorunludur' })
    }

    const trimmedUsername = username.trim().toLowerCase().replace(/^@/, '')
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()
    const rawPassword = password || '123456'
    const finalStatus = ['active', 'pending', 'suspended'].includes(status) ? status : 'active'

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return res.status(400).json({ error: 'Kullanıcı adı 3 ile 30 karakter arasında olmalıdır' })
    }

    if (RESERVED_USERNAMES.has(trimmedUsername)) {
      return res.status(400).json({ error: 'Bu kullanıcı adı sistem tarafından ayrılmıştır' })
    }

    const passwordHash = bcrypt.hashSync(rawPassword, 10)
    const defaultAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${trimmedUsername}`

    try {
      const existingUser = await query(
        'SELECT id FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
        [trimmedUsername, trimmedEmail]
      )

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Bu kullanıcı adı veya e-posta adresi zaten kullanımda' })
      }

      const userResult = await query(`
        INSERT INTO users (username, email, password_hash, name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, username, email, name, role, status, created_at AS "createdAt"
      `, [trimmedUsername, trimmedEmail, passwordHash, trimmedName, role, finalStatus])

      const newUser = userResult.rows[0]

      await query(`
        INSERT INTO profiles (user_id, name, username, bio, avatar, avatar_mode, is_verified, social_links)
        VALUES ($1, $2, $3, $4, $5, 'photo', false, '{}'::jsonb)
      `, [newUser.id, trimmedName, `@${trimmedUsername}`, bio || `${trimmedName} kişisel profil sayfası ✨`, defaultAvatar])

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
        message: 'Kullanıcı hesabı oluşturuldu',
        data: {
          ...newUser,
          avatar: defaultAvatar,
          bio: bio || `${trimmedName} kişisel profil sayfası ✨`,
          isVerified: false,
          linkCount: 1,
          profileUrl: `/@${trimmedUsername}`,
          layoutStyle: 'list'
        }
      })
    } catch (dbError) {
      console.warn('⚠️ [DB Çevrimdışı] Kullanıcı belleğe ekleniyor:', dbError.message)
    }

    const existsInMock = mockUsers.some(u =>
      u.username.toLowerCase() === trimmedUsername ||
      (u.profileUsername && u.profileUsername.toLowerCase() === trimmedUsername) ||
      u.email.toLowerCase() === trimmedEmail
    )
    if (existsInMock) {
      return res.status(409).json({ error: 'Bu kullanıcı adı veya e-posta zaten kullanımda' })
    }

    const fallbackUser = {
      id: allocateMockUserId(),
      username: trimmedUsername,
      profileUsername: trimmedUsername,
      name: trimmedName,
      email: trimmedEmail,
      passwordHash,
      role,
      status: finalStatus,
      avatar: defaultAvatar,
      bio: bio || `${trimmedName} kişisel bağlantıları ✨`,
      isVerified: false,
      layoutStyle: 'list',
      createdAt: new Date().toISOString()
    }
    ensureMockUserState(fallbackUser)
    mockUsers.unshift(fallbackUser)
    invalidateCache('profile')

    res.status(201).json({
      success: true,
      message: 'Kullanıcı hesabı oluşturuldu',
      data: formatUserSummary(fallbackUser)
    })
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error)
    res.status(500).json({ error: 'Kullanıcı oluşturulamadı' })
  }
})

// 4. PUT /api/users/:id/approve (Onay Bekleyen Üyeyi Onayla - Yalnızca Admin)
router.put('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10)
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID formatı' })
    }

    try {
      const result = await query(`
        UPDATE users 
        SET status = 'active', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 
        RETURNING id, username, email, name, role, status
      `, [targetId])

      if (result.rows.length > 0) {
        invalidateCache('profile')
        const mockUser = mockUsers.find(u => u.id === targetId)
        if (mockUser) mockUser.status = 'active'
        return res.json({
          success: true,
          message: `${result.rows[0].name} üyeliği onaylandı ve aktif edildi!`,
          data: result.rows[0]
        })
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Üye bellekte onaylanıyor:', dbErr.message)
    }

    const mockUser = mockUsers.find(u => u.id === targetId)
    if (!mockUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' })
    }
    mockUser.status = 'active'
    invalidateCache('profile')
    return res.json({
      success: true,
      message: `${mockUser.name} üyeliği onaylandı ve aktif edildi!`,
      data: formatUserSummary(mockUser)
    })
  } catch (error) {
    console.error('Üye onaylama hatası:', error)
    res.status(500).json({ error: 'Üye onaylanamadı' })
  }
})

// 5. DELETE /api/users/:id (Kullanıcı Silme / Başvuru Reddetme - Yalnızca Admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10)
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID formatı' })
    }

    if (targetId === 1) {
      return res.status(403).json({ error: 'Ana yönetici hesabı sistem güvenliği için silinemez' })
    }

    try {
      const userRes = await query('SELECT username FROM users WHERE id = $1', [targetId])
      if (userRes.rows.length > 0) {
        await query('DELETE FROM click_events WHERE user_id = $1', [targetId])
        await query('DELETE FROM visit_stats WHERE user_id = $1', [targetId])
        await query('DELETE FROM messages WHERE user_id = $1', [targetId])
        await query('DELETE FROM settings WHERE user_id = $1', [targetId])
        await query('DELETE FROM links WHERE user_id = $1', [targetId])
        await query('DELETE FROM profiles WHERE user_id = $1', [targetId])
        await query('DELETE FROM users WHERE id = $1', [targetId])

        const mockIdx = mockUsers.findIndex(u => u.id === targetId)
        if (mockIdx !== -1) mockUsers.splice(mockIdx, 1)
        mockProfilesByUserId.delete(targetId)
        mockLinksByUserId.delete(targetId)
        mockSettingsByUserId.delete(targetId)
        mockMessagesByUserId.delete(targetId)

        invalidateCache('profile')
        return res.json({ success: true, message: 'Kullanıcı ve tüm verileri silindi' })
      }
    } catch (dbError) {
      console.warn('⚠️ [DB Çevrimdışı] Bellekten kullanıcı siliniyor:', dbError.message)
    }

    const mockIdx = mockUsers.findIndex(u => u.id === targetId)
    if (mockIdx !== -1) {
      mockUsers.splice(mockIdx, 1)
      mockProfilesByUserId.delete(targetId)
      mockLinksByUserId.delete(targetId)
      mockSettingsByUserId.delete(targetId)
      mockMessagesByUserId.delete(targetId)
      invalidateCache('profile')
      return res.json({ success: true, message: 'Kullanıcı hesabı başarıyla silindi' })
    }

    res.status(404).json({ error: 'Kullanıcı bulunamadı' })
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error)
    res.status(500).json({ error: 'Kullanıcı silinemedi' })
  }
})

// 6. PUT /api/users/:id (Kullanıcı Bilgilerini Güncelleme - Yalnızca Admin)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10)
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID formatı' })
    }

    const { name, username, email, role, bio, isVerified, status, layoutStyle } = req.body
    const cleanUsername = username !== undefined ? username.trim().toLowerCase().replace(/^@/, '') : undefined

    try {
      const existingRes = await query('SELECT * FROM users WHERE id = $1', [targetId])
      if (existingRes.rows.length > 0) {
        const currentUser = existingRes.rows[0]
        const nextRole = targetId === 1 ? 'admin' : (role !== undefined ? role : currentUser.role)
        const nextStatus = targetId === 1 ? 'active' : (status !== undefined ? status : currentUser.status)
        const nextName = name !== undefined ? name.trim() : currentUser.name
        const nextEmail = email !== undefined ? email.trim().toLowerCase() : currentUser.email
        const nextLoginUsername = (targetId === 1) ? currentUser.username : (cleanUsername || currentUser.username)

        await query(`
          UPDATE users 
          SET name = $1, email = $2, username = $3, role = $4, status = $5, updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
        `, [nextName, nextEmail, nextLoginUsername, nextRole, nextStatus, targetId])

        await query(`
          UPDATE profiles
          SET 
            name = $1,
            username = COALESCE($2, username),
            bio = COALESCE($3, bio),
            is_verified = COALESCE($4, is_verified),
            layout_style = COALESCE($5, layout_style),
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $6
        `, [
          nextName,
          cleanUsername ? `@${cleanUsername}` : null,
          bio !== undefined ? bio : null,
          isVerified !== undefined ? Boolean(isVerified) : null,
          layoutStyle !== undefined ? layoutStyle : null,
          targetId
        ])

        invalidateCache('profile')
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Kullanıcı bellekte güncelleniyor:', dbErr.message)
    }

    const mockIdx = mockUsers.findIndex(u => u.id === targetId)
    if (mockIdx !== -1) {
      const current = mockUsers[mockIdx]
      const updated = {
        ...current,
        name: name !== undefined ? name.trim() : current.name,
        profileUsername: cleanUsername || current.profileUsername || current.username,
        username: targetId === 1 ? current.username : (cleanUsername || current.username),
        email: email !== undefined ? email.trim().toLowerCase() : current.email,
        role: targetId === 1 ? 'admin' : (role !== undefined ? role : current.role),
        bio: bio !== undefined ? bio : current.bio,
        isVerified: isVerified !== undefined ? Boolean(isVerified) : current.isVerified,
        status: targetId === 1 ? 'active' : (status !== undefined ? status : (current.status || 'active')),
        layoutStyle: layoutStyle !== undefined ? layoutStyle : (current.layoutStyle || 'list')
      }
      mockUsers[mockIdx] = updated
      const prof = mockProfilesByUserId.get(targetId)
      if (prof) {
        if (name !== undefined) prof.name = updated.name
        if (cleanUsername) prof.username = `@${cleanUsername}`
        if (bio !== undefined) prof.bio = bio
        if (isVerified !== undefined) prof.isVerified = Boolean(isVerified)
        if (layoutStyle !== undefined) prof.layoutStyle = layoutStyle
      }
      return res.json({ success: true, message: 'Kullanıcı başarıyla güncellendi', data: formatUserSummary(updated) })
    }

    return res.json({ success: true, message: 'Kullanıcı başarıyla güncellendi' })
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error)
    res.status(500).json({ error: 'Kullanıcı güncellenemedi' })
  }
})

// 7. PUT /api/users/:id/toggle-verify (Doğrulama Rozeti Aç/Kapat - Yalnızca Admin)
router.put('/:id/toggle-verify', requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10)
    let nextVerified = null

    try {
      const profRes = await query('SELECT is_verified FROM profiles WHERE user_id = $1', [targetId])
      if (profRes.rows.length > 0) {
        nextVerified = !profRes.rows[0].is_verified
        await query('UPDATE profiles SET is_verified = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [nextVerified, targetId])
        invalidateCache('profile')
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Doğrulama rozeti bellekte değiştiriliyor:', dbErr.message)
    }

    const mockIdx = mockUsers.findIndex(u => u.id === targetId)
    if (mockIdx !== -1) {
      const nextVal = nextVerified !== null ? nextVerified : !mockUsers[mockIdx].isVerified
      mockUsers[mockIdx].isVerified = nextVal
      const prof = mockProfilesByUserId.get(targetId)
      if (prof) prof.isVerified = nextVal
      return res.json({
        success: true,
        message: nextVal ? 'Kullanıcı doğrulandı' : 'Doğrulama rozeti kaldırıldı',
        data: formatUserSummary(mockUsers[mockIdx])
      })
    }

    if (nextVerified !== null) {
      return res.json({
        success: true,
        message: nextVerified ? 'Kullanıcı doğrulandı' : 'Doğrulama rozeti kaldırıldı',
        data: { id: targetId, isVerified: nextVerified }
      })
    }

    res.status(404).json({ error: 'Kullanıcı bulunamadı' })
  } catch (error) {
    res.status(500).json({ error: 'Doğrulama durumu değiştirilemedi' })
  }
})

// 8. PUT /api/users/:id/toggle-status (Hesap Durumu Onayla / Aktifleştir / Askıya Al - Yalnızca Admin)
router.put('/:id/toggle-status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10)
    if (targetId === 1) {
      return res.status(403).json({ error: 'Ana yönetici hesabı askıya alınamaz' })
    }

    let nextStatus = null
    try {
      const userRes = await query('SELECT status FROM users WHERE id = $1', [targetId])
      if (userRes.rows.length > 0) {
        const cur = userRes.rows[0].status || 'active'
        nextStatus = cur === 'active' ? 'suspended' : 'active'
        await query('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [nextStatus, targetId])
        invalidateCache('profile')
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Durum bellekte değiştiriliyor:', dbErr.message)
    }

    const mockIdx = mockUsers.findIndex(u => u.id === targetId)
    if (mockIdx !== -1) {
      const curMock = mockUsers[mockIdx].status || 'active'
      const resolvedStatus = nextStatus || (curMock === 'active' ? 'suspended' : 'active')
      mockUsers[mockIdx].status = resolvedStatus
      return res.json({
        success: true,
        message: resolvedStatus === 'suspended' ? 'Hesap askıya alındı' : 'Hesap aktifleştirildi',
        data: formatUserSummary(mockUsers[mockIdx])
      })
    }

    if (nextStatus !== null) {
      return res.json({
        success: true,
        message: nextStatus === 'suspended' ? 'Hesap askıya alındı' : 'Hesap aktifleştirildi',
        data: { id: targetId, status: nextStatus }
      })
    }

    res.status(404).json({ error: 'Kullanıcı bulunamadı' })
  } catch (error) {
    res.status(500).json({ error: 'Hesap durumu değiştirilemedi' })
  }
})

// 9. POST /api/users/batch (Toplu Kullanıcı İşlemleri - Yalnızca Admin)
router.post('/batch', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { ids, action } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'İşlem yapılacak kullanıcılar belirtilmedi' })
    }

    const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
    let affectedCount = 0

    try {
      for (const targetId of numericIds) {
        if (action === 'verify') {
          const r = await query('UPDATE profiles SET is_verified = true WHERE user_id = $1', [targetId])
          affectedCount += r.rowCount || 0
        } else if (action === 'unverify') {
          const r = await query('UPDATE profiles SET is_verified = false WHERE user_id = $1', [targetId])
          affectedCount += r.rowCount || 0
        } else if (action === 'suspend' && targetId !== 1) {
          const r = await query("UPDATE users SET status = 'suspended' WHERE id = $1", [targetId])
          affectedCount += r.rowCount || 0
        } else if (action === 'activate' || action === 'approve') {
          const r = await query("UPDATE users SET status = 'active' WHERE id = $1", [targetId])
          affectedCount += r.rowCount || 0
        } else if (action === 'delete' && targetId !== 1) {
          await query('DELETE FROM click_events WHERE user_id = $1', [targetId])
          await query('DELETE FROM visit_stats WHERE user_id = $1', [targetId])
          await query('DELETE FROM messages WHERE user_id = $1', [targetId])
          await query('DELETE FROM settings WHERE user_id = $1', [targetId])
          await query('DELETE FROM links WHERE user_id = $1', [targetId])
          await query('DELETE FROM profiles WHERE user_id = $1', [targetId])
          const r = await query('DELETE FROM users WHERE id = $1', [targetId])
          affectedCount += r.rowCount || 0
        }
      }
      invalidateCache('profile')
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Toplu işlem bellekten yürütülüyor:', dbErr.message)
    }

    let mockAffected = 0
    numericIds.forEach(targetId => {
      const u = mockUsers.find(x => x.id === targetId)
      if (!u) return
      if (action === 'verify') {
        u.isVerified = true
        const p = mockProfilesByUserId.get(targetId)
        if (p) p.isVerified = true
        mockAffected++
      } else if (action === 'unverify') {
        u.isVerified = false
        const p = mockProfilesByUserId.get(targetId)
        if (p) p.isVerified = false
        mockAffected++
      } else if (action === 'suspend' && targetId !== 1) {
        u.status = 'suspended'
        mockAffected++
      } else if (action === 'activate' || action === 'approve') {
        u.status = 'active'
        mockAffected++
      } else if (action === 'delete' && targetId !== 1) {
        const idx = mockUsers.findIndex(x => x.id === targetId)
        if (idx !== -1) {
          mockUsers.splice(idx, 1)
          mockAffected++
        }
      }
    })

    const finalCount = Math.max(affectedCount, mockAffected)
    res.json({ success: true, message: `${finalCount} kullanıcı üzerinde işlem tamamlandı`, affectedCount: finalCount })
  } catch (error) {
    res.status(500).json({ error: 'Toplu işlem gerçekleştirilemedi' })
  }
})

export default router

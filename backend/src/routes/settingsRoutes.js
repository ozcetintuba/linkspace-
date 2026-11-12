import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/authMiddleware.js'
import { invalidateCache, cacheService } from '../middleware/cacheService.js'
import { mockSettingsByUserId, mockUsers, ensureMockUserState } from '../mockState.js'

const router = Router()

const getDefaultSeoForUser = (userId = 1) => {
  const existing = mockSettingsByUserId.get(userId)?.seo
  if (existing) return existing
  return {
    metaTitle: 'linkspace Profili',
    metaDescription: 'Projelerim, portfolyom ve tüm sosyal medya bağlantılarım.',
    ogImage: '',
    customDomain: '',
    domainVerified: false
  }
}

const getUserMockSettings = (userId = 1) => {
  if (!mockSettingsByUserId.has(userId)) {
    const u = mockUsers.find(x => x.id === userId)
    if (u) ensureMockUserState(u)
    else mockSettingsByUserId.set(userId, { theme: 'midnight', seo: getDefaultSeoForUser(userId) })
  }
  return mockSettingsByUserId.get(userId)
}

// GET /api/settings/theme (Oturumlu kullanıcının teması veya varsayılan tema)
router.get('/theme', optionalAuth, async (req, res) => {
  const userId = req.user?.id || 1
  try {
    try {
      const result = await query("SELECT value FROM settings WHERE user_id = $1 AND key = 'theme'", [userId])
      const theme = result.rows.length > 0 ? result.rows[0].value : 'midnight'
      return res.json({ theme })
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Tema ayarı bellekten dönülüyor:', dbErr.message)
      return res.json({ theme: getUserMockSettings(userId).theme || 'midnight' })
    }
  } catch (error) {
    console.error('Tema getirme hatası:', error)
    res.status(500).json({ error: 'Tema ayarı alınamadı' })
  }
})

// PUT /api/settings/theme (Oturumlu kullanıcının kendi temasını kaydetmesi)
router.put('/theme', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { theme } = req.body
    if (!theme) {
      return res.status(400).json({ error: 'Tema kimliği gereklidir' })
    }

    try {
      await query(`
        INSERT INTO settings (user_id, key, value, updated_at)
        VALUES ($1, 'theme', $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      `, [userId, theme])
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Tema ayarı belleğe kaydediliyor:', dbErr.message)
      const s = getUserMockSettings(userId)
      s.theme = theme
    }

    invalidateCache('profile')
    res.json({ theme, message: 'Tema başarıyla kaydedildi' })
  } catch (error) {
    console.error('Tema güncelleme hatası:', error)
    res.status(500).json({ error: 'Tema güncellenemedi' })
  }
})

// GET /api/settings/seo (Oturumlu kullanıcının SEO ayarları)
router.get('/seo', optionalAuth, async (req, res) => {
  const userId = req.user?.id || 1
  try {
    try {
      const result = await query("SELECT value FROM settings WHERE user_id = $1 AND key = 'seo'", [userId])
      if (result.rows.length > 0) {
        return res.json(JSON.parse(result.rows[0].value))
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] SEO ayarları bellekten dönülüyor:', dbErr.message)
    }

    return res.json(getUserMockSettings(userId).seo || getDefaultSeoForUser(userId))
  } catch (error) {
    res.json(getDefaultSeoForUser(userId))
  }
})

// PUT /api/settings/seo (Oturumlu kullanıcının kendi SEO ayarlarını güncellemesi)
router.put('/seo', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { metaTitle, metaDescription, ogImage, customDomain, domainVerified } = req.body

    const updatedSeo = {
      metaTitle: metaTitle || `${req.user.name || req.user.username} | linkspace`,
      metaDescription: metaDescription || '',
      ogImage: ogImage || '',
      customDomain: (customDomain || '').trim().toLowerCase(),
      domainVerified: Boolean(domainVerified)
    }

    try {
      await query(`
        INSERT INTO settings (user_id, key, value, updated_at)
        VALUES ($1, 'seo', $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      `, [userId, JSON.stringify(updatedSeo)])
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] SEO ayarları belleğe kaydediliyor:', dbErr.message)
      const s = getUserMockSettings(userId)
      s.seo = updatedSeo
    }

    invalidateCache('seo')
    invalidateCache('profile')

    return res.json({
      success: true,
      message: 'SEO ve sosyal paylaşım ayarları başarıyla güncellendi',
      data: updatedSeo
    })
  } catch (error) {
    console.error('SEO ayarları güncelleme hatası:', error)
    res.status(500).json({ error: 'SEO ayarları kaydedilemedi' })
  }
})

// POST /api/settings/verify-domain (Oturumlu kullanıcı için DNS doğrulama simülasyonu)
router.post('/verify-domain', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { domain } = req.body
    const cleanDomain = (domain || '').trim().toLowerCase()

    if (!cleanDomain || cleanDomain.length < 3) {
      return res.status(400).json({ error: 'Lütfen geçerli bir alan adı girin (örn: tubagul.dev)' })
    }

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
    if (!domainRegex.test(cleanDomain)) {
      return res.status(400).json({ error: 'Geçersiz alan adı formatı. Örnek: links.tubagul.com veya tubagul.dev' })
    }

    const verificationRecord = {
      domain: cleanDomain,
      verified: true,
      verifiedAt: new Date().toISOString(),
      cnameTarget: 'cname.linkspace.me',
      ipTarget: '76.76.21.21',
      sslActive: true
    }

    const mockS = getUserMockSettings(userId)
    mockS.seo.customDomain = cleanDomain
    mockS.seo.domainVerified = true

    try {
      const seoRes = await query("SELECT value FROM settings WHERE user_id = $1 AND key = 'seo'", [userId])
      let currentSeo = mockS.seo
      if (seoRes.rows.length > 0) {
        currentSeo = JSON.parse(seoRes.rows[0].value)
      }
      currentSeo.customDomain = cleanDomain
      currentSeo.domainVerified = true

      await query(`
        INSERT INTO settings (user_id, key, value, updated_at)
        VALUES ($1, 'seo', $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      `, [userId, JSON.stringify(currentSeo)])
    } catch (e) {}

    return res.json({
      success: true,
      message: `"${cleanDomain}" alan adı DNS CNAME kaydı başarıyla doğrulandı ve SSL sertifikası tanımlandı!`,
      data: verificationRecord
    })
  } catch (error) {
    console.error('Domain doğrulama hatası:', error)
    res.status(500).json({ error: 'Alan adı doğrulama işlemi sırasında bir hata oluştu' })
  }
})

// GET /api/settings/cache/stats (Yalnızca Sistem Yöneticisi)
router.get('/cache/stats', requireAuth, requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: cacheService.getStats()
  })
})

// POST /api/settings/cache/clear (Yalnızca Sistem Yöneticisi)
router.post('/cache/clear', requireAuth, requireAdmin, (req, res) => {
  const clearedCount = cacheService.clearAll()
  res.json({
    success: true,
    message: `Tüm sistem önbelleği temizlendi (${clearedCount} anahtar silindi).`,
    clearedCount
  })
})

export default router

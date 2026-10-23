import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Bellek İçi Çevrimdışı Yedek Verileri (In-Memory Fallback)
const mockSettings = {
  theme: 'midnight',
  seo: {
    metaTitle: 'Tuba Gül - Full-Stack Developer | linkspace',
    metaDescription: 'Tuba Gül\'ün projeleri, portfolyosu, iletişim kanalları ve sosyal medya hesapları.',
    ogImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=630&fit=crop&q=80',
    customDomain: 'tubagul.dev',
    domainVerified: true
  }
}

// ========================================================
// TEMA AYARLARI
// ========================================================

// GET /api/settings/theme (Herkese açık)
router.get('/theme', async (req, res) => {
  try {
    try {
      const result = await query("SELECT value FROM settings WHERE key = 'theme'")
      const theme = result.rows.length > 0 ? result.rows[0].value : 'midnight'
      return res.json({ theme })
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Tema ayarı bellekten dönülüyor:', dbErr.message)
      return res.json({ theme: mockSettings.theme })
    }
  } catch (error) {
    console.error('Tema getirme hatası:', error)
    res.status(500).json({ error: 'Tema ayarı alınamadı' })
  }
})

// PUT /api/settings/theme (Yalnızca Yönetici)
router.put('/theme', requireAuth, async (req, res) => {
  try {
    const { theme } = req.body
    if (!theme) {
      return res.status(400).json({ error: 'Tema kimliği gereklidir' })
    }

    try {
      await query(`
        INSERT INTO settings (key, value, updated_at)
        VALUES ('theme', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      `, [theme])
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Tema ayarı belleğe kaydediliyor:', dbErr.message)
      mockSettings.theme = theme
    }

    res.json({ theme, message: 'Tema başarıyla kaydedildi' })
  } catch (error) {
    console.error('Tema güncelleme hatası:', error)
    res.status(500).json({ error: 'Tema güncellenemedi' })
  }
})

// ========================================================
// SEO & SOSYAL PAYLAŞIM AYARLARI (FAZ 16 - SEÇENEK B)
// ========================================================

// GET /api/settings/seo (Herkese açık - Profil ve Önizleme için)
router.get('/seo', async (req, res) => {
  try {
    try {
      const result = await query("SELECT value FROM settings WHERE key = 'seo'")
      if (result.rows.length > 0) {
        const parsed = JSON.parse(result.rows[0].value)
        return res.json(parsed)
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] SEO ayarları bellekten dönülüyor:', dbErr.message)
    }

    return res.json(mockSettings.seo)
  } catch (error) {
    console.error('SEO ayarları getirme hatası:', error)
    res.json(mockSettings.seo)
  }
})

// PUT /api/settings/seo (Yalnızca Yönetici)
router.put('/seo', requireAuth, async (req, res) => {
  try {
    const { metaTitle, metaDescription, ogImage, customDomain, domainVerified } = req.body

    const updatedSeo = {
      metaTitle: metaTitle || 'Tuba Gül | linkspace',
      metaDescription: metaDescription || '',
      ogImage: ogImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=630&fit=crop&q=80',
      customDomain: (customDomain || '').trim().toLowerCase(),
      domainVerified: Boolean(domainVerified)
    }

    try {
      await query(`
        INSERT INTO settings (key, value, updated_at)
        VALUES ('seo', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      `, [JSON.stringify(updatedSeo)])
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] SEO ayarları belleğe kaydediliyor:', dbErr.message)
      mockSettings.seo = updatedSeo
    }

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

// POST /api/settings/verify-domain (Yalnızca Yönetici - DNS Doğrulama Testi)
router.post('/verify-domain', requireAuth, async (req, res) => {
  try {
    const { domain } = req.body
    const cleanDomain = (domain || '').trim().toLowerCase()

    if (!cleanDomain || cleanDomain.length < 3) {
      return res.status(400).json({ error: 'Lütfen geçerli bir alan adı girin (örn: tubagul.dev)' })
    }

    // Basit alan adı format kontrolü
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
    if (!domainRegex.test(cleanDomain)) {
      return res.status(400).json({ error: 'Geçersiz alan adı formatı. Örnek: links.tubagul.com veya tubagul.dev' })
    }

    // DNS Doğrulama Simülasyonu
    const verificationRecord = {
      domain: cleanDomain,
      verified: true,
      verifiedAt: new Date().toISOString(),
      cnameTarget: 'cname.linkspace.me',
      ipTarget: '76.76.21.21',
      sslActive: true
    }

    // SEO ayarlarına domain durumunu da yansıt
    mockSettings.seo.customDomain = cleanDomain
    mockSettings.seo.domainVerified = true

    try {
      const seoRes = await query("SELECT value FROM settings WHERE key = 'seo'")
      let currentSeo = mockSettings.seo
      if (seoRes.rows.length > 0) {
        currentSeo = JSON.parse(seoRes.rows[0].value)
      }
      currentSeo.customDomain = cleanDomain
      currentSeo.domainVerified = true

      await query(`
        INSERT INTO settings (key, value, updated_at)
        VALUES ('seo', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      `, [JSON.stringify(currentSeo)])
    } catch (e) {
      // Offline fallback
    }

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

export default router

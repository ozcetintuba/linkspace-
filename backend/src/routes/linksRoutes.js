import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { invalidateCache } from '../middleware/cacheService.js'

const router = Router()

// Varsayılan bellek içi linkler (DB çevrimdışı fallback)
const mockLinks = [
  {
    id: 1,
    title: 'Kişisel Web Sitem & Portfolyom',
    url: 'https://github.com/tubaaa7',
    isActive: true,
    icon: 'globe',
    customColor: 'default',
    clicks: 12,
    orderIndex: 0,
    category: '🌐 Web & Portfolyo',
    embedType: 'none',
    showEmbed: false,
    isLocked: false
  },
  {
    id: 2,
    title: 'GitHub Açık Kaynak Projelerim',
    url: 'https://github.com/tubaaa7/linkspace-',
    isActive: true,
    icon: 'github',
    customColor: 'emerald',
    clicks: 38,
    orderIndex: 1,
    category: '🚀 Projeler & Kod',
    embedType: 'none',
    showEmbed: false,
    isLocked: false
  },
  {
    id: 3,
    title: 'Lo-Fi Chill Beats (Spotify)',
    url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    isActive: true,
    icon: 'music',
    customColor: 'emerald',
    clicks: 19,
    orderIndex: 2,
    category: '📚 Kaynaklar & Yayınlar',
    embedType: 'spotify',
    showEmbed: true,
    isLocked: false
  },
  {
    id: 4,
    title: 'VIP Kodlama & Discord Topluluğu',
    url: 'https://discord.com',
    isActive: true,
    icon: 'lock',
    customColor: 'purple',
    clicks: 44,
    orderIndex: 3,
    category: '💼 Sosyal Medya & İletişim',
    embedType: 'none',
    showEmbed: false,
    isLocked: true,
    lockType: 'pin',
    passcode: '1234',
    lockWarning: 'Bu bağlantıya sadece davetli üyeler erişebilir. Şifre: 1234'
  }
]

// GET /api/links (Tüm linkleri sıralı getir)
router.get('/', async (req, res) => {
  try {
    try {
      const result = await query(`
        SELECT 
          id, 
          title, 
          url, 
          is_active AS "isActive", 
          icon, 
          custom_color AS "customColor",
          clicks, 
          order_index AS "orderIndex",
          COALESCE(is_scheduled, false) AS "isScheduled",
          schedule_start AS "scheduleStart",
          schedule_end AS "scheduleEnd",
          COALESCE(show_countdown, true) AS "showCountdown",
          COALESCE(category, '') AS "category",
          COALESCE(embed_type, 'none') AS "embedType",
          COALESCE(show_embed, false) AS "showEmbed",
          COALESCE(is_locked, false) AS "isLocked",
          COALESCE(lock_type, 'pin') AS "lockType",
          COALESCE(passcode, '') AS "passcode",
          COALESCE(lock_warning, '') AS "lockWarning",
          COALESCE(is_header, false) AS "isHeader",
          COALESCE(ab_test_enabled, false) AS "abTestEnabled",
          COALESCE(title_b, '') AS "titleB",
          COALESCE(url_b, '') AS "urlB",
          COALESCE(clicks_a, 0) AS "clicksA",
          COALESCE(clicks_b, 0) AS "clicksB",
          COALESCE(views_a, 0) AS "viewsA",
          COALESCE(views_b, 0) AS "viewsB"
        FROM links 
        ORDER BY order_index ASC, id DESC
      `)
      return res.json(result.rows)
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Linkler bellekten dönülüyor:', dbErr.message)
      return res.json(mockLinks)
    }
  } catch (error) {
    console.error('Linkleri getirme hatası:', error)
    res.json(mockLinks)
  }
})

// Güvenli ve Geçerli URL Doğrulama Yardımcısı (XSS ve Zararlı Protokol Koruması)
export const isValidUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return false
  const trimmed = urlStr.trim()

  // Tehlikeli protokollere (XSS) kesinlikle izin verme
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i
  if (dangerousProtocols.test(trimmed)) {
    return false
  }

  // mailto: ve tel: protokolleri için özel kontrol
  if (/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(trimmed)) {
    return true
  }
  if (/^tel:\+?[0-9\s\-()]{4,20}$/i.test(trimmed)) {
    return true
  }

  // Web URL kontrolü (http://, https:// veya doğrudan domain.com)
  const webUrlRegex = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?$/i
  return webUrlRegex.test(trimmed)
}

// POST /api/links (Yeni link ekle: title, url, order_index, is_active - Yalnızca Yönetici)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      title, 
      url, 
      icon, 
      customColor, 
      orderIndex, 
      isActive, 
      isScheduled, 
      scheduleStart, 
      scheduleEnd, 
      showCountdown, 
      category,
      embedType,
      showEmbed,
      isLocked,
      lockType,
      passcode,
      lockWarning,
      isHeader,
      abTestEnabled,
      titleB,
      urlB
    } = req.body

    const finalIsHeader = Boolean(isHeader)
    if (!title) {
      return res.status(400).json({ error: 'Başlık zorunludur' })
    }

    if (!finalIsHeader && !url) {
      return res.status(400).json({ error: 'URL zorunludur' })
    }

    if (!finalIsHeader && !isValidUrl(url)) {
      return res.status(400).json({ 
        error: 'Geçersiz veya güvensiz URL formatı. Lütfen geçerli bir web adresi girin (örn: https://ornek.com).' 
      })
    }

    const trimmedUrl = (url || '').trim()
    const formattedUrl = finalIsHeader 
      ? '' 
      : ((trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('mailto:') || trimmedUrl.startsWith('tel:'))
        ? trimmedUrl 
        : `https://${trimmedUrl}`)

    const finalAbTestEnabled = Boolean(abTestEnabled)
    const finalTitleB = titleB !== undefined ? String(titleB).trim() : ''
    let finalUrlB = (urlB || '').trim()
    if (finalUrlB && !finalUrlB.startsWith('http://') && !finalUrlB.startsWith('https://')) {
      finalUrlB = `https://${finalUrlB}`
    }

    // Mevcut en küçük order_index değerinden 1 küçük yap veya 0 ata (en üste eklensin)
    const minOrderResult = await query('SELECT MIN(order_index) as min_order FROM links')
    const calculatedOrder = (minOrderResult.rows[0].min_order ?? 0) - 1
    const nextOrder = orderIndex !== undefined ? parseInt(orderIndex, 10) : calculatedOrder
    const finalIsActive = isActive !== undefined ? Boolean(isActive) : true
    const finalIsScheduled = Boolean(isScheduled)
    const finalScheduleStart = scheduleStart ? new Date(scheduleStart) : null
    const finalScheduleEnd = scheduleEnd ? new Date(scheduleEnd) : null
    const finalShowCountdown = showCountdown !== undefined ? Boolean(showCountdown) : true
    const finalCategory = category !== undefined ? String(category).trim() : ''
    const finalEmbedType = embedType || 'none'
    const finalShowEmbed = Boolean(showEmbed)
    const finalIsLocked = Boolean(isLocked)
    const finalLockType = lockType || 'pin'
    const finalPasscode = passcode !== undefined ? String(passcode).trim() : ''
    const finalLockWarning = lockWarning !== undefined ? String(lockWarning).trim() : ''
    const newId = Date.now()

    const result = await query(`
      INSERT INTO links (
        id, title, url, is_active, icon, custom_color, clicks, order_index, 
        is_scheduled, schedule_start, schedule_end, show_countdown, category,
        embed_type, show_embed, is_locked, lock_type, passcode, lock_warning,
        is_header, ab_test_enabled, title_b, url_b, clicks_a, clicks_b, views_a, views_b
      )
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 0, 0, 0, 0)
      RETURNING 
        id, title, url, is_active AS "isActive", icon, custom_color AS "customColor", 
        clicks, order_index AS "orderIndex", is_scheduled AS "isScheduled", 
        schedule_start AS "scheduleStart", schedule_end AS "scheduleEnd", 
        show_countdown AS "showCountdown", COALESCE(category, '') AS "category",
        COALESCE(embed_type, 'none') AS "embedType", COALESCE(show_embed, false) AS "showEmbed",
        COALESCE(is_locked, false) AS "isLocked", COALESCE(lock_type, 'pin') AS "lockType",
        COALESCE(passcode, '') AS "passcode", COALESCE(lock_warning, '') AS "lockWarning",
        COALESCE(is_header, false) AS "isHeader",
        COALESCE(ab_test_enabled, false) AS "abTestEnabled",
        COALESCE(title_b, '') AS "titleB",
        COALESCE(url_b, '') AS "urlB",
        COALESCE(clicks_a, 0) AS "clicksA",
        COALESCE(clicks_b, 0) AS "clicksB",
        COALESCE(views_a, 0) AS "viewsA",
        COALESCE(views_b, 0) AS "viewsB"
    `, [
      newId, title.trim(), formattedUrl.trim(), finalIsActive, icon || null, customColor || 'default', 
      nextOrder, finalIsScheduled, finalScheduleStart, finalScheduleEnd, finalShowCountdown, finalCategory,
      finalEmbedType, finalShowEmbed, finalIsLocked, finalLockType, finalPasscode, finalLockWarning,
      finalIsHeader, finalAbTestEnabled, finalTitleB, finalUrlB
    ])

    invalidateCache('profile')
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Link ekleme hatası:', error)
    res.status(500).json({ error: 'Bağlantı eklenemedi' })
  }
})

// PUT /api/links/:id (Link güncelle - Yalnızca Yönetici)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { 
      title, 
      url, 
      isActive, 
      icon, 
      customColor, 
      isScheduled, 
      scheduleStart, 
      scheduleEnd, 
      showCountdown, 
      category,
      embedType,
      showEmbed,
      isLocked,
      lockType,
      passcode,
      lockWarning,
      isHeader,
      abTestEnabled,
      titleB,
      urlB
    } = req.body

    const existing = await query('SELECT * FROM links WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Bağlantı bulunamadı' })
    }

    const current = existing.rows[0]
    const updatedTitle = title !== undefined ? title.trim() : current.title
    const updatedIsHeader = isHeader !== undefined ? Boolean(isHeader) : Boolean(current.is_header)

    let updatedUrl = current.url
    if (url !== undefined) {
      if (!updatedIsHeader && !isValidUrl(url)) {
        return res.status(400).json({ 
          error: 'Geçersiz veya güvensiz URL formatı. Lütfen geçerli bir web adresi girin (örn: https://ornek.com).' 
        })
      }
      const trimmed = url.trim()
      updatedUrl = updatedIsHeader
        ? ''
        : ((trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) 
          ? trimmed 
          : `https://${trimmed}`)
    }

    const updatedAbTestEnabled = abTestEnabled !== undefined ? Boolean(abTestEnabled) : Boolean(current.ab_test_enabled)
    const updatedTitleB = titleB !== undefined ? String(titleB).trim() : (current.title_b || '')
    let updatedUrlB = urlB !== undefined ? String(urlB).trim() : (current.url_b || '')
    if (updatedUrlB && !updatedUrlB.startsWith('http://') && !updatedUrlB.startsWith('https://')) {
      updatedUrlB = `https://${updatedUrlB}`
    }

    const updatedIsActive = isActive !== undefined ? isActive : current.is_active
    const updatedIcon = icon !== undefined ? icon : current.icon
    const updatedCustomColor = customColor !== undefined ? customColor : (current.custom_color || 'default')
    const updatedIsScheduled = isScheduled !== undefined ? Boolean(isScheduled) : Boolean(current.is_scheduled)
    const updatedScheduleStart = scheduleStart !== undefined ? (scheduleStart ? new Date(scheduleStart) : null) : current.schedule_start
    const updatedScheduleEnd = scheduleEnd !== undefined ? (scheduleEnd ? new Date(scheduleEnd) : null) : current.schedule_end
    const updatedShowCountdown = showCountdown !== undefined ? Boolean(showCountdown) : (current.show_countdown !== false)
    const updatedCategory = category !== undefined ? String(category).trim() : (current.category || '')
    const updatedEmbedType = embedType !== undefined ? embedType : (current.embed_type || 'none')
    const updatedShowEmbed = showEmbed !== undefined ? Boolean(showEmbed) : Boolean(current.show_embed)
    const updatedIsLocked = isLocked !== undefined ? Boolean(isLocked) : Boolean(current.is_locked)
    const updatedLockType = lockType !== undefined ? lockType : (current.lock_type || 'pin')
    const updatedPasscode = passcode !== undefined ? String(passcode).trim() : (current.passcode || '')
    const updatedLockWarning = lockWarning !== undefined ? String(lockWarning).trim() : (current.lock_warning || '')

    const result = await query(`
      UPDATE links
      SET 
        title = $1, url = $2, is_active = $3, icon = $4, custom_color = $5, 
        is_scheduled = $6, schedule_start = $7, schedule_end = $8, show_countdown = $9, 
        category = $10, embed_type = $11, show_embed = $12, is_locked = $13, 
        lock_type = $14, passcode = $15, lock_warning = $16,
        is_header = $17, ab_test_enabled = $18, title_b = $19, url_b = $20,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $21
      RETURNING 
        id, title, url, is_active AS "isActive", icon, custom_color AS "customColor", 
        clicks, order_index AS "orderIndex", is_scheduled AS "isScheduled", 
        schedule_start AS "scheduleStart", schedule_end AS "scheduleEnd", 
        show_countdown AS "showCountdown", COALESCE(category, '') AS "category",
        COALESCE(embed_type, 'none') AS "embedType", COALESCE(show_embed, false) AS "showEmbed",
        COALESCE(is_locked, false) AS "isLocked", COALESCE(lock_type, 'pin') AS "lockType",
        COALESCE(passcode, '') AS "passcode", COALESCE(lock_warning, '') AS "lockWarning",
        COALESCE(is_header, false) AS "isHeader",
        COALESCE(ab_test_enabled, false) AS "abTestEnabled",
        COALESCE(title_b, '') AS "titleB",
        COALESCE(url_b, '') AS "urlB",
        COALESCE(clicks_a, 0) AS "clicksA",
        COALESCE(clicks_b, 0) AS "clicksB",
        COALESCE(views_a, 0) AS "viewsA",
        COALESCE(views_b, 0) AS "viewsB"
    `, [
      updatedTitle, updatedUrl, updatedIsActive, updatedIcon, updatedCustomColor, 
      updatedIsScheduled, updatedScheduleStart, updatedScheduleEnd, updatedShowCountdown, 
      updatedCategory, updatedEmbedType, updatedShowEmbed, updatedIsLocked, 
      updatedLockType, updatedPasscode, updatedLockWarning,
      updatedIsHeader, updatedAbTestEnabled, updatedTitleB, updatedUrlB, id
    ])

    invalidateCache('profile')
    res.json(result.rows[0])
  } catch (error) {
    console.error('Link güncelleme hatası:', error)
    res.status(500).json({ error: 'Bağlantı güncellenemedi' })
  }
})

// DELETE /api/links/:id (Link sil - Yalnızca Yönetici)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const result = await query('DELETE FROM links WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Silinecek bağlantı bulunamadı' })
    }

    invalidateCache('profile')
    res.json({ message: 'Bağlantı başarıyla silindi', id: result.rows[0].id })
  } catch (error) {
    console.error('Link silme hatası:', error)
    res.status(500).json({ error: 'Bağlantı silinemedi' })
  }
})

// POST /api/links/:id/click (Tıklanma sayısını 1 artır - Atomic + A/B Varyantı + Ayrıntılı Analitik Olay Kaydı)
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params
    const { referrer = '', device = '', variant = 'a' } = req.body || {}
    const isVariantB = variant === 'b'

    // 1. Sayaç güncelle (Genel clicks + A/B varyant sayacı)
    const result = isVariantB
      ? await query(`
          UPDATE links
          SET clicks = clicks + 1, clicks_b = clicks_b + 1
          WHERE id = $1
          RETURNING id, clicks, clicks_a AS "clicksA", clicks_b AS "clicksB"
        `, [id])
      : await query(`
          UPDATE links
          SET clicks = clicks + 1, clicks_a = clicks_a + 1
          WHERE id = $1
          RETURNING id, clicks, clicks_a AS "clicksA", clicks_b AS "clicksB"
        `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bağlantı bulunamadı' })
    }

    // 2. Yönlendiren kaynağı akıllı tespit et (Instagram, Twitter/X, LinkedIn, GitHub, Direct, QR)
    const rawReferrer = (referrer || req.headers['referer'] || '').toLowerCase()
    let detectedSource = 'direct'
    if (rawReferrer.includes('instagram')) detectedSource = 'instagram'
    else if (rawReferrer.includes('twitter') || rawReferrer.includes('t.co') || rawReferrer.includes('x.com')) detectedSource = 'twitter'
    else if (rawReferrer.includes('linkedin')) detectedSource = 'linkedin'
    else if (rawReferrer.includes('github')) detectedSource = 'github'
    else if (rawReferrer.includes('qr') || rawReferrer.includes('src=qr')) detectedSource = 'qr'

    // 3. Cihaz tipi ve IP tespiti
    const userAgent = req.headers['user-agent'] || ''
    const detectedDevice = device || (/mobile|android|iphone|ipad|ipod/i.test(userAgent) ? 'mobile' : 'desktop')
    const ipAddress = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim()

    // 4. Ayrıntılı tıklama olayını click_events tablosuna asenkron kaydet (varyant bilgisiyle birlikte)
    await query(`
      INSERT INTO click_events (link_id, referrer, device, ip_address, user_agent, variant)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, detectedSource, detectedDevice, ipAddress, userAgent, isVariantB ? 'b' : 'a']).catch(e => {
      console.warn('⚠️ click_events tablosuna log kaydedilemedi:', e.message)
    })

    res.json(result.rows[0])
  } catch (error) {
    console.warn('Veritabanı çevrimdışı, tıklama istemci tarafında tutuluyor:', error.message)
    res.json({ id: parseInt(req.params.id) || req.params.id, success: true, offline: true })
  }
})

// POST /api/links/:id/impression (A/B Testi Varyant Görüntülenme Sayacı)
router.post('/:id/impression', async (req, res) => {
  try {
    const { id } = req.params
    const { variant = 'a' } = req.body || {}
    if (variant === 'b') {
      await query('UPDATE links SET views_b = views_b + 1 WHERE id = $1', [id])
    } else {
      await query('UPDATE links SET views_a = views_a + 1 WHERE id = $1', [id])
    }
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false })
  }
})

// PUT & POST /api/links/reorder (Sıralama değiştiğinde toplu order_index güncellemesi - Yalnızca Yönetici)
const handleReorder = async (req, res) => {
  try {
    const { orderedIds, links } = req.body

    // orderedIds veya links dizisi desteği
    let ids = orderedIds
    if (!ids && Array.isArray(links)) {
      ids = links.map(l => (typeof l === 'object' && l !== null ? l.id : l))
    }

    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'orderedIds veya links bir dizi olmalıdır' })
    }

    // Sıralamayı toplu güncelle (transaction içinde)
    await query('BEGIN')
    for (let index = 0; index < ids.length; index++) {
      await query('UPDATE links SET order_index = $1 WHERE id = $2', [index, ids[index]])
    }
    await query('COMMIT')

    invalidateCache('profile')
    res.json({ message: 'Sıralama başarıyla kaydedildi' })
  } catch (error) {
    await query('ROLLBACK')
    console.error('Sıralama güncelleme hatası:', error)
    res.status(500).json({ error: 'Sıralama güncellenemedi' })
  }
}

router.put('/reorder', requireAuth, handleReorder)
router.post('/reorder', requireAuth, handleReorder)

// POST /api/links/reset-clicks (Tıklama sayaçlarını sıfırla - Yalnızca Yönetici)
router.post('/reset-clicks', requireAuth, async (req, res) => {
  try {
    const { id } = req.body

    invalidateCache('profile')
    if (id) {
      await query('UPDATE links SET clicks = 0 WHERE id = $1', [id])
      res.json({ message: 'Bağlantı tıklama sayacı sıfırlandı' })
    } else {
      await query('UPDATE links SET clicks = 0')
      res.json({ message: 'Tüm tıklama sayaçları sıfırlandı' })
    }
  } catch (error) {
    console.error('Tıklama sıfırlama hatası:', error)
    res.status(500).json({ error: 'Tıklama sıfırlanamadı' })
  }
})

export default router

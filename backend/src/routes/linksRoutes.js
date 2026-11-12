import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js'
import { invalidateCache } from '../middleware/cacheService.js'
import { mockLinksByUserId, mockUsers, ensureMockUserState } from '../mockState.js'

const router = Router()

const LINK_SELECT_COLUMNS = `
  id,
  user_id AS "userId",
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
  COALESCE(views_b, 0) AS "viewsB",
  COALESCE(grid_span, 'full') AS "gridSpan",
  COALESCE(thumbnail, '') AS "thumbnail",
  COALESCE(card_badge, '') AS "cardBadge"
`

const getUserMockLinks = (userId) => {
  const id = userId || 1
  if (!mockLinksByUserId.has(id)) {
    const u = mockUsers.find(x => x.id === id)
    if (u) ensureMockUserState(u)
    else mockLinksByUserId.set(id, [])
  }
  return mockLinksByUserId.get(id) || []
}

// GET /api/links (Oturumlu kullanıcının kendi bağlantılarını sıralı getir)
router.get('/', optionalAuth, async (req, res) => {
  const targetUserId = req.user?.id || 1
  try {
    try {
      const result = await query(`
        SELECT ${LINK_SELECT_COLUMNS}
        FROM links 
        WHERE user_id = $1
        ORDER BY order_index ASC, id DESC
      `, [targetUserId])
      return res.json(result.rows)
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Linkler bellekten dönülüyor:', dbErr.message)
      return res.json(getUserMockLinks(targetUserId))
    }
  } catch (error) {
    console.error('Linkleri getirme hatası:', error)
    res.json(getUserMockLinks(targetUserId))
  }
})

// Güvenli ve Geçerli URL Doğrulama Yardımcısı (XSS ve Zararlı Protokol Koruması)
export const isValidUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return false
  const trimmed = urlStr.trim()

  const dangerousProtocols = /^(javascript|data|vbscript|file):/i
  if (dangerousProtocols.test(trimmed)) {
    return false
  }

  if (/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(trimmed)) {
    return true
  }
  if (/^tel:\+?[0-9\s\-()]{4,20}$/i.test(trimmed)) {
    return true
  }

  const webUrlRegex = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?$/i
  return webUrlRegex.test(trimmed)
}

// POST /api/links (Oturumlu kullanıcı için yeni bağlantı ekle)
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
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
      urlB,
      gridSpan,
      thumbnail,
      cardBadge
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

    const newId = Date.now()
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
    const finalGridSpan = gridSpan || 'full'
    const finalThumbnail = thumbnail ? String(thumbnail).trim() : ''
    const finalCardBadge = cardBadge ? String(cardBadge).trim() : ''

    try {
      const minOrderResult = await query('SELECT MIN(order_index) as min_order FROM links WHERE user_id = $1', [userId])
      const calculatedOrder = (minOrderResult.rows[0].min_order ?? 0) - 1
      const nextOrder = orderIndex !== undefined ? parseInt(orderIndex, 10) : calculatedOrder

      const result = await query(`
        INSERT INTO links (
          id, user_id, title, url, is_active, icon, custom_color, clicks, order_index, 
          is_scheduled, schedule_start, schedule_end, show_countdown, category,
          embed_type, show_embed, is_locked, lock_type, passcode, lock_warning,
          is_header, ab_test_enabled, title_b, url_b, clicks_a, clicks_b, views_a, views_b,
          grid_span, thumbnail, card_badge
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 0, 0, 0, 0, $24, $25, $26)
        RETURNING ${LINK_SELECT_COLUMNS}
      `, [
        newId, userId, title.trim(), formattedUrl.trim(), finalIsActive, icon || null, customColor || 'default',
        nextOrder, finalIsScheduled, finalScheduleStart, finalScheduleEnd, finalShowCountdown, finalCategory,
        finalEmbedType, finalShowEmbed, finalIsLocked, finalLockType, finalPasscode, finalLockWarning,
        finalIsHeader, finalAbTestEnabled, finalTitleB, finalUrlB,
        finalGridSpan, finalThumbnail, finalCardBadge
      ])

      invalidateCache('profile')
      return res.status(201).json(result.rows[0])
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Link bellek listesine ekleniyor:', dbErr.message)
      const list = getUserMockLinks(userId)
      const fallbackLink = {
        id: newId,
        userId,
        title: title.trim(),
        url: formattedUrl.trim(),
        isActive: finalIsActive,
        icon: icon || 'auto',
        customColor: customColor || 'default',
        clicks: 0,
        orderIndex: 0,
        isScheduled: finalIsScheduled,
        scheduleStart: finalScheduleStart,
        scheduleEnd: finalScheduleEnd,
        showCountdown: finalShowCountdown,
        category: finalCategory,
        embedType: finalEmbedType,
        showEmbed: finalShowEmbed,
        isLocked: finalIsLocked,
        lockType: finalLockType,
        passcode: finalPasscode,
        lockWarning: finalLockWarning,
        isHeader: finalIsHeader,
        abTestEnabled: finalAbTestEnabled,
        titleB: finalTitleB,
        urlB: finalUrlB,
        clicksA: 0,
        clicksB: 0,
        viewsA: 0,
        viewsB: 0,
        gridSpan: finalGridSpan,
        thumbnail: finalThumbnail,
        cardBadge: finalCardBadge
      }
      list.unshift(fallbackLink)
      mockLinksByUserId.set(userId, list)
      invalidateCache('profile')
      return res.status(201).json(fallbackLink)
    }
  } catch (error) {
    console.error('Link ekleme hatası:', error)
    res.status(500).json({ error: 'Link eklenemedi' })
  }
})

// PUT /api/links/reorder & POST /api/links/reorder (Sahiplik kontrollü sıralama)
const handleReorder = async (req, res) => {
  try {
    const userId = req.user.id
    const { orderedIds, links } = req.body

    let ids = orderedIds
    if (!ids && Array.isArray(links)) {
      ids = links.map(l => (typeof l === 'object' && l !== null ? l.id : l))
    }

    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'orderedIds veya links bir dizi olmalıdır' })
    }

    try {
      await query('BEGIN')
      for (let index = 0; index < ids.length; index++) {
        await query('UPDATE links SET order_index = $1 WHERE id = $2 AND user_id = $3', [index, ids[index], userId])
      }
      await query('COMMIT')
    } catch (dbErr) {
      await query('ROLLBACK').catch(() => {})
      const list = getUserMockLinks(userId)
      const byId = new Map(list.map(l => [String(l.id), l]))
      const reordered = []
      ids.forEach((idVal, idx) => {
        const item = byId.get(String(idVal))
        if (item) reordered.push({ ...item, orderIndex: idx })
      })
      list.forEach(item => {
        if (!ids.some(idVal => String(idVal) === String(item.id))) {
          reordered.push(item)
        }
      })
      mockLinksByUserId.set(userId, reordered)
    }

    invalidateCache('profile')
    res.json({ message: 'Sıralama başarıyla kaydedildi' })
  } catch (error) {
    console.error('Sıralama güncelleme hatası:', error)
    res.status(500).json({ error: 'Sıralama güncellenemedi' })
  }
}

router.put('/reorder', requireAuth, handleReorder)
router.post('/reorder', requireAuth, handleReorder)

// POST /api/links/reset-clicks (Yalnızca kendi bağlantı tıklama sayaçlarını sıfırla)
router.post('/reset-clicks', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.body || {}

    invalidateCache('profile')
    try {
      if (id) {
        await query('UPDATE links SET clicks = 0 WHERE id = $1 AND user_id = $2', [id, userId])
      } else {
        await query('UPDATE links SET clicks = 0 WHERE user_id = $1', [userId])
      }
    } catch (dbErr) {
      const list = getUserMockLinks(userId)
      list.forEach(l => {
        if (!id || String(l.id) === String(id)) l.clicks = 0
      })
    }

    res.json({ message: id ? 'Bağlantı tıklama sayacı sıfırlandı' : 'Tüm tıklama sayaçları sıfırlandı' })
  } catch (error) {
    console.error('Tıklama sıfırlama hatası:', error)
    res.status(500).json({ error: 'Tıklama sıfırlanamadı' })
  }
})

// PUT /api/links/bulk-sync (Kullanıcının kendi linklerini toplu senkronize etmesi)
router.put('/bulk-sync', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { links: incomingLinks } = req.body
    if (!Array.isArray(incomingLinks)) {
      return res.status(400).json({ error: 'Geçersiz bağlantı dizisi' })
    }

    const mapped = incomingLinks.map((l, index) => ({
      ...l,
      userId,
      orderIndex: index
    }))
    mockLinksByUserId.set(userId, mapped)

    try {
      for (let i = 0; i < incomingLinks.length; i++) {
        const l = incomingLinks[i]
        await query(`
          UPDATE links 
          SET order_index = $1, title = $2, url = $3, is_active = $4, custom_color = $5, category = $6,
              grid_span = COALESCE($7, 'full'), thumbnail = COALESCE($8, ''), card_badge = COALESCE($9, '')
          WHERE id = $10 AND user_id = $11
        `, [
          i, l.title, l.url, l.isActive !== false, l.customColor || 'default', l.category || '',
          l.gridSpan || 'full', l.thumbnail || '', l.cardBadge || '', l.id, userId
        ])
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Bulk sync belleğe uygulandı')
    }

    invalidateCache('profile')
    return res.json({ success: true, message: 'Tüm bağlantılar başarıyla kaydedildi!', links: mapped })
  } catch (err) {
    console.error('Bulk sync hatası:', err)
    res.status(500).json({ error: 'Bağlantılar senkronize edilemedi' })
  }
})

// PUT /api/links/:id (Link güncelle - Yalnızca Sahibi)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
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
      urlB,
      gridSpan,
      thumbnail,
      cardBadge
    } = req.body

    try {
      const existing = await query('SELECT * FROM links WHERE id = $1 AND user_id = $2', [id, userId])
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Bağlantı bulunamadı veya düzenleme yetkiniz yok' })
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
      const updatedGridSpan = gridSpan !== undefined ? gridSpan : (current.grid_span || 'full')
      const updatedThumbnail = thumbnail !== undefined ? String(thumbnail).trim() : (current.thumbnail || '')
      const updatedCardBadge = cardBadge !== undefined ? String(cardBadge).trim() : (current.card_badge || '')

      const result = await query(`
        UPDATE links
        SET 
          title = $1, url = $2, is_active = $3, icon = $4, custom_color = $5, 
          is_scheduled = $6, schedule_start = $7, schedule_end = $8, show_countdown = $9, 
          category = $10, embed_type = $11, show_embed = $12, is_locked = $13, 
          lock_type = $14, passcode = $15, lock_warning = $16,
          is_header = $17, ab_test_enabled = $18, title_b = $19, url_b = $20,
          grid_span = $21, thumbnail = $22, card_badge = $23,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $24 AND user_id = $25
        RETURNING ${LINK_SELECT_COLUMNS}
      `, [
        updatedTitle, updatedUrl, updatedIsActive, updatedIcon, updatedCustomColor,
        updatedIsScheduled, updatedScheduleStart, updatedScheduleEnd, updatedShowCountdown,
        updatedCategory, updatedEmbedType, updatedShowEmbed, updatedIsLocked,
        updatedLockType, updatedPasscode, updatedLockWarning,
        updatedIsHeader, updatedAbTestEnabled, updatedTitleB, updatedUrlB,
        updatedGridSpan, updatedThumbnail, updatedCardBadge, id, userId
      ])

      invalidateCache('profile')
      return res.json(result.rows[0])
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Link bellekte güncelleniyor:', dbErr.message)
      const list = getUserMockLinks(userId)
      const idx = list.findIndex(l => String(l.id) === String(id))
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...req.body }
        invalidateCache('profile')
        return res.json(list[idx])
      }
      return res.status(404).json({ error: 'Bağlantı bulunamadı' })
    }
  } catch (error) {
    console.error('Link güncelleme hatası:', error)
    res.status(500).json({ error: 'Link güncellenemedi' })
  }
})

// DELETE /api/links/:id (Link sil - Yalnızca Sahibi)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    try {
      const result = await query('DELETE FROM links WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId])
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Silinecek bağlantı bulunamadı veya yetkiniz yok' })
      }
      invalidateCache('profile')
      return res.json({ message: 'Bağlantı başarıyla silindi', id: result.rows[0].id })
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Link bellekten siliniyor:', dbErr.message)
      const list = getUserMockLinks(userId)
      const filtered = list.filter(l => String(l.id) !== String(id))
      mockLinksByUserId.set(userId, filtered)
      invalidateCache('profile')
      return res.json({ message: 'Bağlantı başarıyla silindi', id })
    }
  } catch (error) {
    console.error('Link silme hatası:', error)
    res.status(500).json({ error: 'Link silinemedi' })
  }
})

// POST /api/links/:id/click (Tıklanma sayısını artır - Herkese Açık, Link Sahibi user_id ile Loglar)
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params
    const { referrer = '', device = '', variant = 'a' } = req.body || {}
    const isVariantB = variant === 'b'

    const result = isVariantB
      ? await query(`
          UPDATE links
          SET clicks = clicks + 1, clicks_b = clicks_b + 1
          WHERE id = $1
          RETURNING id, user_id AS "userId", clicks, clicks_a AS "clicksA", clicks_b AS "clicksB"
        `, [id])
      : await query(`
          UPDATE links
          SET clicks = clicks + 1, clicks_a = clicks_a + 1
          WHERE id = $1
          RETURNING id, user_id AS "userId", clicks, clicks_a AS "clicksA", clicks_b AS "clicksB"
        `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bağlantı bulunamadı' })
    }

    const ownerUserId = result.rows[0].userId || 1
    const rawReferrer = (referrer || req.headers['referer'] || '').toLowerCase()
    let detectedSource = 'direct'
    if (rawReferrer.includes('instagram')) detectedSource = 'instagram'
    else if (rawReferrer.includes('twitter') || rawReferrer.includes('t.co') || rawReferrer.includes('x.com')) detectedSource = 'twitter'
    else if (rawReferrer.includes('linkedin')) detectedSource = 'linkedin'
    else if (rawReferrer.includes('github')) detectedSource = 'github'
    else if (rawReferrer.includes('qr') || rawReferrer.includes('src=qr')) detectedSource = 'qr'

    const userAgent = req.headers['user-agent'] || ''
    const detectedDevice = device || (/mobile|android|iphone|ipad|ipod/i.test(userAgent) ? 'mobile' : 'desktop')
    const ipAddress = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim()

    await query(`
      INSERT INTO click_events (user_id, link_id, referrer, device, ip_address, user_agent, variant)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [ownerUserId, id, detectedSource, detectedDevice, ipAddress, userAgent, isVariantB ? 'b' : 'a']).catch(() => {})

    res.json(result.rows[0])
  } catch (error) {
    // Offline fallback tıklama
    for (const [, list] of mockLinksByUserId.entries()) {
      const target = list.find(l => String(l.id) === String(req.params.id))
      if (target) {
        target.clicks = (target.clicks || 0) + 1
        return res.json({ id: target.id, clicks: target.clicks, success: true, offline: true })
      }
    }
    res.json({ id: parseInt(req.params.id, 10) || req.params.id, success: true, offline: true })
  }
})

// POST /api/links/:id/impression
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

export default router

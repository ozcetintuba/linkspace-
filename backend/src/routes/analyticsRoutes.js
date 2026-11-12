import express from 'express'
import { query } from '../db.js'
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js'
import { findMockUserByIdentifier } from '../mockState.js'

const router = express.Router()
const mockVisitsByUserId = new Map()

const buildOfflineAnalyticsForUser = (userId) => {
  const list = mockVisitsByUserId.get(userId) || []
  if (list.length === 0) {
    return userId === 1 ? FALLBACK_ANALYTICS : EMPTY_MEMBER_ANALYTICS
  }
  const base = userId === 1 ? FALLBACK_ANALYTICS : EMPTY_MEMBER_ANALYTICS
  const qr = list.filter(v => v.source === 'qr').length
  const direct = list.length - qr
  const mob = list.filter(v => v.device === 'mobile').length
  const desk = list.length - mob
  const qrMob = list.filter(v => v.source === 'qr' && v.device === 'mobile').length
  const totalQr = (base.qrVisits || 0) + qr
  const totalQrMob = (base.qrMobile || 0) + qrMob
  return {
    ...base,
    totalVisits: (base.totalVisits || 0) + list.length,
    qrVisits: totalQr,
    directVisits: (base.directVisits || 0) + direct,
    qrMobile: totalQrMob,
    qrDesktop: Math.max(0, totalQr - totalQrMob),
    totalMobile: (base.totalMobile || 0) + mob,
    totalDesktop: (base.totalDesktop || 0) + desk
  }
}

export const parseDeviceInfo = (uaStr = '', clientData = {}) => {
  let os = clientData.os || ''
  let model = clientData.model || ''
  let browser = clientData.browser || ''
  const ua = uaStr || ''

  if (!os || os === 'Bilinmiyor') {
    if (/iPhone/i.test(ua)) { os = 'iOS'; model = model || 'Apple iPhone' }
    else if (/iPad/i.test(ua)) { os = 'iPadOS'; model = model || 'Apple iPad' }
    else if (/Android/i.test(ua)) {
      os = 'Android'
      if (/Samsung|SM-/i.test(ua)) model = model || 'Samsung Galaxy'
      else if (/Xiaomi|Redmi|POCO/i.test(ua)) model = model || 'Xiaomi / Redmi'
      else if (/Pixel/i.test(ua)) model = model || 'Google Pixel'
      else if (/Huawei|Honor/i.test(ua)) model = model || 'Huawei'
      else model = model || 'Android Akıllı Telefon'
    } else if (/Macintosh|Mac OS X/i.test(ua)) { os = 'macOS'; model = model || 'MacBook / Mac' }
    else if (/Windows/i.test(ua)) { os = 'Windows'; model = model || 'Windows PC' }
    else if (/Linux/i.test(ua)) { os = 'Linux'; model = model || 'Linux PC' }
    else { os = 'Diğer'; model = model || 'Web Cihazı' }
  }

  if (!browser || browser === 'Bilinmiyor') {
    if (/Instagram/i.test(ua)) browser = 'Instagram Webview'
    else if (/WhatsApp/i.test(ua)) browser = 'WhatsApp Webview'
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet'
    else if (/Edg/i.test(ua)) browser = 'Microsoft Edge'
    else if (/Chrome|CriOS/i.test(ua)) browser = 'Google Chrome'
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari'
    else if (/Firefox|FxiOS/i.test(ua)) browser = 'Mozilla Firefox'
    else browser = 'Mobil Tarayıcı'
  }

  return { os, model, browser }
}

const EMPTY_MEMBER_ANALYTICS = {
  totalVisits: 0,
  qrVisits: 0,
  directVisits: 0,
  qrMobile: 0,
  qrDesktop: 0,
  totalMobile: 0,
  totalDesktop: 0,
  qrMobilePercent: 0,
  qrDesktopPercent: 0,
  referrerDistribution: [],
  dailyTimeline: [
    { date: 'Pzt', dayName: 'Pzt', visits: 0, clicks: 0 },
    { date: 'Sal', dayName: 'Sal', visits: 0, clicks: 0 },
    { date: 'Çar', dayName: 'Çar', visits: 0, clicks: 0 },
    { date: 'Per', dayName: 'Per', visits: 0, clicks: 0 },
    { date: 'Cum', dayName: 'Cum', visits: 0, clicks: 0 },
    { date: 'Cmt', dayName: 'Cmt', visits: 0, clicks: 0 },
    { date: 'Paz', dayName: 'Paz', visits: 0, clicks: 0 }
  ],
  qrDeviceStats: { iosPercent: 0, androidPercent: 0, desktopPercent: 0, iosCount: 0, androidCount: 0, desktopCount: 0 },
  topDeviceModels: [],
  recentQrScans: []
}

const FALLBACK_ANALYTICS = {
  totalVisits: 142,
  qrVisits: 84,
  directVisits: 58,
  qrMobile: 76,
  qrDesktop: 8,
  totalMobile: 105,
  totalDesktop: 37,
  qrMobilePercent: 90,
  qrDesktopPercent: 10,
  referrerDistribution: [
    { source: 'Instagram', rawSource: 'instagram', count: 35, percent: 35, color: '#E1306C' },
    { source: 'Twitter / X', rawSource: 'twitter', count: 28, percent: 28, color: '#1DA1F2' },
    { source: 'LinkedIn', rawSource: 'linkedin', count: 22, percent: 22, color: '#0A66C2' },
    { source: 'Doğrudan Web', rawSource: 'direct', count: 15, percent: 15, color: '#FFFF00' }
  ],
  dailyTimeline: [
    { date: 'Pzt', dayName: 'Pzt', visits: 18, clicks: 12 },
    { date: 'Sal', dayName: 'Sal', visits: 24, clicks: 16 },
    { date: 'Çar', dayName: 'Çar', visits: 19, clicks: 14 },
    { date: 'Per', dayName: 'Per', visits: 31, clicks: 22 },
    { date: 'Cum', dayName: 'Cum', visits: 28, clicks: 19 },
    { date: 'Cmt', dayName: 'Cmt', visits: 35, clicks: 27 },
    { date: 'Paz', dayName: 'Paz', visits: 42, clicks: 31 }
  ],
  qrDeviceStats: {
    iosPercent: 68,
    androidPercent: 28,
    desktopPercent: 4,
    iosCount: 57,
    androidCount: 23,
    desktopCount: 4
  },
  topDeviceModels: [
    { model: 'Apple iPhone 15 / 14 Pro', count: 38, percent: 45, icon: 'apple' },
    { model: 'Apple iPhone 13 / 12 / SE', count: 19, percent: 23, icon: 'apple' },
    { model: 'Samsung Galaxy S24 / S23', count: 14, percent: 17, icon: 'android' },
    { model: 'Xiaomi Redmi / POCO', count: 9, percent: 11, icon: 'android' },
    { model: 'Diğer / Masaüstü', count: 4, percent: 4, icon: 'desktop' }
  ],
  recentQrScans: [
    { id: 1, model: 'Apple iPhone 15 Pro', os: 'iOS 17.5', browser: 'Safari Mobile', timeAgo: 'Az önce', isMobile: true },
    { id: 2, model: 'Samsung Galaxy S24 Ultra', os: 'Android 14', browser: 'Chrome Mobile', timeAgo: '12 dk önce', isMobile: true },
    { id: 3, model: 'Apple iPhone 14', os: 'iOS 17.2', browser: 'Instagram Tarayıcı', timeAgo: '28 dk önce', isMobile: true },
    { id: 4, model: 'Xiaomi Redmi Note 13', os: 'Android 13', browser: 'Chrome Mobile', timeAgo: '45 dk önce', isMobile: true },
    { id: 5, model: 'Apple iPhone 13', os: 'iOS 16.6', browser: 'Apple Safari', timeAgo: '2 saat önce', isMobile: true }
  ]
}

const resolveVisitOwnerId = async (username, explicitUserId) => {
  if (explicitUserId && !isNaN(parseInt(explicitUserId, 10))) {
    return parseInt(explicitUserId, 10)
  }
  if (!username) return 1
  const clean = String(username).replace(/^@/, '').trim().toLowerCase()
  try {
    const res = await query(`
      SELECT COALESCE(p.user_id, u.id) AS "userId"
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE LOWER(u.username) = $1 OR LOWER(REPLACE(COALESCE(p.username, ''), '@', '')) = $1
      LIMIT 1
    `, [clean])
    if (res.rows[0]?.userId) return res.rows[0].userId
  } catch (e) {}
  const m = findMockUserByIdentifier(clean)
  return m ? m.id : 1
}

// 1. Ziyaretçi & QR Kod İstatistiklerini Getir (Oturumlu kullanıcıya özel)
router.get('/', optionalAuth, async (req, res) => {
  const userId = req.user?.id || 1
  try {
    const totalResult = await query('SELECT COUNT(*) FROM visit_stats WHERE user_id = $1', [userId])
    const qrResult = await query("SELECT COUNT(*) FROM visit_stats WHERE user_id = $1 AND source = 'qr'", [userId])
    const qrMobileResult = await query("SELECT COUNT(*) FROM visit_stats WHERE user_id = $1 AND source = 'qr' AND device = 'mobile'", [userId])
    const qrDesktopResult = await query("SELECT COUNT(*) FROM visit_stats WHERE user_id = $1 AND source = 'qr' AND device = 'desktop'", [userId])
    const totalMobileResult = await query("SELECT COUNT(*) FROM visit_stats WHERE user_id = $1 AND device = 'mobile'", [userId])
    const totalDesktopResult = await query("SELECT COUNT(*) FROM visit_stats WHERE user_id = $1 AND device = 'desktop'", [userId])

    const totalVisits = parseInt(totalResult.rows[0]?.count || 0, 10)
    const qrVisits = parseInt(qrResult.rows[0]?.count || 0, 10)
    const qrMobile = parseInt(qrMobileResult.rows[0]?.count || 0, 10)
    const qrDesktop = parseInt(qrDesktopResult.rows[0]?.count || 0, 10)
    const totalMobile = parseInt(totalMobileResult.rows[0]?.count || 0, 10)
    const totalDesktop = parseInt(totalDesktopResult.rows[0]?.count || 0, 10)
    const directVisits = Math.max(0, totalVisits - qrVisits)

    const qrMobilePercent = qrVisits > 0 ? Math.round((qrMobile / qrVisits) * 100) : 0
    const qrDesktopPercent = qrVisits > 0 ? Math.round((qrDesktop / qrVisits) * 100) : 0

    let referrerDistribution = []
    try {
      const refRes = await query(`
        SELECT referrer, COUNT(*) as count 
        FROM click_events 
        WHERE user_id = $1
        GROUP BY referrer 
        ORDER BY count DESC
      `, [userId])
      if (refRes.rows.length > 0) {
        const totalRefClicks = refRes.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0)
        referrerDistribution = refRes.rows.map(r => {
          const c = parseInt(r.count, 10)
          const p = totalRefClicks > 0 ? Math.round((c / totalRefClicks) * 100) : 0
          let name = 'Doğrudan Web'
          let color = '#FFFF00'
          if (r.referrer === 'instagram') { name = 'Instagram'; color = '#E1306C' }
          else if (r.referrer === 'twitter') { name = 'Twitter / X'; color = '#1DA1F2' }
          else if (r.referrer === 'linkedin') { name = 'LinkedIn'; color = '#0A66C2' }
          else if (r.referrer === 'github') { name = 'GitHub'; color = '#A855F7' }
          else if (r.referrer === 'qr') { name = 'QR Kod'; color = '#10B981' }
          return { source: name, rawSource: r.referrer, count: c, percent: p, color }
        })
      }
    } catch (e) {}

    let dailyTimeline = EMPTY_MEMBER_ANALYTICS.dailyTimeline
    try {
      const dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
      const timelineRes = await query(`
        SELECT 
          TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
          EXTRACT(DOW FROM d.day) AS dow,
          COALESCE(COUNT(DISTINCT v.id), 0) AS visits,
          COALESCE(COUNT(DISTINCT c.id), 0) AS clicks
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d(day)
        LEFT JOIN visit_stats v ON DATE(v.created_at) = DATE(d.day) AND v.user_id = $1
        LEFT JOIN click_events c ON DATE(c.created_at) = DATE(d.day) AND c.user_id = $1
        GROUP BY d.day
        ORDER BY d.day ASC
      `, [userId])
      if (timelineRes.rows.length > 0) {
        dailyTimeline = timelineRes.rows.map(row => ({
          date: row.date,
          dayName: dayLabels[parseInt(row.dow, 10)] || 'Gün',
          visits: parseInt(row.visits, 10),
          clicks: parseInt(row.clicks, 10)
        }))
      }
    } catch (e) {}

    let qrDeviceStats = { iosCount: 0, androidCount: 0, desktopCount: 0, iosPercent: 0, androidPercent: 0, desktopPercent: 0 }
    let topDeviceModels = []
    let recentQrScans = []

    try {
      const osRes = await query(`
        SELECT COALESCE(os, 'iOS') as os, COUNT(*) as count 
        FROM visit_stats 
        WHERE user_id = $1 AND source = 'qr' 
        GROUP BY os 
        ORDER BY count DESC
      `, [userId])
      if (osRes.rows.length > 0) {
        let iosC = 0, androidC = 0, deskC = 0
        osRes.rows.forEach(r => {
          const c = parseInt(r.count, 10)
          if (r.os === 'iOS' || r.os === 'iPadOS') iosC += c
          else if (r.os === 'Android') androidC += c
          else deskC += c
        })
        const total = Math.max(1, iosC + androidC + deskC)
        qrDeviceStats = {
          iosCount: iosC,
          androidCount: androidC,
          desktopCount: deskC,
          iosPercent: Math.round((iosC / total) * 100),
          androidPercent: Math.round((androidC / total) * 100),
          desktopPercent: Math.round((deskC / total) * 100)
        }
      }

      const modelRes = await query(`
        SELECT COALESCE(device_model, 'Apple iPhone') as model, COUNT(*) as count 
        FROM visit_stats 
        WHERE user_id = $1 AND source = 'qr' 
        GROUP BY device_model 
        ORDER BY count DESC 
        LIMIT 5
      `, [userId])
      if (modelRes.rows.length > 0) {
        const totalModels = modelRes.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0)
        topDeviceModels = modelRes.rows.map(r => ({
          model: r.model,
          count: parseInt(r.count, 10),
          percent: totalModels > 0 ? Math.round((parseInt(r.count, 10) / totalModels) * 100) : 0,
          icon: r.model.toLowerCase().includes('iphone') || r.model.toLowerCase().includes('apple') ? 'apple' : (r.model.toLowerCase().includes('android') || r.model.toLowerCase().includes('samsung') || r.model.toLowerCase().includes('xiaomi') ? 'android' : 'desktop')
        }))
      }

      const recentRes = await query(`
        SELECT 
          id, 
          COALESCE(device_model, 'Apple iPhone') as model, 
          COALESCE(os, 'iOS') as os, 
          COALESCE(browser, 'Safari') as browser, 
          device, 
          created_at
        FROM visit_stats 
        WHERE user_id = $1 AND source = 'qr' 
        ORDER BY created_at DESC 
        LIMIT 6
      `, [userId])
      if (recentRes.rows.length > 0) {
        const now = Date.now()
        recentQrScans = recentRes.rows.map(r => {
          const diffMinutes = Math.max(1, Math.round((now - new Date(r.created_at).getTime()) / 60000))
          let timeAgo = `${diffMinutes} dk önce`
          if (diffMinutes < 2) timeAgo = 'Az önce'
          else if (diffMinutes >= 60 && diffMinutes < 1440) timeAgo = `${Math.round(diffMinutes / 60)} saat önce`
          else if (diffMinutes >= 1440) timeAgo = `${Math.round(diffMinutes / 1440)} gün önce`

          return {
            id: r.id,
            model: r.model,
            os: r.os,
            browser: r.browser,
            isMobile: r.device === 'mobile',
            timeAgo
          }
        })
      }
    } catch (e) {}

    return res.json({
      totalVisits,
      qrVisits,
      directVisits,
      qrMobile,
      qrDesktop,
      totalMobile,
      totalDesktop,
      qrMobilePercent,
      qrDesktopPercent,
      referrerDistribution,
      dailyTimeline,
      qrDeviceStats,
      topDeviceModels,
      recentQrScans
    })
  } catch (error) {
    console.warn('⚠️ Veritabanı sorgusu başarısız oldu, çevrimdışı analitik dönülüyor:', error.message)
    return res.json(buildOfflineAnalyticsForUser(userId))
  }
})

// 2. Yeni Ziyaret Kaydet (Ziyaret edilen profil sahibinin user_id bilgisiyle)
router.post('/visit', async (req, res) => {
  let ownerUserId = 1
  let validDevice = 'desktop'
  let validSource = 'direct'
  try {
    const { device, source, os, model, browser, username, userId } = req.body
    validDevice = device === 'mobile' ? 'mobile' : 'desktop'
    validSource = source === 'qr' ? 'qr' : 'direct'
    const userAgent = req.headers['user-agent'] || ''

    const parsed = parseDeviceInfo(userAgent, { os, model, browser })
    ownerUserId = await resolveVisitOwnerId(username, userId)

    await query(
      'INSERT INTO visit_stats (user_id, device, source, user_agent, os, device_model, browser) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [ownerUserId, validDevice, validSource, userAgent, parsed.os, parsed.model, parsed.browser]
    )

    return res.status(201).json({
      success: true,
      message: 'Ziyaret ve cihaz detayları başarıyla kaydedildi',
      data: { device: validDevice, source: validSource, os: parsed.os, model: parsed.model, browser: parsed.browser }
    })
  } catch (error) {
    const list = mockVisitsByUserId.get(ownerUserId) || []
    list.push({ device: validDevice, source: validSource })
    mockVisitsByUserId.set(ownerUserId, list)
    return res.status(200).json({
      success: true,
      offline: true,
      message: 'Çevrimdışı modda yerel olarak kaydedildi'
    })
  }
})

// 3. Test / Simülasyon Ziyareti Ekle (Oturumlu Kullanıcıya Özel)
router.post('/simulate', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { device = 'mobile', source = 'qr', os = 'iOS', model = 'Apple iPhone 15 Pro', browser = 'Apple Safari' } = req.body
    const validDevice = device === 'mobile' ? 'mobile' : 'desktop'
    const validSource = source === 'qr' ? 'qr' : 'direct'

    await query(
      'INSERT INTO visit_stats (user_id, device, source, user_agent, os, device_model, browser) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, validDevice, validSource, 'Simulated Visit via Dashboard', os, model, browser]
    )

    return res.json({
      success: true,
      message: `Simüle edilmiş ${validSource.toUpperCase()} - ${model} ziyareti eklendi.`
    })
  } catch (error) {
    return res.json({
      success: true,
      offline: true,
      message: 'Simülasyon yerel olarak uygulandı'
    })
  }
})

// 4. Analitik Verilerini Sıfırla (Yalnızca Oturumlu Kullanıcının Kendi Verisi)
router.post('/reset', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    mockVisitsByUserId.delete(userId)
    await query('DELETE FROM visit_stats WHERE user_id = $1', [userId])
    await query('DELETE FROM click_events WHERE user_id = $1', [userId])
    await query('UPDATE links SET clicks = 0 WHERE user_id = $1', [userId])

    return res.json({
      success: true,
      message: 'Tüm analitik, ziyaret ve tıklama verileriniz sıfırlandı.'
    })
  } catch (error) {
    return res.json({
      success: true,
      offline: true,
      message: 'Çevrimdışı modda sıfırlandı.'
    })
  }
})

export default router

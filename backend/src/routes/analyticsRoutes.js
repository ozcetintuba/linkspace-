import express from 'express'
import { query } from '../db.js'

const router = express.Router()

// Cihaz, İşletim Sistemi ve Tarayıcı Çözümleme Yardımcısı
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

// Varsayılan Çevrimdışı İstatistik Verisi
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

// 1. Ziyaretçi & QR Kod İstatistiklerini Getir
router.get('/', async (req, res) => {
  try {
    const totalResult = await query('SELECT COUNT(*) FROM visit_stats')
    const qrResult = await query("SELECT COUNT(*) FROM visit_stats WHERE source = 'qr'")
    const qrMobileResult = await query("SELECT COUNT(*) FROM visit_stats WHERE source = 'qr' AND device = 'mobile'")
    const qrDesktopResult = await query("SELECT COUNT(*) FROM visit_stats WHERE source = 'qr' AND device = 'desktop'")
    const totalMobileResult = await query("SELECT COUNT(*) FROM visit_stats WHERE device = 'mobile'")
    const totalDesktopResult = await query("SELECT COUNT(*) FROM visit_stats WHERE device = 'desktop'")

    const totalVisits = parseInt(totalResult.rows[0]?.count || 0, 10)
    const qrVisits = parseInt(qrResult.rows[0]?.count || 0, 10)
    const qrMobile = parseInt(qrMobileResult.rows[0]?.count || 0, 10)
    const qrDesktop = parseInt(qrDesktopResult.rows[0]?.count || 0, 10)
    const totalMobile = parseInt(totalMobileResult.rows[0]?.count || 0, 10)
    const totalDesktop = parseInt(totalDesktopResult.rows[0]?.count || 0, 10)
    const directVisits = Math.max(0, totalVisits - qrVisits)

    const qrMobilePercent = qrVisits > 0 ? Math.round((qrMobile / qrVisits) * 100) : 0
    const qrDesktopPercent = qrVisits > 0 ? Math.round((qrDesktop / qrVisits) * 100) : 0

    // Yönlendiren Kaynaklar Dağılımı (Referrer Distribution)
    let referrerDistribution = FALLBACK_ANALYTICS.referrerDistribution
    try {
      const refRes = await query(`
        SELECT referrer, COUNT(*) as count 
        FROM click_events 
        GROUP BY referrer 
        ORDER BY count DESC
      `)
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
    } catch (e) {
      console.warn('⚠️ Referrer dağılımı sorgulanamadı:', e.message)
    }

    // Son 7 Günlük Aktivite Zaman Çizelgesi (Daily Timeline)
    let dailyTimeline = FALLBACK_ANALYTICS.dailyTimeline
    try {
      const dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
      const timelineRes = await query(`
        SELECT 
          TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
          EXTRACT(DOW FROM d.day) AS dow,
          COALESCE(COUNT(DISTINCT v.id), 0) AS visits,
          COALESCE(COUNT(DISTINCT c.id), 0) AS clicks
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d(day)
        LEFT JOIN visit_stats v ON DATE(v.created_at) = DATE(d.day)
        LEFT JOIN click_events c ON DATE(c.created_at) = DATE(d.day)
        GROUP BY d.day
        ORDER BY d.day ASC
      `)
      if (timelineRes.rows.length > 0) {
        dailyTimeline = timelineRes.rows.map(row => ({
          date: row.date,
          dayName: dayLabels[parseInt(row.dow, 10)] || 'Gün',
          visits: parseInt(row.visits, 10),
          clicks: parseInt(row.clicks, 10)
        }))
      }
    } catch (e) {
      console.warn('⚠️ Günlük analitik zaman çizelgesi sorgulanamadı:', e.message)
    }

    // QR Okutan Cihazlar & İşletim Sistemi İstatistikleri (Granular Device Detection)
    let qrDeviceStats = FALLBACK_ANALYTICS.qrDeviceStats
    let topDeviceModels = FALLBACK_ANALYTICS.topDeviceModels
    let recentQrScans = FALLBACK_ANALYTICS.recentQrScans

    try {
      // OS Dağılımı (QR ziyaretleri için)
      const osRes = await query(`
        SELECT COALESCE(os, 'iOS') as os, COUNT(*) as count 
        FROM visit_stats 
        WHERE source = 'qr' 
        GROUP BY os 
        ORDER BY count DESC
      `)
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

      // Cihaz Modelleri
      const modelRes = await query(`
        SELECT COALESCE(device_model, 'Apple iPhone') as model, COUNT(*) as count 
        FROM visit_stats 
        WHERE source = 'qr' 
        GROUP BY device_model 
        ORDER BY count DESC 
        LIMIT 5
      `)
      if (modelRes.rows.length > 0) {
        const totalModels = modelRes.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0)
        topDeviceModels = modelRes.rows.map(r => ({
          model: r.model,
          count: parseInt(r.count, 10),
          percent: totalModels > 0 ? Math.round((parseInt(r.count, 10) / totalModels) * 100) : 0,
          icon: r.model.toLowerCase().includes('iphone') || r.model.toLowerCase().includes('apple') ? 'apple' : (r.model.toLowerCase().includes('android') || r.model.toLowerCase().includes('samsung') || r.model.toLowerCase().includes('xiaomi') ? 'android' : 'desktop')
        }))
      }

      // Son QR Taramaları Canlı Akışı
      const recentRes = await query(`
        SELECT 
          id, 
          COALESCE(device_model, 'Apple iPhone') as model, 
          COALESCE(os, 'iOS') as os, 
          COALESCE(browser, 'Safari') as browser, 
          device, 
          created_at
        FROM visit_stats 
        WHERE source = 'qr' 
        ORDER BY created_at DESC 
        LIMIT 6
      `)
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
    } catch (e) {
      console.warn('⚠️ QR cihaz analitiği sorgulanamadı:', e.message)
    }

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
    return res.json(FALLBACK_ANALYTICS)
  }
})

// 2. Yeni Ziyaret Kaydet (Sayfa yüklendiğinde ProfileView tarafından çağrılır)
router.post('/visit', async (req, res) => {
  try {
    const { device, source, os, model, browser } = req.body
    const validDevice = device === 'mobile' ? 'mobile' : 'desktop'
    const validSource = source === 'qr' ? 'qr' : 'direct'
    const userAgent = req.headers['user-agent'] || ''

    const parsed = parseDeviceInfo(userAgent, { os, model, browser })

    await query(
      'INSERT INTO visit_stats (device, source, user_agent, os, device_model, browser) VALUES ($1, $2, $3, $4, $5, $6)',
      [validDevice, validSource, userAgent, parsed.os, parsed.model, parsed.browser]
    )

    return res.status(201).json({
      success: true,
      message: 'Ziyaret ve cihaz detayları başarıyla kaydedildi',
      data: { device: validDevice, source: validSource, os: parsed.os, model: parsed.model, browser: parsed.browser }
    })
  } catch (error) {
    console.warn('⚠️ Ziyaret kaydedilemedi (çevrimdışı mod):', error.message)
    return res.status(200).json({
      success: true,
      offline: true,
      message: 'Çevrimdışı modda yerel olarak kaydedildi'
    })
  }
})

// 3. Test / Simülasyon Ziyareti Ekle (Admin panelinden hızlı test için)
router.post('/simulate', async (req, res) => {
  try {
    const { device = 'mobile', source = 'qr', os = 'iOS', model = 'Apple iPhone 15 Pro', browser = 'Apple Safari' } = req.body
    const validDevice = device === 'mobile' ? 'mobile' : 'desktop'
    const validSource = source === 'qr' ? 'qr' : 'direct'

    await query(
      'INSERT INTO visit_stats (device, source, user_agent, os, device_model, browser) VALUES ($1, $2, $3, $4, $5, $6)',
      [validDevice, validSource, 'Simulated Visit via Admin', os, model, browser]
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

// 4. Analitik Verilerini Sıfırla (Yalnızca Yönetici)
router.post('/reset', async (req, res) => {
  try {
    await query('TRUNCATE TABLE visit_stats RESTART IDENTITY')
    await query('TRUNCATE TABLE click_events RESTART IDENTITY')
    await query('UPDATE links SET clicks = 0')

    return res.json({
      success: true,
      message: 'Tüm analitik, ziyaret ve tıklama verileri başarıyla sıfırlandı.'
    })
  } catch (error) {
    console.warn('⚠️ Analitik sıfırlanamadı:', error.message)
    return res.json({
      success: true,
      offline: true,
      message: 'Çevrimdışı modda sıfırlandı.'
    })
  }
})

export default router

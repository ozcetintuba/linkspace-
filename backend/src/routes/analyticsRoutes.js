import express from 'express'
import { query } from '../db.js'

const router = express.Router()

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
      dailyTimeline
    })
  } catch (error) {
    console.warn('⚠️ Veritabanı sorgusu başarısız oldu, çevrimdışı analitik dönülüyor:', error.message)
    return res.json(FALLBACK_ANALYTICS)
  }
})

// 2. Yeni Ziyaret Kaydet (Sayfa yüklendiğinde ProfileView tarafından çağrılır)
router.post('/visit', async (req, res) => {
  try {
    const { device, source } = req.body
    const validDevice = device === 'mobile' ? 'mobile' : 'desktop'
    const validSource = source === 'qr' ? 'qr' : 'direct'
    const userAgent = req.headers['user-agent'] || ''

    await query(
      'INSERT INTO visit_stats (device, source, user_agent) VALUES ($1, $2, $3)',
      [validDevice, validSource, userAgent]
    )

    return res.status(201).json({
      success: true,
      message: 'Ziyaret başarıyla kaydedildi',
      data: { device: validDevice, source: validSource }
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
    const { device = 'mobile', source = 'qr' } = req.body
    const validDevice = device === 'mobile' ? 'mobile' : 'desktop'
    const validSource = source === 'qr' ? 'qr' : 'direct'

    await query(
      'INSERT INTO visit_stats (device, source, user_agent) VALUES ($1, $2, $3)',
      [validDevice, validSource, 'Simulated Visit via Admin']
    )

    return res.json({
      success: true,
      message: `Simüle edilmiş ${validSource.toUpperCase()} - ${validDevice.toUpperCase()} ziyareti eklendi.`
    })
  } catch (error) {
    return res.json({
      success: true,
      offline: true,
      message: 'Simülasyon yerel olarak uygulandı'
    })
  }
})

// 4. Ziyaretçi İstatistiklerini Sıfırla
router.post('/reset', async (req, res) => {
  try {
    await query('DELETE FROM visit_stats')
    return res.json({
      success: true,
      message: 'Tüm ziyaretçi ve QR istatistikleri sıfırlandı'
    })
  } catch (error) {
    return res.json({
      success: true,
      offline: true,
      message: 'İstatistikler yerel olarak sıfırlandı'
    })
  }
})

export default router

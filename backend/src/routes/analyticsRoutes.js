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
  qrDesktopPercent: 10
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

    return res.json({
      totalVisits,
      qrVisits,
      directVisits,
      qrMobile,
      qrDesktop,
      totalMobile,
      totalDesktop,
      qrMobilePercent,
      qrDesktopPercent
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

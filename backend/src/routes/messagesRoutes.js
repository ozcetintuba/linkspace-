import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// E-posta doğrulama regex'i
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

// Çevrimdışı / DB erişilemediğinde yedek bellek içi (In-Memory) deposu
let mockMessages = [
  {
    id: 1,
    name: 'Elif Kaya',
    email: 'elif.kaya@startup.io',
    message: 'Harika bir profil! Önümüzdeki ay düzenleyeceğimiz Web & Mobil Teknoloji Zirvesi\'nde konuşmacı olarak yer almak ister misiniz?',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 2,
    name: 'Burak Yılmaz',
    email: 'burak@agency.com',
    message: 'Selamlar, freelance web geliştirme projelerimiz için portfolyonuzu inceledik. Müsaitlik durumunuz nedir?',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
]
let nextMockId = 3

// 1. POST /api/messages - Ziyaretçilerin mesaj göndermesi (Açık Uç Nokta)
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body

    // Validasyon
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Lütfen geçerli bir ad soyad girin (en az 2 karakter).' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Lütfen geçerli bir e-posta adresi girin.' })
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({ error: 'Lütfen en az 5 karakterden oluşan bir mesaj yazın.' })
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({ error: 'Mesajınız en fazla 2000 karakter olabilir.' })
    }

    const trimmedName = name.trim().slice(0, 100)
    const trimmedEmail = email.trim().toLowerCase().slice(0, 255)
    const trimmedMessage = message.trim().slice(0, 2000)

    try {
      const result = await query(
        `INSERT INTO messages (name, email, message, is_read)
         VALUES ($1, $2, $3, false)
         RETURNING id, name, email, message, is_read AS "isRead", created_at AS "createdAt"`,
        [trimmedName, trimmedEmail, trimmedMessage]
      )

      const created = result.rows[0]
      console.log(`📬 [DB] Yeni iletişim mesajı alındı: ${trimmedName} (${trimmedEmail})`)

      return res.status(201).json({
        success: true,
        message: 'Mesajınız başarıyla iletildi! En kısa sürede geri dönüş yapılacaktır.',
        data: created
      })
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Mesaj belleğe kaydediliyor:', dbErr.message)
      const offlineMsg = {
        id: nextMockId++,
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        isRead: false,
        createdAt: new Date().toISOString()
      }
      mockMessages.unshift(offlineMsg)
      console.log(`📬 [Memory] Yeni iletişim mesajı kaydedildi: ${trimmedName}`)

      return res.status(201).json({
        success: true,
        message: 'Mesajınız başarıyla iletildi! En kısa sürede geri dönüş yapılacaktır.',
        data: offlineMsg
      })
    }
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error)
    return res.status(500).json({ error: 'Mesajınız kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.' })
  }
})

// 2. GET /api/messages - Admin mesaj listesi (Auth Korumalı)
router.get('/', requireAuth, async (req, res) => {
  try {
    let list = []
    try {
      const result = await query(`
        SELECT 
          id, 
          name, 
          email, 
          message, 
          is_read AS "isRead", 
          created_at AS "createdAt"
        FROM messages
        ORDER BY created_at DESC
      `)
      list = result.rows
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Bellek içi mesajlar dönülüyor:', dbErr.message)
      list = mockMessages
    }

    const unreadCount = list.filter(m => !m.isRead).length

    res.json({
      success: true,
      count: list.length,
      unreadCount,
      data: list
    })
  } catch (error) {
    console.error('Mesajları getirme hatası:', error)
    res.status(500).json({ error: 'Mesajlar yüklenemedi' })
  }
})

// 3. PATCH /api/messages/:id/read - Okundu / Okunmadı Durumunu Güncelleme (Auth Korumalı)
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const isRead = req.body.isRead !== undefined ? Boolean(req.body.isRead) : true

    try {
      const result = await query(
        `UPDATE messages 
         SET is_read = $1 
         WHERE id = $2 
         RETURNING id, name, email, message, is_read AS "isRead", created_at AS "createdAt"`,
        [isRead, id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Mesaj bulunamadı' })
      }

      return res.json({
        success: true,
        data: result.rows[0]
      })
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Bellek içi mesaj güncelleniyor:', dbErr.message)
      const target = mockMessages.find(m => m.id === id)
      if (!target) {
        return res.status(404).json({ error: 'Mesaj bulunamadı' })
      }
      target.isRead = isRead
      return res.json({
        success: true,
        data: target
      })
    }
  } catch (error) {
    console.error('Mesaj okundu durumu güncelleme hatası:', error)
    res.status(500).json({ error: 'Mesaj durumu güncellenemedi' })
  }
})

// 4. DELETE /api/messages/:id - Mesaj Silme (Auth Korumalı)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)

    try {
      const result = await query('DELETE FROM messages WHERE id = $1 RETURNING id', [id])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Silinecek mesaj bulunamadı' })
      }

      return res.json({
        success: true,
        message: 'Mesaj başarıyla silindi',
        id: result.rows[0].id
      })
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Bellek içi mesaj siliniyor:', dbErr.message)
      const index = mockMessages.findIndex(m => m.id === id)
      if (index === -1) {
        return res.status(404).json({ error: 'Silinecek mesaj bulunamadı' })
      }
      mockMessages.splice(index, 1)
      return res.json({
        success: true,
        message: 'Mesaj başarıyla silindi',
        id
      })
    }
  } catch (error) {
    console.error('Mesaj silme hatası:', error)
    res.status(500).json({ error: 'Mesaj silinemedi' })
  }
})

// 5. POST /api/messages/simulate - Hızlı Demo/Test İçin Örnek Lead Üretici (Auth Korumalı)
router.post('/simulate', requireAuth, async (req, res) => {
  try {
    const sampleLeads = [
      { name: 'Mert Aksoy', email: 'mert@fintechlabs.co', message: 'Merhaba Tuba Hanım, yeni başlattığımız mobil cüzdan projesi için Vue 3 bilen bir yazılımcı arıyoruz. Görüşmek isteriz.' },
      { name: 'Selin Demir', email: 'selin.demir@designagency.com', message: 'Tasarım sisteminiz ve renk uyumunuz mükemmel! Ekibimizle birlikte bir dashboard projesinde danışmanlık verebilir misiniz?' },
      { name: 'Canberk Özkan', email: 'canberk@ventures.capital', message: 'Projenizi demo gününde inceleme fırsatı bulduk, full-stack link hub yaklaşımınız çok başarılı. Tebrikler!' }
    ]

    const randomLead = sampleLeads[Math.floor(Math.random() * sampleLeads.length)]

    try {
      const result = await query(
        `INSERT INTO messages (name, email, message, is_read)
         VALUES ($1, $2, $3, false)
         RETURNING id, name, email, message, is_read AS "isRead", created_at AS "createdAt"`,
        [randomLead.name, randomLead.email, randomLead.message]
      )

      return res.status(201).json({
        success: true,
        message: 'Örnek mesaj simüle edildi',
        data: result.rows[0]
      })
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Örnek mesaj belleğe ekleniyor:', dbErr.message)
      const offlineMsg = {
        id: nextMockId++,
        name: randomLead.name,
        email: randomLead.email,
        message: randomLead.message,
        isRead: false,
        createdAt: new Date().toISOString()
      }
      mockMessages.unshift(offlineMsg)
      return res.status(201).json({
        success: true,
        message: 'Örnek mesaj simüle edildi',
        data: offlineMsg
      })
    }
  } catch (error) {
    console.error('Mesaj simülasyon hatası:', error)
    res.status(500).json({ error: 'Mesaj simüle edilemedi' })
  }
})

export default router

import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { messagesLimiter } from '../middleware/rateLimiter.js'
import {
  mockMessagesByUserId,
  allocateMockMessageId,
  findMockUserByIdentifier,
  ensureMockUserState,
  mockUsers
} from '../mockState.js'

const router = Router()

const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

const getUserMockMessages = (userId = 1) => {
  if (!mockMessagesByUserId.has(userId)) {
    const u = mockUsers.find(x => x.id === userId)
    if (u) ensureMockUserState(u)
    else mockMessagesByUserId.set(userId, [])
  }
  return mockMessagesByUserId.get(userId) || []
}

const resolveTargetUserId = async (targetUsername, explicitUserId) => {
  if (explicitUserId && !isNaN(parseInt(explicitUserId, 10))) {
    return parseInt(explicitUserId, 10)
  }
  if (!targetUsername) return 1

  const clean = String(targetUsername).replace(/^@/, '').trim().toLowerCase()
  try {
    const res = await query(`
      SELECT COALESCE(p.user_id, u.id) AS "userId"
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE LOWER(u.username) = $1
         OR LOWER(REPLACE(COALESCE(p.username, ''), '@', '')) = $1
      LIMIT 1
    `, [clean])
    if (res.rows.length > 0 && res.rows[0].userId) {
      return res.rows[0].userId
    }
  } catch (e) {}

  const mock = findMockUserByIdentifier(clean)
  return mock ? mock.id : 1
}

// 1. POST /api/messages - Ziyaretçilerin hedef profil sahibine mesaj göndermesi
router.post('/', messagesLimiter, async (req, res) => {
  try {
    const { name, email, message, targetUsername, userId } = req.body

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
    const recipientUserId = await resolveTargetUserId(targetUsername, userId)

    try {
      const result = await query(
        `INSERT INTO messages (user_id, name, email, message, is_read)
         VALUES ($1, $2, $3, $4, false)
         RETURNING id, user_id AS "userId", name, email, message, is_read AS "isRead", created_at AS "createdAt"`,
        [recipientUserId, trimmedName, trimmedEmail, trimmedMessage]
      )

      const created = result.rows[0]
      return res.status(201).json({
        success: true,
        message: 'Mesajınız başarıyla iletildi! En kısa sürede geri dönüş yapılacaktır.',
        data: created
      })
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Mesaj belleğe kaydediliyor:', dbErr.message)
      const list = getUserMockMessages(recipientUserId)
      const offlineMsg = {
        id: allocateMockMessageId(),
        userId: recipientUserId,
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        isRead: false,
        createdAt: new Date().toISOString()
      }
      list.unshift(offlineMsg)
      mockMessagesByUserId.set(recipientUserId, list)

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

// 2. GET /api/messages - Oturumlu kullanıcının kendi gelen mesajları
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
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
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId])
      list = result.rows
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Bellek içi mesajlar dönülüyor:', dbErr.message)
      list = getUserMockMessages(userId)
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

// 3. PATCH /api/messages/:id/read - Okundu / Okunmadı Durumunu Güncelleme (Yalnızca Sahibi)
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const id = parseInt(req.params.id, 10)
    const isRead = req.body.isRead !== undefined ? Boolean(req.body.isRead) : true

    try {
      const result = await query(
        `UPDATE messages 
         SET is_read = $1 
         WHERE id = $2 AND user_id = $3
         RETURNING id, name, email, message, is_read AS "isRead", created_at AS "createdAt"`,
        [isRead, id, userId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Mesaj bulunamadı' })
      }

      return res.json({
        success: true,
        data: result.rows[0]
      })
    } catch (dbErr) {
      const list = getUserMockMessages(userId)
      const target = list.find(m => m.id === id)
      if (!target) {
        return res.status(404).json({ error: 'Mesaj bulunamadı' })
      }
      target.isRead = isRead
      return res.json({ success: true, data: target })
    }
  } catch (error) {
    console.error('Mesaj okundu durumu güncelleme hatası:', error)
    res.status(500).json({ error: 'Mesaj durumu güncellenemedi' })
  }
})

// 4. DELETE /api/messages/:id - Mesaj Silme (Yalnızca Sahibi)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const id = parseInt(req.params.id, 10)

    try {
      const result = await query('DELETE FROM messages WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Silinecek mesaj bulunamadı' })
      }

      return res.json({
        success: true,
        message: 'Mesaj başarıyla silindi',
        id: result.rows[0].id
      })
    } catch (dbErr) {
      const list = getUserMockMessages(userId)
      const index = list.findIndex(m => m.id === id)
      if (index === -1) {
        return res.status(404).json({ error: 'Silinecek mesaj bulunamadı' })
      }
      list.splice(index, 1)
      return res.json({ success: true, message: 'Mesaj başarıyla silindi', id })
    }
  } catch (error) {
    console.error('Mesaj silme hatası:', error)
    res.status(500).json({ error: 'Mesaj silinemedi' })
  }
})

// 5. POST /api/messages/simulate - Oturumlu Kullanıcı İçin Örnek Lead Üretici
router.post('/simulate', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const recipientName = req.user.name || req.user.username
    const sampleLeads = [
      { name: 'Mert Aksoy', email: 'mert@fintechlabs.co', message: `Merhaba ${recipientName}, yeni başlattığımız projede iş birliği yapmak isteriz.` },
      { name: 'Selin Demir', email: 'selin.demir@designagency.com', message: 'Profil sayfanız ve içerikleriniz harika! Detaylı görüşmek için dönüş bekliyoruz.' },
      { name: 'Canberk Özkan', email: 'canberk@ventures.capital', message: 'Bağlantılarınızı inceledik, yeni çalışmanız hakkında bilgi almak isteriz.' }
    ]

    const randomLead = sampleLeads[Math.floor(Math.random() * sampleLeads.length)]

    try {
      const result = await query(
        `INSERT INTO messages (user_id, name, email, message, is_read)
         VALUES ($1, $2, $3, $4, false)
         RETURNING id, name, email, message, is_read AS "isRead", created_at AS "createdAt"`,
        [userId, randomLead.name, randomLead.email, randomLead.message]
      )

      return res.status(201).json({
        success: true,
        message: 'Örnek mesaj simüle edildi',
        data: result.rows[0]
      })
    } catch (dbErr) {
      const list = getUserMockMessages(userId)
      const offlineMsg = {
        id: allocateMockMessageId(),
        userId,
        name: randomLead.name,
        email: randomLead.email,
        message: randomLead.message,
        isRead: false,
        createdAt: new Date().toISOString()
      }
      list.unshift(offlineMsg)
      mockMessagesByUserId.set(userId, list)
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

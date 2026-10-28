import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { cacheMiddleware, invalidateCache } from '../middleware/cacheService.js'

const router = Router()

// Varsayılan bellek içi profil (DB çevrimdışı fallback)
const mockProfile = {
  name: 'Tuba Gül',
  username: '@tubagul',
  bio: 'Full-Stack Web Geliştirici & UI/UX Meraklısı 🚀\nModern web teknolojileri ve açık kaynak projeler üretiyorum.',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  avatarShape: 'circle',
  avatarGlow: 'yellow',
  statusText: 'Yeni Projelere & Fırsatlara Açık',
  statusColor: 'emerald',
  isVerified: true,
  banner: '',
  bannerPattern: 'mesh',
  badges: [],
  socialLinks: {
    github: 'https://github.com',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com'
  },
  groupByCategory: false,
  foldersDefaultExpanded: true
}

// GET /api/profile (Herkese açık, 60s TTL & ETag Önbellekli)
router.get('/', cacheMiddleware(60), async (req, res) => {
  try {
    try {
      const result = await query(`
        SELECT 
          name, 
          username, 
          bio, 
          avatar, 
          COALESCE(avatar_shape, 'circle') AS "avatarShape",
          COALESCE(avatar_glow, 'yellow') AS "avatarGlow",
          COALESCE(status_text, 'Yeni Projelere & Fırsatlara Açık') AS "statusText",
          COALESCE(status_color, 'emerald') AS "statusColor",
          COALESCE(is_verified, true) AS "isVerified",
          COALESCE(banner, '') AS "banner",
          COALESCE(banner_pattern, 'mesh') AS "bannerPattern",
          COALESCE(badges, '[]'::jsonb) AS "badges",
          COALESCE(social_links, '{}'::jsonb) AS "socialLinks",
          COALESCE(group_by_category, false) AS "groupByCategory",
          COALESCE(folders_default_expanded, true) AS "foldersDefaultExpanded"
        FROM profiles 
        ORDER BY id ASC 
        LIMIT 1
      `)
      if (result.rows.length > 0) {
        return res.json(result.rows[0])
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Profil verisi bellekten dönülüyor:', dbErr.message)
      return res.json(mockProfile)
    }
    res.json(mockProfile)
  } catch (error) {
    console.error('Profil getirme hatası:', error)
    res.json(mockProfile)
  }
})

// GET /api/profile/:username (Giriş yapmamış ziyaretçiler için aktif linkleri döner, 60s TTL & ETag Önbellekli)
router.get('/:username', cacheMiddleware(60), async (req, res) => {
  try {
    const { username } = req.params
    if (!username) {
      return res.status(400).json({ error: 'Kullanıcı adı belirtilmelidir' })
    }

    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase()

    // Profil bilgisini çek
    const profileResult = await query(`
      SELECT 
        id,
        name, 
        username, 
        bio, 
        avatar, 
        COALESCE(avatar_shape, 'circle') AS "avatarShape",
        COALESCE(avatar_glow, 'yellow') AS "avatarGlow",
        COALESCE(status_text, 'Yeni Projelere & Fırsatlara Açık') AS "statusText",
        COALESCE(status_color, 'emerald') AS "statusColor",
        COALESCE(is_verified, true) AS "isVerified",
        COALESCE(banner, '') AS "banner",
        COALESCE(banner_pattern, 'mesh') AS "bannerPattern",
        COALESCE(badges, '[]'::jsonb) AS "badges",
        COALESCE(social_links, '{}'::jsonb) AS "socialLinks",
        COALESCE(group_by_category, false) AS "groupByCategory",
        COALESCE(folders_default_expanded, true) AS "foldersDefaultExpanded"
      FROM profiles 
      WHERE LOWER(REPLACE(username, '@', '')) = $1
      LIMIT 1
    `, [cleanUsername])

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: `'${username}' kullanıcısına ait profil bulunamadı` })
    }

    const profile = profileResult.rows[0]

    // Sadece aktif ve süresi dolmamış linkleri getir
    const linksResult = await query(`
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
        COALESCE(lock_warning, '') AS "lockWarning"
      FROM links 
      WHERE is_active = true
        AND (is_scheduled = false OR schedule_end IS NULL OR schedule_end >= CURRENT_TIMESTAMP)
      ORDER BY order_index ASC, id DESC
    `)

    res.json({
      profile: {
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        avatar: profile.avatar,
        avatarShape: profile.avatarShape || 'circle',
        avatarGlow: profile.avatarGlow || 'yellow',
        statusText: profile.statusText || 'Yeni Projelere & Fırsatlara Açık',
        statusColor: profile.statusColor || 'emerald',
        isVerified: profile.isVerified !== undefined ? profile.isVerified : true,
        banner: profile.banner || '',
        bannerPattern: profile.bannerPattern || 'mesh',
        badges: profile.badges || [],
        socialLinks: profile.socialLinks,
        groupByCategory: profile.groupByCategory !== undefined ? Boolean(profile.groupByCategory) : false,
        foldersDefaultExpanded: profile.foldersDefaultExpanded !== undefined ? Boolean(profile.foldersDefaultExpanded) : true
      },
      links: linksResult.rows
    })
  } catch (error) {
    console.error('Kullanıcı profili getirme hatası:', error)

    // Veritabanı çevrimdışıysa ve varsayılan kullanıcı sorgulanıyorsa graceful fallback sun
    const cleanUser = (req.params.username || '').replace(/^@/, '').trim().toLowerCase()
    if (cleanUser === 'tubagul' || cleanUser === 'admin') {
      return res.json({
        profile: {
          name: 'Tuba Gül',
          username: '@tubagul',
          bio: 'Yazılım Mühendisliği Öğrencisi | Full-Stack Geliştirici Adayı 🚀',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          avatarShape: 'circle',
          avatarGlow: 'yellow',
          statusText: 'Yeni Projelere & Fırsatlara Açık',
          statusColor: 'emerald',
          isVerified: true,
          banner: '',
          bannerPattern: 'mesh',
          badges: [
            { id: 'badge-1', text: 'Full-Stack Developer', icon: 'Code', color: 'default' },
            { id: 'badge-2', text: 'Vue 3 & Express', icon: 'Sparkles', color: 'yellow' },
            { id: 'badge-3', text: 'İstanbul, TR', icon: 'MapPin', color: 'default' }
          ],
          socialLinks: {
            github: 'https://github.com',
            linkedin: 'https://linkedin.com',
            instagram: 'https://instagram.com'
          }
        },
        links: [
          { id: 1, title: 'Kişisel Web Sitem & Portfolyom', url: 'https://github.com', isActive: true, icon: 'globe', customColor: 'default', clicks: 12, orderIndex: 0 },
          { id: 2, title: 'GitHub Projelerim', url: 'https://github.com', isActive: true, icon: 'github', customColor: 'emerald', clicks: 38, orderIndex: 1 },
          { id: 3, title: 'LinkedIn Bağlantım', url: 'https://linkedin.com', isActive: true, icon: 'linkedin', customColor: 'blue', clicks: 24, orderIndex: 2 },
          { id: 4, title: 'Instagram Hesabım', url: 'https://instagram.com', isActive: true, icon: 'instagram', customColor: 'rose', clicks: 15, orderIndex: 3 }
        ]
      })
    }

    res.status(404).json({ error: `'${req.params.username}' kullanıcısına ait profil bulunamadı` })
  }
})

// PUT /api/profile (Yalnızca Yönetici)
router.put('/', requireAuth, async (req, res) => {
  try {
    const { 
      name, 
      username, 
      bio, 
      avatar, 
      avatarShape, 
      avatarGlow, 
      statusText, 
      statusColor, 
      isVerified, 
      banner, 
      bannerPattern, 
      badges, 
      socialLinks,
      groupByCategory,
      foldersDefaultExpanded
    } = req.body

    if (!name || !username) {
      return res.status(400).json({ error: 'İsim ve kullanıcı adı zorunludur' })
    }

    const safeSocialLinks = typeof socialLinks === 'object' && socialLinks !== null ? JSON.stringify(socialLinks) : '{}'
    const safeBadges = Array.isArray(badges) ? JSON.stringify(badges) : '[]'
    const safeBanner = banner || ''
    const safeBannerPattern = bannerPattern || 'mesh'
    const safeAvatarShape = avatarShape || 'circle'
    const safeAvatarGlow = avatarGlow || 'yellow'
    const safeStatusText = statusText !== undefined ? statusText : 'Yeni Projelere & Fırsatlara Açık'
    const safeStatusColor = statusColor || 'emerald'
    const safeIsVerified = isVerified !== undefined ? Boolean(isVerified) : true
    const safeGroupByCategory = groupByCategory !== undefined ? Boolean(groupByCategory) : false
    const safeFoldersDefaultExpanded = foldersDefaultExpanded !== undefined ? Boolean(foldersDefaultExpanded) : true

    const result = await query(`
      UPDATE profiles 
      SET 
        name = $1, 
        username = $2, 
        bio = $3, 
        avatar = $4, 
        banner = $5, 
        banner_pattern = $6, 
        badges = $7, 
        social_links = $8,
        avatar_shape = $9,
        avatar_glow = $10,
        status_text = $11,
        status_color = $12,
        is_verified = $13,
        group_by_category = $14,
        folders_default_expanded = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM profiles ORDER BY id ASC LIMIT 1)
      RETURNING 
        name, 
        username, 
        bio, 
        avatar, 
        COALESCE(avatar_shape, 'circle') AS "avatarShape",
        COALESCE(avatar_glow, 'yellow') AS "avatarGlow",
        COALESCE(status_text, 'Yeni Projelere & Fırsatlara Açık') AS "statusText",
        COALESCE(status_color, 'emerald') AS "statusColor",
        COALESCE(is_verified, true) AS "isVerified",
        COALESCE(banner, '') AS "banner", 
        COALESCE(banner_pattern, 'mesh') AS "bannerPattern", 
        COALESCE(badges, '[]'::jsonb) AS "badges", 
        COALESCE(social_links, '{}'::jsonb) AS "socialLinks",
        COALESCE(group_by_category, false) AS "groupByCategory",
        COALESCE(folders_default_expanded, true) AS "foldersDefaultExpanded"
    `, [
      name.trim(), 
      username.trim(), 
      bio || '', 
      avatar || '', 
      safeBanner, 
      safeBannerPattern, 
      safeBadges, 
      safeSocialLinks,
      safeAvatarShape,
      safeAvatarGlow,
      safeStatusText,
      safeStatusColor,
      safeIsVerified,
      safeGroupByCategory,
      safeFoldersDefaultExpanded
    ])

    if (result.rows.length === 0) {
      // Eğer profil yoksa yeni oluştur
      const insertResult = await query(`
        INSERT INTO profiles (
          name, username, bio, avatar, banner, banner_pattern, badges, social_links, avatar_shape, avatar_glow, status_text, status_color, is_verified, group_by_category, folders_default_expanded
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING 
          name, 
          username, 
          bio, 
          avatar, 
          COALESCE(avatar_shape, 'circle') AS "avatarShape",
          COALESCE(avatar_glow, 'yellow') AS "avatarGlow",
          COALESCE(status_text, 'Yeni Projelere & Fırsatlara Açık') AS "statusText",
          COALESCE(status_color, 'emerald') AS "statusColor",
          COALESCE(is_verified, true) AS "isVerified",
          COALESCE(banner, '') AS "banner", 
          COALESCE(banner_pattern, 'mesh') AS "bannerPattern", 
          COALESCE(badges, '[]'::jsonb) AS "badges", 
          COALESCE(social_links, '{}'::jsonb) AS "socialLinks",
          COALESCE(group_by_category, false) AS "groupByCategory",
          COALESCE(folders_default_expanded, true) AS "foldersDefaultExpanded"
      `, [
        name.trim(), 
        username.trim(), 
        bio || '', 
        avatar || '', 
        safeBanner, 
        safeBannerPattern, 
        safeBadges, 
        safeSocialLinks,
        safeAvatarShape,
        safeAvatarGlow,
        safeStatusText,
        safeStatusColor,
        safeIsVerified,
        safeGroupByCategory,
        safeFoldersDefaultExpanded
      ])
      invalidateCache('profile')
      return res.json(insertResult.rows[0])
    }

    invalidateCache('profile')
    res.json(result.rows[0])
  } catch (error) {
    console.error('Profil güncelleme hatası:', error)
    res.status(500).json({ error: 'Profil güncellenemedi' })
  }
})

export default router

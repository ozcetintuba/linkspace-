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
  statusColor: 'none',
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
  foldersDefaultExpanded: true,
  showBadges: false
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
          COALESCE(status_color, 'none') AS "statusColor",
          COALESCE(is_verified, true) AS "isVerified",
          COALESCE(banner, '') AS "banner",
          COALESCE(banner_pattern, 'mesh') AS "bannerPattern",
          COALESCE(badges, '[]'::jsonb) AS "badges",
          COALESCE(social_links, '{}'::jsonb) AS "socialLinks",
          COALESCE(group_by_category, false) AS "groupByCategory",
          COALESCE(group_style, 'accordion') AS "groupStyle",
          COALESCE(folders_default_expanded, true) AS "foldersDefaultExpanded",
          COALESCE(show_badges, false) AS "showBadges",
          COALESCE(custom_domain, '') AS "customDomain",
          COALESCE(subdomain, '') AS "subdomain"
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
        COALESCE(status_color, 'none') AS "statusColor",
        COALESCE(is_verified, true) AS "isVerified",
        COALESCE(banner, '') AS "banner",
        COALESCE(banner_pattern, 'mesh') AS "bannerPattern",
        COALESCE(badges, '[]'::jsonb) AS "badges",
        COALESCE(social_links, '{}'::jsonb) AS "socialLinks",
        COALESCE(group_by_category, false) AS "groupByCategory",
        COALESCE(group_style, 'accordion') AS "groupStyle",
        COALESCE(folders_default_expanded, true) AS "foldersDefaultExpanded",
        COALESCE(show_badges, false) AS "showBadges",
        COALESCE(custom_domain, '') AS "customDomain",
        COALESCE(subdomain, '') AS "subdomain"
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
        statusColor: profile.statusColor || 'none',
        isVerified: profile.isVerified !== undefined ? profile.isVerified : true,
        banner: profile.banner || '',
        bannerPattern: profile.bannerPattern || 'mesh',
        badges: profile.badges || [],
        socialLinks: profile.socialLinks,
        groupByCategory: profile.groupByCategory !== undefined ? Boolean(profile.groupByCategory) : false,
        groupStyle: profile.groupStyle || 'accordion',
        foldersDefaultExpanded: profile.foldersDefaultExpanded !== undefined ? Boolean(profile.foldersDefaultExpanded) : true,
        showBadges: profile.showBadges !== undefined ? Boolean(profile.showBadges) : false,
        customDomain: profile.customDomain || '',
        subdomain: profile.subdomain || ''
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
          statusColor: 'none',
          isVerified: true,
          banner: '',
          bannerPattern: 'mesh',
          badges: [],
          socialLinks: {
            github: 'https://github.com',
            linkedin: 'https://linkedin.com',
            instagram: 'https://instagram.com'
          },
          groupByCategory: false,
          foldersDefaultExpanded: true,
          showBadges: false
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
      groupStyle,
      foldersDefaultExpanded,
      showBadges,
      customDomain,
      subdomain
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
    const safeStatusColor = statusColor || 'none'
    const safeIsVerified = isVerified !== undefined ? Boolean(isVerified) : true
    const safeGroupByCategory = groupByCategory !== undefined ? Boolean(groupByCategory) : false
    const safeGroupStyle = groupStyle || 'accordion'
    const safeFoldersDefaultExpanded = foldersDefaultExpanded !== undefined ? Boolean(foldersDefaultExpanded) : true
    const safeShowBadges = showBadges !== undefined ? Boolean(showBadges) : false
    const safeCustomDomain = customDomain !== undefined ? String(customDomain).trim() : ''
    const safeSubdomain = subdomain !== undefined ? String(subdomain).trim() : ''

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
        show_badges = $16,
        group_style = $17,
        custom_domain = $18,
        subdomain = $19,
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
        COALESCE(status_color, 'none') AS "statusColor",
        COALESCE(is_verified, true) AS "isVerified",
        COALESCE(banner, '') AS "banner", 
        COALESCE(banner_pattern, 'mesh') AS "bannerPattern", 
        COALESCE(badges, '[]'::jsonb) AS "badges", 
        COALESCE(social_links, '{}'::jsonb) AS "socialLinks",
        COALESCE(group_by_category, false) AS "groupByCategory",
        COALESCE(group_style, 'accordion') AS "groupStyle",
        COALESCE(folders_default_expanded, true) AS "foldersDefaultExpanded",
        COALESCE(show_badges, false) AS "showBadges",
        COALESCE(custom_domain, '') AS "customDomain",
        COALESCE(subdomain, '') AS "subdomain"
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
      safeFoldersDefaultExpanded,
      safeShowBadges,
      safeGroupStyle,
      safeCustomDomain,
      safeSubdomain
    ])

    if (result.rows.length === 0) {
      // Eğer profil yoksa yeni oluştur
      const insertResult = await query(`
        INSERT INTO profiles (
          name, username, bio, avatar, banner, banner_pattern, badges, social_links, avatar_shape, avatar_glow, status_text, status_color, is_verified, group_by_category, folders_default_expanded, show_badges
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING 
          name, 
          username, 
          bio, 
          avatar, 
          COALESCE(avatar_shape, 'circle') AS "avatarShape",
          COALESCE(avatar_glow, 'yellow') AS "avatarGlow",
          COALESCE(status_text, 'Yeni Projelere & Fırsatlara Açık') AS "statusText",
          COALESCE(status_color, 'none') AS "statusColor",
          COALESCE(is_verified, true) AS "isVerified",
          COALESCE(banner, '') AS "banner", 
          COALESCE(banner_pattern, 'mesh') AS "bannerPattern", 
          COALESCE(badges, '[]'::jsonb) AS "badges", 
          COALESCE(social_links, '{}'::jsonb) AS "socialLinks",
          COALESCE(group_by_category, false) AS "groupByCategory",
          COALESCE(folders_default_expanded, true) AS "foldersDefaultExpanded",
          COALESCE(show_badges, false) AS "showBadges"
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
        safeFoldersDefaultExpanded,
        safeShowBadges
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

// VCard (.vcf) Üretici Yardımcısı (RFC 6350 / vCard 3.0 Standardı)
export const buildVCardString = (profile, req) => {
  const name = profile.name || 'Linkspace Kullanıcısı'
  const nameParts = name.trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  const cleanUsername = (profile.username || 'user').replace('@', '').trim()
  
  const social = typeof profile.socialLinks === 'string' ? JSON.parse(profile.socialLinks || '{}') : (profile.socialLinks || {})
  const email = social.email || `${cleanUsername}@gmail.com`
  const phone = social.phone || ''
  
  const host = req?.get ? req.get('host') : 'linkspace-app.onrender.com'
  const protocol = req?.protocol || 'https'
  const profileUrl = `${protocol}://${host}/`

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN;CHARSET=UTF-8:${name}`,
    `N;CHARSET=UTF-8:${lastName};${firstName};;;`,
    `TITLE;CHARSET=UTF-8:${(profile.bio || 'Linkspace Dijital Portfolyo').replace(/\r?\n/g, ' ')}`,
    `EMAIL;TYPE=INTERNET,HOME:${email}`,
    phone ? `TEL;TYPE=CELL,VOICE:${phone}` : '',
    `URL:${profileUrl}`,
    `NOTE;CHARSET=UTF-8:Linkspace Dijital Kartvizit & Portfolyo`,
    social.github ? `X-SOCIALPROFILE;type=github:${social.github}` : '',
    social.linkedin ? `X-SOCIALPROFILE;type=linkedin:${social.linkedin}` : '',
    social.twitter ? `X-SOCIALPROFILE;type=twitter:${social.twitter}` : '',
    social.instagram ? `X-SOCIALPROFILE;type=instagram:${social.instagram}` : '',
    `REV:${new Date().toISOString()}`,
    'END:VCARD'
  ].filter(Boolean)

  return lines.join('\r\n')
}

// GET /api/profile/vcard (Ziyaretçinin rehberine kişi kaydetmesi için .vcf dosyası)
router.get('/vcard', async (req, res) => {
  try {
    const profileRes = await query('SELECT * FROM profiles ORDER BY id ASC LIMIT 1')
    const profile = profileRes.rows[0] || mockProfile
    const vcardContent = buildVCardString(profile, req)
    const cleanUsername = (profile.username || 'contact').replace('@', '').trim()

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${cleanUsername}.vcf"`)
    res.send(vcardContent)
  } catch (error) {
    console.error('vCard üretme hatası:', error)
    const fallbackVCard = buildVCardString(mockProfile, req)
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="contact.vcf"')
    res.send(fallbackVCard)
  }
})

// GET /api/profile/:username/vcard (Belirli kullanıcı için .vcf)
router.get('/:username/vcard', async (req, res) => {
  try {
    const cleanUsername = (req.params.username || '').replace(/^@/, '').trim().toLowerCase()
    const profileRes = await query('SELECT * FROM profiles WHERE LOWER(REPLACE(username, \'@\', \'\')) = $1 LIMIT 1', [cleanUsername])
    const profile = profileRes.rows[0] || mockProfile
    const vcardContent = buildVCardString(profile, req)

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${cleanUsername}.vcf"`)
    res.send(vcardContent)
  } catch (error) {
    console.error('vCard üretme hatası:', error)
    res.status(500).send('vCard oluşturulamadı')
  }
})

// GET /api/profile/export (Data Portability: Tüm profil, link ve istatistikleri .json veya .csv indir)
router.get('/export', requireAuth, async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase()

    const profileRes = await query('SELECT * FROM profiles ORDER BY id ASC LIMIT 1')
    const linksRes = await query('SELECT * FROM links ORDER BY order_index ASC, id DESC')
    const profile = profileRes.rows[0] || mockProfile
    const links = linksRes.rows || []

    if (format === 'csv') {
      // CSV Formatında Link Ağacı Dışa Aktarımı
      const headers = ['id', 'title', 'url', 'category', 'clicks', 'is_active', 'is_scheduled', 'is_header', 'created_at']
      const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`
      
      const rows = links.map(l => [
        l.id,
        escapeCsv(l.title),
        escapeCsv(l.url),
        escapeCsv(l.category),
        l.clicks || 0,
        l.is_active ? '1' : '0',
        l.is_scheduled ? '1' : '0',
        l.is_header ? '1' : '0',
        escapeCsv(l.created_at)
      ].join(','))

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
      const filename = `linkspace-links-${new Date().toISOString().slice(0, 10)}.csv`

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      return res.send(csvContent)
    }

    // JSON Formatında Eksiksiz Yedekleme (Full Profile + Links + Settings)
    const settingsRes = await query('SELECT * FROM settings')
    const backupData = {
      version: 'linkspace-backup-v1.0',
      exportedAt: new Date().toISOString(),
      profile: {
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        avatar: profile.avatar,
        avatarShape: profile.avatar_shape || 'circle',
        avatarGlow: profile.avatar_glow || 'yellow',
        statusText: profile.status_text,
        statusColor: profile.status_color,
        isVerified: profile.is_verified,
        banner: profile.banner,
        bannerPattern: profile.banner_pattern,
        badges: profile.badges,
        socialLinks: profile.social_links,
        groupByCategory: profile.group_by_category,
        groupStyle: profile.group_style || 'accordion',
        foldersDefaultExpanded: profile.folders_default_expanded,
        showBadges: profile.show_badges,
        customDomain: profile.custom_domain,
        subdomain: profile.subdomain
      },
      links: links.map(l => ({
        id: l.id,
        title: l.title,
        url: l.url,
        category: l.category,
        icon: l.icon,
        customColor: l.custom_color,
        clicks: l.clicks,
        orderIndex: l.order_index,
        isActive: l.is_active,
        isScheduled: l.is_scheduled,
        scheduleStart: l.schedule_start,
        scheduleEnd: l.schedule_end,
        showCountdown: l.show_countdown,
        embedType: l.embed_type,
        showEmbed: l.show_embed,
        isLocked: l.is_locked,
        lockType: l.lock_type,
        passcode: l.passcode,
        lockWarning: l.lock_warning,
        isHeader: l.is_header,
        abTestEnabled: l.ab_test_enabled,
        titleB: l.title_b,
        urlB: l.url_b,
        clicksA: l.clicks_a,
        clicksB: l.clicks_b,
        viewsA: l.views_a,
        viewsB: l.views_b
      })),
      settings: settingsRes.rows
    }

    const filename = `linkspace-backup-${new Date().toISOString().slice(0, 10)}.json`
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(JSON.stringify(backupData, null, 2))
  } catch (error) {
    console.error('Dışa aktarma hatası:', error)
    res.status(500).json({ error: 'Yedekleme dosyası oluşturulamadı' })
  }
})

// POST /api/profile/import (Data Portability: JSON yedek dosyasından tüm verileri geri yükle)
router.post('/import', requireAuth, async (req, res) => {
  try {
    const { profile, links } = req.body || {}

    if (!profile && (!Array.isArray(links) || links.length === 0)) {
      return res.status(400).json({ error: 'Geçersiz yedek dosyası içeriği. Profile veya links bulunamadı.' })
    }

    // 1. Profil Geri Yükle
    if (profile) {
      await query(`
        UPDATE profiles
        SET 
          name = COALESCE($1, name),
          username = COALESCE($2, username),
          bio = COALESCE($3, bio),
          avatar = COALESCE($4, avatar),
          banner = COALESCE($5, banner),
          banner_pattern = COALESCE($6, banner_pattern),
          badges = COALESCE($7, badges),
          social_links = COALESCE($8, social_links),
          avatar_shape = COALESCE($9, avatar_shape),
          avatar_glow = COALESCE($10, avatar_glow),
          status_text = COALESCE($11, status_text),
          status_color = COALESCE($12, status_color),
          is_verified = COALESCE($13, is_verified),
          group_by_category = COALESCE($14, group_by_category),
          group_style = COALESCE($15, group_style),
          folders_default_expanded = COALESCE($16, folders_default_expanded),
          show_badges = COALESCE($17, show_badges),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM profiles ORDER BY id ASC LIMIT 1)
      `, [
        profile.name,
        profile.username,
        profile.bio,
        profile.avatar,
        profile.banner,
        profile.bannerPattern,
        Array.isArray(profile.badges) ? JSON.stringify(profile.badges) : null,
        typeof profile.socialLinks === 'object' ? JSON.stringify(profile.socialLinks) : null,
        profile.avatarShape,
        profile.avatarGlow,
        profile.statusText,
        profile.statusColor,
        profile.isVerified,
        profile.groupByCategory,
        profile.groupStyle,
        profile.foldersDefaultExpanded,
        profile.showBadges
      ])
    }

    // 2. Linkleri Geri Yükle
    let restoredCount = 0
    if (Array.isArray(links) && links.length > 0) {
      // İsteğe bağlı olarak mevcut linkleri koru veya sil ve yenileri ekle
      await query('BEGIN')
      await query('DELETE FROM links')
      for (let i = 0; i < links.length; i++) {
        const l = links[i]
        const linkId = l.id || (Date.now() + i)
        await query(`
          INSERT INTO links (
            id, title, url, is_active, icon, custom_color, clicks, order_index,
            category, embed_type, show_embed, is_locked, lock_type, passcode, lock_warning,
            is_header, ab_test_enabled, title_b, url_b, clicks_a, clicks_b, views_a, views_b
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        `, [
          linkId,
          l.title || 'Bağlantı',
          l.url || '',
          l.isActive !== undefined ? l.isActive : true,
          l.icon || 'auto',
          l.customColor || 'default',
          l.clicks || 0,
          l.orderIndex !== undefined ? l.orderIndex : i,
          l.category || '',
          l.embedType || 'none',
          Boolean(l.showEmbed),
          Boolean(l.isLocked),
          l.lockType || 'pin',
          l.passcode || '',
          l.lockWarning || '',
          Boolean(l.isHeader),
          Boolean(l.abTestEnabled),
          l.titleB || '',
          l.urlB || '',
          l.clicksA || 0,
          l.clicksB || 0,
          l.viewsA || 0,
          l.viewsB || 0
        ])
        restoredCount++
      }
      await query('COMMIT')
    }

    invalidateCache('profile')
    res.json({
      success: true,
      message: `Yedekleme başarıyla geri yüklendi! (${restoredCount} bağlantı içe aktarıldı)`,
      restoredLinksCount: restoredCount
    })
  } catch (error) {
    await query('ROLLBACK').catch(() => {})
    console.error('İçe aktarma hatası:', error)
    res.status(500).json({ error: 'Yedek geri yüklenirken bir hata oluştu: ' + error.message })
  }
})

export default router

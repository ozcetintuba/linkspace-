import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { cacheMiddleware, invalidateCache } from '../middleware/cacheService.js'
import { mockUsers } from './usersRoutes.js'

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
  showBadges: false,
  layoutStyle: 'list'
}

export const getMockLinksForUser = (user) => {
  const username = (user.username || '').replace(/^@/, '').toLowerCase()

  if (username === 'tubagul' || username === 'admin') {
    return [
      { id: 1, title: 'Kişisel Web Sitem & Portfolyom', url: 'https://github.com/tubaaa7', isActive: true, icon: 'globe', customColor: 'default', clicks: 12, orderIndex: 0, gridSpan: 'featured', thumbnail: '', cardBadge: '⭐ Vitrin' },
      { id: 2, title: 'GitHub Açık Kaynak Projelerim', url: 'https://github.com/tubaaa7/linkspace-', isActive: true, icon: 'github', customColor: 'default', clicks: 38, orderIndex: 1, gridSpan: 'half' },
      { id: 3, title: 'Lo-Fi Chill Beats (Spotify)', url: 'https://open.spotify.com', isActive: true, icon: 'music', customColor: 'default', clicks: 19, orderIndex: 2, gridSpan: 'half' },
      { id: 4, title: 'VIP Kodlama & Discord Topluluğu', url: 'https://discord.com', isActive: true, icon: 'globe', customColor: 'purple', clicks: 44, orderIndex: 3, gridSpan: 'full' }
    ]
  }

  if (username === 'selin.design') {
    return [
      { id: 201, title: 'Selin Kaya Design Studio & Portfolyo', url: 'https://dribbble.com', isActive: true, icon: 'globe', customColor: 'default', clicks: 68, orderIndex: 0, gridSpan: 'featured', thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&auto=format&fit=crop&q=80', cardBadge: '🎨 Portfolyo' },
      { id: 202, title: 'Figma UI Kit & Design System 2026', url: 'https://figma.com', isActive: true, icon: 'code', customColor: 'default', clicks: 45, orderIndex: 1, gridSpan: 'half', cardBadge: '🔥 Popüler' },
      { id: 203, title: 'Dribbble Tasarım Vaka Analizleri', url: 'https://dribbble.com', isActive: true, icon: 'sparkles', customColor: 'default', clicks: 31, orderIndex: 2, gridSpan: 'half' },
      { id: 204, title: 'Behance Marka Kimliği & İllüstrasyonlar', url: 'https://behance.net', isActive: true, icon: 'globe', customColor: 'default', clicks: 27, orderIndex: 3, gridSpan: 'full' },
      { id: 205, title: 'Tasarım Danışmanlığı & Teklif İste', url: 'mailto:selin.design@creatives.co', isActive: true, icon: 'mail', customColor: 'emerald', clicks: 16, orderIndex: 4, gridSpan: 'full' }
    ]
  }

  if (username === 'mert.dev') {
    return [
      { id: 301, title: 'GitHub Açık Kaynak Kütüphanelerim', url: 'https://github.com', isActive: true, icon: 'github', customColor: 'default', clicks: 84, orderIndex: 0, gridSpan: 'featured', thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80', cardBadge: '🚀 Açık Kaynak' },
      { id: 302, title: 'Node.js & Go Backend Mimarileri Blogu', url: 'https://medium.com', isActive: true, icon: 'book', customColor: 'default', clicks: 52, orderIndex: 1, gridSpan: 'half' },
      { id: 303, title: 'LinkedIn & Profesyonel Kariyer Ağı', url: 'https://linkedin.com', isActive: true, icon: 'linkedin', customColor: 'default', clicks: 39, orderIndex: 2, gridSpan: 'half' }
    ]
  }

  if (username === 'can.tech') {
    return [
      { id: 401, title: 'AWS Cloud & DevOps En İyi Uygulamaları', url: 'https://aws.amazon.com', isActive: true, icon: 'terminal', customColor: 'default', clicks: 43, orderIndex: 0, gridSpan: 'full', cardBadge: '☁️ Cloud' },
      { id: 402, title: 'Kubernetes & CI/CD Pipeline Rehberim', url: 'https://kubernetes.io', isActive: true, icon: 'code', customColor: 'default', clicks: 29, orderIndex: 1, gridSpan: 'full' }
    ]
  }

  // Genel veya yeni oluşturulan kullanıcılar için dinamik demo linkler
  return [
    { id: Date.now() + 1, title: `${user.name} Resmi Web Sitesi`, url: 'https://google.com', isActive: true, icon: 'globe', customColor: 'default', clicks: 12, orderIndex: 0, gridSpan: 'full' },
    { id: Date.now() + 2, title: 'Sosyal Medya & İletişim', url: user.email ? `mailto:${user.email}` : 'https://instagram.com', isActive: true, icon: 'mail', customColor: 'default', clicks: 5, orderIndex: 1, gridSpan: 'full' }
  ]
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
          COALESCE(subdomain, '') AS "subdomain",
          COALESCE(layout_style, 'list') AS "layoutStyle"
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

export const buildMockPublicProfileResponse = (foundMock) => {
  const cleanName = (foundMock.username || '').replace(/^@/, '').toLowerCase()
  const isMainOwner = cleanName === 'tubagul' || cleanName === 'admin'
  return {
    profile: {
      name: foundMock.name,
      username: `@${foundMock.username.replace(/^@/, '')}`,
      bio: foundMock.bio || `${foundMock.name} resmi bağlantıları ✨`,
      avatar: foundMock.avatar,
      avatarShape: 'circle',
      avatarGlow: 'yellow',
      avatarMode: isMainOwner ? 'switchable' : 'photo',
      role: foundMock.role || (isMainOwner ? 'admin' : 'user'),
      statusText: 'Yeni Projelere & Fırsatlara Açık',
      statusColor: 'none',
      isVerified: foundMock.isVerified !== undefined ? foundMock.isVerified : true,
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
      showBadges: false,
      layoutStyle: foundMock.layoutStyle || 'list'
    },
    links: getMockLinksForUser(foundMock)
  }
}

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
        COALESCE(subdomain, '') AS "subdomain",
        COALESCE(layout_style, 'list') AS "layoutStyle"
      FROM profiles 
      WHERE LOWER(REPLACE(username, '@', '')) = $1
      LIMIT 1
    `, [cleanUsername])

    if (profileResult.rows.length === 0) {
      // Veritabanında profil bulunamadıysa mock kullanıcıları kontrol et
      const foundMock = mockUsers.find(u => u.username.toLowerCase().replace(/^@/, '') === cleanUsername) ||
        (cleanUsername === 'admin' || cleanUsername === 'tubagul' ? mockUsers[0] : null)

      if (foundMock) {
        return res.json(buildMockPublicProfileResponse(foundMock))
      }

      return res.status(404).json({ error: `'${username}' kullanıcısına ait profil bulunamadı` })
    }

    const profile = profileResult.rows[0]
    const isMainOwner = cleanUsername === 'tubagul' || cleanUsername === 'admin'

    let userLinks = []
    if (isMainOwner) {
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
          COALESCE(views_b, 0) AS "viewsB",
          COALESCE(grid_span, 'full') AS "gridSpan",
          COALESCE(thumbnail, '') AS "thumbnail",
          COALESCE(card_badge, '') AS "cardBadge"
        FROM links 
        WHERE is_active = true
          AND (is_scheduled = false OR schedule_end IS NULL OR schedule_end >= CURRENT_TIMESTAMP)
        ORDER BY order_index ASC, id DESC
      `)
      userLinks = linksResult.rows
    } else {
      userLinks = getMockLinksForUser({ ...profile, username: cleanUsername })
    }

    res.json({
      profile: {
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        avatar: profile.avatar,
        avatarShape: profile.avatarShape || 'circle',
        avatarGlow: profile.avatarGlow || 'yellow',
        avatarMode: isMainOwner ? 'switchable' : 'photo',
        role: isMainOwner ? 'admin' : 'user',
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
        subdomain: profile.subdomain || '',
        layoutStyle: profile.layoutStyle || 'list'
      },
      links: userLinks
    })
  } catch (error) {
    console.error('Kullanıcı profili getirme hatası:', error)

    // Veritabanı çevrimdışıysa ve kullanıcı sorgulanıyorsa graceful fallback sun
    const cleanUser = (req.params.username || '').replace(/^@/, '').trim().toLowerCase()
    const foundMock = mockUsers.find(u => u.username.toLowerCase().replace(/^@/, '') === cleanUser) ||
      (cleanUser === 'admin' || cleanUser === 'tubagul' ? mockUsers[0] : null)

    if (foundMock) {
      return res.json(buildMockPublicProfileResponse(foundMock))
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
      subdomain,
      layoutStyle
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
    const safeLayoutStyle = layoutStyle || 'list'

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
        layout_style = $20,
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
        COALESCE(subdomain, '') AS "subdomain",
        COALESCE(layout_style, 'list') AS "layoutStyle"
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
      safeSubdomain,
      safeLayoutStyle
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
    console.warn('⚠️ [DB Çevrimdışı] Profil bellekte güncelleniyor:', error.message)
    mockProfile = {
      ...mockProfile,
      ...req.body
    }
    invalidateCache('profile')
    return res.json(mockProfile)
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
        subdomain: profile.subdomain,
        layoutStyle: profile.layout_style || 'list'
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
        viewsB: l.views_b,
        gridSpan: l.grid_span || 'full',
        thumbnail: l.thumbnail || '',
        cardBadge: l.card_badge || ''
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

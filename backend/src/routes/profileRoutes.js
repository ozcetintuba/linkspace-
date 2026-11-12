import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js'
import { cacheMiddleware, invalidateCache } from '../middleware/cacheService.js'
import {
  RESERVED_USERNAMES,
  mockUsers,
  mockProfilesByUserId,
  mockLinksByUserId,
  mockSettingsByUserId,
  findMockUserByIdentifier,
  ensureMockUserState
} from '../mockState.js'

const router = Router()

const PROFILE_SELECT_COLUMNS = `
  p.id,
  p.user_id AS "userId",
  p.name, 
  p.username, 
  p.bio, 
  p.avatar, 
  COALESCE(p.avatar_shape, 'circle') AS "avatarShape",
  COALESCE(p.avatar_glow, 'yellow') AS "avatarGlow",
  COALESCE(p.avatar_mode, 'photo') AS "avatarMode",
  COALESCE(p.status_text, 'Yeni Projelere & Fırsatlara Açık') AS "statusText",
  COALESCE(p.status_color, 'none') AS "statusColor",
  COALESCE(p.is_verified, true) AS "isVerified",
  COALESCE(p.banner, '') AS "banner", 
  COALESCE(p.banner_pattern, 'mesh') AS "bannerPattern", 
  COALESCE(p.badges, '[]'::jsonb) AS "badges", 
  COALESCE(p.social_links, '{}'::jsonb) AS "socialLinks",
  COALESCE(p.group_by_category, false) AS "groupByCategory",
  COALESCE(p.group_style, 'accordion') AS "groupStyle",
  COALESCE(p.folders_default_expanded, true) AS "foldersDefaultExpanded",
  COALESCE(p.show_badges, false) AS "showBadges",
  COALESCE(p.custom_domain, '') AS "customDomain",
  COALESCE(p.subdomain, '') AS "subdomain",
  COALESCE(p.layout_style, 'list') AS "layoutStyle"
`

export const buildMockPublicProfileResponse = (foundMock) => {
  ensureMockUserState(foundMock)
  const prof = mockProfilesByUserId.get(foundMock.id)
  const links = (mockLinksByUserId.get(foundMock.id) || []).filter(l => l.isActive !== false)
  const settings = mockSettingsByUserId.get(foundMock.id) || { theme: 'midnight' }
  const cleanName = (prof?.username || foundMock.profileUsername || foundMock.username || '').replace(/^@/, '').toLowerCase()
  const isMainOwner = foundMock.id === 1 || cleanName === 'tubagul'

  return {
    theme: settings.theme || 'midnight',
    profile: {
      userId: foundMock.id,
      name: prof?.name || foundMock.name,
      username: prof?.username || `@${cleanName}`,
      bio: prof?.bio || `${foundMock.name} resmi bağlantıları ✨`,
      avatar: prof?.avatar || foundMock.avatar,
      avatarShape: prof?.avatarShape || 'circle',
      avatarGlow: prof?.avatarGlow || 'yellow',
      avatarMode: prof?.avatarMode || (isMainOwner ? 'switchable' : 'photo'),
      role: foundMock.role || (isMainOwner ? 'admin' : 'user'),
      status: foundMock.status || 'active',
      statusText: prof?.statusText || 'Yeni Projelere & Fırsatlara Açık',
      statusColor: prof?.statusColor || 'none',
      isVerified: prof?.isVerified !== undefined ? prof.isVerified : Boolean(foundMock.isVerified),
      banner: prof?.banner || '',
      bannerPattern: prof?.bannerPattern || 'mesh',
      badges: prof?.badges || [],
      socialLinks: prof?.socialLinks || {},
      groupByCategory: Boolean(prof?.groupByCategory),
      groupStyle: prof?.groupStyle || 'accordion',
      foldersDefaultExpanded: prof?.foldersDefaultExpanded !== undefined ? Boolean(prof.foldersDefaultExpanded) : true,
      showBadges: Boolean(prof?.showBadges),
      layoutStyle: prof?.layoutStyle || foundMock.layoutStyle || 'list'
    },
    links
  }
}

// 1. GET /api/profile/directory (Herkese açık aktif üye vitrini - Landing Showcase için)
router.get('/directory', cacheMiddleware(30), async (req, res) => {
  try {
    try {
      const result = await query(`
        SELECT 
          u.id,
          COALESCE(NULLIF(REPLACE(p.username, '@', ''), ''), u.username) AS "username",
          COALESCE(p.name, u.name) AS "name",
          COALESCE(p.bio, '') AS "bio",
          COALESCE(p.avatar, '') AS "avatar",
          COALESCE(p.is_verified, false) AS "isVerified",
          COALESCE(p.layout_style, 'list') AS "layoutStyle",
          COALESCE(u.role, 'user') AS "role",
          (SELECT COUNT(*)::int FROM links l WHERE l.user_id = u.id AND l.is_active = true) AS "linkCount"
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE COALESCE(u.status, 'active') = 'active'
        ORDER BY 
          CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END,
          p.is_verified DESC,
          u.created_at ASC
        LIMIT 12
      `)

      if (result.rows.length > 0) {
        return res.json({
          success: true,
          data: result.rows.map(r => ({
            ...r,
            profileUrl: `/@${r.username.replace(/^@/, '')}`
          }))
        })
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Dizin bellekten dönülüyor:', dbErr.message)
    }

    const activeMockDirectory = mockUsers
      .filter(u => (u.status || 'active') === 'active')
      .map(u => {
        ensureMockUserState(u)
        const p = mockProfilesByUserId.get(u.id)
        const links = mockLinksByUserId.get(u.id) || []
        const handle = (p?.username || u.profileUsername || u.username).replace(/^@/, '')
        return {
          id: u.id,
          username: handle,
          name: p?.name || u.name,
          bio: p?.bio || u.bio || '',
          avatar: p?.avatar || u.avatar || '',
          isVerified: p?.isVerified !== undefined ? p.isVerified : Boolean(u.isVerified),
          layoutStyle: p?.layoutStyle || u.layoutStyle || 'list',
          role: u.role || 'user',
          linkCount: links.filter(l => l.isActive !== false).length,
          profileUrl: `/@${handle}`
        }
      })

    res.json({ success: true, data: activeMockDirectory })
  } catch (error) {
    console.error('Topluluk dizini hatası:', error)
    res.status(500).json({ error: 'Topluluk dizini yüklenemedi' })
  }
})

// 2. GET /api/profile (Oturumlu kullanıcının kendi profili veya varsayılan profil)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const targetUserId = req.user?.id
    try {
      const result = targetUserId
        ? await query(`
            SELECT ${PROFILE_SELECT_COLUMNS}, COALESCE(u.role, 'user') AS "role", COALESCE(u.status, 'active') AS "status"
            FROM profiles p
            LEFT JOIN users u ON u.id = p.user_id
            WHERE p.user_id = $1
            LIMIT 1
          `, [targetUserId])
        : await query(`
            SELECT ${PROFILE_SELECT_COLUMNS}, 'admin' AS "role", 'active' AS "status"
            FROM profiles p
            ORDER BY p.id ASC
            LIMIT 1
          `)

      if (result.rows.length > 0) {
        return res.json(result.rows[0])
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Profil verisi bellekten dönülüyor:', dbErr.message)
    }

    const fallbackId = targetUserId || 1
    const fallbackUser = mockUsers.find(u => u.id === fallbackId) || mockUsers[0]
    ensureMockUserState(fallbackUser)
    return res.json({
      ...mockProfilesByUserId.get(fallbackUser.id),
      role: fallbackUser.role,
      status: fallbackUser.status
    })
  } catch (error) {
    console.error('Profil getirme hatası:', error)
    res.json(mockProfilesByUserId.get(1))
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
  const email = social.email || `${cleanUsername}@linkspace.me`
  const phone = social.phone || ''

  const host = req?.get ? req.get('host') : 'linkspace-app.onrender.com'
  const protocol = req?.protocol || 'https'
  const profileUrl = `${protocol}://${host}/@${cleanUsername}`

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

// GET /api/profile/vcard
router.get('/vcard', async (req, res) => {
  try {
    const profileRes = await query('SELECT * FROM profiles ORDER BY id ASC LIMIT 1')
    const profile = profileRes.rows[0] || mockProfilesByUserId.get(1)
    const vcardContent = buildVCardString(profile, req)
    const cleanUsername = (profile.username || 'contact').replace('@', '').trim()

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${cleanUsername}.vcf"`)
    res.send(vcardContent)
  } catch (error) {
    const fallbackVCard = buildVCardString(mockProfilesByUserId.get(1), req)
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="contact.vcf"')
    res.send(fallbackVCard)
  }
})

// GET /api/profile/export (Yalnızca kendi profil, link ve ayarları)
router.get('/export', requireAuth, async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase()
    const userId = req.user.id

    const profileRes = await query('SELECT * FROM profiles WHERE user_id = $1 LIMIT 1', [userId])
    const linksRes = await query('SELECT * FROM links WHERE user_id = $1 ORDER BY order_index ASC, id DESC', [userId])
    const profile = profileRes.rows[0] || mockProfilesByUserId.get(userId) || mockProfilesByUserId.get(1)
    const links = linksRes.rows || []

    if (format === 'csv') {
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

    const settingsRes = await query('SELECT key, value, updated_at FROM settings WHERE user_id = $1', [userId])
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

// POST /api/profile/import (Yalnızca kendi profilini geri yükle)
router.post('/import', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { profile, links } = req.body || {}

    if (!profile && (!Array.isArray(links) || links.length === 0)) {
      return res.status(400).json({ error: 'Geçersiz yedek dosyası içeriği. Profile veya links bulunamadı.' })
    }

    if (profile) {
      await query(`
        UPDATE profiles
        SET 
          name = COALESCE($1, name),
          bio = COALESCE($2, bio),
          avatar = COALESCE($3, avatar),
          banner = COALESCE($4, banner),
          banner_pattern = COALESCE($5, banner_pattern),
          badges = COALESCE($6, badges),
          social_links = COALESCE($7, social_links),
          avatar_shape = COALESCE($8, avatar_shape),
          avatar_glow = COALESCE($9, avatar_glow),
          status_text = COALESCE($10, status_text),
          status_color = COALESCE($11, status_color),
          group_by_category = COALESCE($12, group_by_category),
          group_style = COALESCE($13, group_style),
          folders_default_expanded = COALESCE($14, folders_default_expanded),
          show_badges = COALESCE($15, show_badges),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $16
      `, [
        profile.name,
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
        profile.groupByCategory,
        profile.groupStyle,
        profile.foldersDefaultExpanded,
        profile.showBadges,
        userId
      ])
    }

    let restoredCount = 0
    if (Array.isArray(links) && links.length > 0) {
      await query('BEGIN')
      await query('DELETE FROM links WHERE user_id = $1', [userId])
      for (let i = 0; i < links.length; i++) {
        const l = links[i]
        const linkId = Date.now() + i
        await query(`
          INSERT INTO links (
            id, user_id, title, url, is_active, icon, custom_color, clicks, order_index,
            category, embed_type, show_embed, is_locked, lock_type, passcode, lock_warning,
            is_header, ab_test_enabled, title_b, url_b, clicks_a, clicks_b, views_a, views_b
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        `, [
          linkId,
          userId,
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

// GET /api/profile/:username/vcard
router.get('/:username/vcard', async (req, res) => {
  try {
    const cleanUsername = (req.params.username || '').replace(/^@/, '').trim().toLowerCase()
    const profileRes = await query("SELECT * FROM profiles WHERE LOWER(REPLACE(username, '@', '')) = $1 LIMIT 1", [cleanUsername])
    const profile = profileRes.rows[0] || mockProfilesByUserId.get(findMockUserByIdentifier(cleanUsername)?.id || 1)
    const vcardContent = buildVCardString(profile, req)

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${cleanUsername}.vcf"`)
    res.send(vcardContent)
  } catch (error) {
    const fallbackVCard = buildVCardString(mockProfilesByUserId.get(1), req)
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="contact.vcf"')
    res.send(fallbackVCard)
  }
})

// GET /api/profile/:username (Herkese Açık Üye Linktree Profili + Aktif Linkler + Üye Teması)
router.get('/:username', optionalAuth, cacheMiddleware(60), async (req, res) => {
  try {
    const { username } = req.params
    if (!username) {
      return res.status(400).json({ error: 'Kullanıcı adı belirtilmelidir' })
    }

    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase()

    const profileResult = await query(`
      SELECT 
        ${PROFILE_SELECT_COLUMNS},
        COALESCE(u.role, 'user') AS "role",
        COALESCE(u.status, 'active') AS "status"
      FROM profiles p
      LEFT JOIN users u ON u.id = p.user_id OR LOWER(u.username) = LOWER(REPLACE(p.username, '@', ''))
      WHERE LOWER(REPLACE(p.username, '@', '')) = $1
         OR ($1 = 'admin' AND p.user_id = 1)
      LIMIT 1
    `, [cleanUsername])

    if (profileResult.rows.length === 0) {
      const foundMock = findMockUserByIdentifier(cleanUsername)
      if (foundMock) {
        const isRequesterAdmin = req.user?.role === 'admin'
        const isOwner = req.user?.id === foundMock.id
        if (foundMock.status === 'pending' && !isRequesterAdmin && !isOwner) {
          return res.status(403).json({ error: 'Bu profil henüz yönetici onayı bekliyor.', status: 'pending' })
        }
        if (foundMock.status === 'suspended' && !isRequesterAdmin) {
          return res.status(403).json({ error: 'Bu hesap geçici olarak askıya alınmıştır.', status: 'suspended' })
        }
        return res.json(buildMockPublicProfileResponse(foundMock))
      }

      return res.status(404).json({ error: `'${username}' kullanıcısına ait profil bulunamadı` })
    }

    const profile = profileResult.rows[0]
    const profileUserId = profile.userId || 1
    const isRequesterAdmin = req.user?.role === 'admin'
    const isOwner = req.user?.id === profileUserId

    if (profile.status === 'pending' && !isRequesterAdmin && !isOwner) {
      return res.status(403).json({ error: 'Bu profil henüz yönetici onayı bekliyor.', status: 'pending' })
    }
    if (profile.status === 'suspended' && !isRequesterAdmin) {
      return res.status(403).json({ error: 'Bu hesap geçici olarak askıya alınmıştır.', status: 'suspended' })
    }

    const linksResult = await query(`
      SELECT 
        id, title, url, is_active AS "isActive", icon, custom_color AS "customColor", 
        clicks, order_index AS "orderIndex",
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
      WHERE user_id = $1
        AND is_active = true
        AND (is_scheduled = false OR schedule_end IS NULL OR schedule_end >= CURRENT_TIMESTAMP)
      ORDER BY order_index ASC, id DESC
    `, [profileUserId])

    const themeRes = await query("SELECT value FROM settings WHERE user_id = $1 AND key = 'theme' LIMIT 1", [profileUserId])
    const userTheme = themeRes.rows[0]?.value || 'midnight'
    const isMainOwner = profileUserId === 1 || cleanUsername === 'tubagul' || cleanUsername === 'admin'

    res.json({
      theme: userTheme,
      profile: {
        userId: profileUserId,
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        avatar: profile.avatar,
        avatarShape: profile.avatarShape || 'circle',
        avatarGlow: profile.avatarGlow || 'yellow',
        avatarMode: profile.avatarMode || (isMainOwner ? 'switchable' : 'photo'),
        role: profile.role || (isMainOwner ? 'admin' : 'user'),
        status: profile.status || 'active',
        statusText: profile.statusText || 'Yeni Projelere & Fırsatlara Açık',
        statusColor: profile.statusColor || 'none',
        isVerified: profile.isVerified !== undefined ? profile.isVerified : true,
        banner: profile.banner || '',
        bannerPattern: profile.bannerPattern || 'mesh',
        badges: profile.badges || [],
        socialLinks: profile.socialLinks,
        groupByCategory: Boolean(profile.groupByCategory),
        groupStyle: profile.groupStyle || 'accordion',
        foldersDefaultExpanded: profile.foldersDefaultExpanded !== undefined ? Boolean(profile.foldersDefaultExpanded) : true,
        showBadges: Boolean(profile.showBadges),
        customDomain: profile.customDomain || '',
        subdomain: profile.subdomain || '',
        layoutStyle: profile.layoutStyle || 'list'
      },
      links: linksResult.rows
    })
  } catch (error) {
    console.warn('⚠️ [DB Çevrimdışı] Kullanıcı profili bellekten yükleniyor:', error.message)
    const cleanUser = (req.params.username || '').replace(/^@/, '').trim().toLowerCase()
    const foundMock = findMockUserByIdentifier(cleanUser)
    if (foundMock) {
      const isRequesterAdmin = req.user?.role === 'admin'
      const isOwner = req.user?.id === foundMock.id
      if (foundMock.status === 'pending' && !isRequesterAdmin && !isOwner) {
        return res.status(403).json({ error: 'Bu profil henüz yönetici onayı bekliyor.', status: 'pending' })
      }
      if (foundMock.status === 'suspended' && !isRequesterAdmin) {
        return res.status(403).json({ error: 'Bu hesap geçici olarak askıya alınmıştır.', status: 'suspended' })
      }
      return res.json(buildMockPublicProfileResponse(foundMock))
    }

    res.status(404).json({ error: `'${req.params.username}' kullanıcısına ait profil bulunamadı` })
  }
})

// PUT /api/profile (Oturumlu Kullanıcının Kendi Profilini Güncellemesi)
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const {
      name,
      username,
      bio,
      avatar,
      avatarShape,
      avatarGlow,
      avatarMode,
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

    const cleanTargetHandle = username.trim().toLowerCase().replace(/^@/, '')
    if (cleanTargetHandle.length < 3) {
      return res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalıdır' })
    }
    if (RESERVED_USERNAMES.has(cleanTargetHandle) && userId !== 1) {
      return res.status(400).json({ error: 'Bu kullanıcı adı sistem tarafından ayrılmıştır' })
    }

    const safeSocialLinks = typeof socialLinks === 'object' && socialLinks !== null ? JSON.stringify(socialLinks) : '{}'
    const safeBadges = Array.isArray(badges) ? JSON.stringify(badges) : '[]'
    const safeBanner = banner || ''
    const safeBannerPattern = bannerPattern || 'mesh'
    const safeAvatarShape = avatarShape || 'circle'
    const safeAvatarGlow = avatarGlow || 'yellow'
    const safeAvatarMode = avatarMode || 'photo'
    const safeStatusText = statusText !== undefined ? statusText : 'Yeni Projelere & Fırsatlara Açık'
    const safeStatusColor = statusColor || 'none'
    const safeGroupByCategory = groupByCategory !== undefined ? Boolean(groupByCategory) : false
    const safeGroupStyle = groupStyle || 'accordion'
    const safeFoldersDefaultExpanded = foldersDefaultExpanded !== undefined ? Boolean(foldersDefaultExpanded) : true
    const safeShowBadges = showBadges !== undefined ? Boolean(showBadges) : false
    const safeCustomDomain = customDomain !== undefined ? String(customDomain).trim() : ''
    const safeSubdomain = subdomain !== undefined ? String(subdomain).trim() : ''
    const safeLayoutStyle = layoutStyle || 'list'

    try {
      // Kullanıcı adı başka bir üyede kullanılıyor mu kontrol et
      const conflictCheck = await query(`
        SELECT id FROM profiles 
        WHERE LOWER(REPLACE(username, '@', '')) = $1 AND user_id != $2
        LIMIT 1
      `, [cleanTargetHandle, userId])

      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Bu kullanıcı adı başka bir üye tarafından kullanılıyor' })
      }

      // Doğrulama rozeti yalnızca admin tarafından veya mevcut değer korunarak tutulur
      const safeIsVerified = req.user.role === 'admin' && isVerified !== undefined ? Boolean(isVerified) : undefined

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
          avatar_mode = $11,
          status_text = $12,
          status_color = $13,
          is_verified = COALESCE($14, is_verified),
          group_by_category = $15,
          folders_default_expanded = $16,
          show_badges = $17,
          group_style = $18,
          custom_domain = $19,
          subdomain = $20,
          layout_style = $21,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $22
        RETURNING 
          ${PROFILE_SELECT_COLUMNS}
      `, [
        name.trim(),
        `@${cleanTargetHandle}`,
        bio || '',
        avatar || '',
        safeBanner,
        safeBannerPattern,
        safeBadges,
        safeSocialLinks,
        safeAvatarShape,
        safeAvatarGlow,
        safeAvatarMode,
        safeStatusText,
        safeStatusColor,
        safeIsVerified !== undefined ? safeIsVerified : null,
        safeGroupByCategory,
        safeFoldersDefaultExpanded,
        safeShowBadges,
        safeGroupStyle,
        safeCustomDomain,
        safeSubdomain,
        safeLayoutStyle,
        userId
      ])

      await query('UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [name.trim(), userId])

      if (result.rows.length > 0) {
        invalidateCache('profile')
        return res.json(result.rows[0])
      }
    } catch (dbErr) {
      console.warn('⚠️ [DB Çevrimdışı] Profil bellekte güncelleniyor:', dbErr.message)
    }

    const userObj = mockUsers.find(u => u.id === userId) || mockUsers[0]
    ensureMockUserState(userObj)
    const currentMock = mockProfilesByUserId.get(userObj.id)
    const updatedMock = {
      ...currentMock,
      ...req.body,
      userId: userObj.id,
      name: name.trim(),
      username: `@${cleanTargetHandle}`,
      isVerified: req.user.role === 'admin' && isVerified !== undefined ? Boolean(isVerified) : currentMock.isVerified
    }
    mockProfilesByUserId.set(userObj.id, updatedMock)
    userObj.name = name.trim()
    userObj.profileUsername = cleanTargetHandle
    userObj.bio = bio || ''
    userObj.avatar = avatar || userObj.avatar
    userObj.layoutStyle = safeLayoutStyle

    invalidateCache('profile')
    return res.json(updatedMock)
  } catch (error) {
    console.error('Profil güncelleme hatası:', error)
    res.status(500).json({ error: 'Profil güncellenemedi' })
  }
})

export default router

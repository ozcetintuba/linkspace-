import bcrypt from 'bcryptjs'

const DEFAULT_ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', 10)
const DEFAULT_MEMBER_PASSWORD_HASH = bcrypt.hashSync('demo1234', 10)

export const RESERVED_USERNAMES = new Set([
  'admin',
  'login',
  'register',
  'dashboard',
  'api',
  'health',
  'docs',
  'settings',
  'users',
  'profile',
  'auth',
  'analytics',
  'messages',
  'links',
  'static',
  'assets'
])

export const mockUsers = [
  {
    id: 1,
    username: 'admin',
    profileUsername: 'tubagul',
    name: 'Tuba Gül',
    email: 'admin@linktree.local',
    passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
    role: 'admin',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'Yazılım Mühendisliği Öğrencisi | Full-Stack Geliştirici Adayı 🚀',
    isVerified: true,
    linkCount: 4,
    profileUrl: '/@tubagul',
    layoutStyle: 'list',
    createdAt: '2026-10-15T10:00:00.000Z',
    lastSeen: '2026-11-10T11:45:00.000Z'
  },
  {
    id: 2,
    username: 'mert.dev',
    profileUsername: 'mert.dev',
    name: 'Mert Yılmaz',
    email: 'mert.yilmaz@devmail.io',
    passwordHash: DEFAULT_MEMBER_PASSWORD_HASH,
    role: 'user',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    bio: 'Senior Backend Engineer • Node.js & Go • Açık Kaynak Geliştirici 💻',
    isVerified: true,
    linkCount: 3,
    profileUrl: '/@mert.dev',
    layoutStyle: 'list',
    createdAt: '2026-10-22T14:20:00.000Z',
    lastSeen: '2026-11-10T09:30:00.000Z'
  },
  {
    id: 3,
    username: 'selin.design',
    profileUsername: 'selin.design',
    name: 'Selin Kaya',
    email: 'selin.design@creatives.co',
    passwordHash: DEFAULT_MEMBER_PASSWORD_HASH,
    role: 'user',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    bio: 'Product & Brand Designer • Design Systems • Minimalist UI/UX 🎨',
    isVerified: true,
    linkCount: 5,
    profileUrl: '/@selin.design',
    layoutStyle: 'bento',
    createdAt: '2026-10-28T09:15:00.000Z',
    lastSeen: '2026-11-09T17:10:00.000Z'
  },
  {
    id: 4,
    username: 'can.tech',
    profileUsername: 'can.tech',
    name: 'Can Demir',
    email: 'can.demir@cloudtech.com',
    passwordHash: DEFAULT_MEMBER_PASSWORD_HASH,
    role: 'user',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Cloud Architect & DevOps • AWS Certified • Kubernetes & CI/CD ☁️',
    isVerified: false,
    linkCount: 2,
    profileUrl: '/@can.tech',
    layoutStyle: 'list',
    createdAt: '2026-11-04T16:45:00.000Z',
    lastSeen: '2026-11-08T12:00:00.000Z'
  }
]

export const mockProfilesByUserId = new Map([
  [1, {
    userId: 1,
    name: 'Tuba Gül',
    username: '@tubagul',
    bio: 'Yazılım Mühendisliği Öğrencisi | Full-Stack Geliştirici Adayı 🚀',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    avatarShape: 'circle',
    avatarGlow: 'yellow',
    avatarMode: 'switchable',
    statusText: 'Yeni Projelere & Fırsatlara Açık',
    statusColor: 'none',
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
    },
    groupByCategory: false,
    groupStyle: 'accordion',
    foldersDefaultExpanded: true,
    showBadges: false,
    customDomain: '',
    subdomain: '',
    layoutStyle: 'list'
  }],
  [2, {
    userId: 2,
    name: 'Mert Yılmaz',
    username: '@mert.dev',
    bio: 'Senior Backend Engineer • Node.js & Go • Açık Kaynak Geliştirici 💻',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    avatarShape: 'circle',
    avatarGlow: 'yellow',
    avatarMode: 'photo',
    statusText: 'Yeni Projelere & Fırsatlara Açık',
    statusColor: 'none',
    isVerified: true,
    banner: '',
    bannerPattern: 'mesh',
    badges: [],
    socialLinks: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com'
    },
    groupByCategory: false,
    groupStyle: 'accordion',
    foldersDefaultExpanded: true,
    showBadges: false,
    customDomain: '',
    subdomain: '',
    layoutStyle: 'list'
  }],
  [3, {
    userId: 3,
    name: 'Selin Kaya',
    username: '@selin.design',
    bio: 'Product & Brand Designer • Design Systems • Minimalist UI/UX 🎨',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    avatarShape: 'circle',
    avatarGlow: 'yellow',
    avatarMode: 'photo',
    statusText: 'Yeni Projelere & Fırsatlara Açık',
    statusColor: 'none',
    isVerified: true,
    banner: '',
    bannerPattern: 'mesh',
    badges: [],
    socialLinks: {
      linkedin: 'https://linkedin.com',
      instagram: 'https://instagram.com'
    },
    groupByCategory: false,
    groupStyle: 'accordion',
    foldersDefaultExpanded: true,
    showBadges: false,
    customDomain: '',
    subdomain: '',
    layoutStyle: 'bento'
  }],
  [4, {
    userId: 4,
    name: 'Can Demir',
    username: '@can.tech',
    bio: 'Cloud Architect & DevOps • AWS Certified • Kubernetes & CI/CD ☁️',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    avatarShape: 'circle',
    avatarGlow: 'yellow',
    avatarMode: 'photo',
    statusText: 'Yeni Projelere & Fırsatlara Açık',
    statusColor: 'none',
    isVerified: false,
    banner: '',
    bannerPattern: 'mesh',
    badges: [],
    socialLinks: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com'
    },
    groupByCategory: false,
    groupStyle: 'accordion',
    foldersDefaultExpanded: true,
    showBadges: false,
    customDomain: '',
    subdomain: '',
    layoutStyle: 'list'
  }]
])

export const mockLinksByUserId = new Map([
  [1, [
    { id: 1, userId: 1, title: 'Kişisel Web Sitem & Portfolyom', url: 'https://github.com/tubaaa7', isActive: true, icon: 'globe', customColor: 'default', clicks: 12, orderIndex: 0, gridSpan: 'featured', thumbnail: '', cardBadge: '⭐ Vitrin' },
    { id: 2, userId: 1, title: 'GitHub Açık Kaynak Projelerim', url: 'https://github.com/tubaaa7/linkspace-', isActive: true, icon: 'github', customColor: 'default', clicks: 38, orderIndex: 1, gridSpan: 'half' },
    { id: 3, userId: 1, title: 'Lo-Fi Chill Beats (Spotify)', url: 'https://open.spotify.com', isActive: true, icon: 'music', customColor: 'default', clicks: 19, orderIndex: 2, gridSpan: 'half' },
    { id: 4, userId: 1, title: 'VIP Kodlama & Discord Topluluğu', url: 'https://discord.com', isActive: true, icon: 'globe', customColor: 'purple', clicks: 44, orderIndex: 3, gridSpan: 'full' }
  ]],
  [2, [
    { id: 301, userId: 2, title: 'GitHub Açık Kaynak Kütüphanelerim', url: 'https://github.com', isActive: true, icon: 'github', customColor: 'default', clicks: 84, orderIndex: 0, gridSpan: 'featured', thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80', cardBadge: '🚀 Açık Kaynak' },
    { id: 302, userId: 2, title: 'Node.js & Go Backend Mimarileri Blogu', url: 'https://medium.com', isActive: true, icon: 'book', customColor: 'default', clicks: 52, orderIndex: 1, gridSpan: 'half' },
    { id: 303, userId: 2, title: 'LinkedIn & Profesyonel Kariyer Ağı', url: 'https://linkedin.com', isActive: true, icon: 'linkedin', customColor: 'default', clicks: 39, orderIndex: 2, gridSpan: 'half' }
  ]],
  [3, [
    { id: 201, userId: 3, title: 'Selin Kaya Design Studio & Portfolyo', url: 'https://dribbble.com', isActive: true, icon: 'globe', customColor: 'default', clicks: 68, orderIndex: 0, gridSpan: 'featured', thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&auto=format&fit=crop&q=80', cardBadge: '🎨 Portfolyo' },
    { id: 202, userId: 3, title: 'Figma UI Kit & Design System 2026', url: 'https://figma.com', isActive: true, icon: 'code', customColor: 'default', clicks: 45, orderIndex: 1, gridSpan: 'half', cardBadge: '🔥 Popüler' },
    { id: 203, userId: 3, title: 'Dribbble Tasarım Vaka Analizleri', url: 'https://dribbble.com', isActive: true, icon: 'sparkles', customColor: 'default', clicks: 31, orderIndex: 2, gridSpan: 'half' },
    { id: 204, userId: 3, title: 'Behance Marka Kimliği & İllüstrasyonlar', url: 'https://behance.net', isActive: true, icon: 'globe', customColor: 'default', clicks: 27, orderIndex: 3, gridSpan: 'full' },
    { id: 205, userId: 3, title: 'Tasarım Danışmanlığı & Teklif İste', url: 'mailto:selin.design@creatives.co', isActive: true, icon: 'mail', customColor: 'emerald', clicks: 16, orderIndex: 4, gridSpan: 'full' }
  ]],
  [4, [
    { id: 401, userId: 4, title: 'AWS Cloud & DevOps En İyi Uygulamaları', url: 'https://aws.amazon.com', isActive: true, icon: 'terminal', customColor: 'default', clicks: 43, orderIndex: 0, gridSpan: 'full', cardBadge: '☁️ Cloud' },
    { id: 402, userId: 4, title: 'Kubernetes & CI/CD Pipeline Rehberim', url: 'https://kubernetes.io', isActive: true, icon: 'code', customColor: 'default', clicks: 29, orderIndex: 1, gridSpan: 'full' }
  ]]
])

export const mockSettingsByUserId = new Map([
  [1, {
    theme: 'midnight',
    seo: {
      metaTitle: 'Tuba Gül - Full-Stack Developer | linkspace',
      metaDescription: 'Tuba Gül\'ün projeleri, portfolyosu, iletişim kanalları ve sosyal medya hesapları.',
      ogImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=630&fit=crop&q=80',
      customDomain: 'tubagul.dev',
      domainVerified: true
    }
  }]
])

export const mockMessagesByUserId = new Map([
  [1, [
    {
      id: 1,
      userId: 1,
      name: 'Elif Kaya',
      email: 'elif.kaya@startup.io',
      message: 'Harika bir profil! Önümüzdeki ay düzenleyeceğimiz Web & Mobil Teknoloji Zirvesi\'nde konuşmacı olarak yer almak ister misiniz?',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 2,
      userId: 1,
      name: 'Burak Yılmaz',
      email: 'burak@agency.com',
      message: 'Selamlar, freelance web geliştirme projelerimiz için portfolyonuzu inceledik. Müsaitlik durumunuz nedir?',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]]
])

let nextMockUserId = 100
let nextMockMessageId = 100

export const allocateMockUserId = () => nextMockUserId++
export const allocateMockMessageId = () => nextMockMessageId++

export const findMockUserByIdentifier = (identifier) => {
  const clean = String(identifier || '').trim().toLowerCase().replace(/^@/, '')
  return mockUsers.find(u =>
    u.username.toLowerCase() === clean ||
    (u.profileUsername && u.profileUsername.toLowerCase() === clean) ||
    (u.email && u.email.toLowerCase() === clean)
  ) || null
}

export const ensureMockUserState = (user) => {
  if (!user || !user.id) return
  const cleanUsername = (user.profileUsername || user.username || 'uye').replace(/^@/, '').toLowerCase()

  if (!mockProfilesByUserId.has(user.id)) {
    mockProfilesByUserId.set(user.id, {
      userId: user.id,
      name: user.name || cleanUsername,
      username: `@${cleanUsername}`,
      bio: user.bio || `${user.name || cleanUsername} kişisel linkspace profili ✨`,
      avatar: user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${cleanUsername}`,
      avatarShape: 'circle',
      avatarGlow: 'yellow',
      avatarMode: user.role === 'admin' ? 'switchable' : 'photo',
      statusText: 'Yeni Projelere & Fırsatlara Açık',
      statusColor: 'none',
      isVerified: user.isVerified !== undefined ? Boolean(user.isVerified) : false,
      banner: '',
      bannerPattern: 'mesh',
      badges: [],
      socialLinks: {},
      groupByCategory: false,
      groupStyle: 'accordion',
      foldersDefaultExpanded: true,
      showBadges: false,
      customDomain: '',
      subdomain: '',
      layoutStyle: user.layoutStyle || 'list'
    })
  }

  if (!mockLinksByUserId.has(user.id)) {
    mockLinksByUserId.set(user.id, [
      {
        id: Date.now() + user.id,
        userId: user.id,
        title: `${user.name || cleanUsername} Web Sitesi`,
        url: 'https://github.com',
        isActive: true,
        icon: 'globe',
        customColor: 'default',
        clicks: 0,
        orderIndex: 0,
        gridSpan: 'full',
        thumbnail: '',
        cardBadge: ''
      }
    ])
  }

  if (!mockSettingsByUserId.has(user.id)) {
    mockSettingsByUserId.set(user.id, {
      theme: 'midnight',
      seo: {
        metaTitle: `${user.name || cleanUsername} | linkspace`,
        metaDescription: `${user.name || cleanUsername} bağlantıları ve sosyal medya hesapları.`,
        ogImage: user.avatar || '',
        customDomain: '',
        domainVerified: false
      }
    })
  }

  if (!mockMessagesByUserId.has(user.id)) {
    mockMessagesByUserId.set(user.id, [])
  }
}

export const formatUserSummary = (u) => {
  ensureMockUserState(u)
  const prof = mockProfilesByUserId.get(u.id)
  const links = mockLinksByUserId.get(u.id) || []
  const handle = (prof?.username || u.profileUsername || u.username || '').replace(/^@/, '')
  return {
    id: u.id,
    username: handle,
    loginUsername: u.username,
    name: prof?.name || u.name,
    email: u.email,
    role: u.role || 'user',
    status: u.status || 'active',
    avatar: prof?.avatar || u.avatar || '',
    bio: prof?.bio || u.bio || '',
    isVerified: prof?.isVerified !== undefined ? Boolean(prof.isVerified) : Boolean(u.isVerified),
    linkCount: links.filter(l => l.isActive !== false).length,
    profileUrl: `/@${handle}`,
    layoutStyle: prof?.layoutStyle || u.layoutStyle || 'list',
    createdAt: u.createdAt || new Date().toISOString(),
    lastSeen: u.lastSeen || u.createdAt || new Date().toISOString()
  }
}

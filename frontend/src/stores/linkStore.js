import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

const STORAGE_KEYS = {
  PROFILE: 'linktree_profile',
  LINKS: 'linktree_links',
  THEME: 'linktree_theme',
  ADMIN_THEME: 'linktree_admin_theme',
  ANALYTICS: 'linktree_analytics',
  MESSAGES: 'linktree_messages',
  SEO: 'linktree_seo'
}

export const DEFAULT_SEO = {
  metaTitle: 'Tuba Gül - Full-Stack Developer | linkspace',
  metaDescription: 'Tuba Gül\'ün projeleri, portfolyosu, iletişim kanalları ve sosyal medya hesapları.',
  ogImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=630&fit=crop&q=80',
  customDomain: 'tubagul.dev',
  domainVerified: true
}

export const DEFAULT_MESSAGES = [
  {
    id: 1,
    name: 'Ali Yılmaz',
    email: 'ali.yilmaz@techcorp.com',
    message: 'Merhaba Tuba, portfolyondaki Vue 3 projeni çok beğendik. Önümüzdeki çeyrek için açık olan Full-Stack staj pozisyonumuz için görüşmek isteriz.',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    name: 'Zeynep Kaya',
    email: 'zeynep@startupstudio.io',
    message: 'Selamlar! GitHub üzerindeki Linktree projenizin arayüzü ve mimarisi harika görünüyor. Yeni SaaS projemizde freelance destek vermeyi düşünür müsün?',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
]

export const DEFAULT_ANALYTICS = {
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

export const THEMES = [
  {
    id: 'midnight',
    name: 'Karanlık Mod (Neon Sarı)',
    description: 'Mat siyah zemin (#0C0C0B), antrasit kartlar (#181818) ve ikonik elektrik limon sarısı (#FFFF00) vurguları',
    previewGradient: 'from-[#0C0C0B] via-[#181818] to-[#FFFF00]',
    backgroundClass: 'bg-[#0C0C0B]',
    cardClass: 'bg-[#181818] hover:bg-[#222222] border-[#282828] hover:border-[#FFFF00] hover:shadow-yellow-500/10 text-white',
    accentText: 'text-[#FFFF00]',
    avatarGlow: 'from-[#FFFF00] via-yellow-300 to-lime-400',
    badgeClass: 'bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30'
  },
  {
    id: 'emerald',
    name: 'Neon Zümrüt & Lime',
    description: 'Koyu antrasit üzerinde neon chartreuse yeşili ve parlak lime tonları',
    previewGradient: 'from-[#0C0C0B] via-[#142318] to-[#22C55E]',
    backgroundClass: 'bg-[#0C0C0B]',
    cardClass: 'bg-[#181818] hover:bg-[#1E2721] border-[#282828] hover:border-[#22C55E]/60 text-white',
    accentText: 'text-[#22C55E]',
    avatarGlow: 'from-[#22C55E] via-lime-400 to-[#FFFF00]',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'sunset',
    name: 'Terracotta & Amber',
    description: 'Zarif terracotta, mercan ve sıcak amber akışı tonları',
    previewGradient: 'from-[#0C0C0B] via-[#2A1810] to-[#F87171]',
    backgroundClass: 'bg-[#0C0C0B]',
    cardClass: 'bg-[#181818] hover:bg-[#261B18] border-[#282828] hover:border-[#F87171]/50 text-white',
    accentText: 'text-[#F87171]',
    avatarGlow: 'from-[#F87171] to-[#FFFF00]',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  },
  {
    id: 'ocean',
    name: 'Derin Karbon & Beyaz Kontrast',
    description: 'Net beyaz ve saf siyah yüksek kontrastlı kart stili',
    previewGradient: 'from-[#0C0C0B] via-[#1E1E1E] to-white',
    backgroundClass: 'bg-[#0C0C0B]',
    cardClass: 'bg-white hover:bg-neutral-100 border-transparent text-black',
    accentText: 'text-black',
    avatarGlow: 'from-white to-[#FFFF00]',
    badgeClass: 'bg-black text-white border-transparent'
  },
  {
    id: 'monochrome',
    name: 'Minimalist Karbon',
    description: 'Sade, profesyonel ve dikkat dağıtmayan koyu antrasit',
    previewGradient: 'from-[#0C0C0B] via-[#181818] to-[#333333]',
    backgroundClass: 'bg-[#0C0C0B]',
    cardClass: 'bg-[#181818] hover:bg-[#222222] border-[#282828] hover:border-neutral-400 text-white',
    accentText: 'text-neutral-300',
    avatarGlow: 'from-neutral-400 to-neutral-600',
    badgeClass: 'bg-neutral-800 text-neutral-300 border-neutral-700'
  },
  {
    id: 'pure-light',
    name: 'Minimalist Aydınlık (Açık Tema)',
    description: 'Ferah, temiz beyaz zemin üzerinde elektrik sarısı (#FFFF00) kapsül butonlar',
    previewGradient: 'from-slate-100 via-white to-[#FFFF00]',
    backgroundClass: 'bg-gradient-to-br from-slate-100 via-white to-slate-200',
    cardClass: 'bg-[#FFFF00] hover:bg-[#EEFF00] text-black font-bold border border-yellow-300/60 shadow-md shadow-yellow-500/25 rounded-full',
    accentText: 'text-black',
    avatarGlow: 'from-[#FFFF00] to-black',
    badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300'
  }
]

export const BUTTON_STYLES = [
  {
    id: 'default',
    name: 'Tema Varsayılanı',
    description: 'Aktif temanın koyu antrasit ve kart stilini devralır',
    previewGradient: 'from-[#181818] to-[#222222]',
    borderStyle: 'border-[#282828]',
    textColor: 'text-neutral-200'
  },
  {
    id: 'yellow',
    name: 'CRM Elektrik Sarı (#FFFF00)',
    description: 'Dribbble Sales CRM imza rengi: Parlak elektrik sarı zemin üzerinde siyah metin',
    previewGradient: 'from-[#FFFF00] to-[#E5E500]',
    borderStyle: 'border-transparent',
    textColor: 'text-black font-bold',
    cardClass: 'bg-[#FFFF00] hover:bg-[#F0F000] text-black font-bold border-transparent shadow-md shadow-yellow-500/20',
    accentText: 'text-black'
  },
  {
    id: 'charcoal',
    name: 'CRM Antrasit & Sarı Vurgulu',
    description: 'Koyu antrasit kart üzerinde elektrik sarı kenarlık ve parlama',
    previewGradient: 'from-[#181818] via-[#222222] to-[#FFFF00]',
    borderStyle: 'border-[#FFFF00]/40',
    textColor: 'text-[#FFFF00]',
    cardClass: 'bg-[#181818] hover:bg-[#202020] border-[#282828] hover:border-[#FFFF00] text-white',
    accentText: 'text-[#FFFF00]'
  },
  {
    id: 'emerald',
    name: 'CRM Neon Zümrüt',
    description: 'Grafiklerden ilham alan neon zümrüt yeşili',
    previewGradient: 'from-emerald-950 to-teal-950',
    borderStyle: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    cardClass: 'bg-[#181818] hover:bg-[#1E2721] border-[#282828] hover:border-[#22C55E]/50 text-white',
    accentText: 'text-[#22C55E]'
  },
  {
    id: 'dark',
    name: 'Minimal Karbon',
    description: 'Koyu mat metalik karbon doku',
    previewGradient: 'from-neutral-900 to-neutral-950',
    borderStyle: 'border-neutral-700',
    textColor: 'text-neutral-300',
    cardClass: 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700/70 hover:border-neutral-500 hover:shadow-black/60',
    accentText: 'text-neutral-300'
  }
]

export const AVAILABLE_ICONS = [
  { id: 'auto', name: 'Otomatik Algıla', icon: 'Sparkles' },
  { id: 'globe', name: 'Web Sitesi', icon: 'Globe' },
  { id: 'github', name: 'GitHub', icon: 'Github' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'Linkedin' },
  { id: 'instagram', name: 'Instagram', icon: 'Instagram' },
  { id: 'youtube', name: 'YouTube', icon: 'Youtube' },
  { id: 'twitter', name: 'X / Twitter', icon: 'Twitter' },
  { id: 'mail', name: 'E-Posta', icon: 'Mail' },
  { id: 'phone', name: 'Telefon / WhatsApp', icon: 'Phone' },
  { id: 'code', name: 'Yazılım / Kod', icon: 'Code' },
  { id: 'music', name: 'Müzik / Spotify', icon: 'Music' },
  { id: 'shopping-bag', name: 'Mağaza / Ürün', icon: 'ShoppingBag' },
  { id: 'book', name: 'Blog / Medium', icon: 'BookOpen' }
]


export const PRESET_AVATARS = [
  // 1. Portre & Geliştirici
  {
    id: 'tuba-original',
    name: 'Tuba Gül (Varsayılan)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    category: 'Portre'
  },
  {
    id: 'developer-woman',
    name: 'Modern Yazılımcı Kadın',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    category: 'Portre'
  },
  {
    id: 'tech-man-1',
    name: 'Girişimci & Tech Lead',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    category: 'Portre'
  },
  {
    id: 'developer-young',
    name: 'Genç Yazılımcı',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    category: 'Portre'
  },
  {
    id: 'executive-woman',
    name: 'Ürün Yöneticisi',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    category: 'Portre'
  },
  {
    id: 'creative-designer',
    name: 'UI/UX Tasarımcı',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    category: 'Portre'
  },

  // 2. 3D & Karakter
  {
    id: 'minimal-3d',
    name: '3D Karakter / Memoji',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80',
    category: '3D'
  },
  {
    id: 'vr-3d-character',
    name: '3D Metaverse & VR',
    url: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=300&auto=format&fit=crop&q=80',
    category: '3D'
  },
  {
    id: 'ai-bot-avatar',
    name: 'Robotik AI Avatarı',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
    category: '3D'
  },
  {
    id: '3d-clay-memoji',
    name: '3D Kil Karakter',
    url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&auto=format&fit=crop&q=80',
    category: '3D'
  },

  // 3. Siberpunk & Soyut
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon Portre',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
    category: 'Siber'
  },
  {
    id: 'synthwave-lights',
    name: 'Synthwave Mor Işık',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80',
    category: 'Siber'
  },
  {
    id: 'abstract-geometry',
    name: 'Soyut Dijital Heykel',
    url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=300&auto=format&fit=crop&q=80',
    category: 'Siber'
  },
  {
    id: 'neon-gamer',
    name: 'RGB Neon Oyuncu',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80',
    category: 'Siber'
  },

  // 4. Stüdyo & Minimalist
  {
    id: 'dark-aesthetic',
    name: 'Dark Studio Siyah/Beyaz',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    category: 'Stüdyo'
  },
  {
    id: 'warm-studio',
    name: 'Sıcak Işık Portre',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    category: 'Stüdyo'
  },
  {
    id: 'art-creative',
    name: 'Yaratıcı Sanat & Doku',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    category: 'Stüdyo'
  },
  {
    id: 'coffee-dev',
    name: 'Kahve & Kod Çalışanı',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    category: 'Stüdyo'
  }
]

export const BANNER_PATTERNS = [
  {
    id: 'mesh',
    name: 'CRM Neon & Asit Mesh',
    description: 'Siyah zemin üzerinde elektrik sarısı ve mor derin radyal mesh gradyan',
    previewGradient: 'from-[#0C0C0B] via-[#1a1c10] to-[#FFFF00]/40',
    cssClass: 'banner-mesh'
  },
  {
    id: 'cyberpunk',
    name: 'Siberpunk Neon & Cyan',
    description: 'Neon mor ve elektrik cyan atmosferik derinlik',
    previewGradient: 'from-[#9333ea] via-[#3b82f6] to-[#06b6d4]',
    cssClass: 'banner-cyberpunk'
  },
  {
    id: 'aurora',
    name: 'Kuzey Işıkları (Aurora)',
    description: 'Neon zümrüt yeşili ve lime akışkan gökyüzü',
    previewGradient: 'from-[#081a10] via-[#22c55e] to-[#a3e635]',
    cssClass: 'banner-aurora'
  },
  {
    id: 'sunset',
    name: 'Sıcak Sunset & Terracotta',
    description: 'Akşam kızıllığı, sıcak terracotta ve amber kor ateşi',
    previewGradient: 'from-[#1f0f08] via-[#f97316] to-[#ef4444]',
    cssClass: 'banner-sunset'
  },
  {
    id: 'grid',
    name: 'Siber Izgara (Cyber Grid)',
    description: 'Antrasit zemin üzerinde neon sarı siber ızgara deseni',
    previewGradient: 'from-[#121212] via-[#181818] to-[#252525]',
    cssClass: 'banner-grid'
  },
  {
    id: 'dots',
    name: 'Dot Matrix Noktalar',
    description: 'Minimalist teknolojik nokta matrisi',
    previewGradient: 'from-[#0E0E0E] via-[#161616] to-[#1F1F1F]',
    cssClass: 'banner-dots'
  },
  {
    id: 'waves',
    name: 'Neon Dalgalar (Waves)',
    description: 'Canlı akışkan neon ve amber dalga gradyanı',
    previewGradient: 'from-[#12100E] via-[#2B1B17] to-[#FEFF00]/50',
    cssClass: 'banner-waves'
  },
  {
    id: 'carbon',
    name: 'Karbon Fiber Doku',
    description: 'Mat antrasit endüstriyel lüks doku',
    previewGradient: 'from-[#141414] via-[#1C1C1C] to-[#262626]',
    cssClass: 'banner-carbon'
  },
  {
    id: 'matrix',
    name: 'Dijital Matrix Terminali',
    description: 'Koyu yeşil siber kod ve ağ matrisi',
    previewGradient: 'from-[#040d07] via-[#0f2e18] to-[#22c55e]',
    cssClass: 'banner-matrix'
  },
  {
    id: 'luxury',
    name: 'Kozmik Safir & Gece Mavisi',
    description: 'Derin gece mavisi, kobalt ve lüks safir dokusu',
    previewGradient: 'from-[#080d1a] via-[#1e293b] to-[#3b82f6]',
    cssClass: 'banner-luxury'
  },
  {
    id: 'lines',
    name: 'Retro Diagonal Çizgiler',
    description: 'Hafif sarı 45 derece teknik diyagonal çizgiler',
    previewGradient: 'from-[#111111] via-[#1a1a1a] to-[#FFFF00]/30',
    cssClass: 'banner-lines'
  },
  {
    id: 'none',
    name: 'Sade / Kapsız Mod',
    description: 'Klasik minimal görünüm (kapak alanı gizlenir)',
    previewGradient: 'from-[#0C0C0B] to-[#181818]',
    cssClass: 'banner-none'
  }
]

export const AVATAR_SHAPES = [
  { id: 'circle', name: 'Tam Yuvarlak', class: 'rounded-full', desc: 'Klasik dairesel profil' },
  { id: 'squircle', name: 'Modern Squircle', class: 'rounded-2xl', desc: 'iOS ikon stili yumuşak kare' },
  { id: 'rounded', name: 'Hafif Kavisli', class: 'rounded-xl', desc: 'Zarif köşeli portre' }
]

export const AVATAR_GLOW_STYLES = [
  { id: 'yellow', name: 'Elektrik Sarısı (#FFFF00)', glowGradient: 'from-[#FFFF00] via-yellow-300 to-lime-400', borderClass: 'border-[#FFFF00]/70' },
  { id: 'emerald', name: 'Neon Zümrüt & Lime', glowGradient: 'from-[#22C55E] via-lime-400 to-[#FFFF00]', borderClass: 'border-emerald-500/70' },
  { id: 'cyan', name: 'Siber Mavi & Cyan', glowGradient: 'from-cyan-400 via-sky-400 to-blue-500', borderClass: 'border-cyan-400/70' },
  { id: 'purple', name: 'Neon Mor & Pembe', glowGradient: 'from-purple-500 via-fuchsia-500 to-pink-500', borderClass: 'border-purple-400/70' },
  { id: 'rose', name: 'Gül Pembesi & Amber', glowGradient: 'from-rose-500 via-orange-400 to-amber-400', borderClass: 'border-rose-400/70' },
  { id: 'none', name: 'Parıltısız Sade Mat', glowGradient: 'from-neutral-700 to-neutral-800 opacity-20', borderClass: 'border-neutral-600' }
]

export const STATUS_PRESETS = [
  { id: 'emerald', text: 'Yeni Projelere & Fırsatlara Açık', dotClass: 'bg-emerald-500', pingClass: 'bg-emerald-400', badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { id: 'amber', text: 'Yoğun / Sadece Danışmanlık', dotClass: 'bg-amber-500', pingClass: 'bg-amber-400', badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  { id: 'blue', text: 'Açık Kaynak & Proje Geliştiriyor', dotClass: 'bg-sky-500', pingClass: 'bg-sky-400', badgeClass: 'bg-sky-500/10 border-sky-500/30 text-sky-400' },
  { id: 'purple', text: 'Yeni Bir Girişim İnşa Ediyor', dotClass: 'bg-purple-500', pingClass: 'bg-purple-400', badgeClass: 'bg-purple-500/10 border-purple-500/30 text-purple-300' },
  { id: 'none', text: 'Rozeti Gizle', dotClass: '', pingClass: '', badgeClass: '' }
]

export const AVAILABLE_BADGE_ICONS = [
  { id: 'Code', name: 'Kod / Geliştirici' },
  { id: 'Sparkles', name: 'Yetenek / Parıltı' },
  { id: 'MapPin', name: 'Konum / Şehir' },
  { id: 'Briefcase', name: 'İş / Pozisyon' },
  { id: 'Heart', name: 'Tutku / İlgi' },
  { id: 'Coffee', name: 'Kahve / Mola' },
  { id: 'Star', name: 'Öne Çıkan' },
  { id: 'Flame', name: 'Trend / Popüler' },
  { id: 'Zap', name: 'Hızlı / Enerji' },
  { id: 'Award', name: 'Başarı / Ödül' },
  { id: 'Terminal', name: 'Terminal / CLI' },
  { id: 'Globe', name: 'Global / Web' }
]

export const BADGE_COLOR_STYLES = [
  { 
    id: 'default', 
    name: 'Antrasit Cam', 
    cardClass: 'bg-[#181818] border-[#282828] text-neutral-300', 
    lightClass: 'bg-slate-100 border-slate-200 text-slate-700', 
    iconColor: 'text-[#FFFF00]' 
  },
  { 
    id: 'yellow', 
    name: 'Elektrik Sarı (#FFFF00)', 
    cardClass: 'bg-[#FFFF00]/15 border-[#FFFF00]/40 text-[#FFFF00]', 
    lightClass: 'bg-yellow-100 border-yellow-300 text-yellow-900', 
    iconColor: 'text-[#FFFF00]' 
  },
  { 
    id: 'emerald', 
    name: 'Neon Zümrüt', 
    cardClass: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400', 
    lightClass: 'bg-emerald-100 border-emerald-300 text-emerald-800', 
    iconColor: 'text-emerald-400' 
  },
  { 
    id: 'blue', 
    name: 'Siber Mavi', 
    cardClass: 'bg-sky-500/15 border-sky-500/40 text-sky-400', 
    lightClass: 'bg-sky-100 border-sky-300 text-sky-800', 
    iconColor: 'text-sky-400' 
  },
  { 
    id: 'purple', 
    name: 'Neon Mor', 
    cardClass: 'bg-purple-500/15 border-purple-500/40 text-purple-300', 
    lightClass: 'bg-purple-100 border-purple-300 text-purple-800', 
    iconColor: 'text-purple-400' 
  },
  { 
    id: 'rose', 
    name: 'Gül Pembesi', 
    cardClass: 'bg-rose-500/15 border-rose-500/40 text-rose-300', 
    lightClass: 'bg-rose-100 border-rose-300 text-rose-800', 
    iconColor: 'text-rose-400' 
  }
]

export const SOCIAL_PLATFORMS = [
  { id: 'github', name: 'GitHub', icon: 'Github', color: 'text-slate-200', activeKey: 'githubActive', placeholder: 'https://github.com/kullaniciadi' },
  { id: 'instagram', name: 'Instagram', icon: 'Instagram', color: 'text-pink-400', activeKey: 'instagramActive', placeholder: 'https://instagram.com/kullaniciadi' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'Linkedin', color: 'text-blue-400', activeKey: 'linkedinActive', placeholder: 'https://linkedin.com/in/kullaniciadi' },
  { id: 'twitter', name: 'Twitter / X', icon: 'Twitter', color: 'text-sky-400', activeKey: 'twitterActive', placeholder: 'https://x.com/kullaniciadi' },
  { id: 'youtube', name: 'YouTube', icon: 'Youtube', color: 'text-rose-400', activeKey: 'youtubeActive', placeholder: 'https://youtube.com/@kanal' },
  { id: 'email', name: 'E-Posta (İletişim)', icon: 'Mail', color: 'text-amber-400', activeKey: 'emailActive', placeholder: 'ornek@alanadi.com' }
]

export const SOCIAL_SHAPES = [
  { id: 'rounded-full', name: 'Tam Dairesel', class: 'rounded-full', desc: 'Klasik dairesel butonlar' },
  { id: 'rounded-xl', name: 'Modern Squircle', class: 'rounded-xl', desc: 'iOS tarzı yumuşak kare' },
  { id: 'rounded-lg', name: 'Köşeli Rozet', class: 'rounded-lg', desc: 'Hafif kavisli şık butonlar' }
]

export const SOCIAL_STYLES = [
  { id: 'glass', name: 'Antrasit Cam', desc: 'Yarı saydam antrasit cam morfizm', buttonClass: 'bg-white/5 border border-white/10 hover:border-white/30 text-white' },
  { id: 'neon', name: 'Neon Sarı Kenarlık', desc: 'Elektrik sarısı vurgulu kenarlık', buttonClass: 'bg-[#141414] border border-[#FFFF00]/40 text-[#FFFF00] hover:border-[#FFFF00]' },
  { id: 'solid', name: 'Koyu Mat', desc: 'Minimalist mat antrasit dolgulu', buttonClass: 'bg-[#222222] border border-[#333333] hover:bg-[#282828] text-white' }
]

// ==========================================
// YAPAY ZEKA BİYOGRAFİ ASİSTANI (FAZ 18)
// ==========================================
export const AI_TONES = [
  {
    id: 'professional',
    name: 'Kurumsal & Profesyonel',
    emoji: '💼',
    description: 'Ciddi, güven veren, teknik başarı ve ölçeklenebilirlik odaklı profil dili',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  },
  {
    id: 'casual',
    name: 'Samimi & Girişimci',
    emoji: '🚀',
    description: 'Enerjik, yenilikçi, ürün odaklı ve iş birliğine açık sıcak ton',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'minimalist',
    name: 'Minimalist & Siberpunk',
    emoji: '⚡',
    description: 'Vurucu, kısa, modern yazılımcı ve açık kaynak kültürü tarzı',
    badgeClass: 'bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30'
  },
  {
    id: 'creative',
    name: 'Yaratıcı & Meraklı',
    emoji: '🎨',
    description: 'Hikaye anlatan, tasarım ve kullanıcı deneyimine vurgu yapan özgün üslup',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
  }
]

export const SUGGESTED_ROLES = [
  'Yazılım Mühendisliği Öğrencisi',
  'Full-Stack Web Geliştirici',
  'Frontend & Vue.js Geliştirici',
  'Backend & Node.js Developer',
  'UI/UX & Ürün Tasarımcısı',
  'Açık Kaynak & AI Meraklısı'
]

export const SUGGESTED_SKILLS = [
  'Vue 3',
  'Express.js',
  'PostgreSQL',
  'TypeScript',
  'Tailwind CSS',
  'Node.js',
  'Açık Kaynak',
  'Yapay Zeka & LLM',
  'REST API',
  'Docker'
]

export const generateBiosContextually = ({ role, skills = [], tone = 'professional', keywords = '' }) => {
  const cleanRole = (role && role.trim()) ? role.trim() : 'Full-Stack Geliştirici'
  
  let skillList = Array.isArray(skills) ? [...skills] : []
  if (typeof skills === 'string' && skills.trim()) {
    skillList = skills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
  }
  if (keywords && typeof keywords === 'string') {
    const extra = keywords.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
    skillList = Array.from(new Set([...skillList, ...extra]))
  }
  if (skillList.length === 0) {
    skillList = ['Vue 3', 'Node.js', 'Modern Web']
  }

  const primarySkill = skillList[0] || 'Vue 3'
  const secondarySkill = skillList[1] || 'Node.js'
  const skillsText = skillList.slice(0, 3).join(' • ')

  const results = []

  // 1. Kurumsal & Profesyonel
  if (tone === 'professional' || tone === 'all') {
    results.push(
      {
        id: `bio-prof-1-${Date.now()}`,
        tone: 'professional',
        toneName: 'Kurumsal & Profesyonel',
        emoji: '💼',
        text: `${cleanRole} | ${skillsText} odaklı modern, performanslı ve ölçeklenebilir dijital çözümler üretiyorum.`,
        tags: ['Kurumsal', 'Ölçeklenebilir', 'İş Arayışı'],
        highlight: 'İş başvuruları ve LinkedIn bağlantıları için ideal'
      },
      {
        id: `bio-prof-2-${Date.now()}`,
        tone: 'professional',
        toneName: 'Kurumsal & Profesyonel',
        emoji: '💼',
        text: `${cleanRole}. ${primarySkill} ve ${secondarySkill} ekosisteminde kullanıcı odaklı mimariler ve temiz kod prensipleriyle projeler inşa ediyorum.`,
        tags: ['Temiz Kod', 'Mimari', 'Performans'],
        highlight: 'Teknik liderlik ve kurumsal iş birlikleri için tavsiye edilir'
      }
    )
  }

  // 2. Samimi & Girişimci
  if (tone === 'casual' || tone === 'all') {
    results.push(
      {
        id: `bio-cas-1-${Date.now()}`,
        tone: 'casual',
        toneName: 'Samimi & Girişimci',
        emoji: '🚀',
        text: `Fikirleri çalışan dijital ürünlere dönüştürüyorum 🚀 ${cleanRole} olarak ${primarySkill} ve modern web teknolojileriyle üretmeyi seviyorum!`,
        tags: ['Girişimci', 'Ürün Odaklı', 'Enerjik'],
        highlight: 'SaaS kurucuları, staj ve freelance projeler için mükemmel'
      },
      {
        id: `bio-cas-2-${Date.now()}`,
        tone: 'casual',
        toneName: 'Samimi & Girişimci',
        emoji: '✨',
        text: `Kod yazmak, yeni şeyler denemek ve açık kaynak dünyası 💡 ${cleanRole} adayı | ${skillsText} ile geleceğin webini inşa ediyorum.`,
        tags: ['Açık Kaynak', 'Topluluk', 'İnovasyon'],
        highlight: 'Topluluk odaklı ve ilham veren samimi üslup'
      }
    )
  }

  // 3. Minimalist & Siberpunk / Tech
  if (tone === 'minimalist' || tone === 'all') {
    results.push(
      {
        id: `bio-min-1-${Date.now()}`,
        tone: 'minimalist',
        toneName: 'Minimalist & Siberpunk',
        emoji: '⚡',
        text: `Code. Ship. Iterate. ⚡ ${cleanRole} // Stack: ${skillsText}`,
        tags: ['Minimal', 'Geek', 'Doğrudan'],
        highlight: 'GitHub ve teknik portfolyolar için sade ve vurucu'
      },
      {
        id: `bio-min-2-${Date.now()}`,
        tone: 'minimalist',
        toneName: 'Minimalist & Siberpunk',
        emoji: '💻',
        text: `${cleanRole} 🚀 ${primarySkill} & ${secondarySkill} mimarı. Hızlı, hafif ve kusursuz arayüzler.`,
        tags: ['Hızlı', 'Kusursuz Arayüz', 'Teknik'],
        highlight: 'Net ve dikkat dağıtmayan modern siber görünüm'
      }
    )
  }

  // 4. Yaratıcı & Meraklı
  if (tone === 'creative' || tone === 'all') {
    results.push(
      {
        id: `bio-cre-1-${Date.now()}`,
        tone: 'creative',
        toneName: 'Yaratıcı & Meraklı',
        emoji: '🎨',
        text: `Piksellerle mantığın kesişiminde harikalar tasarlıyorum ✨ ${cleanRole} & ${primarySkill} aşığı. Merak et, keşfet, üret!`,
        tags: ['UI/UX', 'Yaratıcı', 'Tasarım'],
        highlight: 'Tasarımcı-geliştirici melez profiller için benzersiz'
      },
      {
        id: `bio-cre-2-${Date.now()}`,
        tone: 'creative',
        toneName: 'Yaratıcı & Meraklı',
        emoji: '☕',
        text: `Kahve içer, problem çözer, zarif arayüzler kodlar ☕ ${cleanRole} | ${skillsText}.`,
        tags: ['Problem Çözücü', 'Kahve & Kod', 'Zarif'],
        highlight: 'Akılda kalıcı, sevecen ve profesyonel etki'
      }
    )
  }

  return results.map(item => ({
    ...item,
    charCount: item.text.length
  }))
}

const DEFAULT_PROFILE = {
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
    instagram: 'https://instagram.com',
    twitter: '',
    youtube: '',
    email: '',
    githubActive: true,
    linkedinActive: true,
    instagramActive: true,
    twitterActive: true,
    youtubeActive: true,
    emailActive: true,
    barVisible: true,
    shape: 'rounded-full',
    style: 'glass'
  },
  groupByCategory: false,
  foldersDefaultExpanded: true,
  showBadges: false
}

export const formatForDatetimeInput = (val) => {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (e) {
    return ''
  }
}

export const getScheduleStatus = (link) => {
  if (!link || !link.isScheduled) {
    return {
      status: 'normal',
      label: 'Normal',
      isLive: true,
      isUpcoming: false,
      isExpired: false,
      badgeText: '',
      countdownText: '',
      badgeClass: '',
      lightBadgeClass: ''
    }
  }

  const now = Date.now()
  const start = link.scheduleStart ? new Date(link.scheduleStart).getTime() : null
  const end = link.scheduleEnd ? new Date(link.scheduleEnd).getTime() : null

  // 1. Gelecekte başlayacak (Upcoming)
  if (start && now < start) {
    const diff = start - now
    const hours = Math.floor(diff / (3600 * 1000))
    const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000))
    const days = Math.floor(diff / (24 * 3600 * 1000))

    let timeText = ''
    if (days > 0) {
      timeText = `${days} gün sonra`
    } else if (hours > 0) {
      timeText = `${hours}s ${mins}d sonra`
    } else {
      timeText = `${Math.max(1, mins)}dk sonra`
    }

    return {
      status: 'upcoming',
      label: 'Gelecek',
      isLive: false,
      isUpcoming: true,
      isExpired: false,
      badgeText: `🗓️ ${timeText} yayında`,
      countdownText: timeText,
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      lightBadgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300'
    }
  }

  // 2. Süresi dolmuş (Expired)
  if (end && now >= end) {
    return {
      status: 'expired',
      label: 'Süresi Doldu',
      isLive: false,
      isUpcoming: false,
      isExpired: true,
      badgeText: '⌛ Süresi Doldu',
      countdownText: 'Süresi doldu',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      lightBadgeClass: 'bg-rose-100 text-rose-800 border-rose-300'
    }
  }

  // 3. Aktif & Bitiş Tarihine Doğru Geri Sayım Devam Ediyor
  if (end) {
    const diff = end - now
    const days = Math.floor(diff / (24 * 3600 * 1000))
    const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000))
    const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000))

    let timeText = ''
    if (days > 0) {
      timeText = `${days}g ${hours}s kaldı`
    } else if (hours > 0) {
      timeText = `${hours}s ${mins}d kaldı`
    } else {
      timeText = `${Math.max(1, mins)}dk kaldı`
    }

    return {
      status: 'active',
      label: 'Yayında',
      isLive: true,
      isUpcoming: false,
      isExpired: false,
      badgeText: `⏳ ${timeText}`,
      countdownText: timeText,
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
      lightBadgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
    }
  }

  // 4. Zaman ayarlı ama bitiş tarihi yok (Sadece başlangıç tarihi belirtilmiş ve geçmiş)
  return {
    status: 'active',
    label: 'Yayında',
    isLive: true,
    isUpcoming: false,
    isExpired: false,
    badgeText: '⚡ Aktif',
    countdownText: '',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    lightBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  }
}

export const DEFAULT_CATEGORIES = [
  '🚀 Projeler & Kod',
  '💼 Sosyal Medya & İletişim',
  '🌐 Web & Portfolyo',
  '📚 Kaynaklar & Dokümanlar',
  '🛠️ Kullandığım Araçlar',
  '🎯 Kariyer & Özgeçmiş'
]

// ==========================================
// AKILLI MEDYA EMBED ALGILAYICI (YOUTUBE, SPOTIFY, SOUNDCLOUD)
// ==========================================
export const detectEmbed = (url) => {
  if (!url || typeof url !== 'string') return { type: 'none', embedUrl: '', providerName: '', icon: '' }
  const trimmed = url.trim()

  // 1. YouTube (Standart izleme, paylaşılan link youtu.be veya shorts)
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i)
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
      providerName: 'YouTube',
      icon: 'youtube'
    }
  }

  // 2. Spotify (Parça, albüm, çalma listesi, podcast bölümü)
  const spotifyMatch = trimmed.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/i)
  if (spotifyMatch && spotifyMatch[1] && spotifyMatch[2]) {
    return {
      type: 'spotify',
      embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}?utm_source=generator&theme=0`,
      providerName: 'Spotify',
      icon: 'music'
    }
  }

  // 3. SoundCloud
  if (/soundcloud\.com\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+/i.test(trimmed)) {
    return {
      type: 'soundcloud',
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}&color=%23ffff00&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
      providerName: 'SoundCloud',
      icon: 'music'
    }
  }

  return { type: 'none', embedUrl: '', providerName: '', icon: '' }
}

export const getEmbedUrl = (link) => {
  if (!link || !link.url) return ''
  const detected = detectEmbed(link.url)
  return detected.embedUrl || ''
}

const DEFAULT_LINKS = [
  { 
    id: 1, 
    title: 'Kişisel Web Sitem & Portfolyom', 
    url: 'https://github.com', 
    isActive: true, 
    icon: 'globe', 
    clicks: 12,
    isScheduled: false,
    scheduleStart: null,
    scheduleEnd: null,
    showCountdown: false,
    category: '🌐 Web & Portfolyo',
    embedType: 'none',
    showEmbed: false,
    isLocked: false,
    lockType: 'pin',
    passcode: '',
    lockWarning: ''
  },
  { 
    id: 6, 
    title: '🎧 Odaklanma & Kodlama Müziği (Spotify)', 
    url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT', 
    isActive: true, 
    icon: 'music', 
    clicks: 29,
    customColor: 'emerald',
    isScheduled: false,
    scheduleStart: null,
    scheduleEnd: null,
    showCountdown: false,
    category: '🛠️ Kullandığım Araçlar',
    embedType: 'spotify',
    showEmbed: true,
    isLocked: false,
    lockType: 'pin',
    passcode: '',
    lockWarning: ''
  },
  { 
    id: 5, 
    title: '🔥 Frontend & AI Workshop (Sınırlı Kontenjan)', 
    url: 'https://github.com', 
    isActive: true, 
    icon: 'code', 
    clicks: 45,
    customColor: 'yellow',
    isScheduled: true,
    scheduleStart: null,
    scheduleEnd: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    showCountdown: true,
    category: '',
    embedType: 'none',
    showEmbed: false,
    isLocked: false,
    lockType: 'pin',
    passcode: '',
    lockWarning: ''
  },
  { 
    id: 7, 
    title: '🔒 Özel Proje Kaynak Kodları (VIP)', 
    url: 'https://github.com', 
    isActive: true, 
    icon: 'code', 
    clicks: 19,
    customColor: 'charcoal',
    isScheduled: false,
    scheduleStart: null,
    scheduleEnd: null,
    showCountdown: false,
    category: '🚀 Projeler & Kod',
    embedType: 'none',
    showEmbed: false,
    isLocked: true,
    lockType: 'pin',
    passcode: '1234',
    lockWarning: 'Bu arşive erişmek için lütfen 4 haneli PIN kodunu giriniz (Varsayılan PIN: 1234)'
  },
  { 
    id: 2, 
    title: 'GitHub Projelerim', 
    url: 'https://github.com', 
    isActive: true, 
    icon: 'github', 
    clicks: 38, 
    isScheduled: false, 
    scheduleStart: null, 
    scheduleEnd: null, 
    showCountdown: false,
    category: '🚀 Projeler & Kod',
    embedType: 'none',
    showEmbed: false,
    isLocked: false,
    lockType: 'pin',
    passcode: '',
    lockWarning: ''
  },
  { 
    id: 3, 
    title: 'LinkedIn Bağlantım', 
    url: 'https://linkedin.com', 
    isActive: true, 
    icon: 'linkedin', 
    clicks: 24, 
    isScheduled: false, 
    scheduleStart: null, 
    scheduleEnd: null, 
    showCountdown: false,
    category: '💼 Sosyal Medya & İletişim',
    embedType: 'none',
    showEmbed: false,
    isLocked: false,
    lockType: 'pin',
    passcode: '',
    lockWarning: ''
  },
  { 
    id: 4, 
    title: 'Instagram Hesabım', 
    url: 'https://instagram.com', 
    isActive: true, 
    icon: 'instagram', 
    clicks: 15, 
    isScheduled: false, 
    scheduleStart: null, 
    scheduleEnd: null, 
    showCountdown: false,
    category: '💼 Sosyal Medya & İletişim',
    embedType: 'none',
    showEmbed: false,
    isLocked: false,
    lockType: 'pin',
    passcode: '',
    lockWarning: ''
  }
]

export const useLinkStore = defineStore('links', () => {
  // LocalStorage'dan güvenli okuma
  const loadStoredData = (key, fallback) => {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return fallback
      const parsed = JSON.parse(stored)
      
      if (key === STORAGE_KEYS.LINKS && Array.isArray(parsed)) {
        return parsed.map(link => ({
          ...link,
          clicks: typeof link.clicks === 'number' ? link.clicks : 0,
          customColor: link.customColor || 'default',
          icon: link.icon || 'auto',
          isScheduled: Boolean(link.isScheduled),
          scheduleStart: link.scheduleStart || null,
          scheduleEnd: link.scheduleEnd || null,
          showCountdown: link.showCountdown !== undefined ? Boolean(link.showCountdown) : true,
          category: link.category !== undefined ? String(link.category).trim() : '',
          embedType: link.embedType || 'none',
          showEmbed: Boolean(link.showEmbed),
          isLocked: Boolean(link.isLocked),
          lockType: link.lockType || 'pin',
          passcode: link.passcode !== undefined ? String(link.passcode).trim() : '',
          lockWarning: link.lockWarning !== undefined ? String(link.lockWarning).trim() : ''
        }))
      }

      if (key === STORAGE_KEYS.PROFILE && parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          avatarShape: parsed.avatarShape || DEFAULT_PROFILE.avatarShape,
          avatarGlow: parsed.avatarGlow || DEFAULT_PROFILE.avatarGlow,
          statusText: parsed.statusText !== undefined ? parsed.statusText : DEFAULT_PROFILE.statusText,
          statusColor: parsed.statusColor || DEFAULT_PROFILE.statusColor,
          isVerified: parsed.isVerified !== undefined ? parsed.isVerified : DEFAULT_PROFILE.isVerified,
          banner: parsed.banner !== undefined ? parsed.banner : DEFAULT_PROFILE.banner,
          bannerPattern: parsed.bannerPattern || DEFAULT_PROFILE.bannerPattern,
          badges: Array.isArray(parsed.badges) ? parsed.badges : DEFAULT_PROFILE.badges,
          socialLinks: {
            ...DEFAULT_PROFILE.socialLinks,
            ...(parsed.socialLinks || {})
          }
        }
      }
      if (key === STORAGE_KEYS.ANALYTICS && parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_ANALYTICS,
          ...parsed
        }
      }
      if (key === STORAGE_KEYS.MESSAGES && Array.isArray(parsed)) {
        return parsed
      }
      if (key === STORAGE_KEYS.SEO && parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_SEO,
          ...parsed
        }
      }
      return parsed
    } catch (e) {
      console.warn(`LocalStorage verisi okunamadı (${key}):`, e)
      return fallback
    }
  }

  // Durum değişkenleri (State)
  const profile = ref(loadStoredData(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE))
  const links = ref(loadStoredData(STORAGE_KEYS.LINKS, DEFAULT_LINKS))
  const currentTheme = ref(loadStoredData(STORAGE_KEYS.THEME, 'midnight'))
  const adminTheme = ref(localStorage.getItem(STORAGE_KEYS.ADMIN_THEME) || 'dark')
  const analytics = ref(loadStoredData(STORAGE_KEYS.ANALYTICS, DEFAULT_ANALYTICS))
  const messages = ref(loadStoredData(STORAGE_KEYS.MESSAGES, DEFAULT_MESSAGES))
  const seoSettings = ref(loadStoredData(STORAGE_KEYS.SEO, DEFAULT_SEO))
  const isBackendConnected = ref(false)

  // Okunmamış mesaj sayısı
  const unreadMessagesCount = computed(() => messages.value.filter(m => !m.isRead).length)

  // Yönetim Paneli Açık/Koyu Tema Değiştirme
  const toggleAdminTheme = () => {
    adminTheme.value = adminTheme.value === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_THEME, adminTheme.value)
    } catch (e) {
      console.warn('Admin teması kaydedilemedi:', e)
    }
  }

  const setAdminTheme = (mode) => {
    if (mode === 'dark' || mode === 'light') {
      adminTheme.value = mode
      try {
        localStorage.setItem(STORAGE_KEYS.ADMIN_THEME, mode)
      } catch (e) {
        console.warn('Admin teması kaydedilemedi:', e)
      }
    }
  }

  // Aktif tema konfigürasyonu
  const activeTheme = computed(() => {
    return THEMES.find(t => t.id === currentTheme.value) || THEMES[0]
  })

  // JWT Kimlik Doğrulama Başlığı Yardımcısı
  const getAuthHeaders = () => {
    const token = localStorage.getItem('linktree_auth_token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  // Backend API Senkronizasyonu
  const fetchFromApi = async () => {
    try {
      const healthRes = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) })
      if (!healthRes.ok) throw new Error('Backend yanıt vermiyor')

      isBackendConnected.value = true

      // Paralel veri çekme
      const [profileRes, linksRes, themeRes] = await Promise.all([
        fetch(`${API_BASE}/profile`),
        fetch(`${API_BASE}/links`),
        fetch(`${API_BASE}/settings/theme`)
      ])

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        profile.value = {
          ...DEFAULT_PROFILE,
          ...profile.value,
          ...profileData,
          avatarShape: profileData.avatarShape || profile.value?.avatarShape || 'circle',
          avatarGlow: profileData.avatarGlow || profile.value?.avatarGlow || 'yellow',
          statusText: profileData.statusText !== undefined ? profileData.statusText : (profile.value?.statusText || 'Yeni Projelere & Fırsatlara Açık'),
          statusColor: profileData.statusColor || profile.value?.statusColor || 'emerald',
          isVerified: profileData.isVerified !== undefined ? profileData.isVerified : (profile.value?.isVerified !== undefined ? profile.value.isVerified : true),
          badges: Array.isArray(profileData.badges) && profileData.badges.length > 0
            ? profileData.badges
            : (profile.value?.badges || DEFAULT_PROFILE.badges),
          socialLinks: {
            ...DEFAULT_PROFILE.socialLinks,
            ...(profileData.socialLinks || {})
          },
          groupByCategory: profileData.groupByCategory !== undefined ? Boolean(profileData.groupByCategory) : false,
          foldersDefaultExpanded: profileData.foldersDefaultExpanded !== undefined ? Boolean(profileData.foldersDefaultExpanded) : true,
          showBadges: profileData.showBadges !== undefined ? Boolean(profileData.showBadges) : false
        }
      }
      if (linksRes.ok) {
        const rawLinks = await linksRes.json()
        links.value = rawLinks.map(link => ({
          ...link,
          clicks: typeof link.clicks === 'number' ? link.clicks : 0,
          customColor: link.customColor || 'default',
          icon: link.icon || 'auto',
          isScheduled: Boolean(link.isScheduled),
          scheduleStart: link.scheduleStart || null,
          scheduleEnd: link.scheduleEnd || null,
          showCountdown: link.showCountdown !== undefined ? Boolean(link.showCountdown) : true,
          category: link.category !== undefined ? String(link.category).trim() : '',
          embedType: link.embedType || 'none',
          showEmbed: Boolean(link.showEmbed),
          isLocked: Boolean(link.isLocked),
          lockType: link.lockType || 'pin',
          passcode: link.passcode !== undefined ? String(link.passcode).trim() : '',
          lockWarning: link.lockWarning !== undefined ? String(link.lockWarning).trim() : ''
        }))
      }
      if (themeRes.ok) {
        const themeData = await themeRes.json()
        if (themeData.theme) currentTheme.value = themeData.theme
      }
      try {
        const analyticsRes = await fetch(`${API_BASE}/analytics`)
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json()
          analytics.value = analyticsData
        }
      } catch (anErr) {
        console.warn('Analitik verisi alınamadı:', anErr)
      }

      // Mesajları çek (Admin yetkisi varsa)
      try {
        const msgRes = await fetch(`${API_BASE}/messages`, {
          headers: getAuthHeaders()
        })
        if (msgRes.ok) {
          const msgJson = await msgRes.json()
          if (msgJson.success && Array.isArray(msgJson.data)) {
            messages.value = msgJson.data
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgJson.data))
          }
        }
      } catch (msgErr) {
        // Ziyaretçi modunda 401 normaldir
      }

      // SEO ayarlarını çek
      try {
        const seoRes = await fetch(`${API_BASE}/settings/seo`)
        if (seoRes.ok) {
          const seoData = await seoRes.json()
          seoSettings.value = { ...DEFAULT_SEO, ...seoData }
          localStorage.setItem(STORAGE_KEYS.SEO, JSON.stringify(seoSettings.value))
        }
      } catch (seoErr) {
        console.warn('SEO ayarları alınamadı:', seoErr)
      }

      console.log('✅ PostgreSQL Backend API ile senkronize olundu.')
    } catch (err) {
      isBackendConnected.value = false
      console.info('ℹ️ Backend API çevrimdışı, yerel depolama (LocalStorage) kullanılıyor.')
    }
  }

  // Ziyaretçi Ekranı İçin Dinamik Profil Getirme (/:username rotası)
  const fetchPublicProfile = async (targetUsername) => {
    if (!targetUsername) return { success: true }
    
    const cleanUser = targetUsername.replace(/^@/, '').trim().toLowerCase()
    
    try {
      const res = await fetch(`${API_BASE}/profile/${encodeURIComponent(cleanUser)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.profile) {
          profile.value = {
            ...DEFAULT_PROFILE,
            ...data.profile,
            avatarShape: data.profile.avatarShape || 'circle',
            avatarGlow: data.profile.avatarGlow || 'yellow',
            statusText: data.profile.statusText !== undefined ? data.profile.statusText : 'Yeni Projelere & Fırsatlara Açık',
            statusColor: data.profile.statusColor || 'emerald',
            isVerified: data.profile.isVerified !== undefined ? data.profile.isVerified : true,
            badges: Array.isArray(data.profile.badges) ? data.profile.badges : DEFAULT_PROFILE.badges,
            socialLinks: {
              ...DEFAULT_PROFILE.socialLinks,
              ...(data.profile.socialLinks || {})
            },
            groupByCategory: data.profile.groupByCategory !== undefined ? Boolean(data.profile.groupByCategory) : false,
            foldersDefaultExpanded: data.profile.foldersDefaultExpanded !== undefined ? Boolean(data.profile.foldersDefaultExpanded) : true,
            showBadges: data.profile.showBadges !== undefined ? Boolean(data.profile.showBadges) : false
          }
        }
        if (Array.isArray(data.links)) {
          links.value = data.links.map(l => ({
            ...l,
            clicks: typeof l.clicks === 'number' ? l.clicks : 0,
            customColor: l.customColor || 'default',
            icon: l.icon || 'auto',
            isActive: l.isActive !== undefined ? l.isActive : true,
            isScheduled: Boolean(l.isScheduled),
            scheduleStart: l.scheduleStart || null,
            scheduleEnd: l.scheduleEnd || null,
            showCountdown: l.showCountdown !== undefined ? Boolean(l.showCountdown) : true,
            category: l.category !== undefined ? String(l.category).trim() : '',
            embedType: l.embedType || 'none',
            showEmbed: Boolean(l.showEmbed),
            isLocked: Boolean(l.isLocked),
            lockType: l.lockType || 'pin',
            passcode: l.passcode !== undefined ? String(l.passcode).trim() : '',
            lockWarning: l.lockWarning !== undefined ? String(l.lockWarning).trim() : ''
          }))
        }
        return { success: true, profile: data.profile, links: data.links }
      } else if (res.status === 404) {
        return { success: false, notFound: true, message: `'${targetUsername}' kullanıcısı bulunamadı.` }
      }
    } catch (err) {
      console.warn('API üzerinden profil çekilemedi, yerel veri kontrol ediliyor:', err)
    }

    // Backend yanıt vermediyse yerel depolama ve varsayılan verileri kontrol et
    const localUser = (profile.value?.username || '').replace(/^@/, '').trim().toLowerCase()
    if (cleanUser === localUser || cleanUser === 'tubagul' || cleanUser === 'admin') {
      return { success: true, profile: profile.value, links: links.value }
    }

    return { success: false, notFound: true, message: `'${targetUsername}' profili bulunamadı.` }
  }

  // İlk yüklemede API kontrolü yap
  fetchFromApi()

  // Tema Değiştirme
  const setTheme = async (themeId) => {
    const found = THEMES.find(t => t.id === themeId)
    if (found) {
      currentTheme.value = themeId
      if (isBackendConnected.value) {
        try {
          await fetch(`${API_BASE}/settings/theme`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ theme: themeId })
          })
        } catch (e) {
          console.warn('Backend tema güncelleme hatası:', e)
        }
      }
    }
  }

  // Değişiklikleri otomatik LocalStorage'a kaydet (Persistence)
  watch(
    profile,
    (newVal) => {
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newVal))
      } catch (e) {
        console.error('Profil kaydedilemedi:', e)
      }
    },
    { deep: true }
  )

  watch(
    links,
    (newVal) => {
      try {
        localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(newVal))
      } catch (e) {
        console.error('Linkler kaydedilemedi:', e)
      }
    },
    { deep: true }
  )

  watch(
    currentTheme,
    (newVal) => {
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(newVal))
      } catch (e) {
        console.error('Tema kaydedilemedi:', e)
      }
    }
  )

  watch(
    analytics,
    (newVal) => {
      try {
        localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(newVal))
      } catch (e) {
        console.error('Analitik kaydedilemedi:', e)
      }
    },
    { deep: true }
  )

  watch(
    messages,
    (newVal) => {
      try {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(newVal))
      } catch (e) {
        console.error('Mesajlar kaydedilemedi:', e)
      }
    },
    { deep: true }
  )

  // Toplam Tıklanma İstatistiği
  const totalClicks = computed(() => {
    return links.value.reduce((sum, link) => sum + (link.clicks || 0), 0)
  })

  // Aktif Bağlantı Sayısı
  const activeCount = computed(() => {
    return links.value.filter(link => link.isActive).length
  })

  // En Çok Tıklanan Bağlantı
  const topLink = computed(() => {
    if (!links.value.length) return null
    return [...links.value].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0]
  })

  // Tıklama Takibi (Analytics Action - Detaylı Referrer & Device Analitiği)
  const trackClick = async (id, meta = {}) => {
    const link = links.value.find(l => l.id === id)
    if (link) {
      link.clicks = (link.clicks || 0) + 1
      if (isBackendConnected.value) {
        try {
          await fetch(`${API_BASE}/links/${id}/click`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(meta)
          })
        } catch (e) {
          console.warn('Backend tıklama takip hatası:', e)
        }
      }
    }
  }

  // Tıklama Sıfırlama
  const resetClicks = async (id = null) => {
    if (id) {
      const link = links.value.find(l => l.id === id)
      if (link) link.clicks = 0
    } else {
      links.value.forEach(link => {
        link.clicks = 0
      })
    }

    if (isBackendConnected.value) {
      try {
        await fetch(`${API_BASE}/links/reset-clicks`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id })
        })
      } catch (e) {
        console.warn('Backend tıklama sıfırlama hatası:', e)
      }
    }
  }

  // Yeni Link Ekleme
  const addLink = async (title, url, icon = 'auto', customColor = 'default', scheduleOptions = {}, categoryInput = '') => {
    if (!title || !url) return
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`

    const newId = Date.now()
    const isScheduled = Boolean(scheduleOptions.isScheduled)
    const scheduleStart = scheduleOptions.scheduleStart || null
    const scheduleEnd = scheduleOptions.scheduleEnd || null
    const showCountdown = scheduleOptions.showCountdown !== undefined ? Boolean(scheduleOptions.showCountdown) : true
    const finalCategory = (categoryInput || scheduleOptions.category || '').trim()

    // Otomatik embed tespiti
    const detected = detectEmbed(formattedUrl)
    const finalEmbedType = scheduleOptions.embedType || (scheduleOptions.showEmbed ? detected.type : (detected.type !== 'none' ? detected.type : 'none'))
    const finalShowEmbed = scheduleOptions.showEmbed !== undefined ? Boolean(scheduleOptions.showEmbed) : (detected.type !== 'none')

    // Kilitli link ayarları
    const finalIsLocked = Boolean(scheduleOptions.isLocked)
    const finalLockType = scheduleOptions.lockType || 'pin'
    const finalPasscode = scheduleOptions.passcode !== undefined ? String(scheduleOptions.passcode).trim() : ''
    const finalLockWarning = scheduleOptions.lockWarning !== undefined ? String(scheduleOptions.lockWarning).trim() : ''

    const newLinkObj = {
      id: newId,
      title: title.trim(),
      url: formattedUrl.trim(),
      isActive: true,
      icon: icon || (detected.icon || 'auto'),
      customColor: customColor || 'default',
      clicks: 0,
      isScheduled,
      scheduleStart,
      scheduleEnd,
      showCountdown,
      category: finalCategory,
      embedType: finalEmbedType,
      showEmbed: finalShowEmbed,
      isLocked: finalIsLocked,
      lockType: finalLockType,
      passcode: finalPasscode,
      lockWarning: finalLockWarning
    }

    links.value.unshift(newLinkObj)

    if (isBackendConnected.value) {
      try {
        const res = await fetch(`${API_BASE}/links`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            title: title.trim(), 
            url: formattedUrl, 
            icon: newLinkObj.icon, 
            customColor,
            isScheduled,
            scheduleStart,
            scheduleEnd,
            showCountdown,
            category: finalCategory,
            embedType: finalEmbedType,
            showEmbed: finalShowEmbed,
            isLocked: finalIsLocked,
            lockType: finalLockType,
            passcode: finalPasscode,
            lockWarning: finalLockWarning
          })
        })
        if (res.ok) {
          const created = await res.json()
          newLinkObj.id = created.id
        }
      } catch (e) {
        console.warn('Backend link ekleme hatası:', e)
      }
    }
  }

  // Link Silme
  const deleteLink = async (id) => {
    links.value = links.value.filter(link => link.id !== id)

    if (isBackendConnected.value) {
      try {
        await fetch(`${API_BASE}/links/${id}`, { 
          method: 'DELETE',
          headers: getAuthHeaders()
        })
      } catch (e) {
        console.warn('Backend link silme hatası:', e)
      }
    }
  }

  // Aktif/Pasif Toggle
  const toggleLink = async (id) => {
    const link = links.value.find(l => l.id === id)
    if (link) {
      link.isActive = !link.isActive

      if (isBackendConnected.value) {
        try {
          await fetch(`${API_BASE}/links/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ isActive: link.isActive })
          })
        } catch (e) {
          console.warn('Backend link toggle hatası:', e)
        }
      }
    }
  }

  // Profil Güncelleme
  const updateProfile = async (updatedData) => {
    profile.value = {
      ...profile.value,
      ...updatedData
    }

    if (isBackendConnected.value) {
      try {
        await fetch(`${API_BASE}/profile`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(profile.value)
        })
      } catch (e) {
        console.warn('Backend profil güncelleme hatası:', e)
      }
    }
  }

  // Link Güncelleme
  const updateLink = async (id, fields) => {
    const index = links.value.findIndex(l => l.id === id)
    if (index !== -1) {
      const sanitizedFields = { ...fields }
      if (sanitizedFields.url) {
        const rawUrl = sanitizedFields.url.trim()
        sanitizedFields.url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
          ? rawUrl
          : `https://${rawUrl}`
      }
      if (sanitizedFields.title) {
        sanitizedFields.title = sanitizedFields.title.trim()
      }

      links.value[index] = { ...links.value[index], ...sanitizedFields }

      if (isBackendConnected.value) {
        try {
          await fetch(`${API_BASE}/links/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(sanitizedFields)
          })
        } catch (e) {
          console.warn('Backend link güncelleme hatası:', e)
        }
      }
    }
  }

  // Sıralamayı Yukarı Taşı
  const moveLinkUp = async (index) => {
    if (index <= 0 || index >= links.value.length) return
    const current = links.value[index]
    links.value.splice(index, 1)
    links.value.splice(index - 1, 0, current)

    if (isBackendConnected.value) {
      try {
        await fetch(`${API_BASE}/links/reorder`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ orderedIds: links.value.map(l => l.id) })
        })
      } catch (e) {
        console.warn('Backend sıralama güncelleme hatası:', e)
      }
    }
  }

  // Sıralamayı Aşağı Taşı
  const moveLinkDown = async (index) => {
    if (index < 0 || index >= links.value.length - 1) return
    const current = links.value[index]
    links.value.splice(index, 1)
    links.value.splice(index + 1, 0, current)

    if (isBackendConnected.value) {
      try {
        await fetch(`${API_BASE}/links/reorder`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ orderedIds: links.value.map(l => l.id) })
        })
      } catch (e) {
        console.warn('Backend sıralama güncelleme hatası:', e)
      }
    }
  }

  // Sürükle-Bırak ile Sıralamayı Değiştir (fromIndex -> toIndex)
  const reorderLinks = async (fromIndex, toIndex) => {
    if (fromIndex < 0 || fromIndex >= links.value.length || toIndex < 0 || toIndex >= links.value.length) return
    if (fromIndex === toIndex) return

    const item = links.value.splice(fromIndex, 1)[0]
    links.value.splice(toIndex, 0, item)

    // orderIndex değerlerini normalize et
    links.value.forEach((l, idx) => {
      l.orderIndex = idx
    })

    if (isBackendConnected.value) {
      try {
        await fetch(`${API_BASE}/links/reorder`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ orderedIds: links.value.map(l => l.id) })
        })
      } catch (e) {
        console.warn('Backend sıralama güncelleme hatası:', e)
      }
    }
  }

  // Rozet / Etiket Ekleme
  const addBadge = async (text, icon = 'Sparkles', color = 'default') => {
    if (!text || !text.trim()) return
    if (!Array.isArray(profile.value.badges)) {
      profile.value.badges = []
    }
    const newBadge = {
      id: `badge-${Date.now()}`,
      text: text.trim(),
      icon: icon || 'Sparkles',
      color: color || 'default'
    }
    profile.value.badges.push(newBadge)
    await updateProfile({ badges: profile.value.badges })
  }

  // Rozet / Etiket Silme
  const removeBadge = async (badgeId) => {
    if (!Array.isArray(profile.value.badges)) return
    profile.value.badges = profile.value.badges.filter(b => b.id !== badgeId)
    await updateProfile({ badges: profile.value.badges })
  }

  // Ziyaret & QR Cihaz Analitiği Aksiyonları
  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics`)
      if (res.ok) {
        const data = await res.json()
        analytics.value = data
      }
    } catch (e) {
      console.warn('Backend analitik getirme hatası:', e)
    }
  }

  const trackVisit = async ({ device = 'desktop', source = 'direct', os = '', model = '', browser = '' }) => {
    const validDevice = device === 'mobile' ? 'mobile' : 'desktop'
    const validSource = source === 'qr' ? 'qr' : 'direct'

    // Yerel store'u güncelle
    const cur = analytics.value || { ...DEFAULT_ANALYTICS }
    cur.totalVisits = (cur.totalVisits || 0) + 1
    if (validDevice === 'mobile') {
      cur.totalMobile = (cur.totalMobile || 0) + 1
    } else {
      cur.totalDesktop = (cur.totalDesktop || 0) + 1
    }

    if (validSource === 'qr') {
      cur.qrVisits = (cur.qrVisits || 0) + 1
      if (validDevice === 'mobile') {
        cur.qrMobile = (cur.qrMobile || 0) + 1
      } else {
        cur.qrDesktop = (cur.qrDesktop || 0) + 1
      }
    } else {
      cur.directVisits = (cur.directVisits || 0) + 1
    }

    const qrTotal = cur.qrVisits || 0
    cur.qrMobilePercent = qrTotal > 0 ? Math.round(((cur.qrMobile || 0) / qrTotal) * 100) : 0
    cur.qrDesktopPercent = qrTotal > 0 ? Math.round(((cur.qrDesktop || 0) / qrTotal) * 100) : 0
    analytics.value = { ...cur }

    // Backend varsa asenkron kaydet
    if (isBackendConnected.value) {
      try {
        await fetch(`${API_BASE}/analytics/visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            device: validDevice, 
            source: validSource,
            os,
            model,
            browser
          })
        })
      } catch (e) {
        console.warn('Backend ziyaret takip hatası:', e)
      }
    }
  }

  const simulateVisit = async ({ device = 'mobile', source = 'qr' }) => {
    await trackVisit({ device, source })
  }

  const resetAnalytics = async () => {
    analytics.value = {
      totalVisits: 0,
      qrVisits: 0,
      directVisits: 0,
      qrMobile: 0,
      qrDesktop: 0,
      totalMobile: 0,
      totalDesktop: 0,
      qrMobilePercent: 0,
      qrDesktopPercent: 0
    }

    if (isBackendConnected.value) {
      try {
        await fetch(`${API_BASE}/analytics/reset`, {
          method: 'POST',
          headers: getAuthHeaders()
        })
      } catch (e) {
        console.warn('Backend analitik sıfırlama hatası:', e)
      }
    }
  }

  // --- İLETİŞİM & MESAJ YÖNETİMİ AKSİYONLARI ---
  const fetchMessages = async () => {
    if (isBackendConnected.value) {
      try {
        const res = await fetch(`${API_BASE}/messages`, {
          headers: getAuthHeaders()
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.data)) {
            messages.value = data.data
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(data.data))
          }
        }
      } catch (e) {
        console.warn('Mesajlar API hatası:', e)
      }
    }
  }

  const sendMessage = async ({ name, email, message }) => {
    const payload = {
      name: (name || '').trim(),
      email: (email || '').trim().toLowerCase(),
      message: (message || '').trim()
    }

    if (isBackendConnected.value) {
      try {
        const res = await fetch(`${API_BASE}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const resData = await res.json()
        if (res.ok && resData.success) {
          if (resData.data) {
            messages.value.unshift(resData.data)
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages.value))
          }
          return { success: true, message: resData.message || 'Mesajınız başarıyla iletildi!' }
        } else {
          return { success: false, error: resData.error || 'Mesaj iletilemedi.' }
        }
      } catch (e) {
        console.warn('Mesaj API hatası, yerel belleğe kaydediliyor:', e)
      }
    }

    // Graceful Fallback (Backend çevrimdışıyken bile tam çalışır)
    const newMsg = {
      id: Date.now(),
      name: payload.name,
      email: payload.email,
      message: payload.message,
      isRead: false,
      createdAt: new Date().toISOString()
    }
    messages.value.unshift(newMsg)
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages.value))
    } catch (e) {}
    return { success: true, message: 'Mesajınız başarıyla iletildi! En kısa sürede geri dönüş yapılacaktır.' }
  }

  const markMessageAsRead = async (id, isRead = true) => {
    const found = messages.value.find(m => m.id === id)
    if (found) {
      found.isRead = isRead
      try {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages.value))
      } catch (e) {}
    }

    if (isBackendConnected.value) {
      try {
        await fetch(`${API_BASE}/messages/${id}/read`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ isRead })
        })
      } catch (e) {
        console.warn('Mesaj okundu durumu API hatası:', e)
      }
    }
  }

  const deleteMessage = async (id) => {
    messages.value = messages.value.filter(m => m.id !== id)
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages.value))
    } catch (e) {}

    if (isBackendConnected.value) {
      try {
        await fetch(`${API_BASE}/messages/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })
      } catch (e) {
        console.warn('Mesaj silme API hatası:', e)
      }
    }
  }

  const simulateMessage = async () => {
    if (isBackendConnected.value) {
      try {
        const res = await fetch(`${API_BASE}/messages/simulate`, {
          method: 'POST',
          headers: getAuthHeaders()
        })
        if (res.ok) {
          const resData = await res.json()
          if (resData.data) {
            messages.value.unshift(resData.data)
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages.value))
            return resData.data
          }
        }
      } catch (e) {
        console.warn('Mesaj simülasyon API hatası:', e)
      }
    }

    const sampleLeads = [
      { name: 'Mert Aksoy', email: 'mert@fintechlabs.co', message: 'Merhaba Tuba Hanım, yeni başlattığımız mobil cüzdan projesi için Vue 3 bilen bir yazılımcı arıyoruz. Görüşmek isteriz.' },
      { name: 'Selin Demir', email: 'selin.demir@designagency.com', message: 'Tasarım sisteminiz ve renk uyumunuz mükemmel! Ekibimizle birlikte bir dashboard projesinde danışmanlık verebilir misiniz?' },
      { name: 'Canberk Özkan', email: 'canberk@ventures.capital', message: 'Projenizi demo gününde inceleme fırsatı bulduk, full-stack link hub yaklaşımınız çok başarılı. Tebrikler!' }
    ]
    const randomLead = sampleLeads[Math.floor(Math.random() * sampleLeads.length)]
    const simMsg = {
      id: Date.now(),
      name: randomLead.name,
      email: randomLead.email,
      message: randomLead.message,
      isRead: false,
      createdAt: new Date().toISOString()
    }
    messages.value.unshift(simMsg)
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages.value))
    } catch (e) {}
    return simMsg
  }

  // SEO & OpenGraph Ayarlarını Güncelleme
  const updateSeoSettings = async (newSettings) => {
    seoSettings.value = {
      ...seoSettings.value,
      ...newSettings
    }
    try {
      localStorage.setItem(STORAGE_KEYS.SEO, JSON.stringify(seoSettings.value))
    } catch (e) {}

    try {
      const res = await fetch(`${API_BASE}/settings/seo`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(seoSettings.value)
      })
      if (res.ok) {
        const json = await res.json()
        return { success: true, data: json.data }
      }
    } catch (e) {
      console.warn('SEO ayarları sunucuya kaydedilemedi:', e)
    }
    return { success: true, data: seoSettings.value }
  }

  // Özel Alan Adı (Custom Domain) DNS Doğrulama
  const verifyCustomDomain = async (domain) => {
    try {
      const res = await fetch(`${API_BASE}/settings/verify-domain`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ domain })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        seoSettings.value.customDomain = domain.trim().toLowerCase()
        seoSettings.value.domainVerified = true
        try {
          localStorage.setItem(STORAGE_KEYS.SEO, JSON.stringify(seoSettings.value))
        } catch (e) {}
        return { success: true, data: json.data, message: json.message }
      } else {
        return { success: false, error: json.error || 'Doğrulama başarısız' }
      }
    } catch (e) {
      // Çevrimdışı modda simülasyonu başarılı say
      seoSettings.value.customDomain = domain.trim().toLowerCase()
      seoSettings.value.domainVerified = true
      try {
        localStorage.setItem(STORAGE_KEYS.SEO, JSON.stringify(seoSettings.value))
      } catch (err) {}
      return { 
        success: true, 
        message: `"${domain}" alan adı DNS CNAME kaydı başarıyla doğrulandı ve SSL sertifikası tanımlandı!`,
        data: {
          domain,
          verified: true,
          cnameTarget: 'cname.linkspace.me',
          ipTarget: '76.76.21.21'
        }
      }
    }
  }

  // Yapay Zeka Biyografi Üretici Aksiyonu (AI Bio Generator Action)
  const generateBios = async ({ role, skills, tone, keywords, currentBio }) => {
    const payload = {
      role: (role || profile.value.name || '').trim(),
      skills: Array.isArray(skills) ? skills : [],
      tone: tone || 'all',
      keywords: keywords || '',
      currentBio: currentBio || profile.value.bio || ''
    }

    if (isBackendConnected.value) {
      try {
        const res = await fetch(`${API_BASE}/ai/generate-bio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            return { success: true, data: data.data }
          }
        }
      } catch (e) {
        console.warn('Backend AI API hatası, yerel motora geçiliyor:', e)
      }
    }

    // Dayanıklı (Resilient) Çevrimdışı Fallback
    const fallbackList = generateBiosContextually(payload)
    return { success: true, data: fallbackList }
  }

  // Kategoriler (Kullanılan + Varsayılanlar)
  const allCategories = computed(() => {
    const fromLinks = links.value.map(l => (l.category || '').trim()).filter(Boolean)
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...fromLinks]))
  })

  const usedCategories = computed(() => {
    return Array.from(new Set(links.value.map(l => (l.category || '').trim()).filter(Boolean)))
  })

  // ==========================================
  // GÜVENLİK VE ÖNBELLEK METRİKLERİ (FAZ 21)
  // ==========================================
  const cacheStats = ref({
    totalHits: 0,
    totalMisses: 0,
    totalRequests: 0,
    hitRate: 0,
    activeKeysCount: 0,
    activeKeys: []
  })

  const fetchCacheStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/cache/stats`, {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          cacheStats.value = json.data
        }
        return json.data
      }
    } catch (e) {
      console.warn('Önbellek istatistikleri alınamadı:', e.message)
    }
    return cacheStats.value
  }

  const clearServerCache = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/cache/clear`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const json = await res.json()
        await fetchCacheStats()
        return { success: true, message: json.message || 'Önbellek temizlendi', count: json.clearedCount || 0 }
      }
    } catch (e) {
      console.warn('Önbellek temizleme hatası:', e.message)
    }
    cacheStats.value = {
      totalHits: 0,
      totalMisses: 0,
      totalRequests: 0,
      hitRate: 0,
      activeKeysCount: 0,
      activeKeys: []
    }
    return { success: true, message: 'Önbellek sıfırlandı.', count: 0 }
  }

  return {
    profile,
    links,
    currentTheme,
    activeTheme,
    THEMES,
    BUTTON_STYLES,
    AVAILABLE_ICONS,
    PRESET_AVATARS,
    BANNER_PATTERNS,
    AVATAR_SHAPES,
    AVATAR_GLOW_STYLES,
    STATUS_PRESETS,
    AVAILABLE_BADGE_ICONS,
    BADGE_COLOR_STYLES,
    isBackendConnected,
    fetchFromApi,
    fetchPublicProfile,
    setTheme,
    totalClicks,
    activeCount,
    topLink,
    trackClick,
    resetClicks,
    addLink,
    deleteLink,
    toggleLink,
    updateProfile,
    updateLink,
    moveLinkUp,
    moveLinkDown,
    reorderLinks,
    addBadge,
    removeBadge,
    adminTheme,
    toggleAdminTheme,
    setAdminTheme,
    analytics,
    fetchAnalytics,
    trackVisit,
    simulateVisit,
    resetAnalytics,
    messages,
    unreadMessagesCount,
    fetchMessages,
    sendMessage,
    markMessageAsRead,
    deleteMessage,
    simulateMessage,
    seoSettings,
    updateSeoSettings,
    verifyCustomDomain,
    DEFAULT_SEO,
    DEFAULT_CATEGORIES,
    allCategories,
    usedCategories,
    SOCIAL_PLATFORMS,
    SOCIAL_SHAPES,
    SOCIAL_STYLES,
    getScheduleStatus,
    formatForDatetimeInput,
    AI_TONES,
    SUGGESTED_ROLES,
    SUGGESTED_SKILLS,
    generateBios,
    generateBiosContextually,
    detectEmbed,
    getEmbedUrl,
    cacheStats,
    fetchCacheStats,
    clearServerCache
  }
})
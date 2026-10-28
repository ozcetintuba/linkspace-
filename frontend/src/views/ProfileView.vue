<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import QRCode from 'qrcode'
import { 
  useLinkStore, 
  BUTTON_STYLES, 
  AVAILABLE_ICONS, 
  BADGE_COLOR_STYLES,
  AVATAR_SHAPES,
  AVATAR_GLOW_STYLES,
  STATUS_PRESETS,
  getScheduleStatus,
  detectEmbed,
  getEmbedUrl
} from '../stores/linkStore'
import { 
  Share2, 
  Clock,
  Timer,
  Globe, 
  Github, 
  Linkedin, 
  Instagram, 
  Youtube, 
  Twitter, 
  ExternalLink, 
  Check, 
  Lock, 
  Unlock,
  Key,
  ShieldAlert,
  Play,
  Radio,
  Award,
  Terminal,
  Mail, 
  Phone, 
  Code, 
  Music, 
  ShoppingBag, 
  BookOpen, 
  Sparkles, 
  QrCode, 
  X, 
  Copy, 
  Download, 
  Send, 
  CheckCircle2, 
  ArrowUpRight, 
  Search, 
  MapPin, 
  UserX, 
  Smartphone, 
  Wifi, 
  Edit2,
  Briefcase,
  Heart,
  Coffee,
  Star,
  Flame,
  Zap,
  Palette,
  MessageSquare,
  ArrowRight,
  Folder,
  FolderOpen,
  ChevronDown,
  Maximize2,
  Minimize2,
  UserPlus
} from 'lucide-vue-next'

const linkStore = useLinkStore()
const { profile, links, activeTheme, currentTheme, seoSettings } = storeToRefs(linkStore)

// Ziyaretçi Profil Teması Seçici Modalı
const showThemeModal = ref(false)

const handleSelectVisitorTheme = (themeId) => {
  linkStore.setTheme(themeId)
  showThemeModal.value = false
}

// İletişim & Mesaj Bırakma Modalı Durumu
const showContactModal = ref(false)
const contactForm = ref({
  name: '',
  email: '',
  message: ''
})
const contactError = ref('')
const isSubmittingContact = ref(false)
const contactSubmittedSuccess = ref(false)

const openContactModal = () => {
  contactForm.value = { name: '', email: '', message: '' }
  contactError.value = ''
  contactSubmittedSuccess.value = false
  showContactModal.value = true
}

const closeContactModal = () => {
  showContactModal.value = false
}

const handleSendContactMessage = async () => {
  contactError.value = ''
  if (!contactForm.value.name.trim()) {
    contactError.value = 'Lütfen adınızı ve soyadınızı girin.'
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(contactForm.value.email.trim())) {
    contactError.value = 'Lütfen geçerli bir e-posta adresi girin.'
    return
  }
  if (!contactForm.value.message.trim() || contactForm.value.message.trim().length < 5) {
    contactError.value = 'Lütfen en az 5 karakterden oluşan bir mesaj yazın.'
    return
  }

  isSubmittingContact.value = true
  try {
    const res = await linkStore.sendMessage({
      name: contactForm.value.name,
      email: contactForm.value.email,
      message: contactForm.value.message
    })

    if (res.success) {
      contactSubmittedSuccess.value = true
    } else {
      contactError.value = res.error || 'Mesaj iletilemedi, lütfen tekrar deneyin.'
    }
  } catch (err) {
    contactError.value = 'Bir hata oluştu, lütfen tekrar deneyin.'
  } finally {
    isSubmittingContact.value = false
  }
}

// Rozet İkonları Haritası
const BADGE_ICON_MAP = {
  Code,
  Sparkles,
  MapPin,
  Briefcase,
  Heart,
  Coffee,
  Star,
  Flame,
  Zap,
  Award,
  Terminal,
  Globe
}

const getBadgeIcon = (iconName) => {
  return BADGE_ICON_MAP[iconName] || Sparkles
}

const getBadgeText = (badge) => {
  if (typeof badge === 'string') return badge.trim()
  return (badge?.text || '').trim()
}

const getBadgeClass = (badge) => {
  const isLight = activeTheme.value.id === 'pure-light'
  const found = BADGE_COLOR_STYLES.find(s => s.id === badge.color)
  if (found) {
    return isLight ? found.lightClass : found.cardClass
  }
  return isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#181818] border-[#282828] text-neutral-300'
}

const getBadgeIconColor = (badge) => {
  const found = BADGE_COLOR_STYLES.find(s => s.id === badge.color)
  return found ? found.iconColor : 'text-[#FFFF00]'
}

// Yalnızca aktif (gizlenmemiş) ve süresi dolmamış bağlantıları filtrele
const activeLinks = computed(() => {
  return links.value.filter(link => {
    if (!link.isActive) return false
    if (link.isScheduled) {
      const status = getScheduleStatus(link)
      if (status.isExpired) return false
      if (status.isUpcoming && !link.showCountdown) return false
    }
    return true
  })
})

// Hızlı Erişim Sosyal Medya Bağlantıları (Dolu ve aktif olanları filtrele)
const activeSocialLinks = computed(() => {
  const s = profile.value?.socialLinks || {}
  if (s.barVisible === false) return []
  const list = []
  if (s.github && s.githubActive !== false) list.push({ id: 'github', name: 'GitHub', url: s.github, icon: Github, hoverColor: 'hover:text-white hover:bg-white/20 hover:border-white/40 hover:shadow-white/20' })
  if (s.linkedin && s.linkedinActive !== false) list.push({ id: 'linkedin', name: 'LinkedIn', url: s.linkedin, icon: Linkedin, hoverColor: 'hover:text-blue-400 hover:bg-blue-500/15 hover:border-blue-400/40 hover:shadow-blue-500/20' })
  if (s.instagram && s.instagramActive !== false) list.push({ id: 'instagram', name: 'Instagram', url: s.instagram, icon: Instagram, hoverColor: 'hover:text-pink-400 hover:bg-pink-500/15 hover:border-pink-400/40 hover:shadow-pink-500/20' })
  if (s.twitter && s.twitterActive !== false) list.push({ id: 'twitter', name: 'Twitter / X', url: s.twitter, icon: Twitter, hoverColor: 'hover:text-sky-400 hover:bg-sky-500/15 hover:border-sky-400/40 hover:shadow-sky-500/20' })
  if (s.youtube && s.youtubeActive !== false) list.push({ id: 'youtube', name: 'YouTube', url: s.youtube, icon: Youtube, hoverColor: 'hover:text-rose-400 hover:bg-rose-500/15 hover:border-rose-400/40 hover:shadow-rose-500/20' })
  if (s.email && s.emailActive !== false) {
    const mailUrl = s.email.startsWith('mailto:') ? s.email : `mailto:${s.email}`
    list.push({ id: 'email', name: 'E-Posta', url: mailUrl, icon: Mail, hoverColor: 'hover:text-amber-300 hover:bg-amber-500/15 hover:border-amber-400/40 hover:shadow-amber-500/20' })
  }
  return list
})

const socialShapeClass = computed(() => {
  return profile.value?.socialLinks?.shape || 'rounded-full'
})

const socialStyleClass = computed(() => {
  const st = profile.value?.socialLinks?.style || 'glass'
  if (st === 'neon') return 'bg-[#141414] border border-[#FFFF00]/40 text-[#FFFF00]'
  if (st === 'solid') return 'bg-[#222222] border border-[#333333] text-white'
  return activeTheme.value.id === 'pure-light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border border-white/10 text-slate-200'
})

// İkon bileşenleri haritası
const ICON_COMPONENT_MAP = {
  Sparkles,
  Globe,
  Github,
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
  Mail,
  Phone,
  Code,
  Music,
  ShoppingBag,
  BookOpen
}

// İkon haritası ve otomatik algılama
const getLinkIcon = (link) => {
  if (link.icon && link.icon !== 'auto') {
    const found = AVAILABLE_ICONS.find(i => i.id === link.icon)
    if (found && ICON_COMPONENT_MAP[found.icon]) {
      return ICON_COMPONENT_MAP[found.icon]
    }
  }

  // Otomatik URL algılama
  const url = (link.url || '').toLowerCase()
  if (url.includes('github.com')) return Github
  if (url.includes('linkedin.com')) return Linkedin
  if (url.includes('instagram.com')) return Instagram
  if (url.includes('youtube.com') || url.includes('youtu.be')) return Youtube
  if (url.includes('twitter.com') || url.includes('x.com')) return Twitter
  if (url.includes('mailto:') || url.includes('@')) return Mail
  if (url.includes('spotify.com') || url.includes('soundcloud.com')) return Music
  return Globe
}

// Özel kart stili veya aktif tema stili
const getLinkCardClass = (link) => {
  if (link.customColor && link.customColor !== 'default') {
    const customStyle = BUTTON_STYLES.find(s => s.id === link.customColor)
    if (customStyle && customStyle.cardClass) {
      return customStyle.cardClass
    }
  }
  return activeTheme.value.cardClass
}

// Özel vurgu metin rengi veya aktif tema vurgu rengi
const getLinkAccentText = (link) => {
  if (link.customColor && link.customColor !== 'default') {
    const customStyle = BUTTON_STYLES.find(s => s.id === link.customColor)
    if (customStyle && customStyle.accentText) {
      return customStyle.accentText
    }
  }
  return activeTheme.value.accentText
}

// Profil Kapağı (Banner) Kontrolleri
const hasBanner = computed(() => {
  return !!profile.value?.banner || (profile.value?.bannerPattern && profile.value.bannerPattern !== 'none')
})

const bannerPatternClass = computed(() => {
  const p = profile.value?.bannerPattern || 'mesh'
  return `banner-${p}`
})

// Avatar & Durum Dinamik Çözümleyicileri
const avatarShapeClass = computed(() => {
  const found = AVATAR_SHAPES.find(s => s.id === profile.value?.avatarShape)
  return found ? found.class : 'rounded-full'
})

const avatarGlowConfig = computed(() => {
  const found = AVATAR_GLOW_STYLES.find(g => g.id === profile.value?.avatarGlow)
  return found || AVATAR_GLOW_STYLES[0]
})

const statusConfig = computed(() => {
  const color = profile.value?.statusColor || 'none'
  if (color === 'none') return null
  return STATUS_PRESETS.find(s => s.id === color) || STATUS_PRESETS[0]
})

// Paylaşım Modalı ve Gerçek Taranabilir QR Kod
const route = useRoute()
const showShareModal = ref(false)
const isCopied = ref(false)
const qrCodeDataUrl = ref('')
const isQrMinimized = ref(false)
const networkMode = ref('wifi') // 'wifi' | 'current'

// Yerel Wi-Fi IP Algılama ve Kullanıcı Tarafından Düzenlenebilirlik
const detectedHost = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  ? window.location.hostname
  : '192.168.1.26'

const customHostInput = ref(typeof localStorage !== 'undefined' ? (localStorage.getItem('linkspace_custom_host') || detectedHost) : detectedHost)
const isEditingCustomHost = ref(false)

const saveCustomHost = () => {
  if (customHostInput.value) {
    localStorage.setItem('linkspace_custom_host', customHostInput.value.trim())
    isEditingCustomHost.value = false
  }
}

const wifiUrl = computed(() => {
  const path = route.path && route.path !== '/' ? route.path : '/'
  const host = customHostInput.value.trim() || detectedHost
  return `http://${host}:5173${path}`
})

const currentUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.href
  }
  return `http://${detectedHost}:5173/`
})

const activeShareUrl = computed(() => {
  if (networkMode.value === 'domain' && seoSettings.value?.customDomain && seoSettings.value?.domainVerified) {
    return `https://${seoSettings.value.customDomain}/`
  }
  return networkMode.value === 'wifi' ? wifiUrl.value : currentUrl.value
})

// Dinamik OpenGraph ve SEO Meta Tag Senkronizasyonu
const setOrCreateMeta = (attr, key, content) => {
  if (typeof document === 'undefined') return
  let element = document.querySelector(`meta[${attr}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

const syncSeoMetaTags = () => {
  if (typeof document === 'undefined') return
  const seo = seoSettings.value || linkStore.DEFAULT_SEO
  const p = profile.value

  const title = seo.metaTitle || `${p.name} | linkspace`
  const desc = seo.metaDescription || p.bio || 'Linkspace profilini ve tüm sosyal bağlantılarını tek bir merkezden keşfedin.'
  const image = seo.ogImage || p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=630&fit=crop&q=80'
  const url = activeShareUrl.value

  document.title = title

  // OpenGraph (Facebook, WhatsApp, LinkedIn)
  setOrCreateMeta('property', 'og:title', title)
  setOrCreateMeta('property', 'og:description', desc)
  setOrCreateMeta('property', 'og:image', image)
  setOrCreateMeta('property', 'og:url', url)
  setOrCreateMeta('property', 'og:type', 'profile')
  setOrCreateMeta('property', 'og:site_name', 'linkspace')

  // Twitter / X Card
  setOrCreateMeta('name', 'twitter:card', 'summary_large_image')
  setOrCreateMeta('name', 'twitter:title', title)
  setOrCreateMeta('name', 'twitter:description', desc)
  setOrCreateMeta('name', 'twitter:image', image)
}

// Web Share API (Mobilde yerel WhatsApp / Instagram paylaşımı)
const canNativeShare = computed(() => typeof navigator !== 'undefined' && !!navigator.share)

const handleNativeShare = async () => {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `${profile.value.name} - Linkspace`,
        text: `${profile.value.name} linkspace profilini keşfedin!`,
        url: activeShareUrl.value
      })
    } catch (e) {
      // Paylaşım iptal edildi
    }
  } else {
    copyProfileLink()
  }
}

// QR Kod Hedef URL'i (?src=qr parametresiyle etiketlenir)
const qrTargetUrl = computed(() => {
  const base = activeShareUrl.value
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}src=qr`
})

const generateQrCode = async (targetUrl) => {
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(targetUrl, {
      width: 360,
      margin: 1.5,
      color: {
        dark: '#0C0C0B',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
  } catch (err) {
    console.error('QR Kod oluşturulamadı:', err)
  }
}

watch(qrTargetUrl, (url) => {
  if (url) {
    generateQrCode(url)
  }
}, { immediate: true })

const isLoadingProfile = ref(false)
const profileNotFound = ref(false)
const requestedUsername = ref('')

// Dinamik /:username Rotası Dinleyici ve Profil Yükleme
const loadProfileData = async (usernameParam) => {
  if (usernameParam) {
    requestedUsername.value = usernameParam
    isLoadingProfile.value = true
    profileNotFound.value = false
    try {
      const res = await linkStore.fetchPublicProfile(usernameParam)
      if (!res.success) {
        profileNotFound.value = true
        if (typeof document !== 'undefined') {
          document.title = '404 - Profil Bulunamadı | linkspace'
        }
      } else {
        if (typeof document !== 'undefined') {
          document.title = `${res.profile?.name || usernameParam} (@${usernameParam}) | linkspace`
        }
      }
    } catch (e) {
      profileNotFound.value = true
      if (typeof document !== 'undefined') {
        document.title = '404 - Profil Bulunamadı | linkspace'
      }
    } finally {
      isLoadingProfile.value = false
    }
  } else {
    profileNotFound.value = false
    isLoadingProfile.value = false
    linkStore.fetchFromApi()
    if (typeof document !== 'undefined') {
      document.title = `${profile.value.name || 'Profil'} | linkspace`
    }
  }
}

// Cihaz ve Ziyaretçi Tespiti (Mobil vs Masaüstü Tarayıcı & Ayrıntılı Cihaz Modeli)
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
}

const detectDetailedDevice = () => {
  if (typeof navigator === 'undefined') return { os: 'Diğer', model: 'Web Cihazı', browser: 'Tarayıcı' }
  const ua = navigator.userAgent || ''
  
  let os = 'Diğer'
  let model = 'Masaüstü Cihaz'
  
  if (/iPhone/i.test(ua)) {
    os = 'iOS'
    model = 'Apple iPhone'
  } else if (/iPad/i.test(ua)) {
    os = 'iPadOS'
    model = 'Apple iPad'
  } else if (/Android/i.test(ua)) {
    os = 'Android'
    if (/Samsung|SM-/i.test(ua)) model = 'Samsung Galaxy'
    else if (/Xiaomi|Redmi|POCO/i.test(ua)) model = 'Xiaomi / Redmi'
    else if (/Pixel/i.test(ua)) model = 'Google Pixel'
    else if (/Huawei|Honor/i.test(ua)) model = 'Huawei'
    else model = 'Android Akıllı Telefon'
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS'
    model = 'Apple Mac'
  } else if (/Windows/i.test(ua)) {
    os = 'Windows'
    model = 'Windows Bilgisayar'
  } else if (/Linux/i.test(ua)) {
    os = 'Linux'
    model = 'Linux Cihaz'
  }

  let browser = 'Web Tarayıcı'
  if (/Instagram/i.test(ua)) browser = 'Instagram'
  else if (/WhatsApp/i.test(ua)) browser = 'WhatsApp'
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet'
  else if (/Edg/i.test(ua)) browser = 'Microsoft Edge'
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Google Chrome'
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari'
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Mozilla Firefox'

  return { os, model, browser }
}

const recordCurrentVisit = () => {
  const isQr = route.query.src === 'qr' || route.query.source === 'qr' || route.query.ref === 'qr'
  const device = isMobileDevice() ? 'mobile' : 'desktop'
  const source = isQr ? 'qr' : 'direct'
  const devInfo = detectDetailedDevice()
  linkStore.trackVisit({ 
    device, 
    source, 
    os: devInfo.os, 
    model: devInfo.model, 
    browser: devInfo.browser 
  })
}

onMounted(() => {
  loadProfileData(route.params.username)
  generateQrCode(qrTargetUrl.value)
  recordCurrentVisit()
  syncSeoMetaTags()
})

watch(() => route.params.username, (newUsername) => {
  loadProfileData(newUsername)
})

watch([profile, seoSettings], () => {
  syncSeoMetaTags()
}, { deep: true })

const copyProfileLink = async () => {
  try {
    await navigator.clipboard.writeText(activeShareUrl.value)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2500)
  } catch (err) {
    console.error('Bağlantı kopyalanamadı:', err)
  }
}

// A/B Testi Varyant Belirleyici (Kullanıcı Oturumu Boyunca Tutarlı Varyant)
const linkVariants = reactive({})

const getLinkDisplayInfo = (link) => {
  if (!link) return { title: '', url: '', variant: 'a' }
  if (!link.abTestEnabled) {
    return { title: link.title, url: link.url, variant: 'a' }
  }

  if (!linkVariants[link.id]) {
    const storageKey = `linkspace_ab_${link.id}`
    let saved = sessionStorage.getItem(storageKey)
    if (!saved || (saved !== 'a' && saved !== 'b')) {
      saved = Math.random() < 0.5 ? 'a' : 'b'
      sessionStorage.setItem(storageKey, saved)
      // Gösterim (impression) kaydet
      linkStore.recordImpression(link.id, saved)
    }
    linkVariants[link.id] = saved
  }

  const variant = linkVariants[link.id]
  const isVariantB = variant === 'b'
  return {
    title: (isVariantB && link.titleB) ? link.titleB : link.title,
    url: (isVariantB && link.urlB) ? link.urlB : link.url,
    variant
  }
}

// Butona tıklandığında asenkron olarak /click uç noktasına istek at ve hedef sekmeyi aç (window.open(url, '_blank'))
const openLink = (link) => {
  if (!link) return
  if (link.isHeader) return // Başlık / Ayraç tıklanamaz

  const info = getLinkDisplayInfo(link)
  if (!info.url) return

  // 1. Asenkron olarak /click uç noktasına istek at ve sayacı artır (Detaylı Analitik & A/B Varyantı)
  const referrer = route.query.src === 'qr' ? 'qr' : (typeof document !== 'undefined' && document.referrer ? document.referrer : 'direct')
  const device = isMobileDevice() ? 'mobile' : 'desktop'
  linkStore.trackClick(link.id, { referrer, device, variant: info.variant })

  // 2. Güvenli hedef URL hazırla ve yeni sekmede aç
  const rawUrl = info.url.trim()
  const targetUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('mailto:'))
    ? rawUrl
    : `https://${rawUrl}`

  window.open(targetUrl, '_blank', 'noopener,noreferrer')
}

// Açık olan Embed Oynatıcıları ID Haritası: { [linkId]: boolean }
const expandedEmbeds = ref({})

// Ziyaret süresince doğrulanmış Kilitli Linkler ID Haritası: { [linkId]: boolean }
const unlockedLinks = ref({})

// Kilit Açma Modalı Durumu
const unlockModal = ref({
  isOpen: false,
  link: null,
  pinInput: '',
  errorMessage: '',
  pendingAction: 'open'
})

// Bir bağlantının ziyaretçiye karşı kilitli olup olmadığını kontrol et
const isLinkLocked = (link) => {
  return !!(link && link.isLocked && !unlockedLinks.value[link.id])
}

// Embed Oynatıcısını Aç / Kapat
const toggleEmbed = (link) => {
  if (!link) return
  if (isLinkLocked(link)) {
    promptUnlock(link, 'toggleEmbed')
    return
  }
  expandedEmbeds.value[link.id] = !expandedEmbeds.value[link.id]
}

// Ana Bağlantı Tıklama Yöneticisi (Kilit ve Embed kontrolü)
const handleLinkAction = (link) => {
  if (!link) return
  if (isLinkLocked(link)) {
    promptUnlock(link, link.showEmbed ? 'toggleEmbed' : 'open')
    return
  }

  if (link.showEmbed && link.embedType && link.embedType !== 'none') {
    toggleEmbed(link)
  } else {
    openLink(link)
  }
}

// Kilit Çözme Modalını Göster
const promptUnlock = (link, action = 'open') => {
  unlockModal.value = {
    isOpen: true,
    link,
    pinInput: '',
    errorMessage: '',
    pendingAction: action
  }
}

// Kilit Çözme Modalını Kapat
const closeUnlockModal = () => {
  unlockModal.value.isOpen = false
  unlockModal.value.link = null
  unlockModal.value.pinInput = ''
  unlockModal.value.errorMessage = ''
}

// PIN Doğrulama
const verifyPinUnlock = () => {
  const modal = unlockModal.value
  if (!modal.link) return

  const expected = String(modal.link.passcode || '').trim()
  const input = String(modal.pinInput || '').trim()

  if (!expected || input === expected) {
    unlockedLinks.value[modal.link.id] = true
    const action = modal.pendingAction
    const targetLink = modal.link
    closeUnlockModal()

    if (action === 'toggleEmbed') {
      expandedEmbeds.value[targetLink.id] = true
    } else {
      openLink(targetLink)
    }
  } else {
    modal.errorMessage = 'Hatalı PIN şifresi. Lütfen tekrar deneyin.'
  }
}

// 18+ Yaş Onaylama
const confirmAgeUnlock = () => {
  const modal = unlockModal.value
  if (!modal.link) return

  unlockedLinks.value[modal.link.id] = true
  const action = modal.pendingAction
  const targetLink = modal.link
  closeUnlockModal()

  if (action === 'toggleEmbed') {
    expandedEmbeds.value[targetLink.id] = true
  } else {
    openLink(targetLink)
  }
}

// Formatlanmış Kullanıcı Adı (Örn: @tubagul)
const displayUsername = computed(() => {
  const u = (profile.value?.username || 'tubagul').trim()
  return u.startsWith('@') ? u : `@${u}`
})

// Bağlantı Arama & Filtreleme
const searchQuery = ref('')

const filteredLinks = computed(() => {
  if (!searchQuery.value.trim()) return activeLinks.value
  const q = searchQuery.value.toLowerCase().trim()
  return activeLinks.value.filter(l => 
    l.title.toLowerCase().includes(q) || 
    (l.url && l.url.toLowerCase().includes(q)) ||
    (l.category && l.category.toLowerCase().includes(q))
  )
})

// Akordeon Klasörleri & Gruplama (Faz 19)
const expandedFolders = ref({})

const toggleFolder = (category) => {
  expandedFolders.value[category] = !isFolderOpen(category)
}

const isFolderOpen = (category) => {
  // Arama yapılırken eşleşen tüm klasörler otomatik açık kalır
  if (searchQuery.value && searchQuery.value.trim()) return true
  // Varsayılan açılış durumu yönetici panelinden ayarlanır
  if (expandedFolders.value[category] === undefined) {
    return profile.value?.foldersDefaultExpanded !== false
  }
  return expandedFolders.value[category] === true
}

const toggleAllFolders = (forceState) => {
  groupedFilteredItems.value.forEach(item => {
    if (item.type === 'folder') {
      expandedFolders.value[item.category] = forceState
    }
  })
}

// Bağlantıları Klasör ve Bağımsız olarak grupla (Profil Ayarına Bağlı)
const groupedFilteredItems = computed(() => {
  // Eğer kullanıcı profilinde kategorilere göre gruplama özelliğini kapattıysa doğrudan düz liste olarak sun
  if (!profile.value?.groupByCategory) {
    return filteredLinks.value.map(link => ({ type: 'link', id: `link-${link.id}`, link }))
  }

  // Eğer gruplama stili "headers" (Bölüm Ayraçları) ise:
  if (profile.value?.groupStyle === 'headers') {
    const items = []
    const seenCategories = new Set()
    const uncategorized = []

    for (const link of filteredLinks.value) {
      const cat = (link.category || '').trim()
      if (!cat) {
        uncategorized.push({ type: 'link', id: `link-${link.id}`, link })
      } else {
        if (!seenCategories.has(cat)) {
          seenCategories.add(cat)
          items.push({ 
            type: 'link', 
            id: `header-${cat}`, 
            link: { id: `cat-header-${cat}`, title: cat, isHeader: true } 
          })
        }
        items.push({ type: 'link', id: `link-${link.id}`, link })
      }
    }
    return [...items, ...uncategorized]
  }

  // Varsayılan: Akordeon Klasörleri (type: 'folder')
  const items = []
  const folderMap = new Map()

  for (const link of filteredLinks.value) {
    const cat = (link.category || '').trim()
    if (!cat) {
      items.push({ type: 'link', id: `link-${link.id}`, link })
    } else {
      if (!folderMap.has(cat)) {
        const folder = { type: 'folder', id: `folder-${cat}`, category: cat, links: [] }
        folderMap.set(cat, folder)
        items.push(folder)
      }
      folderMap.get(cat).links.push(link)
    }
  }
  return items
})

const hasFolders = computed(() => {
  return !!profile.value?.groupByCategory && groupedFilteredItems.value.some(item => item.type === 'folder')
})

// Bağlantı Alt Başlığı & Kategori Çözümleyici
const getLinkSubtitle = (link) => {
  const url = (link.url || '').toLowerCase()
  if (url.includes('github.com')) return 'github.com • Açık Kaynak Projeler & Kodlar'
  if (url.includes('linkedin.com')) return 'linkedin.com • Profesyonel Ağ & Kariyer'
  if (url.includes('instagram.com')) return 'instagram.com • Sosyal Paylaşımlar & Portfolyo'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube.com • Video İçerikler & Eğitimler'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'x.com • Teknoloji Gündemi & Tweetler'
  if (url.includes('spotify.com') || url.includes('soundcloud.com')) return 'Müzik & Çalma Listesi'
  if (url.startsWith('mailto:')) return 'Doğrudan E-Posta İletişimi'
  try {
    const host = new URL(link.url.startsWith('http') ? link.url : `https://${link.url}`).hostname
    return `${host} • Resmi Web Sitesi`
  } catch (e) {
    return 'Resmi Web Bağlantısı'
  }
}

// Kişilerime Kaydet (vCard .vcf İndir)
const vcardSuccess = ref(false)
const handleDownloadVCard = async () => {
  await linkStore.downloadVCard()
  vcardSuccess.value = true
  setTimeout(() => {
    vcardSuccess.value = false
  }, 3500)
}
</script>

<template>
  <main 
    :class="[
      'min-h-screen flex flex-col items-center py-6 px-4 selection:bg-[#FFFF00] selection:text-black transition-colors duration-500 relative overflow-hidden', 
      activeTheme.backgroundClass,
      activeTheme.id === 'pure-light' ? 'bg-ambient-grid-light text-slate-800' : 'bg-ambient-grid text-white'
    ]"
  >
    <!-- Ambiyans Işık Efektleri (Arka Plan Derinliği) -->
    <div class="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#FFFF00]/12 via-[#FFFF00]/4 to-transparent blur-[140px] rounded-full"></div>
    <div class="pointer-events-none absolute top-1/3 -left-48 w-[450px] h-[450px] bg-yellow-500/5 blur-[160px] rounded-full"></div>
    <div class="pointer-events-none absolute bottom-20 -right-48 w-[450px] h-[450px] bg-amber-500/5 blur-[160px] rounded-full"></div>

    <!-- LINKTREE FLOATING CAPSULE APP BAR (Ziyaretçi Ekranı) -->
    <header class="w-full max-w-4xl mx-auto mb-4 sm:mb-8 px-1 sm:px-4 relative z-20">
      <div 
        :class="[
          'w-full rounded-full px-3.5 sm:px-7 py-2 sm:py-3 shadow-xl transition-all flex items-center justify-between gap-2 sm:gap-3 border backdrop-blur-md',
          activeTheme.id === 'pure-light'
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/5'
            : 'bg-[#161616]/95 border-[#282828] text-white shadow-2xl shadow-black/80'
        ]"
      >
        <!-- Sol: linkspace Logo -->
        <router-link to="/" class="font-black text-lg sm:text-xl tracking-tight select-none hover:opacity-85 transition-opacity flex items-center shrink-0 group">
          <span>linkspace</span>
          <Zap class="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#FFFF00] fill-[#FFFF00] ml-1 inline-block drop-shadow-[0_0_8px_rgba(255,255,0,0.6)] transition-transform group-hover:scale-110" />
        </router-link>

        <!-- Orta: linkspace Profil Bağlantısı (Tıklandığında Kopyalar) -->
        <button 
          type="button"
          @click="copyProfileLink"
          class="text-xs sm:text-sm font-semibold opacity-85 hover:opacity-100 hidden md:flex items-center gap-1.5 font-mono px-3.5 py-1.5 rounded-full transition-all cursor-pointer group shadow-inner"
          :class="activeTheme.id === 'pure-light'
            ? 'bg-slate-100 border border-slate-200 text-slate-700 hover:border-yellow-400'
            : 'bg-white/5 border border-white/10 hover:border-[#FFFF00]/40 transition-all hover:text-[#FFFF00] text-neutral-200'"
          :title="isCopied ? 'Bağlantı Kopyalandı!' : 'Profili Kopyalamak İçin Tıkla'"
        >
          <span :class="activeTheme.id === 'pure-light' ? 'text-black font-bold' : 'text-[#FFFF00] font-bold'">linkspace/</span>
          <span>{{ displayUsername }}</span>
          <Check v-if="isCopied" class="w-3.5 h-3.5 ml-0.5" :class="activeTheme.id === 'pure-light' ? 'text-black' : 'text-[#FFFF00]'" />
          <Copy v-else class="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 ml-0.5 transition-opacity" :class="activeTheme.id === 'pure-light' ? 'text-black' : 'text-[#FFFF00]'" />
        </button>

        <!-- Sağ: 'Tema' (Ziyaretçi Profil Teması) + 'Yönetici' (Giriş) + 'Paylaş' (QR) -->
        <div class="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <!-- Ziyaretçi Profil Teması Seçici Butonu -->
          <button 
            type="button"
            @click="showThemeModal = true"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full text-xs font-bold border backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            :class="activeTheme.id === 'pure-light'
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-white/10 hover:bg-white/15 border-white/15 text-white hover:text-[#FFFF00] hover:border-[#FFFF00]/40'"
            title="Ziyaretçi Profil Temasını Değiştir"
          >
            <Palette class="w-3.5 h-3.5" :class="activeTheme.id === 'pure-light' ? 'text-black' : 'text-[#FFFF00]'" />
            <span class="hidden sm:inline">Tema</span>
          </button>

          <!-- Bana Ulaşın / İletişim Butonu -->
          <button 
            type="button"
            @click="openContactModal"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full text-xs font-bold border backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            :class="activeTheme.id === 'pure-light'
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-white/10 hover:bg-white/15 border-white/15 text-white hover:text-[#FFFF00] hover:border-[#FFFF00]/40'"
            title="Bana Mesaj Gönderin"
          >
            <Mail class="w-3.5 h-3.5" :class="activeTheme.id === 'pure-light' ? 'text-black' : 'text-[#FFFF00]'" />
            <span class="hidden sm:inline">İletişim</span>
          </button>

          <!-- Yönetici Giriş Linki ('Çıkış Yap' tarzı yalın zarif buton) -->
          <router-link 
            to="/admin" 
            class="text-xs sm:text-sm font-semibold transition-colors px-2.5 py-1.5"
            :class="activeTheme.id === 'pure-light' ? 'text-[#8E8E93] hover:text-black' : 'text-[#8E8E93] hover:text-[#FFFF00]'"
            title="Yönetici Paneline Git"
          >
            <span>Yönetici</span>
          </router-link>

          <!-- Paylaş Butonu (Dribbble İkonik Elektrik Sarı Kapsül Butonu - Kullanıcı Görseliyle Birebir) -->
          <button 
            type="button"
            @click="showShareModal = true"
            class="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-md shadow-yellow-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Profili Paylaş / QR Kodu Göster"
          >
            <Share2 class="w-3.5 h-3.5 text-black stroke-[2.2]" />
            <span>Paylaş</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Yükleniyor Durumu -->
    <div v-if="isLoadingProfile" class="w-full max-w-2xl py-24 flex flex-col items-center justify-center text-center relative z-10">
      <div class="w-10 h-10 border-3 border-[#FFFF00] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-sm font-semibold tracking-wide text-neutral-400">Profil yükleniyor...</p>
    </div>

    <!-- 404 - Profil Bulunamadı Durumu -->
    <div 
      v-else-if="profileNotFound" 
      :class="[
        'w-full max-w-lg rounded-[36px] border p-8 sm:p-12 text-center backdrop-blur-2xl shadow-2xl relative z-10 flex flex-col items-center my-auto transition-colors',
        activeTheme.id === 'pure-light'
          ? 'bg-white/95 border-slate-200 shadow-slate-300/40 text-slate-800'
          : 'bg-[#161616]/95 border-[#282828] text-white shadow-2xl shadow-black/80'
      ]"
    >
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 border border-rose-500/25 text-rose-400 mb-6">
        <span>404 • SAYFA BULUNAMADI</span>
      </div>

      <div class="w-20 h-20 rounded-3xl bg-[#FFFF00]/10 border border-[#FFFF00]/25 flex items-center justify-center text-[#FFFF00] mb-5 shadow-xl shadow-yellow-500/10">
        <UserX class="w-10 h-10 text-[#FFFF00]" />
      </div>

      <h2 :class="['text-2xl sm:text-3xl font-black mb-2 tracking-tight', activeTheme.id === 'pure-light' ? 'text-slate-900' : 'text-white']">
        Profil Bulunamadı
      </h2>

      <p :class="['text-sm max-w-sm mb-6 leading-relaxed', activeTheme.id === 'pure-light' ? 'text-slate-600' : 'text-neutral-400']">
        Aradığınız <span class="text-[#FFFF00] font-mono font-bold">@{{ requestedUsername }}</span> kullanıcı adlı profil mevcut değil, silinmiş veya kullanıcı adı değiştirilmiş olabilir.
      </p>

      <div class="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
        <router-link 
          to="/" 
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-[#FFFF00] text-black hover:bg-[#EEFF00] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/20"
        >
          <span>Ana Sayfaya Dön</span>
        </router-link>

        <router-link 
          to="/login" 
          :class="[
            'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm border transition-all hover:scale-105 active:scale-95',
            activeTheme.id === 'pure-light' ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-white/10 text-neutral-300 hover:bg-white/5'
          ]"
        >
          <span>Giriş Yap / Kayıt Ol</span>
        </router-link>
      </div>
    </div>

    <!-- ANA PROFİL VİTRİN KARTI (SHOWCASE HUB CONTAINER) -->
    <div 
      v-else
      :class="[
        'w-full max-w-2xl rounded-[36px] border p-5 sm:p-9 backdrop-blur-2xl transition-all relative z-10 flex flex-col items-center shadow-2xl',
        activeTheme.id === 'pure-light'
          ? 'bg-white/85 border-slate-200/90 shadow-slate-300/40'
          : 'bg-[#121212]/85 border-[#262626] shadow-2xl shadow-black ring-1 ring-white/5'
      ]"
    >

      <!-- Profil Kapağı (Banner) -->
      <div 
        v-if="hasBanner"
        class="relative w-full h-40 sm:h-52 rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-[-54px] sm:mb-[-62px] transition-all"
        :class="bannerPatternClass"
      >
        <img 
          v-if="profile.banner" 
          :src="profile.banner" 
          alt="Profil Kapağı" 
          class="w-full h-full object-cover" 
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25"></div>
      </div>

      <!-- Avatar Görseli -->
      <div class="relative group mb-3 z-10">
        <div 
          v-if="profile.avatarGlow !== 'none'"
          :class="[
            'absolute -inset-1.5 bg-gradient-to-r blur-md opacity-85 group-hover:opacity-100 transition duration-300',
            avatarShapeClass,
            avatarGlowConfig.glowGradient
          ]"
        ></div>
        <img 
          :src="profile.avatar" 
          :alt="profile.name" 
          class="relative w-28 h-28 sm:w-32 sm:h-32 object-cover border-4 shadow-2xl ring-4 ring-black/50 transition-all"
          :class="[
            avatarShapeClass,
            profile.avatarGlow !== 'none' ? avatarGlowConfig.borderClass : (activeTheme.id === 'pure-light' ? 'border-white' : 'border-[#141414]')
          ]"
        />
      </div>

      <!-- Canlı Çalışma / Fırsat Durum Rozeti -->
      <div 
        v-if="statusConfig && profile.statusText"
        :class="[
          'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-sm mb-3.5 backdrop-blur-sm select-none transition-all',
          statusConfig.badgeClass
        ]"
      >
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="statusConfig.pingClass"></span>
          <span class="relative inline-flex rounded-full h-2 w-2" :class="statusConfig.dotClass"></span>
        </span>
        <span>{{ profile.statusText }}</span>
      </div>

      <!-- Profil Başlık & Doğrulanmış Rozeti -->
      <h1 :class="['text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2', activeTheme.id === 'pure-light' ? 'text-slate-900' : 'text-white']">
        <span>{{ profile.name }}</span>
        <CheckCircle2 v-if="profile.isVerified !== false" class="w-5 h-5 text-[#FFFF00]" />
      </h1>
      <p :class="['text-xs sm:text-sm font-semibold mb-3 tracking-wider font-mono', activeTheme.accentText]">
        {{ profile.username }}
      </p>
      
      <!-- Biyografi -->
      <p :class="['text-sm sm:text-base text-center max-w-lg mb-4 leading-relaxed font-light opacity-90', activeTheme.id === 'pure-light' ? 'text-slate-600' : 'text-slate-300']">
        {{ profile.bio }}
      </p>

      <!-- Dinamik Yetenek & İlgi Alanı Rozetleri (Showcase Badges) -->
      <div 
        v-if="profile.showBadges && profile.badges && profile.badges.length > 0" 
        class="flex items-center justify-center flex-wrap gap-2 mb-6 select-none"
      >
        <template v-for="(badge, bIdx) in profile.badges" :key="badge.id || bIdx">
          <span 
            v-if="getBadgeText(badge)"
            :class="[
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border shadow-xs transition-all duration-200 hover:scale-105 select-none',
              getBadgeClass(badge)
            ]"
          >
            <component :is="getBadgeIcon(badge.icon)" class="w-3.5 h-3.5" :class="getBadgeIconColor(badge)" />
            <span>{{ getBadgeText(badge) }}</span>
          </span>
        </template>
      </div>


      <!-- Hızlı Erişim Sosyal Medya İkon Barı -->
      <nav 
        v-if="activeSocialLinks.length > 0" 
        aria-label="Sosyal Medya Bağlantıları"
        :class="[
          'flex items-center justify-center flex-wrap gap-2.5 mb-6 p-2 px-4 border backdrop-blur-md shadow-lg transition-all',
          socialShapeClass,
          activeTheme.id === 'pure-light' ? 'bg-white/90 border-slate-200/90 shadow-slate-200/50' : 'bg-[#181818]/90 border-[#282828] shadow-xl shadow-black/40'
        ]"
      >
        <a 
          v-for="social in activeSocialLinks" 
          :key="social.id" 
          :href="social.url" 
          target="_blank" 
          rel="noopener noreferrer"
          :title="social.name"
          :class="[
            'p-2.5 border transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm',
            socialShapeClass,
            socialStyleClass,
            social.hoverColor
          ]"
        >
          <component :is="social.icon" class="w-4 h-4" />
          <span class="sr-only">{{ social.name }}</span>
        </a>
      </nav>

      <!-- Hızlı Profil Aksiyonları (Rehbere Ekle & Mesaj Bırak) -->
      <div class="flex items-center justify-center gap-2.5 mb-5 flex-wrap z-10 select-none">
        <button
          type="button"
          @click="handleDownloadVCard"
          class="px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
          :class="vcardSuccess 
            ? 'bg-emerald-500 text-black shadow-emerald-500/20' 
            : (activeTheme.id === 'pure-light' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-[#FFFF00] text-black hover:bg-yellow-300 shadow-yellow-500/20')"
          title="Kişiyi doğrudan telefon rehberinize kaydedin (.vcf)"
        >
          <Check v-if="vcardSuccess" class="w-4 h-4 stroke-[3]" />
          <UserPlus v-else class="w-4 h-4 stroke-[2.5]" />
          <span>{{ vcardSuccess ? 'Kişi İndirildi!' : 'Kişilerime Kaydet' }}</span>
        </button>

        <button
          type="button"
          @click="showContactModal = true"
          class="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-2 border backdrop-blur-md active:scale-95 cursor-pointer"
          :class="activeTheme.id === 'pure-light'
            ? 'bg-white/90 border-slate-300 text-slate-800 hover:bg-slate-100'
            : 'bg-white/10 border-white/15 text-white hover:bg-white/20'"
        >
          <MessageSquare class="w-4 h-4" />
          <span>Mesaj Bırak</span>
        </button>
      </div>

      <!-- Arama / Filtreleme Çubuğu (Varsa 3'ten fazla linkte göster) -->
      <div v-if="activeLinks.length > 2" class="relative w-full max-w-lg mx-auto mb-4">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Bağlantılarda ara..." 
          :class="[
            'w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs transition-all focus:outline-none shadow-inner',
            activeTheme.id === 'pure-light'
              ? 'bg-slate-100 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-yellow-600 focus:bg-white'
              : 'bg-[#161616] border border-[#282828] text-white placeholder-neutral-500 focus:border-[#FFFF00] focus:ring-1 focus:ring-[#FFFF00]/40'
          ]"
        />
      </div>

      <!-- Aktif Bağlantı ve Klasör Listesi -->
      <div class="w-full space-y-3.5 max-w-lg mx-auto">
        <template v-for="item in groupedFilteredItems" :key="item.id">
          
          <!-- DURUM A: Bağımsız Bağlantı (Klasörsüz) veya Başlık Ayracı -->
          <div v-if="item.type === 'link'" class="w-full">
            <!-- Başlık / Kategori Ayracı (Section Header) -->
            <div 
              v-if="item.link.isHeader"
              class="w-full pt-5 pb-1.5 flex items-center gap-3 select-none"
            >
              <div class="h-px flex-1" :class="activeTheme.id === 'pure-light' ? 'bg-slate-300' : 'bg-white/15'"></div>
              <span 
                class="text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs"
                :class="activeTheme.id === 'pure-light' ? 'text-slate-800 bg-slate-100 border border-slate-200' : 'text-neutral-200 bg-white/5 border border-white/10'"
              >
                <span class="text-[#FFFF00]">✦</span>
                <span>{{ item.link.title }}</span>
              </span>
              <div class="h-px flex-1" :class="activeTheme.id === 'pure-light' ? 'bg-slate-300' : 'bg-white/15'"></div>
            </div>

            <!-- Normal Tıklanabilir Bağlantı Kartı -->
            <button 
              v-else
              type="button"
              @click="handleLinkAction(item.link)"
              :class="[
                'group relative flex items-center justify-between w-full transition-all duration-300 text-left cursor-pointer select-none',
                activeTheme.id === 'pure-light'
                  ? 'p-3.5 sm:p-4 rounded-full bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-md shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/40 hover:scale-[1.01] active:scale-[0.99] border border-yellow-300/60'
                  : 'p-4 sm:p-4.5 rounded-2xl border backdrop-blur-md hover:-translate-y-1 hover:shadow-2xl hover:border-l-4 hover:border-l-[#FFFF00]',
                activeTheme.id !== 'pure-light' ? getLinkCardClass(item.link) : (item.link.customColor && item.link.customColor !== 'default' ? getLinkCardClass(item.link) : '')
              ]"
            >
              <div class="flex items-center gap-3.5 min-w-0">
                <div 
                  :class="[
                    'w-11 h-11 flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-xs',
                    activeTheme.id === 'pure-light' 
                      ? 'rounded-full bg-black text-[#FFFF00] group-hover:scale-110 shadow-sm' 
                      : 'rounded-xl border bg-[#FFFF00]/10 border-[#FFFF00]/30 text-[#FFFF00] group-hover:scale-110 group-hover:bg-[#FFFF00] group-hover:text-black'
                  ]"
                >
                  <component 
                    :is="getLinkIcon(item.link)" 
                    class="w-5 h-5 transition-transform group-hover:rotate-6" 
                  />
                </div>
                <div class="min-w-0 text-left">
                  <div class="flex items-center gap-2 flex-wrap">
                    <div :class="['font-extrabold text-sm sm:text-base tracking-tight truncate transition-colors', activeTheme.id === 'pure-light' ? 'text-black' : 'text-white group-hover:text-[#FFFF00]']">
                      {{ getLinkDisplayInfo(item.link).title }}
                    </div>

                    <!-- Kilitli Rozeti -->
                    <span 
                      v-if="isLinkLocked(item.link)"
                      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xs"
                      :class="item.link.lockType === 'age'
                        ? (activeTheme.id === 'pure-light' ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/40')
                        : (activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] border-black/20' : 'bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30')"
                    >
                      <ShieldAlert v-if="item.link.lockType === 'age'" class="w-3 h-3 stroke-[2.5]" />
                      <Lock v-else class="w-3 h-3 stroke-[2.5]" />
                      <span>{{ item.link.lockType === 'age' ? '18+' : 'Kilitli' }}</span>
                    </span>

                    <!-- Embed Rozeti -->
                    <span 
                      v-else-if="item.link.showEmbed && item.link.embedType && item.link.embedType !== 'none'"
                      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border"
                      :class="activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] border-black/20' : 'bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30'"
                    >
                      <Play class="w-2.5 h-2.5 fill-current" />
                      <span class="capitalize">{{ item.link.embedType }}</span>
                    </span>

                    <!-- Canlı Geri Sayım Rozeti -->
                    <span 
                      v-if="item.link.isScheduled && item.link.showCountdown && getScheduleStatus(item.link).badgeText"
                      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border transition-all"
                      :class="activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] border-black/20 shadow-xs' : getScheduleStatus(item.link).badgeClass"
                    >
                      {{ getScheduleStatus(item.link).badgeText }}
                    </span>
                  </div>
                  <div :class="['text-[11px] truncate font-mono mt-0.5', activeTheme.id === 'pure-light' ? 'text-neutral-800/80 font-medium' : 'text-neutral-400']">
                    {{ getLinkSubtitle(item.link) }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0 ml-3">
                <span v-if="item.link.clicks > 0" :class="['hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors', activeTheme.id === 'pure-light' ? 'bg-black/10 border-black/15 text-black' : 'bg-white/5 border-white/10 text-neutral-400 group-hover:text-white']">
                  {{ item.link.clicks }} tık
                </span>
                <div :class="['w-8 h-8 rounded-full flex items-center justify-center transition-all', activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] group-hover:bg-neutral-900 group-hover:scale-105' : 'bg-white/5 group-hover:bg-[#FFFF00] text-neutral-400 group-hover:text-black']">
                  <Lock v-if="isLinkLocked(item.link)" class="w-3.5 h-3.5 stroke-[2.2]" />
                  <Play v-else-if="item.link.showEmbed && item.link.embedType && item.link.embedType !== 'none'" class="w-3.5 h-3.5 fill-current" />
                  <ArrowUpRight v-else class="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </button>

            <!-- Bağımsız Link Embed Oynatıcısı -->
            <div 
              v-if="expandedEmbeds[item.link.id] && item.link.showEmbed && getEmbedUrl(item.link)"
              class="overflow-hidden rounded-2xl border transition-all duration-300 mt-2 p-3 shadow-2xl animate-scale-up"
              :class="activeTheme.id === 'pure-light'
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-[#121212] border-[#2c2c2c] text-white'"
            >
              <div class="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
                <div class="flex items-center gap-2 font-semibold">
                  <Radio class="w-3.5 h-3.5 text-[#FFFF00] animate-pulse" />
                  <span class="truncate">{{ item.link.title }}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 uppercase font-mono tracking-wider">
                    {{ item.link.embedType }}
                  </span>
                </div>
                <button 
                  type="button" 
                  @click.stop="expandedEmbeds[item.link.id] = false" 
                  class="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Oynatıcıyı Kapat"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <!-- YouTube Iframe -->
              <div v-if="item.link.embedType === 'youtube'" class="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner">
                <iframe 
                  :src="getEmbedUrl(item.link)" 
                  class="w-full h-full border-0" 
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowfullscreen
                ></iframe>
              </div>

              <!-- Spotify Iframe -->
              <div v-else-if="item.link.embedType === 'spotify'" class="w-full h-[152px] rounded-xl overflow-hidden bg-black/40">
                <iframe 
                  :src="getEmbedUrl(item.link)" 
                  class="w-full h-full border-0" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                ></iframe>
              </div>

              <!-- SoundCloud Iframe -->
              <div v-else-if="item.link.embedType === 'soundcloud'" class="w-full h-[166px] rounded-xl overflow-hidden bg-black/40">
                <iframe 
                  :src="getEmbedUrl(item.link)" 
                  class="w-full h-full border-0" 
                  scrolling="no" 
                  frameborder="no" 
                  allow="autoplay"
                ></iframe>
              </div>

              <!-- Embed Alt Çubuğu -->
              <div class="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 text-[11px]">
                <span class="text-neutral-400 font-mono text-[10px]">Profil üzerinden dinleniyor/izleniyor</span>
                <button 
                  type="button"
                  @click.stop="openLink(item.link)"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFF00] text-black font-extrabold hover:bg-[#EEFF00] transition-transform active:scale-95 cursor-pointer shadow-xs"
                >
                  <span>Orijinal Platformda Aç</span>
                  <ArrowUpRight class="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          <!-- DURUM B: Akordeon Klasör Kartı (Gruplanmış Bağlantılar) -->
          <div v-else-if="item.type === 'folder'" class="w-full space-y-2">
            <!-- Klasör Başlık Butonu -->
            <button
              type="button"
              @click="toggleFolder(item.category)"
              :class="[
                'w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 text-left cursor-pointer group shadow-sm select-none',
                activeTheme.id === 'pure-light'
                  ? (isFolderOpen(item.category) 
                      ? 'bg-amber-100/90 border-amber-400 text-black shadow-md shadow-amber-500/10' 
                      : 'bg-white/90 hover:bg-amber-50/70 border-slate-300/80 text-black')
                  : (isFolderOpen(item.category) 
                      ? 'bg-[#1c1c1a] border-[#FFFF00]/40 text-white shadow-xl shadow-black/50' 
                      : 'bg-[#151515] hover:bg-[#1a1a1a] border-[#282828] text-white')
              ]"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div 
                  :class="[
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0',
                    activeTheme.id === 'pure-light' 
                      ? 'bg-black text-[#FFFF00]' 
                      : 'bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/30'
                  ]"
                >
                  <FolderOpen v-if="isFolderOpen(item.category)" class="w-5 h-5 stroke-[2.2]" />
                  <Folder v-else class="w-5 h-5 stroke-[2.2]" />
                </div>
                <div class="min-w-0">
                  <div class="font-extrabold text-sm sm:text-base tracking-tight truncate flex items-center gap-2">
                    <span>{{ item.category }}</span>
                  </div>
                  <div :class="['text-[11px] font-mono mt-0.5', activeTheme.id === 'pure-light' ? 'text-slate-600' : 'text-neutral-400']">
                    {{ item.links.length }} bağlantı • {{ isFolderOpen(item.category) ? 'Açık' : 'Tıkla ve İncele' }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <span 
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors"
                  :class="activeTheme.id === 'pure-light' ? 'bg-black/10 border-black/15 text-black' : 'bg-white/5 border-white/10 text-neutral-300'"
                >
                  {{ item.links.length }}
                </span>
                <div 
                  class="w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300"
                  :class="[
                    isFolderOpen(item.category) ? 'rotate-180' : 'rotate-0',
                    activeTheme.id === 'pure-light' ? 'bg-black/10 text-black' : 'bg-white/5 text-neutral-300'
                  ]"
                >
                  <ChevronDown class="w-4 h-4" />
                </div>
              </div>
            </button>

            <!-- Klasör İçeriği (Akordeon Gövdesi) -->
            <div 
              v-show="isFolderOpen(item.category)"
              class="pl-3 sm:pl-4 space-y-2.5 border-l-2 border-dashed transition-all duration-300 pt-1"
              :class="activeTheme.id === 'pure-light' ? 'border-amber-400/70' : 'border-[#FFFF00]/35'"
            >
              <div v-for="subLink in item.links" :key="subLink.id" class="w-full">
                <!-- Klasör İçi Başlık Ayracı -->
                <div 
                  v-if="subLink.isHeader"
                  class="w-full pt-3 pb-1 flex items-center gap-2 select-none"
                >
                  <div class="h-px flex-1" :class="activeTheme.id === 'pure-light' ? 'bg-slate-300' : 'bg-white/10'"></div>
                  <span class="text-[11px] font-mono font-bold tracking-wider uppercase text-neutral-400">✦ {{ subLink.title }}</span>
                  <div class="h-px flex-1" :class="activeTheme.id === 'pure-light' ? 'bg-slate-300' : 'bg-white/10'"></div>
                </div>

                <button 
                  v-else
                  type="button"
                  @click="handleLinkAction(subLink)"
                  :class="[
                    'group relative flex items-center justify-between w-full transition-all duration-300 text-left cursor-pointer select-none',
                    activeTheme.id === 'pure-light'
                      ? 'p-3 sm:p-3.5 rounded-full bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-sm shadow-yellow-500/20 hover:scale-[1.01] active:scale-[0.99] border border-yellow-300/60'
                      : 'p-3.5 sm:p-4 rounded-xl border backdrop-blur-md hover:-translate-y-0.5 hover:shadow-xl hover:border-l-4 hover:border-l-[#FFFF00]',
                    activeTheme.id !== 'pure-light' ? getLinkCardClass(subLink) : (subLink.customColor && subLink.customColor !== 'default' ? getLinkCardClass(subLink) : '')
                  ]"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div 
                      :class="[
                        'w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-xs',
                        activeTheme.id === 'pure-light' 
                          ? 'rounded-full bg-black text-[#FFFF00]' 
                          : 'rounded-lg border bg-[#FFFF00]/10 border-[#FFFF00]/30 text-[#FFFF00] group-hover:scale-105 group-hover:bg-[#FFFF00] group-hover:text-black'
                      ]"
                    >
                      <component 
                        :is="getLinkIcon(subLink)" 
                        class="w-4 h-4 transition-transform group-hover:rotate-6" 
                      />
                    </div>
                    <div class="min-w-0 text-left">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <div :class="['font-extrabold text-xs sm:text-sm tracking-tight truncate transition-colors', activeTheme.id === 'pure-light' ? 'text-black' : 'text-white group-hover:text-[#FFFF00]']">
                          {{ getLinkDisplayInfo(subLink).title }}
                        </div>

                        <!-- Kilitli Rozeti -->
                        <span 
                          v-if="isLinkLocked(subLink)"
                          class="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-extrabold border shadow-xs"
                          :class="subLink.lockType === 'age'
                            ? (activeTheme.id === 'pure-light' ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/40')
                            : (activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] border-black/20' : 'bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30')"
                        >
                          <ShieldAlert v-if="subLink.lockType === 'age'" class="w-2.5 h-2.5 stroke-[2.5]" />
                          <Lock v-else class="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>{{ subLink.lockType === 'age' ? '18+' : 'Kilitli' }}</span>
                        </span>

                        <!-- Embed Rozeti -->
                        <span 
                          v-else-if="subLink.showEmbed && subLink.embedType && subLink.embedType !== 'none'"
                          class="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-extrabold border"
                          :class="activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] border-black/20' : 'bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30'"
                        >
                          <Play class="w-2 h-2 fill-current" />
                          <span class="capitalize">{{ subLink.embedType }}</span>
                        </span>

                        <!-- Canlı Geri Sayım Rozeti -->
                        <span 
                          v-if="subLink.isScheduled && subLink.showCountdown && getScheduleStatus(subLink).badgeText"
                          class="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-extrabold border transition-all"
                          :class="activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] border-black/20' : getScheduleStatus(subLink).badgeClass"
                        >
                          {{ getScheduleStatus(subLink).badgeText }}
                        </span>
                      </div>
                      <div :class="['text-[10px] truncate font-mono mt-0.5', activeTheme.id === 'pure-light' ? 'text-neutral-800/80 font-medium' : 'text-neutral-400']">
                        {{ getLinkSubtitle(subLink) }}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span v-if="subLink.clicks > 0" :class="['hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors', activeTheme.id === 'pure-light' ? 'bg-black/10 border-black/15 text-black' : 'bg-white/5 border-white/10 text-neutral-400 group-hover:text-white']">
                      {{ subLink.clicks }}
                    </span>
                    <div :class="['w-7 h-7 rounded-full flex items-center justify-center transition-all', activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] group-hover:scale-105' : 'bg-white/5 group-hover:bg-[#FFFF00] text-neutral-400 group-hover:text-black']">
                      <Lock v-if="isLinkLocked(subLink)" class="w-3 h-3 stroke-[2.2]" />
                      <Play v-else-if="subLink.showEmbed && subLink.embedType && subLink.embedType !== 'none'" class="w-3 h-3 fill-current" />
                      <ArrowUpRight v-else class="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>

                <!-- Klasör İçi Link Embed Oynatıcısı -->
                <div 
                  v-if="expandedEmbeds[subLink.id] && subLink.showEmbed && getEmbedUrl(subLink)"
                  class="overflow-hidden rounded-2xl border transition-all duration-300 mt-2 p-3 shadow-2xl animate-scale-up"
                  :class="activeTheme.id === 'pure-light'
                    ? 'bg-slate-900 border-slate-800 text-white'
                    : 'bg-[#121212] border-[#2c2c2c] text-white'"
                >
                  <div class="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
                    <div class="flex items-center gap-2 font-semibold">
                      <Radio class="w-3 h-3 text-[#FFFF00] animate-pulse" />
                      <span class="truncate">{{ subLink.title }}</span>
                      <span class="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 uppercase font-mono tracking-wider">
                        {{ subLink.embedType }}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      @click.stop="expandedEmbeds[subLink.id] = false" 
                      class="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <!-- YouTube Iframe -->
                  <div v-if="subLink.embedType === 'youtube'" class="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner">
                    <iframe 
                      :src="getEmbedUrl(subLink)" 
                      class="w-full h-full border-0" 
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowfullscreen
                    ></iframe>
                  </div>

                  <!-- Spotify Iframe -->
                  <div v-else-if="subLink.embedType === 'spotify'" class="w-full h-[152px] rounded-xl overflow-hidden bg-black/40">
                    <iframe 
                      :src="getEmbedUrl(subLink)" 
                      class="w-full h-full border-0" 
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                      loading="lazy"
                    ></iframe>
                  </div>

                  <!-- SoundCloud Iframe -->
                  <div v-else-if="subLink.embedType === 'soundcloud'" class="w-full h-[166px] rounded-xl overflow-hidden bg-black/40">
                    <iframe 
                      :src="getEmbedUrl(subLink)" 
                      class="w-full h-full border-0" 
                      scrolling="no" 
                      frameborder="no" 
                      allow="autoplay"
                    ></iframe>
                  </div>

                  <!-- Embed Alt Çubuğu -->
                  <div class="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 text-[11px]">
                    <span class="text-neutral-400 font-mono text-[10px]">Profil üzerinden dinleniyor/izleniyor</span>
                    <button 
                      type="button"
                      @click.stop="openLink(subLink)"
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFF00] text-black font-extrabold hover:bg-[#EEFF00] transition-transform active:scale-95 cursor-pointer shadow-xs"
                    >
                      <span>Orijinal Platformda Aç</span>
                      <ArrowUpRight class="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </template>

        <!-- Arama veya Bağlantı Boş Durumu -->
        <div 
          v-if="filteredLinks.length === 0" 
          :class="[
            'text-center py-8 px-4 rounded-2xl border border-dashed text-xs',
            activeTheme.id === 'pure-light' ? 'bg-white/60 border-slate-300 text-slate-500' : 'bg-[#181818]/60 border-[#282828] text-neutral-400'
          ]"
        >
          {{ searchQuery ? `'${searchQuery}' aramasına uygun bağlantı bulunamadı.` : 'Henüz aktif bir bağlantı bulunmuyor.' }}
        </div>
      </div>

      <!-- Bana Mesaj Gönderin / Lead Formu Tetikleyici Kartı -->
      <div 
        @click="openContactModal"
        class="w-full max-w-lg mt-5 p-4 rounded-2xl border transition-all duration-300 cursor-pointer group flex items-center justify-between shadow-sm hover:scale-[1.01]"
        :class="activeTheme.id === 'pure-light'
          ? 'bg-white border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/40 shadow-xs'
          : 'bg-[#151515] border-[#262626] hover:border-[#FFFF00]/60 hover:bg-[#1a1a1a] shadow-lg shadow-black/40'"
      >
        <div class="flex items-center gap-3">
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs shrink-0"
            :class="activeTheme.id === 'pure-light' ? 'bg-[#FFFF00] text-black font-bold' : 'bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/30'"
          >
            <MessageSquare class="w-5 h-5" />
          </div>
          <div class="text-left">
            <h4 :class="['text-xs sm:text-sm font-bold flex items-center gap-1.5', activeTheme.id === 'pure-light' ? 'text-black' : 'text-white']">
              <span>Bana Mesaj Bırakın</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" :class="activeTheme.id === 'pure-light' ? 'bg-yellow-100 text-yellow-800' : 'bg-[#FFFF00]/20 text-[#FFFF00]'">Hızlı Yanıt</span>
            </h4>
            <p :class="['text-[11px] mt-0.5 line-clamp-1', activeTheme.id === 'pure-light' ? 'text-slate-500' : 'text-neutral-400']">
              İş birliği, staj veya soru sormak için doğrudan yazabilirsiniz
            </p>
          </div>
        </div>
        <div 
          class="w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:translate-x-1 shrink-0 ml-2"
          :class="activeTheme.id === 'pure-light' ? 'bg-slate-100 text-slate-800 group-hover:bg-[#FFFF00]' : 'bg-white/5 text-neutral-400 group-hover:text-black group-hover:bg-[#FFFF00]'"
        >
          <ArrowRight class="w-4 h-4" />
        </div>
      </div>

      <!-- Alt Bilgi -->
      <footer class="mt-10 text-center flex flex-col items-center gap-2 select-none">
        <span :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium tracking-wider uppercase', activeTheme.id === 'pure-light' ? 'bg-white/80 border-slate-200 text-slate-500' : 'bg-[#181818] border-[#282828] text-neutral-400']">
          <span>linkspace</span>
          <Zap class="w-2.5 h-2.5 text-[#FFFF00] fill-[#FFFF00]" />
        </span>
        <router-link 
          to="/admin" 
          :class="['text-[11px] transition-colors flex items-center gap-1.5 mt-1', activeTheme.id === 'pure-light' ? 'text-slate-500 hover:text-black font-semibold' : 'text-neutral-400 hover:text-[#FFFF00] font-semibold']"
        >
          <Lock class="w-3 h-3 text-[#FFFF00]" />
          <span>Yönetici Paneli</span>
        </router-link>
      </footer>

    </div>
  </main>

  <!-- Sağ Altta Sürekli Açık Duran Profesyonel Viewfinder QR Kartı (Luxury Floating Pass) -->
  <aside 
    aria-label="Profil QR Kodu"
    class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 select-none max-w-[200px] sm:max-w-[220px]"
  >
    <!-- Açık Durum: Dribbble Tech-Luxury Kartı -->
    <div 
      v-if="!isQrMinimized"
      :class="[
        'rounded-[26px] p-3 sm:p-3.5 border shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition-all duration-300 flex flex-col items-center relative overflow-hidden group',
        activeTheme.id === 'pure-light'
          ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/10'
          : 'bg-[#121212]/95 border-[#262626] text-white ring-1 ring-white/10 hover:ring-[#FFFF00]/40'
      ]"
    >
      <!-- Arka Plan Neon Parıltısı -->
      <div class="pointer-events-none absolute -top-8 -right-8 w-20 h-20 bg-[#FFFF00]/10 rounded-full blur-xl"></div>

      <!-- Kart Üst Barı: Marka & Kullanıcı & Aksiyonlar -->
      <div class="w-full flex items-center justify-between gap-1.5 mb-2.5 px-0.5">
        <div class="flex items-center gap-1.5 min-w-0">
          <Zap class="w-3.5 h-3.5 text-[#FFFF00] fill-[#FFFF00] shrink-0 drop-shadow-[0_0_6px_rgba(255,255,0,0.6)]" />
          <div class="min-w-0">
            <span class="text-[10px] font-mono font-bold block truncate" :class="activeTheme.id === 'pure-light' ? 'text-slate-900' : 'text-white'">
              {{ displayUsername }}
            </span>
          </div>
        </div>

        <!-- Üst Butonlar (Küçült / Büyüt) -->
        <div class="flex items-center gap-0.5 shrink-0">
          <button 
            type="button"
            @click="showShareModal = true"
            class="p-1 rounded-lg transition-colors cursor-pointer"
            :class="activeTheme.id === 'pure-light' ? 'hover:bg-slate-100 text-slate-400 hover:text-black' : 'hover:bg-white/10 text-neutral-400 hover:text-[#FFFF00]'"
            title="Büyüt ve Paylaş"
          >
            <Maximize2 class="w-3 h-3" />
          </button>
          <button 
            type="button"
            @click="isQrMinimized = true"
            class="p-1 rounded-lg transition-colors cursor-pointer"
            :class="activeTheme.id === 'pure-light' ? 'hover:bg-slate-100 text-slate-400 hover:text-black' : 'hover:bg-white/10 text-neutral-400 hover:text-white'"
            title="Simge Durumuna Küçült"
          >
            <ChevronDown class="w-3 h-3" />
          </button>
        </div>
      </div>

      <!-- Kamera Viewfinder (Vizör) Çerçevesi İçinde QR Kod -->
      <div 
        @click="showShareModal = true"
        class="relative p-1.5 bg-black/40 rounded-2xl cursor-pointer group-hover:scale-[1.02] transition-transform duration-300 w-full flex items-center justify-center border border-white/5"
        title="Büyütmek ve paylaşım seçeneklerini görmek için tıkla"
      >
        <!-- 4 Köşe Neon Vizör İşareti (HUD Viewfinder Brackets) -->
        <div class="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#FFFF00] rounded-tl-sm pointer-events-none"></div>
        <div class="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#FFFF00] rounded-tr-sm pointer-events-none"></div>
        <div class="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#FFFF00] rounded-bl-sm pointer-events-none"></div>
        <div class="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#FFFF00] rounded-br-sm pointer-events-none"></div>

        <!-- Yüksek Kontrastlı QR Görseli -->
        <div class="w-24 h-24 sm:w-28 sm:h-28 bg-white p-1 rounded-xl shadow-inner flex items-center justify-center overflow-hidden">
          <img 
            v-if="qrCodeDataUrl" 
            :src="qrCodeDataUrl" 
            :alt="`${profile.name} QR Kodu`" 
            class="w-full h-full object-contain"
          />
          <div v-else class="text-[9px] text-slate-400 animate-pulse text-center">QR yükleniyor...</div>
        </div>
      </div>

      <!-- Kart Alt Barı: Canlı Bilgi & Hızlı Kopyala -->
      <div class="w-full mt-2.5 pt-2 border-t flex items-center justify-between gap-1 text-[10px]" :class="activeTheme.id === 'pure-light' ? 'border-slate-200' : 'border-white/10'">
        <div class="flex items-center gap-1 opacity-80" :class="activeTheme.id === 'pure-light' ? 'text-slate-600' : 'text-neutral-300'">
          <span class="relative flex h-1.5 w-1.5 shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span class="font-medium text-[9px] truncate">Kamerayla Tara</span>
        </div>

        <button 
          type="button"
          @click.stop="copyProfileLink"
          class="px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
          :class="isCopied 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : (activeTheme.id === 'pure-light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/10 hover:bg-[#FFFF00] hover:text-black text-white')"
          :title="isCopied ? 'Kopyalandı!' : 'Profili Kopyala'"
        >
          <Check v-if="isCopied" class="w-2.5 h-2.5" />
          <Copy v-else class="w-2.5 h-2.5" />
          <span>{{ isCopied ? 'Kopyalandı' : 'Kopyala' }}</span>
        </button>
      </div>
    </div>

    <!-- Küçültülmüş Durum: Kompakt Neon Hap Buton -->
    <button 
      v-else
      type="button"
      @click="isQrMinimized = false"
      :class="[
        'flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 border cursor-pointer group',
        activeTheme.id === 'pure-light' 
          ? 'bg-white text-slate-900 border-slate-300 shadow-xl shadow-slate-900/10 hover:border-yellow-400' 
          : 'bg-[#121212]/95 text-white border-[#282828] hover:border-[#FFFF00] shadow-black/90 ring-1 ring-[#FFFF00]/30 hover:ring-[#FFFF00]/60'
      ]"
      title="QR Kod Kartını Aç"
    >
      <Zap class="w-3.5 h-3.5 text-[#FFFF00] fill-[#FFFF00] group-hover:scale-110 transition-transform" />
      <span class="text-[11px] font-mono font-semibold">QR Kart</span>
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
    </button>
  </aside>

  <!-- PAYLAŞIM VE GERÇEK QR KOD MODALI (Mobil Uyumlu & Güvenilir Paylaşım Penceresi) -->
  <Teleport to="body">
    <div 
      v-if="showShareModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      @click.self="showShareModal = false"
    >
      <div class="w-full max-w-sm sm:max-w-md rounded-[28px] sm:rounded-3xl border border-[#282828] bg-[#161616] p-4 sm:p-6 shadow-2xl text-white animate-in zoom-in-95 duration-150 relative max-h-[92vh] overflow-y-auto">
        
        <!-- Üst Bar & Kapat -->
        <div class="flex items-center justify-between pb-3 mb-3.5 border-b border-[#282828]">
          <h3 class="text-sm font-bold flex items-center gap-2 text-white">
            <Share2 class="w-4 h-4 text-[#FFFF00]" />
            <span>Linkspace Profilini Paylaş</span>
          </h3>
          <button 
            type="button"
            @click="showShareModal = false"
            class="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Profil Özeti -->
        <div class="flex items-center gap-3 mb-3.5">
          <img 
            :src="profile.avatar" 
            alt="Avatar" 
            class="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#FFFF00] shadow-md shadow-yellow-500/20"
          />
          <div class="min-w-0 flex-1">
            <h4 class="text-sm font-bold text-white truncate">{{ profile.name }}</h4>
            <p class="text-xs text-[#FFFF00] font-mono truncate">
              linkspace/{{ displayUsername }}
            </p>
          </div>
        </div>

        <!-- Doğrudan Telefonda Paylaş Butonu (Web Share API) -->
        <button 
          v-if="canNativeShare"
          type="button"
          @click="handleNativeShare"
          class="w-full py-2.5 px-4 mb-3 rounded-xl bg-[#FFFF00] hover:bg-[#EEFF00] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-yellow-500/20 active:scale-95 transition-all"
        >
          <Share2 class="w-4 h-4 text-black" />
          <span>📲 Telefonda Paylaş (WhatsApp, Instagram...)</span>
        </button>

        <!-- Ağ Modu Seçici (Özel Domain / Wi-Fi / Bu Tarayıcı) -->
        <div class="flex p-1 mb-3 rounded-xl bg-[#101010] border border-[#282828] text-[11px] font-semibold gap-1">
          <button 
            v-if="seoSettings?.customDomain && seoSettings?.domainVerified"
            type="button"
            @click="networkMode = 'domain'"
            :class="[
              'flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5',
              networkMode === 'domain' 
                ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' 
                : 'text-[#8E8E93] hover:text-white'
            ]"
          >
            <Globe class="w-3.5 h-3.5" />
            <span class="truncate">{{ seoSettings.customDomain }}</span>
          </button>
          <button 
            type="button"
            @click="networkMode = 'wifi'"
            :class="[
              'flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5',
              networkMode === 'wifi' 
                ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' 
                : 'text-[#8E8E93] hover:text-white'
            ]"
          >
            <Wifi class="w-3.5 h-3.5" />
            <span>📱 Wi-Fi</span>
          </button>
          <button 
            type="button"
            @click="networkMode = 'current'"
            :class="[
              'flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5',
              networkMode === 'current' 
                ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' 
                : 'text-[#8E8E93] hover:text-white'
            ]"
          >
            <Smartphone class="w-3.5 h-3.5" />
            <span>💻 Bu Cihaz</span>
          </button>
        </div>

        <!-- IP / Host Düzenleme Alanı (Wi-Fi Modunda) -->
        <div v-if="networkMode === 'wifi'" class="mb-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <div class="flex items-center gap-1.5 min-w-0 flex-1">
            <span class="text-neutral-400 font-mono text-[11px]">Wi-Fi IP:</span>
            <input 
              v-if="isEditingCustomHost" 
              v-model="customHostInput" 
              @blur="saveCustomHost" 
              @keyup.enter="saveCustomHost"
              class="bg-[#101010] text-[#FFFF00] font-mono px-2 py-0.5 rounded border border-[#FFFF00] text-xs outline-none w-36"
              placeholder="192.168.1.26"
              autofocus
            />
            <span v-else class="text-[#FFFF00] font-mono font-bold truncate">{{ customHostInput }}</span>
          </div>
          <button 
            type="button" 
            @click="isEditingCustomHost = !isEditingCustomHost" 
            class="text-[11px] text-[#FFFF00] hover:underline flex items-center gap-1 ml-2 flex-shrink-0"
          >
            <Edit2 class="w-3 h-3" />
            <span>{{ isEditingCustomHost ? 'Kaydet' : 'Düzenle' }}</span>
          </button>
        </div>

        <!-- Gerçek Taranabilir QR Kod Kutusu -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-[#101010] border border-[#282828] flex flex-col items-center justify-center mb-3.5">
          <div class="w-38 h-38 sm:w-44 sm:h-44 bg-white p-2 sm:p-2.5 rounded-2xl shadow-inner border border-slate-200 flex items-center justify-center">
            <img 
              v-if="qrCodeDataUrl" 
              :src="qrCodeDataUrl" 
              alt="QR Kod" 
              class="w-full h-full object-contain"
            />
            <div v-else class="text-xs text-slate-500">QR Kod yükleniyor...</div>
          </div>
          <p class="text-xs mt-2.5 font-semibold text-white flex items-center gap-1.5">
            <QrCode class="w-3.5 h-3.5 text-[#FFFF00]" />
            <span>Kameranızı açarak QR kodu okutun</span>
          </p>
        </div>

        <!-- URL ve Kopyala Butonu -->
        <div class="flex items-center justify-between p-2 rounded-xl bg-[#101010] border border-[#282828] gap-2 mb-3">
          <span class="text-xs font-mono truncate px-1 text-[#CCCCCC]">
            {{ activeShareUrl }}
          </span>
          <button 
            type="button"
            @click="copyProfileLink"
            class="px-3.5 py-1.5 rounded-lg bg-[#FFFF00] hover:bg-[#EEFF00] text-black text-xs font-bold flex items-center gap-1 transition-colors flex-shrink-0 shadow-sm active:scale-95"
          >
            <Check v-if="isCopied" class="w-3.5 h-3.5 text-black" />
            <Copy v-else class="w-3.5 h-3.5 text-black" />
            <span>{{ isCopied ? 'Kopyalandı!' : 'Kopyala' }}</span>
          </button>
        </div>

        <!-- Mobilde Açılmıyorsa Yardım Kutusu -->
        <div v-if="networkMode === 'wifi'" class="p-3 rounded-2xl bg-white/5 border border-white/10 text-left text-[11px] space-y-1 text-neutral-300">
          <div class="font-bold text-[#FFFF00] flex items-center gap-1.5">
            <Wifi class="w-3.5 h-3.5 text-[#FFFF00]" />
            <span>Mobilde Sayfa Açılmıyorsa:</span>
          </div>
          <p class="leading-relaxed">
            1. Telefonunuzun bilgisayarla <b>aynı Wi-Fi</b> ağına bağlı olduğundan emin olun (Mobil verideyseniz Wi-Fi'a bağlanın).
          </p>
          <p class="leading-relaxed">
            2. Windows Güvenlik Duvarı bu ağı <i>"Ortak Ağ" (Public)</i> olarak görüyorsa bağlantıyı engelleyebilir. <b>Windows Ayarları > Ağ > Wi-Fi</b> kısmından ağı <b>Özel Ağ (Private)</b> olarak değiştirin.
          </p>
        </div>

      </div>
    </div>
  </Teleport>

  <!-- ZİYARETÇİ PROFİL TEMASI SEÇİM MODALI -->
  <Teleport to="body">
    <div 
      v-if="showThemeModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      @click.self="showThemeModal = false"
      @keydown.esc="showThemeModal = false"
    >
      <div 
        :class="[
          'relative w-full max-w-lg rounded-3xl border p-6 animate-in zoom-in-95 duration-150 transition-colors shadow-2xl max-h-[90vh] overflow-y-auto',
          activeTheme.id === 'pure-light'
            ? 'bg-white text-slate-900 border-slate-200'
            : 'bg-[#161616] text-white border-[#282828] shadow-black'
        ]"
      >
        <!-- Başlık ve Kapat Butonu -->
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-[#FFFF00]/15 border border-[#FFFF00]/30 text-[#FFFF00]">
              <Palette class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-base font-bold">Ziyaretçi Profil Teması</h3>
              <p class="text-xs text-neutral-400">Sayfa atmosferini istediğiniz renk paletine anında dönüştürün</p>
            </div>
          </div>
          <button 
            type="button" 
            @click="showThemeModal = false"
            class="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Tema Seçenekleri Listesi -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
          <div 
            v-for="theme in linkStore.THEMES" 
            :key="theme.id"
            @click="handleSelectVisitorTheme(theme.id)"
            class="p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between"
            :class="currentTheme === theme.id
              ? (activeTheme.id === 'pure-light' ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-400/50 shadow-md' : 'bg-[#222] border-[#FFFF00] ring-1 ring-[#FFFF00] shadow-lg shadow-yellow-500/10')
              : (activeTheme.id === 'pure-light' ? 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100' : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10')"
          >
            <!-- Canlı Gradyan Önizlemesi -->
            <div 
              class="w-full h-12 rounded-xl mb-2.5 p-2 flex items-center justify-between bg-gradient-to-r shadow-inner border border-white/10" 
              :class="theme.previewGradient"
            >
              <div class="w-5 h-5 rounded-full bg-black/20 backdrop-blur-sm border border-white/20"></div>
              <div class="w-10 h-3 rounded bg-black/20 backdrop-blur-sm"></div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <h4 class="text-xs font-bold" :class="activeTheme.id === 'pure-light' ? 'text-slate-900' : 'text-white'">{{ theme.name }}</h4>
                <Check v-if="currentTheme === theme.id" class="w-3.5 h-3.5" :class="activeTheme.id === 'pure-light' ? 'text-yellow-700' : 'text-[#FFFF00]'" />
              </div>
              <p class="text-[11px] leading-snug line-clamp-2" :class="activeTheme.id === 'pure-light' ? 'text-slate-500' : 'text-neutral-400'">
                {{ theme.description }}
              </p>
            </div>

            <button 
              type="button"
              @click.stop="handleSelectVisitorTheme(theme.id)"
              class="mt-3 w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              :class="currentTheme === theme.id
                ? 'bg-[#FFFF00] text-black shadow-xs'
                : (activeTheme.id === 'pure-light' ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-black' : 'bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white')"
            >
              <span>{{ currentTheme === theme.id ? 'Seçili Tema' : 'Bu Temayı Dene' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- İLETİŞİM & MESAJ BIRAKMA MODALI (Contact / Lead Modal) -->
  <Teleport to="body">
    <div 
      v-if="showContactModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80 animate-in fade-in duration-150"
      @click.self="closeContactModal"
      @keydown.esc="closeContactModal"
    >
      <div 
        class="relative w-full max-w-lg rounded-3xl border p-6 sm:p-7 shadow-2xl transition-all max-h-[92vh] overflow-y-auto"
        :class="activeTheme.id === 'pure-light'
          ? 'bg-white border-slate-200 text-slate-900 shadow-xl'
          : 'bg-[#161616] border-[#282828] text-white shadow-2xl shadow-black/90'"
      >
        <!-- Modal Başlığı -->
        <div 
          class="flex items-center justify-between pb-4 mb-5 border-b"
          :class="activeTheme.id === 'pure-light' ? 'border-slate-100' : 'border-white/10'"
        >
          <div class="flex items-center gap-3">
            <div 
              class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0"
              :class="activeTheme.id === 'pure-light' ? 'bg-[#FFFF00] text-black font-bold' : 'bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/30'"
            >
              <Mail class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold">Bana Mesaj Gönderin</h3>
              <p class="text-xs" :class="activeTheme.id === 'pure-light' ? 'text-slate-500' : 'text-neutral-400'">
                İş birliği, staj veya soru sormak için formu doldurabilirsiniz
              </p>
            </div>
          </div>
          <button 
            type="button" 
            @click="closeContactModal"
            class="p-2 rounded-xl transition-colors cursor-pointer"
            :class="activeTheme.id === 'pure-light' ? 'hover:bg-slate-100 text-slate-400 hover:text-black' : 'hover:bg-white/10 text-neutral-400 hover:text-white'"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Başarı Ekranı (Mesaj İletildiğinde) -->
        <div v-if="contactSubmittedSuccess" class="py-8 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 class="w-8 h-8" />
          </div>
          <div class="space-y-1">
            <h4 class="text-lg font-bold" :class="activeTheme.id === 'pure-light' ? 'text-slate-900' : 'text-white'">
              Mesajınız Başarıyla İletildi!
            </h4>
            <p class="text-xs max-w-sm mx-auto leading-relaxed" :class="activeTheme.id === 'pure-light' ? 'text-slate-600' : 'text-neutral-300'">
              Göstermiş olduğunuz ilgi için teşekkürler. En kısa sürede e-posta adresiniz üzerinden sizinle iletişime geçeceğim.
            </p>
          </div>
          <button 
            type="button"
            @click="closeContactModal"
            class="mt-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md bg-[#FFFF00] text-black font-extrabold shadow-yellow-500/20"
          >
            Tamam, Kapat
          </button>
        </div>

        <!-- İletişim Formu -->
        <form v-else @submit.prevent="handleSendContactMessage" class="space-y-4">
          <!-- Hata Uyarısı -->
          <div v-if="contactError" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-medium flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
            <span>{{ contactError }}</span>
          </div>

          <!-- Ad Soyad -->
          <div>
            <label class="block text-xs font-semibold mb-1.5" :class="activeTheme.id === 'pure-light' ? 'text-slate-700' : 'text-neutral-300'">
              Adınız ve Soyadınız *
            </label>
            <input 
              v-model="contactForm.name"
              type="text"
              required
              maxlength="100"
              placeholder="Örn: Ahmet Yılmaz"
              class="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition-all focus:outline-none"
              :class="activeTheme.id === 'pure-light'
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-yellow-500 focus:bg-white'
                : 'bg-[#101010] border-[#2c2c2c] text-white placeholder-[#666] focus:border-[#FFFF00] focus:ring-1 focus:ring-[#FFFF00]/30'"
            />
          </div>

          <!-- E-posta -->
          <div>
            <label class="block text-xs font-semibold mb-1.5" :class="activeTheme.id === 'pure-light' ? 'text-slate-700' : 'text-neutral-300'">
              E-posta Adresiniz *
            </label>
            <input 
              v-model="contactForm.email"
              type="email"
              required
              maxlength="255"
              placeholder="Örn: ahmet@sirket.com"
              class="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition-all focus:outline-none"
              :class="activeTheme.id === 'pure-light'
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-yellow-500 focus:bg-white'
                : 'bg-[#101010] border-[#2c2c2c] text-white placeholder-[#666] focus:border-[#FFFF00] focus:ring-1 focus:ring-[#FFFF00]/30'"
            />
          </div>

          <!-- Mesaj -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-semibold" :class="activeTheme.id === 'pure-light' ? 'text-slate-700' : 'text-neutral-300'">
                Mesajınız *
              </label>
              <span class="text-[10px]" :class="activeTheme.id === 'pure-light' ? 'text-slate-400' : 'text-neutral-500'">
                {{ contactForm.message.length }} / 2000
              </span>
            </div>
            <textarea 
              v-model="contactForm.message"
              rows="4"
              required
              maxlength="2000"
              placeholder="Proje detayı, staj teklifi veya soru belirtin..."
              class="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition-all focus:outline-none resize-none"
              :class="activeTheme.id === 'pure-light'
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-yellow-500 focus:bg-white'
                : 'bg-[#101010] border-[#2c2c2c] text-white placeholder-[#666] focus:border-[#FFFF00] focus:ring-1 focus:ring-[#FFFF00]/30'"
            ></textarea>
          </div>

          <!-- Aksiyon Butonları -->
          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button 
              type="button"
              @click="closeContactModal"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              :class="activeTheme.id === 'pure-light' ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-white/5'"
            >
              Vazgeç
            </button>
            <button 
              type="submit"
              :disabled="isSubmittingContact"
              class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md disabled:opacity-50"
              :class="activeTheme.id === 'pure-light'
                ? 'bg-[#FFFF00] hover:bg-[#EEFF00] text-black font-extrabold shadow-yellow-500/20'
                : 'bg-[#FFFF00] hover:bg-[#EEFF00] text-black font-extrabold shadow-yellow-500/30'"
            >
              <div v-if="isSubmittingContact" class="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <Send v-else class="w-3.5 h-3.5 text-black" />
              <span>{{ isSubmittingContact ? 'Gönderiliyor...' : 'Mesajı Gönder' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>

  <!-- Kilitli Link Şifre / 18+ Doğrulama Modalı -->
  <Teleport to="body">
    <div 
      v-if="unlockModal.isOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      @click.self="closeUnlockModal"
    >
      <div 
        :class="[
          'w-full max-w-sm rounded-3xl p-6 sm:p-7 shadow-2xl border transition-all animate-scale-up relative overflow-hidden',
          activeTheme.id === 'pure-light'
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20'
            : 'bg-[#141414] border-[#282828] text-white shadow-2xl shadow-black'
        ]"
      >
        <!-- Üst Işık Efekti -->
        <div class="pointer-events-none absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-yellow-500/20 to-transparent blur-2xl rounded-full"></div>

        <!-- Kapat Butonu -->
        <button 
          type="button" 
          @click="closeUnlockModal"
          :class="[
            'absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer',
            activeTheme.id === 'pure-light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-neutral-400'
          ]"
        >
          <X class="w-4 h-4" />
        </button>

        <!-- İkon ve Başlık -->
        <div class="flex flex-col items-center text-center mb-5">
          <div 
            :class="[
              'w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg',
              unlockModal.link?.lockType === 'age'
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-500'
                : (activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00]' : 'bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/30')
            ]"
          >
            <ShieldAlert v-if="unlockModal.link?.lockType === 'age'" class="w-7 h-7 stroke-[2.2]" />
            <Lock v-else class="w-7 h-7 stroke-[2.2]" />
          </div>

          <h3 class="text-lg font-black tracking-tight">
            {{ unlockModal.link?.lockType === 'age' ? '18+ Yaş Doğrulaması' : 'PIN Korumalı Bağlantı' }}
          </h3>
          <p class="text-xs font-semibold mt-1" :class="activeTheme.id === 'pure-light' ? 'text-slate-700' : 'text-neutral-300'">
            "{{ unlockModal.link?.title }}"
          </p>
          <p 
            class="text-[11px] mt-2 px-3 py-1.5 rounded-xl leading-relaxed"
            :class="activeTheme.id === 'pure-light' ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-neutral-400 border border-white/5'"
          >
            {{ unlockModal.link?.lockWarning || (unlockModal.link?.lockType === 'age' ? 'Bu içerik yetişkinlere uygun veya hassas öğeler içerebilir. Devam etmek için 18 yaşından büyük olduğunuzu onaylayın.' : 'Bu bağlantının içeriğine erişmek için PIN şifresini girmeniz gerekmektedir.') }}
          </p>
        </div>

        <!-- PIN Kodu Doğrulama Formu -->
        <form 
          v-if="unlockModal.link?.lockType === 'pin'" 
          @submit.prevent="verifyPinUnlock" 
          class="space-y-4"
        >
          <div>
            <label class="block text-xs font-bold mb-1.5" :class="activeTheme.id === 'pure-light' ? 'text-slate-700' : 'text-neutral-300'">
              PIN Şifresi
            </label>
            <div class="relative">
              <Key class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                v-model="unlockModal.pinInput"
                type="password"
                maxlength="20"
                autofocus
                required
                placeholder="••••"
                :class="[
                  'w-full pl-10 pr-4 py-3 rounded-xl text-center text-lg tracking-widest font-mono font-bold border transition-all focus:outline-none',
                  activeTheme.id === 'pure-light'
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-yellow-600 focus:bg-white'
                    : 'bg-[#181818] border-[#333] text-white focus:border-[#FFFF00] focus:ring-1 focus:ring-[#FFFF00]/40'
                ]"
              />
            </div>
            <div v-if="unlockModal.errorMessage" class="text-rose-400 text-xs mt-2 text-center font-medium flex items-center justify-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>{{ unlockModal.errorMessage }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <button 
              type="button" 
              @click="closeUnlockModal"
              class="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              :class="activeTheme.id === 'pure-light' ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-white/5'"
            >
              Vazgeç
            </button>
            <button 
              type="submit"
              class="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-yellow-500/20"
            >
              <Unlock class="w-3.5 h-3.5" />
              <span>Kilidi Aç</span>
            </button>
          </div>
        </form>

        <!-- 18+ Yaş Doğrulama Seçenekleri -->
        <div v-else class="space-y-3 pt-1">
          <button 
            type="button"
            @click="confirmAgeUnlock"
            class="w-full py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-lg bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-yellow-500/20"
          >
            <Check class="w-4 h-4 stroke-[3]" />
            <span>18 Yaşından Büyüğüm, Devam Et</span>
          </button>
          <button 
            type="button"
            @click="closeUnlockModal"
            class="w-full py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            :class="activeTheme.id === 'pure-light' ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-white/5'"
          >
            Vazgeç ve Geri Dön
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
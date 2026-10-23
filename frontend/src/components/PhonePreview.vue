<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { 
  useLinkStore, 
  AVAILABLE_ICONS, 
  BUTTON_STYLES, 
  BADGE_COLOR_STYLES,
  AVATAR_SHAPES,
  AVATAR_GLOW_STYLES,
  STATUS_PRESETS,
  getScheduleStatus,
  detectEmbed,
  getEmbedUrl
} from '../stores/linkStore'
import { 
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
  BookOpen, 
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Wifi,
  Battery,
  Signal,
  Share2,
  MapPin,
  Briefcase,
  Heart,
  Coffee,
  Star,
  Flame,
  Zap,
  Award,
  Terminal,
  ArrowUpRight,
  ArrowRight,
  Folder,
  FolderOpen,
  ChevronDown,
  Play,
  Radio,
  Lock,
  Unlock,
  Key,
  ShieldAlert,
  X,
  Check
} from 'lucide-vue-next'

const linkStore = useLinkStore()
const { profile, links, activeTheme } = storeToRefs(linkStore)

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

// Akordeon Klasörleri & Gruplama (Faz 19 - Telefon Mockup)
const expandedFolders = ref({})

const toggleFolder = (category) => {
  expandedFolders.value[category] = !isFolderOpen(category)
}

const isFolderOpen = (category) => {
  if (expandedFolders.value[category] === undefined) return true
  return expandedFolders.value[category] === true
}

const groupedActiveLinks = computed(() => {
  const items = []
  const folderMap = new Map()

  for (const link of activeLinks.value) {
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

// Canlı Embed Oynatıcıları ve Kilit Durumları (Önizleme)
const expandedEmbeds = ref({})
const unlockedLinks = ref({})
const unlockModal = ref({
  isOpen: false,
  link: null,
  pinInput: '',
  errorMessage: '',
  pendingAction: 'open'
})

const isLinkLocked = (link) => {
  return !!(link && link.isLocked && !unlockedLinks.value[link.id])
}

const toggleEmbed = (link) => {
  if (!link) return
  if (isLinkLocked(link)) {
    promptUnlock(link, 'toggleEmbed')
    return
  }
  expandedEmbeds.value[link.id] = !expandedEmbeds.value[link.id]
}

const handleLinkAction = (link) => {
  if (!link) return
  if (isLinkLocked(link)) {
    promptUnlock(link, link.showEmbed ? 'toggleEmbed' : 'open')
    return
  }

  if (link.showEmbed && link.embedType && link.embedType !== 'none') {
    toggleEmbed(link)
  } else {
    const rawUrl = (link.url || '').trim()
    if (rawUrl) {
      const targetUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('mailto:'))
        ? rawUrl
        : `https://${rawUrl}`
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }
  }
}

const promptUnlock = (link, action = 'open') => {
  unlockModal.value = {
    isOpen: true,
    link,
    pinInput: '',
    errorMessage: '',
    pendingAction: action
  }
}

const closeUnlockModal = () => {
  unlockModal.value.isOpen = false
  unlockModal.value.link = null
  unlockModal.value.pinInput = ''
  unlockModal.value.errorMessage = ''
}

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
      const rawUrl = (targetLink.url || '').trim()
      if (rawUrl) {
        const targetUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('mailto:'))
          ? rawUrl
          : `https://${rawUrl}`
        window.open(targetUrl, '_blank', 'noopener,noreferrer')
      }
    }
  } else {
    modal.errorMessage = 'Hatalı PIN'
  }
}

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
    const rawUrl = (targetLink.url || '').trim()
    if (rawUrl) {
      const targetUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('mailto:'))
        ? rawUrl
        : `https://${rawUrl}`
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }
  }
}

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

// İkon algılama ve çözümleme yardımcısı
const getLinkIcon = (link) => {
  if (link.icon && link.icon !== 'auto') {
    const found = AVAILABLE_ICONS.find(i => i.id === link.icon)
    if (found && ICON_COMPONENT_MAP[found.icon]) {
      return ICON_COMPONENT_MAP[found.icon]
    }
  }

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

// Hızlı Erişim Sosyal Medya Bağlantıları (Dolu ve aktif olanları filtrele)
const activeSocialLinks = computed(() => {
  const s = profile.value?.socialLinks || {}
  if (s.barVisible === false) return []
  const list = []
  if (s.github && s.githubActive !== false) list.push({ id: 'github', name: 'GitHub', url: s.github, icon: Github })
  if (s.linkedin && s.linkedinActive !== false) list.push({ id: 'linkedin', name: 'LinkedIn', url: s.linkedin, icon: Linkedin })
  if (s.instagram && s.instagramActive !== false) list.push({ id: 'instagram', name: 'Instagram', url: s.instagram, icon: Instagram })
  if (s.twitter && s.twitterActive !== false) list.push({ id: 'twitter', name: 'Twitter / X', url: s.twitter, icon: Twitter })
  if (s.youtube && s.youtubeActive !== false) list.push({ id: 'youtube', name: 'YouTube', url: s.youtube, icon: Youtube })
  if (s.email && s.emailActive !== false) {
    const mailUrl = s.email.startsWith('mailto:') ? s.email : `mailto:${s.email}`
    list.push({ id: 'email', name: 'E-Posta', url: mailUrl, icon: Mail })
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

// Profil Kapağı (Banner) Kontrolleri
const hasBanner = computed(() => {
  return !!profile.value?.banner || (profile.value?.bannerPattern && profile.value?.bannerPattern !== 'none')
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
  const color = profile.value?.statusColor || 'emerald'
  if (color === 'none') return null
  return STATUS_PRESETS.find(s => s.id === color) || STATUS_PRESETS[0]
})
</script>

<template>
  <div class="relative mx-auto select-none">
    
    <!-- Dış Akıllı Telefon Kasası (Dribbble Sales Team CRM Titanium Bezel) -->
    <div 
      class="relative w-[300px] h-[610px] rounded-[50px] p-[10px] bg-[#0C0C0B] border-[6px] border-[#242424] shadow-2xl shadow-black ring-1 ring-[#FFFF00]/15 flex flex-col"
    >
      <!-- Yan Buton Detayları (Ses & Güç Çıkıntıları) -->
      <div class="absolute -left-[9px] top-[105px] w-[3px] h-[26px] bg-[#333333] rounded-l-sm"></div>
      <div class="absolute -left-[9px] top-[140px] w-[3px] h-[45px] bg-[#333333] rounded-l-sm"></div>
      <div class="absolute -left-[9px] top-[195px] w-[3px] h-[45px] bg-[#333333] rounded-l-sm"></div>
      <div class="absolute -right-[9px] top-[150px] w-[3px] h-[60px] bg-[#333333] rounded-r-sm"></div>

      <!-- Telefon İç Ekranı (Viewport) -->
      <div 
        :class="[
          'relative w-full h-full rounded-[40px] overflow-hidden flex flex-col transition-colors duration-500 shadow-inner',
          activeTheme.backgroundClass,
          activeTheme.id === 'pure-light' ? 'text-slate-800' : 'text-white'
        ]"
      >
        <!-- iOS Durum Çubuğu (Status Bar) & Dynamic Island -->
        <div class="relative z-20 pt-3 px-5 pb-1 flex items-center justify-between text-[11px] font-semibold opacity-90 select-none">
          <span>09:41</span>
          
          <!-- Dynamic Island (Kamera & Sensör Hapı) -->
          <div class="w-[78px] h-[20px] bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-md">
            <div class="w-2 h-2 rounded-full bg-slate-900 border border-slate-800"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-yellow-950/80"></div>
          </div>

          <div class="flex items-center gap-1.5 opacity-80">
            <Signal class="w-3 h-3" />
            <Wifi class="w-3 h-3" />
            <Battery class="w-3.5 h-3.5" />
          </div>
        </div>

        <!-- Üst Minik Paylaşım Butonu -->
        <div class="px-4 py-1 flex justify-end">
          <div 
            :class="[
              'p-1.5 rounded-full backdrop-blur-md transition-all shadow-xs',
              activeTheme.id === 'pure-light' ? 'bg-[#FFFF00] text-black shadow-xs font-bold' : 'bg-white/10 border border-white/10 text-white opacity-70'
            ]"
          >
            <Share2 class="w-3 h-3" />
          </div>
        </div>

        <!-- Kaydırılabilir Profil İçeriği -->
        <div class="flex-1 overflow-y-auto px-4 pb-6 pt-1 space-y-4 no-scrollbar">
          
          <!-- Profil Başlığı & Banner & Avatar -->
          <div class="flex flex-col items-center text-center">
            
            <!-- Profil Kapağı (Banner) -->
            <div 
              v-if="hasBanner"
              class="relative w-full h-[76px] rounded-2xl overflow-hidden border border-white/10 shadow-md mb-[-36px] transition-all"
              :class="bannerPatternClass"
            >
              <img 
                v-if="profile.banner" 
                :src="profile.banner" 
                alt="Kapak Görseli" 
                class="w-full h-full object-cover" 
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>
            </div>

            <!-- Avatar -->
            <div class="relative group mb-2 z-10">
              <div 
                v-if="profile.avatarGlow !== 'none'"
                :class="[
                  'absolute -inset-1 bg-gradient-to-r blur-xs opacity-80',
                  avatarShapeClass,
                  avatarGlowConfig.glowGradient
                ]"
              ></div>
              <img 
                :src="profile.avatar" 
                :alt="profile.name" 
                class="relative w-16 h-16 object-cover border-2 shadow-lg ring-2 ring-black/40 transition-all"
                :class="[
                  avatarShapeClass,
                  profile.avatarGlow !== 'none' ? avatarGlowConfig.borderClass : (activeTheme.id === 'pure-light' ? 'border-yellow-500/40' : 'border-[#FFFF00]/50')
                ]"
              />
            </div>

            <!-- Canlı Müsaitlik / Durum Rozeti -->
            <div 
              v-if="statusConfig && profile.statusText"
              :class="[
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-semibold border shadow-2xs mb-1.5 backdrop-blur-xs select-none max-w-[220px]',
                statusConfig.badgeClass
              ]"
            >
              <span class="relative flex h-1.5 w-1.5 shrink-0">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="statusConfig.pingClass"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5" :class="statusConfig.dotClass"></span>
              </span>
              <span class="truncate">{{ profile.statusText }}</span>
            </div>

            <h3 :class="['text-sm font-bold tracking-tight truncate max-w-[200px] flex items-center justify-center gap-1', activeTheme.id === 'pure-light' ? 'text-slate-900' : 'text-white']">
              <span>{{ profile.name }}</span>
              <CheckCircle2 v-if="profile.isVerified !== false" class="w-3.5 h-3.5 text-[#FFFF00] shrink-0 fill-[#FFFF00]/10" />
            </h3>
            <p :class="['text-[10px] font-semibold tracking-wide mb-1.5', activeTheme.accentText]">
              {{ profile.username }}
            </p>
            <p :class="['text-[11px] leading-snug line-clamp-2 max-w-[210px] font-light', activeTheme.id === 'pure-light' ? 'text-slate-600' : 'text-slate-300']">
              {{ profile.bio }}
            </p>

            <!-- Dinamik Rozetler & Beceriler (Phone Mockup) -->
            <div 
              v-if="profile.badges && profile.badges.length > 0"
              class="flex items-center justify-center flex-wrap gap-1 mt-2 max-w-[230px]"
            >
              <span 
                v-for="badge in profile.badges" 
                :key="badge.id"
                :class="[
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8.5px] font-medium border shadow-2xs',
                  getBadgeClass(badge)
                ]"
              >
                <component :is="getBadgeIcon(badge.icon)" class="w-2.5 h-2.5 shrink-0" :class="getBadgeIconColor(badge)" />
                <span class="truncate max-w-[70px]">{{ badge.text }}</span>
              </span>
            </div>

            <!-- Hızlı Sosyal Medya İkon Barı -->
            <div 
              v-if="activeSocialLinks.length > 0" 
              :class="[
                'flex items-center justify-center flex-wrap gap-1.5 mt-2.5 py-1 px-2.5 border backdrop-blur-sm transition-all',
                socialShapeClass,
                activeTheme.id === 'pure-light' ? 'bg-white/80 border-slate-200' : 'bg-[#161616]/80 border-[#262626]'
              ]"
            >
              <div 
                v-for="social in activeSocialLinks" 
                :key="social.id" 
                :class="[
                  'p-1.5 transition-all shadow-xs flex items-center justify-center',
                  socialShapeClass,
                  socialStyleClass
                ]"
              >
                <component :is="social.icon" class="w-3 h-3" />
              </div>
            </div>
          </div>

          <!-- Canlı Bağlantılar ve Klasörler Listesi -->
          <div class="space-y-2 pt-1">
            <template v-for="item in groupedActiveLinks" :key="item.id">
              
              <!-- A: Bağımsız Bağlantı -->
              <div v-if="item.type === 'link'" class="w-full">
                <div 
                  @click="handleLinkAction(item.link)"
                  :class="[
                    'flex items-center justify-between w-full transition-all text-left shadow-xs cursor-pointer select-none',
                    activeTheme.id === 'pure-light'
                      ? 'p-2 rounded-full bg-[#FFFF00] text-black shadow-sm shadow-yellow-500/20 border border-yellow-300/50'
                      : 'p-2.5 rounded-xl border backdrop-blur-md hover:border-l-2 hover:border-l-[#FFFF00]',
                    activeTheme.id !== 'pure-light' ? getLinkCardClass(item.link) : (item.link.customColor && item.link.customColor !== 'default' ? getLinkCardClass(item.link) : '')
                  ]"
                >
                  <div class="flex items-center gap-2 min-w-0 pr-1">
                    <div 
                      :class="[
                        'flex-shrink-0 flex items-center justify-center transition-all',
                        activeTheme.id === 'pure-light' 
                          ? 'w-7 h-7 rounded-full bg-black text-[#FFFF00] shadow-xs' 
                          : 'p-1.5 rounded-lg border bg-[#FFFF00]/10 border-[#FFFF00]/20 text-[#FFFF00]'
                      ]"
                    >
                      <component 
                        :is="getLinkIcon(item.link)" 
                        :class="['w-3.5 h-3.5', activeTheme.id === 'pure-light' ? 'text-[#FFFF00]' : getLinkAccentText(item.link)]" 
                      />
                    </div>
                    <div class="truncate min-w-0">
                      <div class="flex items-center gap-1 flex-wrap">
                        <span :class="['font-bold text-xs truncate block', activeTheme.id === 'pure-light' ? 'text-black' : 'text-slate-100']">
                          {{ item.link.title }}
                        </span>
                        <!-- Kilit Rozeti -->
                        <span 
                          v-if="isLinkLocked(item.link)"
                          class="px-1.5 py-0.2 rounded-full text-[8px] font-extrabold border"
                          :class="item.link.lockType === 'age'
                            ? (activeTheme.id === 'pure-light' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/40')
                            : (activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] border-black/20' : 'bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30')"
                        >
                          {{ item.link.lockType === 'age' ? '18+' : 'PIN' }}
                        </span>
                        <!-- Embed Rozeti -->
                        <span 
                          v-else-if="item.link.showEmbed && item.link.embedType && item.link.embedType !== 'none'"
                          class="px-1.5 py-0.2 rounded-full text-[8px] font-bold border"
                          :class="activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] border-black/20' : 'bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30'"
                        >
                          ▶ {{ item.link.embedType }}
                        </span>
                      </div>
                      <span 
                        v-if="item.link.isScheduled && item.link.showCountdown && getScheduleStatus(item.link).badgeText"
                        class="text-[9px] font-extrabold truncate block"
                        :class="activeTheme.id === 'pure-light' ? 'text-neutral-900 font-black' : 'text-amber-400'"
                      >
                        {{ getScheduleStatus(item.link).badgeText }}
                      </span>
                    </div>
                  </div>
                  <div :class="['flex items-center justify-center shrink-0', activeTheme.id === 'pure-light' ? 'w-5 h-5 rounded-full bg-black text-[#FFFF00]' : '']">
                    <Lock v-if="isLinkLocked(item.link)" class="w-2.5 h-2.5 stroke-[2.2]" />
                    <Play v-else-if="item.link.showEmbed && item.link.embedType && item.link.embedType !== 'none'" class="w-2.5 h-2.5 fill-current" />
                    <ArrowUpRight v-else-if="activeTheme.id === 'pure-light'" class="w-2.5 h-2.5 text-[#FFFF00]" />
                    <ExternalLink v-else :class="['w-3 h-3 opacity-60 text-[#FFFF00]']" />
                  </div>
                </div>

                <!-- Mini Embed Oynatıcı (Mockup içi) -->
                <div 
                  v-if="expandedEmbeds[item.link.id] && item.link.showEmbed && getEmbedUrl(item.link)"
                  class="mt-1 p-2 rounded-xl border bg-black/90 border-[#333] text-white shadow-lg space-y-1"
                >
                  <div class="flex items-center justify-between text-[10px]">
                    <span class="font-bold flex items-center gap-1 text-[#FFFF00]">
                      <Radio class="w-2.5 h-2.5 animate-pulse" />
                      {{ item.link.embedType }}
                    </span>
                    <button type="button" @click.stop="expandedEmbeds[item.link.id] = false" class="text-neutral-400 hover:text-white p-0.5">
                      <X class="w-3 h-3" />
                    </button>
                  </div>
                  <div v-if="item.link.embedType === 'youtube'" class="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                    <iframe :src="getEmbedUrl(item.link)" class="w-full h-full border-0" allow="autoplay; picture-in-picture" allowfullscreen></iframe>
                  </div>
                  <div v-else-if="item.link.embedType === 'spotify'" class="w-full h-[80px] rounded-lg overflow-hidden bg-black">
                    <iframe :src="getEmbedUrl(item.link)" class="w-full h-full border-0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
                  </div>
                  <div v-else-if="item.link.embedType === 'soundcloud'" class="w-full h-[100px] rounded-lg overflow-hidden bg-black">
                    <iframe :src="getEmbedUrl(item.link)" class="w-full h-full border-0" scrolling="no"></iframe>
                  </div>
                </div>
              </div>

              <!-- B: Akordeon Klasör Kartı -->
              <div v-else-if="item.type === 'folder'" class="w-full space-y-1.5">
                <!-- Klasör Başlığı -->
                <div 
                  @click="toggleFolder(item.category)"
                  :class="[
                    'flex items-center justify-between w-full p-2 rounded-xl border transition-all text-left cursor-pointer select-none shadow-2xs',
                    activeTheme.id === 'pure-light'
                      ? (isFolderOpen(item.category) ? 'bg-amber-100/90 border-amber-300 text-black' : 'bg-slate-100/90 border-slate-200 text-slate-800')
                      : (isFolderOpen(item.category) ? 'bg-[#1c1c1a] border-[#FFFF00]/30 text-white' : 'bg-[#161616] border-[#262626] text-slate-200')
                  ]"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <div 
                      :class="[
                        'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
                        activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00]' : 'bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/25'
                      ]"
                    >
                      <FolderOpen v-if="isFolderOpen(item.category)" class="w-3.5 h-3.5" />
                      <Folder v-else class="w-3.5 h-3.5" />
                    </div>
                    <div class="truncate">
                      <div class="font-bold text-[11px] truncate">{{ item.category }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span 
                      class="text-[9px] font-bold px-1.5 py-0.2 rounded-full border"
                      :class="activeTheme.id === 'pure-light' ? 'bg-black/10 border-black/15 text-black' : 'bg-white/5 border-white/10 text-neutral-300'"
                    >
                      {{ item.links.length }}
                    </span>
                    <ChevronDown 
                      class="w-3 h-3 transition-transform duration-200" 
                      :class="isFolderOpen(item.category) ? 'rotate-180' : 'rotate-0'"
                    />
                  </div>
                </div>

                <!-- Klasör İçindeki Bağlantılar -->
                <div 
                  v-show="isFolderOpen(item.category)"
                  class="pl-2 space-y-1.5 border-l border-dashed ml-1.5"
                  :class="activeTheme.id === 'pure-light' ? 'border-amber-400' : 'border-[#FFFF00]/30'"
                >
                  <div v-for="subLink in item.links" :key="subLink.id" class="w-full">
                    <div 
                      @click="handleLinkAction(subLink)"
                      :class="[
                        'flex items-center justify-between w-full transition-all text-left shadow-2xs cursor-pointer select-none',
                        activeTheme.id === 'pure-light'
                          ? 'p-1.5 px-2 rounded-full bg-[#FFFF00] text-black border border-yellow-300/50'
                          : 'p-2 rounded-lg border backdrop-blur-md',
                        activeTheme.id !== 'pure-light' ? getLinkCardClass(subLink) : (subLink.customColor && subLink.customColor !== 'default' ? getLinkCardClass(subLink) : '')
                      ]"
                    >
                      <div class="flex items-center gap-1.5 min-w-0 pr-1">
                        <div 
                          :class="[
                            'flex-shrink-0 flex items-center justify-center',
                            activeTheme.id === 'pure-light' ? 'w-5 h-5 rounded-full bg-black text-[#FFFF00]' : 'p-1 rounded bg-[#FFFF00]/10 text-[#FFFF00]'
                          ]"
                        >
                          <component :is="getLinkIcon(subLink)" class="w-3 h-3" />
                        </div>
                        <div class="truncate">
                          <div class="flex items-center gap-1 flex-wrap">
                            <span :class="['font-semibold text-[11px] truncate block', activeTheme.id === 'pure-light' ? 'text-black' : 'text-slate-100']">
                              {{ subLink.title }}
                            </span>
                            <span 
                              v-if="isLinkLocked(subLink)"
                              class="px-1 py-0.1 rounded-full text-[7px] font-extrabold border"
                              :class="subLink.lockType === 'age'
                                ? (activeTheme.id === 'pure-light' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/40')
                                : (activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] border-black/20' : 'bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30')"
                            >
                              {{ subLink.lockType === 'age' ? '18+' : 'PIN' }}
                            </span>
                            <span 
                              v-else-if="subLink.showEmbed && subLink.embedType && subLink.embedType !== 'none'"
                              class="px-1 py-0.1 rounded-full text-[7px] font-bold border"
                              :class="activeTheme.id === 'pure-light' ? 'bg-black text-[#FFFF00] border-black/20' : 'bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30'"
                            >
                              ▶
                            </span>
                          </div>
                        </div>
                      </div>
                      <Lock v-if="isLinkLocked(subLink)" class="w-2.5 h-2.5 shrink-0 stroke-[2.2]" :class="activeTheme.id === 'pure-light' ? 'text-black' : 'text-[#FFFF00]'" />
                      <Play v-else-if="subLink.showEmbed && subLink.embedType && subLink.embedType !== 'none'" class="w-2.5 h-2.5 shrink-0 fill-current" :class="activeTheme.id === 'pure-light' ? 'text-black' : 'text-[#FFFF00]'" />
                      <ArrowUpRight v-else-if="activeTheme.id === 'pure-light'" class="w-2.5 h-2.5 text-black shrink-0" />
                      <ExternalLink v-else class="w-2.5 h-2.5 opacity-60 text-[#FFFF00] shrink-0" />
                    </div>

                    <!-- Mini Embed Oynatıcı (Klasör içi Mockup) -->
                    <div 
                      v-if="expandedEmbeds[subLink.id] && subLink.showEmbed && getEmbedUrl(subLink)"
                      class="mt-1 p-2 rounded-xl border bg-black/90 border-[#333] text-white shadow-lg space-y-1"
                    >
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="font-bold flex items-center gap-1 text-[#FFFF00]">
                          <Radio class="w-2.5 h-2.5 animate-pulse" />
                          {{ subLink.embedType }}
                        </span>
                        <button type="button" @click.stop="expandedEmbeds[subLink.id] = false" class="text-neutral-400 hover:text-white p-0.5">
                          <X class="w-3 h-3" />
                        </button>
                      </div>
                      <div v-if="subLink.embedType === 'youtube'" class="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                        <iframe :src="getEmbedUrl(subLink)" class="w-full h-full border-0" allow="autoplay; picture-in-picture" allowfullscreen></iframe>
                      </div>
                      <div v-else-if="subLink.embedType === 'spotify'" class="w-full h-[80px] rounded-lg overflow-hidden bg-black">
                        <iframe :src="getEmbedUrl(subLink)" class="w-full h-full border-0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
                      </div>
                      <div v-else-if="subLink.embedType === 'soundcloud'" class="w-full h-[100px] rounded-lg overflow-hidden bg-black">
                        <iframe :src="getEmbedUrl(subLink)" class="w-full h-full border-0" scrolling="no"></iframe>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </template>

            <!-- Boş Durum -->
            <div 
              v-if="activeLinks.length === 0" 
              :class="[
                'text-center py-6 px-3 rounded-xl border border-dashed text-[11px]',
                activeTheme.id === 'pure-light' ? 'bg-white/60 border-slate-300 text-slate-500' : 'bg-[#161616]/60 border-[#262626] text-slate-400'
              ]"
            >
              Henüz aktif bağlantı eklenmedi
            </div>

            <!-- Bana Ulaşın Mini Rozeti -->
            <div 
              class="w-full p-2 rounded-xl border flex items-center justify-between transition-colors shadow-2xs mt-2"
              :class="activeTheme.id === 'pure-light'
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#141414] border-[#242424] text-slate-300'"
            >
              <div class="flex items-center gap-2 truncate">
                <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" :class="activeTheme.id === 'pure-light' ? 'bg-[#FFFF00] text-black font-bold' : 'bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/30'">
                  <Mail class="w-3 h-3" />
                </div>
                <div class="text-left truncate">
                  <div class="text-[10px] font-bold truncate">Bana Mesaj Bırakın</div>
                  <div class="text-[8px] opacity-70 truncate">Hızlı iletişim & teklif</div>
                </div>
              </div>
              <ArrowRight class="w-3 h-3 opacity-60 shrink-0" />
            </div>
          </div>

          <!-- Alt Linktree Rozeti -->
          <div class="pt-4 text-center">
            <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-medium tracking-wider uppercase', activeTheme.id === 'pure-light' ? 'bg-white/80 border-slate-200 text-slate-500' : 'bg-[#161616]/80 border-[#262626] text-slate-400']">
              linkspace
            </span>
          </div>

        </div>

        <!-- iOS Home Bar Çizgisi -->
        <div class="w-full pb-2 flex justify-center">
          <div :class="['w-28 h-1 rounded-full', activeTheme.id === 'pure-light' ? 'bg-slate-400/50' : 'bg-white/30']"></div>
        </div>

        <!-- Mini Kilit Açma Modalı (Önizleme İçi) -->
        <div 
          v-if="unlockModal.isOpen"
          class="absolute inset-0 z-40 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3"
          @click.self="closeUnlockModal"
        >
          <div class="bg-[#141414] border border-[#2c2c2c] text-white rounded-2xl p-3.5 w-full max-w-[240px] text-center shadow-2xl relative">
            <button type="button" @click="closeUnlockModal" class="absolute top-2 right-2 text-neutral-400 hover:text-white p-1 cursor-pointer">
              <X class="w-3 h-3" />
            </button>
            <div class="w-8 h-8 rounded-xl bg-[#FFFF00]/15 text-[#FFFF00] flex items-center justify-center mx-auto mb-2 border border-[#FFFF00]/30">
              <ShieldAlert v-if="unlockModal.link?.lockType === 'age'" class="w-4 h-4" />
              <Lock v-else class="w-4 h-4" />
            </div>
            <div class="text-[11px] font-bold truncate mb-1">
              {{ unlockModal.link?.lockType === 'age' ? '18+ Yaş Onayı' : 'PIN Korumalı' }}
            </div>
            <div class="text-[9px] text-neutral-400 mb-2 leading-tight">
              {{ unlockModal.link?.lockWarning || (unlockModal.link?.lockType === 'age' ? '18 yaşından büyük olduğunuzu onaylayın.' : 'PIN kodunu girin.') }}
            </div>

            <!-- PIN Formu -->
            <form v-if="unlockModal.link?.lockType === 'pin'" @submit.prevent="verifyPinUnlock" class="space-y-2">
              <input 
                v-model="unlockModal.pinInput"
                type="password"
                maxlength="10"
                placeholder="PIN"
                class="w-full py-1.5 px-2 bg-black border border-[#333] rounded-lg text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-[#FFFF00]"
              />
              <div v-if="unlockModal.errorMessage" class="text-rose-400 text-[8px]">{{ unlockModal.errorMessage }}</div>
              <button type="submit" class="w-full py-1.5 bg-[#FFFF00] hover:bg-[#EEFF00] text-black font-extrabold text-[10px] rounded-lg shadow-xs cursor-pointer">
                Aç
              </button>
            </form>

            <!-- 18+ Formu -->
            <div v-else class="space-y-1.5">
              <button type="button" @click="confirmAgeUnlock" class="w-full py-1.5 bg-[#FFFF00] hover:bg-[#EEFF00] text-black font-extrabold text-[10px] rounded-lg shadow-xs cursor-pointer">
                18+ Onayla
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* Önizleme içindeki scrollbar'ı gizle */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

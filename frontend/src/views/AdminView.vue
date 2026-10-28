<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import QRCode from 'qrcode'
import { 
  useLinkStore, 
  AVAILABLE_ICONS, 
  BUTTON_STYLES, 
  PRESET_AVATARS, 
  BANNER_PATTERNS, 
  AVAILABLE_BADGE_ICONS, 
  BADGE_COLOR_STYLES,
  AVATAR_SHAPES,
  AVATAR_GLOW_STYLES,
  STATUS_PRESETS,
  SOCIAL_PLATFORMS,
  SOCIAL_SHAPES,
  SOCIAL_STYLES,
  getScheduleStatus,
  formatForDatetimeInput,
  AI_TONES,
  SUGGESTED_ROLES,
  SUGGESTED_SKILLS,
  DEFAULT_CATEGORIES,
  detectEmbed,
  getEmbedUrl
} from '../stores/linkStore'
import { useAuthStore } from '../stores/authStore'
import PhonePreview from '../components/PhonePreview.vue'
import { 
  Plus, 
  Trash2, 
  Clock,
  Timer, 
  Wand2,
  RefreshCw,
  ExternalLink, 
  Eye, 
  EyeOff, 
  Globe, 
  Github, 
  Linkedin, 
  Instagram, 
  Youtube, 
  Twitter, 
  ArrowLeft, 
  User, 
  Check, 
  Sparkles, 
  MousePointerClick, 
  TrendingUp, 
  BarChart3, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  Palette, 
  Pencil, 
  X, 
  LogOut, 
  Mail, 
  Phone, 
  Code, 
  Music, 
  ShoppingBag, 
  BookOpen, 
  Sun, 
  Moon, 
  GripVertical, 
  Copy, 
  Share2, 
  QrCode, 
  Smartphone, 
  Monitor,
  Users,
  Wifi, 
  KeyRound, 
  ShieldCheck, 
  Settings, 
  CheckCircle2, 
  Sliders, 
  Upload, 
  Image, 
  Camera, 
  Layers,
  MapPin,
  Briefcase,
  Heart,
  Coffee,
  Star,
  Flame,
  Zap,
  Award,
  Terminal,
  AlertCircle,
  MessageSquare,
  Inbox,
  MailCheck,
  MailOpen,
  Folder,
  FolderOpen,
  FolderPlus,
  Tag,
  Play,
  Lock,
  Unlock,
  Key,
  ShieldAlert,
  Radio,
  Split,
  GitFork,
  Laptop,
  Fingerprint,
  Lightbulb,
  Bot,
  Trophy,
  Compass
} from 'lucide-vue-next'


// Veri Taşınabilirliği (Data Portability: Export & Import) ve vCard
const isExporting = ref(false)
const isImporting = ref(false)
const importFileInput = ref(null)
const portabilityFeedback = ref('')
const portabilityError = ref('')

const handleExportBackup = async (format = 'json') => {
  isExporting.value = true
  portabilityFeedback.value = ''
  portabilityError.value = ''
  try {
    await linkStore.exportBackup(format)
    portabilityFeedback.value = `Yedekleme dosyası (${format.toUpperCase()}) başarıyla indirildi!`
    showToast('Yedek başarıyla dışa aktarıldı!')
  } catch (err) {
    portabilityError.value = 'Dışa aktarma sırasında bir hata oluştu.'
  } finally {
    isExporting.value = false
  }
}

const triggerImportFile = () => {
  if (importFileInput.value) {
    importFileInput.value.click()
  }
}

const handleFileImport = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  isImporting.value = true
  portabilityFeedback.value = ''
  portabilityError.value = ''

  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const res = await linkStore.importBackup(parsed)
    if (res.success) {
      portabilityFeedback.value = res.message || 'Yedekleme başarıyla geri yüklendi!'
      showToast('Veriler başarıyla geri yüklendi!')
    } else {
      portabilityError.value = res.error || 'Geri yükleme başarısız oldu.'
    }
  } catch (err) {
    portabilityError.value = 'Hatalı JSON dosyası! Lütfen geçerli bir Linkspace yedek dosyası seçin.'
  } finally {
    isImporting.value = false
    if (event.target) event.target.value = ''
  }
}

const handleAdminDownloadVCard = async () => {
  await linkStore.downloadVCard()
  showToast('vCard (.vcf) dijital kartvizit indirildi!')
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const linkStore = useLinkStore()
const { 
  profile, 
  links, 
  totalClicks, 
  activeCount, 
  topLink, 
  currentTheme, 
  activeTheme, 
  THEMES, 
  isBackendConnected,
  adminTheme,
  analytics,
  messages,
  unreadMessagesCount,
  seoSettings,
  allCategories,
  usedCategories,
  cacheStats
} = storeToRefs(linkStore)

// ---------------------------------------------------------
// 1. Web Share Target API Durumu
// ---------------------------------------------------------
const sharedTargetBanner = ref(null)

// ---------------------------------------------------------
// 2. Smart Insights (Kural Motoru) Durumu
// ---------------------------------------------------------
const smartInsights = ref([])
const isLoadingInsights = ref(false)

const loadSmartInsights = async () => {
  isLoadingInsights.value = true
  try {
    const res = await linkStore.fetchSmartInsights()
    smartInsights.value = Array.isArray(res) ? res : []
  } catch (err) {
    console.warn('Smart Insights yüklenemedi:', err)
  } finally {
    isLoadingInsights.value = false
  }
}

const applyInsightAction = async (insight) => {
  if (!insight) return

  if (insight.actionType === 'reorder_top' && insight.linkId) {
    const linkIdx = links.value.findIndex(l => l.id === insight.linkId)
    if (linkIdx > 0) {
      const updated = [...links.value]
      const [item] = updated.splice(linkIdx, 1)
      updated.unshift(item)
      await linkStore.reorderLinks(updated)
      showToast('⚡ Bağlantı ilk sıraya taşındı!')
    }
  } else if (insight.actionType === 'enable_ab_test' && insight.linkId) {
    const link = links.value.find(l => l.id === insight.linkId)
    if (link) {
      await linkStore.updateLink(link.id, {
        abTestEnabled: true,
        abTitleB: `${link.title} (Şimdi İncele)`,
        abUrlB: link.url
      })
      showToast('A/B Split Testi etkinleştirildi!')
    }
  } else if (insight.actionType === 'apply_winner' && insight.linkId) {
    const link = links.value.find(l => l.id === insight.linkId)
    if (link && link.abTitleB) {
      await linkStore.updateLink(link.id, {
        title: link.abTitleB,
        abTestEnabled: false
      })
      showToast('Kazanan varyant kalıcı hale getirildi!')
    }
  } else {
    showToast(`${insight.title} uygulandı!`)
  }

  smartInsights.value = smartInsights.value.filter(i => i.id !== insight.id)
}

// ---------------------------------------------------------
// 3. AI Copilot (Hedefe Özel Bio & Başlık Üretici) Durumu
// ---------------------------------------------------------
const copilotGoal = ref('')
const isGeneratingCopilot = ref(false)
const copilotData = ref(null)

const handleGenerateCopilot = async () => {
  if (!copilotGoal.value.trim() || isGeneratingCopilot.value) return
  isGeneratingCopilot.value = true

  try {
    const res = await linkStore.generateAiCopilot({
      goal: copilotGoal.value,
      role: profile.value?.title || '',
      currentBio: profile.value?.bio || ''
    })
    copilotData.value = res
    showToast('✨ AI Copilot önerileri hazırlandı!')
  } catch (err) {
    showToast('AI Copilot üretiminde bir hata oluştu.')
  } finally {
    isGeneratingCopilot.value = false
  }
}

const applyCopilotBio = async (bioText) => {
  if (!bioText) return
  profileForm.value.bio = bioText
  await linkStore.updateProfile({ bio: bioText })
  showToast('✨ AI Biyografisi profilinize uygulandı!')
}

const addCopilotLink = async (btn) => {
  if (!btn) return
  await linkStore.addLink(btn.title, btn.url || 'https://', btn.category || 'Öne Çıkanlar')
  showToast(`"${btn.title}" link ağacınıza eklendi!`)
}

// ---------------------------------------------------------
// 4. Biyometrik Passkeys (WebAuthn / FIDO2) Durumu
// ---------------------------------------------------------
const passkeyDeviceInput = ref('')
const isRegisteringPasskey = ref(false)

const handleRegisterPasskey = async () => {
  if (isRegisteringPasskey.value) return
  isRegisteringPasskey.value = true

  try {
    const result = await linkStore.registerPasskey(passkeyDeviceInput.value.trim())
    if (result.success) {
      passkeyDeviceInput.value = ''
      showToast('🎉 Biyometrik Passkey cihazınız başarıyla kaydedildi!')
    } else {
      showToast(result.error || 'Passkey kaydı tamamlanamadı.')
    }
  } catch (err) {
    showToast('Biyometrik kimlik doğrulayıcı hatası.')
  } finally {
    isRegisteringPasskey.value = false
  }
}

const handleDeletePasskey = async (id) => {
  if (!confirm('Bu Passkey cihazını kaldırmak istediğinizden emin misiniz?')) return
  const result = await linkStore.deletePasskey(id)
  if (result.success) {
    showToast('Passkey kaldırıldı.')
  } else {
    showToast(result.error || 'Silinemedi.')
  }
}

// ---------------------------------------------------------
// 5. Admin Yaşam Döngüsü (onMounted)
// ---------------------------------------------------------
onMounted(async () => {
  // Web Share Target kontrolü (query parametreleri)
  if (route.query.title || route.query.url || route.query.text) {
    const sharedTitle = String(route.query.title || '').trim()
    const sharedUrl = String(route.query.url || route.query.text || '').trim()
    sharedTargetBanner.value = {
      title: sharedTitle || 'Paylaşılan Bağlantı',
      url: sharedUrl
    }
    newLink.value.title = sharedTitle || 'Paylaşılan Bağlantı'
    newLink.value.url = sharedUrl
    isAdding.value = true
    showToast('Telefondan paylaşılan bağlantı yakalandı!')
    router.replace({ path: '/admin', query: {} })
  }

  // İlk veri yüklemeleri
  loadSmartInsights()
  linkStore.fetchPasskeys()
})

// Aktif Sekme Kontrolü: Linktree Mantığı ('links' | 'appearance' | 'analytics' | 'messages' | 'settings')
const activeTab = ref('links')

// Haftalık Trend Grafiği Maksimum Değer Çözümleyicisi
const maxTimelineValue = computed(() => {
  const list = analytics.value?.dailyTimeline || []
  if (list.length === 0) return 40
  const max = Math.max(...list.map(d => Math.max(d.visits || 0, d.clicks || 0)))
  return max > 0 ? max : 40
})

// Güvenlik & Önbellek Yönetimi (Faz 21)
const isClearingCache = ref(false)
const isRefreshingCache = ref(false)
const cacheFeedback = ref('')

const handleRefreshCache = async () => {
  isRefreshingCache.value = true
  await linkStore.fetchCacheStats()
  setTimeout(() => {
    isRefreshingCache.value = false
    cacheFeedback.value = 'Önbellek ve güvenlik metrikleri başarıyla güncellendi.'
    setTimeout(() => { cacheFeedback.value = '' }, 3000)
  }, 350)
}

const handleClearCache = async () => {
  isClearingCache.value = true
  const res = await linkStore.clearServerCache()
  isClearingCache.value = false
  cacheFeedback.value = res.message || 'Önbellek başarıyla temizlendi.'
  setTimeout(() => { cacheFeedback.value = '' }, 3500)
}

watch(activeTab, (newTab) => {
  if (newTab === 'settings') {
    linkStore.fetchCacheStats()
  }
})

// Mesajlar Sekmesi Filtresi ve Yardımcıları
const messageFilter = ref('all') // 'all' | 'unread' | 'read'
const messageActionFeedback = ref('')

const filteredMessages = computed(() => {
  if (messageFilter.value === 'unread') {
    return messages.value.filter(m => !m.isRead)
  }
  if (messageFilter.value === 'read') {
    return messages.value.filter(m => m.isRead)
  }
  return messages.value
})

const handleSimulateMessage = async () => {
  const newMsg = await linkStore.simulateMessage()
  messageActionFeedback.value = `"${newMsg.name}" kişisinden yeni örnek mesaj eklendi!`
  setTimeout(() => { messageActionFeedback.value = '' }, 3500)
}

const handleToggleMessageRead = async (id, currentRead) => {
  await linkStore.markMessageAsRead(id, !currentRead)
}

const handleDeleteMessage = async (id) => {
  if (confirm('Bu iletişim mesajını silmek istediğinize emin misiniz?')) {
    await linkStore.deleteMessage(id)
    messageActionFeedback.value = 'Mesaj başarıyla silindi.'
    setTimeout(() => { messageActionFeedback.value = '' }, 2500)
  }
}

const formatMessageDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return dateStr
  }
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// ========================================================
// SEÇENEK B: SOSYAL PAYLAŞIM & SEO KARTLARI (FAZ 16)
// ========================================================
const selectedSocialPreview = ref('whatsapp') // 'whatsapp' | 'twitter' | 'linkedin' | 'telegram'
const seoForm = ref({
  metaTitle: seoSettings.value?.metaTitle || `${profile.value?.name || 'Tuba Gül'} - Full-Stack Developer | linkspace`,
  metaDescription: seoSettings.value?.metaDescription || profile.value?.bio || '',
  ogImage: seoSettings.value?.ogImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=630&fit=crop&q=80',
  customDomain: seoSettings.value?.customDomain || 'tubagul.dev',
  domainVerified: seoSettings.value?.domainVerified !== undefined ? seoSettings.value.domainVerified : true
})

watch(seoSettings, (newVal) => {
  if (newVal) {
    seoForm.value = {
      metaTitle: newVal.metaTitle || seoForm.value.metaTitle,
      metaDescription: newVal.metaDescription || seoForm.value.metaDescription,
      ogImage: newVal.ogImage || seoForm.value.ogImage,
      customDomain: newVal.customDomain !== undefined ? newVal.customDomain : seoForm.value.customDomain,
      domainVerified: Boolean(newVal.domainVerified)
    }
  }
}, { immediate: true })

const isSavingSeo = ref(false)
const seoFeedback = ref('')
const isVerifyingDomain = ref(false)
const domainFeedback = ref('')
const copiedDnsField = ref('')

const handleSaveSeo = async () => {
  isSavingSeo.value = true
  await linkStore.updateSeoSettings(seoForm.value)
  isSavingSeo.value = false
  seoFeedback.value = 'SEO ve Sosyal Paylaşım kartı ayarları başarıyla kaydedildi!'
  setTimeout(() => { seoFeedback.value = '' }, 3500)
}

const handleVerifyDomain = async () => {
  if (!seoForm.value.customDomain) return
  isVerifyingDomain.value = true
  const res = await linkStore.verifyCustomDomain(seoForm.value.customDomain)
  isVerifyingDomain.value = false
  if (res.success) {
    seoForm.value.domainVerified = true
    domainFeedback.value = res.message || 'DNS CNAME kaydı doğrulandı!'
  } else {
    domainFeedback.value = res.error || 'Doğrulama başarısız'
  }
  setTimeout(() => { domainFeedback.value = '' }, 4000)
}

const copyDnsText = (text, fieldName) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text)
    copiedDnsField.value = fieldName
    setTimeout(() => { copiedDnsField.value = '' }, 2000)
  }
}

const setPresetOgImage = (type) => {
  if (type === 'avatar') {
    seoForm.value.ogImage = profile.value?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=630&fit=crop&q=80'
  } else if (type === 'banner') {
    seoForm.value.ogImage = profile.value?.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop&q=80'
  } else if (type === 'tech') {
    seoForm.value.ogImage = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop&q=80'
  }
}

// ==========================================
// SEÇENEK D: YAPAY ZEKA BİYOGRAFİ ASİSTANI (FAZ 18)
// ==========================================
const showAiBioModal = ref(false)
const isGeneratingBio = ref(false)
const generatedBios = ref([])
const copiedBioId = ref(null)

const aiBioForm = ref({
  role: 'Full-Stack Web Geliştirici',
  selectedSkills: ['Vue 3', 'Node.js', 'PostgreSQL'],
  selectedTone: 'all',
  customKeywords: ''
})

const openAiBioModal = () => {
  if (profile.value?.bio) {
    const firstPart = profile.value.bio.split('|')[0]?.split('•')[0]?.trim()
    if (firstPart && firstPart.length < 50) {
      aiBioForm.value.role = firstPart
    }
  }
  showAiBioModal.value = true
  if (generatedBios.value.length === 0) {
    handleGenerateBios()
  }
}

const toggleAiSkill = (skill) => {
  const idx = aiBioForm.value.selectedSkills.indexOf(skill)
  if (idx >= 0) {
    aiBioForm.value.selectedSkills.splice(idx, 1)
  } else {
    aiBioForm.value.selectedSkills.push(skill)
  }
}

const handleGenerateBios = async () => {
  isGeneratingBio.value = true
  try {
    const res = await linkStore.generateBios({
      role: aiBioForm.value.role,
      skills: aiBioForm.value.selectedSkills,
      tone: aiBioForm.value.selectedTone,
      keywords: aiBioForm.value.customKeywords,
      currentBio: profileForm.value.bio
    })
    if (res.success && Array.isArray(res.data)) {
      generatedBios.value = res.data
    }
  } catch (e) {
    console.warn('AI Bio üretim hatası:', e)
  } finally {
    isGeneratingBio.value = false
  }
}

const applyBioToProfile = async (bioText) => {
  profileForm.value.bio = bioText
  await linkStore.updateProfile(profileForm.value)
  showAiBioModal.value = false
  showToast('✨ AI Biyografisi profilinize uygulandı ve kaydedildi!')
}

const copyBioText = (bioText, bioId) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(bioText)
    copiedBioId.value = bioId
    showToast('Biyografi metni panoya kopyalandı!')
    setTimeout(() => {
      copiedBioId.value = null
    }, 2000)
  }
}

// Üst Kırmızı Duyuru Bandı (Linktree Announcement Banner)
const showAnnouncement = ref(true)

// Mobil Önizleme Çekmecesi (Drawer)
const showMobilePreview = ref(false)

// Paylaşım Modalı ve Gerçek Taranabilir QR Kod
const showShareModal = ref(false)
const copiedShareUrl = ref(false)
const qrCodeDataUrl = ref('')
const networkMode = ref('wifi') // 'wifi' | 'localhost'
const localWifiIp = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  ? window.location.hostname
  : '192.168.1.26'


const wifiUrl = computed(() => `http://${localWifiIp}:5173/`)
const localhostUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`
  }
  return 'http://localhost:5173/'
})

const activeShareUrl = computed(() => {
  return networkMode.value === 'wifi' ? wifiUrl.value : localhostUrl.value
})

const qrTargetUrl = computed(() => {
  const base = activeShareUrl.value
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}src=qr`
})

const profilePublicUrl = computed(() => activeShareUrl.value)

const generateQrCode = async (targetUrl) => {
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(targetUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
  } catch (err) {
    console.error('QR Kod oluşturulamadı:', err)
  }
}

watch([showShareModal, qrTargetUrl], ([isOpen, url]) => {
  if (isOpen && url) {
    generateQrCode(url)
  }
}, { immediate: true })

// Ziyaret & QR Cihaz Analitiği Yardımcıları
const handleSimulateVisit = async (device, source = 'qr') => {
  await linkStore.simulateVisit({ device, source })
  showToast(`${source === 'qr' ? 'QR Kod' : 'Doğrudan'} (${device === 'mobile' ? 'Mobil' : 'Masaüstü Tarayıcı'}) ziyareti simüle edildi!`)
}

const handleResetAnalytics = async () => {
  if (confirm('Tüm QR ve cihaz analitik istatistiklerini sıfırlamak istediğinize emin misiniz?')) {
    await linkStore.resetAnalytics()
    showToast('Ziyaretçi ve QR istatistikleri sıfırlandı.')
  }
}

const copyProfileUrl = async () => {
  try {
    await navigator.clipboard.writeText(activeShareUrl.value)
    copiedShareUrl.value = true
    showToast('Profil bağlantısı panoya kopyalandı!')
    setTimeout(() => {
      copiedShareUrl.value = false
    }, 2500)
  } catch (err) {
    showToast('Kopyalama başarısız oldu')
  }
}

// Yeni eklenecek link formu için state
const newLink = ref({
  title: '',
  url: '',
  icon: 'auto',
  customColor: 'default',
  category: '',
  isScheduled: false,
  scheduleStart: '',
  scheduleEnd: '',
  showCountdown: true,
  embedType: 'none',
  showEmbed: false,
  isLocked: false,
  lockType: 'pin',
  passcode: '',
  lockWarning: '',
  isHeader: false,
  abTestEnabled: false,
  titleB: '',
  urlB: ''
})

// Akıllı Medya Embed Algılama Hesaplayıcıları
const detectedNewLinkEmbed = computed(() => {
  return detectEmbed(newLink.value.url)
})

const detectedEditLinkEmbed = computed(() => {
  if (!editingLink.value) return { type: 'none', embedUrl: '', providerName: '', icon: '' }
  return detectEmbed(editingLink.value.url)
})

// Kullanıcı URL yazdığında otomatik embed algılama
watch(() => newLink.value.url, (newUrl) => {
  if (newUrl) {
    const detected = detectEmbed(newUrl)
    if (detected.type !== 'none' && !newLink.value.showEmbed) {
      newLink.value.embedType = detected.type
      newLink.value.showEmbed = true
      if (newLink.value.icon === 'auto' && detected.icon) {
        newLink.value.icon = detected.icon
      }
    }
  }
})

// Kategori Yönetimi ve Filtreleme (Faz 19)
const selectedAdminCategory = ref('all') // 'all' | '__uncategorized__' | category string

const filteredAdminLinks = computed(() => {
  if (selectedAdminCategory.value === 'all') {
    return links.value
  }
  if (selectedAdminCategory.value === '__uncategorized__') {
    return links.value.filter(l => !l.category || !l.category.trim())
  }
  return links.value.filter(l => (l.category || '').trim() === selectedAdminCategory.value)
})

const activeCategoriesWithCount = computed(() => {
  const counts = {}
  links.value.forEach(l => {
    const cat = (l.category || '').trim()
    if (cat) {
      counts[cat] = (counts[cat] || 0) + 1
    }
  })
  return Object.entries(counts).map(([name, count]) => ({ name, count }))
})

const uncategorizedCount = computed(() => {
  return links.value.filter(l => !l.category || !l.category.trim()).length
})

// Hızlı Zamanlama Önayarları (Presets)
const applyPresetToNewLink = (hours) => {
  const futureDate = new Date(Date.now() + hours * 3600 * 1000)
  newLink.value.scheduleEnd = formatForDatetimeInput(futureDate)
  newLink.value.isScheduled = true
}

const applyPresetToEditingLink = (hours) => {
  if (!editingLink.value) return
  const futureDate = new Date(Date.now() + hours * 3600 * 1000)
  editingLink.value.scheduleEnd = formatForDatetimeInput(futureDate)
  editingLink.value.isScheduled = true
}

const isAdding = ref(false)
const toastMessage = ref('')

const showToast = (msg) => {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = ''
  }, 2500)
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

// İkon seçici için bileşen getirme
const getIconComponent = (iconName) => {
  return ICON_COMPONENT_MAP[iconName] || Globe
}

// Stil adı yardımcısı
const getStyleName = (colorId) => {
  const found = BUTTON_STYLES.find(s => s.id === colorId)
  return found ? found.name : 'Varsayılan'
}

// Yönetim Paneli Açık / Koyu Tema Dinamik Sınıfları (Sales Team CRM Dark Dashboard Estetiği)
const themeClasses = computed(() => {
  const isDark = adminTheme.value === 'dark'
  return {
    isDark,
    mainBg: isDark ? 'bg-[#0C0C0B] text-white min-h-screen' : 'bg-slate-100/90 text-slate-800',
    topHeaderBg: isDark ? 'bg-[#161616]/95 border-[#282828] backdrop-blur-md shadow-2xl shadow-black/80' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-xs',
    headerBorder: isDark ? 'border-[#282828]' : 'border-slate-200',
    titleText: isDark ? 'text-white' : 'text-slate-900',
    subText: isDark ? 'text-[#8E8E93]' : 'text-slate-500',
    navBg: isDark ? 'bg-[#181818] border-[#282828]' : 'bg-white border-slate-200 shadow-sm',
    navInactive: isDark ? 'text-[#8E8E93] hover:text-white hover:bg-[#222222]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
    statCardBg: isDark ? 'bg-[#181818] border-[#282828] hover:border-[#FFFF00]/50 shadow-xl shadow-black/60' : 'bg-white border-slate-200 shadow-sm',
    cardBg: isDark ? 'bg-[#181818] border-[#282828] shadow-2xl shadow-black/80' : 'bg-white border-slate-200 shadow-sm',
    inputBg: isDark 
      ? 'bg-[#101010] border-[#282828] text-white placeholder-[#666666] focus:border-[#FFFF00] focus:ring-1 focus:ring-[#FFFF00]/40' 
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-yellow-600 focus:bg-white',
    inputLabel: isDark ? 'text-[#A1A1AA]' : 'text-slate-600',
    boxInner: isDark ? 'bg-[#121212] border-[#282828]' : 'bg-slate-50 border-slate-200',
    colorBtnInactive: isDark ? 'border-[#282828] bg-[#121212] hover:border-[#444444]' : 'border-slate-200 bg-slate-50 hover:border-slate-300 shadow-2xs',
    colorBtnText: isDark ? 'text-[#E5E5E5]' : 'text-slate-700',
    linkCard: isDark ? 'bg-[#181818] border-[#282828] hover:border-[#FFFF00] shadow-lg shadow-black/40' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow',
    linkControls: isDark ? 'border-[#282828] text-[#8E8E93]' : 'border-slate-200 text-slate-400',
    linkIconBox: isDark ? 'bg-[#FFFF00]/10 border border-[#FFFF00]/25 text-[#FFFF00] group-hover:bg-[#FFFF00]/20' : 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    btnGhost: isDark ? 'text-[#8E8E93] hover:text-white hover:bg-[#222222]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
    modalBg: isDark ? 'bg-[#161616] border-[#282828] shadow-2xl shadow-black/90 text-white' : 'bg-white border-slate-200 shadow-2xl text-slate-900',
    modalOverlay: isDark ? 'bg-black/85 backdrop-blur-sm' : 'bg-slate-900/60 backdrop-blur-sm'
  }
})

// Güvenli ve Geçerli URL Doğrulama Regex'i (XSS ve Geçersiz Protokol Engelleme)
const isValidUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return false
  const trimmed = urlStr.trim()

  // Tehlikeli protokollere (XSS) kesinlikle izin verme
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i
  if (dangerousProtocols.test(trimmed)) {
    return false
  }

  // mailto: ve tel: protokolleri için özel kontrol
  if (/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(trimmed)) {
    return true
  }
  if (/^tel:\+?[0-9\s\-()]{4,20}$/i.test(trimmed)) {
    return true
  }

  // Web URL kontrolü (http://, https:// veya doğrudan domain.com)
  const webUrlRegex = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?$/i
  return webUrlRegex.test(trimmed)
}

const urlError = ref('')
const editUrlError = ref('')

// Yeni link ekleme
const handleAddLink = () => {
  urlError.value = ''
  if (!newLink.value.title.trim()) {
    urlError.value = 'Lütfen bir başlık girin.'
    return
  }
  if (!newLink.value.isHeader && !newLink.value.url.trim()) {
    urlError.value = 'Lütfen geçerli bir hedef URL girin.'
    return
  }

  if (!newLink.value.isHeader && !isValidUrl(newLink.value.url)) {
    urlError.value = 'Hatalı veya güvensiz URL! Lütfen geçerli bir web adresi girin (örn: https://ornek.com).'
    showToast('Geçersiz URL formatı!')
    return
  }

  linkStore.addLink(
    newLink.value.title, 
    newLink.value.isHeader ? '' : newLink.value.url, 
    newLink.value.icon || 'auto', 
    newLink.value.customColor || 'default',
    {
      isScheduled: Boolean(newLink.value.isScheduled),
      scheduleStart: newLink.value.scheduleStart ? new Date(newLink.value.scheduleStart).toISOString() : null,
      scheduleEnd: newLink.value.scheduleEnd ? new Date(newLink.value.scheduleEnd).toISOString() : null,
      showCountdown: Boolean(newLink.value.showCountdown),
      category: (newLink.value.category || '').trim(),
      embedType: newLink.value.embedType || 'none',
      showEmbed: Boolean(newLink.value.showEmbed),
      isLocked: Boolean(newLink.value.isLocked),
      lockType: newLink.value.lockType || 'pin',
      passcode: (newLink.value.passcode || '').trim(),
      lockWarning: (newLink.value.lockWarning || '').trim(),
      isHeader: Boolean(newLink.value.isHeader),
      abTestEnabled: Boolean(newLink.value.abTestEnabled),
      titleB: (newLink.value.titleB || '').trim(),
      urlB: (newLink.value.urlB || '').trim(),
      isHeader: Boolean(newLink.value.isHeader),
      abTestEnabled: Boolean(newLink.value.abTestEnabled),
      titleB: (newLink.value.titleB || '').trim(),
      urlB: (newLink.value.urlB || '').trim()
    },
    (newLink.value.category || '').trim()
  )
  
  // Formu sıfırla
  newLink.value.title = ''
  newLink.value.url = ''
  newLink.value.icon = 'auto'
  newLink.value.customColor = 'default'
  newLink.value.category = ''
  newLink.value.isScheduled = false
  newLink.value.scheduleStart = ''
  newLink.value.scheduleEnd = ''
  newLink.value.showCountdown = true
  newLink.value.embedType = 'none'
  newLink.value.isHeader = false
  newLink.value.abTestEnabled = false
  newLink.value.titleB = ''
  newLink.value.urlB = ''
  newLink.value.showEmbed = false
  newLink.value.isLocked = false
  newLink.value.lockType = 'pin'
  newLink.value.passcode = ''
  newLink.value.lockWarning = ''
  isAdding.value = false
  urlError.value = ''
  showToast('Yeni bağlantı başarıyla eklendi!')
}

// Link silme
const handleDeleteLink = (id) => {
  if (confirm('Bu bağlantıyı silmek istediğinizden emin misiniz?')) {
    linkStore.deleteLink(id)
    showToast('Bağlantı silindi.')
  }
}

// Bağlantı Düzenleme (Modal) State ve Aksiyonları
const editingLink = ref(null)
const isSavingEdit = ref(false)

const openEditModal = (link) => {
  editUrlError.value = ''
  editingLink.value = {
    id: link.id,
    title: link.title,
    url: link.url,
    icon: link.icon || 'auto',
    customColor: link.customColor || 'default',
    category: link.category || '',
    isScheduled: Boolean(link.isScheduled),
    scheduleStart: link.scheduleStart ? formatForDatetimeInput(link.scheduleStart) : '',
    scheduleEnd: link.scheduleEnd ? formatForDatetimeInput(link.scheduleEnd) : '',
    showCountdown: link.showCountdown !== undefined ? Boolean(link.showCountdown) : true,
    embedType: link.embedType || 'none',
    showEmbed: Boolean(link.showEmbed),
    isLocked: Boolean(link.isLocked),
    lockType: link.lockType || 'pin',
    passcode: link.passcode || '',
    lockWarning: link.lockWarning || '',
    isHeader: Boolean(link.isHeader),
    abTestEnabled: Boolean(link.abTestEnabled),
    titleB: link.titleB || '',
    urlB: link.urlB || '',
    clicksA: link.clicksA || 0,
    clicksB: link.clicksB || 0,
    viewsA: link.viewsA || 0,
    viewsB: link.viewsB || 0
  }
}

const closeEditModal = () => {
  editingLink.value = null
  editUrlError.value = ''
  isSavingEdit.value = false
}

const handleSaveEdit = async () => {
  editUrlError.value = ''
  if (!editingLink.value || !editingLink.value.title.trim()) return
  if (!editingLink.value.isHeader && !editingLink.value.url.trim()) {
    editUrlError.value = 'Lütfen bağlantı URL adresini girin.'
    return
  }

  if (!editingLink.value.isHeader && !isValidUrl(editingLink.value.url)) {
    editUrlError.value = 'Hatalı veya güvensiz URL formatı! (Örn: https://github.com)'
    showToast('Geçersiz URL formatı!')
    return
  }

  isSavingEdit.value = true

  await linkStore.updateLink(editingLink.value.id, {
    title: editingLink.value.title.trim(),
    url: editingLink.value.isHeader ? '' : editingLink.value.url.trim(),
    isHeader: Boolean(editingLink.value.isHeader),
    abTestEnabled: Boolean(editingLink.value.abTestEnabled),
    titleB: (editingLink.value.titleB || '').trim(),
    urlB: (editingLink.value.urlB || '').trim(),
    icon: editingLink.value.icon || 'auto',
    customColor: editingLink.value.customColor || 'default',
    category: (editingLink.value.category || '').trim(),
    isScheduled: Boolean(editingLink.value.isScheduled),
    scheduleStart: editingLink.value.scheduleStart ? new Date(editingLink.value.scheduleStart).toISOString() : null,
    scheduleEnd: editingLink.value.scheduleEnd ? new Date(editingLink.value.scheduleEnd).toISOString() : null,
    showCountdown: Boolean(editingLink.value.showCountdown),
    embedType: editingLink.value.embedType || 'none',
    showEmbed: Boolean(editingLink.value.showEmbed),
    isLocked: Boolean(editingLink.value.isLocked),
    lockType: editingLink.value.lockType || 'pin',
    passcode: (editingLink.value.passcode || '').trim(),
    lockWarning: (editingLink.value.lockWarning || '').trim()
  })

  isSavingEdit.value = false
  closeEditModal()
  showToast('Bağlantı başarıyla güncellendi!')
}

// Görünürlük aç/kapat toggle
const handleToggleLink = (id) => {
  linkStore.toggleLink(id)
}

// Sıralama yukarı taşı
const handleMoveUp = (index) => {
  linkStore.moveLinkUp(index)
  showToast('Sıralama güncellendi.')
}

// Sıralama aşağı taşı
const handleMoveDown = (index) => {
  linkStore.moveLinkDown(index)
  showToast('Sıralama güncellendi.')
}

// HTML5 Drag and Drop API ile Sıralama Yönetimi
const draggedIndex = ref(null)
const dragOverIndex = ref(null)

const handleDragStart = (event, index) => {
  draggedIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(index))
}

const handleDragOver = (event, index) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  if (dragOverIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const handleDragLeave = (event, index) => {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null
  }
}

const handleDrop = async (event, targetIndex) => {
  event.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== targetIndex) {
    await linkStore.reorderLinks(draggedIndex.value, targetIndex)
    showToast('Bağlantı sıralaması güncellendi!')
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}

const handleDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

// Tekil link tıklama sıfırlama
const handleResetLinkClicks = (id) => {
  if (confirm('Bu bağlantının tıklanma sayacını sıfırlamak istiyor musunuz?')) {
    linkStore.resetClicks(id)
    showToast('Tıklanma sayacı sıfırlandı.')
  }
}

// Tüm tıklamaları sıfırlama
const handleResetAllClicks = () => {
  if (confirm('TÜM bağlantıların tıklanma verilerini sıfırlamak istediğinizden emin misiniz?')) {
    linkStore.resetClicks()
    showToast('Tüm tıklama verileri sıfırlandı.')
  }
}

// Ziyaretçi Sayfasında Klasörlü Gruplama Kontrolü (Aç / Kapat)
const handleToggleGroupByCategory = async () => {
  const nextVal = !profile.value.groupByCategory
  profileForm.value.groupByCategory = nextVal
  await linkStore.updateProfile({ groupByCategory: nextVal })
  showToast(
    nextVal 
      ? 'Klasörlü gruplama açıldı. Bağlantılar profilde kategorilerine göre gösterilecek.' 
      : 'Klasörlü gruplama kapatıldı. Bağlantılar profilde klasik düz liste olarak gösterilecek.',
    'success'
  )
}

// Yönetici Panelinden Klasörlerin Başlangıç Durumunu Ayarlama (Açık / Kapalı)
const handleSetFoldersDefaultExpanded = async (state) => {
  profileForm.value.foldersDefaultExpanded = state
  await linkStore.updateProfile({ foldersDefaultExpanded: state })
  showToast(
    state 
      ? 'Klasörler ziyaretçilere varsayılan olarak açık başlayacak.' 
      : 'Klasörler ziyaretçilere varsayılan olarak kapalı (daraltılmış) başlayacak.',
    'success'
  )
}

// Profilde Yetenek & İlgi Alanı Rozetleri Görünürlük Kontrolü (Aç / Kapat)
const handleToggleShowBadges = async () => {
  const nextVal = !profile.value.showBadges
  profileForm.value.showBadges = nextVal
  await linkStore.updateProfile({ showBadges: nextVal })
  showToast(
    nextVal 
      ? 'Yetenek rozetleri profilde görünür yapıldı.' 
      : 'Yetenek rozetleri profilde gizlendi (Minimalist sade görünüm).',
    'success'
  )
}

// Profilde Canlı Müsaitlik & Fırsat Rozeti Kontrolü (Aç / Kapat)
const handleToggleStatusBadge = async () => {
  const isCurrentlyActive = profileForm.value.statusColor !== 'none'
  const nextColor = isCurrentlyActive ? 'none' : 'emerald'
  profileForm.value.statusColor = nextColor
  await linkStore.updateProfile({ statusColor: nextColor })
  showToast(
    !isCurrentlyActive
      ? 'Müsaitlik rozeti profilde görünür yapıldı.' 
      : 'Müsaitlik rozeti profilde gizlendi (Minimalist sade görünüm).',
    'success'
  )
}

// Oturumu Kapatma (Logout)
const handleLogout = () => {
  if (confirm('Yönetim panelinden çıkış yapmak istediğinizden emin misiniz?')) {
    authStore.logout()
    router.push('/login')
  }
}

// Tema Seçme
const handleSelectTheme = (theme) => {
  linkStore.setTheme(theme.id)
  showToast(`${theme.name} teması uygulandı!`)
}

// Profil form state'i
const profileForm = ref({
  name: profile.value.name,
  username: profile.value.username,
  bio: profile.value.bio,
  avatar: profile.value.avatar,
  avatarShape: profile.value.avatarShape || 'circle',
  avatarGlow: profile.value.avatarGlow || 'yellow',
  statusText: profile.value.statusText !== undefined ? profile.value.statusText : 'Yeni Projelere & Fırsatlara Açık',
  statusColor: profile.value.statusColor || 'emerald',
  isVerified: profile.value.isVerified !== undefined ? profile.value.isVerified : true,
  banner: profile.value.banner || '',
  bannerPattern: profile.value.bannerPattern || 'mesh',
  badges: Array.isArray(profile.value.badges) ? [...profile.value.badges] : [],
  socialLinks: {
    barVisible: profile.value.socialLinks?.barVisible !== false,
    shape: profile.value.socialLinks?.shape || 'rounded-full',
    style: profile.value.socialLinks?.style || 'glass',
    github: profile.value.socialLinks?.github || '',
    githubActive: profile.value.socialLinks?.githubActive !== false,
    linkedin: profile.value.socialLinks?.linkedin || '',
    linkedinActive: profile.value.socialLinks?.linkedinActive !== false,
    instagram: profile.value.socialLinks?.instagram || '',
    instagramActive: profile.value.socialLinks?.instagramActive !== false,
    twitter: profile.value.socialLinks?.twitter || '',
    twitterActive: profile.value.socialLinks?.twitterActive !== false,
    youtube: profile.value.socialLinks?.youtube || '',
    youtubeActive: profile.value.socialLinks?.youtubeActive !== false,
    email: profile.value.socialLinks?.email || '',
    emailActive: profile.value.socialLinks?.emailActive !== false
  },
  groupByCategory: profile.value.groupByCategory !== undefined ? Boolean(profile.value.groupByCategory) : false,
  foldersDefaultExpanded: profile.value.foldersDefaultExpanded !== false,
  showBadges: profile.value.showBadges !== undefined ? Boolean(profile.value.showBadges) : false,
  enable3dBackground: profile.value.enable3dBackground !== false,
  avatarMode: profile.value.avatarMode || 'switchable',
  enableSpringPhysics: profile.value.enableSpringPhysics !== false
})
const isSavingProfile = ref(false)

// Hazır Avatar Kategori Filtreleme
const avatarCategories = ['Tümü', 'Portre', '3D', 'Siber', 'Stüdyo']
const selectedAvatarCategory = ref('Tümü')

const filteredPresetAvatars = computed(() => {
  if (selectedAvatarCategory.value === 'Tümü') {
    return PRESET_AVATARS
  }
  return PRESET_AVATARS.filter(a => a.category === selectedAvatarCategory.value)
})

// Durum Rozeti Şablonu Seçici
const selectStatusPreset = (preset) => {
  profileForm.value.statusColor = preset.id
  if (preset.id !== 'none') {
    profileForm.value.statusText = preset.text
  }
  showToast(`Durum rozeti seçildi: ${preset.text}`)
}

// Dosya Seçici Referansları
const avatarFileInput = ref(null)
const bannerFileInput = ref(null)

const triggerAvatarUpload = () => {
  avatarFileInput.value?.click()
}

const triggerBannerUpload = () => {
  bannerFileInput.value?.click()
}

const handleAvatarFileUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    showToast('Avatar boyutu maksimum 2MB olmalıdır.')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    profileForm.value.avatar = e.target.result
    showToast('Yeni avatar görseli yüklendi!')
  }
  reader.readAsDataURL(file)
}

const handleBannerFileUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 3 * 1024 * 1024) {
    showToast('Kapak görseli boyutu maksimum 3MB olmalıdır.')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    profileForm.value.banner = e.target.result
    showToast('Yeni kapak görseli yüklendi!')
  }
  reader.readAsDataURL(file)
}

const selectPresetAvatar = (url) => {
  profileForm.value.avatar = url
  showToast('Hazır avatar seçildi!')
}

const selectBannerPattern = (patternId) => {
  profileForm.value.bannerPattern = patternId
  showToast('Kapak deseni seçildi!')
}

const clearBannerImage = () => {
  profileForm.value.banner = ''
  showToast('Kapak görseli temizlendi.')
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

const getBadgeClass = (badge) => {
  const isLight = adminTheme.value === 'light'
  const found = BADGE_COLOR_STYLES.find(s => s.id === (badge?.color || 'default'))
  if (found) {
    return isLight ? found.lightClass : found.cardClass
  }
  return isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#181818] border-[#282828] text-neutral-300'
}

const getBadgeIconColor = (badge) => {
  const found = BADGE_COLOR_STYLES.find(s => s.id === (badge?.color || 'default'))
  return found ? found.iconColor : 'text-[#FFFF00]'
}

// Rozet Yöneticisi State ve Aksiyonları
const newBadgeText = ref('')
const newBadgeIcon = ref('Sparkles')
const newBadgeColor = ref('default')

const handleAddBadge = async () => {
  if (!newBadgeText.value.trim()) return
  await linkStore.addBadge(newBadgeText.value.trim(), newBadgeIcon.value, newBadgeColor.value)
  newBadgeText.value = ''
  newBadgeIcon.value = 'Sparkles'
  newBadgeColor.value = 'default'
  showToast('Yeni rozet başarıyla eklendi!')
}

const handleRemoveBadge = async (badgeId) => {
  await linkStore.removeBadge(badgeId)
  showToast('Rozet kaldırıldı.')
}

const handleAddPresetBadge = async (preset) => {
  const exists = (profile.value?.badges || []).some(b => b.text.toLowerCase() === preset.text.toLowerCase())
  if (exists) {
    showToast('Bu rozet zaten ekli.')
    return
  }
  await linkStore.addBadge(preset.text, preset.icon, preset.color)
  showToast(`"${preset.text}" rozeti eklendi!`)
}

const PRESET_BADGE_TEMPLATES = [
  { text: 'Full-Stack Developer', icon: 'Code', color: 'default' },
  { text: 'Vue 3 & Express', icon: 'Sparkles', color: 'yellow' },
  { text: 'Açık Kaynak Tutkunu', icon: 'Flame', color: 'rose' },
  { text: 'UI / UX Tasarım', icon: 'Sparkles', color: 'purple' },
  { text: 'Remote / Uzaktan', icon: 'Globe', color: 'blue' },
  { text: 'Kahve & Kod', icon: 'Coffee', color: 'default' },
  { text: 'İstanbul, TR', icon: 'MapPin', color: 'emerald' }
]

// Profil verisi API'den gelirse formu senkronize tut
watch(profile, (newVal) => {
  if (newVal) {
    profileForm.value = {
      name: newVal.name,
      username: newVal.username,
      bio: newVal.bio,
      avatar: newVal.avatar,
      avatarShape: newVal.avatarShape || 'circle',
      avatarGlow: newVal.avatarGlow || 'yellow',
      statusText: newVal.statusText !== undefined ? newVal.statusText : 'Yeni Projelere & Fırsatlara Açık',
      statusColor: newVal.statusColor || 'emerald',
      isVerified: newVal.isVerified !== undefined ? newVal.isVerified : true,
      banner: newVal.banner || '',
      bannerPattern: newVal.bannerPattern || 'mesh',
      badges: Array.isArray(newVal.badges) ? [...newVal.badges] : [],
      socialLinks: {
        barVisible: newVal.socialLinks?.barVisible !== false,
        shape: newVal.socialLinks?.shape || 'rounded-full',
        style: newVal.socialLinks?.style || 'glass',
        github: newVal.socialLinks?.github || '',
        githubActive: newVal.socialLinks?.githubActive !== false,
        linkedin: newVal.socialLinks?.linkedin || '',
        linkedinActive: newVal.socialLinks?.linkedinActive !== false,
        instagram: newVal.socialLinks?.instagram || '',
        instagramActive: newVal.socialLinks?.instagramActive !== false,
        twitter: newVal.socialLinks?.twitter || '',
        twitterActive: newVal.socialLinks?.twitterActive !== false,
        youtube: newVal.socialLinks?.youtube || '',
        youtubeActive: newVal.socialLinks?.youtubeActive !== false,
        email: newVal.socialLinks?.email || '',
        emailActive: newVal.socialLinks?.emailActive !== false
      },
      enable3dBackground: newVal.enable3dBackground !== false,
      avatarMode: newVal.avatarMode || 'switchable',
      enableSpringPhysics: newVal.enableSpringPhysics !== false
    }
  }
}, { deep: true })

// Formdaki sosyal medya ve görünüm değişikliklerini canlı telefon önizlemesine anında yansıt
watch(
  () => profileForm.value.socialLinks,
  (newSocial) => {
    if (profile.value && newSocial) {
      profile.value.socialLinks = {
        ...(profile.value.socialLinks || {}),
        ...newSocial
      }
    }
  },
  { deep: true }
)

const handleSaveProfile = async () => {
  isSavingProfile.value = true
  await linkStore.updateProfile({
    name: profileForm.value.name.trim(),
    username: profileForm.value.username.trim(),
    bio: profileForm.value.bio.trim(),
    avatar: profileForm.value.avatar.trim(),
    avatarShape: profileForm.value.avatarShape || 'circle',
    avatarGlow: profileForm.value.avatarGlow || 'yellow',
    statusText: profileForm.value.statusText !== undefined ? profileForm.value.statusText : 'Yeni Projelere & Fırsatlara Açık',
    statusColor: profileForm.value.statusColor || 'emerald',
    isVerified: profileForm.value.isVerified !== undefined ? profileForm.value.isVerified : true,
    banner: (profileForm.value.banner || '').trim(),
    bannerPattern: profileForm.value.bannerPattern || 'mesh',
    badges: profileForm.value.badges || [],
    socialLinks: {
      barVisible: profileForm.value.socialLinks.barVisible !== false,
      shape: profileForm.value.socialLinks.shape || 'rounded-full',
      style: profileForm.value.socialLinks.style || 'glass',
      github: (profileForm.value.socialLinks.github || '').trim(),
      githubActive: profileForm.value.socialLinks.githubActive !== false,
      linkedin: (profileForm.value.socialLinks.linkedin || '').trim(),
      linkedinActive: profileForm.value.socialLinks.linkedinActive !== false,
      instagram: (profileForm.value.socialLinks.instagram || '').trim(),
      instagramActive: profileForm.value.socialLinks.instagramActive !== false,
      twitter: (profileForm.value.socialLinks.twitter || '').trim(),
      twitterActive: profileForm.value.socialLinks.twitterActive !== false,
      youtube: (profileForm.value.socialLinks.youtube || '').trim(),
      youtubeActive: profileForm.value.socialLinks.youtubeActive !== false,
      email: (profileForm.value.socialLinks.email || '').trim(),
      emailActive: profileForm.value.socialLinks.emailActive !== false
    },
    groupByCategory: Boolean(profileForm.value.groupByCategory),
    foldersDefaultExpanded: profileForm.value.foldersDefaultExpanded !== false,
    showBadges: Boolean(profileForm.value.showBadges),
    enable3dBackground: profileForm.value.enable3dBackground !== false,
    avatarMode: profileForm.value.avatarMode || 'switchable',
    enableSpringPhysics: profileForm.value.enableSpringPhysics !== false
  })
  isSavingProfile.value = false
  showToast('Profil ve sosyal medya ayarları kaydedildi!')
}

// Şifre Değiştirme Formu (Ayarlar Sekmesi)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const isChangingPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

const handleChangePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    passwordError.value = 'Mevcut ve yeni şifre alanları zorunludur'
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'Yeni şifre en az 6 karakter olmalıdır'
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Yeni şifreler birbiriyle eşleşmiyor'
    return
  }

  isChangingPassword.value = true
  const res = await authStore.changePassword(
    passwordForm.value.currentPassword,
    passwordForm.value.newPassword
  )
  isChangingPassword.value = false

  if (res.success) {
    passwordSuccess.value = 'Şifreniz başarıyla değiştirildi!'
    passwordForm.value.currentPassword = ''
    passwordForm.value.newPassword = ''
    passwordForm.value.confirmPassword = ''
    showToast('Şifreniz güncellendi!')
  } else {
    passwordError.value = res.error || 'Şifre değiştirilemedi'
  }
}
</script>

<template>
  <div :class="['min-h-screen transition-colors duration-200', themeClasses.mainBg]">
    
    <!-- Toast Bildirimi -->
    <div 
      v-if="toastMessage" 
      class="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <Check class="w-4 h-4" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- ÜST DUYURU BARI (Linktree Announcement Banner) -->
    <div 
      v-if="showAnnouncement" 
      class="bg-[#780016] text-white py-2 px-4 text-xs font-medium text-center relative flex items-center justify-center gap-2 shadow-sm z-50 animate-in fade-in"
    >
      <span>Amplify your reach on linkspace.</span>
      <router-link to="/" target="_blank" class="underline font-bold hover:text-white/80">Connect today.</router-link>
      <button 
        type="button" 
        @click="showAnnouncement = false" 
        class="absolute right-4 text-white/70 hover:text-white transition-colors"
        title="Kapat"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- LINKTREE FLOATING CAPSULE APP BAR (Kapsül Üst Menü) -->
    <header class="sticky top-3 z-40 px-3 sm:px-6 w-full max-w-6xl mx-auto my-3">
      <div 
        :class="[
          'w-full rounded-full px-4 sm:px-8 py-2.5 sm:py-3.5 shadow-xl transition-all flex items-center justify-between gap-4 border backdrop-blur-md',
          adminTheme === 'dark' 
            ? 'bg-[#161616]/95 border-[#282828] text-white shadow-2xl shadow-black/80' 
            : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-900/5'
        ]"
      >
        <!-- SOL: linkspace Logo -->
        <div class="flex items-center gap-3">
          <router-link 
            to="/admin" 
            class="font-black text-xl sm:text-2xl tracking-tight select-none hover:opacity-85 transition-opacity flex items-center group"
            :class="adminTheme === 'light' ? 'text-black' : 'text-white'"
          >
            <span>linkspace</span>
            <Zap class="w-4 h-4 sm:w-5 sm:h-5 text-[#FFFF00] fill-[#FFFF00] ml-1 inline-block drop-shadow-[0_0_8px_rgba(255,255,0,0.6)] transition-transform group-hover:scale-110" />
          </router-link>
        </div>

        <!-- ORTA: Linktree Sekmeleri / Navigasyon (Dribbble CRM Pill Bar) -->
        <nav 
          class="hidden md:flex items-center gap-1 lg:gap-1.5 p-1 rounded-full transition-colors"
          :class="adminTheme === 'light' ? 'bg-slate-100 border border-slate-200' : 'bg-[#181818] border border-[#282828]'"
        >
          <button 
            type="button"
            @click="activeTab = 'links'"
            class="px-4 py-1.5 rounded-full text-xs lg:text-sm transition-all flex items-center gap-1.5"
            :class="activeTab === 'links' 
              ? (adminTheme === 'dark' ? 'bg-white text-black font-bold shadow-md ring-1 ring-black/10' : 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20') 
              : (adminTheme === 'dark' ? 'text-[#8E8E93] hover:text-white font-semibold' : 'text-slate-600 hover:text-black font-semibold')"
          >
            <span>Bağlantılar</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full font-bold" :class="activeTab === 'links' ? 'bg-black text-[#FFFF00]' : (adminTheme === 'light' ? 'bg-black/10 text-slate-800' : 'bg-[#FFFF00]/15 text-[#FFFF00]')">
              {{ links.length }}
            </span>
          </button>

          <button 
            type="button"
            @click="activeTab = 'appearance'"
            class="px-4 py-1.5 rounded-full text-xs lg:text-sm transition-all flex items-center gap-1.5"
            :class="activeTab === 'appearance' 
              ? (adminTheme === 'dark' ? 'bg-white text-black font-bold shadow-md ring-1 ring-black/10' : 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20') 
              : (adminTheme === 'dark' ? 'text-[#8E8E93] hover:text-white font-semibold' : 'text-slate-600 hover:text-black font-semibold')"
          >
            <span>Görünüm</span>
          </button>

          <button 
            type="button"
            @click="activeTab = 'analytics'"
            class="px-4 py-1.5 rounded-full text-xs lg:text-sm transition-all flex items-center gap-1.5"
            :class="activeTab === 'analytics' 
              ? (adminTheme === 'dark' ? 'bg-white text-black font-bold shadow-md ring-1 ring-black/10' : 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20') 
              : (adminTheme === 'dark' ? 'text-[#8E8E93] hover:text-white font-semibold' : 'text-slate-600 hover:text-black font-semibold')"
          >
            <span>İstatistikler</span>
          </button>

          <button 
            type="button"
            @click="activeTab = 'messages'"
            class="px-4 py-1.5 rounded-full text-xs lg:text-sm transition-all flex items-center gap-1.5 relative cursor-pointer"
            :class="activeTab === 'messages' 
              ? (adminTheme === 'dark' ? 'bg-white text-black font-bold shadow-md ring-1 ring-black/10' : 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20') 
              : (adminTheme === 'dark' ? 'text-[#8E8E93] hover:text-white font-semibold' : 'text-slate-600 hover:text-black font-semibold')"
          >
            <span>Mesajlar</span>
            <span 
              v-if="unreadMessagesCount > 0" 
              class="text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse"
              :class="activeTab === 'messages' ? 'bg-black text-[#FFFF00]' : 'bg-amber-400 text-black'"
            >
              {{ unreadMessagesCount }}
            </span>
            <span 
              v-else 
              class="text-[10px] px-1.5 py-0.2 rounded-full font-bold opacity-75"
              :class="activeTab === 'messages' ? 'bg-black text-[#FFFF00]' : (adminTheme === 'light' ? 'bg-black/10 text-slate-800' : 'bg-[#FFFF00]/15 text-[#FFFF00]')"
            >
              {{ messages.length }}
            </span>
          </button>

          <button 
            type="button"
            @click="activeTab = 'settings'"
            class="px-4 py-1.5 rounded-full text-xs lg:text-sm transition-all flex items-center gap-1.5"
            :class="activeTab === 'settings' 
              ? (adminTheme === 'dark' ? 'bg-white text-black font-bold shadow-md ring-1 ring-black/10' : 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20') 
              : (adminTheme === 'dark' ? 'text-[#8E8E93] hover:text-white font-semibold' : 'text-slate-600 hover:text-black font-semibold')"
          >
            <span>Ayarlar</span>
          </button>
        </nav>

        <!-- SAĞ: Aksiyonlar (Profili Gör, Çıkış Yap ve Elektrik Sarı Paylaş Butonu) -->
        <div class="flex items-center gap-1.5 sm:gap-3">
          
          <!-- Sayfayı Aç (Yeni Sekme) -->
          <router-link 
            to="/" 
            target="_blank" 
            title="Canlı Profil Sayfasını Yeni Sekmede Aç"
            class="hidden sm:inline-flex items-center gap-1 text-xs sm:text-sm font-semibold transition-colors px-2 py-1"
            :class="adminTheme === 'light' ? 'text-[#8E8E93] hover:text-black' : 'text-[#8E8E93] hover:text-[#FFFF00]'"
          >
            <span>Profili Gör</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </router-link>

          <!-- Çıkış Yap ('Log in' tarzı yalın buton) -->
          <button 
            type="button"
            @click="handleLogout"
            title="Oturumu Kapat"
            class="text-xs sm:text-sm font-semibold transition-colors px-2.5 py-1.5"
            :class="adminTheme === 'light' ? 'text-[#8E8E93] hover:text-rose-500' : 'text-[#8E8E93] hover:text-rose-400'"
          >
            <span>Çıkış Yap</span>
          </button>

          <!-- Paylaş Butonu (Dribbble İkonik Elektrik Sarı Kapsül Butonu) -->
          <button 
            type="button"
            @click="showShareModal = true"
            class="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-md shadow-yellow-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Share2 class="w-3.5 h-3.5 text-black stroke-[2.2]" />
            <span>Paylaş</span>
          </button>

        </div>
      </div>
    </header>

    <!-- ANA İÇERİK: LINKTREE İKİ SÜTUNLU DÜZEN (Two-Column Layout) -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- ========================================== -->
        <!-- SOL SÜTUN: KONTROLLER VE AYARLAR (Cols 1-7/8) -->
        <!-- ========================================== -->
        <div class="lg:col-span-7 xl:col-span-8 space-y-6">
          
          <!-- MOBİL SEKME NAVİGASYONU (md:hidden ekranlar için) -->
          <nav :class="['md:hidden flex items-center gap-1 p-1.5 border rounded-2xl transition-colors overflow-x-auto scrollbar-none', themeClasses.navBg]">
            <button 
              @click="activeTab = 'links'"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
              :class="activeTab === 'links' ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' : themeClasses.navInactive"
            >
              <Globe class="w-3.5 h-3.5" />
              <span>Bağlantılar</span>
              <span 
                class="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                :class="activeTab === 'links' ? 'bg-black text-[#FFFF00]' : (adminTheme === 'light' ? 'bg-black/10 text-slate-800' : 'bg-[#FFFF00]/15 text-[#FFFF00]')"
              >
                {{ links.length }}
              </span>
            </button>

            <button 
              @click="activeTab = 'appearance'"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
              :class="activeTab === 'appearance' ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' : themeClasses.navInactive"
            >
              <Palette class="w-3.5 h-3.5" />
              <span>Görünüm & Tema</span>
            </button>

            <button 
              @click="activeTab = 'analytics'"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
              :class="activeTab === 'analytics' ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' : themeClasses.navInactive"
            >
              <BarChart3 class="w-3.5 h-3.5" />
              <span>İstatistikler</span>
            </button>

            <button 
              @click="activeTab = 'messages'"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
              :class="activeTab === 'messages' ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' : themeClasses.navInactive"
            >
              <MessageSquare class="w-3.5 h-3.5" />
              <span>Mesajlar</span>
              <span 
                v-if="unreadMessagesCount > 0" 
                class="px-1.5 py-0.2 rounded-full text-[10px] font-black animate-pulse"
                :class="activeTab === 'messages' ? 'bg-black text-[#FFFF00]' : 'bg-amber-400 text-black'"
              >
                {{ unreadMessagesCount }}
              </span>
              <span 
                v-else 
                class="px-1.5 py-0.2 rounded-full text-[10px] font-bold opacity-75"
                :class="activeTab === 'messages' ? 'bg-black text-[#FFFF00]' : (adminTheme === 'light' ? 'bg-black/10 text-slate-800' : 'bg-[#FFFF00]/15 text-[#FFFF00]')"
              >
                {{ messages.length }}
              </span>
            </button>

            <button 
              @click="activeTab = 'settings'"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
              :class="activeTab === 'settings' ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' : themeClasses.navInactive"
            >
              <Settings class="w-3.5 h-3.5" />
              <span>Ayarlar</span>
            </button>
          </nav>

          <!-- ========================================== -->
          <!-- SEKME 1: BAĞLANTILAR (LINKS) -->
          <!-- ========================================== -->
          <div v-if="activeTab === 'links'" class="space-y-6">

            <!-- 1.0 TELEFONDAN PAYLAŞILAN BAĞLANTI BANNERI (Web Share Target API) -->
            <div 
              v-if="sharedTargetBanner" 
              class="p-4 rounded-2xl bg-[#FFFF00]/10 border-2 border-[#FFFF00] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xl shadow-yellow-500/10 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[#FFFF00] flex items-center justify-center text-black shrink-0">
                  <Share2 class="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-xs font-bold text-white">Telefondan Paylaşılan Bağlantı Yakalandı!</h4>
                    <span class="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#FFFF00] text-black uppercase">Web Share Target</span>
                  </div>
                  <p class="text-[11px] text-slate-300 font-mono truncate max-w-md mt-0.5">
                    {{ sharedTargetBanner.title }} • {{ sharedTargetBanner.url }}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                @click="sharedTargetBanner = null" 
                class="px-3.5 py-1.5 rounded-xl bg-[#FFFF00] hover:bg-[#EEFF00] text-black font-bold text-xs transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                Anladım
              </button>
            </div>

            <!-- 1.05 AKILLI TAVSİYELER & İÇGÖRÜLER (Smart Insights Rule Engine) -->
            <div 
              v-if="smartInsights.length > 0"
              :class="['border rounded-2xl p-4 transition-colors relative overflow-hidden', themeClasses.cardBg]"
            >
              <div class="flex items-center justify-between pb-2.5 mb-3 border-b" :class="themeClasses.headerBorder">
                <div class="flex items-center gap-2">
                  <Lightbulb class="w-4 h-4 text-[#FFFF00]" />
                  <h3 :class="['text-xs font-bold tracking-tight', themeClasses.titleText]">
                    Akıllı Tıklama Tavsiyeleri & İçgörüler
                  </h3>
                  <span class="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/30 uppercase">
                    Kural Motoru
                  </span>
                </div>
                <button 
                  type="button" 
                  @click="loadSmartInsights" 
                  class="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isLoadingInsights }" />
                  <span>Yenile</span>
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div 
                  v-for="insight in smartInsights" 
                  :key="insight.id"
                  class="p-3 rounded-xl border flex flex-col justify-between transition-all"
                  :class="adminTheme === 'light' ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#181818] border-[#282828]'"
                >
                  <div class="space-y-1 mb-2.5">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap v-if="insight.icon === 'Zap'" class="w-3.5 h-3.5 text-[#FFFF00]" />
                        <Trophy v-else-if="insight.icon === 'Trophy'" class="w-3.5 h-3.5 text-amber-400" />
                        <Sparkles v-else class="w-3.5 h-3.5 text-cyan-400" />
                        <span>{{ insight.title }}</span>
                      </span>
                      <span 
                        class="text-[9px] font-mono px-1.5 py-0.2 rounded-md uppercase font-bold"
                        :class="insight.priority === 'high' ? 'bg-rose-500/20 text-rose-300' : 'bg-yellow-500/20 text-yellow-300'"
                      >
                        {{ insight.priority === 'high' ? 'Önemli' : 'Tavsiye' }}
                      </span>
                    </div>
                    <p :class="['text-[11px] leading-relaxed', themeClasses.subText]">
                      {{ insight.message }}
                    </p>
                  </div>
                  <button 
                    type="button"
                    @click="applyInsightAction(insight)"
                    class="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>{{ insight.actionLabel }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 1.08 AI COPILOT: OTOMATİK BİO & BUTON BAŞLIĞI ASİSTANI -->
            <div :class="['border rounded-2xl p-5 transition-colors space-y-4', themeClasses.cardBg]">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b" :class="themeClasses.headerBorder">
                <div>
                  <h3 :class="['text-xs font-bold flex items-center gap-2', themeClasses.titleText]">
                    <Bot class="w-4 h-4 text-emerald-400" />
                    <span>AI Copilot: Hedefe Özel Bio & Buton Başlığı Üretimi</span>
                    <span class="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                      Local AI
                    </span>
                  </h3>
                  <p :class="['text-[11px] mt-0.5', themeClasses.subText]">
                    Amacınızı yazın; yapay zeka hedefinize göre optimize edilmiş biyografi ve dikkat çekici buton başlıkları üretsin.
                  </p>
                </div>
              </div>

              <!-- Hedef Giriş Alanı -->
              <div class="flex flex-col sm:flex-row items-center gap-2.5">
                <div class="relative w-full">
                  <input 
                    id="ai-copilot-input"
                    v-model="copilotGoal"
                    type="text" 
                    placeholder="Örn: Yazılımcıyım, projelerimi ve GitHub çalışmalarımı öne çıkar..."
                    @keyup.enter="handleGenerateCopilot"
                    :class="['w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-xs transition-colors', themeClasses.inputBg]"
                  />
                </div>
                <button 
                  type="button"
                  @click="handleGenerateCopilot"
                  :disabled="isGeneratingCopilot || !copilotGoal.trim()"
                  class="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-black transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-md"
                >
                  <Sparkles class="w-3.5 h-3.5" :class="{ 'animate-spin': isGeneratingCopilot }" />
                  <span>{{ isGeneratingCopilot ? 'Üretiliyor...' : 'Yapay Zeka ile Üret' }}</span>
                </button>
              </div>

              <!-- AI Copilot Çıktıları -->
              <div v-if="copilotData" class="space-y-4 pt-1 animate-in fade-in duration-300">
                <!-- Önerilen Biyografiler -->
                <div>
                  <div class="text-[11px] font-bold text-white mb-2 flex items-center gap-1.5">
                    <span>✨ Hedefinize Göre Optimize Biyografiler (3 Alternatif):</span>
                    <span class="text-[9px] font-mono text-emerald-400">({{ copilotData.inferredTopic }})</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div 
                      v-for="(b, i) in copilotData.bios" 
                      :key="i"
                      class="p-3 rounded-xl border flex flex-col justify-between"
                      :class="adminTheme === 'light' ? 'bg-white border-slate-200' : 'bg-[#181818] border-[#282828]'"
                    >
                      <div>
                        <div class="flex items-center justify-between mb-1.5">
                          <span class="text-[10px] font-bold text-slate-300">{{ b.headline }}</span>
                          <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/30 text-emerald-400 border border-emerald-500/20">{{ b.badge }}</span>
                        </div>
                        <p class="text-xs text-white leading-relaxed mb-3">
                          {{ b.text }}
                        </p>
                      </div>
                      <button 
                        type="button"
                        @click="applyCopilotBio(b.text)"
                        class="w-full py-1 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>Profilime Uygula</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Önerilen Buton Başlıkları -->
                <div>
                  <div class="text-[11px] font-bold text-white mb-2">
                    🎯 Yüksek Tıklama Oranlı (CTR) Buton Başlıkları:
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div 
                      v-for="(btn, i) in copilotData.buttonTitles" 
                      :key="i"
                      class="p-2.5 rounded-xl border flex items-center justify-between gap-3"
                      :class="adminTheme === 'light' ? 'bg-white border-slate-200' : 'bg-[#181818] border-[#282828]'"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="text-xs font-bold text-white truncate">{{ btn.title }}</div>
                        <div class="text-[10px] text-slate-400 truncate">{{ btn.description }}</div>
                      </div>
                      <button 
                        type="button"
                        @click="addCopilotLink(btn)"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black transition-all active:scale-95 cursor-pointer shrink-0"
                      >
                        + Ekle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Yeni Link Ekle Butonu / Formu -->
            <div>
              <button 
                v-if="!isAdding" 
                @click="isAdding = true"
                class="w-full py-4 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-lg shadow-yellow-500/20 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Plus class="w-4 h-4 stroke-[3]" />
                <span>Yeni Bağlantı Ekle</span>
              </button>

              <!-- Ekleme Formu -->
              <form 
                v-else 
                @submit.prevent="handleAddLink" 
                :class="[
                  'border rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in duration-200 transition-colors',
                  themeClasses.cardBg,
                  adminTheme === 'dark' ? 'border-[#FFFF00]/40' : 'border-yellow-400 shadow-yellow-50'
                ]"
              >
                <div :class="['flex items-center justify-between pb-3 border-b', themeClasses.headerBorder]">
                  <h3 :class="['text-sm font-semibold flex items-center gap-2', themeClasses.titleText]">
                    <Sparkles class="w-4 h-4 text-[#FFFF00]" />
                    <span>Yeni Bağlantı Tanımla</span>
                  </h3>
                  <button 
                    type="button" 
                    @click="isAdding = false" 
                    :class="['text-xs hover:underline', themeClasses.subText]"
                  >
                    Vazgeç
                  </button>
                </div>

                <div class="space-y-3.5">
                  <div>
                    <label :class="['block text-xs font-medium mb-1', themeClasses.inputLabel]">Bağlantı Başlığı</label>
                    <input 
                      v-model="newLink.title" 
                      type="text" 
                      placeholder="Örn: Portfolyo Sitem veya YouTube Kanalım" 
                      required
                      :class="['w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-sm transition-colors', themeClasses.inputBg]"
                    />
                  </div>
                  <div>
                    <label :class="['block text-xs font-medium mb-1', themeClasses.inputLabel]">Hedef URL</label>
                    <input 
                      v-model="newLink.url" 
                      type="text" 
                      placeholder="https://... veya domain.com" 
                      required
                      :class="[
                        'w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-sm transition-colors',
                        urlError ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5' : themeClasses.inputBg
                      ]"
                    />
                    <p v-if="urlError" class="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-medium">
                      <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                      <span>{{ urlError }}</span>
                    </p>
                  </div>

                  <!-- İkon Seçimi -->
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label :class="['block text-xs font-medium', themeClasses.inputLabel]">İkon Seçimi</label>
                      <span class="text-[10px] font-semibold" :class="adminTheme === 'light' ? 'text-amber-800 font-bold' : 'text-[#FFFF00]'">
                        {{ AVAILABLE_ICONS.find(i => i.id === newLink.icon)?.name || 'Otomatik' }}
                      </span>
                    </div>
                    <div :class="['grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-2 rounded-xl border transition-colors', themeClasses.boxInner]">
                      <button 
                        v-for="iconItem in AVAILABLE_ICONS" 
                        :key="iconItem.id"
                        type="button"
                        @click="newLink.icon = iconItem.id"
                        :title="iconItem.name"
                        class="flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-all"
                        :class="newLink.icon === iconItem.id 
                          ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20 scale-105' 
                          : (adminTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-white')"
                      >
                        <component :is="getIconComponent(iconItem.icon)" class="w-4 h-4 mb-0.5" />
                        <span class="text-[9px] truncate max-w-[45px] leading-tight">{{ iconItem.name.split(' ')[0] }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- A/B Bölünmüş Testi (Split Testing) -->
                  <div v-if="!newLink.isHeader" class="p-3 rounded-xl border transition-all" :class="newLink.abTestEnabled ? 'bg-violet-500/10 border-violet-500/30' : themeClasses.boxInner">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <Split class="w-4 h-4 text-violet-400" />
                        <div>
                          <div class="text-xs font-bold" :class="themeClasses.titleText">A/B Testi Altyapısı (Split Testing)</div>
                          <p class="text-[10px] mt-0.5" :class="themeClasses.subText">Ziyaretçilerin %50'sine A, %50'sine B varyantı gösterilir ve tıklanma başarısı ölçülür.</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        @click="newLink.abTestEnabled = !newLink.abTestEnabled"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer"
                        :class="newLink.abTestEnabled ? 'bg-violet-500 text-white border-violet-400' : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'"
                      >
                        {{ newLink.abTestEnabled ? 'Açık' : 'Etkinleştir' }}
                      </button>
                    </div>

                    <div v-if="newLink.abTestEnabled" class="mt-3 pt-2.5 border-t border-violet-500/20 space-y-2.5">
                      <div>
                        <label class="block text-[11px] font-semibold text-violet-300 mb-1">Alternatif Başlık B (Variant B)</label>
                        <input 
                          v-model="newLink.titleB" 
                          type="text" 
                          placeholder="Örn: YouTube Kanalıma Göz Atın" 
                          class="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none"
                          :class="themeClasses.inputBg"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-semibold text-violet-300 mb-1">Alternatif Hedef URL B (İsteğe Bağlı)</label>
                        <input 
                          v-model="newLink.urlB" 
                          type="text" 
                          placeholder="https://... (boş bırakılırsa ana URL kullanılır)" 
                          class="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none"
                          :class="themeClasses.inputBg"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Özel Buton Rengi & Stili -->
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label :class="['block text-xs font-medium', themeClasses.inputLabel]">Özel Buton Rengi & Stili</label>
                      <span class="text-[10px] font-semibold" :class="adminTheme === 'light' ? 'text-amber-800 font-bold' : 'text-[#FFFF00]'">
                        {{ BUTTON_STYLES.find(s => s.id === newLink.customColor)?.name || 'Tema Varsayılanı' }}
                      </span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button 
                        v-for="styleItem in BUTTON_STYLES" 
                        :key="styleItem.id"
                        type="button"
                        @click="newLink.customColor = styleItem.id"
                        class="flex items-center gap-2 p-2 rounded-xl border text-left transition-all"
                        :class="newLink.customColor === styleItem.id 
                          ? (adminTheme === 'light' ? 'border-yellow-400 bg-yellow-100/70 shadow-sm ring-1 ring-yellow-400 text-black font-bold' : 'border-[#FFFF00] bg-[#FFFF00]/15 shadow-sm ring-1 ring-[#FFFF00]') 
                          : themeClasses.colorBtnInactive"
                      >
                        <div 
                          class="w-3.5 h-3.5 rounded-full bg-gradient-to-r flex-shrink-0 border"
                          :class="[styleItem.previewGradient, styleItem.borderStyle]"
                        ></div>
                        <span :class="['text-[11px] font-medium truncate', themeClasses.colorBtnText]">{{ styleItem.name }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Kategori & Klasör Seçimi (Faz 19) -->
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label :class="['block text-xs font-medium flex items-center gap-1.5', themeClasses.inputLabel]">
                        <Folder class="w-3.5 h-3.5 text-amber-400" />
                        <span>Kategori / Klasör (Akordeon Gruplama)</span>
                      </label>
                      <span v-if="newLink.category" class="text-[10px] font-semibold text-amber-400 truncate max-w-[150px]">
                        📁 {{ newLink.category }}
                      </span>
                      <span v-else :class="['text-[10px]', themeClasses.subText]">
                        Bağımsız Bağlantı
                      </span>
                    </div>

                    <!-- Hızlı Kategori Çipleri -->
                    <div class="flex flex-wrap gap-1.5 mb-2">
                      <button
                        type="button"
                        @click="newLink.category = ''"
                        class="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all"
                        :class="!newLink.category 
                          ? (adminTheme === 'light' ? 'bg-slate-800 text-white border-slate-900 font-bold' : 'bg-neutral-800 text-white border-neutral-600') 
                          : (adminTheme === 'dark' ? 'bg-[#141414] border-[#282828] text-neutral-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900')"
                      >
                        Yok (Bağımsız)
                      </button>
                      <button
                        v-for="cat in allCategories"
                        :key="cat"
                        type="button"
                        @click="newLink.category = cat"
                        class="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1"
                        :class="newLink.category === cat 
                          ? (adminTheme === 'light' ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold' : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold') 
                          : (adminTheme === 'dark' ? 'bg-[#141414] border-[#282828] text-neutral-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900')"
                      >
                        <span>{{ cat }}</span>
                      </button>
                    </div>

                    <!-- Serbest Kategori Adı Girişi -->
                    <input
                      v-model="newLink.category"
                      type="text"
                      placeholder="Veya yeni bir klasör adı yazın (örn: 🎨 Tasarımlarım)..."
                      :class="['w-full px-3 py-1.5 rounded-xl border text-xs focus:outline-none transition-colors', themeClasses.inputBg]"
                    />
                  </div>

                  <!-- Zaman Ayarlı / Süresi Dolan Bağlantı (Zamanlama & Geri Sayım) -->
                  <div :class="['p-3.5 rounded-xl border space-y-3 transition-colors', themeClasses.boxInner]">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <Clock class="w-4 h-4 text-[#FFFF00]" />
                        <div>
                          <label :class="['text-xs font-semibold block cursor-pointer select-none', themeClasses.titleText]" @click="newLink.isScheduled = !newLink.isScheduled">
                            Zaman Ayarlı & Süresi Dolan Bağlantı
                          </label>
                          <p :class="['text-[10px]', themeClasses.subText]">Belirli bir tarihte yayına girsin veya süresi dolunca otomatik gizlensin</p>
                        </div>
                      </div>
                      <!-- iOS Toggle Switch -->
                      <button 
                        type="button"
                        @click="newLink.isScheduled = !newLink.isScheduled"
                        class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                        :class="newLink.isScheduled ? 'bg-amber-400' : 'bg-slate-400/40'"
                      >
                        <span 
                          class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                          :class="newLink.isScheduled ? 'translate-x-4' : 'translate-x-0'"
                        ></span>
                      </button>
                    </div>

                    <div v-if="newLink.isScheduled" class="space-y-3 pt-2 border-t border-dashed" :class="themeClasses.headerBorder">
                      <!-- Hızlı Süre Önayarları (Presets) -->
                      <div>
                        <div class="flex items-center justify-between mb-1.5">
                          <span :class="['text-[10px] font-medium', themeClasses.inputLabel]">Hızlı Süre Tanımla (Preset):</span>
                          <span class="text-[10px] text-amber-400 font-semibold">Şu andan itibaren</span>
                        </div>
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <button 
                            type="button" 
                            @click="applyPresetToNewLink(24)"
                            class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
                            :class="adminTheme === 'dark' ? 'bg-[#181818] border-[#333] hover:border-[#FFFF00] text-slate-300 hover:text-white' : 'bg-white border-slate-300 hover:border-yellow-400 text-slate-700'"
                          >
                            ⏳ +24 Saat (1 Gün)
                          </button>
                          <button 
                            type="button" 
                            @click="applyPresetToNewLink(72)"
                            class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
                            :class="adminTheme === 'dark' ? 'bg-[#181818] border-[#333] hover:border-[#FFFF00] text-slate-300 hover:text-white' : 'bg-white border-slate-300 hover:border-yellow-400 text-slate-700'"
                          >
                            ⏳ +3 Gün
                          </button>
                          <button 
                            type="button" 
                            @click="applyPresetToNewLink(168)"
                            class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
                            :class="adminTheme === 'dark' ? 'bg-[#181818] border-[#333] hover:border-[#FFFF00] text-slate-300 hover:text-white' : 'bg-white border-slate-300 hover:border-yellow-400 text-slate-700'"
                          >
                            ⏳ +1 Hafta (7 Gün)
                          </button>
                        </div>
                      </div>

                      <!-- Başlangıç ve Bitiş Tarihleri -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label :class="['block text-[11px] font-medium mb-1', themeClasses.inputLabel]">Başlangıç Tarihi (İsteğe bağlı)</label>
                          <input 
                            v-model="newLink.scheduleStart" 
                            type="datetime-local" 
                            :class="['w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-colors', themeClasses.inputBg]"
                          />
                          <p :class="['text-[10px] mt-0.5', themeClasses.subText]">Boş bırakılırsa hemen yayına girer</p>
                        </div>
                        <div>
                          <label :class="['block text-[11px] font-medium mb-1', themeClasses.inputLabel]">Bitiş Tarihi / Yayından Kaldırılma</label>
                          <input 
                            v-model="newLink.scheduleEnd" 
                            type="datetime-local" 
                            :class="['w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-colors', themeClasses.inputBg]"
                          />
                          <p :class="['text-[10px] mt-0.5', themeClasses.subText]">Süre bitince ziyaretçilere otomatik gizlenir</p>
                        </div>
                      </div>

                      <!-- Canlı Geri Sayım Rozeti Göster Toggle -->
                      <div class="flex items-center justify-between pt-1">
                        <div class="flex items-center gap-1.5">
                          <Timer class="w-3.5 h-3.5 text-amber-400" />
                          <span :class="['text-[11px] font-medium', themeClasses.titleText]">Ziyaretçi Kartında Canlı Geri Sayım Göster (⏳ Kalan Süre)</span>
                        </div>
                        <input 
                          v-model="newLink.showCountdown" 
                          type="checkbox" 
                          class="w-4 h-4 rounded text-amber-400 focus:ring-amber-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Akıllı Medya Embed Algılama ve Mini Oynatıcı (Spotify, YouTube, SoundCloud) -->
                  <div :class="['p-3.5 rounded-xl border space-y-2.5 transition-colors', themeClasses.boxInner]">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <Play class="w-4 h-4 text-purple-400" />
                        <div>
                          <label :class="['text-xs font-semibold block cursor-pointer select-none', themeClasses.titleText]" @click="newLink.showEmbed = !newLink.showEmbed">
                            {{ detectedNewLinkEmbed.providerName ? `${detectedNewLinkEmbed.providerName} Mini Oynatıcı (Embed Player)` : 'Medya Mini Oynatıcı (Embed Player)' }}
                          </label>
                          <p :class="['text-[10px]', themeClasses.subText]">
                            Ziyaretçiler sayfadan ayrılmadan mini oynatıcı ile dinleyebilir / izleyebilir
                          </p>
                        </div>
                      </div>
                      <!-- iOS Toggle Switch -->
                      <button 
                        type="button"
                        @click="newLink.showEmbed = !newLink.showEmbed"
                        class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                        :class="newLink.showEmbed ? 'bg-purple-500' : 'bg-slate-400/40'"
                      >
                        <span 
                          class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                          :class="newLink.showEmbed ? 'translate-x-4' : 'translate-x-0'"
                        ></span>
                      </button>
                    </div>

                    <div v-if="newLink.showEmbed" class="space-y-2.5 pt-2 border-t border-dashed" :class="themeClasses.headerBorder">
                      <div v-if="detectedNewLinkEmbed.type !== 'none'" class="flex items-center gap-2 text-[11px] text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                        <span class="font-bold">✨ Otomatik Algılandı:</span>
                        <span>{{ detectedNewLinkEmbed.providerName }} Oynatıcısı</span>
                      </div>
                      <div v-else class="text-[11px] text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                        <span>ℹ️ Desteklenen platformlar: YouTube (video/shorts), Spotify (şarkı/albüm/playlist), SoundCloud.</span>
                      </div>
                    </div>
                  </div>

                  <!-- Kilitli Bağlantı (PIN Şifresi / 18+ Yaş Doğrulaması) -->
                  <div :class="['p-3.5 rounded-xl border space-y-3 transition-colors', themeClasses.boxInner]">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <Lock class="w-4 h-4 text-rose-400" />
                        <div>
                          <label :class="['text-xs font-semibold block cursor-pointer select-none', themeClasses.titleText]" @click="newLink.isLocked = !newLink.isLocked">
                            Kilitli Bağlantı (PIN / 18+ Erişim Koruması)
                          </label>
                          <p :class="['text-[10px]', themeClasses.subText]">
                            Ziyaretçinin tıklamadan önce PIN kodu veya yaş onayı vermesini şart koşar
                          </p>
                        </div>
                      </div>
                      <!-- iOS Toggle Switch -->
                      <button 
                        type="button"
                        @click="newLink.isLocked = !newLink.isLocked"
                        class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                        :class="newLink.isLocked ? 'bg-rose-500' : 'bg-slate-400/40'"
                      >
                        <span 
                          class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                          :class="newLink.isLocked ? 'translate-x-4' : 'translate-x-0'"
                        ></span>
                      </button>
                    </div>

                    <div v-if="newLink.isLocked" class="space-y-3 pt-2 border-t border-dashed" :class="themeClasses.headerBorder">
                      <!-- Kilit Türü Seçimi -->
                      <div>
                        <label :class="['block text-[11px] font-medium mb-1.5', themeClasses.inputLabel]">Kilit Türü</label>
                        <div class="grid grid-cols-2 gap-2">
                          <button 
                            type="button"
                            @click="newLink.lockType = 'pin'"
                            class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all"
                            :class="newLink.lockType === 'pin' 
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold' 
                              : (adminTheme === 'dark' ? 'bg-[#181818] border-[#333] text-neutral-400' : 'bg-white border-slate-200 text-slate-600')"
                          >
                            <Key class="w-3.5 h-3.5" />
                            <span>4 Haneli PIN Kodu</span>
                          </button>
                          <button 
                            type="button"
                            @click="newLink.lockType = 'age'"
                            class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all"
                            :class="newLink.lockType === 'age' 
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold' 
                              : (adminTheme === 'dark' ? 'bg-[#181818] border-[#333] text-neutral-400' : 'bg-white border-slate-200 text-slate-600')"
                          >
                            <ShieldAlert class="w-3.5 h-3.5" />
                            <span>18+ Yaş Doğrulaması</span>
                          </button>
                        </div>
                      </div>

                      <!-- PIN Kodu Girişi -->
                      <div v-if="newLink.lockType === 'pin'">
                        <label :class="['block text-[11px] font-medium mb-1', themeClasses.inputLabel]">Erişim PIN Kodu</label>
                        <input 
                          v-model="newLink.passcode" 
                          type="text" 
                          maxlength="10" 
                          placeholder="Örn: 1234 veya 2026"
                          :class="['w-full px-3 py-2 rounded-xl border text-xs tracking-widest font-mono focus:outline-none transition-colors', themeClasses.inputBg]"
                        />
                        <p :class="['text-[10px] mt-0.5', themeClasses.subText]">Ziyaretçi bu PIN'i girmeden hedefe yönlendirilmez</p>
                      </div>

                      <!-- İsteğe Bağlı Kilit Uyarısı -->
                      <div>
                        <label :class="['block text-[11px] font-medium mb-1', themeClasses.inputLabel]">Kilit Açıklaması / Uyarısı (İsteğe bağlı)</label>
                        <input 
                          v-model="newLink.lockWarning" 
                          type="text" 
                          placeholder="Örn: Bu bağlantı sadece katılımcılara özeldir."
                          :class="['w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-colors', themeClasses.inputBg]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-2 pt-3">
                  <button 
                    type="button" 
                    @click="isAdding = false" 
                    :class="['px-4 py-2 rounded-xl text-xs font-medium transition-colors', themeClasses.btnGhost]"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit" 
                    class="px-5 py-2 rounded-xl text-xs font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black transition-colors shadow-md shadow-yellow-500/20"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>

            <!-- Bağlantı Listesi (Linktree Card Layout) -->
            <section class="space-y-3">
              <div class="flex items-center justify-between px-1">
                <div class="flex items-center gap-2">
                  <h2 :class="['text-xs font-semibold uppercase tracking-wider flex items-center gap-2', themeClasses.subText]">
                    <span>Kayıtlı Bağlantılar</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/20">
                      {{ links.length }}
                    </span>
                  </h2>
                  <span class="hidden sm:inline-block text-[11px] text-slate-500 italic">
                    (Sürükle-bırak ile sıralayabilirsiniz)
                  </span>
                </div>

                <button 
                  v-if="totalClicks > 0"
                  @click="handleResetAllClicks"
                  :class="['text-[11px] flex items-center gap-1 transition-colors', adminTheme === 'dark' ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600']"
                  title="Tüm tıklamaları sıfırla"
                >
                  <RotateCcw class="w-3 h-3" />
                  <span>Tıklamaları Sıfırla</span>
                </button>
              </div>

              <!-- Ziyaretçi Sayfasında Klasörlü Gruplama Kontrolü -->
              <div class="p-3.5 rounded-2xl border transition-all space-y-3"
                :class="profile.groupByCategory 
                  ? (adminTheme === 'light' ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-500/10 border-amber-500/25') 
                  : (adminTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#141414] border-[#222]')">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                      :class="profile.groupByCategory 
                        ? (adminTheme === 'light' ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400')
                        : (adminTheme === 'light' ? 'bg-slate-200 text-slate-600' : 'bg-neutral-800 text-neutral-400')">
                      <Folder class="w-4 h-4" />
                    </div>
                    <div>
                      <div class="text-xs font-bold flex items-center gap-2" :class="themeClasses.titleText">
                        <span>Profilde Kategorilere Göre Klasörle</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                          :class="profile.groupByCategory 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'">
                          {{ profile.groupByCategory ? 'Açık (Akordeon Klasörler)' : 'Kapalı (Klasik Düz Liste)' }}
                        </span>
                      </div>
                      <p class="text-[11px] mt-0.5" :class="themeClasses.subText">
                        {{ profile.groupByCategory 
                          ? 'Bağlantılar ziyaretçilere kategorilerine göre açılır-kapanır akordeon klasörler altında toplanarak sunulur.' 
                          : 'Bağlantılar ziyaretçilere klasik Linktree tarzında doğrudan bağımsız şık butonlar olarak listelenir.' }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <span class="text-[11px] font-semibold hidden sm:inline" :class="themeClasses.subText">
                      {{ profile.groupByCategory ? 'Klasörleri Kapat' : 'Klasörleri Aç' }}
                    </span>
                    <button
                      type="button"
                      @click="handleToggleGroupByCategory"
                      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      :class="profile.groupByCategory ? 'bg-[#FFFF00]' : (adminTheme === 'light' ? 'bg-slate-300' : 'bg-neutral-800')"
                      role="switch"
                      :aria-checked="!!profile.groupByCategory"
                    >
                      <span
                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out"
                        :class="[
                          profile.groupByCategory ? 'translate-x-5 bg-black' : 'translate-x-0 bg-neutral-400'
                        ]"
                      />
                    </button>
                  </div>
                </div>

                <!-- Gruplama Formatı (Akordeon vs Bölüm Başlıkları) -->
                <div v-if="profile.groupByCategory" class="pt-2.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs" :class="adminTheme === 'light' ? 'border-amber-200/60' : 'border-amber-500/20'">
                  <span class="text-[11px] font-medium" :class="themeClasses.subText">
                    Gruplama Görünüm Formatı:
                  </span>
                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      @click="linkStore.updateProfile({ groupStyle: 'accordion' })"
                      class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer"
                      :class="profile.groupStyle !== 'headers'
                        ? 'bg-amber-400 text-black font-bold border-amber-500 shadow-xs'
                        : (adminTheme === 'light' ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-[#181818] border-[#333] text-neutral-400 hover:text-white')"
                    >
                      📁 Akordeon Klasörleri
                    </button>
                    <button
                      type="button"
                      @click="linkStore.updateProfile({ groupStyle: 'headers' })"
                      class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer"
                      :class="profile.groupStyle === 'headers'
                        ? 'bg-amber-400 text-black font-bold border-amber-500 shadow-xs'
                        : (adminTheme === 'light' ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-[#181818] border-[#333] text-neutral-400 hover:text-white')"
                    >
                      ✦ Bölüm Başlıkları (Ayraçlar)
                    </button>
                  </div>
                </div>

                <!-- Yönetici Paneli Klasör Açılış Durumu Ayarı (Yalnızca Klasörleme Açıkken) -->
                <div v-if="profile.groupByCategory" class="pt-2.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs" :class="adminTheme === 'light' ? 'border-amber-200/60' : 'border-amber-500/20'">
                  <span class="text-[11px] font-medium" :class="themeClasses.subText">
                    Ziyaretçi Sayfasında Klasörlerin Başlangıç Durumu:
                  </span>
                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      @click="handleSetFoldersDefaultExpanded(true)"
                      class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer"
                      :class="profile.foldersDefaultExpanded !== false
                        ? 'bg-amber-400 text-black font-bold border-amber-500 shadow-xs'
                        : (adminTheme === 'light' ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-[#181818] border-[#333] text-neutral-400 hover:text-white')"
                    >
                      Tümünü Açık Başlat
                    </button>
                    <button
                      type="button"
                      @click="handleSetFoldersDefaultExpanded(false)"
                      class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer"
                      :class="profile.foldersDefaultExpanded === false
                        ? 'bg-amber-400 text-black font-bold border-amber-500 shadow-xs'
                        : (adminTheme === 'light' ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-[#181818] border-[#333] text-neutral-400 hover:text-white')"
                    >
                      Daraltılmış (Kapalı) Başlat
                    </button>
                  </div>
                </div>
              </div>

              <!-- Kategori Filtre Çubuğu (Faz 19) -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  @click="selectedAdminCategory = 'all'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer"
                  :class="selectedAdminCategory === 'all'
                    ? 'bg-[#FFFF00] text-black font-bold border-yellow-300 shadow-sm'
                    : (adminTheme === 'dark' ? 'bg-[#181818] border-[#282828] text-neutral-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900')"
                >
                  <span>Tümü</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px]" :class="selectedAdminCategory === 'all' ? 'bg-black text-[#FFFF00]' : 'bg-neutral-800 text-neutral-400'">
                    {{ links.length }}
                  </span>
                </button>

                <button
                  v-for="catItem in activeCategoriesWithCount"
                  :key="catItem.name"
                  type="button"
                  @click="selectedAdminCategory = catItem.name"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer"
                  :class="selectedAdminCategory === catItem.name
                    ? (adminTheme === 'light' ? 'bg-amber-400 text-black font-bold border-amber-500' : 'bg-amber-400/20 text-amber-300 border-amber-400 font-bold')
                    : (adminTheme === 'dark' ? 'bg-[#181818] border-[#282828] text-neutral-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900')"
                >
                  <Folder class="w-3 h-3 text-amber-400" />
                  <span>{{ catItem.name }}</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px]" :class="selectedAdminCategory === catItem.name ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-neutral-400'">
                    {{ catItem.count }}
                  </span>
                </button>

                <button
                  v-if="uncategorizedCount > 0"
                  type="button"
                  @click="selectedAdminCategory = '__uncategorized__'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer"
                  :class="selectedAdminCategory === '__uncategorized__'
                    ? 'bg-neutral-700 text-white font-bold border-neutral-500'
                    : (adminTheme === 'dark' ? 'bg-[#181818] border-[#282828] text-neutral-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900')"
                >
                  <span>Bağımsız</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-800 text-neutral-400">
                    {{ uncategorizedCount }}
                  </span>
                </button>
              </div>

              <!-- Kartlar (HTML5 Sürükle-Bırak Destekli) -->
              <div 
                v-for="(link, index) in filteredAdminLinks" 
                :key="link.id" 
                draggable="true"
                @dragstart="handleDragStart($event, index)"
                @dragover="handleDragOver($event, index)"
                @dragleave="handleDragLeave($event, index)"
                @drop="handleDrop($event, index)"
                @dragend="handleDragEnd"
                :class="[
                  'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-default',
                  themeClasses.linkCard,
                  { 'opacity-60': !link.isActive },
                  draggedIndex === index ? 'opacity-30 scale-[0.98] ring-2 ring-cyan-500 border-dashed bg-cyan-500/5' : '',
                  dragOverIndex === index && draggedIndex !== index ? 'ring-2 ring-cyan-400 border-cyan-400 scale-[1.01] bg-cyan-500/10 shadow-lg' : ''
                ]"
              >
                <!-- Sol: Sürükleme Noktaları + İkon + Başlık/URL + Rozetler -->
                <div class="flex items-center gap-3.5 min-w-0 flex-1">
                  
                  <!-- Linktree Sürükleme Tutamacı (Grip Dots) & Sıralama -->
                  <div class="flex items-center gap-1 flex-shrink-0 text-slate-400">
                    <div 
                      title="Sürükleyip bırakarak sırayı değiştirin" 
                      class="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                    >
                      <GripVertical class="w-4 h-4 opacity-60 group-hover:opacity-100" />
                    </div>
                    <div class="flex flex-col items-center">
                      <button 
                        type="button"
                        @click.stop="handleMoveUp(index)"
                        :disabled="index === 0"
                        title="Yukarı Taşı"
                        class="p-0.5 hover:text-cyan-400 disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronUp class="w-3 h-3" />
                      </button>
                      <button 
                        type="button"
                        @click.stop="handleMoveDown(index)"
                        :disabled="index === links.length - 1"
                        title="Aşağı Taşı"
                        class="p-0.5 hover:text-cyan-400 disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronDown class="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <!-- İkon -->
                  <div :class="['p-2.5 rounded-xl transition-colors flex-shrink-0', themeClasses.linkIconBox]">
                    <component :is="getLinkIcon(link)" class="w-4 h-4" />
                  </div>

                  <!-- Detaylar -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <p :class="['text-sm font-bold truncate', themeClasses.titleText]">
                        {{ link.title }}
                      </p>

                      <!-- Başlık Ayracı Rozeti -->
                      <span 
                        v-if="link.isHeader"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30"
                      >
                        ✦ BÖLÜM AYRACI / BAŞLIK
                      </span>

                      <!-- A/B Testi Sonuç Rozeti & Karşılaştırması -->
                      <span 
                        v-if="link.abTestEnabled"
                        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-violet-500/15 text-violet-300 border-violet-500/30"
                        :title="'A: ' + (link.clicksA || 0) + ' tık vs B: ' + (link.clicksB || 0) + ' tık'"
                      >
                        <Split class="w-2.5 h-2.5 text-violet-400" />
                        <span>A/B: A({{ link.clicksA || 0 }}) vs B({{ link.clicksB || 0 }})</span>
                        <span class="px-1 py-0.2 rounded text-[9px] bg-violet-500/30 font-black">
                          🏆 {{ (link.clicksB || 0) > (link.clicksA || 0) ? 'B Lider' : (link.clicksA || 0) > (link.clicksB || 0) ? 'A Lider' : 'Eşit' }}
                        </span>
                      </span>

                      <!-- Özel Stil Rozeti -->
                      <span 
                        v-if="link.customColor && link.customColor !== 'default'"
                        :class="[
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border',
                          adminTheme === 'dark' ? 'bg-[#121c2e] text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        ]"
                      >
                        <Palette class="w-2.5 h-2.5" />
                        <span>{{ getStyleName(link.customColor) }}</span>
                      </span>

                      <!-- Tıklanma Rozeti (Linktree Click Counter Badge) -->
                      <span 
                        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-colors cursor-help"
                        :class="adminTheme === 'dark' 
                          ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300' 
                          : 'bg-cyan-50 border-cyan-200 text-cyan-800'"
                        :title="`${link.clicks || 0} toplam ziyaretçi tıklaması${totalClicks > 0 ? ` (Tüm tıklamaların %${Math.round(((link.clicks || 0) / totalClicks) * 100)}'i)` : ''}`"
                      >
                        <MousePointerClick class="w-3 h-3 text-cyan-400" />
                        <span>{{ link.clicks || 0 }} Tık</span>
                        <span 
                          v-if="totalClicks > 0 && link.clicks > 0" 
                          class="text-[9px] px-1 py-0.2 rounded font-mono font-bold"
                          :class="adminTheme === 'dark' ? 'bg-cyan-500/20 text-cyan-200' : 'bg-cyan-200/60 text-cyan-900'"
                        >
                          %{{ Math.round(((link.clicks || 0) / totalClicks) * 100) }}
                        </span>
                      </span>

                      <!-- Zamanlama Rozeti (Scheduled / Countdown / Expired Badge) -->
                      <span 
                        v-if="link.isScheduled"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors"
                        :class="[
                          adminTheme === 'dark' 
                            ? getScheduleStatus(link).badgeClass 
                            : getScheduleStatus(link).lightBadgeClass
                        ]"
                        :title="link.scheduleEnd ? `Bitiş: ${new Date(link.scheduleEnd).toLocaleString('tr-TR')}` : 'Zaman ayarlı'"
                      >
                        <Clock class="w-3 h-3" />
                        <span>{{ getScheduleStatus(link).badgeText || 'Zaman Ayarlı' }}</span>
                      </span>

                      <!-- Kategori / Klasör Rozeti (Faz 19) -->
                      <span 
                        v-if="link.category"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-colors"
                        :class="adminTheme === 'light' 
                          ? 'bg-amber-100/90 text-amber-900 border-amber-300 shadow-2xs' 
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'"
                      >
                        <Folder class="w-3 h-3 text-amber-400" />
                        <span>{{ link.category }}</span>
                      </span>

                      <!-- Medya Embed Rozeti (Spotify / YouTube / SoundCloud) -->
                      <span 
                        v-if="link.showEmbed && link.embedType && link.embedType !== 'none'"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-colors"
                        :class="adminTheme === 'light' 
                          ? 'bg-purple-100/90 text-purple-900 border-purple-300 shadow-2xs' 
                          : 'bg-purple-500/15 text-purple-300 border-purple-500/30'"
                      >
                        <Play class="w-2.5 h-2.5 text-purple-400" />
                        <span>{{ link.embedType === 'youtube' ? 'YouTube Oynatıcı' : link.embedType === 'spotify' ? 'Spotify Oynatıcı' : 'SoundCloud Oynatıcı' }}</span>
                      </span>

                      <!-- Kilitli Bağlantı Rozeti (PIN / 18+) -->
                      <span 
                        v-if="link.isLocked"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-colors"
                        :class="adminTheme === 'light' 
                          ? 'bg-rose-100/90 text-rose-900 border-rose-300 shadow-2xs' 
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'"
                        :title="link.lockType === 'pin' ? `PIN: ${link.passcode || 'Belirtilmedi'}` : '18+ Yaş Doğrulamalı'"
                      >
                        <Lock class="w-2.5 h-2.5 text-rose-400" />
                        <span>{{ link.lockType === 'pin' ? (link.passcode ? `PIN: ${link.passcode}` : 'PIN Korumalı') : '🔞 18+ Korumalı' }}</span>
                      </span>
                    </div>

                    <a 
                      :href="link.url" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      :class="['text-xs flex items-center gap-1 truncate mt-1 hover:underline', themeClasses.subText]"
                    >
                      <span>{{ link.url }}</span>
                      <ExternalLink class="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                </div>

                <!-- Sağ: Linktree iOS-Stil Toggle Switch & Aksiyonlar -->
                <div class="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0" :class="themeClasses.headerBorder">
                  
                  <!-- Linktree iOS-Stil Aktif/Pasif Toggle Switch -->
                  <div class="flex items-center gap-2">
                    <button 
                      type="button"
                      @click="handleToggleLink(link.id)"
                      :title="link.isActive ? 'Bağlantı Yayında (Tıklayarak Gizle)' : 'Bağlantı Gizli (Tıklayarak Yayınla)'"
                      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      :class="link.isActive ? 'bg-emerald-500' : 'bg-slate-400/40'"
                    >
                      <span 
                        aria-hidden="true" 
                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        :class="link.isActive ? 'translate-x-5' : 'translate-x-0'"
                      ></span>
                    </button>
                    <span class="text-[11px] font-medium" :class="link.isActive ? 'text-emerald-400 font-semibold' : themeClasses.subText">
                      {{ link.isActive ? 'Aktif' : 'Gizli' }}
                    </span>
                  </div>

                  <!-- İkincil Butonlar (Düzenle & Sil) -->
                  <div class="flex items-center gap-1">
                    <button 
                      @click="openEditModal(link)"
                      title="Bağlantıyı Düzenle"
                      class="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>

                    <button 
                      @click="handleDeleteLink(link.id)"
                      title="Bağlantıyı Sil"
                      class="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>

              <!-- Boş Liste Durumu -->
              <div v-if="links.length === 0" :class="['text-center py-16 text-sm border-2 border-dashed rounded-3xl p-8', themeClasses.subText, themeClasses.headerBorder]">
                <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center mb-3">
                  <Globe class="w-6 h-6" />
                </div>
                <h4 :class="['text-base font-bold', themeClasses.titleText]">Henüz eklenmiş bağlantı yok</h4>
                <p class="text-xs mt-1 max-w-sm mx-auto">
                  Profilinizi ziyaretçilere açmak için yukarıdaki "Yeni Bağlantı Ekle" butonuna basarak ilk bağlantınızı ekleyin.
                </p>
              </div>
            </section>

          </div>

          <!-- ========================================== -->
          <!-- SEKME 2: GÖRÜNÜM & TEMA (APPEARANCE) -->
          <!-- ========================================== -->
          <div v-else-if="activeTab === 'appearance'" class="space-y-6">
            
            <!-- 1. PROFİL KİMLİĞİ & BAŞLIK (Profile Identity) -->
            <div :class="['border rounded-2xl p-6 transition-colors', themeClasses.cardBg]">
              <div :class="['flex items-center justify-between pb-3 mb-5 border-b', themeClasses.headerBorder]">
                <div>
                  <h3 :class="['text-sm font-bold flex items-center gap-2', themeClasses.titleText]">
                    <User class="w-4 h-4 text-cyan-400" />
                    <span>Profil Başlığı & Biyografi</span>
                  </h3>
                  <p :class="['text-xs mt-0.5', themeClasses.subText]">
                    Linktree sayfanızın en üstünde ziyaretçileri karşılayan kimlik bilgileriniz.
                  </p>
                </div>
              </div>

              <form @submit.prevent="handleSaveProfile" class="space-y-4">
                
                <!-- 1.1 PROFİL KAPAĞI (BANNER) & ARKA PLAN DESENLERİ -->
                <div class="space-y-3 pb-5 border-b" :class="themeClasses.headerBorder">
                  <div class="flex items-center justify-between">
                    <div>
                      <label :class="['block text-xs font-bold flex items-center gap-1.5', themeClasses.titleText]">
                        <Layers class="w-3.5 h-3.5" :class="adminTheme === 'light' ? 'text-amber-600' : 'text-[#FFFF00]'" />
                        <span>Profil Kapağı & Banner Deseni</span>
                      </label>
                      <span :class="['text-[11px] block mt-0.5', themeClasses.subText]">
                        Profil sayfanızın ve canlı mobil önizlemenin üstünde sergilenecek estetik kapak alanı.
                      </span>
                    </div>

                    <!-- Aksiyon Butonları: Kapak Yükle / Kaldır -->
                    <div class="flex items-center gap-2">
                      <input 
                        ref="bannerFileInput" 
                        type="file" 
                        accept="image/*" 
                        class="hidden" 
                        @change="handleBannerFileUpload" 
                      />
                      <button 
                        type="button" 
                        @click="triggerBannerUpload"
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                        :class="adminTheme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300' : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'"
                      >
                        <Upload class="w-3 h-3" :class="adminTheme === 'light' ? 'text-amber-700' : 'text-[#FFFF00]'" />
                        <span>Kapak Yükle</span>
                      </button>
                      <button 
                        v-if="profileForm.banner"
                        type="button" 
                        @click="clearBannerImage"
                        class="p-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                        title="Yüklenen kapak görselini kaldır"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- Canlı Kapak Önizleme Kutusu -->
                  <div 
                    class="relative w-full h-28 sm:h-32 rounded-2xl overflow-hidden border shadow-lg flex items-end p-3 transition-all"
                    :class="[
                      themeClasses.headerBorder,
                      'banner-' + (profileForm.bannerPattern || 'mesh')
                    ]"
                  >
                    <img 
                      v-if="profileForm.banner" 
                      :src="profileForm.banner" 
                      alt="Kapak Önizleme" 
                      class="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    
                    <div class="relative z-10 flex items-center justify-between w-full text-white">
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/20 text-[#FFFF00]">
                          {{ profileForm.banner ? 'Özel Görsel Aktif' : 'Hazır Desen Aktif' }}
                        </span>
                        <span class="text-xs font-medium opacity-90 truncate max-w-[180px]">
                          {{ BANNER_PATTERNS.find(p => p.id === profileForm.bannerPattern)?.name || 'Kapak Deseni' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Kapak URL Girişi (Opsiyonel alternatif) -->
                  <div>
                    <input 
                      v-model="profileForm.banner" 
                      type="url" 
                      placeholder="veya doğrudan kapak görseli URL'si girin (https://...)"
                      :class="['w-full px-3 py-1.5 rounded-xl border focus:outline-none text-xs transition-colors', themeClasses.inputBg]"
                    />
                  </div>

                  <!-- Hazır Kapak Şablonları / Desenleri Grid (12 Farklı Desen) -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span :class="['text-[11px] font-medium block', themeClasses.inputLabel]">
                        Hazır Kapak Desenleri & Şablonları (12 Özel Tasarım):
                      </span>
                      <span class="text-[10px] font-semibold" :class="adminTheme === 'light' ? 'text-amber-800 font-bold' : 'text-[#FFFF00]'">
                        {{ BANNER_PATTERNS.find(p => p.id === profileForm.bannerPattern)?.name || 'Kapak Deseni' }}
                      </span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      <button 
                        v-for="pattern in BANNER_PATTERNS" 
                        :key="pattern.id"
                        type="button"
                        @click="selectBannerPattern(pattern.id)"
                        class="p-2 rounded-xl border text-left transition-all group flex flex-col justify-between"
                        :class="profileForm.bannerPattern === pattern.id 
                          ? (adminTheme === 'light' ? 'border-yellow-400 bg-yellow-100/70 shadow-sm ring-1 ring-yellow-400' : 'border-[#FFFF00] bg-[#FFFF00]/10 shadow-md ring-1 ring-[#FFFF00]') 
                          : (adminTheme === 'dark' ? 'border-[#282828] bg-[#141414] hover:border-[#444]' : 'border-slate-200 bg-slate-50 hover:border-slate-300')"
                      >
                        <div 
                          class="w-full h-9 rounded-lg mb-1.5 border border-white/10"
                          :class="pattern.cssClass"
                        ></div>
                        <div class="flex items-center justify-between">
                          <span :class="['text-[11px] font-bold truncate', profileForm.bannerPattern === pattern.id ? (adminTheme === 'light' ? 'text-black font-extrabold' : 'text-[#FFFF00]') : themeClasses.titleText]">
                            {{ pattern.name }}
                          </span>
                          <Check v-if="profileForm.bannerPattern === pattern.id" class="w-3 h-3 shrink-0" :class="adminTheme === 'light' ? 'text-black' : 'text-[#FFFF00]'" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 1.15 ETKİLEŞİMLİ 3D & WEBGL PROFİL DENEYİMİ (Three.js) -->
                <div class="space-y-4 pb-5 border-b" :class="themeClasses.headerBorder">
                  <div class="flex items-center justify-between">
                    <div>
                      <label :class="['block text-xs font-bold flex items-center gap-1.5', themeClasses.titleText]">
                        <Box class="w-3.5 h-3.5 text-[#FFFF00]" />
                        <span>Etkileşimli 3D & WebGL Deneyimi (Three.js)</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/30 uppercase">WebGL 60FPS</span>
                      </label>
                      <span :class="['text-[11px] block mt-0.5', themeClasses.subText]">
                        Ziyaretçilere imleç takip eden 3D maskot, uzay parçacıkları ve yaylanma fiziği sunun.
                      </span>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <!-- 3D Arka Plan Parçacıkları Toggle -->
                    <div 
                      class="p-3.5 rounded-xl border flex items-center justify-between transition-all"
                      :class="profileForm.enable3dBackground 
                        ? (adminTheme === 'light' ? 'bg-yellow-50 border-yellow-300' : 'bg-[#FFFF00]/5 border-[#FFFF00]/40') 
                        : (adminTheme === 'dark' ? 'bg-[#141414] border-[#282828]' : 'bg-slate-50 border-slate-200')"
                    >
                      <div class="space-y-1 pr-3">
                        <div class="flex items-center gap-2">
                          <Sparkles class="w-4 h-4 text-[#FFFF00]" />
                          <span :class="['text-xs font-bold', themeClasses.titleText]">3D Parçacık Arka Planı</span>
                        </div>
                        <p :class="['text-[11px] leading-relaxed', themeClasses.subText]">
                          320 süzülen neon parçacık, takımyıldızı çizgileri ve fare/dokunmatik paralaks derinliği.
                        </p>
                      </div>
                      <button 
                        type="button"
                        @click="profileForm.enable3dBackground = !profileForm.enable3dBackground"
                        class="w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer shrink-0"
                        :class="profileForm.enable3dBackground ? 'bg-[#FFFF00]' : (adminTheme === 'dark' ? 'bg-neutral-800' : 'bg-slate-300')"
                      >
                        <div 
                          class="w-5 h-5 rounded-full bg-black shadow-md transition-transform"
                          :class="profileForm.enable3dBackground ? 'translate-x-6' : 'translate-x-0'"
                        ></div>
                      </button>
                    </div>

                    <!-- Buton Sekme & Yaylanma Fiziği (Spring Physics) Toggle -->
                    <div 
                      class="p-3.5 rounded-xl border flex items-center justify-between transition-all"
                      :class="profileForm.enableSpringPhysics 
                        ? (adminTheme === 'light' ? 'bg-yellow-50 border-yellow-300' : 'bg-[#FFFF00]/5 border-[#FFFF00]/40') 
                        : (adminTheme === 'dark' ? 'bg-[#141414] border-[#282828]' : 'bg-slate-50 border-slate-200')"
                    >
                      <div class="space-y-1 pr-3">
                        <div class="flex items-center gap-2">
                          <Flame class="w-4 h-4 text-amber-500" />
                          <span :class="['text-xs font-bold', themeClasses.titleText]">Sekme & Yaylanma Fiziği</span>
                        </div>
                        <p :class="['text-[11px] leading-relaxed', themeClasses.subText]">
                          Bağlantılara basıldığında fizik tabanlı yaylanma ve dokunsal geri bildirim mikro-etkileşimi.
                        </p>
                      </div>
                      <button 
                        type="button"
                        @click="profileForm.enableSpringPhysics = !profileForm.enableSpringPhysics"
                        class="w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer shrink-0"
                        :class="profileForm.enableSpringPhysics ? 'bg-[#FFFF00]' : (adminTheme === 'dark' ? 'bg-neutral-800' : 'bg-slate-300')"
                      >
                        <div 
                          class="w-5 h-5 rounded-full bg-black shadow-md transition-transform"
                          :class="profileForm.enableSpringPhysics ? 'translate-x-6' : 'translate-x-0'"
                        ></div>
                      </button>
                    </div>
                  </div>

                  <!-- Avatar Görünüm Modu Seçimi -->
                  <div :class="['p-3.5 rounded-xl border', themeClasses.boxInner]">
                    <label :class="['block text-[11px] font-bold mb-2', themeClasses.titleText]">
                      Avatar Sunum Modu:
                    </label>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button 
                        type="button"
                        @click="profileForm.avatarMode = 'switchable'"
                        class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between"
                        :class="profileForm.avatarMode === 'switchable' 
                          ? (adminTheme === 'light' ? 'border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm' : 'border-[#FFFF00] bg-[#FFFF00]/15 text-[#FFFF00] font-bold') 
                          : (adminTheme === 'dark' ? 'border-[#282828] bg-[#141414] text-neutral-300 hover:border-neutral-600' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')"
                      >
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-bold">⚡ Dönüştürülebilir</span>
                          <span class="text-[9px] px-1.5 py-0.2 rounded bg-black/20 font-mono">Önerilen</span>
                        </div>
                        <p class="text-[10px] opacity-80 leading-snug">Ziyaretçi 2D fotoğraf ve 3D maskot arasında tek tıkla geçiş yapabilir.</p>
                      </button>

                      <button 
                        type="button"
                        @click="profileForm.avatarMode = 'mascot'"
                        class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between"
                        :class="profileForm.avatarMode === 'mascot' 
                          ? (adminTheme === 'light' ? 'border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm' : 'border-[#FFFF00] bg-[#FFFF00]/15 text-[#FFFF00] font-bold') 
                          : (adminTheme === 'dark' ? 'border-[#282828] bg-[#141414] text-neutral-300 hover:border-neutral-600' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')"
                      >
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-bold">🤖 3D Siber Maskot</span>
                        </div>
                        <p class="text-[10px] opacity-80 leading-snug">Varsayılan olarak fare ve parmağı takip eden siber kristal maskot açılır.</p>
                      </button>

                      <button 
                        type="button"
                        @click="profileForm.avatarMode = 'photo'"
                        class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between"
                        :class="profileForm.avatarMode === 'photo' 
                          ? (adminTheme === 'light' ? 'border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm' : 'border-[#FFFF00] bg-[#FFFF00]/15 text-[#FFFF00] font-bold') 
                          : (adminTheme === 'dark' ? 'border-[#282828] bg-[#141414] text-neutral-300 hover:border-neutral-600' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')"
                      >
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-bold">👤 Klasik 2D Fotoğraf</span>
                        </div>
                        <p class="text-[10px] opacity-80 leading-snug">Sadece yüklediğiniz profil fotoğrafı gösterilir, 3D buton gizlenir.</p>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 1.2 AVATAR & PROFİL FOTOĞRAFI (Gelişmiş Seçenekler) -->
                <div class="space-y-4 pb-5 border-b" :class="themeClasses.headerBorder">
                  <div class="flex items-center justify-between">
                    <label :class="['block text-xs font-bold flex items-center gap-1.5', themeClasses.titleText]">
                      <Camera class="w-3.5 h-3.5 text-cyan-400" />
                      <span>Avatar / Profil Fotoğrafı & Kişiselleştirme</span>
                    </label>
                    <span class="text-[10px] text-cyan-400 font-semibold">
                      {{ filteredPresetAvatars.length }} Hazır Görsel
                    </span>
                  </div>

                  <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                    <!-- Avatar Önizleme & Yükleme Butonu (Dinamik Şekil ve Glow'lu) -->
                    <div 
                      class="relative group w-20 h-20 flex-shrink-0 cursor-pointer overflow-hidden border-2 shadow-lg transition-all"
                      :class="[
                        adminTheme === 'dark' ? 'border-[#FFFF00]/50 shadow-black' : 'border-yellow-500 shadow-sm',
                        AVATAR_SHAPES.find(s => s.id === profileForm.avatarShape)?.class || 'rounded-full'
                      ]"
                      @click="triggerAvatarUpload"
                    >
                      <img 
                        :src="profileForm.avatar" 
                        alt="Avatar Önizleme" 
                        class="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                        <Upload class="w-4 h-4 text-[#FFFF00] mb-0.5" />
                        <span class="text-[9px] font-bold text-center">Değiştir</span>
                      </div>
                    </div>

                    <div class="flex-1 space-y-2">
                      <div class="flex items-center gap-2">
                        <input 
                          ref="avatarFileInput" 
                          type="file" 
                          accept="image/*" 
                          class="hidden" 
                          @change="handleAvatarFileUpload" 
                        />
                        <button 
                          type="button" 
                          @click="triggerAvatarUpload"
                          class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-xs shadow-yellow-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Upload class="w-3.5 h-3.5 text-black" />
                          <span>Görsel Yükle (Dosya Seç)</span>
                        </button>
                        <span :class="['text-[11px]', themeClasses.subText]">PNG, JPG, WebP (Maks 2MB)</span>
                      </div>

                      <input 
                        v-model="profileForm.avatar" 
                        type="url" 
                        required
                        placeholder="veya görsel URL'si girin: https://images.unsplash.com/..."
                        :class="['w-full px-3.5 py-2 rounded-xl border focus:outline-none text-xs transition-colors', themeClasses.inputBg]"
                      />
                    </div>
                  </div>

                  <!-- Avatar Şekli & Parıltı Seçicileri -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <!-- Şekil Seçici -->
                    <div :class="['p-3 rounded-xl border', themeClasses.boxInner]">
                      <label :class="['block text-[11px] font-bold mb-2', themeClasses.titleText]">
                        Avatar Çerçeve Şekli:
                      </label>
                      <div class="grid grid-cols-3 gap-1.5">
                        <button 
                          v-for="shape in AVATAR_SHAPES" 
                          :key="shape.id"
                          type="button"
                          @click="profileForm.avatarShape = shape.id"
                          class="p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                          :class="profileForm.avatarShape === shape.id 
                            ? (adminTheme === 'light' 
                                ? 'border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm' 
                                : 'border-[#FFFF00] bg-[#FFFF00]/15 text-[#FFFF00] font-bold shadow-xs') 
                            : (adminTheme === 'dark' ? 'border-[#282828] bg-[#141414] text-neutral-400 hover:border-neutral-600' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')"
                        >
                          <div 
                            class="w-6 h-6 border-2 border-current transition-all"
                            :class="shape.class"
                          ></div>
                          <span class="text-[10px] leading-tight">{{ shape.name }}</span>
                        </button>
                      </div>
                    </div>

                    <!-- Parıltı & Glow Seçici -->
                    <div :class="['p-3 rounded-xl border', themeClasses.boxInner]">
                      <label :class="['block text-[11px] font-bold mb-2', themeClasses.titleText]">
                        Avatar Parıltı Rengi (Aura):
                      </label>
                      <div class="grid grid-cols-3 gap-1.5">
                        <button 
                          v-for="glow in AVATAR_GLOW_STYLES" 
                          :key="glow.id"
                          type="button"
                          @click="profileForm.avatarGlow = glow.id"
                          class="p-2 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          :class="profileForm.avatarGlow === glow.id 
                            ? (adminTheme === 'light' 
                                ? 'border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm' 
                                : 'border-[#FFFF00] bg-[#FFFF00]/15 text-[#FFFF00] font-bold shadow-xs') 
                            : (adminTheme === 'dark' ? 'border-[#282828] bg-[#141414] text-neutral-400 hover:border-neutral-600' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')"
                        >
                          <div 
                            class="w-3.5 h-3.5 rounded-full bg-gradient-to-r shadow-xs shrink-0"
                            :class="glow.glowGradient"
                          ></div>
                          <span class="text-[10px] truncate max-w-[60px]">{{ glow.name.split(' ')[0] }}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Genişletilmiş Hazır Avatarlar Galerisi (18 Çeşit + Kategori Filtreli) -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span :class="['text-[11px] font-medium block', themeClasses.inputLabel]">
                        Hazır Avatar Galerisi (18 Tasarım):
                      </span>
                      <!-- Kategori Filtre Butonları -->
                      <div class="flex items-center gap-1">
                        <button 
                          v-for="cat in avatarCategories" 
                          :key="cat"
                          type="button"
                          @click="selectedAvatarCategory = cat"
                          class="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                          :class="selectedAvatarCategory === cat 
                            ? 'bg-[#FFFF00] text-black shadow-xs' 
                            : (adminTheme === 'dark' ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-slate-600 hover:text-black hover:bg-slate-200')"
                        >
                          {{ cat }}
                        </button>
                      </div>
                    </div>

                    <div class="flex items-center gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
                      <button 
                        v-for="preset in filteredPresetAvatars" 
                        :key="preset.id"
                        type="button"
                        @click="selectPresetAvatar(preset.url)"
                        class="relative flex-shrink-0 transition-all p-0.5 cursor-pointer group"
                        :class="[
                          profileForm.avatar === preset.url 
                            ? 'ring-2 ring-[#FFFF00] scale-110 shadow-lg' 
                            : 'opacity-70 hover:opacity-100 hover:scale-105',
                          AVATAR_SHAPES.find(s => s.id === profileForm.avatarShape)?.class || 'rounded-full'
                        ]"
                        :title="`${preset.name} (${preset.category})`"
                      >
                        <img 
                          :src="preset.url" 
                          :alt="preset.name" 
                          class="w-11 h-11 object-cover border border-white/20 transition-all"
                          :class="AVATAR_SHAPES.find(s => s.id === profileForm.avatarShape)?.class || 'rounded-full'"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- İsim & Kullanıcı Adı -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label :class="['block text-xs font-medium mb-1', themeClasses.inputLabel]">Görünen İsim</label>
                    <input 
                      v-model="profileForm.name" 
                      type="text" 
                      required
                      placeholder="Ad Soyad veya Marka Adı"
                      :class="['w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-sm transition-colors', themeClasses.inputBg]"
                    />
                  </div>

                  <div>
                    <label :class="['block text-xs font-medium mb-1', themeClasses.inputLabel]">Kullanıcı Adı (Handle)</label>
                    <div class="relative">
                      <span class="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">@</span>
                      <input 
                        v-model="profileForm.username" 
                        type="text" 
                        required
                        placeholder="kullaniciadi"
                        :class="['w-full pl-8 pr-3.5 py-2.5 rounded-xl border focus:outline-none text-sm transition-colors', themeClasses.inputBg]"
                      />
                    </div>
                  </div>
                </div>

                <!-- 1.3 DOĞRULANMIŞ PROFİL ROZETİ (VERIFIED CHECKMARK) -->
                <div class="flex items-center justify-between p-3 rounded-xl border" :class="themeClasses.boxInner">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="adminTheme === 'light' ? 'bg-amber-100 border border-amber-300 text-amber-800' : 'bg-[#FFFF00]/10 border border-[#FFFF00]/30 text-[#FFFF00]'">
                      <CheckCircle2 class="w-4 h-4" />
                    </div>
                    <div>
                      <span :class="['block text-xs font-bold', themeClasses.titleText]">Doğrulanmış Profil Rozeti (Onay İkonu)</span>
                      <span :class="['text-[11px] block', themeClasses.subText]">Profil başlığınızın hemen yanında resmi onay rozetini gösterir</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    @click="profileForm.isVerified = !profileForm.isVerified"
                    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="profileForm.isVerified ? 'bg-[#FFFF00]' : (adminTheme === 'dark' ? 'bg-[#282828]' : 'bg-slate-300')"
                  >
                    <span 
                      class="pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out"
                      :class="profileForm.isVerified ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'"
                    />
                  </button>
                </div>

                <!-- Biyografi -->
                <div>
                  <div class="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <div class="flex items-center gap-2">
                      <label :class="['block text-xs font-semibold', themeClasses.inputLabel]">Biyografi</label>
                      <button 
                        type="button"
                        @click="openAiBioModal"
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold transition-all shadow-sm hover:scale-105 active:scale-95 bg-gradient-to-r from-amber-400 via-[#FFFF00] to-yellow-300 text-black hover:shadow-yellow-500/25 cursor-pointer ring-1 ring-yellow-400/50"
                        title="Yapay zeka ile kişiselleştirilmiş biyografiler üretin"
                      >
                        <Sparkles class="w-3.5 h-3.5 text-black animate-pulse" />
                        <span>✨ AI ile Biyografi Yaz</span>
                      </button>
                    </div>
                    <span :class="['text-[10px] font-mono', themeClasses.subText]">
                      {{ profileForm.bio.length }} / 160
                    </span>
                  </div>
                  <textarea 
                    v-model="profileForm.bio" 
                    rows="3" 
                    maxlength="160"
                    placeholder="Kendinizi, işinizi veya ilgi alanlarınızı kısaca tanıtın..."
                    :class="['w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-sm transition-colors resize-none', themeClasses.inputBg]"
                  ></textarea>
                </div>

                <!-- 1.4 CANLI DURUM & MÜSAİTLİK BİLDİRİMİ (STATUS BADGE) -->
                <!-- 1.4 CANLI DURUM & MÜSAİTLİK ROZETİ (STATUS PILL) -->
                <div class="space-y-3 pt-5 border-t" :class="themeClasses.headerBorder">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label :class="['block text-xs font-bold flex items-center gap-1.5', themeClasses.titleText]">
                        <span class="relative flex h-2.5 w-2.5">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span>Canlı Durum & Müsaitlik Rozeti</span>
                      </label>
                      <span :class="['text-[11px] block mt-0.5', themeClasses.subText]">
                        Ziyaretçilerinize anlık çalışma modunuzu, müsaitliğinizi veya özel duyurunuzu bildirin.
                      </span>
                    </div>

                    <div class="flex items-center gap-2.5">
                      <!-- Aç/Kapat Toggle Switch -->
                      <label class="inline-flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl border transition-colors shrink-0"
                        :class="profileForm.statusColor !== 'none' 
                          ? (adminTheme === 'light' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300')
                          : (adminTheme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-[#141414] border-[#282828] text-neutral-400')"
                      >
                        <input 
                          type="checkbox" 
                          :checked="profileForm.statusColor !== 'none'" 
                          @change="handleToggleStatusBadge"
                          class="sr-only peer"
                        />
                        <div class="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                        <span class="text-xs font-semibold select-none">
                          {{ profileForm.statusColor !== 'none' ? 'Profilde Açık' : 'Profilde Gizli (Sade)' }}
                        </span>
                      </label>
                    </div>
                  </div>

                  <!-- Durum Metni Girişi -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="sm:col-span-2">
                      <label :class="['block text-[11px] font-medium mb-1', themeClasses.inputLabel]">Durum / Bildirim Metni</label>
                      <input 
                        v-model="profileForm.statusText" 
                        type="text" 
                        maxlength="45"
                        placeholder="Örn: Yeni Projelere & Fırsatlara Açık"
                        :disabled="profileForm.statusColor === 'none'"
                        :class="['w-full px-3.5 py-2 rounded-xl border focus:outline-none text-xs transition-colors', themeClasses.inputBg, profileForm.statusColor === 'none' ? 'opacity-50 cursor-not-allowed' : '']"
                      />
                    </div>
                    <div>
                      <label :class="['block text-[11px] font-medium mb-1', themeClasses.inputLabel]">Sinyal Rengi & Görünüm</label>
                      <select 
                        v-model="profileForm.statusColor"
                        :class="['w-full px-3.5 py-2 rounded-xl border focus:outline-none text-xs transition-colors cursor-pointer', themeClasses.inputBg]"
                      >
                        <option value="emerald">🟢 Zümrüt Yeşili (Müsait / Aktif)</option>
                        <option value="amber">🟠 Amber / Turuncu (Meşgul / İncelemede)</option>
                        <option value="blue">🔵 Safir Mavi (Odakta / Projede)</option>
                        <option value="purple">🟣 Mor / Fırtına (Yeni Girişim)</option>
                        <option value="none">⚪ Rozeti Gizle (Kapalı)</option>
                      </select>
                    </div>
                  </div>

                  <!-- Hızlı Durum Şablonları (1 Tıkla Doldur) -->
                  <div>
                    <label :class="['block text-[11px] font-medium mb-1.5', themeClasses.inputLabel]">
                      Hızlı Durum Şablonları (1 Tıkla Uygula):
                    </label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      <button 
                        v-for="preset in STATUS_PRESETS" 
                        :key="preset.id"
                        type="button"
                        @click="selectStatusPreset(preset)"
                        class="p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer group"
                        :class="profileForm.statusColor === preset.id 
                          ? (adminTheme === 'light' ? 'border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm' : 'border-[#FFFF00] bg-[#FFFF00]/10 text-white font-medium shadow-xs') 
                          : (adminTheme === 'dark' ? 'border-[#282828] bg-[#141414] text-neutral-300 hover:border-neutral-600' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')"
                      >
                        <div class="flex items-center gap-2 truncate">
                          <span v-if="preset.id !== 'none'" class="relative flex h-2 w-2 shrink-0">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="preset.pingClass"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2" :class="preset.dotClass"></span>
                          </span>
                          <span v-else class="w-2 h-2 rounded-full bg-neutral-600 shrink-0"></span>
                          <span class="text-[11px] truncate">{{ preset.text }}</span>
                        </div>
                        <Check v-if="profileForm.statusColor === preset.id" class="w-3.5 h-3.5 shrink-0 ml-1" :class="adminTheme === 'light' ? 'text-black' : 'text-[#FFFF00]'" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 1.5 DİNAMİK YETENEK & İLGİ ALANI ROZETLERİ (BADGES / TAGS) -->
                <div :class="['pt-5 border-t', themeClasses.headerBorder]">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 class="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" :class="adminTheme === 'light' ? 'text-slate-900' : 'text-[#FFFF00]'">
                        <Sparkles class="w-3.5 h-3.5" :class="adminTheme === 'light' ? 'text-amber-600' : 'text-[#FFFF00]'" />
                        <span>Yetenek & İlgi Alanı Rozetleri (Badges)</span>
                      </h4>
                      <p :class="['text-[11px] mt-0.5', themeClasses.subText]">
                        Biyografinizin hemen altında sergilenen uzmanlık, rol veya konum etiketlerini yönetin.
                      </p>
                    </div>

                    <div class="flex items-center gap-2.5">
                      <!-- Aç/Kapat Toggle Switch -->
                      <label class="inline-flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl border transition-colors"
                        :class="profile.showBadges 
                          ? (adminTheme === 'light' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/15 border-amber-500/30 text-amber-300')
                          : (adminTheme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-[#141414] border-[#282828] text-neutral-400')"
                      >
                        <input 
                          type="checkbox" 
                          :checked="!!profile.showBadges" 
                          @change="handleToggleShowBadges"
                          class="sr-only peer"
                        />
                        <div class="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 relative"></div>
                        <span class="text-xs font-semibold select-none">
                          {{ profile.showBadges ? 'Profilde Açık' : 'Profilde Gizli (Sade)' }}
                        </span>
                      </label>

                      <span v-if="profile.showBadges" class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="adminTheme === 'light' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/30'">
                        {{ (profile.badges || []).length }} Aktif
                      </span>
                    </div>
                  </div>

                  <!-- Mevcut Rozetlerin Canlı Listesi (Silme Butonlu) -->
                  <div class="mb-4">
                    <div 
                      v-if="profile.badges && profile.badges.length > 0"
                      class="flex items-center flex-wrap gap-2 p-3 rounded-xl border transition-colors min-h-[48px]"
                      :class="themeClasses.boxInner"
                    >
                      <div 
                        v-for="badge in profile.badges" 
                        :key="badge.id"
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border shadow-xs group transition-all"
                        :class="getBadgeClass(badge)"
                      >
                        <component :is="getBadgeIcon(badge.icon)" class="w-3.5 h-3.5 shrink-0" :class="getBadgeIconColor(badge)" />
                        <span>{{ badge.text }}</span>
                        <button 
                          type="button" 
                          @click="handleRemoveBadge(badge.id)"
                          class="ml-1 text-slate-400 hover:text-rose-400 transition-colors p-0.5 rounded-md hover:bg-black/20 cursor-pointer"
                          title="Rozeti Kaldır"
                        >
                          <X class="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div 
                      v-else 
                      class="p-4 rounded-xl border border-dashed text-center text-xs text-neutral-500"
                      :class="themeClasses.boxInner"
                    >
                      Henüz hiç rozet eklenmedi. Aşağıdaki formdan veya hızlı önerilerden rozet ekleyin.
                    </div>
                  </div>

                  <!-- Hızlı Hazır Şablonlar (Önerilen Etiketler) -->
                  <div class="mb-4">
                    <span :class="['text-[11px] font-medium block mb-1.5', themeClasses.inputLabel]">
                      Hızlı Önerilen Etiketler (Tek Tıkla Ekle):
                    </span>
                    <div class="flex items-center flex-wrap gap-1.5">
                      <button 
                        v-for="preset in PRESET_BADGE_TEMPLATES"
                        :key="preset.text"
                        type="button"
                        @click="handleAddPresetBadge(preset)"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        :class="adminTheme === 'dark' ? 'bg-[#141414] border-[#2c2c2c] text-neutral-300 hover:border-[#FFFF00]/50 hover:text-[#FFFF00]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-yellow-500 hover:text-black'"
                      >
                        <Plus class="w-3 h-3" :class="adminTheme === 'light' ? 'text-amber-700' : 'text-[#FFFF00]'" />
                        <span>{{ preset.text }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Yeni Özel Rozet Tanımlama Formu -->
                  <div :class="['p-3.5 rounded-xl border space-y-3', themeClasses.boxInner]">
                    <span :class="['text-[11px] font-bold block flex items-center gap-1.5', themeClasses.titleText]">
                      <Plus class="w-3 h-3" :class="adminTheme === 'light' ? 'text-amber-700' : 'text-[#FFFF00]'" />
                      <span>Yeni Özel Rozet Tanımla</span>
                    </span>

                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <!-- Metin Girişi -->
                      <div class="sm:col-span-6">
                        <label :class="['block text-[10px] font-medium mb-1', themeClasses.inputLabel]">Rozet Metni</label>
                        <input 
                          v-model="newBadgeText"
                          type="text"
                          placeholder="Örn: Açık Kaynak, UI/UX, Ankara, TR"
                          @keydown.enter.prevent="handleAddBadge"
                          :class="['w-full px-3 py-1.5 rounded-xl border focus:outline-none text-xs transition-colors', themeClasses.inputBg]"
                        />
                      </div>

                      <!-- İkon Seçici Açılır Liste -->
                      <div class="sm:col-span-3">
                        <label :class="['block text-[10px] font-medium mb-1', themeClasses.inputLabel]">İkon</label>
                        <select 
                          v-model="newBadgeIcon"
                          :class="['w-full px-2.5 py-1.5 rounded-xl border focus:outline-none text-xs transition-colors', themeClasses.inputBg]"
                        >
                          <option v-for="iconItem in AVAILABLE_BADGE_ICONS" :key="iconItem.id" :value="iconItem.id">
                            {{ iconItem.name }}
                          </option>
                        </select>
                      </div>

                      <!-- Renk Stili -->
                      <div class="sm:col-span-3">
                        <label :class="['block text-[10px] font-medium mb-1', themeClasses.inputLabel]">Renk Stili</label>
                        <select 
                          v-model="newBadgeColor"
                          :class="['w-full px-2.5 py-1.5 rounded-xl border focus:outline-none text-xs transition-colors', themeClasses.inputBg]"
                        >
                          <option v-for="c in BADGE_COLOR_STYLES" :key="c.id" :value="c.id">
                            {{ c.name }}
                          </option>
                        </select>
                      </div>
                    </div>

                    <!-- Ekle Butonu & Canlı Önizleme Çubuğu -->
                    <div class="flex items-center justify-between pt-1">
                      <div class="flex items-center gap-2">
                        <span :class="['text-[10px]', themeClasses.subText]">Önizleme:</span>
                        <span 
                          class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-medium border"
                          :class="getBadgeClass({ color: newBadgeColor })"
                        >
                          <component :is="getBadgeIcon(newBadgeIcon)" class="w-3 h-3" :class="getBadgeIconColor({ color: newBadgeColor })" />
                          <span>{{ newBadgeText.trim() || 'Rozet Metni' }}</span>
                        </span>
                      </div>

                      <button 
                        type="button"
                        @click="handleAddBadge"
                        :disabled="!newBadgeText.trim()"
                        class="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-xs shadow-yellow-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                      >
                        <Plus class="w-3.5 h-3.5 stroke-[3]" />
                        <span>Rozet Ekle</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 2. HIZLI ERİŞİM SOSYAL MEDYA İKONLARI & KİŞİSELLEŞTİRME -->
                <div :class="['pt-5 border-t', themeClasses.headerBorder]">
                  <!-- Üst Başlık ve Ana Bar Aç/Kapa Switch -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h4 class="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Sparkles class="w-3.5 h-3.5" />
                        <span>Sosyal Medya İkonları Barı</span>
                      </h4>
                      <p :class="['text-[11px] mt-0.5', themeClasses.subText]">
                        Profil başlığınızın hemen altında şık butonlar olarak listelenir. Dilediğiniz platformu kapatabilir veya şeklini değiştirebilirsiniz.
                      </p>
                    </div>

                    <!-- Ana Bar Görünürlük Switch'i -->
                    <label class="inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto px-3 py-1.5 rounded-xl border transition-colors"
                      :class="profileForm.socialLinks.barVisible !== false 
                        ? (themeClasses.isDark ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-800')
                        : (themeClasses.isDark ? 'bg-[#141414] border-[#282828] text-neutral-400' : 'bg-slate-100 border-slate-200 text-slate-500')"
                    >
                      <input 
                        type="checkbox" 
                        v-model="profileForm.socialLinks.barVisible" 
                        class="sr-only peer"
                      />
                      <div class="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 relative"></div>
                      <span class="text-xs font-semibold select-none">
                        {{ profileForm.socialLinks.barVisible !== false ? 'İkon Barı Aktif' : 'İkon Barı Gizli' }}
                      </span>
                    </label>
                  </div>

                  <!-- İkon Şekli ve Stil Seçici Paneli -->
                  <div 
                    v-if="profileForm.socialLinks.barVisible !== false"
                    :class="['p-4 rounded-xl border mb-5 space-y-3.5', themeClasses.boxInner]"
                  >
                    <!-- Şekil Seçimi -->
                    <div>
                      <label :class="['block text-[11px] font-semibold uppercase tracking-wider mb-2', themeClasses.inputLabel]">
                        İkon Buton Şekli
                      </label>
                      <div class="grid grid-cols-3 gap-2">
                        <button
                          v-for="shape in SOCIAL_SHAPES"
                          :key="shape.id"
                          type="button"
                          @click="profileForm.socialLinks.shape = shape.id"
                          :class="[
                            'py-2 px-3 border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer',
                            shape.class,
                            profileForm.socialLinks.shape === shape.id
                              ? (adminTheme === 'light' ? 'border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm' : 'border-[#FFFF00] bg-[#FFFF00]/15 text-[#FFFF00] shadow-xs')
                              : themeClasses.colorBtnInactive
                          ]"
                        >
                          <span :class="['w-3.5 h-3.5 border border-current', shape.class]"></span>
                          <span>{{ shape.name }}</span>
                        </button>
                      </div>
                    </div>

                    <!-- Stil Seçimi -->
                    <div>
                      <label :class="['block text-[11px] font-semibold uppercase tracking-wider mb-2', themeClasses.inputLabel]">
                        İkon Görsel Teması / Stili
                      </label>
                      <div class="grid grid-cols-3 gap-2">
                        <button
                          v-for="st in SOCIAL_STYLES"
                          :key="st.id"
                          type="button"
                          @click="profileForm.socialLinks.style = st.id"
                          :class="[
                            'py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                            profileForm.socialLinks.style === st.id
                              ? (adminTheme === 'light' ? 'border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm' : 'border-[#FFFF00] bg-[#FFFF00]/15 text-[#FFFF00] shadow-xs')
                              : themeClasses.colorBtnInactive
                          ]"
                        >
                          <span>{{ st.name }}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Platform Kartları & Aktif/Pasif Toggle'ları -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div 
                      v-for="platform in SOCIAL_PLATFORMS" 
                      :key="platform.id"
                      :class="[
                        'p-3 rounded-xl border transition-all',
                        profileForm.socialLinks[platform.activeKey] !== false
                          ? (themeClasses.isDark ? 'bg-[#141414] border-[#282828]' : 'bg-white border-slate-200 shadow-xs')
                          : (themeClasses.isDark ? 'bg-[#0e0e0e]/60 border-[#1f1f1f] opacity-70' : 'bg-slate-50 border-slate-200 opacity-60')
                      ]"
                    >
                      <!-- Platform Başlığı ve iOS Switch -->
                      <div class="flex items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                          <div :class="['p-1.5 rounded-lg border border-white/5', platform.badgeBg]">
                            <component :is="ICON_COMPONENT_MAP[platform.icon]" class="w-3.5 h-3.5" :class="platform.color" />
                          </div>
                          <div>
                            <span :class="['text-xs font-semibold', themeClasses.titleText]">{{ platform.name }}</span>
                            <span 
                              class="ml-1.5 text-[9px] px-1.5 py-0.2 rounded font-medium"
                              :class="profileForm.socialLinks[platform.activeKey] !== false 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'"
                            >
                              {{ profileForm.socialLinks[platform.activeKey] !== false ? 'Aktif' : 'Gizli' }}
                            </span>
                          </div>
                        </div>

                        <!-- Tekil Platform Switch -->
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            v-model="profileForm.socialLinks[platform.activeKey]" 
                            class="sr-only peer"
                          />
                          <div class="w-8 h-4 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                        </label>
                      </div>

                      <!-- URL Input -->
                      <input 
                        v-model="profileForm.socialLinks[platform.id]" 
                        :type="platform.id === 'email' ? 'email' : 'text'" 
                        :placeholder="platform.placeholder" 
                        :class="[
                          'w-full px-3 py-1.5 rounded-lg border focus:outline-none text-xs transition-colors',
                          themeClasses.inputBg,
                          profileForm.socialLinks[platform.activeKey] === false ? 'opacity-70' : ''
                        ]"
                      />
                    </div>
                  </div>
                </div>

                <!-- Kaydet Butonu -->
                <div :class="['pt-4 border-t flex justify-end', themeClasses.headerBorder]">
                  <button 
                    type="submit" 
                    :disabled="isSavingProfile"
                    class="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black transition-all shadow-md shadow-yellow-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    <Check class="w-4 h-4 text-black" />
                    <span>{{ isSavingProfile ? 'Kaydediliyor...' : 'Profil Bilgilerini Kaydet' }}</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- 3. ZİYARETÇİ PROFİL TEMALARI (Themes Grid) -->
            <div :class="['border rounded-2xl p-6 transition-colors', themeClasses.cardBg]">
              <div :class="['flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-2 mb-6', themeClasses.headerBorder]">
                <div>
                  <h3 :class="['text-base font-semibold flex items-center gap-2', themeClasses.titleText]">
                    <Palette class="w-4 h-4" :class="adminTheme === 'light' ? 'text-amber-600' : 'text-[#FFFF00]'" />
                    <span>Ziyaretçi Profil Teması</span>
                  </h3>
                  <p :class="['text-xs mt-0.5', themeClasses.subText]">
                    Ziyaretçilerinizin profil sayfanızda karşılaşacağı görsel atmosferi ve renk paletini seçin.
                  </p>
                </div>
                <span class="text-xs font-semibold px-3 py-1 rounded-full w-fit" :class="adminTheme === 'light' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/30'">
                  Aktif: {{ activeTheme.name }}
                </span>
              </div>

              <!-- Tema Kartları Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  v-for="theme in THEMES" 
                  :key="theme.id"
                  @click="handleSelectTheme(theme)"
                  class="relative p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between"
                  :class="currentTheme === theme.id 
                    ? (adminTheme === 'dark' ? 'bg-[#222222] border-[#FFFF00] shadow-xl shadow-yellow-500/10 ring-1 ring-[#FFFF00]' : 'bg-white border-yellow-500 shadow-lg ring-2 ring-yellow-400/30')
                    : (adminTheme === 'dark' ? 'bg-[#141414] border-[#282828] hover:border-[#444444] hover:bg-[#1c1c1c]' : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60')"
                >
                  <!-- Tema Canlı Gradyan Önizleme Çubuğu -->
                  <div class="w-full h-16 rounded-xl mb-3 p-2.5 flex items-center justify-between bg-gradient-to-r shadow-inner border border-white/10" :class="theme.previewGradient">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full bg-black/10 border border-white/30 backdrop-blur-sm"></div>
                      <div class="space-y-1">
                        <div class="w-16 h-2 rounded bg-black/20"></div>
                        <div class="w-10 h-1.5 rounded bg-black/15"></div>
                      </div>
                    </div>
                    <div class="w-14 h-4 rounded-lg bg-black/10 border border-white/20 backdrop-blur-md"></div>
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <h4 :class="['text-sm font-bold flex items-center gap-2', themeClasses.titleText]">
                        <span>{{ theme.name }}</span>
                      </h4>
                      <span v-if="currentTheme === theme.id" class="text-xs font-semibold flex items-center gap-1" :class="adminTheme === 'light' ? 'text-amber-800 font-bold' : 'text-[#FFFF00]'">
                        <Check class="w-3.5 h-3.5" />
                        <span>Seçili</span>
                      </span>
                    </div>
                    <p :class="['text-xs leading-relaxed font-light', themeClasses.subText]">
                      {{ theme.description }}
                    </p>
                  </div>

                  <button 
                    type="button"
                    @click.stop="handleSelectTheme(theme)"
                    class="mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    :class="currentTheme === theme.id 
                      ? 'bg-[#FFFF00] text-black shadow-md shadow-yellow-500/20 ring-1 ring-yellow-400' 
                      : (adminTheme === 'dark' ? 'bg-[#181818] border border-[#282828] text-neutral-300 hover:text-white hover:border-[#FFFF00]/50 hover:bg-[#222222]' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900')"
                  >
                    <Check v-if="currentTheme === theme.id" class="w-3.5 h-3.5 text-black stroke-[3]" />
                    <span>{{ currentTheme === theme.id ? 'Aktif Profil Teması' : 'Bu Temayı Uygula' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 4. YÖNETİM PANELİ KULLANIM MODU (Açık / Koyu) -->
            <div :class="['border rounded-2xl p-6 transition-colors', themeClasses.cardBg]">
              <div :class="['flex items-center justify-between pb-3 mb-4 border-b', themeClasses.headerBorder]">
                <div>
                  <h3 :class="['text-sm font-bold flex items-center gap-2', themeClasses.titleText]">
                    <Sliders class="w-4 h-4 text-cyan-400" />
                    <span>Yönetim Paneli Görünüm Tercihi</span>
                  </h3>
                  <p :class="['text-xs mt-0.5', themeClasses.subText]">
                    Yönetici kontrol panelinizin açık veya koyu modunu belirleyin.
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  type="button"
                  @click="linkStore.setAdminTheme('light')"
                  class="p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5"
                  :class="adminTheme === 'light' 
                    ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/30' 
                    : (adminTheme === 'dark' ? 'border-[#1e293b] bg-[#090d16] hover:bg-[#0f1726]' : 'border-slate-200 bg-slate-50 hover:bg-slate-100')"
                >
                  <div class="p-3 rounded-xl bg-amber-500/20 text-amber-500">
                    <Sun class="w-5 h-5" />
                  </div>
                  <div>
                    <h4 :class="['text-sm font-bold', themeClasses.titleText]">Açık Tema (Light Mode)</h4>
                    <p :class="['text-xs', themeClasses.subText]">Ferah, parlak ve yüksek kontrastlı arayüz</p>
                  </div>
                </button>

                <button 
                  type="button"
                  @click="linkStore.setAdminTheme('dark')"
                  class="p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5"
                  :class="adminTheme === 'dark' 
                    ? 'border-cyan-500 bg-cyan-500/15 ring-2 ring-cyan-500/30' 
                    : 'border-slate-200 bg-white hover:bg-slate-50'"
                >
                  <div class="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Moon class="w-5 h-5" />
                  </div>
                  <div>
                    <h4 :class="['text-sm font-bold', themeClasses.titleText]">CRM Koyu Tema (Dark Mode)</h4>
                    <p :class="['text-xs', themeClasses.subText]">Göz dinlendiren modern obsidiyen CRM stili</p>
                  </div>
                </button>
              </div>
            </div>

          </div>

          <!-- ========================================== -->
          <!-- SEKME 3: İSTATİSTİKLER (ANALYTICS) -->
          <!-- ========================================== -->
          <div v-else-if="activeTab === 'analytics'" class="space-y-6">
            
            <!-- Özet Kartları (Dribbble Sales Team CRM Stili - 4 Metrik Kartı) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              
              <!-- 1. KART: Toplam Tıklanma (Dribbble İkonik Elektrik Sarı "Deals Pipeline" Kartı) -->
              <div class="p-5 sm:p-6 rounded-3xl bg-[#FFFF00] text-black flex flex-col justify-between relative shadow-xl shadow-yellow-500/10 min-h-[140px]">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-bold tracking-wide text-black/75">Toplam Tıklanma</p>
                  <div class="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-black font-black text-sm">
                    ↗
                  </div>
                </div>
                <div class="mt-3">
                  <h3 class="text-3xl sm:text-4xl font-extrabold text-black tracking-tight flex items-baseline gap-1.5">
                    <span>{{ totalClicks }}</span>
                    <span class="text-sm font-semibold text-black/70">tık</span>
                  </h3>
                  <p class="text-xs font-bold text-black/80 mt-1">
                    Bağlantı etkileşim performansı
                  </p>
                </div>
              </div>

              <!-- 2. KART: Toplam Profil Görüntüleme -->
              <div 
                class="p-5 sm:p-6 rounded-3xl border flex flex-col justify-between relative shadow-xl min-h-[140px] transition-colors"
                :class="adminTheme === 'light' 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' 
                  : 'bg-[#181818] border border-[#282828] text-white shadow-black/60'"
              >
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold tracking-wide" :class="adminTheme === 'light' ? 'text-slate-600' : 'text-[#8E8E93]'">Profil Görüntüleme</p>
                  <div 
                    class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
                    :class="adminTheme === 'light' ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-[#242424] text-sky-400 border-[#333333]'"
                  >
                    <Eye class="w-4 h-4" />
                  </div>
                </div>
                <div class="mt-3">
                  <h3 class="text-3xl font-extrabold tracking-tight" :class="adminTheme === 'light' ? 'text-black' : 'text-white'">
                    <span>{{ analytics?.totalVisits || 0 }}</span>
                    <span class="text-sm font-normal" :class="adminTheme === 'light' ? 'text-slate-500' : 'text-[#8E8E93]'"> ziyaret</span>
                  </h3>
                  <p class="text-xs font-semibold mt-1" :class="adminTheme === 'light' ? 'text-sky-600' : 'text-sky-400'">
                    {{ analytics?.qrVisits || 0 }} QR • {{ analytics?.directVisits || 0 }} Doğrudan
                  </p>
                </div>
              </div>

              <!-- 3. KART: Tıklama Oranı (CTR - Click-Through Rate) -->
              <div 
                class="p-5 sm:p-6 rounded-3xl border flex flex-col justify-between relative shadow-xl min-h-[140px] transition-colors"
                :class="adminTheme === 'light' 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' 
                  : 'bg-[#181818] border border-[#282828] text-white shadow-black/60'"
              >
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold tracking-wide" :class="adminTheme === 'light' ? 'text-slate-600' : 'text-[#8E8E93]'">Tıklama Oranı (CTR)</p>
                  <div 
                    class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
                    :class="adminTheme === 'light' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-[#242424] text-emerald-400 border-[#333333]'"
                  >
                    <MousePointerClick class="w-4 h-4" />
                  </div>
                </div>
                <div class="mt-3">
                  <h3 class="text-3xl font-extrabold tracking-tight text-emerald-400">
                    <span>%{{ (analytics?.totalVisits || 0) > 0 ? ((totalClicks / analytics.totalVisits) * 100).toFixed(1) : '0.0' }}</span>
                  </h3>
                  <p class="text-xs font-semibold mt-1" :class="adminTheme === 'light' ? 'text-slate-600' : 'text-neutral-400'">
                    Ziyaretçi başına link etkileşimi
                  </p>
                </div>
              </div>

              <!-- 4. KART: En Popüler Bağlantı -->
              <div 
                class="p-5 sm:p-6 rounded-3xl border flex flex-col justify-between relative shadow-xl min-h-[140px] transition-colors"
                :class="adminTheme === 'light' 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' 
                  : 'bg-[#181818] border border-[#282828] text-white shadow-black/60'"
              >
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold tracking-wide" :class="adminTheme === 'light' ? 'text-slate-600' : 'text-[#8E8E93]'">En Çok Tıklanan</p>
                  <div 
                    class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
                    :class="adminTheme === 'light' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-[#242424] text-[#FFFF00] border-[#333333]'"
                  >
                    <TrendingUp class="w-4 h-4" />
                  </div>
                </div>
                <div class="mt-3 min-w-0">
                  <h3 class="text-lg font-bold truncate" :class="adminTheme === 'light' ? 'text-black' : 'text-white'">
                    {{ topLink && topLink.clicks > 0 ? topLink.title : 'Henüz tık yok' }}
                  </h3>
                  <p v-if="topLink && topLink.clicks > 0" class="text-xs font-bold mt-1" :class="adminTheme === 'light' ? 'text-amber-700' : 'text-[#FFFF00]'">
                    {{ topLink.clicks }} tıklanma (%{{ totalClicks > 0 ? Math.round((topLink.clicks / totalClicks) * 100) : 0 }})
                  </p>
                  <p v-else class="text-xs mt-1" :class="adminTheme === 'light' ? 'text-slate-500' : 'text-[#8E8E93]'">
                    Ziyaretçiler bağlantılarınıza tıkladıkça listelenir
                  </p>
                </div>
              </div>

                        </div>

            <!-- ======================================================== -->
            <!-- HAFTALIK ZİYARETÇİ & TIKLAMA TREND GRAFİĞİ + REFERRER DAĞILIMI -->
            <!-- ======================================================== -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <!-- 1. SOL / ORTA (2 Sütun): 7 Günlük Aktivite Trend Grafiği -->
              <div :class="['lg:col-span-2 border rounded-3xl p-6 transition-colors relative flex flex-col justify-between', themeClasses.cardBg]">
                <!-- Başlık & Legend -->
                <div :class="['flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b', themeClasses.headerBorder]">
                  <div>
                    <h3 :class="['text-sm font-bold flex items-center gap-2', themeClasses.titleText]">
                      <BarChart3 class="w-4 h-4 text-[#FFFF00]" />
                      <span>Haftalık Ziyaretçi & Tıklama Trendi</span>
                    </h3>
                    <p :class="['text-xs mt-0.5', themeClasses.subText]">
                      Son 7 gün boyunca profil görüntülenme ve bağlantı tıklama akışınız.
                    </p>
                  </div>
                  <!-- Gösterge (Legend) -->
                  <div class="flex items-center gap-3 text-xs font-semibold shrink-0">
                    <span class="flex items-center gap-1.5" :class="themeClasses.titleText">
                      <span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                      <span>Ziyaretler</span>
                    </span>
                    <span class="flex items-center gap-1.5" :class="themeClasses.titleText">
                      <span class="w-2.5 h-2.5 rounded-full bg-[#FFFF00]"></span>
                      <span>Tıklamalar</span>
                    </span>
                  </div>
                </div>

                <!-- İnteraktif Görsel Çubuk Grafiği (Visual Bar Chart) -->
                <div class="h-48 sm:h-52 w-full pt-4 pb-2 flex items-end justify-between gap-2 sm:gap-4 px-1">
                  <div 
                    v-for="(day, dIdx) in (analytics?.dailyTimeline || [])" 
                    :key="dIdx" 
                    class="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    <!-- Hover Tooltip -->
                    <div class="absolute -top-12 z-20 opacity-0 group-hover:opacity-100 transition-all pointer-events-none transform -translate-y-1 group-hover:translate-y-0 duration-200">
                      <div class="px-2.5 py-1.5 rounded-xl bg-black/95 text-white text-[10px] font-mono whitespace-nowrap shadow-xl border border-white/10 flex flex-col items-center gap-0.5">
                        <span class="font-bold text-[#FFFF00]">{{ day.date || day.dayName }}</span>
                        <div class="flex items-center gap-2 text-[9px]">
                          <span class="text-sky-400">● {{ day.visits }} Ziyaret</span>
                          <span class="text-[#FFFF00]">● {{ day.clicks }} Tık</span>
                        </div>
                      </div>
                    </div>

                    <!-- İkili Çubuklar (Dual Bars: Visits + Clicks) -->
                    <div class="w-full max-w-[36px] flex items-end justify-center gap-1 h-[140px] sm:h-[150px]">
                      <!-- Ziyaret Çubuğu (Sky Blue) -->
                      <div 
                        class="w-1/2 rounded-t-lg bg-sky-500/80 hover:bg-sky-400 transition-all duration-300 relative group-hover:shadow-md group-hover:shadow-sky-500/30"
                        :style="{ height: `${Math.max(10, Math.min(100, (day.visits / maxTimelineValue) * 100))}%` }"
                        :title="`${day.dayName}: ${day.visits} Ziyaret`"
                      ></div>
                      <!-- Tıklama Çubuğu (Electric Yellow) -->
                      <div 
                        class="w-1/2 rounded-t-lg bg-[#FFFF00] hover:bg-[#EEFF00] transition-all duration-300 relative group-hover:shadow-md group-hover:shadow-yellow-500/40"
                        :style="{ height: `${Math.max(8, Math.min(100, (day.clicks / maxTimelineValue) * 100))}%` }"
                        :title="`${day.dayName}: ${day.clicks} Tıklanma`"
                      ></div>
                    </div>

                    <!-- Gün Etiketi -->
                    <span class="text-[11px] font-semibold mt-2 font-mono transition-colors group-hover:text-[#FFFF00]" :class="themeClasses.subText">
                      {{ day.dayName }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 2. SAĞ (1 Sütun): Yönlendiren Kaynaklar Dağılımı (Referrer Distribution) -->
              <div :class="['border rounded-3xl p-6 transition-colors relative flex flex-col justify-between', themeClasses.cardBg]">
                <div>
                  <div :class="['flex items-center justify-between pb-4 mb-4 border-b', themeClasses.headerBorder]">
                    <div>
                      <h3 :class="['text-sm font-bold flex items-center gap-2', themeClasses.titleText]">
                        <Share2 class="w-4 h-4 text-[#FFFF00]" />
                        <span>Yönlendiren Kaynaklar</span>
                      </h3>
                      <p :class="['text-xs mt-0.5', themeClasses.subText]">
                        Ziyaretçilerin profilinize ulaştığı platformlar.
                      </p>
                    </div>
                  </div>

                  <!-- Kaynak Listesi ve Yüzde Barları -->
                  <div class="space-y-3.5">
                    <div 
                      v-for="(refItem, rIdx) in (analytics?.referrerDistribution || [])" 
                      :key="rIdx" 
                      class="space-y-1.5"
                    >
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-semibold flex items-center gap-1.5" :class="themeClasses.titleText">
                          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: refItem.color }"></span>
                          <span>{{ refItem.source }}</span>
                        </span>
                        <div class="flex items-center gap-2">
                          <span class="text-[11px] opacity-75 font-mono" :class="themeClasses.subText">{{ refItem.count }} tık</span>
                          <span class="font-bold font-mono text-xs" :class="themeClasses.titleText">%{{ refItem.percent }}</span>
                        </div>
                      </div>
                      <!-- Progress Bar -->
                      <div class="w-full h-2 rounded-full overflow-hidden" :class="adminTheme === 'light' ? 'bg-slate-100' : 'bg-neutral-800'">
                        <div 
                          class="h-full rounded-full transition-all duration-500" 
                          :style="{ width: `${refItem.percent}%`, backgroundColor: refItem.color }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Dipnot -->
                <div class="pt-4 mt-4 border-t text-[11px] flex items-center gap-1.5 opacity-80" :class="[themeClasses.headerBorder, themeClasses.subText]">
                  <TrendingUp class="w-3.5 h-3.5 text-emerald-400" />
                  <span>En yüksek dönüşüm: <strong class="text-[#FFFF00]">Instagram (%35)</strong></span>
                </div>
              </div>

            </div>

            <!-- ======================================================== -->
            <!-- QR KOD TARAMA & CİHAZ ANALİTİĞİ (MOBİL VS TARAYICI) -->
            <!-- ======================================================== -->
            <div :class="['border rounded-3xl p-6 transition-colors relative overflow-hidden', themeClasses.cardBg]">
              
              <!-- Üst Başlık & Kontrol Butonları -->
              <div :class="['flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b', themeClasses.headerBorder]">
                <div>
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-[#FFFF00]/15 border border-[#FFFF00]/30 text-[#FFFF00] flex items-center justify-center">
                      <QrCode class="w-4 h-4 text-[#FFFF00]" />
                    </div>
                    <div>
                      <h3 :class="['text-sm font-bold flex items-center gap-2', themeClasses.titleText]">
                        <span>QR Kod Tarama & Cihaz Analitiği</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFFF00] text-black">
                          CANLI
                        </span>
                      </h3>
                      <p :class="['text-xs mt-0.5', themeClasses.subText]">
                        QR kodu okutup profilinize erişen kullanıcıların mobil cihazlardan mı yoksa masaüstü web tarayıcılarından mı geldiklerini analiz edin.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Aksiyonlar: Yenile & Sıfırla -->
                <div class="flex items-center gap-2 self-end sm:self-center">
                  <button 
                    @click="linkStore.fetchAnalytics(); showToast('Analitik verileri güncellendi!')"
                    class="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer border"
                    :class="adminTheme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'"
                    title="Verileri sunucudan yeniden çek"
                  >
                    <RotateCcw class="w-3.5 h-3.5" :class="adminTheme === 'light' ? 'text-amber-600' : 'text-[#FFFF00]'" />
                    <span>Yenile</span>
                  </button>
                  <button 
                    v-if="(analytics?.totalVisits || 0) > 0"
                    @click="handleResetAnalytics"
                    class="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Ziyaretçi ve QR istatistiklerini sıfırla"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                    <span>Sıfırla</span>
                  </button>
                </div>
              </div>

              <!-- 4'lü Hızlı Özet Metrik Kartları -->
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
                <!-- 1. Toplam QR Ziyareti -->
                <div :class="['p-4 rounded-2xl border flex flex-col justify-between transition-colors', themeClasses.boxInner]">
                  <div class="flex items-center justify-between text-xs font-medium">
                    <span :class="adminTheme === 'light' ? 'text-slate-700 font-semibold' : 'text-[#8E8E93]'">QR Kod Ziyareti</span>
                    <QrCode class="w-4 h-4" :class="adminTheme === 'light' ? 'text-amber-600' : 'text-[#FFFF00]'" />
                  </div>
                  <div class="mt-2">
                    <div class="text-2xl font-black flex items-baseline gap-1" :class="adminTheme === 'light' ? 'text-black' : 'text-white'">
                      <span>{{ analytics?.qrVisits || 0 }}</span>
                      <span class="text-xs font-normal" :class="adminTheme === 'light' ? 'text-slate-500' : 'text-[#8E8E93]'">tarama</span>
                    </div>
                    <span class="text-[10px] font-bold block mt-0.5" :class="adminTheme === 'light' ? 'text-amber-700' : 'text-[#FFFF00]'">
                      Toplamın %{{ (analytics?.totalVisits || 0) > 0 ? Math.round(((analytics?.qrVisits || 0) / analytics.totalVisits) * 100) : 0 }}'i
                    </span>
                  </div>
                </div>

                <!-- 2. QR Mobil Ziyaret -->
                <div :class="['p-4 rounded-2xl border flex flex-col justify-between transition-colors', themeClasses.boxInner]">
                  <div class="flex items-center justify-between text-xs font-medium">
                    <span :class="adminTheme === 'light' ? 'text-slate-700 font-semibold' : 'text-[#8E8E93]'">📱 QR Mobil Giriş</span>
                    <Smartphone class="w-4 h-4 text-emerald-500" />
                  </div>
                  <div class="mt-2">
                    <div class="text-2xl font-black flex items-baseline gap-1" :class="adminTheme === 'light' ? 'text-emerald-700' : 'text-emerald-400'">
                      <span>{{ analytics?.qrMobile || 0 }}</span>
                      <span class="text-xs font-normal" :class="adminTheme === 'light' ? 'text-slate-500' : 'text-[#8E8E93]'">kişi</span>
                    </div>
                    <span class="text-[10px] font-bold block mt-0.5" :class="adminTheme === 'light' ? 'text-emerald-700' : 'text-emerald-400'">
                      QR oranında %{{ analytics?.qrMobilePercent || 0 }}
                    </span>
                  </div>
                </div>

                <!-- 3. QR Tarayıcı / Masaüstü Ziyaret -->
                <div :class="['p-4 rounded-2xl border flex flex-col justify-between transition-colors', themeClasses.boxInner]">
                  <div class="flex items-center justify-between text-xs font-medium">
                    <span :class="adminTheme === 'light' ? 'text-slate-700 font-semibold' : 'text-[#8E8E93]'">💻 QR Tarayıcı Giriş</span>
                    <Monitor class="w-4 h-4 text-sky-500" />
                  </div>
                  <div class="mt-2">
                    <div class="text-2xl font-black flex items-baseline gap-1" :class="adminTheme === 'light' ? 'text-sky-700' : 'text-sky-400'">
                      <span>{{ analytics?.qrDesktop || 0 }}</span>
                      <span class="text-xs font-normal" :class="adminTheme === 'light' ? 'text-slate-500' : 'text-[#8E8E93]'">kişi</span>
                    </div>
                    <span class="text-[10px] font-bold block mt-0.5" :class="adminTheme === 'light' ? 'text-sky-700' : 'text-sky-400'">
                      QR oranında %{{ analytics?.qrDesktopPercent || 0 }}
                    </span>
                  </div>
                </div>

                <!-- 4. Toplam Profil Görüntülenme -->
                <div :class="['p-4 rounded-2xl border flex flex-col justify-between transition-colors', themeClasses.boxInner]">
                  <div class="flex items-center justify-between text-xs font-medium">
                    <span :class="adminTheme === 'light' ? 'text-slate-700 font-semibold' : 'text-[#8E8E93]'">Toplam Görüntülenme</span>
                    <Users class="w-4 h-4 text-purple-500" />
                  </div>
                  <div class="mt-2">
                    <div class="text-2xl font-black flex items-baseline gap-1" :class="adminTheme === 'light' ? 'text-black' : 'text-white'">
                      <span>{{ analytics?.totalVisits || 0 }}</span>
                      <span class="text-xs font-normal" :class="adminTheme === 'light' ? 'text-slate-500' : 'text-[#8E8E93]'">ziyaret</span>
                    </div>
                    <span class="text-[10px] font-bold block mt-0.5" :class="adminTheme === 'light' ? 'text-purple-700' : 'text-purple-400'">
                      {{ analytics?.directVisits || 0 }} Doğrudan Web
                    </span>
                  </div>
                </div>
              </div>

              <!-- İki Büyük Karşılaştırma Kartı: Mobil vs Masaüstü Tarayıcı -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                
                <!-- MOBİL CİHAZLAR KARTI -->
                <div 
                  class="p-5 rounded-2xl border relative overflow-hidden group transition-all shadow-lg"
                  :class="adminTheme === 'light' 
                    ? 'bg-white border-emerald-300 hover:border-emerald-500 shadow-sm' 
                    : 'bg-gradient-to-br from-[#121212] to-[#181818] border-emerald-500/30 hover:border-emerald-500/60 shadow-lg'"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <div class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                        <Smartphone class="w-5 h-5" />
                      </div>
                      <div>
                        <h4 class="text-sm font-bold" :class="adminTheme === 'light' ? 'text-slate-900' : 'text-white'">Mobil Cihazlar</h4>
                        <span class="text-[11px] font-medium" :class="adminTheme === 'light' ? 'text-emerald-700' : 'text-emerald-400'">Akıllı Telefon & Tablet</span>
                      </div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-black border" :class="adminTheme === 'light' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'">
                      %{{ analytics?.qrMobilePercent || 0 }}
                    </span>
                  </div>

                  <div class="mt-4 space-y-2">
                    <div class="flex items-baseline justify-between text-xs">
                      <span :class="adminTheme === 'light' ? 'text-slate-600' : 'text-neutral-400'">QR Kod Giriş Sayısı:</span>
                      <span class="font-mono font-bold text-sm" :class="adminTheme === 'light' ? 'text-slate-900' : 'text-white'">{{ analytics?.qrMobile || 0 }} oturum</span>
                    </div>

                    <!-- Progress Bar (Neon Emerald to Lime) -->
                    <div class="w-full h-3 rounded-full overflow-hidden" :class="adminTheme === 'light' ? 'bg-slate-100 border border-slate-200' : 'bg-[#0A0A0A] border border-white/5'">
                      <div 
                        class="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#FFFF00] transition-all duration-700 shadow-sm"
                        :style="{ width: `${analytics?.qrMobilePercent || 0}%` }"
                      ></div>
                    </div>

                    <p class="text-[11px] pt-1 leading-relaxed" :class="adminTheme === 'light' ? 'text-slate-600' : 'text-neutral-400'">
                      📱 Kamera veya QR tarayıcı uygulamalarıyla doğrudan mobil tarayıcıda açılan ziyaretler.
                    </p>
                  </div>
                </div>

                <!-- MASAÜSTÜ TARAYICILAR KARTI -->
                <div 
                  class="p-5 rounded-2xl border relative overflow-hidden group transition-all shadow-lg"
                  :class="adminTheme === 'light' 
                    ? 'bg-white border-sky-300 hover:border-sky-500 shadow-sm' 
                    : 'bg-gradient-to-br from-[#121212] to-[#181818] border-sky-500/30 hover:border-sky-500/60 shadow-lg'"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <div class="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500">
                        <Monitor class="w-5 h-5" />
                      </div>
                      <div>
                        <h4 class="text-sm font-bold" :class="adminTheme === 'light' ? 'text-slate-900' : 'text-white'">Masaüstü Web Tarayıcıları</h4>
                        <span class="text-[11px] font-medium" :class="adminTheme === 'light' ? 'text-sky-700' : 'text-sky-400'">Chrome, Safari, Edge, Firefox</span>
                      </div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-black border" :class="adminTheme === 'light' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-500/15 text-sky-400 border-sky-500/30'">
                      %{{ analytics?.qrDesktopPercent || 0 }}
                    </span>
                  </div>

                  <div class="mt-4 space-y-2">
                    <div class="flex items-baseline justify-between text-xs">
                      <span :class="adminTheme === 'light' ? 'text-slate-600' : 'text-neutral-400'">QR Kod Giriş Sayısı:</span>
                      <span class="font-mono font-bold text-sm" :class="adminTheme === 'light' ? 'text-slate-900' : 'text-white'">{{ analytics?.qrDesktop || 0 }} oturum</span>
                    </div>

                    <!-- Progress Bar (Sky Blue to Cyan) -->
                    <div class="w-full h-3 rounded-full overflow-hidden" :class="adminTheme === 'light' ? 'bg-slate-100 border border-slate-200' : 'bg-[#0A0A0A] border border-white/5'">
                      <div 
                        class="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-500 transition-all duration-700 shadow-sm"
                        :style="{ width: `${analytics?.qrDesktopPercent || 0}%` }"
                      ></div>
                    </div>

                    <p class="text-[11px] pt-1 leading-relaxed" :class="adminTheme === 'light' ? 'text-slate-600' : 'text-neutral-400'">
                      💻 Masaüstü web tarayıcısı, emülatör veya web kamerasıyla açılan QR oturumları.
                    </p>
                  </div>
                </div>

              </div>

              <!-- Trafik Kaynağı Dağılım Çubuğu (QR vs Doğrudan) -->
              <div :class="['p-4 rounded-2xl border mb-6', themeClasses.boxInner]">
                <div class="flex items-center justify-between text-xs mb-2">
                  <span :class="['font-semibold', themeClasses.titleText]">Erişim Kanalı Dağılımı (QR Kod Taraması vs Doğrudan Bağlantı)</span>
                  <div class="flex items-center gap-3 text-[11px]">
                    <span class="flex items-center gap-1.5 font-bold" :class="adminTheme === 'light' ? 'text-amber-800' : 'text-[#FFFF00]'">
                      <span class="w-2.5 h-2.5 rounded-full" :class="adminTheme === 'light' ? 'bg-amber-600' : 'bg-[#FFFF00]'"></span>
                      <span>QR Kod: %{{ (analytics?.totalVisits || 0) > 0 ? Math.round(((analytics?.qrVisits || 0) / analytics.totalVisits) * 100) : 0 }}</span>
                    </span>
                    <span class="flex items-center gap-1.5 font-medium" :class="adminTheme === 'light' ? 'text-slate-700' : 'text-neutral-400'">
                      <span class="w-2.5 h-2.5 rounded-full" :class="adminTheme === 'light' ? 'bg-slate-400' : 'bg-neutral-600'"></span>
                      <span>Doğrudan Web: %{{ (analytics?.totalVisits || 0) > 0 ? Math.round(((analytics?.directVisits || 0) / analytics.totalVisits) * 100) : 0 }}</span>
                    </span>
                  </div>
                </div>

                <div class="w-full h-3 rounded-full overflow-hidden flex" :class="adminTheme === 'light' ? 'bg-slate-200 border border-slate-300' : 'bg-[#0A0A0A] border border-white/5'">
                  <div 
                    class="h-full bg-[#FFFF00] transition-all duration-700"
                    :style="{ width: `${(analytics?.totalVisits || 0) > 0 ? ((analytics?.qrVisits || 0) / analytics.totalVisits) * 100 : 0}%` }"
                    title="QR Kod Ziyaretleri"
                  ></div>
                  <div 
                    class="h-full bg-neutral-700 transition-all duration-700"
                    :style="{ width: `${(analytics?.totalVisits || 0) > 0 ? ((analytics?.directVisits || 0) / analytics.totalVisits) * 100 : 0}%` }"
                    title="Doğrudan Web Ziyaretleri"
                  ></div>
                </div>
              </div>

              
              <!-- ======================================================== -->
              <!-- QR OKUTAN CİHAZ MODELLERİ & CANLI TARAMA AKIŞI (DEVICE INTELLIGENCE) -->
              <!-- ======================================================== -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                
                <!-- 1. Cihaz Modelleri & İşletim Sistemi Dağılımı -->
                <div :class="['p-5 rounded-2xl border', themeClasses.boxInner]">
                  <div class="flex items-center justify-between mb-4 pb-2 border-b" :class="themeClasses.headerBorder">
                    <h4 class="text-xs font-bold flex items-center gap-2" :class="themeClasses.titleText">
                      <Smartphone class="w-4 h-4 text-[#FFFF00]" />
                      <span>QR Okutan Cihaz & İşletim Sistemi Dağılımı</span>
                    </h4>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Taranan Cihazlar
                    </span>
                  </div>

                  <!-- OS Hızlı Özet Kapsülleri (iOS vs Android) -->
                  <div class="grid grid-cols-3 gap-2 mb-4">
                    <div class="p-2.5 rounded-xl border text-center" :class="adminTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'">
                      <div class="text-[10px] text-slate-500 font-semibold">🍏 Apple iOS</div>
                      <div class="text-base font-black mt-0.5" :class="adminTheme === 'light' ? 'text-black' : 'text-white'">%{{ analytics?.qrDeviceStats?.iosPercent || 68 }}</div>
                    </div>
                    <div class="p-2.5 rounded-xl border text-center" :class="adminTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'">
                      <div class="text-[10px] text-slate-500 font-semibold">🤖 Android</div>
                      <div class="text-base font-black mt-0.5" :class="adminTheme === 'light' ? 'text-black' : 'text-white'">%{{ analytics?.qrDeviceStats?.androidPercent || 28 }}</div>
                    </div>
                    <div class="p-2.5 rounded-xl border text-center" :class="adminTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'">
                      <div class="text-[10px] text-slate-500 font-semibold">💻 Masaüstü/Diğer</div>
                      <div class="text-base font-black mt-0.5" :class="adminTheme === 'light' ? 'text-black' : 'text-white'">%{{ analytics?.qrDeviceStats?.desktopPercent || 4 }}</div>
                    </div>
                  </div>

                  <!-- En Çok Okutan Cihaz Modelleri Listesi -->
                  <div class="space-y-2.5">
                    <div 
                      v-for="(dev, dIdx) in (analytics?.topDeviceModels || [])" 
                      :key="dIdx" 
                      class="flex items-center justify-between text-xs"
                    >
                      <div class="flex items-center gap-2 truncate">
                        <span class="text-sm">{{ dev.icon === 'apple' ? '🍏' : (dev.icon === 'android' ? '🤖' : '💻') }}</span>
                        <span class="font-medium truncate" :class="themeClasses.titleText">{{ dev.model }}</span>
                      </div>
                      <div class="flex items-center gap-2 shrink-0 font-mono">
                        <span class="text-[11px] text-slate-400">{{ dev.count }} tarama</span>
                        <span class="font-bold text-xs" :class="themeClasses.titleText">%{{ dev.percent }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 2. Son QR Taramaları Canlı Akışı (Live Scan Activity) -->
                <div :class="['p-5 rounded-2xl border flex flex-col justify-between', themeClasses.boxInner]">
                  <div>
                    <div class="flex items-center justify-between mb-4 pb-2 border-b" :class="themeClasses.headerBorder">
                      <h4 class="text-xs font-bold flex items-center gap-2" :class="themeClasses.titleText">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Son QR Okutan Cihazlar (Canlı Akış)</span>
                      </h4>
                      <span class="text-[10px] font-mono text-neutral-400">Son Hareketler</span>
                    </div>

                    <!-- Canlı Akış Listesi -->
                    <div class="space-y-2.5">
                      <div 
                        v-for="(scan, sIdx) in (analytics?.recentQrScans || [])" 
                        :key="sIdx" 
                        class="p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors"
                        :class="adminTheme === 'light' ? 'bg-white border-slate-200' : 'bg-black/30 border-white/5'"
                      >
                        <div class="flex items-center gap-2.5 min-w-0">
                          <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" :class="scan.os === 'iOS' ? 'bg-slate-800 text-white' : 'bg-emerald-950 text-emerald-400'">
                            <span class="text-xs">{{ scan.os === 'iOS' ? '🍏' : '🤖' }}</span>
                          </div>
                          <div class="min-w-0">
                            <div class="font-bold text-xs truncate" :class="themeClasses.titleText">{{ scan.model }}</div>
                            <div class="text-[10px] text-slate-400 truncate">{{ scan.os }} • {{ scan.browser }}</div>
                          </div>
                        </div>

                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 font-medium" :class="adminTheme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-neutral-400'">
                          {{ scan.timeAgo }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="mt-3 pt-3 border-t text-[11px] flex items-center justify-between text-slate-400" :class="themeClasses.headerBorder">
                    <span>Kamera ve QR tarayıcı algılama devrede</span>
                    <span class="text-[#FFFF00] font-semibold">Tüm QR taramaları kaydediliyor</span>
                  </div>
                </div>

              </div>

              <!-- Canlı Test Simülatörü Araç Çubuğu -->
              <div class="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3" :class="themeClasses.headerBorder">
                <div class="flex items-center gap-2">
                  <Sparkles class="w-4 h-4 text-[#FFFF00]" />
                  <span :class="['text-xs font-bold', themeClasses.titleText]">Canlı Test Simülatörü:</span>
                  <span :class="['text-[11px]', themeClasses.subText]">İstatistikleri test etmek için tek tıkla sanal ziyaret gönderin:</span>
                </div>
                
                <div class="flex items-center flex-wrap gap-2">
                  <button 
                    type="button"
                    @click="handleSimulateVisit('mobile', 'qr')"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Smartphone class="w-3.5 h-3.5" />
                    <span>+1 Mobil QR Girişi</span>
                  </button>
                  <button 
                    type="button"
                    @click="handleSimulateVisit('desktop', 'qr')"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Monitor class="w-3.5 h-3.5" />
                    <span>+1 Tarayıcı QR Girişi</span>
                  </button>
                  <button 
                    type="button"
                    @click="handleSimulateVisit('desktop', 'direct')"
                    class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer border"
                    :class="adminTheme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'"
                  >
                    <Globe class="w-3.5 h-3.5" />
                    <span>+1 Doğrudan Web</span>
                  </button>
                </div>
              </div>

            </div>

            <!-- Tıklama Dağılımı ve İlerleme Çubukları -->
            <div :class="['border rounded-3xl p-6 transition-colors', themeClasses.cardBg]">
              <div :class="['flex items-center justify-between pb-3 mb-5 border-b', themeClasses.headerBorder]">
                <div>
                  <h3 :class="['text-sm font-bold flex items-center gap-2', themeClasses.titleText]">
                    <TrendingUp class="w-4 h-4 text-[#FFFF00]" />
                    <span>Bağlantı Başına Tıklama Dağılımı</span>
                  </h3>
                  <p :class="['text-xs mt-0.5', themeClasses.subText]">
                    Hangi linklerin ziyaretçileriniz tarafından daha çok ilgi gördüğünü inceleyin.
                  </p>
                </div>
                <button 
                  v-if="totalClicks > 0"
                  @click="handleResetAllClicks"
                  class="text-xs text-rose-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Sıfırla</span>
                </button>
              </div>

              <div class="space-y-4">
                <div 
                  v-for="link in links" 
                  :key="link.id" 
                  class="space-y-1.5"
                >
                  <div class="flex items-center justify-between text-xs">
                    <span :class="['font-medium truncate max-w-[280px]', themeClasses.titleText]">
                      {{ link.title }}
                    </span>
                    <span class="font-mono font-bold" :class="adminTheme === 'light' ? 'text-slate-900' : 'text-[#FFFF00]'">
                      {{ link.clicks || 0 }} tık ({{ totalClicks > 0 ? Math.round(((link.clicks || 0) / totalClicks) * 100) : 0 }}%)
                    </span>
                  </div>
                  <!-- Progress Bar (CRM Neon Yellow & Emerald) -->
                  <div class="w-full h-2.5 rounded-full overflow-hidden" :class="adminTheme === 'light' ? 'bg-slate-200 border border-slate-300' : 'bg-[#101010] border border-[#222222]'">
                    <div 
                      class="h-full rounded-full transition-all duration-500 shadow-sm"
                      :class="adminTheme === 'light' ? 'bg-yellow-400' : 'bg-[#FFFF00]'"
                      :style="{ width: totalClicks > 0 ? `${((link.clicks || 0) / totalClicks) * 100}%` : '0%' }"
                    ></div>
                  </div>
                </div>

                <div v-if="links.length === 0" :class="['text-center py-8 text-xs', themeClasses.subText]">
                  Henüz istatistiği gösterilecek bağlantı bulunmuyor.
                </div>
              </div>
            </div>

          </div>

          <!-- ========================================== -->
          <!-- SEKME 4: İLETİŞİM & MESAJLAR (CRM INBOX) -->
          <!-- ========================================== -->
          <div v-else-if="activeTab === 'messages'" class="space-y-6">
            
            <!-- Başlık ve Filtreleme Başlığı -->
            <div :class="['border rounded-3xl p-6 transition-colors', themeClasses.cardBg]">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b" :class="themeClasses.headerBorder">
                <div>
                  <h3 :class="['text-base font-bold flex items-center gap-2.5', themeClasses.titleText]">
                    <Inbox class="w-5 h-5 text-[#FFFF00]" />
                    <span>Gelen İletişim Mesajları</span>
                    <span 
                      v-if="unreadMessagesCount > 0" 
                      class="px-2 py-0.5 text-xs font-black rounded-full bg-[#FFFF00] text-black shadow-sm"
                    >
                      {{ unreadMessagesCount }} Yeni
                    </span>
                  </h3>
                  <p :class="['text-xs mt-1', themeClasses.subText]">
                    Profil sayfanızdaki "Bana Mesaj Bırakın" iletişim formu üzerinden ziyaretçileriniz tarafından iletilen mesajlar.
                  </p>
                </div>

                <!-- Aksiyonlar: Örnek Mesaj Simülasyonu -->
                <div class="flex items-center gap-2 flex-wrap">
                  <button 
                    @click="handleSimulateMessage"
                    type="button"
                    class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    :class="adminTheme === 'light' 
                      ? 'bg-slate-900 text-white hover:bg-slate-800' 
                      : 'bg-[#FFFF00] text-black hover:bg-yellow-300 font-extrabold'"
                  >
                    <Sparkles class="w-3.5 h-3.5" />
                    <span>Örnek Mesaj Simüle Et</span>
                  </button>
                </div>
              </div>

              <!-- İşlem Bildirimi (Feedback Banner) -->
              <div 
                v-if="messageActionFeedback" 
                class="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-fadeIn"
              >
                <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
                <span>{{ messageActionFeedback }}</span>
              </div>

              <!-- İstatistik Özet Kartları (3'lü Grid) -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
                <div :class="['p-4 rounded-2xl border transition-all', themeClasses.boxInner]">
                  <div class="flex items-center justify-between">
                    <span :class="['text-xs font-medium', themeClasses.subText]">Toplam Mesaj</span>
                    <Inbox class="w-4 h-4 text-sky-400" />
                  </div>
                  <div class="text-2xl font-black mt-2 font-mono" :class="themeClasses.titleText">
                    {{ messages.length }}
                  </div>
                  <div class="text-[11px] mt-1 text-slate-500">Gelen kutusu toplam hacmi</div>
                </div>

                <div :class="['p-4 rounded-2xl border transition-all', themeClasses.boxInner]">
                  <div class="flex items-center justify-between">
                    <span :class="['text-xs font-medium', themeClasses.subText]">Okunmamış Mesajlar</span>
                    <MessageSquare class="w-4 h-4 text-[#FFFF00]" />
                  </div>
                  <div class="text-2xl font-black mt-2 font-mono flex items-center gap-2" :class="unreadMessagesCount > 0 ? (adminTheme === 'light' ? 'text-amber-600' : 'text-[#FFFF00]') : themeClasses.titleText">
                    <span>{{ unreadMessagesCount }}</span>
                    <span v-if="unreadMessagesCount > 0" class="text-xs font-sans px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Yanıt Bekliyor</span>
                  </div>
                  <div class="text-[11px] mt-1 text-slate-500">İncelemeniz gereken yeni talepler</div>
                </div>

                <div :class="['p-4 rounded-2xl border transition-all', themeClasses.boxInner]">
                  <div class="flex items-center justify-between">
                    <span :class="['text-xs font-medium', themeClasses.subText]">İncelenme Oranı</span>
                    <MailCheck class="w-4 h-4 text-emerald-400" />
                  </div>
                  <div class="text-2xl font-black mt-2 font-mono text-emerald-400">
                    {{ messages.length > 0 ? Math.round(((messages.length - unreadMessagesCount) / messages.length) * 100) : 100 }}%
                  </div>
                  <div class="text-[11px] mt-1 text-slate-500">Okunmuş ve gözden geçirilmiş</div>
                </div>
              </div>

              <!-- Filtre Sekmeleri (Tümü / Okunmamış / Okunmuş) -->
              <div class="flex items-center gap-2 mt-5 pt-4 border-t" :class="themeClasses.headerBorder">
                <button 
                  @click="messageFilter = 'all'"
                  type="button"
                  :class="[
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
                    messageFilter === 'all'
                      ? (adminTheme === 'light' ? 'bg-slate-900 text-white' : 'bg-[#FFFF00] text-black font-extrabold shadow-sm')
                      : (adminTheme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-zinc-400 hover:bg-[#252525]')
                  ]"
                >
                  <span>Tümü</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded-md" :class="messageFilter === 'all' ? (adminTheme === 'light' ? 'bg-slate-700 text-white' : 'bg-black text-[#FFFF00]') : 'bg-black/10 dark:bg-white/10'">
                    {{ messages.length }}
                  </span>
                </button>

                <button 
                  @click="messageFilter = 'unread'"
                  type="button"
                  :class="[
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
                    messageFilter === 'unread'
                      ? (adminTheme === 'light' ? 'bg-slate-900 text-white' : 'bg-[#FFFF00] text-black font-extrabold shadow-sm')
                      : (adminTheme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-zinc-400 hover:bg-[#252525]')
                  ]"
                >
                  <span>Okunmamış</span>
                  <span 
                    class="text-[10px] px-1.5 py-0.5 rounded-md font-bold" 
                    :class="unreadMessagesCount > 0 ? 'bg-amber-400 text-black' : (adminTheme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-zinc-800 text-zinc-400')"
                  >
                    {{ unreadMessagesCount }}
                  </span>
                </button>

                <button 
                  @click="messageFilter = 'read'"
                  type="button"
                  :class="[
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
                    messageFilter === 'read'
                      ? (adminTheme === 'light' ? 'bg-slate-900 text-white' : 'bg-[#FFFF00] text-black font-extrabold shadow-sm')
                      : (adminTheme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-zinc-400 hover:bg-[#252525]')
                  ]"
                >
                  <span>Okunmuş</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded-md" :class="messageFilter === 'read' ? (adminTheme === 'light' ? 'bg-slate-700 text-white' : 'bg-black text-[#FFFF00]') : 'bg-black/10 dark:bg-white/10'">
                    {{ messages.length - unreadMessagesCount }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Mesaj Listesi -->
            <div class="space-y-3.5">
              
              <!-- Mesaj Yoksa Boş Durum -->
              <div 
                v-if="filteredMessages.length === 0" 
                :class="['border rounded-3xl p-12 text-center transition-colors', themeClasses.cardBg]"
              >
                <div class="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3" :class="adminTheme === 'light' ? 'bg-slate-100 text-slate-400' : 'bg-[#222222] text-zinc-500'">
                  <Inbox class="w-7 h-7" />
                </div>
                <h4 :class="['text-sm font-bold', themeClasses.titleText]">
                  {{ messageFilter === 'unread' ? 'Hiç okunmamış mesajınız yok!' : 'Henüz mesaj bulunmuyor' }}
                </h4>
                <p :class="['text-xs mt-1 max-w-sm mx-auto', themeClasses.subText]">
                  {{ messageFilter === 'unread' 
                    ? 'Tüm ziyaretçi taleplerini incelediniz. Harika iş çıkardınız!' 
                    : 'Ziyaretçileriniz profilinizdeki "Bana Mesaj Bırakın" formunu doldurdukça burada listelenecektir.' 
                  }}
                </p>
                <button 
                  v-if="messages.length === 0"
                  @click="handleSimulateMessage"
                  type="button"
                  class="mt-4 px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm"
                  :class="adminTheme === 'light' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-[#FFFF00] text-black font-extrabold'"
                >
                  <Sparkles class="w-3.5 h-3.5" />
                  <span>İlk Örnek Mesajı Oluştur</span>
                </button>
              </div>

              <!-- Mesaj Kartları -->
              <div 
                v-for="msg in filteredMessages" 
                :key="msg.id"
                :class="[
                  'border rounded-2xl p-5 transition-all duration-200 relative',
                  themeClasses.cardBg,
                  !msg.isRead 
                    ? (adminTheme === 'light' ? 'border-amber-400/80 shadow-md shadow-amber-500/5 bg-amber-50/30' : 'border-[#FFFF00]/60 shadow-md shadow-[#FFFF00]/5 bg-[#1a1a14]') 
                    : ''
                ]"
              >
                <!-- Sol Vurgu Çubuğu (Okunmamış için) -->
                <div 
                  v-if="!msg.isRead"
                  class="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full"
                  :class="adminTheme === 'light' ? 'bg-amber-500' : 'bg-[#FFFF00]'"
                ></div>

                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <!-- Gönderen Bilgileri -->
                  <div class="flex items-start gap-3">
                    <!-- Avatar / Baş harfler -->
                    <div 
                      class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm"
                      :class="!msg.isRead 
                        ? (adminTheme === 'light' ? 'bg-amber-400 text-slate-950' : 'bg-[#FFFF00] text-black font-black') 
                        : (adminTheme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-[#252525] text-zinc-300')"
                    >
                      {{ getInitials(msg.name) }}
                    </div>

                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span :class="['font-bold text-sm', themeClasses.titleText]">
                          {{ msg.name }}
                        </span>
                        <span 
                          v-if="!msg.isRead" 
                          class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                          :class="adminTheme === 'light' ? 'bg-[#FFFF00] text-black' : 'bg-[#FFFF00] text-black'"
                        >
                          YENİ
                        </span>
                      </div>

                      <div class="flex items-center gap-2 text-xs mt-0.5" :class="themeClasses.subText">
                        <a 
                          :href="'mailto:' + msg.email" 
                          class="hover:underline flex items-center gap-1 font-medium text-sky-400"
                          title="E-posta ile yanıtla"
                        >
                          <Mail class="w-3 h-3" />
                          <span>{{ msg.email }}</span>
                        </a>
                        <span>•</span>
                        <span>{{ formatMessageDate(msg.createdAt) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Eylem Butonları -->
                  <div class="flex items-center gap-1.5 self-end sm:self-auto">
                    <!-- E-posta ile Yanıtla -->
                    <a 
                      :href="'mailto:' + msg.email + '?subject=' + encodeURIComponent('Mesajınız Hk. (' + profile.name + ')') + '&body=' + encodeURIComponent('\n\n--- İlettiğiniz Mesaj ---\n' + msg.message)"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="E-posta ile yanıtla"
                      :class="[
                        'px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border',
                        adminTheme === 'light' 
                          ? 'border-slate-200 text-slate-700 hover:bg-slate-100' 
                          : 'border-[#2d2d2d] text-zinc-300 hover:bg-[#252525]'
                      ]"
                    >
                      <ExternalLink class="w-3.5 h-3.5 text-sky-400" />
                      <span class="hidden sm:inline">Yanıtla</span>
                    </a>

                    <!-- Okundu / Okunmadı Durumunu Değiştir -->
                    <button 
                      @click="handleToggleMessageRead(msg.id, msg.isRead)"
                      type="button"
                      :title="msg.isRead ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'"
                      :class="[
                        'px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border',
                        msg.isRead
                          ? (adminTheme === 'light' ? 'border-slate-200 text-slate-500 hover:bg-slate-100' : 'border-[#2d2d2d] text-zinc-400 hover:bg-[#252525]')
                          : (adminTheme === 'light' ? 'border-amber-300 bg-amber-100/50 text-amber-800 hover:bg-amber-100' : 'border-[#FFFF00]/40 bg-[#FFFF00]/10 text-[#FFFF00] hover:bg-[#FFFF00]/20')
                      ]"
                    >
                      <component :is="msg.isRead ? MailOpen : MailCheck" class="w-3.5 h-3.5" />
                      <span class="hidden sm:inline">{{ msg.isRead ? 'Okunmadı Yap' : 'Okundu Yap' }}</span>
                    </button>

                    <!-- Silme Butonu -->
                    <button 
                      @click="handleDeleteMessage(msg.id)"
                      type="button"
                      title="Mesajı sil"
                      class="p-1.5 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Mesaj İçeriği -->
                <div 
                  class="mt-3.5 p-3.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap border"
                  :class="[
                    adminTheme === 'light' 
                      ? 'bg-white text-slate-800 border-slate-200' 
                      : 'bg-[#121212] text-zinc-200 border-[#222222]'
                  ]"
                >
                  {{ msg.message }}
                </div>
              </div>

            </div>

          </div>

          <!-- ========================================== -->
          <!-- SEKME 5: AYARLAR & HESAP (SETTINGS) -->
          <!-- ========================================== -->
          <div v-else-if="activeTab === 'settings'" class="space-y-6">

            <!-- ======================================================== -->
            <!-- 0. BİYOMETRİK KİMLİK DOĞRULAMA (WebAuthn / Passkeys) -->
            <!-- ======================================================== -->
            <div :class="['border rounded-3xl p-6 transition-colors space-y-6', themeClasses.cardBg]">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b" :class="themeClasses.headerBorder">
                <div>
                  <h3 :class="['text-base font-bold flex items-center gap-2.5', themeClasses.titleText]">
                    <Fingerprint class="w-5 h-5 text-[#FFFF00]" />
                    <span>Biyometrik Kimlik Doğrulama (Passkeys / WebAuthn)</span>
                    <span class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/30">
                      FIDO2 Standart
                    </span>
                  </h3>
                  <p :class="['text-xs mt-1', themeClasses.subText]">
                    Şifre girmeyi tamamen ortadan kaldırın; telefonunuzdaki Parmak İzi (Touch ID) veya Yüz Tanıma (Face ID) ile doğrudan giriş yapın.
                  </p>
                </div>
              </div>

              <!-- Passkey Ekleme Alanı -->
              <div class="p-4 rounded-2xl border" :class="themeClasses.boxInner">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex-1">
                    <label class="block text-xs font-bold text-white mb-1">
                      Bu Cihazı / Passkey'i Kaydet
                    </label>
                    <input 
                      v-model="passkeyDeviceInput"
                      type="text" 
                      placeholder="Örn: iPhone 16 Pro (Face ID) veya MacBook (Touch ID)"
                      :class="['w-full px-3.5 py-2 rounded-xl border focus:outline-none text-xs transition-colors', themeClasses.inputBg]"
                    />
                  </div>
                  <button 
                    type="button"
                    @click="handleRegisterPasskey"
                    :disabled="isRegisteringPasskey"
                    class="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-md self-end sm:self-auto"
                  >
                    <Fingerprint class="w-4 h-4 text-black" :class="{ 'animate-pulse': isRegisteringPasskey }" />
                    <span>{{ isRegisteringPasskey ? 'Biyometrik Taranıyor...' : 'Yeni Passkey Ekle' }}</span>
                  </button>
                </div>
              </div>

              <!-- Kayıtlı Passkey Cihazları Listesi -->
              <div>
                <div class="text-xs font-bold text-white mb-2 flex items-center justify-between">
                  <span>Kayıtlı Biyometrik Cihazlarınız ({{ linkStore.passkeysList.length }}):</span>
                  <button type="button" @click="linkStore.fetchPasskeys" class="text-[11px] text-slate-400 hover:text-white flex items-center gap-1">
                    <RefreshCw class="w-3 h-3" />
                    <span>Listeyi Tazele</span>
                  </button>
                </div>

                <div v-if="linkStore.passkeysList.length === 0" class="p-4 rounded-xl border border-dashed border-[#282828] text-center text-xs text-slate-500 font-mono">
                  Henüz kayıtlı bir Passkey bulunmuyor. Yukarıdan mevcut cihazınızı tek tıkla ekleyebilirsiniz.
                </div>

                <div v-else class="space-y-2">
                  <div 
                    v-for="pk in linkStore.passkeysList" 
                    :key="pk.id"
                    class="p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors"
                    :class="adminTheme === 'light' ? 'bg-white border-slate-200' : 'bg-[#181818] border-[#282828]'"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-[#FFFF00]/15 border border-[#FFFF00]/30 flex items-center justify-center text-[#FFFF00] shrink-0">
                        <Fingerprint class="w-5 h-5" />
                      </div>
                      <div>
                        <div class="text-xs font-bold text-white">{{ pk.deviceName || 'Biyometrik Cihaz' }}</div>
                        <div class="text-[10px] text-slate-400 font-mono">
                          ID: {{ pk.id.slice(0, 14) }}... • Kayıt: {{ new Date(pk.createdAt).toLocaleDateString('tr-TR') }}
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      @click="handleDeletePasskey(pk.id)"
                      class="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                      title="Passkey'i Kaldır"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- ======================================================== -->
            <!-- VERİ TAŞINABİLİRLİĞİ: YEDEK ALMA & GERİ YÜKLEME (DATA PORTABILITY) -->
            <!-- ======================================================== -->
            <div :class="['border rounded-3xl p-6 transition-colors space-y-6', themeClasses.cardBg]">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b" :class="themeClasses.headerBorder">
                <div>
                  <h3 :class="['text-base font-bold flex items-center gap-2.5', themeClasses.titleText]">
                    <FileDown class="w-5 h-5 text-amber-400" />
                    <span>Profil Dışa/İçe Aktarma (Data Portability)</span>
                    <span class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Yedek & Senkronizasyon
                    </span>
                  </h3>
                  <p :class="['text-xs mt-1', themeClasses.subText]">
                    Kullanıcı verilerinizin kontrolü sizde. Tüm profil ayarlarınızı, link ağacınızı ve ayarlarınızı .json veya .csv formatında indirin ya da yedek dosyanızı yükleyerek geri yükleyin.
                  </p>
                </div>

                <!-- Hızlı vCard Testi -->
                <button 
                  type="button"
                  @click="handleAdminDownloadVCard"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  :class="adminTheme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-white/10 hover:bg-[#FFFF00] hover:text-black text-white border-white/10'"
                  title="Telefon rehberine eklenecek dijital kartviziti test et"
                >
                  <UserPlus class="w-3.5 h-3.5" />
                  <span>vCard (.vcf) Test İndir</span>
                </button>
              </div>

              <!-- Geri Bildirim Mesajları -->
              <div v-if="portabilityFeedback" class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
                <span>{{ portabilityFeedback }}</span>
              </div>
              <div v-if="portabilityError" class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertCircle class="w-4 h-4 flex-shrink-0" />
                <span>{{ portabilityError }}</span>
              </div>

              <!-- 2 Sütunlu Kart: Dışa Aktar vs Geri Yükle -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <!-- Sol Kutu: Yedek Alma (Export) -->
                <div :class="['p-4 rounded-2xl border flex flex-col justify-between space-y-4 transition-all', themeClasses.boxInner]">
                  <div>
                    <div class="flex items-center gap-2 font-bold mb-1.5" :class="themeClasses.titleText">
                      <FileDown class="w-4 h-4 text-[#FFFF00]" />
                      <span>Yedek Alma (Export)</span>
                    </div>
                    <p :class="['text-[11px] leading-relaxed', themeClasses.subText]">
                      Tüm profil bilgilerinizi, sosyal medya bağlantılarınızı, tüm linklerinizi ve ayarlarınızı bilgisayarınıza güvenle indirin.
                    </p>
                  </div>

                  <div class="flex items-center gap-2 pt-2 border-t" :class="themeClasses.headerBorder">
                    <button 
                      type="button"
                      @click="handleExportBackup('json')"
                      :disabled="isExporting"
                      class="flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                      :class="adminTheme === 'light' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-[#FFFF00] text-black hover:bg-yellow-300'"
                    >
                      <FileJson class="w-3.5 h-3.5" />
                      <span>{{ isExporting ? 'Hazırlanıyor...' : '.JSON İndir (Tam Yedek)' }}</span>
                    </button>

                    <button 
                      type="button"
                      @click="handleExportBackup('csv')"
                      :disabled="isExporting"
                      class="py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      :class="adminTheme === 'light' ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white'"
                      title="Link listesini Excel / E-Tablo uyumlu CSV formatında indir"
                    >
                      <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-400" />
                      <span>.CSV İndir</span>
                    </button>
                  </div>
                </div>

                <!-- Sağ Kutu: Geri Yükleme (Import) -->
                <div :class="['p-4 rounded-2xl border flex flex-col justify-between space-y-4 transition-all', themeClasses.boxInner]">
                  <div>
                    <div class="flex items-center gap-2 font-bold mb-1.5" :class="themeClasses.titleText">
                      <FileUp class="w-4 h-4 text-emerald-400" />
                      <span>Yedekten Geri Yükleme (Import)</span>
                    </div>
                    <p :class="['text-[11px] leading-relaxed', themeClasses.subText]">
                      Daha önce indirdiğiniz <code class="font-mono text-[10px] text-amber-400">.json</code> formatındaki yedek dosyasını yükleyerek tüm profilinizi ve linklerinizi saniyeler içinde eski haline getirin.
                    </p>
                  </div>

                  <div class="pt-2 border-t flex items-center gap-2" :class="themeClasses.headerBorder">
                    <!-- Gizli Dosya Seçici Girişi -->
                    <input 
                      ref="importFileInput" 
                      type="file" 
                      accept=".json,application/json" 
                      class="hidden" 
                      @change="handleFileImport" 
                    />

                    <button 
                      type="button"
                      @click="triggerImportFile"
                      :disabled="isImporting"
                      class="w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      :class="adminTheme === 'light' 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600' 
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'"
                    >
                      <FileUp class="w-3.5 h-3.5" :class="{ 'animate-bounce': isImporting }" />
                      <span>{{ isImporting ? 'Yedek Geri Yükleniyor...' : 'Yedek Dosyası Seç (.JSON)' }}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <!-- Hesap & Oturum Bilgileri -->
            <div :class="['border rounded-2xl p-6 transition-colors', themeClasses.cardBg]">
              <h3 :class="['text-sm font-bold pb-3 mb-4 border-b flex items-center gap-2', themeClasses.titleText, themeClasses.headerBorder]">
                <ShieldCheck class="w-4 h-4 text-emerald-400" />
                <span>Hesap & Güvenlik Durumu</span>
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div :class="['p-4 rounded-xl border', themeClasses.boxInner]">
                  <p :class="themeClasses.subText">Giriş Yapılan Kullanıcı</p>
                  <p :class="['text-sm font-bold mt-1', themeClasses.titleText]">
                    {{ authStore.user?.username || 'admin' }} ({{ authStore.user?.name || profile.name }})
                  </p>
                </div>

                <div :class="['p-4 rounded-xl border', themeClasses.boxInner]">
                  <p :class="themeClasses.subText">Veritabanı Entegrasyonu</p>
                  <p class="text-sm font-bold mt-1" :class="isBackendConnected ? 'text-emerald-400' : 'text-amber-400'">
                    {{ isBackendConnected ? 'PostgreSQL API Aktif & Senkronize' : 'Yerel Depolama (LocalStorage)' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- ======================================================== -->
            <!-- ÖZEL ALAN ADI & SOSYAL PAYLAŞIM ÖNİZLEME (SEO & OPENGRAPH) -->
            <!-- ======================================================== -->
            <div :class="['border rounded-3xl p-6 transition-colors space-y-6', themeClasses.cardBg]">
              
              <!-- Üst Başlık & Açıklama -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b" :class="themeClasses.headerBorder">
                <div>
                  <h3 :class="['text-base font-bold flex items-center gap-2.5', themeClasses.titleText]">
                    <Globe class="w-5 h-5 text-[#FFFF00]" />
                    <span>Özel Domain & Sosyal Paylaşım Önizleme</span>
                    <span 
                      class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm"
                      :class="seoForm.domainVerified 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'"
                    >
                      {{ seoForm.domainVerified ? 'SSL & DNS Aktif' : 'DNS Bekleniyor' }}
                    </span>
                  </h3>
                  <p :class="['text-xs mt-1', themeClasses.subText]">
                    WhatsApp, Twitter / X, LinkedIn ve Telegram'da paylaşılan linkinizin kart tasarımını canlı test edin ve arama motorları için meta etiketlerini özelleştirin.
                  </p>
                </div>

                <!-- Kaydet Butonu -->
                <div>
                  <button 
                    @click="handleSaveSeo"
                    :disabled="isSavingSeo"
                    type="button"
                    class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                    :class="adminTheme === 'light' 
                      ? 'bg-slate-900 text-white hover:bg-slate-800' 
                      : 'bg-[#FFFF00] text-black hover:bg-yellow-300 font-extrabold'"
                  >
                    <Check class="w-3.5 h-3.5" />
                    <span>{{ isSavingSeo ? 'Kaydediliyor...' : 'SEO Ayarlarını Kaydet' }}</span>
                  </button>
                </div>
              </div>

              <!-- Bildirim Başarı / Hata Mesajı -->
              <div 
                v-if="seoFeedback" 
                class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn"
              >
                <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
                <span>{{ seoFeedback }}</span>
              </div>

              <!-- BÖLÜM 1: CANLI SOSYAL PAYLAŞIM SİMÜLATÖRÜ -->
              <div class="space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <span :class="['text-xs font-bold uppercase tracking-wider', themeClasses.subText]">
                    1. Platform Canlı Kart Önizleyicisi
                  </span>

                  <!-- Platform Seçici Çipler -->
                  <div class="flex items-center gap-1.5 p-1 rounded-xl" :class="adminTheme === 'light' ? 'bg-slate-100 border border-slate-200' : 'bg-[#121212] border border-[#222222]'">
                    <button 
                      v-for="platform in [
                        { id: 'whatsapp', label: 'WhatsApp', color: 'bg-emerald-400' },
                        { id: 'twitter', label: 'Twitter / X', color: 'bg-sky-400' },
                        { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-400' },
                        { id: 'telegram', label: 'Telegram', color: 'bg-cyan-400' }
                      ]"
                      :key="platform.id"
                      @click="selectedSocialPreview = platform.id"
                      type="button"
                      :class="[
                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                        selectedSocialPreview === platform.id 
                          ? (adminTheme === 'light' ? 'bg-white text-black shadow-xs font-bold' : 'bg-[#222222] text-[#FFFF00] font-bold shadow-xs') 
                          : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white'
                      ]"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="platform.color"></span>
                      <span>{{ platform.label }}</span>
                    </button>
                  </div>
                </div>

                <!-- Önizleme Konteynerı -->
                <div class="p-4 sm:p-6 rounded-2xl border transition-all" :class="adminTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0f0f0e] border-[#222222]'">
                  
                  <!-- A. WHATSAPP SİMÜLASYONU -->
                  <div v-if="selectedSocialPreview === 'whatsapp'" class="max-w-md mx-auto">
                    <div class="text-[10px] text-center text-slate-500 mb-2 font-mono">WhatsApp Sohbet Önizlemesi</div>
                    <div class="rounded-2xl p-3 shadow-md border" :class="adminTheme === 'light' ? 'bg-[#EFEAE2] border-emerald-200/50' : 'bg-[#0b141a] border-[#202c33]'">
                      <!-- WhatsApp Mesaj Balonu -->
                      <div class="rounded-2xl overflow-hidden max-w-sm ml-auto border shadow-sm" :class="adminTheme === 'light' ? 'bg-[#D9FDD3] border-emerald-300/40 text-slate-900' : 'bg-[#1f2c34] border-[#2a3942] text-white'">
                        <!-- Görsel -->
                        <div class="w-full h-40 bg-zinc-800 relative overflow-hidden">
                          <img :src="seoForm.ogImage" alt="OG Preview" class="w-full h-full object-cover" />
                        </div>
                        <!-- Metin Alanı -->
                        <div class="p-3 space-y-1">
                          <h4 class="font-bold text-xs leading-snug line-clamp-1">{{ seoForm.metaTitle }}</h4>
                          <p class="text-[11px] opacity-80 line-clamp-2 leading-relaxed">{{ seoForm.metaDescription }}</p>
                          <div class="text-[10px] opacity-60 font-mono pt-1 flex items-center justify-between">
                            <span>{{ seoForm.customDomain || 'linkspace.me' }}</span>
                            <span>14:32 ✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- B. TWITTER / X CARD SİMÜLASYONU -->
                  <div v-else-if="selectedSocialPreview === 'twitter'" class="max-w-md mx-auto">
                    <div class="text-[10px] text-center text-slate-500 mb-2 font-mono">Twitter / X 'Summary Large Image' Kartı</div>
                    <div class="rounded-2xl overflow-hidden border shadow-lg transition-all" :class="adminTheme === 'light' ? 'bg-white border-slate-300' : 'bg-black border-[#2f3336]'">
                      <!-- Büyük Kapak Görseli -->
                      <div class="w-full h-44 bg-zinc-900 relative overflow-hidden">
                        <img :src="seoForm.ogImage" alt="Twitter Preview" class="w-full h-full object-cover" />
                      </div>
                      <div class="p-3.5 space-y-1">
                        <div class="text-[11px] text-slate-500 font-mono">{{ seoForm.customDomain || 'linkspace.me' }}</div>
                        <h4 class="font-bold text-sm leading-snug line-clamp-1" :class="adminTheme === 'light' ? 'text-black' : 'text-white'">
                          {{ seoForm.metaTitle }}
                        </h4>
                        <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {{ seoForm.metaDescription }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- C. LINKEDIN FEED SİMÜLASYONU -->
                  <div v-else-if="selectedSocialPreview === 'linkedin'" class="max-w-md mx-auto">
                    <div class="text-[10px] text-center text-slate-500 mb-2 font-mono">LinkedIn Feed Bağlantı Kartı</div>
                    <div class="rounded-xl overflow-hidden border shadow-sm" :class="adminTheme === 'light' ? 'bg-white border-slate-300' : 'bg-[#1b1f23] border-[#2d3238]'">
                      <!-- LinkedIn Post Üst Bilgisi -->
                      <div class="p-3 flex items-center gap-2.5 border-b" :class="adminTheme === 'light' ? 'border-slate-100' : 'border-[#282d33]'">
                        <img :src="profile.avatar" class="w-8 h-8 rounded-full object-cover" alt="Profile" />
                        <div>
                          <p class="text-xs font-bold leading-none" :class="adminTheme === 'light' ? 'text-black' : 'text-white'">{{ profile.name }}</p>
                          <p class="text-[10px] text-slate-500 mt-0.5">bağlantı paylaştı • 1s</p>
                        </div>
                      </div>
                      <!-- Görsel -->
                      <div class="w-full h-40 bg-zinc-800 relative overflow-hidden">
                        <img :src="seoForm.ogImage" alt="LinkedIn Preview" class="w-full h-full object-cover" />
                      </div>
                      <div class="p-3" :class="adminTheme === 'light' ? 'bg-slate-50' : 'bg-[#161a1e]'">
                        <h4 class="font-bold text-xs leading-snug line-clamp-1" :class="adminTheme === 'light' ? 'text-black' : 'text-white'">
                          {{ seoForm.metaTitle }}
                        </h4>
                        <p class="text-[11px] text-slate-500 font-mono mt-1">
                          {{ seoForm.customDomain || 'linkspace.me' }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- D. TELEGRAM SİMÜLASYONU -->
                  <div v-else-if="selectedSocialPreview === 'telegram'" class="max-w-md mx-auto">
                    <div class="text-[10px] text-center text-slate-500 mb-2 font-mono">Telegram Önizleme Balonu</div>
                    <div class="rounded-2xl p-3 shadow-md border" :class="adminTheme === 'light' ? 'bg-[#F4F4F5] border-slate-200' : 'bg-[#17212b] border-[#242f3d]'">
                      <div class="p-2.5 rounded-xl border-l-4 border-sky-400 space-y-2" :class="adminTheme === 'light' ? 'bg-white' : 'bg-[#1e2c3a]'">
                        <div class="flex items-center justify-between text-[11px] text-sky-400 font-bold">
                          <span>linkspace</span>
                          <span class="text-slate-500 font-normal font-mono text-[10px]">{{ seoForm.customDomain || 'linkspace.me' }}</span>
                        </div>
                        <h4 class="font-bold text-xs leading-snug line-clamp-1" :class="adminTheme === 'light' ? 'text-black' : 'text-white'">
                          {{ seoForm.metaTitle }}
                        </h4>
                        <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {{ seoForm.metaDescription }}
                        </p>
                        <div class="w-full h-36 rounded-lg overflow-hidden relative">
                          <img :src="seoForm.ogImage" alt="Telegram Preview" class="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- BÖLÜM 2: META TAG DÜZENLEME FORMU -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-3">
                
                <!-- Sol Kolon: Başlık ve Açıklama -->
                <div class="space-y-4">
                  <!-- Meta Başlık -->
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label :class="['text-xs font-semibold', themeClasses.inputLabel]">
                        Paylaşım Başlığı (og:title)
                      </label>
                      <span class="text-[10px] font-mono" :class="seoForm.metaTitle.length > 60 ? 'text-amber-500' : 'text-slate-500'">
                        {{ seoForm.metaTitle.length }}/60 Karakter
                      </span>
                    </div>
                    <input 
                      v-model="seoForm.metaTitle"
                      type="text"
                      placeholder="Örn: Tuba Gül - Full-Stack Developer | linkspace"
                      :class="['w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-xs transition-colors', themeClasses.inputBg]"
                    />
                  </div>

                  <!-- Meta Açıklama -->
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label :class="['text-xs font-semibold', themeClasses.inputLabel]">
                        Paylaşım Açıklaması (og:description)
                      </label>
                      <span class="text-[10px] font-mono" :class="seoForm.metaDescription.length > 160 ? 'text-amber-500' : 'text-slate-500'">
                        {{ seoForm.metaDescription.length }}/160 Karakter
                      </span>
                    </div>
                    <textarea 
                      v-model="seoForm.metaDescription"
                      rows="3"
                      placeholder="Arama motorlarında ve sosyal medyada bağlantınızın altında görüntülenecek açıklama metni..."
                      :class="['w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-xs transition-colors resize-none leading-relaxed', themeClasses.inputBg]"
                    ></textarea>
                  </div>
                </div>

                <!-- Sağ Kolon: Görsel URL ve Hazır Seçenekler -->
                <div class="space-y-4">
                  <div>
                    <label :class="['block text-xs font-semibold mb-1', themeClasses.inputLabel]">
                      Sosyal Paylaşım Görseli (og:image URL)
                    </label>
                    <input 
                      v-model="seoForm.ogImage"
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      :class="['w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-xs transition-colors font-mono', themeClasses.inputBg]"
                    />
                  </div>

                  <!-- Hızlı Görsel Şablonları -->
                  <div>
                    <span :class="['text-[11px] block mb-2 font-medium', themeClasses.subText]">Hızlı Görsel Şablonları:</span>
                    <div class="grid grid-cols-3 gap-2">
                      <button 
                        @click="setPresetOgImage('avatar')"
                        type="button"
                        :class="['px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition-all hover:border-yellow-400 flex items-center justify-center gap-1.5', themeClasses.boxInner]"
                      >
                        <User class="w-3.5 h-3.5 text-sky-400" />
                        <span>Profil Avatarı</span>
                      </button>
                      <button 
                        @click="setPresetOgImage('banner')"
                        type="button"
                        :class="['px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition-all hover:border-yellow-400 flex items-center justify-center gap-1.5', themeClasses.boxInner]"
                      >
                        <Layers class="w-3.5 h-3.5 text-purple-400" />
                        <span>Kapak Resmi</span>
                      </button>
                      <button 
                        @click="setPresetOgImage('tech')"
                        type="button"
                        :class="['px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition-all hover:border-yellow-400 flex items-center justify-center gap-1.5', themeClasses.boxInner]"
                      >
                        <Terminal class="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kod & Teknoloji</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              <!-- BÖLÜM 3: ÖZEL ALAN ADI (CUSTOM DOMAIN) & DNS YAPILANDIRMASI -->
              <div class="pt-5 border-t space-y-4" :class="themeClasses.headerBorder">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 :class="['text-xs font-bold uppercase tracking-wider', themeClasses.titleText]">
                      2. Özel Alan Adı (Custom Domain) Bağlantısı
                    </h4>
                    <p :class="['text-[11px] mt-0.5', themeClasses.subText]">
                      Kendi alan adınızı (örn: tubagul.dev veya links.tubagul.com) profilinize yönlendirin.
                    </p>
                  </div>

                  <!-- Alan Adı Doğrulama Rozeti -->
                  <div 
                    class="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border"
                    :class="seoForm.domainVerified 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'"
                  >
                    <CheckCircle2 v-if="seoForm.domainVerified" class="w-3.5 h-3.5" />
                    <AlertCircle v-else class="w-3.5 h-3.5" />
                    <span>{{ seoForm.domainVerified ? 'DNS Doğrulandı & SSL Aktif' : 'DNS Doğrulaması Bekleniyor' }}</span>
                  </div>
                </div>

                <!-- Alan Adı Giriş & Doğrulama Butonu -->
                <div class="flex flex-col sm:flex-row gap-2 max-w-xl">
                  <div class="relative flex-1">
                    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">https://</span>
                    <input 
                      v-model="seoForm.customDomain"
                      type="text"
                      placeholder="tubagul.dev"
                      :class="['w-full pl-20 pr-3.5 py-2.5 rounded-xl border focus:outline-none text-xs font-mono transition-colors', themeClasses.inputBg]"
                    />
                  </div>
                  <button 
                    @click="handleVerifyDomain"
                    :disabled="isVerifyingDomain || !seoForm.customDomain"
                    type="button"
                    class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                    :class="adminTheme === 'light' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-emerald-500 text-black hover:bg-emerald-400 font-extrabold'"
                  >
                    <Globe class="w-3.5 h-3.5" />
                    <span>{{ isVerifyingDomain ? 'Kontrol Ediliyor...' : 'DNS Doğrula' }}</span>
                  </button>
                </div>

                <!-- Doğrulama Geri Bildirimi -->
                <div v-if="domainFeedback" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
                  <span>{{ domainFeedback }}</span>
                </div>

                <!-- DNS Kayıtları Rehber Tablosu -->
                <div class="rounded-2xl border overflow-hidden text-xs" :class="themeClasses.headerBorder">
                  <div class="px-4 py-2.5 border-b font-bold flex items-center justify-between" :class="[themeClasses.boxInner, themeClasses.titleText]">
                    <span>Alan Adı Sağlayıcınızda Tanımlanacak DNS Kayıtları (Cloudflare / GoDaddy / Namecheap)</span>
                    <span class="text-[10px] text-emerald-400 font-mono">Otomatik SSL Destekli</span>
                  </div>

                  <div class="p-4 space-y-3" :class="adminTheme === 'light' ? 'bg-white' : 'bg-[#141414]'">
                    <!-- Kayıt 1: CNAME -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border" :class="themeClasses.boxInner">
                      <div class="flex items-center gap-3">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500/20 text-sky-400 border border-sky-500/30">CNAME</span>
                        <div>
                          <p class="font-mono text-xs font-bold" :class="themeClasses.titleText">Host: links (veya @)</p>
                          <p class="text-[11px] text-slate-500 font-mono">Target: cname.linkspace.me</p>
                        </div>
                      </div>
                      <button 
                        @click="copyDnsText('cname.linkspace.me', 'cname')"
                        type="button"
                        class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 self-start sm:self-auto hover:border-yellow-400 transition-colors"
                        :class="copiedDnsField === 'cname' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : (adminTheme === 'light' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#1f1f1f] text-zinc-300 border-[#333]')"
                      >
                        <component :is="copiedDnsField === 'cname' ? Check : Copy" class="w-3 h-3" />
                        <span>{{ copiedDnsField === 'cname' ? 'Kopyalandı' : 'Hedefi Kopyala' }}</span>
                      </button>
                    </div>

                    <!-- Kayıt 2: A Record -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border" :class="themeClasses.boxInner">
                      <div class="flex items-center gap-3">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">A RECORD</span>
                        <div>
                          <p class="font-mono text-xs font-bold" :class="themeClasses.titleText">Host: @ (Kök Domain)</p>
                          <p class="text-[11px] text-slate-500 font-mono">IP: 76.76.21.21</p>
                        </div>
                      </div>
                      <button 
                        @click="copyDnsText('76.76.21.21', 'arecord')"
                        type="button"
                        class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 self-start sm:self-auto hover:border-yellow-400 transition-colors"
                        :class="copiedDnsField === 'arecord' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : (adminTheme === 'light' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#1f1f1f] text-zinc-300 border-[#333]')"
                      >
                        <component :is="copiedDnsField === 'arecord' ? Check : Copy" class="w-3 h-3" />
                        <span>{{ copiedDnsField === 'arecord' ? 'Kopyalandı' : 'IP\'yi Kopyala' }}</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <!-- ======================================================== -->
            <!-- GÜVENLİK KALKANI & PERFORMANS ÖNBELLEĞİ (SECURITY & CACHE) -->
            <!-- ======================================================== -->
            <div :class="['border rounded-3xl p-6 transition-colors space-y-6', themeClasses.cardBg]">
              
              <!-- Üst Başlık & Açıklama -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b" :class="themeClasses.headerBorder">
                <div>
                  <h3 :class="['text-base font-bold flex items-center gap-2.5', themeClasses.titleText]">
                    <ShieldCheck class="w-5 h-5 text-emerald-400" />
                    <span>Güvenlik Kalkanı & Performans Önbelleği</span>
                    <span class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Aktif & Korunuyor
                    </span>
                  </h3>
                  <p :class="['text-xs mt-1', themeClasses.subText]">
                    Express Rate Limiting, Brute-Force Koruması, Güvenlik Başlıkları (HSTS / No-Sniff) ve In-Memory ETag / TTL Önbellek Sistemi.
                  </p>
                </div>

                <!-- Aksiyon Butonları -->
                <div class="flex items-center gap-2 flex-wrap">
                  <button 
                    @click="handleRefreshCache"
                    :disabled="isRefreshingCache"
                    type="button"
                    class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    :class="adminTheme === 'light' ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-[#181818] text-zinc-300 border-[#333] hover:text-white'"
                  >
                    <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshingCache }" />
                    <span>{{ isRefreshingCache ? 'Yenileniyor...' : 'Metrikleri Yenile' }}</span>
                  </button>

                  <button 
                    @click="handleClearCache"
                    :disabled="isClearingCache"
                    type="button"
                    class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                    :class="adminTheme === 'light' 
                      ? 'bg-rose-600 text-white hover:bg-rose-700' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'"
                  >
                    <RotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isClearingCache }" />
                    <span>{{ isClearingCache ? 'Temizleniyor...' : 'Önbelleği Temizle' }}</span>
                  </button>
                </div>
              </div>

              <!-- Geri Bildirim Mesajı -->
              <div 
                v-if="cacheFeedback" 
                class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn"
              >
                <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
                <span>{{ cacheFeedback }}</span>
              </div>

              <!-- 4 AKTİF GÜVENLİK KALKANI ROZETLERİ -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                
                <div :class="['p-3.5 rounded-2xl border flex flex-col justify-between transition-all', themeClasses.boxInner]">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 font-bold" :class="themeClasses.titleText">
                      <Lock class="w-4 h-4 text-emerald-400" />
                      <span>Brute-Force Kalkanı</span>
                    </div>
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <p :class="['text-[11px] leading-relaxed', themeClasses.subText]">
                    Giriş: 10/15dk • Mesaj: 5/15dk • Genel: 300/15dk kayan pencere kısıtlaması.
                  </p>
                  <div class="mt-2.5 pt-2 border-t text-[10px] font-mono text-emerald-400 font-bold" :class="themeClasses.headerBorder">
                    ✓ 429 Too Many Requests Korumalı
                  </div>
                </div>

                <div :class="['p-3.5 rounded-2xl border flex flex-col justify-between transition-all', themeClasses.boxInner]">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 font-bold" :class="themeClasses.titleText">
                      <Zap class="w-4 h-4 text-[#FFFF00]" />
                      <span>ETag & TTL Önbellek</span>
                    </div>
                    <span class="w-2 h-2 rounded-full bg-[#FFFF00] animate-pulse"></span>
                  </div>
                  <p :class="['text-[11px] leading-relaxed', themeClasses.subText]">
                    SHA-1 ETag & 60s TTL ile HTTP 304 Not Modified. Sıfır gövde transferi (&lt;2ms).
                  </p>
                  <div class="mt-2.5 pt-2 border-t text-[10px] font-mono text-[#FFFF00] font-bold" :class="themeClasses.headerBorder">
                    ✓ Gecikmesiz İstemci Önbelleği
                  </div>
                </div>

                <div :class="['p-3.5 rounded-2xl border flex flex-col justify-between transition-all', themeClasses.boxInner]">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 font-bold" :class="themeClasses.titleText">
                      <ShieldCheck class="w-4 h-4 text-sky-400" />
                      <span>Güvenlik Başlıkları</span>
                    </div>
                    <span class="w-2 h-2 rounded-full bg-sky-400"></span>
                  </div>
                  <p :class="['text-[11px] leading-relaxed', themeClasses.subText]">
                    HSTS, X-Content-Type (nosniff), SameOrigin iframe ve XSS filtreleri devrede.
                  </p>
                  <div class="mt-2.5 pt-2 border-t text-[10px] font-mono text-sky-400 font-bold" :class="themeClasses.headerBorder">
                    ✓ Clickjacking & XSS Önleme
                  </div>
                </div>

                <div :class="['p-3.5 rounded-2xl border flex flex-col justify-between transition-all', themeClasses.boxInner]">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 font-bold" :class="themeClasses.titleText">
                      <RefreshCw class="w-4 h-4 text-purple-400" />
                      <span>Canlı Invalidation</span>
                    </div>
                    <span class="w-2 h-2 rounded-full bg-purple-400"></span>
                  </div>
                  <p :class="['text-[11px] leading-relaxed', themeClasses.subText]">
                    Bağlantı veya profil güncellendiğinde ilgili RAM kayıtları anında süpürülür.
                  </p>
                  <div class="mt-2.5 pt-2 border-t text-[10px] font-mono text-purple-400 font-bold" :class="themeClasses.headerBorder">
                    ✓ %100 Güncel Ziyaretçi Verisi
                  </div>
                </div>

              </div>

              <!-- CANLI ÖNBELLEK METRİKLERİ KARTLARI -->
              <div class="space-y-3 pt-2">
                <span :class="['text-xs font-bold uppercase tracking-wider', themeClasses.subText]">
                  Canlı Önbellek Telemetrisi & Performans
                </span>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  <div :class="['p-4 rounded-2xl border flex flex-col justify-between', themeClasses.boxInner]">
                    <span :class="['text-xs', themeClasses.subText]">İsabet Oranı (Hit Rate)</span>
                    <div class="mt-2 flex items-baseline gap-1.5">
                      <span class="text-2xl font-black text-emerald-400">{{ cacheStats.hitRate || 0 }}%</span>
                    </div>
                    <div class="w-full bg-slate-700/30 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div class="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" :style="{ width: `${cacheStats.hitRate || 0}%` }"></div>
                    </div>
                  </div>

                  <div :class="['p-4 rounded-2xl border flex flex-col justify-between', themeClasses.boxInner]">
                    <span :class="['text-xs', themeClasses.subText]">Bellekten Yanıtlanan (Hits)</span>
                    <div class="mt-2 flex items-baseline gap-1.5">
                      <span class="text-2xl font-black" :class="themeClasses.titleText">{{ cacheStats.totalHits || 0 }}</span>
                      <span class="text-[11px] text-emerald-400 font-semibold">istek</span>
                    </div>
                    <span :class="['text-[10px] mt-1', themeClasses.subText]">RAM'den gecikmesiz</span>
                  </div>

                  <div :class="['p-4 rounded-2xl border flex flex-col justify-between', themeClasses.boxInner]">
                    <span :class="['text-xs', themeClasses.subText]">Taze Sorgulanan (Misses)</span>
                    <div class="mt-2 flex items-baseline gap-1.5">
                      <span class="text-2xl font-black" :class="themeClasses.titleText">{{ cacheStats.totalMisses || 0 }}</span>
                      <span class="text-[11px] text-amber-400 font-semibold">istek</span>
                    </div>
                    <span :class="['text-[10px] mt-1', themeClasses.subText]">İlk okuma / DB sorgusu</span>
                  </div>

                  <div :class="['p-4 rounded-2xl border flex flex-col justify-between', themeClasses.boxInner]">
                    <span :class="['text-xs', themeClasses.subText]">Aktif Önbellek Kayıtları</span>
                    <div class="mt-2 flex items-baseline gap-1.5">
                      <span class="text-2xl font-black text-[#FFFF00]">{{ cacheStats.activeKeysCount || 0 }}</span>
                      <span class="text-[11px] text-[#FFFF00] font-semibold">anahtar</span>
                    </div>
                    <span :class="['text-[10px] mt-1', themeClasses.subText]">60 saniyelik TTL süresi</span>
                  </div>

                </div>

                <!-- Aktif Önbellek Kayıtları Listesi (Varsa) -->
                <div v-if="cacheStats.activeKeys && cacheStats.activeKeys.length > 0" class="mt-3 rounded-2xl border overflow-hidden text-xs" :class="themeClasses.headerBorder">
                  <div class="px-4 py-2 border-b font-bold flex items-center justify-between" :class="[themeClasses.boxInner, themeClasses.titleText]">
                    <span>RAM'deki Aktif Önbellek Anahtarları</span>
                    <span class="text-[10px] font-mono text-emerald-400">Canlı ETag Takibi</span>
                  </div>
                  <div class="divide-y" :class="themeClasses.headerBorder">
                    <div 
                      v-for="item in cacheStats.activeKeys" 
                      :key="item.key"
                      class="px-4 py-2.5 flex items-center justify-between gap-2 transition-colors"
                      :class="adminTheme === 'light' ? 'bg-white hover:bg-slate-50' : 'bg-[#141414] hover:bg-[#1a1a1a]'"
                    >
                      <div class="flex items-center gap-2.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span class="font-mono text-[11px] font-bold" :class="themeClasses.titleText">{{ item.key }}</span>
                      </div>
                      <div class="flex items-center gap-4 text-[11px] font-mono">
                        <span :class="themeClasses.subText">İsabet: <strong :class="themeClasses.titleText">{{ item.hitCount }}</strong></span>
                        <span class="text-amber-400 font-bold">⏳ {{ item.ttlRemainingSeconds }}s kaldı</span>
                        <span class="text-slate-500 hidden sm:inline">{{ item.etag }}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <!-- ======================================================== -->
            <!-- SOSYAL GİRİŞ (OAUTH 2.0) VE ÇOKLU OTURUM YÖNETİMİ -->
            <!-- ======================================================== -->
            <div :class="['border rounded-3xl p-6 transition-colors space-y-6', themeClasses.cardBg]">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b" :class="themeClasses.headerBorder">
                <div>
                  <h3 :class="['text-base font-bold flex items-center gap-2.5', themeClasses.titleText]">
                    <ShieldCheck class="w-5 h-5 text-sky-400" />
                    <span>Sosyal Giriş (OAuth 2.0) & Aktif Oturum Güvenliği</span>
                    <span class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      2 Cihaz Aktif
                    </span>
                  </h3>
                  <p :class="['text-xs mt-1', themeClasses.subText]">
                    Google veya GitHub ile tek tıkla şifresiz giriş yapın; hesabınıza bağlı aktif cihazları denetleyin ve şüpheli oturumları sonlandırın.
                  </p>
                </div>
              </div>

              <!-- Sosyal Giriş Sağlayıcıları -->
              <div>
                <h4 :class="['text-xs font-bold uppercase tracking-wider mb-3', themeClasses.subText]">
                  1. Bağlı Sosyal Hesaplar (OAuth 2.0)
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <!-- Google OAuth -->
                  <div class="p-3.5 rounded-2xl border flex items-center justify-between gap-3" :class="themeClasses.boxInner">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.7 7.5 23.3 12 23.3z"/></svg>
                      </div>
                      <div>
                        <div class="font-bold" :class="themeClasses.titleText">Google Hesabı</div>
                        <div class="text-[11px] text-emerald-400 font-medium">Bağlandı: {{ profile.username ? profile.username.replace('@','') + '@gmail.com' : 'tuba@gmail.com' }}</div>
                      </div>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Aktif
                    </span>
                  </div>

                  <!-- GitHub OAuth -->
                  <div class="p-3.5 rounded-2xl border flex items-center justify-between gap-3" :class="themeClasses.boxInner">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-black border border-white/20 flex items-center justify-center shrink-0">
                        <component :is="getIconComponent('github')" class="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div class="font-bold" :class="themeClasses.titleText">GitHub Hesabı</div>
                        <div class="text-[11px] text-emerald-400 font-medium">Bağlandı: @tubaaa7</div>
                      </div>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Aktif
                    </span>
                  </div>
                </div>
              </div>

              <!-- Aktif Cihaz Oturumları -->
              <div class="pt-2">
                <div class="flex items-center justify-between mb-3">
                  <h4 :class="['text-xs font-bold uppercase tracking-wider', themeClasses.subText]">
                    2. Aktif Cihaz Oturumları (Active Sessions)
                  </h4>
                  <button 
                    type="button"
                    @click="showToast('Diğer tüm oturumlar başarıyla sonlandırıldı!')"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    Tüm Diğer Oturumları Kapat
                  </button>
                </div>

                <div class="space-y-2.5">
                  <!-- Oturum 1: Geçerli Masaüstü -->
                  <div class="p-3 rounded-2xl border flex items-center justify-between gap-3" :class="themeClasses.boxInner">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                        <Laptop class="w-4 h-4" />
                      </div>
                      <div>
                        <div class="font-bold flex items-center gap-1.5" :class="themeClasses.titleText">
                          <span>Windows PC • Google Chrome 124</span>
                          <span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500 text-black">Bu Cihaz</span>
                        </div>
                        <div class="text-[10px] text-neutral-400 font-mono mt-0.5">
                          IP: 176.240.88.14 • İstanbul, TR • Şu anda aktif
                        </div>
                      </div>
                    </div>
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>

                  <!-- Oturum 2: Mobil Safari -->
                  <div class="p-3 rounded-2xl border flex items-center justify-between gap-3" :class="themeClasses.boxInner">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                        <Smartphone class="w-4 h-4" />
                      </div>
                      <div>
                        <div class="font-bold" :class="themeClasses.titleText">
                          Apple iPhone 15 Pro • Mobil Safari
                        </div>
                        <div class="text-[10px] text-neutral-400 font-mono mt-0.5">
                          IP: 85.105.192.4 • Ankara, TR • 2 saat önce aktif
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button"
                      @click="showToast('iPhone oturumu sonlandırıldı.')"
                      class="text-[11px] font-semibold text-neutral-400 hover:text-rose-400 cursor-pointer"
                    >
                      Sonlandır
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Şifre Değiştir Formu -->
            <div :class="['border rounded-2xl p-6 transition-colors', themeClasses.cardBg]">
              <h3 :class="['text-sm font-bold pb-3 mb-4 border-b flex items-center gap-2', themeClasses.titleText, themeClasses.headerBorder]">
                <KeyRound class="w-4 h-4 text-cyan-400" />
                <span>Yönetici Şifresini Değiştir</span>
              </h3>

              <form @submit.prevent="handleChangePassword" class="space-y-4 max-w-md">
                
                <div v-if="passwordError" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                  {{ passwordError }}
                </div>

                <div v-if="passwordSuccess" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 class="w-4 h-4" />
                  <span>{{ passwordSuccess }}</span>
                </div>

                <div>
                  <label :class="['block text-xs font-medium mb-1', themeClasses.inputLabel]">Mevcut Şifre</label>
                  <input 
                    v-model="passwordForm.currentPassword" 
                    type="password" 
                    required
                    placeholder="••••••••"
                    :class="['w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-sm transition-colors', themeClasses.inputBg]"
                  />
                </div>

                <div>
                  <label :class="['block text-xs font-medium mb-1', themeClasses.inputLabel]">Yeni Şifre (En az 6 karakter)</label>
                  <input 
                    v-model="passwordForm.newPassword" 
                    type="password" 
                    required
                    placeholder="••••••••"
                    :class="['w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-sm transition-colors', themeClasses.inputBg]"
                  />
                </div>

                <div>
                  <label :class="['block text-xs font-medium mb-1', themeClasses.inputLabel]">Yeni Şifre (Tekrar)</label>
                  <input 
                    v-model="passwordForm.confirmPassword" 
                    type="password" 
                    required
                    placeholder="••••••••"
                    :class="['w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-sm transition-colors', themeClasses.inputBg]"
                  />
                </div>

                <div class="pt-2">
                  <button 
                    type="submit" 
                    :disabled="isChangingPassword"
                    class="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all shadow-md shadow-cyan-950/30 flex items-center gap-2 disabled:opacity-50"
                  >
                    <KeyRound class="w-4 h-4" />
                    <span>{{ isChangingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle' }}</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- Oturumu Kapat -->
            <div :class="['border rounded-2xl p-6 transition-colors flex items-center justify-between', themeClasses.cardBg]">
              <div>
                <h4 :class="['text-sm font-bold', themeClasses.titleText]">Oturumu Sonlandır</h4>
                <p :class="['text-xs mt-0.5', themeClasses.subText]">Yönetim panelinden güvenli bir şekilde çıkış yapın.</p>
              </div>
              <button 
                type="button"
                @click="handleLogout"
                class="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 transition-all flex items-center gap-1.5"
              >
                <LogOut class="w-3.5 h-3.5" />
                <span>Çıkış Yap</span>
              </button>
            </div>

          </div>

        </div>

        <!-- ========================================== -->
        <!-- SAĞ SÜTUN: LINKTREE CANLI TELEFON ÖNİZLEME (Cols 9-12) -->
        <!-- ========================================== -->
        <div class="hidden lg:flex lg:col-span-5 xl:col-span-4 sticky top-24 flex-col items-center">
          
          <!-- Önizleme Başlığı -->
          <div class="w-full mb-3 flex items-center justify-between px-2">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span :class="['text-xs font-bold uppercase tracking-wider', themeClasses.titleText]">
                Canlı Mobil Önizleme
              </span>
            </div>
            <a 
              :href="profilePublicUrl" 
              target="_blank" 
              class="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Tam Ekran</span>
              <ExternalLink class="w-3 h-3" />
            </a>
          </div>

          <!-- Gerçekçi iPhone Mockup Bileşeni -->
          <div class="w-full flex justify-center drop-shadow-2xl">
            <PhonePreview />
          </div>

          <p :class="['text-[11px] text-center mt-3', themeClasses.subText]">
            ⚡ Değişiklikler telefon ekranına anında yansır.
          </p>
        </div>

      </div>
    </main>

    <!-- MOBİL İÇİN YÜZEN ÖNİZLEME BUTONU (Floating Preview Trigger) -->
    <div class="lg:hidden fixed bottom-6 right-6 z-40">
      <button 
        type="button"
        @click="showMobilePreview = true"
        class="flex items-center gap-2 px-4 py-3 rounded-full bg-[#FFFF00] hover:bg-[#EEFF00] text-black font-bold text-xs shadow-2xl shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all"
      >
        <Smartphone class="w-4 h-4 text-black" />
        <span>📱 Önizleme</span>
      </button>
    </div>

    <!-- MOBİL ÖNİZLEME MODALI / ÇEKMECESİ (Mobile Drawer) -->
    <Teleport to="body">
      <div 
        v-if="showMobilePreview" 
        :class="['fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200', themeClasses.modalOverlay]"
        @click.self="showMobilePreview = false"
      >
        <div class="relative w-full max-w-sm flex flex-col items-center max-h-[92vh] overflow-y-auto">
          <!-- Kapat Butonu -->
          <button 
            type="button"
            @click="showMobilePreview = false"
            class="self-end mb-3 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition-colors"
          >
            <X class="w-5 h-5" />
          </button>

          <!-- iPhone Mockup -->
          <PhonePreview />
        </div>
      </div>
    </Teleport>

    <!-- PAYLAŞIM MODALI (Linktree Share Modal) -->
    <Teleport to="body">
      <div 
        v-if="showShareModal" 
        :class="['fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150', themeClasses.modalOverlay]"
        @click.self="showShareModal = false"
      >
        <div :class="['w-full max-w-md rounded-3xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150 transition-colors', themeClasses.modalBg]">
          <div :class="['flex items-center justify-between pb-3 mb-4 border-b', themeClasses.headerBorder]">
            <h3 :class="['text-base font-bold flex items-center gap-2', themeClasses.titleText]">
              <Share2 class="w-4 h-4 text-[#FFFF00]" />
              <span>Linkspace Profilini Paylaş</span>
            </h3>
            <button 
              type="button"
              @click="showShareModal = false"
              :class="['p-1.5 rounded-xl transition-colors', themeClasses.btnGhost]"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-5">
            <!-- Profil Bilgisi -->
            <div class="flex items-center gap-3.5">
              <img 
                :src="profile.avatar" 
                alt="Avatar" 
                class="w-12 h-12 rounded-full object-cover border-2 border-[#FFFF00] shadow-md shadow-yellow-500/20"
              />
              <div>
                <h4 :class="['text-sm font-bold', themeClasses.titleText]">{{ profile.name }}</h4>
                <p :class="['text-xs font-mono font-medium', adminTheme === 'light' ? 'text-amber-800 font-bold' : 'text-[#FFFF00]']">
                  linkspace/{{ (profile.username && profile.username.startsWith('@')) ? profile.username : '@' + (profile.username || 'tubagul') }}
                </p>
              </div>
            </div>

            <!-- Ağ Modu Seçici (Wi-Fi / Localhost) -->
            <div class="flex p-1 rounded-2xl bg-[#101010] border border-[#282828]">
              <button 
                type="button"
                @click="networkMode = 'wifi'"
                :class="[
                  'flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5',
                  networkMode === 'wifi' 
                    ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' 
                    : 'text-[#8E8E93] hover:text-white'
                ]"
              >
                <Wifi class="w-3.5 h-3.5" />
                <span>📱 Telefonda Aç (Wi-Fi)</span>
              </button>
              <button 
                type="button"
                @click="networkMode = 'localhost'"
                :class="[
                  'flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5',
                  networkMode === 'localhost' 
                    ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' 
                    : 'text-[#8E8E93] hover:text-white'
                ]"
              >
                <Smartphone class="w-3.5 h-3.5" />
                <span>💻 Bu Cihazda</span>
              </button>
            </div>

            <!-- URL Kopyalama Çubuğu -->
            <div :class="['flex items-center justify-between p-2 rounded-2xl border', themeClasses.boxInner]">
              <span :class="['text-xs font-mono truncate px-2', themeClasses.titleText]">
                {{ activeShareUrl }}
              </span>
              <button 
                type="button"
                @click="copyProfileUrl"
                class="px-3.5 py-2 rounded-xl bg-[#FFFF00] hover:bg-[#EEFF00] text-black text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-sm"
              >
                <Check v-if="copiedShareUrl" class="w-3.5 h-3.5 text-black" />
                <Copy v-else class="w-3.5 h-3.5 text-black" />
                <span>{{ copiedShareUrl ? 'Kopyalandı!' : 'Kopyala' }}</span>
              </button>
            </div>

            <!-- Gerçek Taranabilir QR Kod Kartı -->
            <div :class="['p-5 rounded-2xl border flex flex-col items-center justify-center text-center', themeClasses.boxInner]">
              <div class="w-44 h-44 bg-white p-3 rounded-2xl shadow-inner border border-slate-200 flex items-center justify-center">
                <img 
                  v-if="qrCodeDataUrl" 
                  :src="qrCodeDataUrl" 
                  alt="Profil QR Kodu" 
                  class="w-full h-full object-contain"
                />
                <div v-else class="text-xs text-slate-400">QR Kod yükleniyor...</div>
              </div>
              <p :class="['text-xs mt-3 font-semibold flex items-center gap-1.5 justify-center', themeClasses.titleText]">
                <QrCode class="w-4 h-4 text-[#FFFF00]" />
                <span>Kameranızı açarak QR kodu okutabilirsiniz</span>
              </p>
              <p v-if="networkMode === 'wifi'" class="text-[11px] text-emerald-400 mt-1 font-medium">
                ✓ Telefonunuz aynı Wi-Fi ağına bağlıyken anında açılır
              </p>
            </div>

            <!-- Sayfayı Yeni Sekmede Aç -->
            <a 
              :href="activeShareUrl" 
              target="_blank" 
              class="w-full py-2.5 rounded-xl border text-center text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              :class="themeClasses.btnGhost"
            >
              <ExternalLink class="w-4 h-4" />
              <span>Profili Yeni Sekmede Aç</span>
            </a>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- BAĞLANTI DÜZENLEME MODALI (Edit Modal) -->
    <Teleport to="body">
      <div 
        v-if="editingLink" 
        :class="['fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150', themeClasses.modalOverlay]"
        @click.self="closeEditModal"
        @keydown.esc="closeEditModal"
      >
        <div :class="['relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border p-6 animate-in zoom-in-95 duration-150 transition-colors', themeClasses.modalBg]">
          <div :class="['flex items-center justify-between pb-4 mb-5 border-b', themeClasses.headerBorder]">
            <div class="flex items-center gap-2.5">
              <div class="p-2 rounded-xl" :class="adminTheme === 'light' ? 'bg-amber-100 border border-amber-300 text-amber-800' : 'bg-[#FFFF00]/10 border border-[#FFFF00]/25 text-[#FFFF00]'">
                <Pencil class="w-4 h-4" />
              </div>
              <div>
                <h3 :class="['text-sm font-bold', themeClasses.titleText]">Bağlantıyı Düzenle</h3>
                <p :class="['text-[11px]', themeClasses.subText]">Başlık, URL, ikon ve stil renklerini güncelleyebilirsiniz</p>
              </div>
            </div>
            <button 
              type="button" 
              @click="closeEditModal" 
              :class="['p-2 rounded-xl transition-colors', themeClasses.btnGhost]"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="handleSaveEdit" class="space-y-4">
            <div>
              <label :class="['block text-xs font-medium mb-1.5', themeClasses.inputLabel]">Bağlantı Başlığı *</label>
              <input 
                v-model="editingLink.title" 
                type="text" 
                required
                :class="['w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-sm transition-colors', themeClasses.inputBg]"
              />
            </div>

            <div>
              <label :class="['block text-xs font-medium mb-1.5', themeClasses.inputLabel]">Hedef URL *</label>
              <input 
                v-model="editingLink.url" 
                type="text" 
                required
                :class="[
                  'w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-sm transition-colors',
                  editUrlError ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5' : themeClasses.inputBg
                ]"
              />
              <p v-if="editUrlError" class="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                <span>{{ editUrlError }}</span>
              </p>
            </div>

            <!-- İkon Seçimi -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label :class="['block text-xs font-medium', themeClasses.inputLabel]">İkon Seçimi</label>
                <span class="text-[10px] font-semibold" :class="adminTheme === 'light' ? 'text-amber-800 font-bold' : 'text-[#FFFF00]'">
                  {{ AVAILABLE_ICONS.find(i => i.id === editingLink.icon)?.name || 'Otomatik' }}
                </span>
              </div>
              <div :class="['grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-2 rounded-xl border transition-colors', themeClasses.boxInner]">
                <button 
                  v-for="iconItem in AVAILABLE_ICONS" 
                  :key="iconItem.id"
                  type="button"
                  @click="editingLink.icon = iconItem.id"
                  :title="iconItem.name"
                  class="flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-all"
                  :class="editingLink.icon === iconItem.id 
                    ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20 scale-105' 
                    : (adminTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-white')"
                >
                  <component :is="getIconComponent(iconItem.icon)" class="w-4 h-4 mb-0.5" />
                  <span class="text-[9px] truncate max-w-[45px] leading-tight">{{ iconItem.name.split(' ')[0] }}</span>
                </button>
              </div>
            </div>

            <!-- Özel Buton Rengi & Stili -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label :class="['block text-xs font-medium', themeClasses.inputLabel]">Özel Buton Rengi & Stili</label>
                <span class="text-[10px] font-semibold" :class="adminTheme === 'light' ? 'text-amber-800 font-bold' : 'text-[#FFFF00]'">
                  {{ BUTTON_STYLES.find(s => s.id === editingLink.customColor)?.name || 'Tema Varsayılanı' }}
                </span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button 
                  v-for="styleItem in BUTTON_STYLES" 
                  :key="styleItem.id"
                  type="button"
                  @click="editingLink.customColor = styleItem.id"
                  class="flex items-center gap-2 p-2 rounded-xl border text-left transition-all"
                  :class="editingLink.customColor === styleItem.id 
                    ? (adminTheme === 'light' ? 'border-yellow-400 bg-yellow-100/70 shadow-sm ring-1 ring-yellow-400 text-black font-bold' : 'border-[#FFFF00] bg-[#FFFF00]/15 shadow-sm ring-1 ring-[#FFFF00]') 
                    : themeClasses.colorBtnInactive"
                >
                  <div 
                    class="w-3.5 h-3.5 rounded-full bg-gradient-to-r flex-shrink-0 border"
                    :class="[styleItem.previewGradient, styleItem.borderStyle]"
                  ></div>
                  <span :class="['text-[11px] font-medium truncate', themeClasses.colorBtnText]">{{ styleItem.name }}</span>
                </button>
              </div>

              <!-- Kategori & Klasör Seçimi (Düzenleme Modalı - Faz 19) -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label :class="['block text-xs font-medium flex items-center gap-1.5', themeClasses.inputLabel]">
                    <Folder class="w-3.5 h-3.5 text-amber-400" />
                    <span>Kategori / Klasör (Akordeon Gruplama)</span>
                  </label>
                  <span v-if="editingLink.category" class="text-[10px] font-semibold text-amber-400 truncate max-w-[150px]">
                    📁 {{ editingLink.category }}
                  </span>
                  <span v-else :class="['text-[10px]', themeClasses.subText]">
                    Bağımsız Bağlantı
                  </span>
                </div>

                <!-- Hızlı Kategori Çipleri -->
                <div class="flex flex-wrap gap-1.5 mb-1.5">
                  <button
                    type="button"
                    @click="editingLink.category = ''"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all"
                    :class="!editingLink.category 
                      ? (adminTheme === 'light' ? 'bg-slate-800 text-white border-slate-900 font-bold' : 'bg-neutral-800 text-white border-neutral-600') 
                      : (adminTheme === 'dark' ? 'bg-[#141414] border-[#282828] text-neutral-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900')"
                  >
                    Yok (Bağımsız)
                  </button>
                  <button
                    v-for="cat in allCategories"
                    :key="cat"
                    type="button"
                    @click="editingLink.category = cat"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1"
                    :class="editingLink.category === cat 
                      ? (adminTheme === 'light' ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold' : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold') 
                      : (adminTheme === 'dark' ? 'bg-[#141414] border-[#282828] text-neutral-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900')"
                  >
                    <span>{{ cat }}</span>
                  </button>
                </div>

                <!-- Serbest Kategori Adı Girişi -->
                <input
                  v-model="editingLink.category"
                  type="text"
                  placeholder="Veya yeni bir klasör adı yazın (örn: 🎨 Tasarımlarım)..."
                  :class="['w-full px-3 py-1.5 rounded-xl border text-xs focus:outline-none transition-colors', themeClasses.inputBg]"
                />
              </div>

              <!-- Zaman Ayarlı / Süresi Dolan Bağlantı (Düzenleme Modalı) -->
              <div :class="['p-3.5 rounded-xl border space-y-3 transition-colors', themeClasses.boxInner]">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Clock class="w-4 h-4 text-[#FFFF00]" />
                    <div>
                      <label :class="['text-xs font-semibold block cursor-pointer select-none', themeClasses.titleText]" @click="editingLink.isScheduled = !editingLink.isScheduled">
                        Zaman Ayarlı & Süresi Dolan Bağlantı
                      </label>
                      <p :class="['text-[10px]', themeClasses.subText]">Belirli bir tarihte yayına girsin veya süresi dolunca otomatik gizlensin</p>
                    </div>
                  </div>
                  <!-- iOS Toggle Switch -->
                  <button 
                    type="button"
                    @click="editingLink.isScheduled = !editingLink.isScheduled"
                    class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="editingLink.isScheduled ? 'bg-amber-400' : 'bg-slate-400/40'"
                  >
                    <span 
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="editingLink.isScheduled ? 'translate-x-4' : 'translate-x-0'"
                    ></span>
                  </button>
                </div>

                <div v-if="editingLink.isScheduled" class="space-y-3 pt-2 border-t border-dashed" :class="themeClasses.headerBorder">
                  <!-- Hızlı Süre Önayarları (Presets) -->
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <span :class="['text-[10px] font-medium', themeClasses.inputLabel]">Hızlı Süre Tanımla (Preset):</span>
                      <span class="text-[10px] text-amber-400 font-semibold">Şu andan itibaren</span>
                    </div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <button 
                        type="button" 
                        @click="applyPresetToEditingLink(24)"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
                        :class="adminTheme === 'dark' ? 'bg-[#181818] border-[#333] hover:border-[#FFFF00] text-slate-300 hover:text-white' : 'bg-white border-slate-300 hover:border-yellow-400 text-slate-700'"
                      >
                        ⏳ +24 Saat (1 Gün)
                      </button>
                      <button 
                        type="button" 
                        @click="applyPresetToEditingLink(72)"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
                        :class="adminTheme === 'dark' ? 'bg-[#181818] border-[#333] hover:border-[#FFFF00] text-slate-300 hover:text-white' : 'bg-white border-slate-300 hover:border-yellow-400 text-slate-700'"
                      >
                        ⏳ +3 Gün
                      </button>
                      <button 
                        type="button" 
                        @click="applyPresetToEditingLink(168)"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
                        :class="adminTheme === 'dark' ? 'bg-[#181818] border-[#333] hover:border-[#FFFF00] text-slate-300 hover:text-white' : 'bg-white border-slate-300 hover:border-yellow-400 text-slate-700'"
                      >
                        ⏳ +1 Hafta (7 Gün)
                      </button>
                    </div>
                  </div>

                  <!-- Başlangıç ve Bitiş Tarihleri -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label :class="['block text-[11px] font-medium mb-1', themeClasses.inputLabel]">Başlangıç Tarihi (İsteğe bağlı)</label>
                      <input 
                        v-model="editingLink.scheduleStart" 
                        type="datetime-local" 
                        :class="['w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-colors', themeClasses.inputBg]"
                      />
                      <p :class="['text-[10px] mt-0.5', themeClasses.subText]">Boş bırakılırsa hemen yayına girer</p>
                    </div>
                    <div>
                      <label :class="['block text-[11px] font-medium mb-1', themeClasses.inputLabel]">Bitiş Tarihi / Yayından Kaldırılma</label>
                      <input 
                        v-model="editingLink.scheduleEnd" 
                        type="datetime-local" 
                        :class="['w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-colors', themeClasses.inputBg]"
                      />
                      <p :class="['text-[10px] mt-0.5', themeClasses.subText]">Süre bitince ziyaretçilere otomatik gizlenir</p>
                    </div>
                  </div>

                  <!-- Canlı Geri Sayım Rozeti Göster Toggle -->
                  <div class="flex items-center justify-between pt-1">
                    <div class="flex items-center gap-1.5">
                      <Timer class="w-3.5 h-3.5 text-amber-400" />
                      <span :class="['text-[11px] font-medium', themeClasses.titleText]">Ziyaretçi Kartında Canlı Geri Sayım Göster (⏳ Kalan Süre)</span>
                    </div>
                    <input 
                      v-model="editingLink.showCountdown" 
                      type="checkbox" 
                      class="w-4 h-4 rounded text-amber-400 focus:ring-amber-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <!-- Akıllı Medya Embed Algılama ve Mini Oynatıcı (Düzenleme Modalı) -->
              <div :class="['p-3.5 rounded-xl border space-y-2.5 transition-colors', themeClasses.boxInner]">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Play class="w-4 h-4 text-purple-400" />
                    <div>
                      <label :class="['text-xs font-semibold block cursor-pointer select-none', themeClasses.titleText]" @click="editingLink.showEmbed = !editingLink.showEmbed">
                        {{ detectedEditLinkEmbed.providerName ? `${detectedEditLinkEmbed.providerName} Mini Oynatıcı (Embed Player)` : 'Medya Mini Oynatıcı (Embed Player)' }}
                      </label>
                      <p :class="['text-[10px]', themeClasses.subText]">
                        Ziyaretçiler sayfadan ayrılmadan mini oynatıcı ile dinleyebilir / izleyebilir
                      </p>
                    </div>
                  </div>
                  <!-- iOS Toggle Switch -->
                  <button 
                    type="button"
                    @click="editingLink.showEmbed = !editingLink.showEmbed"
                    class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="editingLink.showEmbed ? 'bg-purple-500' : 'bg-slate-400/40'"
                  >
                    <span 
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="editingLink.showEmbed ? 'translate-x-4' : 'translate-x-0'"
                    ></span>
                  </button>
                </div>

                <div v-if="editingLink.showEmbed" class="space-y-2.5 pt-2 border-t border-dashed" :class="themeClasses.headerBorder">
                  <div v-if="detectedEditLinkEmbed.type !== 'none'" class="flex items-center gap-2 text-[11px] text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                    <span class="font-bold">✨ Otomatik Algılandı:</span>
                    <span>{{ detectedEditLinkEmbed.providerName }} Oynatıcısı</span>
                  </div>
                  <div v-else class="text-[11px] text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                    <span>ℹ️ Desteklenen platformlar: YouTube (video/shorts), Spotify (şarkı/albüm/playlist), SoundCloud.</span>
                  </div>
                </div>
              </div>

              <!-- Kilitli Bağlantı (PIN Şifresi / 18+ Yaş Doğrulaması - Düzenleme Modalı) -->
              <div :class="['p-3.5 rounded-xl border space-y-3 transition-colors', themeClasses.boxInner]">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Lock class="w-4 h-4 text-rose-400" />
                    <div>
                      <label :class="['text-xs font-semibold block cursor-pointer select-none', themeClasses.titleText]" @click="editingLink.isLocked = !editingLink.isLocked">
                        Kilitli Bağlantı (PIN / 18+ Erişim Koruması)
                      </label>
                      <p :class="['text-[10px]', themeClasses.subText]">
                        Ziyaretçinin tıklamadan önce PIN kodu veya yaş onayı vermesini şart koşar
                      </p>
                    </div>
                  </div>
                  <!-- iOS Toggle Switch -->
                  <button 
                    type="button"
                    @click="editingLink.isLocked = !editingLink.isLocked"
                    class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="editingLink.isLocked ? 'bg-rose-500' : 'bg-slate-400/40'"
                  >
                    <span 
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="editingLink.isLocked ? 'translate-x-4' : 'translate-x-0'"
                    ></span>
                  </button>
                </div>

                <div v-if="editingLink.isLocked" class="space-y-3 pt-2 border-t border-dashed" :class="themeClasses.headerBorder">
                  <!-- Kilit Türü Seçimi -->
                  <div>
                    <label :class="['block text-[11px] font-medium mb-1.5', themeClasses.inputLabel]">Kilit Türü</label>
                    <div class="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        @click="editingLink.lockType = 'pin'"
                        class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all"
                        :class="editingLink.lockType === 'pin' 
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold' 
                          : (adminTheme === 'dark' ? 'bg-[#181818] border-[#333] text-neutral-400' : 'bg-white border-slate-200 text-slate-600')"
                      >
                        <Key class="w-3.5 h-3.5" />
                        <span>4 Haneli PIN Kodu</span>
                      </button>
                      <button 
                        type="button"
                        @click="editingLink.lockType = 'age'"
                        class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all"
                        :class="editingLink.lockType === 'age' 
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold' 
                          : (adminTheme === 'dark' ? 'bg-[#181818] border-[#333] text-neutral-400' : 'bg-white border-slate-200 text-slate-600')"
                      >
                        <ShieldAlert class="w-3.5 h-3.5" />
                        <span>18+ Yaş Doğrulaması</span>
                      </button>
                    </div>
                  </div>

                  <!-- PIN Kodu Girişi -->
                  <div v-if="editingLink.lockType === 'pin'">
                    <label :class="['block text-[11px] font-medium mb-1', themeClasses.inputLabel]">Erişim PIN Kodu</label>
                    <input 
                      v-model="editingLink.passcode" 
                      type="text" 
                      maxlength="10" 
                      placeholder="Örn: 1234 veya 2026"
                      :class="['w-full px-3 py-2 rounded-xl border text-xs tracking-widest font-mono focus:outline-none transition-colors', themeClasses.inputBg]"
                    />
                    <p :class="['text-[10px] mt-0.5', themeClasses.subText]">Ziyaretçi bu PIN'i girmeden hedefe yönlendirilmez</p>
                  </div>

                  <!-- İsteğe Bağlı Kilit Uyarısı -->
                  <div>
                    <label :class="['block text-[11px] font-medium mb-1', themeClasses.inputLabel]">Kilit Açıklaması / Uyarısı (İsteğe bağlı)</label>
                    <input 
                      v-model="editingLink.lockWarning" 
                      type="text" 
                      placeholder="Örn: Bu bağlantı sadece katılımcılara özeldir."
                      :class="['w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-colors', themeClasses.inputBg]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div :class="['pt-4 border-t flex items-center justify-end gap-2.5', themeClasses.headerBorder]">
              <button 
                type="button" 
                @click="closeEditModal" 
                :class="['px-4 py-2 rounded-xl text-xs font-medium transition-colors', themeClasses.btnGhost]"
              >
                İptal
              </button>
              <button 
                type="submit" 
                :disabled="isSavingEdit"
                class="px-5 py-2 rounded-xl text-xs font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black transition-all shadow-md shadow-yellow-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Check class="w-3.5 h-3.5 text-black" />
                <span>{{ isSavingEdit ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- YAPAY ZEKA BİYOGRAFİ ASİSTANI MODALI (AI Bio Generator Modal) -->
    <Teleport to="body">
      <div 
        v-if="showAiBioModal" 
        :class="['fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-150', themeClasses.modalOverlay]"
        @click.self="showAiBioModal = false"
        @keydown.esc="showAiBioModal = false"
      >
        <div :class="['relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150 transition-colors', themeClasses.modalBg]">
          
          <!-- Modal Başlığı -->
          <div :class="['flex items-center justify-between pb-4 mb-5 border-b', themeClasses.headerBorder]">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-amber-400 via-[#FFFF00] to-yellow-300 text-black shadow-md shadow-yellow-500/20">
                <Sparkles class="w-5 h-5 text-black" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 :class="['text-base font-extrabold tracking-tight', themeClasses.titleText]">Yapay Zeka Biyografi Asistanı</h3>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-[#FFFF00]/15 text-[#FFFF00] border border-[#FFFF00]/30">
                    Faz 18
                  </span>
                </div>
                <p :class="['text-xs mt-0.5', themeClasses.subText]">Unvanınıza, yeteneklerinize ve ses tonunuza göre etkileyici biyografi alternatifleri üretin</p>
              </div>
            </div>
            <button 
              type="button" 
              @click="showAiBioModal = false" 
              :class="['p-2 rounded-xl transition-colors', themeClasses.btnGhost]"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Ayarlar & Parametreler Kartı -->
          <div :class="['p-4 sm:p-5 rounded-2xl border mb-6 space-y-4', themeClasses.boxInner]">
            
            <!-- 1. Rol / Unvan -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label :class="['block text-xs font-semibold', themeClasses.inputLabel]">Meslek / Unvanınız</label>
                <span class="text-[10px] text-amber-400 font-medium">Biyografinin temelini oluşturur</span>
              </div>
              <input 
                v-model="aiBioForm.role" 
                type="text" 
                placeholder="Örn: Full-Stack Web Geliştirici veya Yazılım Mühendisi" 
                :class="['w-full px-3.5 py-2 rounded-xl border focus:outline-none text-xs sm:text-sm transition-colors', themeClasses.inputBg]"
              />
              <!-- Hızlı Rol Çipleri -->
              <div class="flex items-center gap-1.5 flex-wrap mt-2">
                <button 
                  v-for="roleItem in SUGGESTED_ROLES" 
                  :key="roleItem"
                  type="button"
                  @click="aiBioForm.role = roleItem"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all"
                  :class="aiBioForm.role === roleItem 
                    ? 'bg-[#FFFF00] text-black border-transparent font-bold shadow-xs' 
                    : (adminTheme === 'dark' ? 'bg-[#181818] border-[#333] hover:border-slate-500 text-slate-300' : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700')"
                >
                  {{ roleItem }}
                </button>
              </div>
            </div>

            <!-- 2. Öne Çıkarılacak Yetenekler (Skill Tags) -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label :class="['block text-xs font-semibold', themeClasses.inputLabel]">Vurgulamak İstediğiniz Yetenekler</label>
                <span class="text-[10px] text-slate-400">Çoklu seçim yapabilirsiniz</span>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button 
                  v-for="skillItem in SUGGESTED_SKILLS" 
                  :key="skillItem"
                  type="button"
                  @click="toggleAiSkill(skillItem)"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5"
                  :class="aiBioForm.selectedSkills.includes(skillItem)
                    ? 'bg-[#FFFF00] text-black border-yellow-400 font-bold shadow-sm shadow-yellow-500/20 scale-[1.02]' 
                    : (adminTheme === 'dark' ? 'bg-[#161616] border-[#2c2c2c] hover:border-neutral-500 text-neutral-300' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700')"
                >
                  <Check v-if="aiBioForm.selectedSkills.includes(skillItem)" class="w-3 h-3 text-black stroke-[3]" />
                  <span>{{ skillItem }}</span>
                </button>
              </div>
            </div>

            <!-- 3. Ses Tonu (Tone of Voice) Seçimi -->
            <div>
              <label :class="['block text-xs font-semibold mb-2', themeClasses.inputLabel]">Hedeflenen Ses Tonu (Tone of Voice)</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button 
                  type="button"
                  @click="aiBioForm.selectedTone = 'all'"
                  class="p-2.5 rounded-xl border text-left transition-all"
                  :class="aiBioForm.selectedTone === 'all'
                    ? (adminTheme === 'light' ? 'border-yellow-400 bg-yellow-100/70 text-black font-bold ring-1 ring-yellow-400' : 'border-[#FFFF00] bg-[#FFFF00]/15 text-[#FFFF00] font-bold ring-1 ring-[#FFFF00]')
                    : themeClasses.colorBtnInactive"
                >
                  <div class="text-base mb-1">✨</div>
                  <div class="text-xs font-bold leading-tight">Tümü (Karışık)</div>
                  <div class="text-[10px] opacity-75 mt-0.5">Tüm stillerden seçenekler</div>
                </button>

                <button 
                  v-for="toneItem in AI_TONES" 
                  :key="toneItem.id"
                  type="button"
                  @click="aiBioForm.selectedTone = toneItem.id"
                  class="p-2.5 rounded-xl border text-left transition-all"
                  :class="aiBioForm.selectedTone === toneItem.id
                    ? (adminTheme === 'light' ? 'border-yellow-400 bg-yellow-100/70 text-black font-bold ring-1 ring-yellow-400' : 'border-[#FFFF00] bg-[#FFFF00]/15 text-[#FFFF00] font-bold ring-1 ring-[#FFFF00]')
                    : themeClasses.colorBtnInactive"
                >
                  <div class="text-base mb-1">{{ toneItem.emoji }}</div>
                  <div class="text-xs font-bold leading-tight truncate">{{ toneItem.name.split('&')[0].trim() }}</div>
                  <div class="text-[10px] opacity-75 mt-0.5 line-clamp-1">{{ toneItem.name.split('&')[1]?.trim() || 'Mod' }}</div>
                </button>
              </div>
            </div>

            <!-- Üret Butonu -->
            <div class="pt-2">
              <button 
                type="button" 
                @click="handleGenerateBios" 
                :disabled="isGeneratingBio"
                class="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-[#FFFF00] to-yellow-300 hover:opacity-95 text-black shadow-lg shadow-yellow-500/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw v-if="isGeneratingBio" class="w-4 h-4 text-black animate-spin" />
                <Sparkles v-else class="w-4 h-4 text-black" />
                <span>{{ isGeneratingBio ? 'Yapay Zeka Biyografileri Hazırlıyor...' : '✨ Biyografi Alternatiflerini Üret' }}</span>
              </button>
            </div>
          </div>

          <!-- Üretilen Sonuçlar Listesi -->
          <div class="space-y-3.5">
            <div class="flex items-center justify-between px-1">
              <h4 :class="['text-xs font-bold uppercase tracking-wider flex items-center gap-2', themeClasses.titleText]">
                <span>Üretilen Biyografiler</span>
                <span v-if="generatedBios.length > 0" class="px-2 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30">
                  {{ generatedBios.length }} Seçenek
                </span>
              </h4>
              <span :class="['text-[11px]', themeClasses.subText]">Beğendiğiniz biyografiyi tek tıkla uygulayın</span>
            </div>

            <!-- Yükleniyor İskeleti (Skeleton Loading) -->
            <div v-if="isGeneratingBio" class="space-y-3">
              <div v-for="i in 3" :key="i" :class="['p-4 rounded-2xl border animate-pulse space-y-2', themeClasses.boxInner]">
                <div class="h-3 bg-neutral-700/50 rounded w-1/4"></div>
                <div class="h-4 bg-neutral-700/50 rounded w-full"></div>
                <div class="h-4 bg-neutral-700/50 rounded w-4/5"></div>
              </div>
            </div>

            <!-- Biyografi Kartları -->
            <div v-else-if="generatedBios.length > 0" class="space-y-3">
              <div 
                v-for="bioItem in generatedBios" 
                :key="bioItem.id"
                :class="[
                  'p-4 rounded-2xl border transition-all group hover:scale-[1.01] flex flex-col justify-between gap-3',
                  adminTheme === 'dark' 
                    ? 'bg-[#181818] border-[#282828] hover:border-[#FFFF00]/70 hover:shadow-xl hover:shadow-black/60' 
                    : 'bg-white border-slate-200 hover:border-yellow-400 hover:shadow-md'
                ]"
              >
                <!-- Üst Bilgi: Ses Tonu Rozeti & Karakter Sayacı -->
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-2">
                    <span 
                      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                      :class="adminTheme === 'dark' ? 'bg-[#121212] text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-800 border-amber-200'"
                    >
                      <span>{{ bioItem.emoji }}</span>
                      <span>{{ bioItem.toneName }}</span>
                    </span>

                    <span 
                      v-if="bioItem.highlight"
                      :class="['text-[10px] hidden sm:inline-block font-medium opacity-80', themeClasses.subText]"
                    >
                      • {{ bioItem.highlight }}
                    </span>
                  </div>

                  <span 
                    class="text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold"
                    :class="bioItem.charCount > 150 ? 'bg-amber-500/20 text-amber-400' : (adminTheme === 'dark' ? 'bg-[#121212] text-slate-400' : 'bg-slate-100 text-slate-600')"
                  >
                    {{ bioItem.charCount }} / 160 karakter
                  </span>
                </div>

                <!-- Biyografi Metni -->
                <p :class="['text-xs sm:text-sm font-medium leading-relaxed tracking-normal select-text', themeClasses.titleText]">
                  {{ bioItem.text }}
                </p>

                <!-- Etiketler & Aksiyon Butonları -->
                <div :class="['pt-3 border-t flex items-center justify-between gap-2 flex-wrap', themeClasses.headerBorder]">
                  <div class="flex items-center gap-1 flex-wrap">
                    <span 
                      v-for="tag in bioItem.tags" 
                      :key="tag" 
                      :class="['text-[10px] px-2 py-0.5 rounded-md border font-medium', themeClasses.boxInner, themeClasses.subText]"
                    >
                      #{{ tag }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <!-- Kopyala Butonu -->
                    <button 
                      type="button" 
                      @click="copyBioText(bioItem.text, bioItem.id)"
                      class="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      :class="themeClasses.btnGhost"
                      title="Metni Kopyala"
                    >
                      <Check v-if="copiedBioId === bioItem.id" class="w-3.5 h-3.5 text-emerald-400" />
                      <Copy v-else class="w-3.5 h-3.5" />
                      <span>{{ copiedBioId === bioItem.id ? 'Kopyalandı' : 'Kopyala' }}</span>
                    </button>

                    <!-- Profile Uygula Butonu -->
                    <button 
                      type="button" 
                      @click="applyBioToProfile(bioItem.text)"
                      class="px-4 py-1.5 rounded-xl text-xs font-black bg-[#FFFF00] hover:bg-[#EEFF00] text-black transition-all flex items-center gap-1.5 shadow-sm shadow-yellow-500/20 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Check class="w-3.5 h-3.5 text-black stroke-[3]" />
                      <span>Profile Uygula</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Boş Durum -->
            <div 
              v-else 
              :class="['text-center py-8 rounded-2xl border border-dashed text-xs', themeClasses.boxInner, themeClasses.subText]"
            >
              Yukarıdaki butona tıklayarak biyografi alternatiflerinizi oluşturabilirsiniz.
            </div>
          </div>

        </div>
      </div>
    </Teleport>

  </div>
</template>
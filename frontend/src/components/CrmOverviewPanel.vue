<script setup>
import { ref, computed } from 'vue'
import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  Users,
  Inbox,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ExternalLink,
  Pencil,
  CheckCircle2,
  Clock,
  AlertCircle,
  Smartphone,
  Monitor,
  Layers,
  Plus
} from 'lucide-vue-next'

const props = defineProps({
  profile: { type: Object, required: true },
  links: { type: Array, default: () => [] },
  analytics: { type: Object, default: () => ({}) },
  messages: { type: Array, default: () => [] },
  unreadMessagesCount: { type: Number, default: 0 },
  totalClicks: { type: Number, default: 0 },
  activeCount: { type: Number, default: 0 },
  topLink: { type: Object, default: null },
  smartInsights: { type: Array, default: () => [] },
  isLoadingInsights: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  usersCount: { type: Number, default: 0 },
  pendingMembersCount: { type: Number, default: 0 },
  isDark: { type: Boolean, default: true },
  searchQuery: { type: String, default: '' }
})

const emit = defineEmits([
  'navigate',
  'filter-users-pending',
  'open-new-link',
  'edit-link',
  'apply-insight',
  'refresh-insights'
])

const chartSeriesMode = ref('all') // 'all' | 'visits' | 'clicks'
const tableFilterMode = ref('all') // 'all' | 'active' | 'top'
const hoveredDayIdx = ref(null)

const ctrPercent = computed(() => {
  const visits = Number(props.analytics?.totalVisits || 0)
  if (visits <= 0) return 0
  return Number(((props.totalClicks / visits) * 100).toFixed(1))
})

const timelinePoints = computed(() => {
  const list = props.analytics?.dailyTimeline
  if (Array.isArray(list) && list.length > 0) return list
  return [
    { dayName: 'Pzt', visits: 0, clicks: 0 },
    { dayName: 'Sal', visits: 0, clicks: 0 },
    { dayName: 'Çar', visits: 0, clicks: 0 },
    { dayName: 'Per', visits: 0, clicks: 0 },
    { dayName: 'Cum', visits: 0, clicks: 0 },
    { dayName: 'Cmt', visits: 0, clicks: 0 },
    { dayName: 'Paz', visits: 0, clicks: 0 }
  ]
})

// Mini SVG Sparkline yol oluşturucu (KPI kartları için)
const buildSparkline = (values, width = 120, height = 34) => {
  const safe = values.length >= 2 ? values : [0, 0]
  const min = Math.min(...safe)
  const max = Math.max(...safe)
  const range = max - min || 1
  const coords = safe.map((v, idx) => {
    const x = (idx / (safe.length - 1)) * width
    const y = height - 4 - ((v - min) / range) * (height - 8)
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) }
  })
  const line = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${line} L ${width} ${height} L 0 ${height} Z`
  return { line, area, last: coords[coords.length - 1] }
}

const visitsSpark = computed(() =>
  buildSparkline(timelinePoints.value.map(d => Number(d.visits || 0)))
)
const clicksSpark = computed(() =>
  buildSparkline(timelinePoints.value.map(d => Number(d.clicks || 0)))
)
const ctrSpark = computed(() =>
  buildSparkline(
    timelinePoints.value.map(d => {
      const v = Number(d.visits || 0)
      const c = Number(d.clicks || 0)
      return v > 0 ? Math.round((c / v) * 100) : 0
    })
  )
)
const pulseSpark = computed(() =>
  buildSparkline(
    timelinePoints.value.map((d, i) => Number(d.visits || 0) + Number(d.clicks || 0) + i * 2)
  )
)

// Çoklu Çizgi Trend Grafiği (640x215 SVG)
const chartW = 640
const chartH = 215
const padL = 34
const padR = 16
const padT = 18
const padB = 28
const plotW = chartW - padL - padR
const plotH = chartH - padT - padB

const chartMaxVal = computed(() => {
  const vals = timelinePoints.value.flatMap(d => [
    Number(d.visits || 0),
    Number(d.clicks || 0)
  ])
  const peak = Math.max(...vals, 10)
  return Math.ceil(peak * 1.15)
})

const mapChartCoords = (values) => {
  const len = Math.max(values.length, 2)
  const maxV = chartMaxVal.value || 10
  return values.map((val, idx) => {
    const x = padL + (idx / (len - 1)) * plotW
    const y = padT + plotH - (Math.max(0, val) / maxV) * plotH
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), val }
  })
}

const buildSmoothPath = (pts) => {
  if (!pts.length) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i]
    const p1 = pts[i + 1]
    const cx = Number(((p0.x + p1.x) / 2).toFixed(1))
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`
  }
  return d
}

const visitsChartPts = computed(() =>
  mapChartCoords(timelinePoints.value.map(d => Number(d.visits || 0)))
)
const clicksChartPts = computed(() =>
  mapChartCoords(timelinePoints.value.map(d => Number(d.clicks || 0)))
)

const visitsChartPath = computed(() => buildSmoothPath(visitsChartPts.value))
const clicksChartPath = computed(() => buildSmoothPath(clicksChartPts.value))

const visitsChartArea = computed(() => {
  if (!visitsChartPts.value.length) return ''
  const first = visitsChartPts.value[0]
  const last = visitsChartPts.value[visitsChartPts.value.length - 1]
  return `${visitsChartPath.value} L ${last.x} ${padT + plotH} L ${first.x} ${padT + plotH} Z`
})

const clicksChartArea = computed(() => {
  if (!clicksChartPts.value.length) return ''
  const first = clicksChartPts.value[0]
  const last = clicksChartPts.value[clicksChartPts.value.length - 1]
  return `${clicksChartPath.value} L ${last.x} ${padT + plotH} L ${first.x} ${padT + plotH} Z`
})

const yGridTicks = computed(() => {
  const m = chartMaxVal.value
  return [
    { label: m, y: padT },
    { label: Math.round(m / 2), y: padT + plotH / 2 },
    { label: 0, y: padT + plotH }
  ]
})

// Karşılaştırmalı Bağlantı / Kampanya Tablosu
const tableLinks = computed(() => {
  let list = (props.links || []).filter(l => !l.isHeader)
  const q = (props.searchQuery || '').trim().toLowerCase()
  if (q) {
    list = list.filter(l =>
      (l.title || '').toLowerCase().includes(q) ||
      (l.url || '').toLowerCase().includes(q) ||
      (l.category || '').toLowerCase().includes(q)
    )
  }
  if (tableFilterMode.value === 'active') {
    list = list.filter(l => l.isActive !== false)
  } else if (tableFilterMode.value === 'top') {
    list = [...list].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
  }
  return list.slice(0, 8)
})

const getLinkDomain = (url) => {
  try {
    if (!url) return '—'
    if (url.startsWith('mailto:')) return url.replace('mailto:', '')
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const getLinkSharePercent = (clicks) => {
  if (!props.totalClicks || props.totalClicks <= 0) return 0
  return Math.round(((clicks || 0) / props.totalClicks) * 100)
}

const surfaceCard = computed(() =>
  props.isDark
    ? 'bg-[#141413] border-[#262624] text-white shadow-xl shadow-black/40'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm'
)

const subtleInner = computed(() =>
  props.isDark
    ? 'bg-[#1B1B19] border-[#2B2B28]'
    : 'bg-slate-50 border-slate-200'
)

const mutedText = computed(() =>
  props.isDark ? 'text-[#8E8E93]' : 'text-slate-500'
)
</script>

<template>
  <div class="space-y-6">
    <!-- ========================================================= -->
    <!-- 1. GREETING & DAILY OPERATIONS BAR (Amanah CRM Hero Bar)   -->
    <!-- ========================================================= -->
    <div :class="['rounded-2xl border p-5 sm:p-6 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4', surfaceCard]">
      <div class="space-y-1.5">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Canlı CRM Görünümü
          </span>
          <span v-if="isAdmin && pendingMembersCount > 0" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 cursor-pointer hover:bg-rose-500/25 transition-colors" @click="emit('filter-users-pending')">
            <Clock class="w-3 h-3" />
            {{ pendingMembersCount }} onay bekleyen üye
          </span>
          <span v-if="unreadMessagesCount > 0" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 cursor-pointer hover:bg-amber-500/25 transition-colors" @click="emit('navigate', 'messages')">
            <Inbox class="w-3 h-3" />
            {{ unreadMessagesCount }} okunmamış mesaj
          </span>
        </div>
        <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight">
          Hoş geldin, {{ profile?.name || 'Kullanıcı' }} 👋
        </h2>
        <p :class="['text-xs sm:text-sm', mutedText]">
          Toplam <strong :class="isDark ? 'text-white' : 'text-black'">{{ activeCount }}</strong> aktif bağlantı,
          <strong :class="isDark ? 'text-white' : 'text-black'">{{ analytics?.totalVisits || 0 }}</strong> profil ziyareti ve
          <strong class="text-[#FFFF00]">%{{ ctrPercent }}</strong> dönüşüm oranı tek ekranda izleniyor.
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap shrink-0">
        <button
          type="button"
          @click="emit('navigate', 'analytics')"
          :class="['px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5', isDark ? 'bg-[#1B1B19] border-[#2E2E2A] text-zinc-200 hover:border-[#444]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200']"
        >
          <TrendingUp class="w-3.5 h-3.5 text-emerald-400" />
          <span>Detaylı Analiz</span>
        </button>
        <button
          type="button"
          @click="emit('open-new-link')"
          class="px-4 py-2 rounded-xl text-xs font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-lg shadow-yellow-500/15 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <Plus class="w-4 h-4 stroke-[2.5]" />
          <span>Yeni Bağlantı Ekle</span>
        </button>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- 2. 4 KPI SPARKLINE KARTI (Semantic Green / Amber / Rose)  -->
    <!-- ========================================================= -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <!-- KPI 1: Toplam Ziyaret -->
      <div :class="['rounded-2xl border p-5 flex flex-col justify-between transition-all hover:border-[#3A3A36]', surfaceCard]">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p :class="['text-xs font-medium', mutedText]">Toplam Ziyaret</p>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-extrabold tracking-tight">{{ analytics?.totalVisits || 0 }}</span>
              <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                <ArrowUpRight class="w-3 h-3" />
                Canlı
              </span>
            </div>
          </div>
          <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Eye class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3">
          <svg viewBox="0 0 120 34" class="w-full h-8 overflow-visible">
            <defs>
              <linearGradient id="crmSparkVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10B981" stop-opacity="0.32" />
                <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path :d="visitsSpark.area" fill="url(#crmSparkVisits)" />
            <path :d="visitsSpark.line" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle :cx="visitsSpark.last.x" :cy="visitsSpark.last.y" r="2.5" fill="#10B981" />
          </svg>
          <p :class="['text-[11px] mt-1.5', mutedText]">
            {{ analytics?.qrVisits || 0 }} QR • {{ analytics?.directVisits || 0 }} Doğrudan
          </p>
        </div>
      </div>

      <!-- KPI 2: Bağlantı Tıklamaları -->
      <div :class="['rounded-2xl border p-5 flex flex-col justify-between transition-all hover:border-[#3A3A36]', surfaceCard]">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p :class="['text-xs font-medium', mutedText]">Toplam Tıklama</p>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-extrabold tracking-tight">{{ totalClicks }}</span>
              <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FFFF00]/15 text-[#FFFF00]">
                %{{ ctrPercent }} CTR
              </span>
            </div>
          </div>
          <div class="w-9 h-9 rounded-xl bg-[#FFFF00]/10 border border-[#FFFF00]/25 flex items-center justify-center text-[#FFFF00] shrink-0">
            <MousePointerClick class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3">
          <svg viewBox="0 0 120 34" class="w-full h-8 overflow-visible">
            <defs>
              <linearGradient id="crmSparkClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#FFFF00" stop-opacity="0.28" />
                <stop offset="100%" stop-color="#FFFF00" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path :d="clicksSpark.area" fill="url(#crmSparkClicks)" />
            <path :d="clicksSpark.line" fill="none" stroke="#FFFF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle :cx="clicksSpark.last.x" :cy="clicksSpark.last.y" r="2.5" fill="#FFFF00" />
          </svg>
          <p :class="['text-[11px] mt-1.5 truncate', mutedText]">
            En popüler: {{ topLink && topLink.clicks > 0 ? topLink.title : 'Henüz tık yok' }}
          </p>
        </div>
      </div>

      <!-- KPI 3: Etkileşim / Dönüşüm Oranı -->
      <div :class="['rounded-2xl border p-5 flex flex-col justify-between transition-all hover:border-[#3A3A36]', surfaceCard]">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p :class="['text-xs font-medium', mutedText]">Dönüşüm & Aktif Link</p>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-extrabold tracking-tight">{{ activeCount }}<span :class="['text-base font-semibold', mutedText]">/{{ links.length }}</span></span>
              <span
                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                :class="ctrPercent >= 15 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'"
              >
                <component :is="ctrPercent >= 15 ? TrendingUp : TrendingDown" class="w-3 h-3" />
                {{ ctrPercent >= 15 ? 'Sağlıklı' : 'Optimize Et' }}
              </span>
            </div>
          </div>
          <div class="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Layers class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3">
          <svg viewBox="0 0 120 34" class="w-full h-8 overflow-visible">
            <defs>
              <linearGradient id="crmSparkCtr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.28" />
                <stop offset="100%" stop-color="#38BDF8" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path :d="ctrSpark.area" fill="url(#crmSparkCtr)" />
            <path :d="ctrSpark.line" fill="none" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle :cx="ctrSpark.last.x" :cy="ctrSpark.last.y" r="2.5" fill="#38BDF8" />
          </svg>
          <p :class="['text-[11px] mt-1.5', mutedText]">
            Yayındaki bağlantılar / toplam oran
          </p>
        </div>
      </div>

      <!-- KPI 4: Admin -> Üyelik Başvuruları | Standart Üye -> Mesajlar -->
      <div
        @click="isAdmin ? (pendingMembersCount > 0 ? emit('filter-users-pending') : emit('navigate', 'users')) : emit('navigate', 'messages')"
        :class="['rounded-2xl border p-5 flex flex-col justify-between transition-all hover:border-[#3A3A36] cursor-pointer', surfaceCard]"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p :class="['text-xs font-medium', mutedText]">
              {{ isAdmin ? 'Topluluk & Onaylar' : 'Gelen Kutusu' }}
            </p>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {{ isAdmin ? usersCount : messages.length }}
              </span>
              <span
                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                :class="(isAdmin ? pendingMembersCount : unreadMessagesCount) > 0
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                  : 'bg-emerald-500/15 text-emerald-400'"
              >
                {{
                  isAdmin
                    ? (pendingMembersCount > 0 ? `${pendingMembersCount} Onay Bekliyor` : 'Tümü Aktif')
                    : (unreadMessagesCount > 0 ? `${unreadMessagesCount} Okunmamış` : 'Güncel')
                }}
              </span>
            </div>
          </div>
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
            :class="(isAdmin ? pendingMembersCount : unreadMessagesCount) > 0
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
              : 'bg-purple-500/10 border-purple-500/25 text-purple-400'"
          >
            <component :is="isAdmin ? Users : Inbox" class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3">
          <svg viewBox="0 0 120 34" class="w-full h-8 overflow-visible">
            <defs>
              <linearGradient id="crmSparkPulse" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="(isAdmin ? pendingMembersCount : unreadMessagesCount) > 0 ? '#F43F5E' : '#A855F7'" stop-opacity="0.28" />
                <stop offset="100%" :stop-color="(isAdmin ? pendingMembersCount : unreadMessagesCount) > 0 ? '#F43F5E' : '#A855F7'" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path :d="pulseSpark.area" fill="url(#crmSparkPulse)" />
            <path
              :d="pulseSpark.line"
              fill="none"
              :stroke="(isAdmin ? pendingMembersCount : unreadMessagesCount) > 0 ? '#F43F5E' : '#A855F7'"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <p :class="['text-[11px] mt-1.5', mutedText]">
            {{ isAdmin ? 'Başvuruları yönetmek için tıklayın →' : `${unreadMessagesCount} yeni ziyaretçi mesajı →` }}
          </p>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- 3. ORTA BENTO: MULTI-LINE TREND GRAFİĞİ + AI INSIGHTS     -->
    <!-- ========================================================= -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <!-- Sol (8 Cols): Çoklu Çizgi Performans Trend Grafiği -->
      <div :class="['xl:col-span-8 rounded-2xl border p-5 sm:p-6 flex flex-col justify-between', surfaceCard]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" :class="isDark ? 'border-[#242422]' : 'border-slate-200'">
          <div>
            <h3 class="text-sm sm:text-base font-bold tracking-tight">Haftalık Ziyaret & Tıklama Akışı</h3>
            <p :class="['text-xs mt-0.5', mutedText]">7 günlük ziyaretçi trafiği ve bağlantı dönüşüm karşılaştırması</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <div class="flex items-center gap-3 text-[11px] font-semibold mr-2">
              <span v-if="chartSeriesMode !== 'clicks'" class="flex items-center gap-1.5 text-emerald-400">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Ziyaretler
              </span>
              <span v-if="chartSeriesMode !== 'visits'" class="flex items-center gap-1.5 text-[#FFFF00]">
                <span class="w-2 h-2 rounded-full bg-[#FFFF00]"></span> Tıklamalar
              </span>
            </div>
            <div :class="['inline-flex p-0.5 rounded-lg border text-[11px] font-semibold', subtleInner]">
              <button
                type="button"
                @click="chartSeriesMode = 'all'"
                class="px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                :class="chartSeriesMode === 'all' ? 'bg-[#FFFF00] text-black font-bold' : mutedText"
              >
                Tümü
              </button>
              <button
                type="button"
                @click="chartSeriesMode = 'visits'"
                class="px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                :class="chartSeriesMode === 'visits' ? 'bg-emerald-500 text-black font-bold' : mutedText"
              >
                Ziyaret
              </button>
              <button
                type="button"
                @click="chartSeriesMode = 'clicks'"
                class="px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                :class="chartSeriesMode === 'clicks' ? 'bg-[#FFFF00] text-black font-bold' : mutedText"
              >
                Tıklama
              </button>
            </div>
          </div>
        </div>

        <!-- Etkileşimli SVG Grafik -->
        <div class="relative mt-4 select-none">
          <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="w-full h-56 overflow-visible">
            <defs>
              <linearGradient id="crmChartVisitsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10B981" stop-opacity="0.24" />
                <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="crmChartClicksFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#FFFF00" stop-opacity="0.18" />
                <stop offset="100%" stop-color="#FFFF00" stop-opacity="0" />
              </linearGradient>
            </defs>

            <!-- Yatay Kılavuz Çizgiler -->
            <g v-for="(tick, idx) in yGridTicks" :key="idx">
              <line
                :x1="padL"
                :y1="tick.y"
                :x2="chartW - padR"
                :y2="tick.y"
                :stroke="isDark ? '#262624' : '#e2e8f0'"
                stroke-dasharray="4 4"
                stroke-width="1"
              />
              <text
                :x="padL - 8"
                :y="tick.y + 3"
                text-anchor="end"
                :fill="isDark ? '#71717A' : '#64748b'"
                font-size="10"
                font-family="monospace"
              >
                {{ tick.label }}
              </text>
            </g>

            <!-- Alan & Çizgi: Ziyaretler -->
            <template v-if="chartSeriesMode !== 'clicks'">
              <path :d="visitsChartArea" fill="url(#crmChartVisitsFill)" />
              <path
                :d="visitsChartPath"
                fill="none"
                stroke="#10B981"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </template>

            <!-- Alan & Çizgi: Tıklamalar -->
            <template v-if="chartSeriesMode !== 'visits'">
              <path :d="clicksChartArea" fill="url(#crmChartClicksFill)" />
              <path
                :d="clicksChartPath"
                fill="none"
                stroke="#FFFF00"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </template>

            <!-- Hover İmleci ve Noktalar -->
            <g v-for="(day, i) in timelinePoints" :key="day.dayName || i">
              <line
                v-if="hoveredDayIdx === i"
                :x1="visitsChartPts[i].x"
                :y1="padT"
                :x2="visitsChartPts[i].x"
                :y2="padT + plotH"
                :stroke="isDark ? '#52525B' : '#94a3b8'"
                stroke-dasharray="3 3"
                stroke-width="1"
              />
              <circle
                v-if="chartSeriesMode !== 'clicks'"
                :cx="visitsChartPts[i].x"
                :cy="visitsChartPts[i].y"
                :r="hoveredDayIdx === i ? 5 : 3"
                fill="#10B981"
                :stroke="isDark ? '#141413' : '#ffffff'"
                stroke-width="2"
              />
              <circle
                v-if="chartSeriesMode !== 'visits'"
                :cx="clicksChartPts[i].x"
                :cy="clicksChartPts[i].y"
                :r="hoveredDayIdx === i ? 5 : 3"
                fill="#FFFF00"
                :stroke="isDark ? '#141413' : '#ffffff'"
                stroke-width="2"
              />
              <!-- Gün Etiketi -->
              <text
                :x="visitsChartPts[i].x"
                :y="chartH - 6"
                text-anchor="middle"
                :fill="hoveredDayIdx === i ? (isDark ? '#FFFFFF' : '#0f172a') : (isDark ? '#8E8E93' : '#64748b')"
                font-size="11"
                :font-weight="hoveredDayIdx === i ? 'bold' : 'normal'"
              >
                {{ day.dayName || day.date }}
              </text>
              <!-- Görünmez Hover Bölgesi -->
              <rect
                :x="visitsChartPts[i].x - plotW / (timelinePoints.length * 2)"
                :y="padT"
                :width="plotW / timelinePoints.length"
                :height="plotH + 24"
                fill="transparent"
                class="cursor-pointer"
                @mouseenter="hoveredDayIdx = i"
                @mouseleave="hoveredDayIdx = null"
              />
            </g>
          </svg>

          <!-- Hover Bilgi Kartı -->
          <div
            v-if="hoveredDayIdx !== null && timelinePoints[hoveredDayIdx]"
            :class="['mt-2 px-3.5 py-2 rounded-xl border text-xs flex items-center justify-between gap-4 transition-all', subtleInner]"
          >
            <span class="font-bold">{{ timelinePoints[hoveredDayIdx].dayName || timelinePoints[hoveredDayIdx].date }} Özeti</span>
            <div class="flex items-center gap-4">
              <span class="text-emerald-400 font-semibold">Ziyaret: {{ timelinePoints[hoveredDayIdx].visits || 0 }}</span>
              <span class="text-[#FFFF00] font-semibold">Tıklama: {{ timelinePoints[hoveredDayIdx].clicks || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sağ (4 Cols): Akıllı CRM Öngörüleri & Günlük Aksiyonlar -->
      <div :class="['xl:col-span-4 rounded-2xl border p-5 sm:p-6 flex flex-col justify-between space-y-4', surfaceCard]">
        <div class="flex items-center justify-between pb-3 border-b" :class="isDark ? 'border-[#242422]' : 'border-slate-200'">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-[#FFFF00]/15 border border-[#FFFF00]/30 flex items-center justify-center text-[#FFFF00]">
              <Sparkles class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold tracking-tight">Akıllı CRM Öngörüleri</h3>
              <p :class="['text-[11px]', mutedText]">Öncelikli görevler & öneriler</p>
            </div>
          </div>
          <button
            type="button"
            @click="emit('refresh-insights')"
            title="Önerileri Yenile"
            :class="['p-1.5 rounded-lg border transition-colors cursor-pointer', subtleInner, mutedText]"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoadingInsights }" />
          </button>
        </div>

        <div class="space-y-2.5 flex-1">
          <!-- Operasyonel Uyarı: Onay Bekleyen Üyeler (Admin) -->
          <div
            v-if="isAdmin && pendingMembersCount > 0"
            class="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start justify-between gap-2"
          >
            <div class="space-y-1">
              <p class="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <AlertCircle class="w-3.5 h-3.5" />
                {{ pendingMembersCount }} Üyelik Onayı Bekliyor
              </p>
              <p class="text-[11px] text-rose-200/80">
                Yeni başvurular yönetici onayınız olmadan giriş yapamaz.
              </p>
            </div>
            <button
              type="button"
              @click="emit('filter-users-pending')"
              class="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-black text-[11px] font-bold shrink-0 cursor-pointer"
            >
              İncele
            </button>
          </div>

          <!-- Operasyonel Uyarı: Okunmamış Mesajlar -->
          <div
            v-if="unreadMessagesCount > 0"
            class="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start justify-between gap-2"
          >
            <div class="space-y-1">
              <p class="text-xs font-bold text-amber-300">
                {{ unreadMessagesCount }} Okunmamış Ziyaretçi Mesajı
              </p>
              <p class="text-[11px] text-amber-200/80">
                Ziyaretçi iletişim formundan yeni mesajlar geldi.
              </p>
            </div>
            <button
              type="button"
              @click="emit('navigate', 'messages')"
              class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-bold shrink-0 cursor-pointer"
            >
              Aç
            </button>
          </div>

          <!-- Dinamik AI Smart Insights -->
          <div
            v-for="insight in smartInsights.slice(0, 3)"
            :key="insight.id"
            :class="['p-3 rounded-xl border space-y-2', subtleInner]"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="text-xs font-bold leading-snug">{{ insight.title }}</p>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#FFFF00]/15 text-[#FFFF00] shrink-0">
                Öneri
              </span>
            </div>
            <p :class="['text-[11px] leading-relaxed', mutedText]">{{ insight.description }}</p>
            <button
              v-if="insight.actionLabel"
              type="button"
              @click="emit('apply-insight', insight)"
              class="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 class="w-3.5 h-3.5" />
              <span>{{ insight.actionLabel }}</span>
            </button>
          </div>

          <!-- Her Şey Yolundaysa Pozitif Kart -->
          <div
            v-if="smartInsights.length === 0 && unreadMessagesCount === 0 && (!isAdmin || pendingMembersCount === 0)"
            :class="['p-4 rounded-xl border text-center space-y-2', subtleInner]"
          >
            <CheckCircle2 class="w-6 h-6 text-emerald-400 mx-auto" />
            <p class="text-xs font-bold">Tüm Sistemler Dengeli</p>
            <p :class="['text-[11px]', mutedText]">Bekleyen kritik bir aksiyon yok. Yeni bağlantılar ekleyerek erişimi artırabilirsiniz.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- 4. ALT BENTO: KARŞILAŞTIRMALI BAĞLANTI TABLOSU & KANALLAR -->
    <!-- ========================================================= -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <!-- Sol (8 Cols): Karşılaştırmalı Bağlantı Performans Tablosu -->
      <div :class="['xl:col-span-8 rounded-2xl border overflow-hidden', surfaceCard]">
        <div class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b" :class="isDark ? 'border-[#242422]' : 'border-slate-200'">
          <div>
            <h3 class="text-sm sm:text-base font-bold tracking-tight">Bağlantı & Kampanya Performansı</h3>
            <p :class="['text-xs mt-0.5', mutedText]">Bağlantılarınızın tıklama payı ve canlı durum özeti</p>
          </div>
          <div :class="['inline-flex p-0.5 rounded-lg border text-[11px] font-semibold', subtleInner]">
            <button
              type="button"
              @click="tableFilterMode = 'all'"
              class="px-2.5 py-1 rounded-md cursor-pointer"
              :class="tableFilterMode === 'all' ? 'bg-[#FFFF00] text-black font-bold' : mutedText"
            >
              Tümü ({{ links.filter(l => !l.isHeader).length }})
            </button>
            <button
              type="button"
              @click="tableFilterMode = 'active'"
              class="px-2.5 py-1 rounded-md cursor-pointer"
              :class="tableFilterMode === 'active' ? 'bg-emerald-500 text-black font-bold' : mutedText"
            >
              Yayında
            </button>
            <button
              type="button"
              @click="tableFilterMode = 'top'"
              class="px-2.5 py-1 rounded-md cursor-pointer"
              :class="tableFilterMode === 'top' ? 'bg-[#FFFF00] text-black font-bold' : mutedText"
            >
              En Popüler
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr :class="['border-b text-[10px] uppercase tracking-wider font-bold', isDark ? 'bg-[#191917] border-[#262624] text-[#8E8E93]' : 'bg-slate-50 border-slate-200 text-slate-500']">
                <th class="py-3 px-4">Bağlantı</th>
                <th class="py-3 px-3">Durum</th>
                <th class="py-3 px-3">Tıklama</th>
                <th class="py-3 px-4 min-w-[140px]">Pay Oranı</th>
                <th class="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody class="divide-y" :class="isDark ? 'divide-[#222220]' : 'divide-slate-100'">
              <tr
                v-for="item in tableLinks"
                :key="item.id"
                :class="['transition-colors', isDark ? 'hover:bg-[#1B1B19]' : 'hover:bg-slate-50']"
              >
                <td class="py-3 px-4">
                  <div class="min-w-0 max-w-[240px]">
                    <p class="font-bold truncate">{{ item.title }}</p>
                    <p :class="['text-[11px] truncate', mutedText]">{{ getLinkDomain(item.url) }}</p>
                  </div>
                </td>
                <td class="py-3 px-3 whitespace-nowrap">
                  <span
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    :class="item.isActive !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="item.isActive !== false ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                    {{ item.isActive !== false ? 'Yayında' : 'Gizli' }}
                  </span>
                </td>
                <td class="py-3 px-3 font-mono font-bold whitespace-nowrap">
                  {{ item.clicks || 0 }}
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <div :class="['flex-1 h-1.5 rounded-full overflow-hidden', isDark ? 'bg-[#262624]' : 'bg-slate-200']">
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#FFFF00]"
                        :style="{ width: `${Math.max(getLinkSharePercent(item.clicks), item.clicks > 0 ? 6 : 0)}%` }"
                      ></div>
                    </div>
                    <span class="text-[11px] font-mono font-semibold w-9 text-right">%{{ getLinkSharePercent(item.clicks) }}</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-right">
                  <div class="inline-flex items-center gap-1">
                    <button
                      type="button"
                      @click="emit('edit-link', item)"
                      title="Düzenle"
                      :class="['p-1.5 rounded-lg border transition-colors cursor-pointer', subtleInner, mutedText, 'hover:text-[#FFFF00]']"
                    >
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                    <a
                      v-if="item.url"
                      :href="item.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Bağlantıyı Aç"
                      :class="['p-1.5 rounded-lg border transition-colors', subtleInner, mutedText, 'hover:text-emerald-400']"
                    >
                      <ExternalLink class="w-3.5 h-3.5" />
                    </a>
                  </div>
                </td>
              </tr>
              <tr v-if="tableLinks.length === 0">
                <td colspan="5" :class="['py-8 text-center text-xs', mutedText]">
                  Filtreye uygun bağlantı bulunamadı.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sağ (4 Cols): Trafik Kanalları & Cihaz Dağılımı -->
      <div :class="['xl:col-span-4 rounded-2xl border p-5 sm:p-6 flex flex-col justify-between space-y-5', surfaceCard]">
        <div>
          <h3 class="text-sm font-bold tracking-tight">Trafik Kaynakları & Cihazlar</h3>
          <p :class="['text-[11px] mt-0.5', mutedText]">Ziyaretçi giriş kanalları ve QR / Web dağılımı</p>

          <!-- Kaynak Barları -->
          <div class="mt-4 space-y-3">
            <div
              v-for="refItem in (analytics?.referrerDistribution || []).slice(0, 4)"
              :key="refItem.source"
              class="space-y-1"
            >
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold">{{ refItem.source }}</span>
                <span :class="['font-mono text-[11px]', mutedText]">%{{ refItem.percent }}</span>
              </div>
              <div :class="['h-1.5 rounded-full overflow-hidden', isDark ? 'bg-[#262624]' : 'bg-slate-200']">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{ width: `${refItem.percent}%`, backgroundColor: refItem.color || '#FFFF00' }"
                ></div>
              </div>
            </div>
            <p v-if="!analytics?.referrerDistribution?.length" :class="['text-xs py-2', mutedText]">
              Henüz trafik kaynağı verisi birikmedi.
            </p>
          </div>
        </div>

        <!-- Mobil vs Masaüstü Kartı -->
        <div :class="['p-4 rounded-xl border space-y-2.5', subtleInner]">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="flex items-center gap-1.5 text-emerald-400">
              <Smartphone class="w-3.5 h-3.5" /> Mobil %{{ analytics?.qrMobilePercent || 0 }}
            </span>
            <span class="flex items-center gap-1.5 text-sky-400">
              <Monitor class="w-3.5 h-3.5" /> Masaüstü %{{ analytics?.qrDesktopPercent || 0 }}
            </span>
          </div>
          <div class="h-2 rounded-full overflow-hidden flex bg-[#262624]">
            <div class="bg-emerald-400 h-full" :style="{ width: `${analytics?.qrMobilePercent || 50}%` }"></div>
            <div class="bg-sky-400 h-full" :style="{ width: `${analytics?.qrDesktopPercent || 50}%` }"></div>
          </div>
          <button
            type="button"
            @click="emit('navigate', 'appearance')"
            :class="['w-full pt-1 text-[11px] font-semibold text-center hover:text-[#FFFF00] transition-colors cursor-pointer', mutedText]"
          >
            Sayfa Düzenini & Temayı Özelleştir →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

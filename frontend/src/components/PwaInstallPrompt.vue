<template>
  <!-- PWA Ana Ekrana Ekleme Bildirimi / Banner -->
  <transition
    enter-active-class="transition duration-500 ease-out transform"
    enter-from-class="translate-y-full opacity-0 sm:translate-y-4"
    enter-to-class="translate-y-0 opacity-100 sm:translate-y-0"
    leave-active-class="transition duration-300 ease-in transform"
    leave-from-class="translate-y-0 opacity-100 sm:translate-y-0"
    leave-to-class="translate-y-full opacity-0 sm:translate-y-4"
  >
    <div
      v-if="isVisible"
      class="fixed bottom-20 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md z-50 select-none"
    >
      <div 
        class="relative overflow-hidden rounded-2xl p-4 border backdrop-blur-2xl shadow-2xl"
        :class="theme === 'pure-light'
          ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/15'
          : 'bg-[#121212]/95 border-[#282828] text-white shadow-black/90 ring-1 ring-[#FFFF00]/25'"
      >
        <!-- Arka Plan Neon Işıma -->
        <div class="pointer-events-none absolute -top-10 -right-10 w-28 h-28 bg-[#FFFF00]/10 rounded-full blur-2xl"></div>

        <div class="flex items-start gap-3.5">
          <!-- Logo / İkon -->
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 flex items-center justify-center shrink-0 shadow-inner group">
            <Zap class="w-6 h-6 text-[#FFFF00] fill-[#FFFF00] drop-shadow-[0_0_8px_rgba(255,255,0,0.6)]" />
          </div>

          <!-- Metin Bilgisi -->
          <div class="flex-1 min-w-0 pr-6">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-[#FFFF00]">Mobil Deneyim</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">PWA</span>
            </div>
            <h4 class="text-sm font-bold mt-0.5 truncate" :class="theme === 'pure-light' ? 'text-slate-900' : 'text-white'">
              Linkspace'i Telefona Yükle
            </h4>
            <p class="text-xs mt-1 leading-relaxed" :class="theme === 'pure-light' ? 'text-slate-600' : 'text-neutral-400'">
              <span v-if="isIos">
                Safari'de alttaki <strong>Paylaş (⬆️)</strong> butonuna ve ardından <strong>'Ana Ekrana Ekle'</strong>ye dokunun.
              </span>
              <span v-else>
                Doğrudan ana ekrana ekleyerek web sitenizi native uygulama gibi kullanın.
              </span>
            </p>

            <!-- Aksiyon Butonları -->
            <div class="mt-3 flex items-center gap-2">
              <button
                v-if="!isIos"
                type="button"
                @click="triggerInstall"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FFFF00] text-black hover:bg-yellow-300 transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Download class="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Uygulamayı Yükle</span>
              </button>
              <button
                v-else
                type="button"
                @click="dismiss"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <span>Anladım</span>
              </button>
              <button
                type="button"
                @click="dismiss"
                class="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Daha Sonra
              </button>
            </div>
          </div>

          <!-- Kapat Çarpı Butonu -->
          <button
            type="button"
            @click="dismiss"
            class="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Zap, Download, X } from 'lucide-vue-next'

const props = defineProps({
  theme: {
    type: String,
    default: 'dark'
  }
})

const isVisible = ref(false)
const isIos = ref(false)
let deferredPrompt = null

const DISMISS_KEY = 'linkspace_pwa_dismissed_until'

const checkIfShouldShow = () => {
  // Eğer uygulama zaten bağımsız (standalone) modda açılmışsa gösterme
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  if (isStandalone) return false

  // Dismiss geçmişi kontrolü (3 gün boyunca tekrar rahatsız etmesin)
  const dismissedUntil = localStorage.getItem(DISMISS_KEY)
  if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
    return false
  }

  return true
}

onMounted(() => {
  // iOS Safari tespiti
  const ua = window.navigator.userAgent.toLowerCase()
  const isIosDevice = /iphone|ipad|ipod/.test(ua)
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua)

  if (isIosDevice && isSafari) {
    isIos.value = true
    if (checkIfShouldShow()) {
      // Sayfa açıldıktan 2.5 saniye sonra nazikçe göster
      setTimeout(() => {
        isVisible.value = true
      }, 2500)
    }
    return
  }

  // Chromium / Android / Desktop Chrome PWA olayı
  window.addEventListener('beforeinstallprompt', (e) => {
    // Tarayıcının varsayılan mini bannerını durdur
    e.preventDefault()
    deferredPrompt = e

    if (checkIfShouldShow()) {
      setTimeout(() => {
        isVisible.value = true
      }, 2000)
    }
  })

  // Yüklendiğinde gizle
  window.addEventListener('appinstalled', () => {
    isVisible.value = false
    deferredPrompt = null
  })
})

const triggerInstall = async () => {
  if (!deferredPrompt) {
    dismiss()
    return
  }
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') {
    isVisible.value = false
  }
  deferredPrompt = null
}

const dismiss = () => {
  isVisible.value = false
  // 3 gün boyunca sakla
  localStorage.setItem(DISMISS_KEY, String(Date.now() + 3 * 24 * 60 * 60 * 1000))
}
</script>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useLinkStore } from '../stores/linkStore'
import {
  Zap,
  ArrowRight,
  UserPlus,
  LogIn,
  ShieldCheck,
  Sparkles,
  QrCode,
  LayoutGrid,
  CheckCircle2,
  Search,
  ExternalLink,
  LogOut,
  Users,
  Clock
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const linkStore = useLinkStore()

const directoryProfiles = ref([])
const isLoadingDirectory = ref(true)
const quickHandle = ref('')

const myProfileHandle = computed(() => {
  const handle = authStore.user?.profileUsername || linkStore.profile?.username || authStore.user?.username || 'tubagul'
  return handle.replace(/^@/, '')
})

const goToQuickHandle = () => {
  const clean = quickHandle.value.trim().replace(/^@/, '')
  if (!clean) return
  router.push(`/@${clean}`)
}

const handleLogout = () => {
  authStore.logout()
  linkStore.resetWorkspace()
}

const getInitials = (name) => {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('')
}

onMounted(async () => {
  document.title = 'linkspace | Kendi Bağlantı Merkezini Oluştur'
  try {
    directoryProfiles.value = await linkStore.fetchDirectory()
  } finally {
    isLoadingDirectory.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#0C0C0B] text-white relative overflow-x-hidden selection:bg-[#FFFF00] selection:text-black">
    <!-- Arka Plan Atmosfer Parıltıları -->
    <div class="fixed -top-48 -left-48 w-[500px] h-[500px] bg-[#FFFF00]/10 rounded-full blur-[160px] pointer-events-none"></div>
    <div class="fixed top-1/3 -right-48 w-[420px] h-[420px] bg-yellow-400/5 rounded-full blur-[150px] pointer-events-none"></div>

    <!-- ÜST NAVİGASYON BARI -->
    <header class="sticky top-0 z-30 border-b border-white/10 bg-[#0C0C0B]/80 backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <!-- Logo -->
        <router-link to="/" class="font-black text-xl sm:text-2xl tracking-tight flex items-center group">
          <span>linkspace</span>
          <Zap class="w-5 h-5 text-[#FFFF00] fill-[#FFFF00] ml-1 drop-shadow-[0_0_8px_rgba(255,255,0,0.6)] transition-transform group-hover:scale-110" />
        </router-link>

        <!-- Sağ Navigasyon Butonları -->
        <div class="flex items-center gap-2 sm:gap-3">
          <template v-if="authStore.isAuthenticated">
            <router-link
              :to="`/@${myProfileHandle}`"
              class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-zinc-300 hover:text-[#FFFF00] border border-white/10 hover:border-[#FFFF00]/40 transition-all"
            >
              <span>@{{ myProfileHandle }}</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </router-link>

            <router-link
              to="/admin"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-lg shadow-yellow-500/20 transition-all hover:scale-105"
            >
              <span>{{ authStore.isAdmin ? 'Yönetici Paneli' : 'Panelim' }}</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </router-link>

            <button
              type="button"
              @click="handleLogout"
              class="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold text-[#8E8E93] hover:text-rose-400 transition-colors cursor-pointer"
              title="Çıkış Yap"
            >
              <LogOut class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Çıkış</span>
            </button>
          </template>

          <template v-else>
            <router-link
              to="/login"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white border border-white/10 hover:border-white/25 transition-all"
            >
              <LogIn class="w-3.5 h-3.5" />
              <span>Giriş Yap</span>
            </router-link>

            <router-link
              to="/login?mode=register"
              class="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold bg-[#FFFF00] hover:bg-[#EEFF00] text-black shadow-lg shadow-yellow-500/20 transition-all hover:scale-105"
            >
              <UserPlus class="w-3.5 h-3.5 stroke-[2.3]" />
              <span>Üye Ol</span>
            </router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- HERO BÖLÜMÜ -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20 relative z-10 space-y-16">
      <section class="text-center max-w-3xl mx-auto space-y-6">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFF00]/10 border border-[#FFFF00]/30 text-[#FFFF00] text-xs font-bold tracking-wide">
          <ShieldCheck class="w-3.5 h-3.5" />
          <span>ONAYLI ÜYELİK SİSTEMİ • KİŞİSEL BAĞLANTI MERKEZİ</span>
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
          Tüm Bağlantılarını
          <span class="text-[#FFFF00] drop-shadow-[0_0_24px_rgba(255,255,0,0.25)]">Tek Bir Linkte</span>
          Topla
        </h1>

        <p class="text-sm sm:text-base text-[#9A9AA0] max-w-2xl mx-auto leading-relaxed">
          Kendi <span class="text-white font-semibold">linkspace</span> sayfan için üyelik başvurunu yap, yönetici onayının ardından Bento Grid vitrinini, temalarını, QR kartvizitini ve ziyaretçi istatistiklerini tamamen kendi panelinden yönet.
        </p>

        <!-- Hızlı Kullanıcı Adı Arama / Doğrudan Aç -->
        <form
          @submit.prevent="goToQuickHandle"
          class="max-w-md mx-auto flex items-center gap-2 p-1.5 rounded-full bg-[#161616] border border-[#282828] focus-within:border-[#FFFF00]/60 shadow-2xl transition-colors"
        >
          <div class="flex items-center pl-4 text-xs sm:text-sm font-mono text-[#8E8E93] select-none shrink-0">
            <span>/@</span>
          </div>
          <input
            v-model="quickHandle"
            type="text"
            placeholder="kullaniciadi (örn: tubagul, selin.design)"
            class="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none py-2 min-w-0"
          />
          <button
            type="submit"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFFF00] hover:bg-[#EEFF00] text-black font-bold text-xs transition-all cursor-pointer shrink-0"
          >
            <Search class="w-3.5 h-3.5" />
            <span>Profili Aç</span>
          </button>
        </form>

        <!-- Ana CTA Butonları -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <router-link
            v-if="authStore.isAuthenticated"
            to="/admin"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#FFFF00] hover:bg-[#EEFF00] text-black font-black text-sm shadow-xl shadow-yellow-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>Yönetim Panelime Geç</span>
            <ArrowRight class="w-4 h-4 stroke-[2.5]" />
          </router-link>

          <router-link
            v-else
            to="/login?mode=register"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#FFFF00] hover:bg-[#EEFF00] text-black font-black text-sm shadow-xl shadow-yellow-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus class="w-4 h-4 stroke-[2.5]" />
            <span>Hemen Üyelik Başvurusu Yap</span>
          </router-link>

          <router-link
            to="/@tubagul"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#161616] hover:bg-[#1F1F1F] border border-[#2C2C2C] text-white font-semibold text-sm transition-all hover:border-[#FFFF00]/40"
          >
            <Sparkles class="w-4 h-4 text-[#FFFF00]" />
            <span>Örnek Profil (@tubagul)</span>
          </router-link>
        </div>
      </section>

      <!-- NASIL ÇALIŞIR (ONAYLI ÜYELİK ADIMLARI) -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-6 rounded-3xl bg-[#141414] border border-[#262626] space-y-3">
          <div class="w-10 h-10 rounded-2xl bg-[#FFFF00]/10 border border-[#FFFF00]/30 flex items-center justify-center text-[#FFFF00]">
            <UserPlus class="w-5 h-5" />
          </div>
          <h3 class="text-base font-bold">1. Üyelik Başvurusu Oluştur</h3>
          <p class="text-xs text-[#8E8E93] leading-relaxed">
            Kullanıcı adını ve e-postanı seçerek saniyeler içinde kayıt başvurusu gönder. Özel <span class="font-mono text-zinc-300">/@kullaniciadi</span> sayfan hazırlanır.
          </p>
        </div>

        <div class="p-6 rounded-3xl bg-[#141414] border border-[#262626] space-y-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock class="w-5 h-5" />
          </div>
          <h3 class="text-base font-bold">2. Yönetici Onayı</h3>
          <p class="text-xs text-[#8E8E93] leading-relaxed">
            Yeni başvurular yönetici onay kuyruğunda incelenir. Onaylandığı anda hesabın aktifleşir ve yönetim panelin açılır.
          </p>
        </div>

        <div class="p-6 rounded-3xl bg-[#141414] border border-[#262626] space-y-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <LayoutGrid class="w-5 h-5" />
          </div>
          <h3 class="text-base font-bold">3. Kişisel Panelini Yönet</h3>
          <p class="text-xs text-[#8E8E93] leading-relaxed">
            Yalnızca sana ait bağlantıları, Bento Grid & tema stillerini, QR ziyaretçi analizlerini ve iletişim mesajlarını güvenle yönet.
          </p>
        </div>
      </section>

      <!-- TOPLULUK VİTRİNİ (AKTİF ÜYELER) -->
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div class="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFFF00] mb-1">
              <Users class="w-3.5 h-3.5" />
              <span>TOPLULUK VİTRİNİ</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-black tracking-tight">Onaylı Üye Profilleri</h2>
          </div>
          <p class="text-xs text-[#8E8E93]">
            Topluluk üyelerinin canlı linkspace sayfalarını keşfetmek için kartlara tıklayın.
          </p>
        </div>

        <div v-if="isLoadingDirectory" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="n in 4" :key="n" class="h-52 rounded-3xl bg-[#161616] border border-[#262626] animate-pulse"></div>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <router-link
            v-for="member in directoryProfiles"
            :key="member.id"
            :to="`/@${(member.username || '').replace(/^@/, '')}`"
            class="group p-5 rounded-3xl bg-[#141414] hover:bg-[#1A1A19] border border-[#262626] hover:border-[#FFFF00]/50 transition-all duration-200 flex flex-col justify-between gap-4 hover:-translate-y-1 shadow-xl"
          >
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="relative shrink-0">
                  <img
                    v-if="member.avatar"
                    :src="member.avatar"
                    :alt="member.name"
                    class="w-12 h-12 rounded-2xl object-cover border border-white/10 group-hover:border-[#FFFF00]/50 transition-colors"
                  />
                  <div
                    v-else
                    class="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-sm text-[#FFFF00]"
                  >
                    {{ getInitials(member.name) }}
                  </div>
                  <span
                    v-if="member.isVerified"
                    class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FFFF00] text-black flex items-center justify-center text-[10px] font-black shadow"
                    title="Doğrulanmış Üye"
                  >
                    ✓
                  </span>
                </div>

                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FFFF00]/10 text-[#FFFF00] border border-[#FFFF00]/20">
                  {{ member.linkCount || 0 }} Link
                </span>
              </div>

              <div>
                <h3 class="font-bold text-base text-white group-hover:text-[#FFFF00] transition-colors truncate flex items-center gap-1.5">
                  <span>{{ member.name }}</span>
                </h3>
                <p class="text-xs font-mono text-[#FFFF00]/80 truncate">
                  @{{ (member.username || '').replace(/^@/, '') }}
                </p>
              </div>

              <p class="text-xs text-[#8E8E93] line-clamp-2 leading-relaxed">
                {{ member.bio || 'Kişisel linkspace profil sayfası' }}
              </p>
            </div>

            <div class="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-zinc-400 group-hover:text-[#FFFF00] transition-colors">
              <span>Profili Ziyaret Et</span>
              <ArrowRight class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </router-link>
        </div>
      </section>

      <!-- ÖZELLİK ÖZETİ & ALT BİLGİ -->
      <footer class="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8E8E93]">
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 text-[#FFFF00]" />
          <span>linkspace • Çok Kullanıcılı Onaylı Üyelik & Dijital Kartvizit Platformu</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="inline-flex items-center gap-1"><QrCode class="w-3.5 h-3.5 text-[#FFFF00]" /> QR & Analitik</span>
          <router-link to="/login" class="hover:text-[#FFFF00] transition-colors">Giriş Yap</router-link>
          <router-link to="/login?mode=register" class="text-[#FFFF00] font-semibold hover:underline">Üye Ol</router-link>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { 
  Lock, 
  User, 
  Mail,
  UserPlus,
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  CheckCircle2,
  KeyRound,
  Fingerprint
} from 'lucide-vue-next'
import { useLinkStore } from '../stores/linkStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const linkStore = useLinkStore()
const isPasskeyLoading = ref(false)

const handlePasskeyLogin = async () => {
  isPasskeyLoading.value = true
  authStore.authError = ''
  successMessage.value = ''

  const result = await linkStore.loginWithPasskey()
  isPasskeyLoading.value = false

  if (result.success) {
    successMessage.value = 'Biyometrik doğrulama başarılı! Giriş yapılıyor...'
    setTimeout(() => {
      const redirectPath = route.query.redirect || '/admin'
      router.push(redirectPath)
    }, 600)
  } else {
    authStore.authError = result.error || 'Biyometrik doğrulama tamamlanamadı.'
  }
}

const isRegisterMode = ref(false)
const name = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const successMessage = ref('')

// Hızlı demo girişi için doldurma yardımcısı
const fillDemoCredentials = () => {
  isRegisterMode.value = false
  username.value = 'admin'
  password.value = 'admin123'
}

const handleSubmit = async () => {
  successMessage.value = ''

  if (isRegisterMode.value) {
    if (!username.value.trim() || !email.value.trim() || !password.value.trim()) return

    const result = await authStore.register({
      name: name.value,
      username: username.value,
      email: email.value,
      password: password.value
    })

    if (result.success) {
      successMessage.value = 'Hesabınız başarıyla oluşturuldu! Yönlendiriliyorsunuz...'
      setTimeout(() => {
        const redirectPath = route.query.redirect || '/admin'
        router.push(redirectPath)
      }, 700)
    }
  } else {
    if (!username.value.trim() || !password.value.trim()) return

    const result = await authStore.login(username.value, password.value)
    if (result.success) {
      const redirectPath = route.query.redirect || '/admin'
      router.push(redirectPath)
    }
  }
}
</script>

<template>
  <main class="min-h-screen bg-[#0C0C0B] text-white flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Arka Plan Atmosfer Parıltıları (Dribbble Subtle Glows) -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-[140px] pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-500/5 rounded-full blur-[140px] pointer-events-none"></div>

    <div class="w-full max-w-md relative z-10">
      
      <!-- Geri Dön Butonu -->
      <div class="mb-6">
        <router-link 
          to="/" 
          class="inline-flex items-center gap-2 text-xs font-semibold text-[#8E8E93] hover:text-[#FFFF00] transition-colors group px-3.5 py-2 rounded-xl bg-[#161616] border border-[#282828] hover:border-[#FFFF00]/40 backdrop-blur-sm shadow-md"
        >
          <ArrowLeft class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Profil Sayfasına Dön</span>
        </router-link>
      </div>

      <!-- Giriş Kartı -->
      <div class="rounded-3xl bg-[#161616] border border-[#282828] shadow-2xl shadow-black/80 p-8 relative">
        
        <!-- Mod Değiştirici Sekmeler (Tabs) -->
        <div class="flex p-1 mb-6 rounded-2xl bg-[#101010] border border-[#282828]">
          <button 
            type="button"
            @click="isRegisterMode = false; authStore.authError = ''; successMessage = ''"
            :class="[
              'flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5',
              !isRegisterMode 
                ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' 
                : 'text-[#8E8E93] hover:text-white'
            ]"
          >
            <ShieldCheck class="w-3.5 h-3.5" />
            <span>Giriş Yap</span>
          </button>
          <button 
            type="button"
            @click="isRegisterMode = true; authStore.authError = ''; successMessage = ''"
            :class="[
              'flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5',
              isRegisterMode 
                ? 'bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20' 
                : 'text-[#8E8E93] hover:text-white'
            ]"
          >
            <UserPlus class="w-3.5 h-3.5" />
            <span>Yeni Kayıt</span>
          </button>
        </div>

        <!-- Üst Başlık & İkon -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#181818] border border-[#282828] p-0.5 shadow-xl mb-3">
            <div class="w-full h-full rounded-[14px] flex items-center justify-center text-[#FFFF00]">
              <UserPlus v-if="isRegisterMode" class="w-7 h-7 text-[#FFFF00]" />
              <ShieldCheck v-else class="w-7 h-7 text-[#FFFF00]" />
            </div>
          </div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>{{ isRegisterMode ? 'Yeni Hesap Oluştur' : 'Yönetici Girişi' }}</span>
          </h1>
          <p class="text-xs text-[#8E8E93] mt-1">
            {{ isRegisterMode ? 'Linktree sayfanızı oluşturmak için bilgilerinizi girin' : 'Linktree yönetim paneline erişmek için oturum açın' }}
          </p>
        </div>

        <!-- Başarı Bildirimi -->
        <div 
          v-if="successMessage" 
          class="mb-5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200"
        >
          <CheckCircle2 class="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span class="leading-relaxed">{{ successMessage }}</span>
        </div>

        <!-- Hata Bildirimi -->
        <div 
          v-if="authStore.authError" 
          class="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span class="leading-relaxed">{{ authStore.authError }}</span>
        </div>

        <!-- Giriş / Kayıt Formu -->
        <form @submit.prevent="handleSubmit" class="space-y-3.5">
          
          <!-- Ad Soyad (Yalnızca Kayıt Modunda) -->
          <div v-if="isRegisterMode">
            <label class="block text-xs font-semibold text-slate-300 mb-1">
              Ad Soyad
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User class="w-4 h-4" />
              </div>
              <input 
                v-model="name" 
                type="text" 
                placeholder="Örn: Tuba Gül"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090d16] border border-[#1e293b] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-sm text-white placeholder-slate-600 transition-colors"
              />
            </div>
          </div>

          <!-- Kullanıcı Adı -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">
              {{ isRegisterMode ? 'Kullanıcı Adı' : 'Kullanıcı Adı veya E-Posta' }}
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User class="w-4 h-4" />
              </div>
              <input 
                v-model="username" 
                type="text" 
                required 
                autocomplete="username"
                :placeholder="isRegisterMode ? 'Örn: tubagul (harf ve rakam)' : 'Örn: admin veya admin@linktree.local'"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101010] border border-[#282828] focus:border-[#FFFF00] focus:ring-1 focus:ring-[#FFFF00]/40 focus:outline-none text-sm text-white placeholder-slate-600 transition-colors"
              />
            </div>
          </div>

          <!-- E-Posta (Yalnızca Kayıt Modunda) -->
          <div v-if="isRegisterMode">
            <label class="block text-xs font-semibold text-slate-300 mb-1">
              E-Posta Adresi
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail class="w-4 h-4" />
              </div>
              <input 
                v-model="email" 
                type="email" 
                required 
                autocomplete="email"
                placeholder="ornek@alanadi.com"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101010] border border-[#282828] focus:border-[#FFFF00] focus:ring-1 focus:ring-[#FFFF00]/40 focus:outline-none text-sm text-white placeholder-slate-600 transition-colors"
              />
            </div>
          </div>

          <!-- Parola -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-slate-300">
                Şifre
              </label>
              <span v-if="isRegisterMode" class="text-[10px] text-slate-500">En az 6 karakter</span>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock class="w-4 h-4" />
              </div>
              <input 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                required 
                :autocomplete="isRegisterMode ? 'new-password' : 'current-password'"
                placeholder="••••••••"
                class="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#101010] border border-[#282828] focus:border-[#FFFF00] focus:ring-1 focus:ring-[#FFFF00]/40 focus:outline-none text-sm text-white placeholder-slate-600 transition-colors"
              />
              <button 
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                title="Şifreyi Göster/Gizle"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Beni Hatırla & Demo Bilgisi (Giriş Modunda) -->
          <div v-if="!isRegisterMode" class="flex items-center justify-between pt-1">
            <label class="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
              <input 
                type="checkbox" 
                v-model="rememberMe"
                class="w-3.5 h-3.5 rounded bg-[#101010] border-[#282828] text-yellow-400 focus:ring-yellow-400 focus:ring-offset-[#0C0C0B]"
              />
              <span>Beni hatırla</span>
            </label>

            <!-- Hızlı Doldurma Butonu -->
            <button 
              type="button" 
              @click="fillDemoCredentials"
              class="text-[11px] font-medium text-[#FFFF00] hover:underline transition-colors flex items-center gap-1"
              title="Varsayılan bilgileri otomatik doldur"
            >
              <KeyRound class="w-3 h-3 text-[#FFFF00]" />
              <span>Demo Bilgilerini Doldur</span>
            </button>
          </div>

          <!-- Gönder Butonu (Dribbble CRM Elektrik Sarı Butonu) -->
          <button 
            type="submit" 
            :disabled="authStore.isLoading"
            class="w-full mt-3 py-3 px-4 rounded-xl text-sm font-bold text-black bg-[#FFFF00] hover:bg-[#EEFF00] active:scale-[0.99] transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            <span v-if="authStore.isLoading" class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
            <component :is="isRegisterMode ? UserPlus : ShieldCheck" v-else class="w-4 h-4 group-hover:scale-110 transition-transform text-black" />
            <span>{{ authStore.isLoading ? 'İşleniyor...' : (isRegisterMode ? 'Hesap Oluştur ve Başla' : 'Giriş Yap') }}</span>
          </button>

          <!-- Biyometrik Kimlik Doğrulama (Passkey / Touch ID / Face ID) -->
          <div v-if="!isRegisterMode" class="pt-1.5">
            <div class="relative flex items-center justify-center my-2.5">
              <div class="border-t border-[#282828] w-full"></div>
              <span class="bg-[#161616] px-3 text-[10px] uppercase font-mono tracking-wider text-slate-500">veya biyometrik</span>
              <div class="border-t border-[#282828] w-full"></div>
            </div>

            <button 
              type="button"
              @click="handlePasskeyLogin"
              :disabled="isPasskeyLoading"
              class="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-white/15 hover:border-[#FFFF00]/50 transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-md"
            >
              <span v-if="isPasskeyLoading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <Fingerprint v-else class="w-4 h-4 text-[#FFFF00] group-hover:scale-110 transition-transform" />
              <span>{{ isPasskeyLoading ? 'Biyometrik Taranıyor...' : 'Touch ID / Face ID (Passkey) ile Giriş' }}</span>
            </button>
          </div>
        </form>

        <!-- Alt Bilgi Notu -->
        <div class="mt-6 pt-4 border-t border-[#282828] text-center">
          <p v-if="!isRegisterMode" class="text-[11px] text-[#8E8E93]">
            Varsayılan Demo: <span class="font-mono text-[#FFFF00] bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#333333]">admin</span> / <span class="font-mono text-emerald-400 bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#333333]">admin123</span>
          </p>
          <p v-else class="text-[11px] text-[#8E8E93]">
            Zaten hesabınız var mı? 
            <button @click="isRegisterMode = false" class="text-[#FFFF00] hover:underline font-semibold ml-1">Giriş Yapın</button>
          </p>
        </div>

      </div>
    </div>
  </main>
</template>

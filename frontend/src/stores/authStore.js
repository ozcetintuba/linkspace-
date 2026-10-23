import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'linktree_auth_token'
const USER_KEY = 'linktree_auth_user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || null)
  
  let initialUser = null
  try {
    const storedUser = localStorage.getItem(USER_KEY)
    if (storedUser) {
      initialUser = JSON.parse(storedUser)
    }
  } catch (e) {
    console.warn('Oturum kullanıcı bilgisi çözümlenemedi:', e)
  }
  const user = ref(initialUser)
  const isLoading = ref(false)
  const authError = ref('')

  const isAuthenticated = computed(() => !!token.value)

  // Oturum Başlatma (Giriş)
  const login = async (username, password) => {
    isLoading.value = true
    authError.value = ''

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Giriş yapılamadı')
      }

      token.value = data.token
      user.value = data.user

      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))

      return { success: true }
    } catch (err) {
      authError.value = err.message || 'Giriş sırasında bir hata oluştu'
      return { success: false, error: authError.value }
    } finally {
      isLoading.value = false
    }
  }

  // Yeni Kullanıcı Kaydı (Register)
  const register = async ({ name, username, email, password }) => {
    isLoading.value = true
    authError.value = ''

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt işlemi başarısız oldu')
      }

      token.value = data.token
      user.value = data.user

      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))

      return { success: true, message: data.message }
    } catch (err) {
      authError.value = err.message || 'Kayıt sırasında bir hata oluştu'
      return { success: false, error: authError.value }
    } finally {
      isLoading.value = false
    }
  }

  // Oturumu Kapatma (Çıkış)
  const logout = () => {
    token.value = null
    user.value = null
    authError.value = ''
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  // Mevcut Token Geçerliliğini Kontrol Etme
  const checkAuth = async () => {
    if (!token.value) return false

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        logout()
        return false
      }

      const userData = await response.json()
      user.value = userData
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      return true
    } catch (err) {
      console.warn('Oturum doğrulama isteği başarısız oldu:', err)
      // Ağ hatası veya sunucu çevrimdışı ise mevcut token geçerli varsayılır
      return !!token.value
    }
  }

  // İstekler için Authorization Header üretici
  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' }
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }
    return headers
  }

  // Şifre Değiştirme
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Şifre değiştirilemedi')
      }

      return { success: true, message: data.message }
    } catch (err) {
      return { success: false, error: err.message || 'Şifre güncellenirken bir hata oluştu' }
    }
  }

  return {
    token,
    user,
    isLoading,
    authError,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    getAuthHeaders,
    changePassword
  }
})


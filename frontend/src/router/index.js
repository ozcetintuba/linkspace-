import { createRouter, createWebHistory } from 'vue-router'
import ProfileView from '../views/ProfileView.vue'
import AdminView from '../views/AdminView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/authStore'

const routes = [
  { 
    path: '/', 
    name: 'profile',
    component: ProfileView 
  },
  { 
    path: '/login', 
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true }
  },
  { 
    path: '/admin', 
    name: 'admin',
    component: AdminView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/:username', 
    name: 'user-profile',
    component: ProfileView 
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Yetkilendirme Kontrolü (Navigation Guard)
router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Giriş yapılmamışsa oturum açma sayfasına yönlendir
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    // Zaten giriş yapılmışsa login yerine doğrudan admine yönlendir
    return { path: '/admin' }
  }
})

// Sayfa Başlığı Yönetimi
router.afterEach((to) => {
  if (to.name === 'admin' || to.name === 'login') {
    document.title = 'linkspace'
  }
})

export default router
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/trip/create',
      name: 'create-trip',
      component: () => import('@/views/CreateTripView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/trip/:id',
      name: 'trip',
      component: () => import('@/views/TripView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/join',
      name: 'join-trip',
      component: () => import('@/views/JoinTripView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    }
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.loading) {
    await auth.init()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router

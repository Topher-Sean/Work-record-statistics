import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import HomePage from '../pages/HomePage.vue'
import HistoryPage from '../pages/HistoryPage.vue'
import StatisticsPage from '../pages/StatisticsPage.vue'
import ProjectsPage from '../pages/ProjectsPage.vue'
import ProfilePage from '../pages/ProfilePage.vue'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: HomePage,
      meta: { requiresAuth: true }
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: StatisticsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/projects',
      name: 'projects',
      component: ProjectsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth) {
    if (!userStore.user && !userStore.isGuest) {
      next({ name: 'login' })
    } else {
      next()
    }
  } else if (to.name === 'login' && (userStore.user || userStore.isGuest)) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router

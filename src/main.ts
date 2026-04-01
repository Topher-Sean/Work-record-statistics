import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'

// 创建Vue应用实例
const app = createApp(App)

// 使用Pinia
const pinia = createPinia()
app.use(pinia)

// 在挂载前初始化用户状态，避免路由守卫闪烁或游客状态判定错误
const userStore = useUserStore(pinia)
userStore.fetchUser().then(() => {
  // 使用路由
  app.use(router)

  // 挂载应用
  app.mount('#app')
})

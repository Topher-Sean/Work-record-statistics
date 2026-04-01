<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Leaf, CalendarDays, BarChart2, FolderKanban, User as UserIcon, LogOut, Sparkles } from 'lucide-vue-next';
import { useUserStore } from '../../stores/user';

const router = useRouter();
const route = useRoute();
const isMenuOpen = ref(false);
const userStore = useUserStore();

const navItems = [
  { name: '今日记录', path: '/dashboard', icon: Leaf },
  { name: '历史记录', path: '/history', icon: CalendarDays },
  { name: '数据统计', path: '/statistics', icon: BarChart2 },
  { name: '项目管理', path: '/projects', icon: FolderKanban },
];

const handleLogout = async () => {
  await userStore.signOut();
  router.push('/');
};
</script>

<template>
  <nav class="sticky top-0 z-50 w-full bg-paper/80 backdrop-blur-md border-b border-olive/20 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center cursor-pointer" @click="router.push('/dashboard')">
          <div class="w-8 h-8 rounded-full bg-olive-light/50 flex items-center justify-center mr-2">
            <Leaf class="w-5 h-5 text-olive-dark" />
          </div>
          <span class="font-serif text-xl font-bold text-slate-800">微光日记</span>
        </div>

        <!-- 桌面端导航 -->
        <div class="hidden md:flex items-center space-x-8">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-300 relative group"
            :class="route.path === item.path ? 'text-olive-dark font-medium' : 'text-slate-500 hover:text-olive'"
          >
            <component :is="item.icon" class="w-4 h-4" />
            <span>{{ item.name }}</span>
            <!-- 手绘下划线效果 -->
            <div 
              class="absolute bottom-0 left-0 w-full h-0.5 bg-olive-light transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"
              :class="{ 'scale-x-100': route.path === item.path }"
            ></div>
          </router-link>
        </div>

        <!-- 用户操作区 -->
        <div class="hidden md:flex items-center space-x-4">
          <div class="relative group cursor-pointer" @click="router.push('/profile')">
            <div class="w-9 h-9 rounded-full bg-rose-light/50 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
              <img v-if="userStore.dbUser?.avatar_url" :src="userStore.dbUser.avatar_url" class="w-full h-full object-cover" alt="User Avatar" />
              <UserIcon v-else class="w-5 h-5 text-rose-dark" />
            </div>
            
            <!-- 下拉菜单 -->
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-paper border border-olive/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
              <div class="p-2">
                <div class="px-4 py-2 border-b border-olive/10 mb-2">
                  <p class="text-sm font-medium text-slate-800">{{ userStore.isGuest ? '游客模式' : (userStore.user?.email || '已登录用户') }}</p>
                  <p class="text-xs text-slate-500 truncate">{{ userStore.isGuest ? '本地存储' : '云端同步开启' }}</p>
                </div>
                <router-link to="/profile" class="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-paper-warm rounded-lg transition-colors">
                  <UserIcon class="w-4 h-4 mr-2" />
                  个人中心
                </router-link>
                <router-link :to="{ path: '/profile', hash: '#ai-prompt' }" class="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-paper-warm rounded-lg transition-colors">
                  <Sparkles class="w-4 h-4 mr-2" />
                  AI 提示词
                </router-link>
                <button @click="handleLogout" class="w-full flex items-center px-4 py-2 text-sm text-rose-dark hover:bg-rose-light/20 rounded-lg transition-colors mt-1">
                  <LogOut class="w-4 h-4 mr-2" />
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 移动端菜单按钮 -->
        <div class="flex items-center md:hidden">
          <button @click="isMenuOpen = !isMenuOpen" class="text-slate-500 hover:text-olive-dark focus:outline-none p-2 rounded-lg hover:bg-olive-light/20 transition-colors">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path v-if="!isMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端菜单 -->
    <div v-show="isMenuOpen" class="md:hidden bg-paper border-b border-olive/20 shadow-inner absolute w-full">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center space-x-2 px-3 py-3 rounded-lg text-base font-medium transition-colors"
          :class="route.path === item.path ? 'bg-olive-light/30 text-olive-dark' : 'text-slate-600 hover:bg-paper-warm hover:text-olive'"
          @click="isMenuOpen = false"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.name }}</span>
        </router-link>
        
        <div class="border-t border-olive/10 mt-4 pt-4 pb-2">
          <router-link to="/profile" class="flex items-center space-x-2 px-3 py-3 rounded-lg text-base font-medium text-slate-600 hover:bg-paper-warm transition-colors" @click="isMenuOpen = false">
            <UserIcon class="w-5 h-5" />
            <span>个人中心</span>
          </router-link>
          <router-link :to="{ path: '/profile', hash: '#ai-prompt' }" class="flex items-center space-x-2 px-3 py-3 rounded-lg text-base font-medium text-slate-600 hover:bg-paper-warm transition-colors" @click="isMenuOpen = false">
            <Sparkles class="w-5 h-5" />
            <span>AI 提示词</span>
          </router-link>
          <button @click="() => { handleLogout(); isMenuOpen = false; }" class="w-full flex items-center space-x-2 px-3 py-3 rounded-lg text-base font-medium text-rose-dark hover:bg-rose-light/20 transition-colors mt-1">
            <LogOut class="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

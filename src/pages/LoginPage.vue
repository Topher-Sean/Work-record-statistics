<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Leaf, Mail, MessageCircle, Apple, User, ArrowRight, Lock } from 'lucide-vue-next';
import HanddrawnButton from '../components/ui/HanddrawnButton.vue';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');
const isMounted = ref(false);
const isExiting = ref(false);

onMounted(() => {
  // 小小的延时让入场动画更平滑
  setTimeout(() => {
    isMounted.value = true;
  }, 50);
});

const navigateToDashboard = () => {
  isExiting.value = true;
  setTimeout(() => {
    router.push('/dashboard');
  }, 600); // 等待退场动画结束
};

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = '请填写邮箱和密码';
    return;
  }
  
  isSubmitting.value = true;
  errorMessage.value = '';
  
  try {
    // 尝试登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    
    if (error) {
      // 如果报错说是无效的凭证，可能是新用户，尝试注册
      if (error.message.includes('Invalid login credentials')) {
        // 先尝试注册
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.value,
          password: password.value,
        });
        
        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            throw new Error('密码错误，请重试');
          }
          throw signUpError;
        }
        
        // 由于 Supabase 默认开启了邮箱验证，新注册用户可能无法直接登录。
        // 为了开发测试方便，如果是邮箱未验证的提示，我们给个清晰的反馈：
        errorMessage.value = '注册成功！如果配置了邮箱验证，请检查收件箱。否则请再次点击登录。';
        return;
      } else if (error.message.includes('Email not confirmed')) {
        // In local development, email confirmation might be required by Supabase default settings
        // But for easier testing, we often disable it. Let's catch it explicitly.
        throw new Error('请先验证您的邮箱，或在 Supabase 后台关闭邮箱验证功能');
      } else {
        throw error;
      }
    }
    
    await userStore.fetchUser();
    userStore.setGuest(false);
    navigateToDashboard();
  } catch (error: any) {
    errorMessage.value = error.message || '登录失败，请重试';
  } finally {
    isSubmitting.value = false;
  }
};

const handleGuestLogin = () => {
  userStore.setGuest(true);
  navigateToDashboard();
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-paper relative overflow-hidden transition-opacity duration-700" :class="{ 'opacity-0': isExiting, 'opacity-100': !isExiting }">
    <!-- 背景装饰 -->
    <div class="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
      <div class="absolute top-10 left-10 w-32 h-32 bg-rose-light/30 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]"></div>
      <div class="absolute bottom-20 right-20 w-48 h-48 bg-olive-light/30 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]"></div>
      <div class="absolute top-40 right-1/4 w-24 h-24 bg-blue-light/30 rounded-full blur-2xl animate-[float_6s_ease-in-out_infinite_1s]"></div>
    </div>

    <!-- 登录卡片 -->
    <div 
      class="card-paper w-full max-w-md p-8 relative z-10 mx-4 transform transition-all duration-1000 ease-out"
      :class="[isMounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-90', isExiting ? 'scale-110 blur-xl opacity-0' : '']"
    >
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-olive-light/20 mb-4 border-2 border-olive/30 shadow-sm relative group hover:scale-110 transition-transform duration-500">
          <Leaf class="w-8 h-8 text-olive-dark group-hover:rotate-12 transition-transform duration-500" />
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-rose rounded-full animate-pulse"></div>
        </div>
        <h1 class="text-2xl font-serif font-bold text-slate-800 mb-2 transform transition-all duration-700 delay-100" :class="isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'">微光日记</h1>
        <p class="text-slate-500 text-sm transform transition-all duration-700 delay-200" :class="isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'">记录工作的点滴，感受时光的温度</p>
      </div>

      <!-- 邮箱登录表单 -->
      <div class="space-y-5 transform transition-all duration-700 delay-300" :class="isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail class="h-5 w-5 text-slate-400" />
          </div>
          <input
            v-model="email"
            type="email"
            placeholder="输入邮箱"
            class="block w-full pl-10 pr-3 py-3 border-2 border-olive-light/30 rounded-xl focus:ring-0 focus:border-olive bg-white/50 transition-colors placeholder-slate-400 text-slate-700"
          />
        </div>

        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock class="h-5 w-5 text-slate-400" />
          </div>
          <input
            v-model="password"
            type="password"
            placeholder="输入密码"
            @keyup.enter="handleLogin"
            class="block w-full pl-10 pr-3 py-3 border-2 border-olive-light/30 rounded-xl focus:ring-0 focus:border-olive bg-white/50 transition-colors placeholder-slate-400 text-slate-700"
          />
        </div>
        
        <p v-if="errorMessage" class="text-rose text-sm text-center">{{ errorMessage }}</p>

        <HanddrawnButton block size="lg" @click="handleLogin" :disabled="isSubmitting" class="mt-6">
          <span>{{ isSubmitting ? '登录中...' : '登录 / 注册' }}</span>
          <ArrowRight v-if="!isSubmitting" class="w-4 h-4 ml-2 inline" />
        </HanddrawnButton>
      </div>

      <div class="mt-8 transform transition-all duration-700 delay-500" :class="isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-paper text-slate-400">其他登录方式</span>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-3 gap-4">
          <button class="flex justify-center items-center py-2.5 border-2 border-olive-light/20 rounded-xl hover:bg-white/60 transition-colors group">
            <MessageCircle class="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
          </button>
          <button class="flex justify-center items-center py-2.5 border-2 border-olive-light/20 rounded-xl hover:bg-white/60 transition-colors group">
            <Apple class="w-5 h-5 text-slate-800 group-hover:scale-110 transition-transform" />
          </button>
          <button @click="handleGuestLogin" class="flex justify-center items-center py-2.5 border-2 border-olive-light/20 rounded-xl hover:bg-white/60 transition-colors group relative overflow-hidden" title="游客模式">
            <User class="w-5 h-5 text-slate-500 group-hover:text-olive-dark transition-colors relative z-10" />
            <div class="absolute inset-0 bg-olive-light/10 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom"></div>
          </button>
        </div>
      </div>
      
      <p class="mt-8 text-center text-xs text-slate-400 transform transition-all duration-700 delay-700" :class="isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'">
        登录即代表同意 <a href="#" class="text-olive hover:underline">用户协议</a> 与 <a href="#" class="text-olive hover:underline">隐私政策</a>
      </p>
    </div>
  </div>
</template>
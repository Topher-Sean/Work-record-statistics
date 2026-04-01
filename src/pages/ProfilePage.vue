<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { User as UserIcon, Mail, Briefcase, LogOut, Camera, Save, X, Edit, Sparkles } from 'lucide-vue-next';
import Navbar from '../components/layout/Navbar.vue';
import HanddrawnButton from '../components/ui/HanddrawnButton.vue';
import { useUserStore } from '../stores/user';
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabase';

const userStore = useUserStore();
const router = useRouter();

const nickname = ref('');
const email = ref('');
const role = ref<'programmer' | 'normal'>('programmer');
const avatarUrl = ref<string | null>(null);

const isEditing = ref(false);
const editNickname = ref('');
const isSaving = ref(false);

type PromptTemplate = {
  id: string;
  name: string;
  content: string;
  updatedAt: string;
};

type PromptConfig = {
  version: 1;
  activeId: string;
  templates: PromptTemplate[];
};

const promptConfig = ref<PromptConfig | null>(null);
const selectedTemplateId = ref('');
const templateName = ref('');
const templateContent = ref('');
const isSavingPrompt = ref(false);
const isTemplateMenuOpen = ref(false);
const templateMenuEl = ref<HTMLElement | null>(null);

const makeId = () => `${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;

const defaultPromptContent = `请严格遵循以下要求：
1. 语气客观、专业、精炼。
2. 突出核心技术产出和业务价值。
3. 排版清晰，可使用精简的列表。
4. 总字数严格控制在150字左右。`;

const normalizePromptConfig = (cfg: any, legacyPrompt: string): PromptConfig => {
  const now = new Date().toISOString();
  const legacy = (legacyPrompt || '').trim() || defaultPromptContent;
  const fallback: PromptConfig = {
    version: 1,
    activeId: 'default',
    templates: [{ id: 'default', name: '默认', content: legacy, updatedAt: now }]
  };

  if (!cfg || typeof cfg !== 'object') return fallback;
  const templates = Array.isArray(cfg.templates) ? cfg.templates : [];
  if (templates.length === 0) return fallback;

  const safeTemplates: PromptTemplate[] = templates
    .filter((t: any) => t && typeof t === 'object')
    .map((t: any) => ({
      id: String(t.id || makeId()),
      name: String(t.name || '未命名模板'),
      content: String(t.content || ''),
      updatedAt: String(t.updatedAt || now),
    }));

  const activeIdRaw = typeof cfg.activeId === 'string' ? cfg.activeId : safeTemplates[0].id;
  const activeId = safeTemplates.some(t => t.id === activeIdRaw) ? activeIdRaw : safeTemplates[0].id;

  return {
    version: 1,
    activeId,
    templates: safeTemplates,
  };
};

const readLocalPromptConfig = () => {
  try {
    const raw = localStorage.getItem('ai_summary_prompt_config');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getActiveTemplate = (cfg: PromptConfig) => {
  return cfg.templates.find(t => t.id === cfg.activeId) || cfg.templates[0];
};

const activeTemplateName = () => {
  if (!promptConfig.value) return '选择模板';
  return getActiveTemplate(promptConfig.value)?.name || '选择模板';
};

const syncEditorFromConfig = () => {
  if (!promptConfig.value) return;
  const tpl = getActiveTemplate(promptConfig.value);
  selectedTemplateId.value = tpl.id;
  templateName.value = tpl.name;
  templateContent.value = tpl.content;
};

onMounted(() => {
  loadUserData();
});

const closeTemplateMenu = () => {
  isTemplateMenuOpen.value = false;
};

const onDocClick = (e: MouseEvent) => {
  if (!isTemplateMenuOpen.value) return;
  const root = templateMenuEl.value;
  if (!root) return;
  const target = e.target as Node | null;
  if (target && !root.contains(target)) closeTemplateMenu();
};

const onDocKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeTemplateMenu();
};

onMounted(() => {
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onDocKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocClick);
  document.removeEventListener('keydown', onDocKeyDown);
});

const loadUserData = () => {
  let legacyPrompt = '';
  let nextConfig: any = null;

  if (userStore.dbUser) {
    nickname.value = userStore.dbUser.nickname || '';
    email.value = userStore.dbUser.email || '';
    role.value = userStore.dbUser.role || 'programmer';
    avatarUrl.value = userStore.dbUser.avatar_url || null;
    editNickname.value = nickname.value;
    legacyPrompt = String(userStore.dbUser.ai_prompt || '');
    nextConfig = userStore.dbUser.ai_prompt_config || null;
  } else if (userStore.isGuest) {
    nickname.value = '游客用户';
    email.value = '未登录';
  }

  try {
    const localPrompt = String(localStorage.getItem('ai_summary_prompt') || '');
    if (!legacyPrompt) legacyPrompt = localPrompt;
    if (!nextConfig) nextConfig = readLocalPromptConfig();
  } catch {}

  promptConfig.value = normalizePromptConfig(nextConfig, legacyPrompt);

  // Always sync cloud data to local storage to ensure they are consistent
  try {
    localStorage.setItem('ai_summary_prompt_config', JSON.stringify(promptConfig.value));
    localStorage.setItem('ai_summary_prompt', getActiveTemplate(promptConfig.value).content || '');
  } catch {}

  syncEditorFromConfig();
};

const handleLogout = async () => {
  await userStore.signOut();
  router.push('/');
};

const triggerFileInput = () => {
  if (userStore.isGuest) {
    alert('游客模式暂不支持修改头像');
    return;
  }
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };
  fileInput.click();
};

const uploadAvatar = async (file: File) => {
  if (!userStore.user) return;
  
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userStore.user.id}_${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage (assuming a bucket named 'public_assets' exists, or 'avatars')
    // We need to make sure the bucket exists. Let's use a base64 string directly to DB for simplicity if no bucket setup, 
    // BUT usually Supabase storage is better. Let's try base64 for absolute fail-safe if bucket isn't ready.
    
    // Convert to Base64 for simplicity in this demo without requiring storage bucket setup
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: base64 })
        .eq('id', userStore.user?.id);
        
      if (error) throw error;
      
      avatarUrl.value = base64;
      if (userStore.dbUser) {
        userStore.dbUser.avatar_url = base64;
      }
    };
    reader.readAsDataURL(file);
    
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    alert('头像上传失败: ' + error.message);
  }
};

const saveProfile = async () => {
  if (userStore.isGuest) {
    alert('游客模式暂不支持修改信息');
    return;
  }
  
  if (!editNickname.value.trim()) {
    alert('昵称不能为空');
    return;
  }
  
  isSaving.value = true;
  try {
    const { error } = await supabase
      .from('users')
      .update({ nickname: editNickname.value })
      .eq('id', userStore.user?.id);
      
    if (error) throw error;
    
    nickname.value = editNickname.value;
    if (userStore.dbUser) {
      userStore.dbUser.nickname = editNickname.value;
    }
    isEditing.value = false;
  } catch (error: any) {
    console.error('Save profile error:', error);
    alert('保存失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

const onTemplateChange = () => {
  if (!promptConfig.value) return;
  const nextId = selectedTemplateId.value;
  if (!promptConfig.value.templates.some(t => t.id === nextId)) return;
  promptConfig.value.activeId = nextId;
  syncEditorFromConfig();
};

const selectTemplate = (id: string) => {
  selectedTemplateId.value = id;
  onTemplateChange();
  closeTemplateMenu();
};

const addTemplate = () => {
  if (!promptConfig.value) return;
  const now = new Date().toISOString();
  const id = makeId();
  promptConfig.value.templates.unshift({
    id,
    name: '新模板',
    content: defaultPromptContent,
    updatedAt: now
  });
  promptConfig.value.activeId = id;
  syncEditorFromConfig();
};

const deleteTemplate = () => {
  if (!promptConfig.value) return;
  if (promptConfig.value.templates.length <= 1) return;
  const id = selectedTemplateId.value;
  const nextTemplates = promptConfig.value.templates.filter(t => t.id !== id);
  if (nextTemplates.length === 0) return;
  promptConfig.value.templates = nextTemplates;
  promptConfig.value.activeId = nextTemplates[0].id;
  syncEditorFromConfig();
};

const savePromptConfig = async () => {
  if (!promptConfig.value) return;
  const name = templateName.value.trim() || '未命名模板';
  const content = templateContent.value.trim();
  const now = new Date().toISOString();
  const id = selectedTemplateId.value;
  const idx = promptConfig.value.templates.findIndex(t => t.id === id);
  if (idx === -1) return;

  promptConfig.value.templates[idx] = {
    ...promptConfig.value.templates[idx],
    name,
    content,
    updatedAt: now
  };
  promptConfig.value.activeId = id;

  const activeContent = getActiveTemplate(promptConfig.value).content || '';

  isSavingPrompt.value = true;

  try {
    const saveToLocal = () => {
      try {
        localStorage.setItem('ai_summary_prompt_config', JSON.stringify(promptConfig.value));
        localStorage.setItem('ai_summary_prompt', activeContent);
      } catch {}
    };

    if (userStore.isGuest) {
      saveToLocal();
      return;
    }

    const userId = userStore.user?.id;
    if (!userId) {
      throw new Error('未获取到用户信息，请刷新后重试');
    }

    let cloudSaved = true;
    const rawConfig = JSON.parse(JSON.stringify(promptConfig.value));
    const { error } = await supabase
      .from('users')
      .update({ ai_prompt_config: rawConfig, ai_prompt: activeContent })
      .eq('id', userId);

    if (error) {
      const msg = String((error as any)?.message || '');
      const maybeSchema = msg.includes('schema cache') || msg.includes('ai_prompt_config') || msg.includes('Could not find the');
      if (maybeSchema) {
        const { error: fallbackError } = await supabase
          .from('users')
          .update({ ai_prompt: activeContent })
          .eq('id', userId);
        if (fallbackError) {
          const fallbackMsg = String((fallbackError as any)?.message || '');
          const fallbackSchema = fallbackMsg.includes('schema cache') || fallbackMsg.includes('Could not find the');
          if (!fallbackSchema) throw fallbackError;
          cloudSaved = false;
        }
      } else {
        throw error;
      }
    }

    if (cloudSaved && userStore.dbUser) {
      userStore.dbUser.ai_prompt_config = promptConfig.value;
      userStore.dbUser.ai_prompt = activeContent;
    }

    saveToLocal();
    if (!cloudSaved) {
      alert('云端同步不可用：Supabase users 表缺少 ai_prompt 字段。已保存到本地浏览器，请执行迁移后重试。');
    }
  } catch (error: any) {
    console.error('Save prompt error:', error);
    alert('保存失败: ' + error.message);
  } finally {
    isSavingPrompt.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-paper flex flex-col transition-all duration-700">
    <Navbar />
    
    <main class="flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 animate-[fade-in-up_0.6s_ease-out]">
      <div class="mb-8">
        <h1 class="text-3xl font-serif font-bold text-slate-800 flex items-center gap-3">
          <span class="inline-block w-2 h-8 bg-blue-dark rounded-full"></span>
          个人中心
        </h1>
        <p class="text-slate-500 mt-2">管理您的账号和偏好设置</p>
      </div>

      <div class="card-paper p-4 sm:p-8">
        <div class="flex flex-col items-center gap-6 mb-8 pb-8 border-b border-olive-light/20 text-center relative">
          
          <!-- Avatar Section -->
          <div class="relative group cursor-pointer" @click="triggerFileInput">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-rose-light/30 flex items-center justify-center border-4 border-white shadow-sm shrink-0 overflow-hidden">
              <img v-if="avatarUrl" :src="avatarUrl" class="w-full h-full object-cover" alt="User Avatar" />
              <UserIcon v-else class="w-10 h-10 sm:w-12 sm:h-12 text-rose-dark" />
            </div>
            <!-- Hover Overlay -->
            <div class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-4 border-transparent">
              <Camera class="w-6 h-6 text-white" />
            </div>
          </div>

          <!-- Info Section -->
          <div class="flex flex-col items-center flex-grow w-full">
            <div class="relative inline-flex items-center justify-center min-w-[200px]">
              <template v-if="!isEditing">
                <h2 class="text-xl sm:text-2xl font-serif font-bold text-slate-800 text-center">{{ nickname }}</h2>
                <button v-if="!userStore.isGuest" @click="isEditing = true" class="text-olive hover:text-olive-dark transition-colors p-1.5 rounded-full hover:bg-olive-light/20 absolute -right-10 top-1/2 -translate-y-1/2">
                  <Edit class="w-4 h-4" />
                </button>
              </template>
              <template v-else>
                <input 
                  v-model="editNickname" 
                  type="text" 
                  class="text-xl sm:text-2xl font-serif font-bold text-slate-800 bg-white/50 border-b-2 border-olive focus:ring-0 focus:outline-none px-2 py-1 w-48 text-center"
                  @keyup.enter="saveProfile"
                />
                <div class="absolute -right-20 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button @click="saveProfile" :disabled="isSaving" class="text-green-600 hover:text-green-700 transition-colors p-1.5 rounded-full hover:bg-green-50">
                    <Save class="w-5 h-5" />
                  </button>
                  <button @click="isEditing = false; editNickname = nickname" class="text-slate-400 hover:text-rose transition-colors p-1.5 rounded-full hover:bg-rose-50">
                    <X class="w-5 h-5" />
                  </button>
                </div>
              </template>
            </div>
            
            <p class="text-slate-500 flex items-center justify-center gap-2 mt-2 text-sm sm:text-base w-full">
              <Mail class="w-4 h-4" /> {{ email }}
            </p>
            <div class="mt-3 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-blue-light/20 text-blue-dark border border-blue-light/30">
              <Briefcase class="w-3 h-3 mr-1" />
              {{ role === 'programmer' ? '代码模式' : '非代码模式' }}
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div id="ai-prompt">
            <div class="bg-white/50 rounded-xl p-4 border border-olive-light/30">
              <div class="flex flex-col gap-3">
                <div class="flex items-start justify-between gap-4">
                  <div class="text-center sm:text-left">
                    <p class="font-medium text-slate-700 flex items-center justify-center sm:justify-start gap-2">
                      <Sparkles class="w-4 h-4 text-olive" />
                      AI 总结提示词
                    </p>
                    <p class="text-sm text-slate-500">
                      支持多套模板并可随时切换。保存后会在“一键生成总结”时生效。
                    </p>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div ref="templateMenuEl" class="flex-1 relative">
                    <button
                      type="button"
                      class="w-full h-10 px-4 pr-10 bg-white/50 border border-olive-light/30 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-light/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper transition-colors text-slate-700 cursor-pointer shadow-sm hover:bg-white/80 text-left flex items-center justify-between"
                      @click="isTemplateMenuOpen = !isTemplateMenuOpen"
                    >
                      <span class="truncate">{{ activeTemplateName() }}</span>
                      <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                        <svg class="w-4 h-4 transition-transform duration-200" :class="isTemplateMenuOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </span>
                    </button>

                    <div
                      v-if="isTemplateMenuOpen"
                      class="absolute z-50 mt-2 w-full card-paper p-2 shadow-lg border border-olive-light/30 rounded-2xl"
                    >
                      <div class="max-h-60 overflow-auto">
                        <button
                          v-for="t in (promptConfig?.templates || [])"
                          :key="t.id"
                          type="button"
                          class="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between gap-3"
                          :class="selectedTemplateId === t.id ? 'bg-paper-green text-olive-dark' : 'text-slate-600 hover:bg-paper-warm/60'"
                          @click="selectTemplate(t.id)"
                        >
                          <span class="truncate">{{ t.name }}</span>
                          <span v-if="selectedTemplateId === t.id" class="text-xs text-olive-dark/70">当前</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <HanddrawnButton variant="outline" size="sm" class="h-10 w-full sm:w-auto justify-center" @click="addTemplate">
                    新增模板
                  </HanddrawnButton>
                  <HanddrawnButton
                    variant="outline"
                    size="sm"
                    class="h-10 w-full sm:w-auto justify-center !text-rose-dark !border-rose-light hover:!bg-rose-light/10"
                    :disabled="(promptConfig?.templates?.length || 0) <= 1"
                    @click="deleteTemplate"
                  >
                    删除模板
                  </HanddrawnButton>
                </div>

                <div>
                  <input
                    v-model="templateName"
                    type="text"
                    class="w-full h-10 px-4 bg-white/50 border border-olive-light/30 rounded-xl focus:ring-0 focus:border-olive transition-colors text-slate-700 outline-none shadow-sm hover:bg-white/80"
                    placeholder="输入模板名称，如：日报（精简）"
                  />
                </div>

                <div>
                  <textarea
                    v-model="templateContent"
                    rows="5"
                    class="w-full p-4 bg-white/50 border border-olive-light/30 rounded-xl focus:ring-0 focus:border-olive transition-colors text-slate-700 placeholder-slate-400 resize-none shadow-sm hover:bg-white/80"
                    placeholder="输入模板内容，如：请用 STAR 结构输出；控制在 120 字以内..."
                  ></textarea>
                </div>

                <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p class="text-xs text-slate-400 text-center sm:text-left">
                    {{ userStore.isGuest ? '游客模式：提示词仅保存在本地浏览器。' : '已登录：提示词保存在云端并随账号同步。' }}
                  </p>
                  <HanddrawnButton
                    variant="outline"
                    size="sm"
                    class="w-full sm:w-auto justify-center"
                    :disabled="isSavingPrompt"
                    @click="savePromptConfig"
                  >
                    保存模板
                  </HanddrawnButton>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="bg-white/50 rounded-xl p-4 border border-olive-light/30">
              <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="text-center sm:text-left">
                  <p class="font-medium text-slate-700">退出登录</p>
                  <p class="text-sm text-slate-500">退出当前账号，返回登录页面</p>
                </div>
                <HanddrawnButton variant="outline" @click="handleLogout" class="!text-rose-dark !border-rose-light hover:!bg-rose-light/10 w-full sm:w-auto justify-center">
                  <LogOut class="w-4 h-4 mr-2 inline" /> 退出
                </HanddrawnButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { CalendarDays, Sparkles, Plus, Clock, Save, GitCommit } from 'lucide-vue-next';
import Navbar from '../components/layout/Navbar.vue';
import RoleCapsule from '../components/ui/RoleCapsule.vue';
import HanddrawnButton from '../components/ui/HanddrawnButton.vue';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../stores/user';
import { useRoute, useRouter } from 'vue-router';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const currentRole = ref<'programmer' | 'normal'>(userStore.role || 'programmer');

// 如果 URL 中有 date 参数，则使用该参数，否则使用今天
const currentDateStr = ref(route.query.date ? String(route.query.date) : dayjs().format('YYYY-MM-DD'));
const today = computed(() => dayjs(currentDateStr.value).format('YYYY年MM月DD日 dddd'));

const projects = ref<any[]>([]);
const programmerRecords = ref([{ id: Date.now().toString(), projectId: null as string | null, commit: '', selected: true }]);

const addProgrammerRecord = () => {
  programmerRecords.value.push({
    id: Date.now().toString(),
    projectId: projects.value[0]?.id ?? null,
    commit: '',
    selected: true
  });
};
const removeProgrammerRecord = (index: number) => {
  if (programmerRecords.value.length <= 1) {
    programmerRecords.value[0].commit = '';
    programmerRecords.value[0].selected = true;
    return;
  }
  programmerRecords.value.splice(index, 1);
};

const workItems = ref([{ id: Date.now().toString(), projectId: null as string | null, content: '', duration: '', selected: true }]);

const removeWorkItem = (index: number) => {
  if (workItems.value.length <= 1) {
    workItems.value[0].content = '';
    workItems.value[0].duration = '';
    workItems.value[0].selected = true;
    return;
  }
  workItems.value.splice(index, 1);
};

const codeSummary = ref('');
const nonCodeSummary = ref('');
const aiSummary = computed({
  get: () => currentRole.value === 'programmer' ? codeSummary.value : nonCodeSummary.value,
  set: (v: string) => {
    if (currentRole.value === 'programmer') codeSummary.value = v;
    else nonCodeSummary.value = v;
  }
});
const isGenerating = ref(false);
const isSaving = ref(false);
const saveMessage = ref('');
const currentRecordId = ref<string | null>(null);

const getPromptFromConfig = (cfg: any) => {
  try {
    if (!cfg || typeof cfg !== 'object') return '';
    const templates = Array.isArray((cfg as any).templates) ? (cfg as any).templates : [];
    if (templates.length === 0) return '';
    const activeId = typeof (cfg as any).activeId === 'string' ? (cfg as any).activeId : '';
    const active = templates.find((t: any) => t && t.id === activeId) || templates[0];
    return String(active?.content || '').trim();
  } catch {
    return '';
  }
};

const getAiSummaryPrompt = () => {
  try {
    if (!userStore.isGuest) {
      const fromCfg = getPromptFromConfig(userStore.dbUser?.ai_prompt_config);
      if (fromCfg) return fromCfg;
      if (userStore.dbUser?.ai_prompt) return String(userStore.dbUser.ai_prompt || '').trim();
    }

    const rawCfg = localStorage.getItem('ai_summary_prompt_config');
    if (rawCfg) {
      const fromLocalCfg = getPromptFromConfig(JSON.parse(rawCfg));
      if (fromLocalCfg) return fromLocalCfg;
    }

    return String(localStorage.getItem('ai_summary_prompt') || '').trim();
  } catch {
    return '';
  }
};

onMounted(async () => {
  if (userStore.role) {
    currentRole.value = userStore.role;
  }
  await loadProjects();
  await loadTodayRecord();
});

watch(currentRole, (newRole) => {
  userStore.setRole(newRole);
});

const loadProjects = async () => {
  if (userStore.isGuest) return;
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userStore.user?.id);
  
  if (error) {
    console.error('Failed to load projects:', error);
    return;
  }
  
  if (data) {
    projects.value = data;
    if (data.length === 0) {
      // Create a default project
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
          user_id: userStore.user?.id,
          name: '日常工作',
          color: '#B8B89F'
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Failed to create default project:', createError);
      } else if (newProject) {
        projects.value = [newProject];
        if (programmerRecords.value.length > 0) {
          programmerRecords.value[0].projectId = newProject.id;
        }
        if (workItems.value.length > 0) {
          workItems.value[0].projectId = newProject.id;
        }
      }
    } else {
      if (programmerRecords.value.length > 0) {
        programmerRecords.value[0].projectId = data[0].id;
      }
      if (workItems.value.length > 0) {
        workItems.value[0].projectId = data[0].id;
      }
    }
  }
};

const parseProjectNamePrefix = (text: string) => {
  const m = String(text || '').match(/^【([^】]+)】:?[\s\n]*/);
  if (!m) return { projectName: '', rest: String(text || '') };
  return { projectName: m[1], rest: String(text || '').slice(m[0].length) };
};

const findProjectIdByName = (name: string) => {
  const p = projects.value.find((x: any) => x?.name === name);
  return p?.id ?? null;
};

const loadTodayRecord = async () => {
  if (userStore.isGuest) return;
  const { data: record } = await supabase
    .from('work_records')
    .select('*, work_items(*), commits(*)')
    .eq('user_id', userStore.user?.id)
    .eq('record_date', currentDateStr.value)
    .single();

  if (record) {
    currentRecordId.value = record.id;
    codeSummary.value = record.code_summary || '';
    nonCodeSummary.value = record.noncode_summary || '';
    if (!codeSummary.value && !nonCodeSummary.value) {
      codeSummary.value = record.summary || '';
    }
    
    if (record.commits && record.commits.length > 0) {
      programmerRecords.value = record.commits.map((c: any) => {
        const raw = String(c.commit_message || '');
        const { projectName, rest } = parseProjectNamePrefix(raw);
        return {
          id: String(c.id || Date.now().toString()),
          projectId: projectName ? findProjectIdByName(projectName) : null,
          commit: rest.trim(),
          selected: true,
        };
      });
      if (programmerRecords.value.length === 0) {
        programmerRecords.value = [{ id: Date.now().toString(), projectId: projects.value[0]?.id ?? null, commit: '', selected: true }];
      }
    }
    if (record.work_items && record.work_items.length > 0) {
      workItems.value = record.work_items.map((item: any) => {
        const raw = String(item.content || '');
        const { projectName, rest } = parseProjectNamePrefix(raw);
        return {
          id: item.id,
          projectId: projectName ? findProjectIdByName(projectName) : null,
          content: rest.trim(),
          duration: item.duration_minutes ? (item.duration_minutes / 60).toString() : '',
          selected: true
        };
      });
    }
  }
};

const addWorkItem = () => {
  workItems.value.push({
    id: Date.now().toString(),
    projectId: projects.value[0]?.id ?? null,
    content: '',
    duration: '',
    selected: true
  });
};

const generateAiSummary = async () => {
  if (currentRole.value === 'programmer' && !programmerRecords.value.some(r => r.selected && r.commit.trim())) {
    alert('请至少选择一条提交用于生成');
    return;
  }
  if (currentRole.value === 'normal' && !workItems.value.some(item => item.selected && item.content.trim())) {
    alert('请至少选择一条工作项用于生成');
    return;
  }

  isGenerating.value = true;
  aiSummary.value = '';
  
  try {
    const workData = currentRole.value === 'programmer' 
      ? {
          projects: Array.from(new Set(programmerRecords.value.filter(r => r.selected && r.commit.trim()).map(r => {
            const p = projects.value.find(proj => proj.id === r.projectId);
            return p ? p.name : '未选择项目';
          }))),
          commits: programmerRecords.value.filter(r => r.selected && r.commit.trim()).map(r => {
            const p = projects.value.find(proj => proj.id === r.projectId);
            const projName = p ? p.name : '未选择项目';
            return `【${projName}】:\n${r.commit}`;
          }).join('\n\n')
        }
      : {
          workItems: workItems.value.filter(item => item.selected && item.content.trim()).map(item => {
            const p = projects.value.find(proj => proj.id === item.projectId);
            const projName = p ? p.name : '未选择项目';
            return {
              content: `【${projName}】${item.content}`,
              duration: item.duration
            };
          })
        };

    const apiBase = (import.meta as any).env?.VITE_API_BASE_PATH || '/wr-api';
    const response = await fetch(`${apiBase}/work-records/ai-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workData,
        userRole: currentRole.value,
        prompt: getAiSummaryPrompt()
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.error) {
      throw new Error(data?.details || data?.error || `服务不可用（HTTP ${response.status}）`);
    }
    aiSummary.value = data.data?.summary || '';
  } catch (error) {
    console.error('Failed to generate summary:', error);
    const msg = error instanceof Error ? error.message : String(error);
    aiSummary.value = `AI 生成失败：${msg}\n\n请确认：\n1) 本地后端已启动（npm run server:dev 或 npm run dev）\n2) 后端端口与 Vite 代理一致（默认 3001，可用 API_PORT 调整）\n3) 已配置 OPENAI_API_KEY（否则会返回本地模拟总结）`;
  } finally {
    isGenerating.value = false;
  }
};

const saveRecord = async () => {
  if (userStore.isGuest) {
    alert('游客模式暂不支持保存到云端');
    return;
  }
  
  isSaving.value = true;
  saveMessage.value = '';
  
  try {
    let recordId = currentRecordId.value;
    
    if (recordId) {
      // Update
      const payload: any = {
        project_id: currentRole.value === 'programmer' 
          ? (programmerRecords.value.length > 0 ? programmerRecords.value[0].projectId : null)
          : (workItems.value.length > 0 ? workItems.value[0].projectId : null),
        summary: (codeSummary.value || nonCodeSummary.value),
        code_summary: codeSummary.value,
        noncode_summary: nonCodeSummary.value,
        updated_at: new Date().toISOString()
      };

      let { error: updateError } = await supabase
        .from('work_records')
        .update(payload)
        .eq('id', recordId)
        .eq('user_id', userStore.user?.id);

      if (updateError) {
        const msg = String((updateError as any)?.message || '');
        if (msg.includes('code_summary') || msg.includes('noncode_summary')) {
          const legacyPayload = { ...payload };
          delete (legacyPayload as any).code_summary;
          delete (legacyPayload as any).noncode_summary;
          ({ error: updateError } = await supabase
            .from('work_records')
            .update(legacyPayload)
            .eq('id', recordId)
            .eq('user_id', userStore.user?.id));
        }
      }

      if (updateError) throw updateError;
    } else {
      // Insert
      const insertPayload: any = {
        user_id: userStore.user?.id,
        record_date: currentDateStr.value,
        project_id: currentRole.value === 'programmer' 
          ? (programmerRecords.value.length > 0 ? programmerRecords.value[0].projectId : null)
          : (workItems.value.length > 0 ? workItems.value[0].projectId : null),
        summary: (codeSummary.value || nonCodeSummary.value),
        code_summary: codeSummary.value,
        noncode_summary: nonCodeSummary.value
      };

      let { data, error } = await supabase
        .from('work_records')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        const msg = String((error as any)?.message || '');
        if (msg.includes('code_summary') || msg.includes('noncode_summary')) {
          const legacyPayload = { ...insertPayload };
          delete (legacyPayload as any).code_summary;
          delete (legacyPayload as any).noncode_summary;
          ({ data, error } = await supabase
            .from('work_records')
            .insert(legacyPayload)
            .select()
            .single());
        }
      }

      if (error) {
        console.error('Insert error details:', error);
        throw error;
      }

      recordId = (data as any).id;
      currentRecordId.value = recordId;
    }
    
    // Save commits or work items based on role
    if (currentRole.value === 'programmer' && programmerRecords.value.some(r => r.commit.trim())) {
      // Simple logic: delete old commits and insert new
      await supabase.from('commits').delete().eq('record_id', recordId);
      
      const commitsToInsert = programmerRecords.value
        .filter(r => r.commit.trim())
        .map(r => {
          const p = projects.value.find(proj => proj.id === r.projectId);
          const projName = p ? p.name : '未选择项目';
          return {
            record_id: recordId,
            commit_hash: 'manual',
            commit_message: `【${projName}】:\n${r.commit}`
          };
        });
        
      if (commitsToInsert.length > 0) {
        const { error: commitError } = await supabase.from('commits').insert(commitsToInsert);
        if (commitError) console.error('Commit save error:', commitError);
      }
    } else if (currentRole.value === 'normal') {
      await supabase.from('work_items').delete().eq('record_id', recordId);
      const itemsToInsert = workItems.value
        .filter(item => item.content.trim())
        .map((item, index) => {
          const p = projects.value.find(proj => proj.id === item.projectId);
          const projName = p ? p.name : '未选择项目';
          return {
            record_id: recordId,
            content: `【${projName}】${item.content}`,
            duration_minutes: parseFloat(item.duration || '0') * 60,
            order_index: index
          };
        });
      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from('work_items').insert(itemsToInsert);
        if (itemsError) console.error('Items save error:', itemsError);
      }
    }
    
    saveMessage.value = '保存成功！';
    setTimeout(() => saveMessage.value = '', 3000);
  } catch (error: any) {
    console.error('Save error:', error);
    alert('保存失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-paper flex flex-col transition-all duration-700">
    <Navbar />
    
    <main class="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 animate-[fade-in-up_0.6s_ease-out]">
      <!-- 头部区域 -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-serif font-bold text-slate-800 flex items-center gap-3">
            <span class="inline-block w-2 h-8 bg-olive rounded-full"></span>
            {{ currentDateStr === dayjs().format('YYYY-MM-DD') ? '今日记录' : '补写记录' }}
          </h1>
          <p class="text-slate-500 mt-2 flex items-center gap-2">
            <CalendarDays class="w-4 h-4" />
            {{ today }}
          </p>
        </div>
        
        <RoleCapsule v-model="currentRole" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左侧输入区 -->
        <div class="space-y-6 w-full max-w-full overflow-hidden">
          
          <!-- 代码模式 -->
          <div v-if="currentRole === 'programmer'" class="card-paper p-6">
            <h2 class="text-lg font-serif font-medium text-slate-800 mb-4 flex items-center gap-2">
              <GitCommit class="w-5 h-5 text-olive" />
              项目提交记录
            </h2>
            
            <div class="space-y-8">
              <div v-for="(record, index) in programmerRecords" :key="record.id" class="p-4 bg-paper-warm/50 rounded-2xl border border-olive-light/20 relative group">
                <div class="absolute -top-3 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="removeProgrammerRecord(index)" class="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-rose-dark shadow-sm border border-slate-100">
                    ×
                  </button>
                </div>
                
                <div class="mb-4">
                  <label class="block text-sm font-medium text-slate-600 mb-2">选择项目</label>
                  <div class="flex flex-wrap gap-2">
                    <button 
                      v-for="project in projects" 
                      :key="project.id"
                      @click="record.projectId = project.id"
                      class="px-4 py-2 rounded-xl text-sm transition-all duration-300 border-2 hover:scale-105 active:scale-95"
                      :class="record.projectId === project.id ? `border-transparent text-white shadow-md transform -translate-y-0.5` : 'border-slate-200 text-slate-500 hover:border-olive-light'"
                      :style="record.projectId === project.id ? { backgroundColor: project.color } : {}"
                    >
                      {{ project.name }}
                    </button>
                    <button @click.prevent="router.push('/projects')" class="px-4 py-2 rounded-xl text-sm border-2 border-dashed border-slate-300 text-slate-500 hover:border-olive-light hover:text-olive flex items-center gap-1 transition-all hover:scale-105 active:scale-95">
                      <Plus class="w-4 h-4" /> 新建
                    </button>
                  </div>
                </div>
                
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-slate-600">提交内容</label>
                    <label class="inline-flex items-center gap-2 text-xs text-slate-500 select-none">
                      <input v-model="record.selected" type="checkbox" class="w-4 h-4 rounded border-olive/30 text-olive focus:ring-olive/50 bg-white/50" />
                      用于生成
                    </label>
                  </div>
                  <textarea 
                    v-model="record.commit"
                    rows="2"
                    placeholder="输入一次提交（或一段变更说明）..."
                    class="w-full p-4 bg-white/50 border-2 border-olive-light/30 rounded-xl focus:ring-0 focus:border-olive transition-colors resize-none text-slate-700 placeholder-slate-400"
                  ></textarea>
                </div>
              </div>
              
              <button @click="addProgrammerRecord" class="flex items-center justify-center w-full gap-2 text-sm text-olive-dark hover:text-olive transition-colors py-3 px-4 rounded-xl border-2 border-dashed border-olive-light/50 hover:bg-olive-light/10">
                <Plus class="w-4 h-4" /> 增加一次提交
              </button>
            </div>
          </div>

          <!-- 非代码模式 -->
          <div v-else class="card-paper p-6">
            <h2 class="text-lg font-serif font-medium text-slate-800 mb-4 flex items-center gap-2">
              <Clock class="w-5 h-5 text-rose" />
              工作项记录
            </h2>
            
            <div class="space-y-6">
              <div v-for="(item, index) in workItems" :key="item.id" class="p-4 bg-paper-warm/50 rounded-2xl border border-olive-light/20 relative group">
                <div class="absolute -top-3 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="removeWorkItem(index)" class="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-rose-dark shadow-sm border border-slate-100">
                    ×
                  </button>
                </div>
                
                <div class="mb-4">
                  <label class="block text-sm font-medium text-slate-600 mb-2">选择项目</label>
                  <div class="flex flex-wrap gap-2">
                    <button 
                      v-for="project in projects" 
                      :key="project.id"
                      @click="item.projectId = project.id"
                      class="px-4 py-2 rounded-xl text-sm transition-all duration-300 border-2 hover:scale-105 active:scale-95"
                      :class="item.projectId === project.id ? `border-transparent text-white shadow-md transform -translate-y-0.5` : 'border-slate-200 text-slate-500 hover:border-olive-light'"
                      :style="item.projectId === project.id ? { backgroundColor: project.color } : {}"
                    >
                      {{ project.name }}
                    </button>
                    <button @click.prevent="router.push('/projects')" class="px-4 py-2 rounded-xl text-sm border-2 border-dashed border-slate-300 text-slate-500 hover:border-olive-light hover:text-olive flex items-center gap-1 transition-all hover:scale-105 active:scale-95">
                      <Plus class="w-4 h-4" /> 新建
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-slate-600">工作内容</label>
                  <label class="inline-flex items-center gap-2 text-xs text-slate-500 select-none">
                    <input v-model="item.selected" type="checkbox" class="w-4 h-4 rounded border-olive/30 text-olive focus:ring-olive/50 bg-white/50" />
                    用于生成
                  </label>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div class="hidden sm:flex w-6 h-6 rounded-full bg-white items-center justify-center text-xs text-slate-500 font-medium border border-slate-200 shrink-0 shadow-sm">
                    {{ index + 1 }}
                  </div>
                  <div class="flex-grow w-full sm:w-auto">
                    <input 
                      v-model="item.content"
                      type="text"
                      placeholder="输入工作内容..."
                      class="w-full p-3 bg-white/50 border-2 border-olive-light/30 rounded-xl focus:ring-0 focus:border-olive transition-colors text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  <div class="w-full sm:w-24 shrink-0 flex gap-2">
                    <input 
                      v-model="item.duration"
                      type="text"
                      placeholder="耗时(h)"
                      class="w-full p-3 bg-white/50 border-2 border-olive-light/30 rounded-xl focus:ring-0 focus:border-olive transition-colors text-slate-700 placeholder-slate-400 text-center"
                    />
                  </div>
                </div>
              </div>
              
              <button @click="addWorkItem" class="flex items-center justify-center w-full gap-2 text-sm text-olive-dark hover:text-olive transition-colors py-3 px-4 rounded-xl border-2 border-dashed border-olive-light/50 hover:bg-olive-light/10">
                <Plus class="w-4 h-4" /> 增加工作项
              </button>
            </div>
          </div>

        </div>

        <!-- 右侧AI总结区 -->
        <div class="space-y-6 w-full max-w-full">
          <div class="card-paper p-6 relative overflow-hidden h-full flex flex-col min-h-[500px]">
            <!-- 装饰元素 -->
            <div class="absolute -top-6 -right-6 w-24 h-24 bg-blue-light/20 rounded-full blur-2xl"></div>
            
            <h2 class="text-lg font-serif font-medium text-slate-800 mb-4 flex items-center gap-2 relative z-10">
              <Sparkles class="w-5 h-5 text-blue-dark" />
              AI 工作总结
            </h2>
            
            <div class="flex-grow flex flex-col relative z-10">
              <div v-if="!aiSummary && !isGenerating" class="flex-grow flex flex-col items-center justify-center text-center py-8">
                <div class="w-16 h-16 bg-paper rounded-full flex items-center justify-center mb-4 border border-dashed border-blue-light">
                  <Sparkles class="w-6 h-6 text-blue-light" />
                </div>
                <p class="text-sm text-slate-500 mb-6">点击生成，让AI帮你梳理今日工作</p>
                <HanddrawnButton variant="secondary" @click="generateAiSummary">
                  一键生成总结
                </HanddrawnButton>
              </div>
              
              <div v-else-if="isGenerating" class="flex-grow flex flex-col items-center justify-center py-8">
                <div class="relative w-12 h-12 mb-4">
                  <div class="absolute inset-0 border-4 border-blue-light/30 rounded-full"></div>
                  <div class="absolute inset-0 border-4 border-blue-dark rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p class="text-sm text-slate-500 animate-pulse">AI 正在认真思考中...</p>
              </div>
              
              <div v-else class="flex-grow flex flex-col">
                <textarea 
                  v-model="aiSummary"
                  class="flex-grow w-full p-4 bg-paper/50 border-2 border-blue-light/30 rounded-xl focus:ring-0 focus:border-blue-dark transition-colors resize-none text-slate-700 leading-relaxed font-serif text-sm min-h-[200px]"
                ></textarea>
                <div class="flex gap-3 mt-4 items-center">
                  <HanddrawnButton variant="outline" class="flex-1 text-sm" @click="generateAiSummary">
                    重新生成
                  </HanddrawnButton>
                  <HanddrawnButton variant="primary" class="flex-1 text-sm flex items-center justify-center gap-2" @click="saveRecord" :disabled="isSaving">
                    <Save class="w-4 h-4" /> {{ isSaving ? '保存中...' : '保存记录' }}
                  </HanddrawnButton>
                </div>
                <p v-if="saveMessage" class="text-olive text-sm text-center mt-2">{{ saveMessage }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 添加一些细微的纸张折痕效果 */
.card-paper::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 30px;
  height: 30px;
  background: linear-gradient(to bottom left, transparent 50%, rgba(0,0,0,0.02) 50%);
  border-bottom-left-radius: 4px;
  pointer-events: none;
}
</style>

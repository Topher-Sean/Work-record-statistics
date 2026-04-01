<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { FolderKanban, Plus, MoreVertical, Edit, Trash2 } from 'lucide-vue-next';
import Navbar from '../components/layout/Navbar.vue';
import HanddrawnButton from '../components/ui/HanddrawnButton.vue';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../stores/user';
import dayjs from 'dayjs';

const userStore = useUserStore();
const projects = ref<any[]>([]);
const isModalOpen = ref(false);
const projectToDelete = ref<any>(null);
const isDeleting = ref(false);

const form = ref({
  id: '',
  name: '',
  description: '',
  color: '#D4A5A5'
});

const colors = ['#D4A5A5', '#A8B5C8', '#B8B89F', '#E8C5C5', '#C4D0E0', '#D4D4BF'];

onMounted(async () => {
  await loadProjects();
});

const loadProjects = async () => {
  if (userStore.isGuest) return;
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userStore.user?.id)
    .order('created_at', { ascending: false });
    
  if (data) {
    projects.value = data;
  }
};

const openModal = (project?: any) => {
  if (project) {
    form.value = { ...project };
  } else {
    form.value = { id: '', name: '', description: '', color: colors[0] };
  }
  isModalOpen.value = true;
};

const saveProject = async () => {
  if (userStore.isGuest) {
    alert('游客模式暂不支持保存项目');
    return;
  }
  if (!form.value.name.trim()) {
    alert('请输入项目名称');
    return;
  }
  
  if (form.value.id) {
    const { error } = await supabase
      .from('projects')
      .update({
        name: form.value.name,
        description: form.value.description,
        color: form.value.color
      })
      .eq('id', form.value.id)
      .eq('user_id', userStore.user?.id); // Ensure user_id matches for RLS
    if (error) {
      console.error(error);
      alert('更新失败：' + error.message);
      return;
    }
  } else {
    const { error } = await supabase
      .from('projects')
      .insert({
        user_id: userStore.user?.id,
        name: form.value.name,
        description: form.value.description,
        color: form.value.color
      });
    if (error) {
      console.error(error);
      alert('保存失败：' + error.message);
      return;
    }
  }
  
  isModalOpen.value = false;
  await loadProjects();
};

const deleteProject = (project: any) => {
  projectToDelete.value = project;
};

const confirmDelete = async () => {
  if (!projectToDelete.value) return;
  
  isDeleting.value = true;
  const id = projectToDelete.value.id;
  
  try {
    // Delete related work records first due to foreign key constraints
    const { data: records } = await supabase
      .from('work_records')
      .select('id')
      .eq('project_id', id);
      
    if (records && records.length > 0) {
      const recordIds = records.map(r => r.id);
      
      // Delete related work items and commits
      await supabase.from('work_items').delete().in('record_id', recordIds);
      await supabase.from('commits').delete().in('record_id', recordIds);
      
      // Delete work records
      await supabase.from('work_records').delete().eq('project_id', id);
    }
    
    // Finally delete the project
    const { error } = await supabase.from('projects').delete().eq('id', id).eq('user_id', userStore.user?.id);
    if (error) {
      alert('删除失败：' + error.message);
    } else {
      await loadProjects();
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    alert('删除过程中发生错误');
  } finally {
    isDeleting.value = false;
    projectToDelete.value = null;
  }
};
</script>

<template>
  <div class="min-h-screen bg-paper flex flex-col transition-all duration-700">
    <Navbar />
    
    <main class="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 animate-[fade-in-up_0.6s_ease-out]">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-serif font-bold text-slate-800 flex items-center gap-3">
            <span class="inline-block w-2 h-8 bg-olive rounded-full"></span>
            项目管理
          </h1>
          <p class="text-slate-500 mt-2">在这里管理您的所有工作项目</p>
        </div>
        
        <HanddrawnButton @click="openModal()" variant="primary" class="flex items-center gap-2 w-full md:w-auto justify-center">
          <Plus class="w-4 h-4" /> 新建项目
        </HanddrawnButton>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="projectToDelete" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity">
        <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform scale-100 transition-transform">
          <div class="flex items-center gap-3 mb-4 text-rose-dark">
            <div class="w-10 h-10 rounded-full bg-rose-light/30 flex items-center justify-center">
              <Trash2 class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-serif font-bold">确认删除项目？</h3>
          </div>
          <p class="text-slate-600 text-sm mb-6 leading-relaxed">
            您确定要删除 <span class="font-bold text-slate-800">"{{ projectToDelete.name }}"</span> 吗？<br>
            <span class="text-rose text-xs mt-1 block">注意：此操作将同时删除该项目下的所有工作记录和提交信息，且不可恢复！</span>
          </p>
          <div class="flex gap-3">
            <HanddrawnButton variant="outline" class="flex-1" @click="projectToDelete = null" :disabled="isDeleting">取消</HanddrawnButton>
            <HanddrawnButton variant="primary" class="flex-1 !bg-rose-dark hover:!bg-rose-900 !border-rose-dark text-white" @click="confirmDelete" :disabled="isDeleting">
              {{ isDeleting ? '删除中...' : '确认删除' }}
            </HanddrawnButton>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        <div v-for="project in projects" :key="project.id" class="card-paper p-6 relative group transition-all duration-300 hover:-translate-y-1">
          <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button @click="openModal(project)" class="p-1.5 text-slate-400 hover:text-blue-dark transition-colors rounded-lg hover:bg-blue-light/10">
              <Edit class="w-4 h-4" />
            </button>
            <button @click="deleteProject(project)" class="p-1.5 text-slate-400 hover:text-rose-dark transition-colors rounded-lg hover:bg-rose-light/10">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center opacity-80" :style="{ backgroundColor: project.color }">
              <FolderKanban class="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 class="font-serif font-bold text-lg text-slate-800">{{ project.name }}</h3>
              <p class="text-xs text-slate-400">创建于 {{ dayjs(project.created_at).format('YYYY-MM-DD') }}</p>
            </div>
          </div>
          
          <p class="text-sm text-slate-600 line-clamp-2 min-h-[40px]">
            {{ project.description || '暂无描述...' }}
          </p>
        </div>
      </div>
    </main>

    <!-- Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div class="bg-paper rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl relative">
        <h2 class="text-xl font-serif font-bold mb-5 text-slate-800">{{ form.id ? '编辑项目' : '新建项目' }}</h2>
        
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">项目名称</label>
            <input v-model="form.name" type="text" class="w-full p-2.5 bg-white/50 border-2 border-olive-light/30 rounded-xl focus:ring-0 focus:border-olive transition-colors text-slate-700 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">项目描述</label>
            <textarea v-model="form.description" rows="2" class="w-full p-2.5 bg-white/50 border-2 border-olive-light/30 rounded-xl focus:ring-0 focus:border-olive transition-colors text-slate-700 resize-none text-sm"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-2">主题颜色</label>
            <div class="flex flex-wrap gap-2.5">
              <button 
                v-for="color in colors" 
                :key="color"
                @click="form.color = color"
                class="w-7 h-7 rounded-full border-2 transition-all"
                :class="form.color === color ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-110'"
                :style="{ backgroundColor: color }"
              ></button>
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex gap-3">
          <HanddrawnButton variant="outline" class="flex-1 text-sm py-2" @click="isModalOpen = false">取消</HanddrawnButton>
          <HanddrawnButton variant="primary" class="flex-1 text-sm py-2" @click="saveProject">保存</HanddrawnButton>
        </div>
      </div>
    </div>
  </div>
</template>
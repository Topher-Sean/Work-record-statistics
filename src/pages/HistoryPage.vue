<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CalendarDays, Search, Filter, ChevronLeft, ChevronRight, Download, Trash2, Edit } from 'lucide-vue-next';
import Navbar from '../components/layout/Navbar.vue';
import HanddrawnButton from '../components/ui/HanddrawnButton.vue';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../stores/user';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
const currentDate = ref(dayjs());
const selectedDate = ref(dayjs());

const historyRecords = ref<any[]>([]);

onMounted(async () => {
  await loadHistory();
});

const loadHistory = async () => {
  if (userStore.isGuest) return;
  const { data } = await supabase
    .from('work_records')
    .select(`
      id,
      record_date,
      summary,
      ai_generated,
      projects ( name )
    `)
    .eq('user_id', userStore.user?.id)
    .order('record_date', { ascending: false });

  if (data) {
    historyRecords.value = data.map(r => ({
      id: r.id,
      date: r.record_date,
      summary: r.summary,
      projects: r.projects ? [(r.projects as any).name] : [],
      aiGenerated: r.ai_generated
    }));
  }
};

// 日历数据计算
const calendarDays = computed(() => {
  const startOfMonth = currentDate.value.startOf('month');
  const endOfMonth = currentDate.value.endOf('month');
  const startDate = startOfMonth.startOf('week');
  const endDate = endOfMonth.endOf('week');
  
  const days = [];
  let day = startDate;
  
  while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
    days.push({
      date: day,
      isCurrentMonth: day.month() === currentDate.value.month(),
      isToday: day.isSame(dayjs(), 'day'),
      isSelected: day.isSame(selectedDate.value, 'day'),
      hasRecord: historyRecords.value.some(r => r.date === day.format('YYYY-MM-DD'))
    });
    day = day.add(1, 'day');
  }
  
  return days;
});

const prevMonth = () => {
  currentDate.value = currentDate.value.subtract(1, 'month');
};

const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, 'month');
};

const selectDate = (date: dayjs.Dayjs) => {
  selectedDate.value = date;
  if (date.month() !== currentDate.value.month()) {
    currentDate.value = date;
  }
};

const goToWriteRecord = () => {
  // Navigate to dashboard and optionally pass a query parameter for the selected date
  // This requires HomePage to read the query parameter to set its initial date
  router.push({ path: '/dashboard', query: { date: selectedDate.value.format('YYYY-MM-DD') } });
};
</script>

<template>
  <div class="min-h-screen bg-paper flex flex-col transition-all duration-700">
    <Navbar />
    
    <main class="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 animate-[fade-in-up_0.6s_ease-out]">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-serif font-bold text-slate-800 flex items-center gap-3">
            <span class="inline-block w-2 h-8 bg-blue rounded-full"></span>
            历史记录
          </h1>
          <p class="text-slate-500 mt-2">回顾过往的每一步脚印</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div class="relative flex-grow md:flex-grow-0">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索记录内容..." 
              class="pl-9 pr-4 py-2 bg-white/50 border border-olive/30 rounded-xl focus:ring-0 focus:border-olive text-sm w-full md:w-64 transition-colors"
            />
          </div>
          <HanddrawnButton variant="outline" class="!px-3 !py-2 shrink-0">
            <Filter class="w-4 h-4" />
          </HanddrawnButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- 左侧日历组件 -->
        <div class="lg:col-span-4 space-y-6">
          <div class="card-paper p-5 relative overflow-hidden">
            <!-- 纸张纹理背景 -->
            <div class="absolute inset-0 bg-paper-texture opacity-30 mix-blend-multiply pointer-events-none"></div>
            
            <div class="flex justify-between items-center mb-6 relative z-10">
              <button @click="prevMonth" class="p-1 hover:bg-olive-light/20 rounded-lg transition-colors text-slate-600">
                <ChevronLeft class="w-5 h-5" />
              </button>
              <h2 class="text-lg font-serif font-medium text-slate-800">
                {{ currentDate.format('YYYY年 M月') }}
              </h2>
              <button @click="nextMonth" class="p-1 hover:bg-olive-light/20 rounded-lg transition-colors text-slate-600">
                <ChevronRight class="w-5 h-5" />
              </button>
            </div>
            
            <div class="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-slate-400 font-medium relative z-10">
              <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
            </div>
            
            <div class="grid grid-cols-7 gap-1 relative z-10">
              <button
                v-for="(day, index) in calendarDays"
                :key="index"
                @click="selectDate(day.date)"
                class="aspect-square flex items-center justify-center rounded-full text-sm transition-all duration-300 relative group min-h-[40px] min-w-[40px]"
                :class="[
                  !day.isCurrentMonth ? 'text-slate-300' : 'text-slate-700',
                  day.isSelected ? 'bg-rose text-white shadow-md transform scale-110' : 'hover:bg-olive-light/20',
                  day.isToday && !day.isSelected ? 'text-rose font-bold border-2 border-rose-light/50' : ''
                ]"
              >
                <span class="relative z-10">{{ day.date.date() }}</span>
                <!-- 有记录的标记点 -->
                <div v-if="day.hasRecord && !day.isSelected" class="absolute bottom-1 w-1 h-1 bg-olive rounded-full"></div>
                <!-- 选中状态的手绘圆圈装饰 -->
                <div v-if="day.isSelected" class="absolute inset-0 border border-white/50 rounded-full scale-110 -rotate-6"></div>
              </button>
            </div>
          </div>
          
          <div class="card-paper p-5">
            <h3 class="text-sm font-medium text-slate-600 mb-4 flex items-center gap-2">
              <CalendarDays class="w-4 h-4 text-olive" />
              {{ selectedDate.format('YYYY年MM月DD日') }} 概览
            </h3>
            <div class="text-center py-6" v-if="!historyRecords.some(r => r.date === selectedDate.format('YYYY-MM-DD'))">
              <p class="text-sm text-slate-400">这天没有记录工作内容哦~</p>
              <HanddrawnButton variant="outline" size="sm" class="mt-4 mx-auto" @click="goToWriteRecord">补写记录</HanddrawnButton>
            </div>
            <div v-else class="space-y-3">
              <div class="flex justify-between items-center text-sm">
                <span class="text-slate-500">记录项数</span>
                <span class="font-medium text-slate-800">1 项</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-slate-500">关联项目</span>
                <span class="font-medium text-slate-800">1 个</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧记录列表 -->
        <div class="lg:col-span-8 space-y-4">
          <div class="flex justify-between items-center mb-4 px-2">
            <h2 class="text-lg font-serif font-medium text-slate-800">工作记录列表</h2>
            <div class="flex gap-2">
              <button class="text-sm text-slate-500 hover:text-olive transition-colors flex items-center gap-1">
                <Download class="w-4 h-4" /> 导出选中
              </button>
            </div>
          </div>
          
          <div v-for="record in historyRecords" :key="record.id" class="card-paper p-5 group transition-all duration-300 hover:translate-x-1">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <input type="checkbox" class="w-4 h-4 rounded border-olive/30 text-olive focus:ring-olive/50 bg-white/50" />
                <span class="font-medium text-slate-700">{{ record.date }}</span>
                <span v-if="record.aiGenerated" class="px-2 py-0.5 bg-blue-light/20 text-blue-dark text-xs rounded-full border border-blue-light/30 flex items-center gap-1">
                  <Sparkles class="w-3 h-3" /> AI 生成
                </span>
              </div>
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="p-1.5 text-slate-400 hover:text-blue transition-colors rounded-lg hover:bg-blue-light/10">
                  <Edit class="w-4 h-4" />
                </button>
                <button class="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p class="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap font-serif">{{ record.summary }}</p>
            
            <div class="flex gap-2">
              <span v-for="proj in record.projects" :key="proj" class="px-2.5 py-1 bg-paper-warm text-slate-600 text-xs rounded-lg border border-slate-200">
                # {{ proj }}
              </span>
            </div>
          </div>
          
          <div class="flex justify-center mt-8">
            <HanddrawnButton variant="outline" size="sm">加载更多</HanddrawnButton>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
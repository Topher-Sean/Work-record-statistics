<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Calendar, Download, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-vue-next';
import Navbar from '../components/layout/Navbar.vue';
import HanddrawnButton from '../components/ui/HanddrawnButton.vue';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../stores/user';
import dayjs from 'dayjs';

const userStore = useUserStore();
const currentPeriod = ref<'day' | 'month' | 'year'>('month');
const recordType = ref<'all' | 'code' | 'noncode'>('all');

// 统一的日期状态管理
const currentDate = ref(dayjs());
const selectedDate = ref(dayjs());

const filteredRecords = ref<any[]>([]);

const displayedRecords = computed(() => {
  if (recordType.value === 'all') return filteredRecords.value;

  const pickLegacy = (r: any) => {
    const hasNew = (r?.code_summary || r?.noncode_summary);
    return !hasNew && (r?.summary && String(r.summary).trim());
  };

  if (recordType.value === 'code') {
    return filteredRecords.value.filter((r: any) => (r?.code_summary && String(r.code_summary).trim()) || pickLegacy(r));
  }
  return filteredRecords.value.filter((r: any) => (r?.noncode_summary && String(r.noncode_summary).trim()) || pickLegacy(r));
});

// 监听周期和选中的时间变化
watch([currentPeriod, selectedDate], async () => {
  await loadStatistics();
});

onMounted(async () => {
  await loadStatistics();
});

// 加载统计数据
const loadStatistics = async () => {
  if (userStore.isGuest) return;

  const buildQuery = (withTypedSummary: boolean) => {
    const baseSelect = withTypedSummary
      ? `
        id,
        record_date,
        summary,
        code_summary,
        noncode_summary,
        projects ( name )
      `
      : `
        id,
        record_date,
        summary,
        projects ( name )
      `;

    return supabase
      .from('work_records')
      .select(baseSelect)
      .eq('user_id', userStore.user?.id)
      .order('record_date', { ascending: false });
  };

  let query = buildQuery(true);

  if (currentPeriod.value === 'day') {
    query = query.eq('record_date', selectedDate.value.format('YYYY-MM-DD'));
  } else if (currentPeriod.value === 'month') {
    const startDate = selectedDate.value.startOf('month').format('YYYY-MM-DD');
    const endDate = selectedDate.value.endOf('month').format('YYYY-MM-DD');
    query = query.gte('record_date', startDate).lte('record_date', endDate);
  } else if (currentPeriod.value === 'year') {
    const startDate = selectedDate.value.startOf('year').format('YYYY-MM-DD');
    const endDate = selectedDate.value.endOf('year').format('YYYY-MM-DD');
    query = query.gte('record_date', startDate).lte('record_date', endDate);
  }
  
  let records: any[] | null = null;
  const { data, error } = await query;
  if (error) {
    const msg = String((error as any)?.message || '');
    if (msg.includes('code_summary') || msg.includes('noncode_summary')) {
      let retryQuery = buildQuery(false);
      if (currentPeriod.value === 'day') {
        retryQuery = retryQuery.eq('record_date', selectedDate.value.format('YYYY-MM-DD'));
      } else if (currentPeriod.value === 'month') {
        const startDate = selectedDate.value.startOf('month').format('YYYY-MM-DD');
        const endDate = selectedDate.value.endOf('month').format('YYYY-MM-DD');
        retryQuery = retryQuery.gte('record_date', startDate).lte('record_date', endDate);
      } else if (currentPeriod.value === 'year') {
        const startDate = selectedDate.value.startOf('year').format('YYYY-MM-DD');
        const endDate = selectedDate.value.endOf('year').format('YYYY-MM-DD');
        retryQuery = retryQuery.gte('record_date', startDate).lte('record_date', endDate);
      }

      const { data: retryData } = await retryQuery;
      records = retryData as any[] | null;
    } else {
      records = null;
    }
  } else {
    records = data as any[] | null;
  }

  if (records && records.length > 0) {
    filteredRecords.value = records.map(r => ({
      ...r,
      projectsList: r.projects ? [(r.projects as any).name] : []
    }));
  } else {
    filteredRecords.value = [];
  }
};

// ------------------------ 日历视图计算 ------------------------
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
      // 此处假设我们有全局的数据可以用来标点，如果为了性能，可以单独请求当月的统计数据
      // 暂时不显示小圆点，或只依赖已过滤的数据（当前已过滤的数据可能只是选中日期/月/年的）
    });
    day = day.add(1, 'day');
  }
  return days;
});

// 月份视图计算（12个月）
const calendarMonths = computed(() => {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const monthDate = currentDate.value.month(i);
    months.push({
      date: monthDate,
      name: `${i + 1}月`,
      isSelected: currentPeriod.value === 'month' && monthDate.isSame(selectedDate.value, 'month'),
      isCurrentMonth: monthDate.isSame(dayjs(), 'month')
    });
  }
  return months;
});

// 年份视图计算（当前年份前后共12年）
const calendarYears = computed(() => {
  const years = [];
  const startYear = currentDate.value.year() - 5;
  for (let i = 0; i < 12; i++) {
    const yearDate = currentDate.value.year(startYear + i);
    years.push({
      date: yearDate,
      name: `${startYear + i}年`,
      isSelected: currentPeriod.value === 'year' && yearDate.isSame(selectedDate.value, 'year'),
      isCurrentYear: yearDate.isSame(dayjs(), 'year')
    });
  }
  return years;
});

// ------------------------ 交互逻辑 ------------------------
const prevPage = () => {
  if (currentPeriod.value === 'day') {
    currentDate.value = currentDate.value.subtract(1, 'month');
  } else if (currentPeriod.value === 'month') {
    currentDate.value = currentDate.value.subtract(1, 'year');
  } else if (currentPeriod.value === 'year') {
    currentDate.value = currentDate.value.subtract(12, 'year');
  }
};

const nextPage = () => {
  if (currentPeriod.value === 'day') {
    currentDate.value = currentDate.value.add(1, 'month');
  } else if (currentPeriod.value === 'month') {
    currentDate.value = currentDate.value.add(1, 'year');
  } else if (currentPeriod.value === 'year') {
    currentDate.value = currentDate.value.add(12, 'year');
  }
};

const selectItem = (date: dayjs.Dayjs) => {
  selectedDate.value = date;
  if (currentPeriod.value === 'day' && date.month() !== currentDate.value.month()) {
    currentDate.value = date;
  } else if (currentPeriod.value === 'month' && date.year() !== currentDate.value.year()) {
    currentDate.value = date;
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
            <span class="inline-block w-2 h-8 bg-rose rounded-full"></span>
            数据统计
          </h1>
          <p class="text-slate-500 mt-2">量化你的每一分努力</p>
        </div>
        
        <div class="w-full">
          <div class="card-paper p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            <div class="bg-white/50 p-1 rounded-xl border border-olive/20 flex shadow-sm w-full sm:w-auto">
              <button
                v-for="period in ['day', 'month', 'year']"
                :key="period"
                @click="currentPeriod = period as any"
                class="px-6 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex-1 sm:flex-none text-center relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-light/40"
                :class="currentPeriod === period ? 'text-olive-dark' : 'text-slate-400 hover:text-slate-600'"
              >
                <div v-if="currentPeriod === period" class="absolute inset-0 bg-paper-green rounded-lg shadow-sm -z-10"></div>
                <span class="relative z-10">{{ period === 'day' ? '按日' : period === 'month' ? '按月' : '按年' }}</span>
              </button>
            </div>

            <HanddrawnButton variant="outline" size="sm" class="w-full sm:w-auto h-10 gap-2 !px-5 !py-2">
              <Download class="w-4 h-4" />
              <span>导出报告</span>
            </HanddrawnButton>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- 左侧日历组件 -->
        <div class="lg:col-span-4 space-y-6">
          <div class="card-paper p-5 relative overflow-hidden">
            <!-- 纸张纹理背景 -->
            <div class="absolute inset-0 bg-paper-texture opacity-30 mix-blend-multiply pointer-events-none"></div>
            
            <div class="flex justify-between items-center mb-6 relative z-10">
              <button @click="prevPage" class="p-1 hover:bg-olive-light/20 rounded-lg transition-colors text-slate-600">
                <ChevronLeft class="w-5 h-5" />
              </button>
              <h2 class="text-lg font-serif font-medium text-slate-800">
                {{ 
                  currentPeriod === 'day' ? currentDate.format('YYYY年 M月') : 
                  currentPeriod === 'month' ? currentDate.format('YYYY年') : 
                  `${currentDate.year() - 5} - ${currentDate.year() + 6}`
                }}
              </h2>
              <button @click="nextPage" class="p-1 hover:bg-olive-light/20 rounded-lg transition-colors text-slate-600">
                <ChevronRight class="w-5 h-5" />
              </button>
            </div>
            
            <!-- 日视图 -->
            <template v-if="currentPeriod === 'day'">
              <div class="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-slate-400 font-medium relative z-10">
                <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
              </div>
              <div class="grid grid-cols-7 gap-1 relative z-10">
                <button
                  v-for="(day, index) in calendarDays"
                  :key="index"
                  @click="selectItem(day.date)"
                  class="aspect-square flex items-center justify-center rounded-full text-sm transition-all duration-300 relative group min-h-[40px] min-w-[40px]"
                  :class="[
                    !day.isCurrentMonth ? 'text-slate-300' : 'text-slate-700',
                    day.isSelected ? 'bg-rose text-white shadow-md transform scale-110' : 'hover:bg-olive-light/20',
                    day.isToday && !day.isSelected ? 'text-rose font-bold border-2 border-rose-light/50' : ''
                  ]"
                >
                  <span class="relative z-10">{{ day.date.date() }}</span>
                  <div v-if="day.isSelected" class="absolute inset-0 border border-white/50 rounded-full scale-110 -rotate-6"></div>
                </button>
              </div>
            </template>

            <!-- 月视图 -->
            <template v-else-if="currentPeriod === 'month'">
              <div class="grid grid-cols-3 gap-3 relative z-10">
                <button
                  v-for="(month, index) in calendarMonths"
                  :key="index"
                  @click="selectItem(month.date)"
                  class="aspect-[2/1] flex items-center justify-center rounded-xl text-sm transition-all duration-300 relative group"
                  :class="[
                    month.isSelected ? 'bg-rose text-white shadow-md transform scale-105' : 'text-slate-700 hover:bg-olive-light/20',
                    month.isCurrentMonth && !month.isSelected ? 'text-rose font-bold border-2 border-rose-light/50' : ''
                  ]"
                >
                  <span class="relative z-10">{{ month.name }}</span>
                  <div v-if="month.isSelected" class="absolute inset-0 border border-white/50 rounded-xl scale-105 -rotate-2"></div>
                </button>
              </div>
            </template>

            <!-- 年视图 -->
            <template v-else-if="currentPeriod === 'year'">
              <div class="grid grid-cols-3 gap-3 relative z-10">
                <button
                  v-for="(year, index) in calendarYears"
                  :key="index"
                  @click="selectItem(year.date)"
                  class="aspect-[2/1] flex items-center justify-center rounded-xl text-sm transition-all duration-300 relative group"
                  :class="[
                    year.isSelected ? 'bg-rose text-white shadow-md transform scale-105' : 'text-slate-700 hover:bg-olive-light/20',
                    year.isCurrentYear && !year.isSelected ? 'text-rose font-bold border-2 border-rose-light/50' : ''
                  ]"
                >
                  <span class="relative z-10">{{ year.name }}</span>
                  <div v-if="year.isSelected" class="absolute inset-0 border border-white/50 rounded-xl scale-105 -rotate-2"></div>
                </button>
              </div>
            </template>
          </div>

          <div class="card-paper p-5">
            <h3 class="text-sm font-medium text-slate-600 mb-4 flex items-center gap-2">
              <BarChart2 class="w-4 h-4 text-olive" />
              {{ 
                currentPeriod === 'day' ? selectedDate.format('YYYY年MM月DD日') : 
                currentPeriod === 'month' ? selectedDate.format('YYYY年MM月') : 
                selectedDate.format('YYYY年')
              }} 概览
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center text-sm">
                <span class="text-slate-500">记录项数</span>
                <span class="font-medium text-slate-800">{{ displayedRecords.length }} 项</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-slate-500">关联项目</span>
                <span class="font-medium text-slate-800">
                  {{ new Set(displayedRecords.flatMap(r => r.projectsList)).size }} 个
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧记录列表区域 -->
        <div class="lg:col-span-8 space-y-4">
          <div class="flex justify-between items-center mb-4 px-2">
            <h2 class="text-lg font-serif font-medium text-slate-800 flex items-center gap-2">
              <Calendar class="w-5 h-5 text-olive" />
              工作总结列表
            </h2>

            <div class="bg-white/50 p-1 rounded-xl border border-olive/20 flex shadow-sm">
              <button
                v-for="t in ['all', 'code', 'noncode']"
                :key="t"
                @click="recordType = t as any"
                class="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 text-center relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-light/40"
                :class="recordType === t ? 'text-olive-dark' : 'text-slate-400 hover:text-slate-600'"
              >
                <div v-if="recordType === t" class="absolute inset-0 bg-paper-green rounded-lg shadow-sm -z-10"></div>
                <span class="relative z-10">{{ t === 'all' ? '全部' : t === 'code' ? '代码' : '非代码' }}</span>
              </button>
            </div>
          </div>
          
          <div v-if="displayedRecords.length === 0" class="text-center py-12 text-slate-400 bg-white/30 rounded-2xl border border-dashed border-olive-light/50">
            暂无记录，快去写点什么吧~
          </div>
          
          <div v-else class="space-y-4">
            <div v-for="record in displayedRecords" :key="record.id" class="card-paper p-5 group transition-all duration-300 hover:translate-x-1">
              <div class="flex items-center gap-3 mb-3">
                <span class="font-medium text-slate-700">{{ record.record_date }}</span>
                <div class="flex gap-2">
                  <span v-for="proj in record.projectsList" :key="proj" class="px-2.5 py-1 bg-paper-warm text-slate-600 text-xs rounded-lg border border-slate-200">
                    # {{ proj }}
                  </span>
                </div>
              </div>
              <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                {{
                  recordType === 'code'
                    ? (record.code_summary || record.summary || '暂无总结内容')
                    : recordType === 'noncode'
                      ? (record.noncode_summary || record.summary || '暂无总结内容')
                      : (record.summary || record.code_summary || record.noncode_summary || '暂无总结内容')
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 移除原生日期选择器的相关样式，因为现在使用的是日历组件 */
</style>

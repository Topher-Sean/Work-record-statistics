<script setup lang="ts">
import { ref, watch } from 'vue';
import { User, Code2 } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: 'programmer' | 'normal';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'programmer' | 'normal'): void;
}>();

const isProgrammer = ref(props.modelValue === 'programmer');

watch(() => props.modelValue, (newVal) => {
  isProgrammer.value = newVal === 'programmer';
});

const toggleRole = () => {
  const newValue = isProgrammer.value ? 'normal' : 'programmer';
  isProgrammer.value = !isProgrammer.value;
  emit('update:modelValue', newValue);
};
</script>

<template>
  <div class="inline-flex items-center p-1 bg-paper-green/50 rounded-full border border-olive/30 shadow-inner relative overflow-hidden w-64 h-12">
    <!-- 滑动背景 -->
    <div 
      class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-all duration-500 ease-in-out z-0"
      :class="isProgrammer ? 'left-1' : 'left-[calc(50%+3px)]'"
    ></div>
    
    <!-- 代码选项 -->
    <button 
      class="flex-1 flex items-center justify-center gap-2 z-10 transition-colors duration-300 font-medium text-sm"
      :class="isProgrammer ? 'text-olive-dark' : 'text-gray-500 hover:text-gray-700'"
      @click="isProgrammer || toggleRole()"
    >
      <Code2 class="w-4 h-4" />
      代码
    </button>
    
    <!-- 非代码选项 -->
    <button 
      class="flex-1 flex items-center justify-center gap-2 z-10 transition-colors duration-300 font-medium text-sm"
      :class="!isProgrammer ? 'text-rose-dark' : 'text-gray-500 hover:text-gray-700'"
      @click="!isProgrammer || toggleRole()"
    >
      <User class="w-4 h-4" />
      非代码
    </button>
  </div>
</template>
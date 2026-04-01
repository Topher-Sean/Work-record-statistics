<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  block?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const buttonClasses = computed(() => {
  const classes = ['btn-handdrawn'];
  
  // 变体样式
  switch (props.variant) {
    case 'primary':
      classes.push('btn-primary');
      break;
    case 'secondary':
      classes.push('btn-secondary');
      break;
    case 'outline':
      classes.push('btn-outline');
      break;
    default:
      classes.push('btn-primary');
  }
  
  // 尺寸样式
  switch (props.size) {
    case 'sm':
      classes.push('text-sm py-1.5 px-3');
      break;
    case 'lg':
      classes.push('text-lg py-3 px-6');
      break;
    default:
      classes.push('text-base py-2 px-4');
  }
  
  // 块级元素
  if (props.block) {
    classes.push('w-full');
  }
  
  // 禁用状态
  if (props.disabled) {
    classes.push('opacity-50 cursor-not-allowed pointer-events-none');
  }
  
  return classes.join(' ');
});

// 手绘边框抖动效果样式
const borderStyle = computed(() => {
  if (props.variant === 'outline') {
    return {
      borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
      border: '2px solid #B8B89F'
    };
  }
  return {
    borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
  };
});
</script>

<template>
  <button
    :class="buttonClasses"
    :style="borderStyle"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <div class="absolute inset-0 border border-black/5 pointer-events-none" style="border-radius: 15px 225px 15px 255px/255px 15px 225px 15px"></div>
    <slot></slot>
  </button>
</template>

<style scoped>
button {
  transition: all 0.3s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px) rotate(-0.5deg);
}

button:active:not(:disabled) {
  transform: translateY(1px) rotate(0.5deg);
}
</style>
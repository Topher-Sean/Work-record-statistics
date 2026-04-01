<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page" mode="out-in">
      <div :key="route.fullPath" class="w-full h-full">
        <component :is="Component" />
      </div>
    </transition>
  </router-view>
</template>

<style>
/* App 级的全局样式已经在 style.css 中定义，这里保留空以备不时之需 */
</style>
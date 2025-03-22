<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import HeaderComponent from './components/HeaderComponent.vue'
import FooterComponent from './components/FooterComponent.vue'

// 获取当前路由，判断是否为登录相关页面（只有进入首页时，才显示 Header 组件）
const route = useRoute()
const isAuthPage = computed(() => {
  const path = route.path
  return path === '/login' || path === '/register' || path === '/forgot-password'
})
</script>

<template>
  <div class="app-container">
    <HeaderComponent v-if="!isAuthPage" />
    <RouterView class="router-view-container" />
    <FooterComponent />
  </div>
</template>

<style>
:root,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.router-view-container {
  flex: 1;
}
</style>
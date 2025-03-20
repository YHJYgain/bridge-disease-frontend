<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu as IconMenu, Odometer, Picture, List, Plus, User, Operation } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 从localStorage获取用户信息
const userInfo = computed(() => {
  const storedUser = localStorage.getItem('login_user')
  return storedUser ? JSON.parse(storedUser) : null
})

// 判断用户角色
const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
const isDeveloper = computed(() => userInfo.value?.role === 'DEVELOPER')
const isAdminOrDeveloper = computed(() => isAdmin.value || isDeveloper.value)

// 导航菜单项
const menuItems = computed(() => [
  {
    name: '首页',
    path: '/home',
    icon: Odometer,
    visible: true
  },
  {
    name: '病害检测分割',
    path: '/disease-detection',
    icon: IconMenu,
    visible: true
  },
  {
    name: '检测分割记录',
    path: '/detection-records',
    icon: List,
    visible: true
  },
  {
    name: '媒体库',
    path: '/media-library',
    icon: Picture,
    visible: true
  },
  {
    name: '模型库',
    path: '/model-library',
    icon: Plus,
    visible: isDeveloper.value
  },
  {
    name: '用户管理',
    path: '/user-management',
    icon: User,
    visible: isAdminOrDeveloper.value
  },
  {
    name: '系统操作日志',
    path: '/operation-logs',
    icon: Operation,
    visible: isAdminOrDeveloper.value
  }
])

// 当前活动菜单项
const activeMenu = computed(() => route.path)

// 导航到指定路径
const navigateTo = (path) => {
  router.push(path)
}
</script>

<template>
  <div class="sidebar-menu">
    <el-menu :default-active="activeMenu" class="el-menu-vertical" :collapse="false" background-color="#304156"
      text-color="#bfcbd9" active-text-color="#409EFF">
      <el-menu-item v-for="(item, index) in menuItems.filter(item => item.visible)" :key="index" :index="item.path"
        @click="navigateTo(item.path)">
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.name }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped>
.sidebar-menu {
  height: 100%;
  background-color: #304156;
}

.el-menu-vertical {
  border-right: none;
  width: 100%;
}
</style>
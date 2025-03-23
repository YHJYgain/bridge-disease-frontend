<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Picture, List, User, Operation, Fold, Expand, HomeFilled, Aim, Coin } from '@element-plus/icons-vue'
import { isCollapsed, toggleCollapse } from '../stores/sidebarStore'

const router = useRouter()
const route = useRoute()

// 使用全局状态管理的折叠状态
const isCollapse = isCollapsed

// 从 localStorage 获取用户信息
const userInfo = computed(() => {
  const storedUser = localStorage.getItem('login_user')
  return storedUser ? JSON.parse(storedUser) : {}
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
    icon: HomeFilled,
    visible: true
  },
  {
    name: '病害检测分割',
    path: '/disease-detection',
    icon: Aim,
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
    icon: Coin,
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
  <div class="sidebar-menu" :class="{ 'collapsed': isCollapse }">
    <div class="collapse-btn" @click="toggleCollapse">
      <el-icon class="collapse-icon">
        <component :is="isCollapse ? Expand : Fold" />
      </el-icon>
      <span class="collapse-text" :class="{ 'hidden': isCollapse }">收起菜单</span>
    </div>
    <el-menu :default-active="activeMenu" class="el-menu-vertical" :collapse="isCollapse" :collapse-transition="true">
      <el-menu-item v-for="(item, index) in menuItems.filter(item => item.visible)" :key="index" :index="item.path"
        @click="navigateTo(item.path)">
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <template #title>
          <span class="menu-text">{{ item.name }}</span>
        </template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped>
.sidebar-menu {
  height: 100%;
  width: 18vh;
  background: linear-gradient(180deg, #3478c8 0%, #2b7de1 100%);
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border-radius: 0 12px 12px 0;
}

.sidebar-menu.collapsed {
  width: 64px;
}

.el-menu-vertical {
  border-right: none;
  width: 100%;
  flex: 1;
  background-color: transparent !important;
}

.el-menu-vertical :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  color: #e6f0ff;
  margin: 4px 0;
  border-radius: 8px;
  padding: 0 20px !important;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.el-menu-vertical :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.el-menu-vertical :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.collapse-btn {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 20px;
  cursor: pointer;
  color: #c9e0ff;
  transition: color 0.3s ease, background-color 0.3s ease;
  margin: 8px 0;
}

.collapse-icon {
  width: 24px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.collapse-text {
  margin-left: 8px;
  font-size: 14px;
  transition: opacity 0.25s ease 0.05s, transform 0.3s ease;
  white-space: nowrap;
  opacity: 1;
  transform: translateX(0);
}

.collapse-text.hidden {
  opacity: 0;
  transform: translateX(-10px);
}

.menu-text {
  transition: opacity 0.25s ease 0.05s, transform 0.3s ease;
  opacity: 1;
  transform: translateX(0);
  display: inline-block;
}

.el-menu--collapse :deep(.el-menu-item) .menu-text {
  opacity: 0;
  transform: translateX(-10px);
}

.el-menu-vertical :deep(.el-icon) {
  width: 24px;
  text-align: center;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.el-menu--collapse :deep(.el-menu-item) .el-icon {
  margin: 0 auto;
  justify-content: center;
  transform: translateX(0);
  left: 0;
  width: 24px;
  text-align: center;
  display: flex;
  align-items: center;
}

.collapse-btn:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.15);
  border-left: 3px solid rgba(201, 224, 255, 0.7);
}

/* 添加图标样式 */
.el-menu-vertical :deep(.el-menu-item) .el-icon {
  color: #c9e0ff;
  margin-right: 10px;
  transition: all 0.3s ease;
}

.el-menu-vertical :deep(.el-menu-item.is-active) .el-icon {
  color: #ffffff;
  transform: scale(1.05);
}

.el-menu-vertical :deep(.el-menu-item:hover) .el-icon {
  color: #ffffff;
  transform: scale(1.1);
}

.collapse-btn:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.15);
  border-left: 3px solid rgba(201, 224, 255, 0.7);
}
</style>
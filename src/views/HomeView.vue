<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Setting } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const userInfo = ref(null)
const loading = ref(true)

// 获取用户信息
const getUserInfo = async () => {
  try {
    loading.value = true
    // 检查是否有 token
    const token = localStorage.getItem('access_token')
    if (!token) {
      ElMessage.error('【获取用户信息失败】未登录或登录已过期，请重新登录')
      router.push('/login')
      return
    }

    // 请求用户信息
    const data = await request.get('/user/profile')
    console.info('【用户信息】', data)
    const operation = data.operation
    
    if (operation.status === 'SUCCESS') {
      userInfo.value = data.current_user
    }
    // 获取用户信息失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    console.error('【获取用户信息错误】', error)
    ElMessage.error({
      message: '【获取用户信息错误】' + error?.message || '获取用户信息错误，请重试',
      duration: 5000
    })
    router.push('/login')
  } finally {
    loading.value = false
  }
}

// 进入个人中心
const goToUserCenter = () => {
  router.push('/user-center')
}

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  ElMessage.success('退出登录成功')
  router.push('/login')
}

onMounted(() => {
  getUserInfo()
})
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="logo">
        <h1>桥梁病害检测与分割系统</h1>
      </div>
      
      <div class="user-info" v-if="userInfo && !loading">
        <el-dropdown trigger="click">
          <div class="user-avatar-container">
            <el-avatar :size="40" :src="userInfo.avatar_url || ''">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="username">{{ userInfo.username }}</span>
            <i class="el-icon-arrow-down el-icon--right"></i>
          </div>
          
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goToUserCenter">
                <el-icon><Setting /></el-icon>
                <span>个人中心</span>
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <div v-else-if="loading" class="user-info-loading">
        <el-skeleton style="width: 150px" :rows="1" animated />
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <div class="welcome-message" v-if="userInfo">
        <h2>欢迎回来，{{ userInfo.username }}！</h2>
        <p>今天是美好的一天，开始您的桥梁检测工作吧。</p>
      </div>
      
      <!-- 这里可以添加系统的主要功能区域 -->
      <div class="feature-area">
        <h3>系统功能区域</h3>
        <p>这里将展示系统的主要功能模块</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 98.4vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #4a5568;
  font-weight: 500;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.user-avatar-container:hover {
  background: rgba(0, 0, 0, 0.05);
}

.username {
  margin: 0 10px;
  font-weight: 500;
  color: #4a5568;
}

.user-info-loading {
  width: 150px;
}

.main-content {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-message {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease;
}

.welcome-message h2 {
  color: #4a5568;
  margin-top: 0;
}

.welcome-message p {
  color: #718096;
}

.feature-area {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  min-height: 300px;
  animation: fadeIn 0.5s ease;
  animation-delay: 0.2s;
  opacity: 0;
  animation-fill-mode: forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    padding: 15px;
  }
  
  .logo {
    margin-bottom: 10px;
  }
  
  .user-info {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>

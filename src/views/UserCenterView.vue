<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Close, Warning, InfoFilled } from '@element-plus/icons-vue'
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

// 返回首页
const goToHome = () => {
  router.push('/home')
}

// 根据用户状态获取对应的图标和颜色
const statusInfo = computed(() => {
  if (!userInfo.value) return { icon: '', color: '' }
  
  const status = userInfo.value.status
  switch (status) {
    case 'ACTIVE':
      return { icon: Check, color: '#67C23A' } // 绿色
    case 'INACTIVE':
      return { icon: InfoFilled, color: '#909399' } // 灰色
    case 'BANNED':
      return { icon: Close, color: '#F56C6C' } // 红色
    case 'DELETED':
      return { icon: Warning, color: '#E6A23C' } // 黄色
    default:
      return { icon: '', color: '' }
  }
})

// 格式化时间显示
// 格式化时间显示
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '暂无数据'
  // 创建一个 UTC 日期对象，然后使用 toLocaleString 转换为中国时区
  const date = new Date(dateTimeStr)
  // 手动调整时区偏移，中国是 UTC+8，所以需要减去 8 小时
  const adjustedDate = new Date(date.getTime() - 8 * 60 * 60 * 1000)
  return adjustedDate.toLocaleString('zh-CN')
}

onMounted(() => {
  getUserInfo()
})
</script>

<template>
  <div class="user-center-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="logo">
        <h1>个人中心</h1>
      </div>
      <el-button type="primary" @click="goToHome" class="back-btn">返回首页</el-button>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <div v-else-if="userInfo" class="user-profile">
        <div class="profile-header">
          <div class="avatar-container">
            <el-avatar :size="100" :src="userInfo.avatar_url || ''">
              <el-icon :size="40">U</el-icon>
            </el-avatar>
            <!-- 用户状态图标 -->
            <div v-if="statusInfo.icon" class="status-icon" :style="{ backgroundColor: statusInfo.color }">
              <el-icon><component :is="statusInfo.icon" /></el-icon>
            </div>
          </div>
          <h2 class="username">{{ userInfo.username }}</h2>
          <el-tag :type="userInfo.status === 'ACTIVE' ? 'success' : userInfo.status === 'INACTIVE' ? 'info' : userInfo.status === 'BANNED' ? 'danger' : 'warning'">
            {{ userInfo.status === 'ACTIVE' ? '在线' : userInfo.status === 'INACTIVE' ? '离线' : userInfo.status === 'BANNED' ? '封禁' : '已注销' }}
          </el-tag>
        </div>

        <div class="profile-info">
          <el-descriptions title="用户信息" :column="1" border>
            <el-descriptions-item label="用户名">{{ userInfo.username }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
            <el-descriptions-item label="姓氏" v-if="userInfo.last_name">{{ userInfo.last_name }}</el-descriptions-item>
            <el-descriptions-item label="名字" v-if="userInfo.first_name">{{ userInfo.first_name }}</el-descriptions-item>
            <el-descriptions-item label="电话" v-if="userInfo.phone">{{ userInfo.phone }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ userInfo.role === 'ADMIN' ? '管理员' : userInfo.role === 'DEVELOPER' ? '开发者' : '普通用户' }}</el-descriptions-item>
            <el-descriptions-item label="最后登录时间" v-if="userInfo.last_login">{{ formatDateTime(userInfo.last_login) }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ formatDateTime(userInfo.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(userInfo.updated_at) }}</el-descriptions-item>
            <el-descriptions-item label="注销时间" v-if="userInfo.status === 'deleted' && userInfo.deleted_at">{{ formatDateTime(userInfo.deleted_at) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 更多用户相关功能 -->
        <div class="user-actions">
          <h3>账户操作</h3>
          <div class="action-buttons">
            <el-button type="primary">修改个人信息</el-button>
            <el-button type="warning">修改密码</el-button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.user-center-container {
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

.back-btn {
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  border: none;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(96, 165, 250, 0.4);
}

.main-content {
  padding: 30px;
  max-width: 800px;
  margin: 0 auto;
}

.loading-container {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.user-profile {
  animation: fadeIn 0.5s ease;
}

.profile-header {
  background: white;
  border-radius: 10px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-container {
  margin-bottom: 15px;
  position: relative;
}

.status-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
}

.username {
  margin: 10px 0 5px;
  color: #4a5568;
  font-size: 1.8rem;
}

.profile-info {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.user-actions {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.user-actions h3 {
  margin-top: 0;
  color: #4a5568;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
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
    gap: 10px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
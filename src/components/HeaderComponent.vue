<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Setting, SwitchButton } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useUserStore } from '../stores/userStore'

const requestBaseURL = request.defaults.baseURL
const router = useRouter()
const { userInfo, loading } = useUserStore()

// 进入个人中心
const goToUserCenter = () => {
  router.push('/user-center')
}

// 退出登录
const handleLogout = async () => {
  try {
    // 发送登出请求
    const data = await request.post('/user/logout')
    console.info('【登出响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断登出是否成功
    if (operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【登出成功】',
        duration: 3000
      })
    }
    // 登出失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    console.warning('【登出警告】', error)
    ElMessage.warning({
      message: '【登出警告】登出可能未完全成功，但您已在本地退出',
      duration: 4000
    })
  } finally {
    // 无论后端请求成功与否，都清除本地 token 并跳转到登录页
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('login_user')
    router.push('/login')
  }
}
</script>

<template>
  <div class="header">
    <div class="logo">
      <img src="/bridge-disease.svg" alt="系统图标" class="logo-icon" />
      <h1>桥梁病害检测与分割系统</h1>
    </div>

    <div class="user-info" v-if="userInfo && !loading">
      <el-dropdown trigger="click">
        <div class="user-avatar-container">
          <el-avatar :size="40" :src="userInfo.avatar_path ? `${requestBaseURL}/${userInfo.avatar_path}` : ''">
            <el-icon>
              <User />
            </el-icon>
          </el-avatar>
          <span class="username">{{ userInfo.username }}</span>
          <i class="el-icon-arrow-down el-icon--right"></i>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goToUserCenter">
              <el-icon>
                <Setting />
              </el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-icon>
                <SwitchButton />
              </el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div v-else-if="loading" class="user-info-loading">
      <el-skeleton style="width: 150px" :rows="1" animated />
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 55px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  z-index: 10;
  border-radius: 0 0 12px 12px;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  width: 45px;
  height: 45px;
  margin-right: 10px;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(90deg, #3478c8, #2c78d4);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 24px;
  transition: all 0.3s ease;
  background: rgba(52, 120, 200, 0.05);
}

.user-avatar-container:hover {
  background: rgba(52, 120, 200, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  color: #ffffff;
}

.username {
  margin: 0 10px;
  font-weight: 500;
  color: #3478c8;
}

.user-info-loading {
  width: 150px;
}
</style>
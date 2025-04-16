<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Phone, ChatLineRound, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ParticleBackground from '../components/ParticleBackground.vue'
import request from '../utils/request'

const router = useRouter()
const adminInfo = ref(null)
const loading = ref(false)

// 获取管理员信息
const getAdminInfo = async () => {
  try {
    loading.value = true

    const data = await request.get('/user/admin_info')
    console.info('【随机获取管理员信息响应数据】', data)
    
    if (data && data.admin_info) {
      adminInfo.value = data.admin_info
    }
  } catch (error) {
    console.error('【随机获取管理员信息错误】', error)
    ElMessage.error({
      message: '【随机获取管理员信息错误】' + (error?.message || '请稍后重试'),
      duration: 5000,
    })
  } finally {
    loading.value = false
  }
}

// 返回登录页面
const goToLogin = () => {
  router.push('/')
}

// 组件挂载时获取管理员信息
onMounted(() => {
  getAdminInfo()
})
</script>

<template>
  <div class="forgot-password-container">
    <ParticleBackground />

    <div class="forgot-password-card">
      <h1>忘记密码</h1>
      <div class="contact-info">
        <div class="info-icon">
          <el-icon size="60">
            <ChatLineRound />
          </el-icon>
        </div>
        <p class="info-title">请联系管理员重置密码</p>
        <p class="info-desc">如需重置密码，请通过以下方式联系系统管理员：</p>
        
        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading" size="24">
            <Loading />
          </el-icon>
          <span>正在加载管理员信息...</span>
        </div>
        
        <div v-else-if="!adminInfo" class="no-admin-info">
          <p>暂无可用的管理员联系信息，请稍后再试</p>
        </div>
        
        <div v-else class="admin-contact-group">
          <div class="admin-title">{{ adminInfo.role === 'ADMIN' ? '管理员' : '开发人员' }}: {{ adminInfo.last_name }}{{ adminInfo.first_name }}</div>
          
          <div v-if="adminInfo.email" class="contact-item">
            <el-icon>
              <Message />
            </el-icon>
            <span>邮箱：{{ adminInfo.email }}</span>
          </div>
          
          <div v-if="adminInfo.phone" class="contact-item">
            <el-icon>
              <Phone />
            </el-icon>
            <span>联系电话：{{ adminInfo.phone }}</span>
          </div>
        </div>

        <p class="contact-note">联系时请提供您的用户名/注册邮箱，以便管理员核实您的身份</p>

        <el-button type="primary" class="back-btn" @click="goToLogin">返回登录</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.particles-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.forgot-password-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  width: 100%;
  max-width: 470px;
  box-sizing: border-box;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transform: translateY(20px);
  opacity: 0;
  animation: slideUp 0.6s ease forwards;
  position: relative;
  z-index: 1;
}

@keyframes slideUp {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

h1 {
  color: white;
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.5em;
  font-weight: 300;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .forgot-password-card {
    margin: 20px;
    padding: 30px;
  }
}

.contact-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: white;
  animation: fadeIn 0.5s ease forwards;
}

.info-icon {
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.9);
}

.info-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 15px;
}

.info-desc {
  font-size: 14px;
  margin-bottom: 25px;
  color: rgba(255, 255, 255, 0.8);
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 20px;
  border-radius: 8px;
  width: 90%;
  transition: all 0.3s ease;
}

.contact-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.contact-item .el-icon {
  margin-right: 10px;
  color: rgba(255, 255, 255, 0.8);
}

.contact-note {
  font-size: 13px;
  margin: 10px 0 25px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.back-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  background-size: 200% 100%;
  border: none;
  font-size: 16px;
  transition: all 0.3s ease;
  margin-top: 10px;
  height: 38px;
  position: relative;
  overflow: hidden;
}

.back-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(96, 165, 250, 0.4);
  background-position: 100% 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  color: rgba(255, 255, 255, 0.8);
}

.loading-container .el-icon {
  margin-bottom: 10px;
  font-size: 24px;
}

.no-admin-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
  width: 90%;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.admin-contact-group {
  width: 90%;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-title {
  font-weight: 500;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  text-align: left;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
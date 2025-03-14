<script setup>
import { useRouter } from 'vue-router'
import { Message, Phone, ChatLineRound } from '@element-plus/icons-vue'
import ParticleBackground from '../components/ParticleBackground.vue'

const router = useRouter()

// 返回登录页面
const goToLogin = () => {
  router.push('/')
}
</script>

<template>
  <div class="forgot-password-container">
    <ParticleBackground />

    <div class="forgot-password-card">
      <h1>找回密码</h1>
      <div class="contact-info">
        <div class="info-icon">
          <el-icon size="60"><ChatLineRound /></el-icon>
        </div>
        <p class="info-title">请联系管理员重置密码</p>
        <p class="info-desc">如需重置密码，请通过以下方式联系系统管理员：</p>
        
        <div class="contact-item">
          <el-icon><Message /></el-icon>
          <span>邮箱：1583952973@qq.com</span>
        </div>
        
        <div class="contact-item">
          <el-icon><Phone /></el-icon>
          <span>联系电话：13871941390</span>
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
</style>
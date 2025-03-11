<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Message } from '@element-plus/icons-vue'
import request from '../utils/request'
import ParticleBackground from '../components/ParticleBackground.vue'
import FooterComponent from '../components/FooterComponent.vue'

const router = useRouter()
const email = ref('')
const isLoading = ref(false)
const resetSent = ref(false)

const formRef = ref(null) // 用于访问表单实例
// 邮箱验证规则
const validateEmail = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入邮箱地址'))
    return
  }
  const emailRegex = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
  if (!emailRegex.test(value)) {
    callback(new Error('请输入正确的邮箱格式'))
  } else {
    callback()
  }
}
// 表单验证规则
const formRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { validator: validateEmail, trigger: ['blur', 'change'] },
  ]
}

// 返回登录页面
const goToLogin = () => {
  router.push('/')
}

// 发送重置密码邮件
const handleResetPassword = async () => {
  if (!formRef.value) {
    ElMessage.error('表单验证失败')
    return
  }

  try {
    await formRef.value.validate()
    isLoading.value = true

    const formData = new FormData()
    formData.append('email', email.value)

    // 这里应该调用后端的重置密码API
    // const data = await request.post('/user/reset-password', formData)

    // 模拟API调用成功
    setTimeout(() => {
      resetSent.value = true
      ElMessage.success({
        message: '重置密码邮件已发送，请查收邮箱',
        duration: 3000
      })
    }, 1500)
  } catch (error) {
    console.error('【重置密码错误】', error)
    ElMessage.error({
      message: error?.message || '发送重置邮件错误，请重试',
      duration: 5000
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="forgot-password-container">
    <ParticleBackground />

    <div class="forgot-password-card">
      <h1>找回密码</h1>
      <div v-if="!resetSent">
        <el-form ref="formRef" :model="{ email }" :rules="formRules" class="forgot-password-form" status-icon
          @submit.prevent="handleResetPassword">
          <el-form-item prop="email">
            <el-input v-model="email" placeholder="请输入注册邮箱" :prefix-icon="Message" />
          </el-form-item>

          <el-button type="primary" :loading="isLoading" class="submit-btn" @click="handleResetPassword">
            {{ isLoading ? '发送中...' : '发送重置邮件' }}
          </el-button>

          <div class="form-footer">
            <el-button link type="primary" @click="goToLogin" class="text-btn">返回登录</el-button>
          </div>
        </el-form>
      </div>
      <div v-else class="success-message">
        <el-icon class="success-icon"><i class="el-icon-check"></i></el-icon>
        <p>重置密码邮件已发送至您的邮箱</p>
        <p class="sub-text">请查收邮件并按照指引重置密码</p>
        <el-button type="primary" class="back-btn" @click="goToLogin">返回登录</el-button>
      </div>
    </div>

    <!-- 页脚版权信息 -->
    <FooterComponent />
  </div>
</template>

<style scoped>
.forgot-password-container {
  min-height: 98.4vh;
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

.forgot-password-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

:deep(.el-input) {
  --el-input-bg-color: rgba(255, 255, 255, 0.07);
  --el-input-border-color: transparent;
  --el-input-hover-border-color: transparent;
  --el-input-focus-border-color: transparent;
  --el-input-text-color: white;
  --el-input-placeholder-color: rgba(255, 255, 255, 0.5);
  position: relative;
}

:deep(.el-input__wrapper) {
  box-shadow: none !important;
  transition: all 0.3s ease;
  position: relative;
  padding: 4px 11px;
}

:deep(.el-input) input {
  height: 40px;
  font-size: 15px;
}

:deep(.el-input__wrapper::after) {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 0;
  height: 1.7px;
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

:deep(.el-input__wrapper:focus-within::after) {
  width: 100%;
  left: 0;
  transform: translateX(0);
}

:deep(.el-input__wrapper:hover) {
  --el-input-bg-color: rgba(255, 255, 255, 0.1);
}

:deep(.el-input__prefix-icon) {
  color: rgba(255, 255, 255, 0.7);
}

:deep(.el-form-item__error) {
  color: var(--el-color-danger);
  font-size: 12px;
  margin-top: 4px;
}

.submit-btn {
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

.submit-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(96, 165, 250, 0.4);
  background-position: 100% 0;
}

.submit-btn:focus,
.submit-btn:hover {
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  background-size: 200% 100%;
  border: none;
}

.submit-btn::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70%);
  transform: scale(0);
  transition: transform 0.5s ease-out;
  pointer-events: none;
}

.submit-btn:hover::after {
  transform: scale(1);
}

.submit-btn:focus,
.submit-btn:hover {
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  border: none;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
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

:deep(.el-form-item) {
  animation: fadeIn 0.3s ease forwards;
}

:deep(.el-form-item:nth-child(1)) {
  animation-delay: 0.1s;
}

:deep(.el-form-item:nth-child(2)) {
  animation-delay: 0.2s;
}

.submit-btn {
  animation: fadeIn 0.3s ease forwards;
  animation-delay: 0.3s;
  opacity: 0;
}

@media (max-width: 480px) {
  .forgot-password-card {
    margin: 20px;
    padding: 30px;
  }
}

.form-footer {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.text-btn {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  transition: all 0.3s ease;
}

.text-btn:hover {
  color: white;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}
</style>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import request from '../utils/request'
import ParticleBackground from '../components/ParticleBackground.vue'

const router = useRouter()
const username_or_email = ref('')
const password = ref('')
const isLogining = ref(false)
const formRef = ref(null)

// 用户名/邮箱验证规则
const validateEmail = (rule, value, callback) => {
  const emailRegex = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
  if (value.includes('@') && !emailRegex.test(value)) {
    callback(new Error('请输入正确的邮箱格式'))
  } else {
    callback()
  }
}

// 表单验证规则
const formRules = {
  username_or_email: [
    { required: true, message: '请输入用户名或邮箱', trigger: ['blur', 'change'] },
    { validator: validateEmail, trigger: ['blur', 'change'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'change'] }
  ]
}

// 登录方法
const handleLogin = async () => {
  if (!formRef.value) {
    ElMessage.error({
      message: '【登录错误】表单实例不存在',
      duration: 5000
    })
    return
  }

  try {
    await formRef.value.validate()
    isLogining.value = true

    const formData = new FormData()
    formData.append('username_or_email', username_or_email.value)
    formData.append('password', password.value)

    // 打印登录表单数据，过滤敏感信息
    const safeFormData = {
      username_or_email: username_or_email.value,
      has_password: password.value ? '已设置' : '未设置'
    }
    console.info('【登录表单数据】', safeFormData)

    // 发送登录请求
    const data = await request.post('/user/login', formData)
    console.info('【登录响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断登录是否成功
    if (data && operation && operation.status === 'SUCCESS') {
      // 保存信息到 localStorage
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.setItem('login_user', JSON.stringify(data.login_user))
      console.info('【登录用户】', data.login_user)

      ElMessage.success({
        message: '【登录成功】',
        duration: 3000
      })

      // 登录成功后跳转到首页
      router.push('/home')
    }
    // 登录失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    console.error('【登录错误】', error)
    ElMessage.error({
      message: '【登录错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    isLogining.value = false
  }
}

// 在页面加载时检查用户是否已登录
onMounted(() => {
  // 检查是否有 token
  const token = localStorage.getItem('access_token')
  if (token) {
    ElMessage.success({
      message: '【登录成功】您已登录，正在跳转到首页...',
      duration: 3000
    })
    router.push('/home')
  }
})
</script>

<template>
  <div class="login-container">
    <ParticleBackground />

    <div class="login-card">
      <h1>桥梁病害检测与分割系统</h1>
      <el-form ref="formRef" :model="{ username_or_email, password }" :rules="formRules" class="login-form" status-icon
        @submit.prevent="handleLogin" @keyup.enter="handleLogin">
        <el-form-item prop="username_or_email">
          <el-input v-model="username_or_email" placeholder="用户名或邮箱" :prefix-icon="User" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>

        <el-button type="primary" :loading="isLogining" class="submit-btn" @click="handleLogin">
          {{ isLogining ? '登录中...' : '登录' }}
        </el-button>

        <div class="form-footer">
          <el-button link type="primary" @click="router.push('/register')" class="text-btn">注册账号</el-button>
          <el-button link type="primary" @click="router.push('/forgot-password')" class="text-btn">找回密码/管理员联系方式</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
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

.login-card {
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
  font-size: 2em;
  font-weight: 300;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 7px;
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
}

@media (max-width: 480px) {
  .login-card {
    margin: 20px;
    padding: 30px;
  }
}

.form-footer {
  display: flex;
  justify-content: space-between;
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
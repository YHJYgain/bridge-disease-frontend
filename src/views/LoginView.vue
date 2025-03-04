<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const username_or_email = ref('')
const password = ref('')
const isLoading = ref(false)
const canvasRef = ref(null)

let particles = []
let mouse = { x: 0, y: 0 }
let animationFrameId = null

class Particle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 1.1
    this.vy = (Math.random() - 0.5) * 1.1
    this.radius = Math.random() * 1.5 + 0.5
  }

  update(width, height) {
    this.x += this.vx
    this.y += this.vy

    if (this.x < 0 || this.x > width) this.vx = -this.vx
    if (this.y < 0 || this.y > height) this.vy = -this.vy
  }
}

const initCanvas = () => {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1

  const updateCanvasSize = () => {
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
  }

  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)

  // 初始化粒子
  particles = Array(125).fill().map(() => {
    return new Particle(
      Math.random() * window.innerWidth,
      Math.random() * window.innerHeight
    )
  })

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 更新和绘制粒子
    particles.forEach(particle => {
      particle.update(window.innerWidth, window.innerHeight)

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.fill()

      // 绘制粒子之间的连线
      particles.forEach(otherParticle => {
        const dx = particle.x - otherParticle.x
        const dy = particle.y - otherParticle.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 120) {
          ctx.beginPath()
          ctx.moveTo(particle.x, particle.y)
          ctx.lineTo(otherParticle.x, otherParticle.y)
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 - distance / 500})`
          ctx.stroke()
        }
      })

      // 绘制与鼠标的连线
      const dx = particle.x - mouse.x
      const dy = particle.y - mouse.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 120) {
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        ctx.lineTo(mouse.x, mouse.y)
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 - distance / 500})`
        ctx.stroke()
      }
    })

    animationFrameId = requestAnimationFrame(animate)
  }

  animate()

  return () => {
    window.removeEventListener('resize', updateCanvasSize)
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
  }
}

const handleMouseMove = (event) => {
  mouse.x = event.clientX
  mouse.y = event.clientY
}

onMounted(() => {
  const cleanup = initCanvas()
  window.addEventListener('mousemove', handleMouseMove)

  onUnmounted(() => {
    cleanup()
    window.removeEventListener('mousemove', handleMouseMove)
  })
})

const formRef = ref(null) // 用于访问表单实例
// 邮箱验证规则
const validateEmail = (rule, value, callback) => {
  if (!value) {
    callback()
    return
  }
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
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { validator: validateEmail, trigger: ['blur', 'change'] },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 登录方法
const handleLogin = async () => {
  if (!formRef.value) {
    ElMessage.error('表单验证失败')
    return
  }

  try {
    await formRef.value.validate()
    isLoading.value = true

    const formData = new FormData()
    formData.append('username_or_email', username_or_email.value)
    formData.append('password', password.value)

    const data = await request.post('/user/login', formData)
    console.info('登录响应数据：', data)
    const operation = data.operation
    console.info('登录操作记录：', operation)

    // 根据后端操作状态判断登录是否成功
    if (operation.status === 'SUCCESS') {
      // 保存 token 到 localStorage
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)

      // 显示登录成功信息，包含操作详情
      ElMessage.success({
        message: `【登录成功】\n耗时：${operation.duration.toFixed(3)}秒\n设备：${operation.device_info}`,
        duration: 3000
      })

      router.push('/home')
    }
    // 登录失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    console.error('【登录错误】', error)
    ElMessage.error({
      message: error?.message || '登录错误，请重试',
      duration: 5000
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <canvas ref="canvasRef" class="particles-canvas"></canvas>

    <div class="login-card">
      <h1>桥梁病害检测分割系统</h1>
      <el-form ref="formRef" :model="{ username_or_email, password }" :rules="formRules" class="login-form" status-icon
        @submit.prevent="handleLogin">
        <el-form-item prop="username_or_email">
          <el-input v-model="username_or_email" placeholder="用户名或邮箱" :prefix-icon="User" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>

        <el-button type="primary" :loading="isLoading" class="submit-btn" @click="handleLogin">
          {{ isLoading ? '登录中...' : '登录' }}
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
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
  .login-card {
    margin: 20px;
    padding: 30px;
  }
}
</style>
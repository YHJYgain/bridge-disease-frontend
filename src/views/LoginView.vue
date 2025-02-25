<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
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
  particles = Array(130).fill().map(() => {
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
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 - distance/500})`
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
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 - distance/500})`
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

const handleLogin = async () => {
  if (!username.value || !password.value) return
  
  isLoading.value = true
  // 模拟登录请求
  setTimeout(() => {
    isLoading.value = false
    router.push('/')
  }, 1500)
}
</script>

<template>
  <div class="login-container">
    <canvas ref="canvasRef" class="particles-canvas"></canvas>
    
    <div class="login-card">
      <h1>登录</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input
            v-model="username"
            type="text"
            placeholder="用户名"
            required
          >
          <div class="input-focus-effect"></div>
        </div>
        
        <div class="form-group">
          <input
            v-model="password"
            type="password"
            placeholder="密码"
            required
          >
          <div class="input-focus-effect"></div>
        </div>

        <button
          type="submit"
          :class="{ 'loading': isLoading }"
        >
          <span>{{ isLoading ? '登录中...' : '登录' }}</span>
          <div class="button-effect"></div>
        </button>
      </form>
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
  max-width: 400px;
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
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.form-group {
  position: relative;
  width: 100%;
}

input {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.07);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.1);
}

.input-focus-effect {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

input:focus + .input-focus-effect {
  width: 100%;
}

button {
  position: relative;
  padding: 12px;
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.button-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.5s ease;
}

button:hover .button-effect {
  width: 200%;
  height: 200%;
}

.loading {
  opacity: 0.8;
  cursor: wait;
}

@media (max-width: 480px) {
  .login-card {
    margin: 20px;
    padding: 30px;
  }
}
</style>
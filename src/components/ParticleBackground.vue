<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  particleCount: {
    type: Number,
    default: 180
  }
})

const canvasRef = ref(null)

let particles = []
let mouse = { x: 0, y: 0 }
let animationFrameId = null

class Particle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 1.0
    this.vy = (Math.random() - 0.5) * 1.0
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
  
  // 初始化或重新初始化粒子
  const initParticles = () => {
    particles = Array(props.particleCount).fill().map(() => {
      return new Particle(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight
      )
    })
  }

  updateCanvasSize()
  initParticles()
  
  // 监听窗口大小变化，更新画布尺寸并重新初始化粒子
  window.addEventListener('resize', () => {
    updateCanvasSize()
    initParticles()
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
</script>

<template>
  <canvas ref="canvasRef" class="particles-canvas"></canvas>
</template>

<style scoped>
.particles-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
</style>
<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Phone, Avatar } from '@element-plus/icons-vue'
import request from '../utils/request'
import ParticleBackground from '../components/ParticleBackground.vue'

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const first_name = ref('')
const last_name = ref('')
const avatar_file = ref(null)
const phone = ref('')
const isRegistering = ref(false)
const registerSuccess = ref(false)
const formRef = ref(null)

// 创建头像预览 URL 的计算属性
const avatarPreviewUrl = computed(() => {
  if (avatar_file.value) {
    return URL.createObjectURL(avatar_file.value)
  }
  return ''
})

// 邮箱验证规则
const validateEmail = (rule, value, callback) => {
  const emailRegex = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
  if (!emailRegex.test(value)) {
    callback(new Error('请输入正确的邮箱格式'))
  } else {
    callback()
  }
}

// 确认密码验证规则
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== password.value) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 姓氏验证规则
const validateFirstName = (rule, value, callback) => {
  if (!value) {
    callback() // 姓氏可以为空
    return
  }
  callback()
}

// 名字验证规则
const validateLastName = (rule, value, callback) => {
  if (!value) {
    callback() // 名字可以为空
    return
  }
  callback()
}

// 头像文件验证规则
const validateAvatar = (rule, value, callback) => {
  if (!value) {
    callback() // 头像可以为空
    return
  }
  callback()
}

// 头像上传处理函数
const handleAvatarChange = (file) => {
  // 检查文件类型
  const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg']
  if (!allowedTypes.includes(file.raw.type)) {
    ElMessage.error('请上传 JPG/PNG/JEPG 格式的图片')
    return false
  }

  // 检查文件大小（限制为 5MB）
  const isLt5M = file.raw.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  // 验证通过，更新头像文件
  avatar_file.value = file.raw
  return false // 阻止自动上传
}

// 手机号验证规则
const validatePhone = (rule, value, callback) => {
  if (!value) {
    callback() // 手机号可以为空
    return
  }
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(value)) {
    callback(new Error('请输入正确的手机号格式'))
  } else {
    callback()
  }
}

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { validator: validateEmail, trigger: ['blur', 'change'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: ['blur', 'change'] },
  ],
  first_name: [
    { validator: validateFirstName, trigger: ['blur', 'change'] },
  ],
  last_name: [
    { validator: validateLastName, trigger: ['blur', 'change'] },
  ],
  avatar_file: [
    { validator: validateAvatar, trigger: ['blur', 'change'] },
  ],
  phone: [
    { validator: validatePhone, trigger: ['blur', 'change'] },
  ]
}

// 返回登录页面
const goToLogin = () => {
  router.push('/')
}

// 注册方法
const handleRegister = async () => {
  if (!formRef.value) {
    ElMessage.error('【注册错误】表单实例不存在')
    return
  }

  try {
    await formRef.value.validate()
    isRegistering.value = true

    const formData = new FormData()
    formData.append('username', username.value)
    formData.append('email', email.value)
    formData.append('password', password.value)
    // 只有当这些选填字段有值时才添加到表单数据中
    if (first_name.value) {
      formData.append('first_name', first_name.value)
    }
    if (last_name.value) {
      formData.append('last_name', last_name.value)
    }
    if (avatar_file.value) {
      formData.append('avatar_file', avatar_file.value)
    }
    if (phone.value) {
      formData.append('phone', phone.value)
    }

    // 打印注册表单数据，过滤敏感信息
    const safeFormData = {
      username: username.value,
      email: email.value,
      has_password: password.value ? '已设置' : '未设置',
      has_first_name: first_name.value ? '已设置' : '未设置',
      has_last_name: last_name.value ? '已设置' : '未设置',
      has_avatar: avatar_file.value ? '已设置' : '未设置',
      has_phone: phone.value ? '已设置' : '未设置'
    }
    console.info('【注册表单数据】', safeFormData)

    // 发送注册请求
    const data = await request.post('/user/register', formData)
    console.info('【注册响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断注册是否成功
    if (operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【注册成功】',
        duration: 3000
      })

      // 注册成功后自动跳转到登录页面
      router.push('/login')
    }
    // 注册失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    console.error('【注册错误】', error)
    ElMessage.error({
      message: '【注册错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    isRegistering.value = false
  }
}
</script>

<template>
  <div class="register-container">
    <ParticleBackground />

    <div class="register-card">
      <h1>注册账号</h1>
      <div v-if="!registerSuccess">
        <el-form ref="formRef"
          :model="{ username, email, password, confirmPassword, first_name, last_name, phone, avatar_file }"
          :rules="formRules" class="register-form" status-icon @submit.prevent="handleRegister">
          <el-form-item prop="avatar_file" class="avatar-upload">
            <p class="upload-label">头像上传（可选）</p>
            <el-upload class="avatar-uploader" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
              accept="image/png, image/jpg, image/jpeg" :on-change="handleAvatarChange" :auto-upload="false" :show-file-list="false">
              <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" class="avatar-preview" />
              <div v-else class="avatar-placeholder">
                <el-icon class="avatar-icon">
                  <Avatar />
                </el-icon>
                <span>点击上传</span>
              </div>
            </el-upload>
          </el-form-item>

          <el-form-item prop="username">
            <el-input v-model="username" placeholder="用户名" :prefix-icon="User" />
          </el-form-item>

          <el-form-item prop="email">
            <el-input v-model="email" placeholder="邮箱" :prefix-icon="Message" />
          </el-form-item>

          <el-form-item prop="password">
            <el-input v-model="password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input v-model="confirmPassword" type="password" placeholder="确认密码" :prefix-icon="Lock" show-password />
          </el-form-item>

          <div class="name-group">
            <el-form-item prop="first_name" class="name-item">
              <el-input v-model="first_name" placeholder="姓氏（可选）" :prefix-icon="User" />
            </el-form-item>

            <el-form-item prop="last_name" class="name-item">
              <el-input v-model="last_name" placeholder="名字（可选）" :prefix-icon="User" />
            </el-form-item>
          </div>

          <el-form-item prop="phone">
            <el-input v-model="phone" placeholder="手机号（可选）" :prefix-icon="Phone" />
          </el-form-item>

          <el-button type="primary" :loading="isRegistering" class="submit-btn" @click="handleRegister">
            {{ isRegistering ? '注册中...' : '注册' }}
          </el-button>

          <div class="form-footer">
            <el-button link type="primary" @click="goToLogin" class="text-btn">已有账号？返回登录</el-button>
          </div>
        </el-form>
      </div>
      <div v-else class="success-message">
        <el-icon class="success-icon"><i class="el-icon-check"></i></el-icon>
        <p>注册成功！</p>
        <p class="sub-text">您可以立即登录使用</p>
        <el-button type="primary" class="back-btn" @click="goToLogin">前往登录</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
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

.register-card {
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

.register-form {
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

:deep(.el-form-item:nth-child(3)) {
  animation-delay: 0.3s;
}

:deep(.el-form-item:nth-child(4)) {
  animation-delay: 0.4s;
}

:deep(.el-form-item:nth-child(5)) {
  animation-delay: 0.5s;
}

:deep(.el-form-item:nth-child(6)) {
  animation-delay: 0.6s;
}

:deep(.el-form-item:nth-child(7)) {
  animation-delay: 0.7s;
}

:deep(.el-form-item:nth-child(8)) {
  animation-delay: 0.8s;
}

.submit-btn {
  animation: fadeIn 0.3s ease forwards;
  animation-delay: 0.9s;
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

.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 20px 0;
}

.success-icon {
  font-size: 48px;
  color: #67c23a;
  margin-bottom: 20px;
}

.success-message p {
  margin: 5px 0;
  font-size: 18px;
}

.sub-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px !important;
}

.back-btn {
  margin-top: 20px;
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  border: none;
  padding: 10px 25px;
}

.name-group {
  display: flex;
  gap: 10px;
  width: 100%;
}

.name-item {
  flex: 1;
}

.avatar-upload {
  margin-top: 10px;
}

.upload-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 8px;
}

.avatar-uploader {
  width: 100%;
  display: flex;
  justify-content: center;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px dashed rgba(255, 255, 255, 0.3);
}

.avatar-placeholder:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.avatar-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

@media (max-width: 480px) {
  .register-card {
    margin: 20px;
    padding: 30px;
  }

  .footer {
    padding: 10px 0;
    font-size: 12px;
  }

  .name-group {
    flex-direction: column;
    gap: 0;
  }
}
</style>
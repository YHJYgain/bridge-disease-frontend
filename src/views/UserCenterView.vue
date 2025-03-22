<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Close, Warning, InfoFilled, User, Lock, Delete, Plus, ArrowLeft } from '@element-plus/icons-vue'
import request from '../utils/request'

const requestBaseURL = request.defaults.baseURL
const router = useRouter()
const userInfo = ref(null)
const loading = ref(false)
const updateFormRef = ref(null)
const passwordFormRef = ref(null)

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

    // 从 localStorage 中获取用户信息
    const storedUser = localStorage.getItem('login_user')
    userInfo.value = JSON.parse(storedUser);

    // 初始化修改个人信息表单
    updateForm.value = {
      username: userInfo.value.username,
      email: userInfo.value.email,
      first_name: userInfo.value.first_name || '',
      last_name: userInfo.value.last_name || '',
      phone: userInfo.value.phone || '',
      avatar_file: null
    }
  } catch (error) {
    console.error('【获取用户信息错误】', error)
    ElMessage.error({
      message: '【获取用户信息错误】' + error?.message || '请重试',
      duration: 5000
    })
    router.push('/login')
  } finally {
    loading.value = false
  }
}

// 对话框显示状态
const dialogVisible = reactive({
  updateProfile: false,
  changePassword: false,
  deleteAccount: false
})

// 修改个人信息表单数据
const updateForm = ref({
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  avatar_file: null
})

// 修改密码表单数据
const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

// 修改个人信息表单验证规则
const updateRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ]
}

// 新密码验证规则
const validateNewPassword = (rule, value, callback) => {
  if (value === passwordForm.value.current_password) {
    callback(new Error('新密码不能与当前密码相同'))
  } else {
    callback()
  }
}

// 确认密码验证规则
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.value.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 修改密码表单验证规则
const passwordRules = {
  current_password: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { validator: validateNewPassword, trigger: ['blur', 'change'] }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: ['blur', 'change'] }
  ]
}

// 创建头像预览 URL 的计算属性
const avatarPreviewUrl = computed(() => {
  if (updateForm.value.avatar_file) {
    return URL.createObjectURL(updateForm.value.avatar_file)
  }
  return userInfo.value?.avatar_path ? `${requestBaseURL}/${userInfo.value.avatar_path}` : ''
})

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
  updateForm.value.avatar_file = file.raw
  return false // 阻止自动上传
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
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '暂无数据'
  // 创建一个 UTC 日期对象，然后使用 toLocaleString 转换为中国时区
  const date = new Date(dateTimeStr)
  // 手动调整时区偏移，中国是 UTC+8，所以需要减去 8 小时
  const adjustedDate = new Date(date.getTime() - 8 * 60 * 60 * 1000)
  return adjustedDate.toLocaleString('zh-CN')
}

// 打开修改个人信息对话框
const openUpdateProfileDialog = () => {
  dialogVisible.updateProfile = true
}

// 打开修改密码对话框
const openChangePasswordDialog = () => {
  dialogVisible.changePassword = true
}

// 打开注销账户对话框
const openDeleteAccountDialog = () => {
  dialogVisible.deleteAccount = true
}

// 提交修改个人信息
const submitUpdateProfile = async () => {
  if (!updateFormRef.value) {
    ElMessage.error('【修改个人信息错误】表单实例不存在')
    return
  }

  try {
    await updateFormRef.value.validate()
    loading.value = true

    const formData = new FormData()
    formData.append('username', updateForm.value.username)
    formData.append('email', updateForm.value.email)
    formData.append('first_name', updateForm.value.first_name)
    formData.append('last_name', updateForm.value.last_name)
    formData.append('phone', updateForm.value.phone)
    if (updateForm.value.avatar_file) {
      formData.append('avatar_file', updateForm.value.avatar_file)
    }

    // 打印修改个人信息表单数据，过滤敏感信息
    const safeFormData = {
      username: updateForm.value.username,
      email: updateForm.value.email,
      has_first_name: updateForm.value.first_name ? '已设置' : '未设置',
      has_last_name: updateForm.value.last_name ? '已设置' : '未设置',
      has_avatar: updateForm.value.avatar_file ? '已设置' : '未设置',
      has_phone: updateForm.value.phone ? '已设置' : '未设置'
    }
    console.info('【修改个人信息表单数据】', safeFormData)

    const data = await request.put('/user/update', formData)
    console.info('【修改个人信息响应数据】', data)
    const operation = data.operation

    if (operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【修改个人信息成功】',
        duration: 3000
      })
      dialogVisible.updateProfile = false
      localStorage.setItem('login_user', JSON.stringify(data.updated_user))
      getUserInfo() // 重新获取用户信息
    }
    // 修改个人信息失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    console.error('【修改个人信息错误】', error)
    ElMessage.error({
      message: '【修改个人信息错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    loading.value = false
  }
}

// 提交修改密码
const submitChangePassword = async () => {
  if (!passwordFormRef.value) {
    ElMessage.error('【修改密码错误】表单实例不存在')
    return
  }

  try {
    await passwordFormRef.value.validate()
    loading.value = true

    const formData = new FormData()
    formData.append('current_password', passwordForm.value.current_password)
    formData.append('new_password', passwordForm.value.new_password)

    const data = await request.put('/user/change_password', formData)
    console.info('【修改密码响应数据】', data)
    const operation = data.operation

    if (operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【修改密码成功】请重新登录',
        duration: 3000
      })
      dialogVisible.changePassword = false
      // 清除信息并跳转到登录页
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('login_user')
      router.push('/login')
    }
  } catch (error) {
    console.error('【修改密码错误】', error)
    ElMessage.error({
      message: '【修改密码错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    loading.value = false
  }
}

// 提交注销账户
const submitDeleteAccount = async () => {
  try {
    loading.value = true

    const data = await request.delete('/user/delete')
    console.info('【注销账户响应数据】', data)
    const operation = data.operation

    if (operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【账户已注销】',
        duration: 3000
      })
      dialogVisible.deleteAccount = false
      // 清除信息并跳转到登录页
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('login_user')
      router.push('/login')
    }
  } catch (error) {
    console.error('【注销账户错误】', error)
    ElMessage.error({
      message: '【注销账户错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getUserInfo()
})
</script>

<template>
  <div class="user-center-container">
    <!-- 主要内容区域 -->
    <main class="main-content">
      <div class="page-header">
        <el-button type="primary" @click="goToHome" class="back-btn">
          <el-icon>
            <ArrowLeft />
          </el-icon>返回首页
        </el-button>
      </div>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <div v-else-if="userInfo" class="user-profile">
        <div class="profile-header">
          <div class="avatar-container">
            <el-avatar :size="100" :src="userInfo.avatar_path ? `${requestBaseURL}/${userInfo.avatar_path}` : ''">
              <el-icon :size="40">
                <User />
              </el-icon>
            </el-avatar>
            <!-- 用户状态图标 -->
            <div v-if="statusInfo.icon" class="status-icon" :style="{ backgroundColor: statusInfo.color }">
              <el-icon>
                <component :is="statusInfo.icon" />
              </el-icon>
            </div>
          </div>
          <div class="username-status-container">
            <h2 class="username">{{ userInfo.username }}</h2>
            <el-tag class="status-tag"
              :type="userInfo.status === 'ACTIVE' ? 'success' : userInfo.status === 'INACTIVE' ? 'info' : userInfo.status === 'BANNED' ? 'danger' : 'warning'">
              {{ userInfo.status === 'ACTIVE' ? '在线' : userInfo.status === 'INACTIVE' ? '离线' : userInfo.status ===
          'BANNED' ? '封禁' : '已注销' }}
            </el-tag>
          </div>
        </div>

        <div class="profile-info">
          <el-descriptions title="用户信息" :column="1" border>
            <el-descriptions-item label="用户名">{{ userInfo.username }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
            <el-descriptions-item label="姓氏" v-if="userInfo.last_name">{{ userInfo.last_name }}</el-descriptions-item>
            <el-descriptions-item label="名字" v-if="userInfo.first_name">{{ userInfo.first_name }}</el-descriptions-item>
            <el-descriptions-item label="电话" v-if="userInfo.phone">{{ userInfo.phone }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ userInfo.role === 'ADMIN' ? '管理员' : userInfo.role === 'DEVELOPER' ?
          '开发者' : '普通用户' }}</el-descriptions-item>
            <el-descriptions-item label="最后登录时间" v-if="userInfo.last_login">{{ formatDateTime(userInfo.last_login)
              }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ formatDateTime(userInfo.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(userInfo.updated_at) }}</el-descriptions-item>
            <el-descriptions-item label="注销时间" v-if="userInfo.status === 'deleted' && userInfo.deleted_at">{{
          formatDateTime(userInfo.deleted_at) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 更多用户相关功能 -->
        <div class="user-actions">
          <h3>账户操作</h3>
          <div class="action-buttons">
            <el-button type="primary" @click="openUpdateProfileDialog">
              <el-icon>
                <User />
              </el-icon>修改个人信息
            </el-button>
            <el-button type="warning" @click="openChangePasswordDialog">
              <el-icon>
                <Lock />
              </el-icon>修改密码
            </el-button>
            <el-button type="danger" @click="openDeleteAccountDialog">
              <el-icon>
                <Delete />
              </el-icon>注销账户
            </el-button>
          </div>
        </div>

        <!-- 修改个人信息对话框 -->
        <el-dialog v-model="dialogVisible.updateProfile" title="修改个人信息" width="500px" :close-on-click-modal="false">
          <el-form ref="updateFormRef" :model="updateForm" :rules="updateRules" label-width="100px" status-icon>
            <el-form-item label="头像">
              <el-upload class="avatar-uploader" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
                :auto-upload="false" :show-file-list="false" :on-change="handleAvatarChange"
                accept="image/png, image/jpg, image/jpeg">
                <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" class="avatar-preview" />
                <el-icon v-else class="avatar-uploader-icon">
                  <Plus />
                </el-icon>
              </el-upload>
              <div class="upload-tip">点击上传头像</div>
            </el-form-item>
            <el-form-item label="用户名" prop="username">
              <el-input v-model="updateForm.username" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="updateForm.email" />
            </el-form-item>
            <el-form-item label="姓氏">
              <el-input v-model="updateForm.last_name" />
            </el-form-item>
            <el-form-item label="名字">
              <el-input v-model="updateForm.first_name" />
            </el-form-item>
            <el-form-item label="电话">
              <el-input v-model="updateForm.phone" />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible.updateProfile = false">取消</el-button>
              <el-button type="primary" @click="submitUpdateProfile" :loading="loading">确认</el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 修改密码对话框 -->
        <el-dialog v-model="dialogVisible.changePassword" title="修改密码" width="500px" :close-on-click-modal="false">
          <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px" status-icon>
            <el-form-item label="当前密码" prop="current_password">
              <el-input v-model="passwordForm.current_password" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="new_password">
              <el-input v-model="passwordForm.new_password" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirm_password">
              <el-input v-model="passwordForm.confirm_password" type="password" show-password />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible.changePassword = false">取消</el-button>
              <el-button type="primary" @click="submitChangePassword" :loading="loading">确认</el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 注销账户对话框 -->
        <el-dialog v-model="dialogVisible.deleteAccount" title="注销账户" width="500px" :close-on-click-modal="false">
          <div class="delete-account-warning">
            <el-icon class="warning-icon">
              <Warning />
            </el-icon>
            <p>您确定要注销账户吗？此操作不可逆，注销后：</p>
            <ul>
              <li>您的账户将被标记为已注销状态</li>
              <li>您将无法使用此账户登录系统</li>
              <li>您的个人数据将被保留，但将无法访问</li>
            </ul>
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible.deleteAccount = false">取消</el-button>
              <el-button type="danger" @click="submitDeleteAccount" :loading="loading">确认注销</el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </main>
  </div>
</template>

<style scoped>
.user-center-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  margin-top: 0;
  padding-top: 0;
  overflow-y: auto;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #4a5568;
  font-weight: 500;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.back-btn {
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  border: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.back-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(96, 165, 250, 0.4);
}

.main-content {
  padding: 20px 30px;
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
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

.username-status-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.username {
  margin: 0;
  color: #4a5568;
  font-size: 1.8rem;
}

.status-tag {
  margin-top: 4px;
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

.action-buttons .el-button .el-icon {
  vertical-align: middle;
  margin-right: 5px;
  margin-bottom: 1.8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

/* 上传头像相关样式 */
.avatar-uploader {
  display: flex;
  justify-content: center;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.upload-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
  text-align: center;
}

/* 注销账户警告样式 */
.delete-account-warning {
  background-color: #fef0f0;
  padding: 20px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.warning-icon {
  font-size: 48px;
  color: #F56C6C;
  margin-bottom: 15px;
}

.delete-account-warning p {
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.delete-account-warning ul {
  text-align: left;
  margin: 0;
  padding-left: 20px;
}

.delete-account-warning li {
  margin-bottom: 5px;
}

/* 对话框底部按钮样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

  .el-dialog {
    width: 90% !important;
  }
}
</style>
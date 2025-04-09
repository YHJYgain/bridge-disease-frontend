<script setup>
import { ref, computed, onMounted } from 'vue'
import { Message, Phone, ChatLineRound, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { useUserStore } from '../stores/userStore'

const props = defineProps({
  // 卡片标题
  title: {
    type: String,
    default: '联系支持'
  },
  // 卡片描述
  description: {
    type: String,
    default: '如需帮助，请通过以下方式联系：'
  }
})

const { userInfo } = useUserStore()
const contactInfo = ref(null)
const loading = ref(false)

// 判断用户角色
const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')

// 获取联系人信息
const getContactInfo = async () => {
  try {
    loading.value = true
    
    // 根据用户角色获取不同的联系人信息
    const endpoint = isAdmin.value ? '/user/developer_info' : '/user/admin_info'
    const data = await request.get(endpoint)
    console.info(`【随机获取${isAdmin.value ? '开发人员' : '管理员'}信息响应数据】`, data)
    
    // 根据接口返回的字段名称设置联系人信息
    if (isAdmin.value && data && data.developer_info) {
      contactInfo.value = data.developer_info
    } else if (!isAdmin.value && data && data.admin_info) {
      contactInfo.value = data.admin_info
    }
  } catch (error) {
    console.error(`【随机获取${isAdmin.value ? '开发人员' : '管理员'}信息错误】`, error)
    ElMessage.error({
      message: `【随机获取${isAdmin.value ? '开发人员' : '管理员'}信息错误】${error?.message || '请稍后重试'}`,
      duration: 5000
    })
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取联系人信息
onMounted(() => {
  getContactInfo()
})
</script>

<template>
  <div class="contact-card">
    <h3 class="card-title">{{ title }}</h3>
    <div class="contact-info">
      <div class="info-icon">
        <el-icon size="50">
          <ChatLineRound />
        </el-icon>
      </div>
      <p class="info-desc">{{ description }}</p>
      
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading" size="24">
          <Loading />
        </el-icon>
        <span>正在加载{{ isAdmin ? '开发人员' : '管理员' }}信息...</span>
      </div>
      
      <div v-else-if="!contactInfo" class="no-contact-info">
        <p>暂无可用的{{ isAdmin ? '开发人员' : '管理员' }}联系信息，请稍后再试</p>
      </div>
      
      <div v-else class="contact-group">
        <div class="contact-title">{{ contactInfo.role === 'ADMIN' ? '管理员' : '开发人员' }}: {{ contactInfo.last_name }}{{ contactInfo.first_name }}</div>
        
        <div v-if="contactInfo.email" class="contact-item">
          <el-icon>
            <Message />
          </el-icon>
          <span>邮箱：{{ contactInfo.email }}</span>
        </div>
        
        <div v-if="contactInfo.phone" class="contact-item">
          <el-icon>
            <Phone />
          </el-icon>
          <span>联系电话：{{ contactInfo.phone }}</span>
        </div>
      </div>

      <p class="contact-note">联系时请提供您的用户名/注册邮箱，以便{{ isAdmin ? '开发人员' : '管理员' }}核实您的身份</p>
    </div>
  </div>
</template>

<style scoped>
.contact-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.18);
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.contact-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(31, 38, 135, 0.3);
}

.card-title {
  color: var(--el-color-primary);
  margin-bottom: 15px;
  font-size: 1.2em;
  font-weight: 500;
}

.contact-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.info-icon {
  margin-bottom: 15px;
  color: var(--el-color-primary);
}

.info-desc {
  font-size: 14px;
  margin-bottom: 20px;
  color: var(--el-text-color-regular);
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  background: rgba(var(--el-color-primary-rgb), 0.1);
  padding: 10px 15px;
  border-radius: 8px;
  width: 100%;
  transition: all 0.3s ease;
}

.contact-item:hover {
  background: rgba(var(--el-color-primary-rgb), 0.15);
  transform: translateY(-2px);
}

.contact-item .el-icon {
  margin-right: 10px;
  color: var(--el-color-primary);
}

.contact-note {
  font-size: 12px;
  margin: 10px 0;
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 15px 0;
  color: var(--el-text-color-secondary);
}

.loading-container .el-icon {
  margin-bottom: 8px;
}

.no-contact-info {
  background: rgba(var(--el-color-info-rgb), 0.1);
  padding: 12px;
  border-radius: 8px;
  margin: 12px 0;
  width: 100%;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.contact-group {
  width: 100%;
  margin-bottom: 15px;
  background: rgba(var(--el-color-primary-rgb), 0.05);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
}

.contact-title {
  font-weight: 500;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  text-align: left;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
}
</style>
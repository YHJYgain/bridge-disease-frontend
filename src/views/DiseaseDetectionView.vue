<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { resourceStore } from '../stores/resourceStore'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const router = useRouter()
const userInfo = ref(null)
const loading = ref(false)

// 使用共享的媒体和模型存储
const mediaStore = resourceStore()

// 媒体列表和模型列表
const mediaList = ref([])
const modelList = ref([])

// 选中的媒体
const selectedMedia = ref(null)
// 选中的模型
const selectedModel = ref(null)
// 检测任务加载状态
const detectLoading = ref(false)

// 媒体和模型加载状态
const mediaLoading = computed(() => mediaStore.mediaLoading)
const modelLoading = computed(() => mediaStore.modelLoading)

// 获取用户信息
const getUserInfo = async () => {
  try {
    loading.value = true
    // 检查是否有 token
    const token = localStorage.getItem('access_token')
    if (!token) {
      ElMessage.warning({
        message: '【获取用户信息失败】未登录或登录已过期，请重新登录',
        duration: 4000
      })
      router.push('/login')
      return
    }

    // 从 localStorage 中获取用户信息
    const storedUser = localStorage.getItem('login_user')
    userInfo.value = JSON.parse(storedUser);
  } catch (error) {
    console.error('【获取用户信息错误】', error)
    ElMessage.error({
      message: '【获取用户信息错误】' + (error?.message || '请重试'),
      duration: 5000
    })
    router.push('/login')
  } finally {
    loading.value = false
  }
}

// 获取媒体列表
const getMediaList = async () => {
  try {
    // 使用共享的媒体存储获取媒体列表
    const { medias, error } = await mediaStore.fetchMediaList(userInfo.value)
    if (error) {
      throw error
    }
    mediaList.value = medias
  } catch (error) {
    console.error('获取媒体列表失败', error)
    ElMessage.error('获取媒体列表失败，请重试')
  }
}

// 获取模型列表
const getModelList = async () => {
  try {
    // 使用共享的模型存储获取模型列表
    const { models, error } = await mediaStore.fetchModelList()
    if (error) {
      throw error
    }
    modelList.value = models
  } catch (error) {
    console.error('获取模型列表失败', error)
    ElMessage.error('获取模型列表失败，请重试')
  }
}

// 提交检测任务
const submitDetectionTask = async () => {
  if (!selectedMedia.value) {
    ElMessage.warning('请选择要检测的媒体文件')
    return
  }

  if (!selectedModel.value) {
    ElMessage.warning('请选择要使用的检测模型')
    return
  }

  try {
    detectLoading.value = true
    // const response = await request.post('/detection', {
    //   media_id: selectedMedia.value,
    //   model_id: selectedModel.value
    // })

    // if (response && response.operation && response.operation.status === 'SUCCESS') {
    //   ElMessage.success('检测任务提交成功')
    //   // 跳转到检测记录页面
    //   router.push('/detection-records')
    // }
  } catch (error) {
    console.error('提交检测任务失败', error)
    ElMessage.error('提交检测任务失败，请重试')
  } finally {
    detectLoading.value = false
  }
}

onMounted(() => {
  // 先获取用户信息，防止未登录用户能够直接访问该页面
  getUserInfo().then(() => {
    getMediaList()
    getModelList()
  })
})
</script>

<template>
  <div class="disease-detection-container">
    <!-- 主要内容区域 -->
    <div class="main-container">
      <!-- 侧边栏导航 -->
      <div class="sidebar">
        <SidebarMenu />
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 面包屑导航 -->
        <BreadcrumbNav />

        <!-- 检测分割表单 -->
        <el-card class="detection-card">
          <template #header>
            <div class="card-header">
              <h2>病害检测分割</h2>
            </div>
          </template>

          <el-form label-position="top">
            <el-form-item label="选择媒体文件">
              <el-select v-model="selectedMedia" placeholder="请选择媒体文件" style="width: 100%">
                <el-option v-for="item in mediaList" :key="item.media_id" :label="item.file_name" :value="item.media_id">
                  <div class="media-option">
                    <span>{{ item.file_name }}</span>
                    <span class="media-type">{{ ['png', 'jpg', 'jpeg'].includes(item.file_type.toLowerCase()) ? '图片' : '视频' }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="选择检测模型">
              <el-select v-model="selectedModel" placeholder="请选择检测模型" style="width: 100%">
                <el-option v-for="item in modelList" :key="item.model_id" :label="item.model_name" :value="item.model_id">
                  <div class="model-option">
                    <span>{{ item.model_name }}</span>
                    <span class="model-version">{{ item.disease_category }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitDetectionTask" :loading="detectLoading" style="width: 100%">
                开始检测分割
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.disease-detection-container {
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 10;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #4a5568;
  font-weight: 500;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  transition: all 0.3s ease;
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  border-radius: 20px;
  background-color: #f8fafc;
  background-image: linear-gradient(135deg, #f8fafc 0%, #e6f2ff 100%);
}

.detection-card {
  margin-top: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.media-option,
.model-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.media-type,
.model-version {
  color: #909399;
  font-size: 12px;
}
</style>
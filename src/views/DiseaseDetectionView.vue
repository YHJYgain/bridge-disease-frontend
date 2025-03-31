<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { resourceStore } from '../stores/resourceStore'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'
import { Aim, Coin, Picture } from '@element-plus/icons-vue'

const router = useRouter()
const userInfo = ref(null)
const loading = ref(false)
const detectLoading = ref(false)

// 使用共享的媒体和模型存储
const mediaStore = resourceStore()

// 媒体列表和模型列表
const mediaList = ref([])
const modelList = ref([])

// 选中的媒体
const selectedMedia = ref(null)
// 选中的模型
const selectedModel = ref(null)
// 选中的模型详情
const selectedModelInfo = ref(null)

// 步骤条相关
const activeStep = ref(0)
const steps = [
  { title: 'Step 1：选择模型', icon: Coin },
  { title: 'Step 2：选择媒体', icon: Picture },
  { title: 'Step 3：开始检测分割', icon: Aim }
]

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
    console.error('【获取媒体列表错误】', error)
    ElMessage.error({
      message: '【获取媒体列表错误】' + (error?.message || '请重试'),
      duration: 5000
    })
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
    console.error('【获取模型列表错误】', error)
    ElMessage.error({
      message: '【获取模型列表错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  }
}

// 选择模型时更新模型详情
const updateSelectedModelInfo = () => {
  if (selectedModel.value) {
    selectedModelInfo.value = modelList.value.find(model => model.model_id === selectedModel.value)
  } else {
    selectedModelInfo.value = null
  }
}

// 下一步
const nextStep = () => {
  if (activeStep.value === 0 && !selectedModel.value) {
    ElMessage.warning({
      message: '【下一步失败】请先选择一个模型',
      duration: 4000
    })
    return
  }
  if (activeStep.value === 1 && !selectedMedia.value) {
    ElMessage.warning({
      message: '【下一步失败】请先选择一个媒体',
      duration: 4000
    })
    return
  }
  if (activeStep.value < steps.length - 1) {
    activeStep.value++
  }
}

// 上一步
const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}

// 进行检测分割任务
const submitDetectionTask = async () => {
  if (!selectedModel.value) {
    ElMessage.warning({
      message: '【检测分割任务失败】请选择要使用的检测模型',
      duration: 4000
    })
    return
  }

  if (!selectedMedia.value) {
    ElMessage.warning({
      message: '【检测分割任务失败】请选择要检测的媒体',
      duration: 4000
    })
    return
  }

  // 确保已经到了第三步
  if (activeStep.value !== 2) {
    activeStep.value = 2
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
    console.error('【检测分割任务错误】', error)
    ElMessage.error({
      message: '【检测分割任务错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    detectLoading.value = false
  }
}

// 监听选中的模型变化
const watchSelectedModel = () => {
  updateSelectedModelInfo()
}

onMounted(() => {
  // 先获取用户信息，防止未登录用户能够直接访问该页面
  getUserInfo().then(() => {
    getMediaList()
    getModelList()
  })
})

// 监听选中的模型变化
watch(selectedModel, watchSelectedModel)
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

          <!-- 步骤条 -->
          <el-steps :active="activeStep" finish-status="success" class="detection-steps" simple>
            <el-step v-for="(step, index) in steps" :key="index" :title="step.title">
              <template #icon>
                <el-icon>
                  <component :is="step.icon" />
                </el-icon>
              </template>
            </el-step>
          </el-steps>

          <!-- 步骤内容区域 -->
          <div class="step-content">
            <!-- 步骤 1：选择模型 -->
            <div v-if="activeStep === 0" class="step-container">
              <h3>选择检测模型</h3>
              <el-form label-position="top">
                <el-form-item>
                  <el-select v-model="selectedModel" placeholder="请选择检测模型" style="width: 100%">
                    <el-option v-for="item in modelList" :key="item.model_id" :label="item.model_name"
                      :value="item.model_id">
                      <div class="model-option">
                        <span>{{ item.model_name }}</span>
                        <span class="model-version">{{ item.disease_category }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-form>

              <!-- 显示选中模型的详细信息 -->
              <div v-if="selectedModelInfo" class="model-info-card">
                <h4>模型信息</h4>
                <div class="model-info-grid">
                  <div class="info-item">
                    <span class="info-label">模型名称：</span>
                    <span class="info-value">{{ selectedModelInfo.model_name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">病害类别：</span>
                    <span class="info-value">{{ selectedModelInfo.disease_category }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">fitness_score（适应度分数）：</span>
                    <span class="info-value">{{ selectedModelInfo.fitness_score }}</span>
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <el-button type="primary" @click="nextStep">下一步</el-button>
              </div>
            </div>

            <!-- 步骤 2：选择媒体 -->
            <div v-if="activeStep === 1" class="step-container">
              <h3>选择媒体文件</h3>
              <el-form label-position="top">
                <el-form-item>
                  <el-select v-model="selectedMedia" placeholder="请选择媒体文件" style="width: 100%">
                    <el-option v-for="item in mediaList" :key="item.media_id" :label="item.file_name"
                      :value="item.media_id">
                      <div class="media-option">
                        <span>{{ item.file_name }}</span>
                        <span class="media-type">{{ ['png', 'jpg', 'jpeg'].includes(item.file_type.toLowerCase()) ? '图片'
            : '视频'
                          }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-form>

              <!-- 媒体预览 -->
              <div v-if="selectedMedia" class="media-preview">
                <h4>媒体预览</h4>
                <div class="preview-container">
                  <el-image v-if="mediaList.find(m => m.media_id === selectedMedia)?.file_type.toLowerCase() === 'png' ||
            mediaList.find(m => m.media_id === selectedMedia)?.file_type.toLowerCase() === 'jpg' ||
            mediaList.find(m => m.media_id === selectedMedia)?.file_type.toLowerCase() === 'jpeg'"
                    :src="mediaList.find(m => m.media_id === selectedMedia)?.file_url" fit="contain"
                    class="preview-image">
                  </el-image>
                  <video v-else-if="mediaList.find(m => m.media_id === selectedMedia)?.file_type.toLowerCase() === 'mp4' ||
            mediaList.find(m => m.media_id === selectedMedia)?.file_type.toLowerCase() === 'avi'"
                    :src="mediaList.find(m => m.media_id === selectedMedia)?.file_url" controls class="preview-video">
                  </video>
                  <div v-else class="preview-placeholder">
                    无法预览该类型的媒体文件
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <el-button @click="prevStep">上一步</el-button>
                <el-button type="primary" @click="nextStep">下一步</el-button>
              </div>
            </div>

            <!-- 步骤 3：开始检测分割 -->
            <div v-if="activeStep === 2" class="step-container">
              <h3>开始检测分割</h3>

              <div class="detection-summary">
                <h4>检测任务信息</h4>
                <div class="summary-item">
                  <span class="summary-label">选择的模型：</span>
                  <span class="summary-value">{{ selectedModelInfo?.model_name }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">病害类别：</span>
                  <span class="summary-value">{{ selectedModelInfo?.disease_category }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">选择的媒体：</span>
                  <span class="summary-value">{{ mediaList.find(m => m.media_id === selectedMedia)?.file_name }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">媒体类型：</span>
                  <span class="summary-value">
                    {{ ['png', 'jpg', 'jpeg'].includes(mediaList.find(m => m.media_id ===
            selectedMedia)?.file_type.toLowerCase())
            ? '图片' : '视频' }}
                  </span>
                </div>
              </div>

              <div class="step-actions">
                <el-button @click="prevStep">上一步</el-button>
                <el-button type="primary" @click="submitDetectionTask" :loading="detectLoading">
                  开始检测分割
                </el-button>
              </div>
            </div>
          </div>
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

/* 步骤条样式 */
.detection-steps {
  margin: 20px 0 30px;
}

.step-content {
  min-height: 300px;
}

.step-container {
  padding: 10px 0;
}

.step-container h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.step-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.model-info-card {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
}

.model-info-card h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.model-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.media-preview {
  margin-top: 20px;
}

.media-preview h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.preview-container {
  width: 100%;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.preview-image,
.preview-video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-placeholder {
  color: #909399;
  font-size: 14px;
}

.detection-summary {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
}

.detection-summary h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.summary-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.summary-label {
  width: 100px;
  font-size: 14px;
  color: #606266;
}

.summary-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}
</style>
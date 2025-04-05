<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { Aim, Coin, Picture } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useResourceStore } from '../stores/resourceStore'
import { useUserStore } from '../stores/userStore'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const requestBaseURL = request.defaults.baseURL
const router = useRouter()
const { userInfo, getUserInfo } = useUserStore()
const { mediaList, modelList, fetchMediaList, fetchModelList } = useResourceStore()
const detectLoading = ref(false)

// 步骤条相关
const activeStep = ref(0)
const steps = [
  { title: 'Step 1：选择模型', icon: Coin },
  { title: 'Step 2：选择媒体', icon: Picture },
  { title: 'Step 3：开始检测分割', icon: Aim }
]

// 上一步
const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}

// 下一步
const nextStep = () => {
  if (activeStep.value === 0 && !selectedModelId.value) {
    ElMessage.warning({
      message: '【下一步失败】请先选择一个模型',
      duration: 4000
    })
    return
  }
  if (activeStep.value === 1 && !selectedMediaId.value) {
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

// 滚动加载相关状态
const loadingMoreMedia = ref(false)
const loadingMoreModel = ref(false)
const hasMoreMedia = ref(true)
const hasMoreModel = ref(true)
const currentMediaPage = ref(1)
const currentModelPage = ref(1)

// 加载更多媒体数据
const loadMoreMedia = async () => {
  if (loadingMoreMedia.value || !hasMoreMedia.value) return

  loadingMoreMedia.value = true
  currentMediaPage.value++

  try {
    const { medias, total } = await fetchMediaList(userInfo.value, currentMediaPage.value, 5)
    if (medias.length === 0) {
      hasMoreMedia.value = false
    }
  } catch (error) {
    console.error('【加载更多媒体错误】', error)
    ElMessage.error({
      message: '【加载更多媒体错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    loadingMoreMedia.value = false
  }
}

// 加载更多模型数据
const loadMoreModel = async () => {
  if (loadingMoreModel.value || !hasMoreModel.value) return

  loadingMoreModel.value = true
  currentModelPage.value++

  try {
    const { models, total } = await fetchModelList(currentModelPage.value, 5)
    if (models.length === 0) {
      hasMoreModel.value = false
    }
  } catch (error) {
    console.error('【加载更多模型错误】', error)
    ElMessage.error({
      message: '【加载更多模型错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    loadingMoreModel.value = false
  }
}

// 滚动事件处理
const handleScroll = () => {
  const el = document.querySelector('.el-select-dropdown__wrap')
  if (!el) return

  const { scrollTop, scrollHeight, clientHeight } = el
  if (scrollHeight - (scrollTop + clientHeight) < 50) {
    if (activeStep.value === 0) {
      loadMoreModel()
    } else if (activeStep.value === 1) {
      loadMoreMedia()
    }
  }
}

// 选中的模型
const selectedModelId = ref(null)
const selectedModel = ref(null)

// 选中的媒体
const selectedMediaId = ref(null)
const selectedMedia = ref(null)

// 选择模型时更新模型详情
const updateSelectedModel = () => {
  if (selectedModelId.value) {
    selectedModel.value = modelList.value.find(model => model.model_id === selectedModelId.value)
  } else {
    selectedModel.value = null
  }
}

// 选择媒体时更新媒体详情
const updateSelectedMedia = () => {
  if (selectedMediaId.value) {
    selectedMedia.value = mediaList.value.find(media => media.media_id === selectedMediaId.value)
  } else {
    selectedMedia.value = null
  }
}

// 监听选中的模型变化
const watchSelectedModel = () => {
  updateSelectedModel()
}

// 监听选中的媒体变化
const watchSelectedMedia = () => {
  updateSelectedMedia()
}

// 监听选中的模型/媒体变化
watch(selectedModelId, watchSelectedModel)
watch(selectedMediaId, watchSelectedMedia)

const mediaPreviewURL = computed(() => {
  return selectedMedia ? `${requestBaseURL}/${selectedMedia.value.media_path}` : '';
})

// 检测分割
const submitDetectionTask = async () => {
  if (!selectedModelId.value) {
    ElMessage.warning({
      message: '【检测分割失败】请选择要使用的检测模型',
      duration: 4000
    })
    return
  }

  if (!selectedMediaId.value) {
    ElMessage.warning({
      message: '【检测分割失败】请选择要检测的媒体',
      duration: 4000
    })
    return
  }

  // 确保已经到了第三步
  if (activeStep.value !== 2) {
    activeStep.value = 2
  }

  // 创建全屏加载
  const isVideo = selectedMedia.value && ['mp4'].includes(selectedMedia.value.file_type.toLowerCase())
  const loadingInstance = ElLoading.service({
    lock: true,
    text: `检测分割进行中，正在加载模型和媒体数据...${isVideo ? '\n视频处理时间可能较长，请耐心等待' : ''}`,
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    detectLoading.value = true

    // 根据媒体类型显示不同的提示信息
    ElMessage.warning({
      message: `【检测分割进行中】正在加载模型和媒体数据，请稍等...${isVideo ? '视频处理时间可能较长，请耐心等待' : ''}`,
      duration: 0,  // 不自动关闭
      showClose: true
    })

    const data = await request.post('/detection/detection_segmentation', {
      media_id: selectedMediaId.value,
      model_id: selectedModelId.value
    })
    console.info('【检测分割响应数据】', data)
    const operation = data.operation

    // 关闭之前的提示
    ElMessage.closeAll()

    if (operation && operation.status === 'SUCCESS') {
      if (data && data.is_new_detection === false) {
        ElMessage.warning({
          message: '【检测分割成功】同一媒体二次检测，已更新记录',
          duration: 4000
        });
      } else {
        ElMessage.success({
          message: '【检测分割成功】',
          duration: 3000
        });
      }

      // 跳转到检测分割记录页面
      router.push('/detection-records')
    }
    // 检测分割失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    // 关闭之前的提示
    ElMessage.closeAll()

    console.error('【检测分割错误】', error)
    ElMessage.error({
      message: '【检测分割错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    detectLoading.value = false
    // 关闭加载动画
    loadingInstance.close()
  }
}

onMounted(() => {
  // 先获取用户信息，防止未登录用户能够直接访问该页面
  getUserInfo().then(() => {
    if (userInfo.value) {
      // 初始加载第一页数据
      fetchMediaList(userInfo.value, 1, 5)
      fetchModelList(1, 5)

      // 添加滚动事件监听
      const el = document.querySelector('.el-select-dropdown__wrap')
      if (el) {
        el.addEventListener('scroll', handleScroll)
      }
    } else {
      router.push('/login')
    }
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
              <h3>选择检测模型（名称升序/综合性能降序）</h3>
              <el-form label-position="top">
                <el-form-item>
                  <el-select v-model="selectedModelId" placeholder="请选择检测模型" style="width: 100%">
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
              <div v-if="selectedModel" class="model-info-card">
                <h4>模型信息</h4>
                <div class="model-info-grid">
                  <div class="info-item">
                    <span class="info-label">模型名称：</span>
                    <span class="info-value">{{ selectedModel.model_name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">病害类别：</span>
                    <span class="info-value">{{ selectedModel.disease_category }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">fitness_score（整体性能分数）：</span>
                    <span class="info-value">{{ selectedModel.fitness_score }}</span>
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
                  <el-select v-model="selectedMediaId" placeholder="请选择媒体文件" style="width: 100%">
                    <el-option v-for="item in mediaList" :key="item.media_id" :label="item.media_name"
                      :value="item.media_id">
                      <div class="media-option">
                        <span>{{ item.media_name }}</span>
                        <span class="media-type">{{ ['png', 'jpg', 'jpeg'].includes(item.file_type.toLowerCase()) ? '图片'
                          : '视频'
                        }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-form>

              <!-- 媒体预览 -->
              <div v-if="selectedMediaId" class="media-preview">
                <h4>媒体预览</h4>
                <div class="preview-container">
                  <el-image v-if="['png', 'jpg', 'jpeg'].includes(selectedMedia.file_type.toLowerCase())"
                    :src="mediaPreviewURL" fit="contain" class="preview-image" :preview-src-list="[mediaPreviewURL]">
                  </el-image>
                  <video v-else-if="['mp4'].includes(selectedMedia.file_type.toLowerCase())" :src="mediaPreviewURL"
                    controls class="preview-video">
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

            <!-- 步骤 3：检测分割 -->
            <div v-if="activeStep === 2" class="step-container">
              <h3>检测分割</h3>

              <div class="detection-summary">
                <h4>检测任务信息</h4>
                <div class="summary-item">
                  <span class="summary-label">选择的模型：</span>
                  <span class="summary-value">{{ selectedModel?.model_name }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">病害类别：</span>
                  <span class="summary-value">{{ selectedModel?.disease_category }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">选择的媒体：</span>
                  <span class="summary-value">{{mediaList.find(m => m.media_id === selectedMediaId)?.media_name}}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">媒体类型：</span>
                  <span class="summary-value">
                    {{['png', 'jpg', 'jpeg'].includes(mediaList.find(m => m.media_id ===
                      selectedMediaId)?.file_type.toLowerCase())
                      ? '图片' : '视频'}}
                  </span>
                </div>
              </div>

              <!-- 媒体预览 -->
              <div v-if="selectedMediaId" class="media-preview">
                <h4>媒体预览</h4>
                <div class="preview-container">
                  <el-image v-if="['png', 'jpg', 'jpeg'].includes(selectedMedia.file_type.toLowerCase())"
                    :src="mediaPreviewURL" fit="contain" class="preview-image" :preview-src-list="[mediaPreviewURL]">
                  </el-image>
                  <video v-else-if="['mp4'].includes(selectedMedia.file_type.toLowerCase())" :src="mediaPreviewURL"
                    controls class="preview-video">
                  </video>
                  <div v-else class="preview-placeholder">
                    无法预览该类型的媒体文件
                  </div>
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
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.preview-image {
  max-width: 15%;
  max-height: 15%;
  margin: 10px;
  object-fit: contain;
}

.preview-video {
  max-width: 20%;
  max-height: 20%;
  margin: 10px;
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
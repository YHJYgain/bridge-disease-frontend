<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElProgress } from 'element-plus'
import { Aim, Coin, Picture, VideoPlay, WarningFilled } from '@element-plus/icons-vue'
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

// 实时检测对话框相关
const detectionDialogVisible = ref(false)
const currentFrameImage = ref('')
const detectionProgress = ref(0)
const frameIndex = ref(0)
const totalFrames = ref(1) // 默认至少有 1 帧
const detectionStatus = ref('准备中') // 准备中、检测中、已完成、已取消、出错
const detectionController = ref(null) // AbortController
const detectionResult = ref(null) // 最终检测结果
const frameDuration = ref(0) // 当前帧处理时长（ms）

// 步骤条相关
const activeStep = ref(0)
const steps = [
  { title: 'Step 1：选择模型', icon: Coin },
  { title: 'Step 2：选择媒体', icon: Picture },
  { title: 'Step 3：开始检测分割', icon: Aim },
]

// 分页相关
const currentMediaPage = ref(1)
const currentModelPage = ref(1)
const modelPageSize = ref(9)
const mediaPageSize = ref(9)
const modelTotal = ref(0)
const mediaTotal = ref(0)
const modelLoading = ref(false)
const mediaLoading = ref(false)

// 选中的模型
const selectedModelId = ref(null)
const selectedModel = ref(null)

// 选中的媒体
const selectedMediaId = ref(null)
const selectedMedia = ref(null)

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
      duration: 4000,
    })
    return
  }
  if (activeStep.value === 1 && !selectedMediaId.value) {
    ElMessage.warning({
      message: '【下一步失败】请先选择一个媒体',
      duration: 4000,
    })
    return
  }
  if (activeStep.value < steps.length - 1) {
    activeStep.value++
  }
}

// 加载模型数据
const loadModelData = async (page = 1) => {
  try {
    modelLoading.value = true

    const { models, total } = await fetchModelList(page, modelPageSize.value, true)

    modelTotal.value = total
    currentModelPage.value = page
  } catch (error) {
    console.error('【加载模型数据错误】', error)
    ElMessage.error({
      message: '【加载模型数据错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    modelLoading.value = false
  }
}

// 加载媒体数据
const loadMediaData = async (page = 1) => {
  try {
    mediaLoading.value = true

    const { medias, total } = await fetchMediaList(userInfo.value, page, mediaPageSize.value, true)
    mediaTotal.value = total
    currentMediaPage.value = page
  } catch (error) {
    console.error('【加载媒体数据错误】', error)
    ElMessage.error({
      message: '【加载媒体数据错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    mediaLoading.value = false
  }
}

// 媒体分页变化
const handleMediaPageChange = (page) => {
  loadMediaData(page)
}

// 模型分页变化
const handleModelPageChange = (page) => {
  loadModelData(page)
}

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
  return selectedMedia ? `${requestBaseURL}/${selectedMedia.value.media_path}` : ''
})

// 取消检测分割实时结果展现
const cancelDetectionTask = () => {
  if (detectionController.value) {
    detectionController.value.abort()
    detectionStatus.value = '已取消'
    ElMessage.warning({
      message: '【检测分割】检测分割实时结果展示已被手动取消',
      duration: 4000,
    })
  }
}

// 处理检测分割完成后的操作
const handleDetectionComplete = (existing_detection) => {
  detectionDialogVisible.value = false

  // 检查是否是更新已有记录的情况
  if (existing_detection) {
    ElMessage.success({
      message: '【检测分割】已成功更新相同媒体的检测分割记录',
      duration: 3000,
    })
  }

  // 重置状态
  setTimeout(() => {
    currentFrameImage.value = ''
    detectionProgress.value = 0
    frameIndex.value = 0
    detectionStatus.value = '准备中'
    detectionController.value = null
  }, 500)

  // 跳转到检测分割记录页面
  router.push('/detection-records')
}

// 检测分割
const submitDetectionTask = async () => {
  if (!selectedModelId.value) {
    ElMessage.warning({
      message: '【检测分割失败】请选择要使用的检测模型',
      duration: 4000,
    })
    return
  }

  if (!selectedMediaId.value) {
    ElMessage.warning({
      message: '【检测分割失败】请选择要检测的媒体',
      duration: 4000,
    })
    return
  }

  // 确保已经到了第三步
  if (activeStep.value !== 2) {
    activeStep.value = 2
  }

  // 重置检测状态
  detectionProgress.value = 0
  frameIndex.value = 0
  currentFrameImage.value = ''
  detectionStatus.value = '准备中'
  detectionResult.value = null
  frameDuration.value = 0

  // 显示检测对话框
  detectionDialogVisible.value = true

  // 设置媒体总帧数（视频多帧，图片单帧）
  const isVideo = selectedMedia.value && ['mp4'].includes(selectedMedia.value.file_type.toLowerCase())
  if (isVideo && selectedMedia.value.frame_count) {
    totalFrames.value = selectedMedia.value.frame_count
  } else {
    totalFrames.value = 1 // 图片只有一帧
  }

  try {
    detectLoading.value = true
    detectionStatus.value = '检测中'

    // 创建 AbortController 用于取消请求
    detectionController.value = new AbortController()
    const signal = detectionController.value.signal

    // 使用 fetch API 进行流式请求
    const response = await fetch(`${requestBaseURL}/detection/detection_segmentation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        media_id: selectedMediaId.value,
        model_id: selectedModelId.value,
      }),
      signal
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 获取响应的 reader 用于读取流数据
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    // 读取流数据
    while (true) {
      const { value, done } = await reader.read()

      if (done) {
        console.log('【检测分割】读取流数据完成')
        break
      }

      // 解码二进制数据为文本
      const chunk = decoder.decode(value, { stream: true })

      // 处理接收到的数据块（可能包含多个 JSON 对象，每行一个）
      // 使用更健壮的方式分割数据，确保每行都是完整的JSON
      const lines = chunk.split('\n').filter(line => line.trim())

      let buffer = ''
      for (let i = 0; i < lines.length; i++) {
        try {
          // 尝试处理当前行
          const line = lines[i]
          let jsonStr = line

          // 如果有缓冲数据，先合并
          if (buffer) {
            jsonStr = buffer + line
            buffer = '' // 重置缓冲区
          }

          // 验证 JSON 格式是否完整
          try {
            const data = JSON.parse(jsonStr)

            // 验证必要字段
            if (!data.type) {
              console.warn('【检测分割】接收到无效数据格式:', jsonStr)
              continue
            }

            // 根据消息类型处理
            if (data.type === 'START') {
              console.log('【检测分割】检测开始')
              // 处理已有检测记录的情况
              if (data.existing_detection) {
                ElMessage.info({
                  message: '【检测分割】正在更新相同媒体的检测分割记录',
                  duration: 4000,
                })
                // 在对话框中显示更新标记
                detectionStatus.value = '检测中（更新）'
              }
            } else if (data.type === 'FRAME') {
              // 验证帧数据的完整性
              if (data.frame_index === undefined) {
                console.warn('【检测分割】帧索引缺失')
                continue
              }

              // 验证图像数据
              if (!data.frame_image) {
                console.warn('【检测分割】帧图像数据缺失')
                continue
              }

              // 更新当前帧
              frameIndex.value = data.frame_index + 1
              currentFrameImage.value = `data:image/jpeg;base64,${data.frame_image}`
              frameDuration.value = data.frame_detection_duration ? data.frame_detection_duration.toFixed(2) : 0

              // 更新进度
              detectionProgress.value = Math.min(Math.round((frameIndex.value / totalFrames.value) * 100), 99)
            } else if (data.type === 'END') {
              // 检测完成
              detectionProgress.value = 100
              detectionStatus.value = '已完成'
              detectionResult.value = data.new_detection

              ElMessage.success({
                message: '【检测分割成功】',
                duration: 3000,
              })

              // 延迟关闭对话框，让用户看到 100% 的进度
              setTimeout(() => {
                handleDetectionComplete(data.existing_detection)
              }, 1500)
            }
          } catch (parseError) {
            // JSON 解析失败，可能是不完整的数据
            // 将当前行添加到缓冲区，等待下一行数据
            buffer += line

            // 如果是最后一行且缓冲区不为空，记录错误
            if (i === lines.length - 1 && buffer) {
              console.warn('【检测分割】接收到不完整的 JSON 数据，已缓存')
            }
          }
        } catch (error) {
          console.error('【检测分割】处理数据时出错:', error)
          buffer = '' // 重置缓冲区，防止错误累积
        }
      }
    }
  } catch (error) {
    // 如果不是用户取消的请求，则显示错误信息
    if (error.name !== 'AbortError') {
      console.error('【检测分割错误】', error)
      ElMessage.error({
        message: '【检测分割错误】' + (error?.message || '请重试'),
        duration: 5000,
      })
      detectionStatus.value = '出错'
    }
  } finally {
    detectLoading.value = false
  }
}

onMounted(() => {
  // 先获取用户信息，防止未登录用户能够直接访问该页面
  getUserInfo().then(() => {
    if (userInfo.value) {
      // 初始加载第一页数据
      loadMediaData(1)
      loadModelData(1)
    } else {
      router.push('/login')
    }
  })
})

// 组件销毁前取消未完成的检测任务
onBeforeUnmount(() => {
  if (detectionController.value) {
    detectionController.value.abort()
  }
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
              <h3>选择检测模型</h3>
              <el-form label-position="top">
                <el-form-item>
                  <el-select v-model="selectedModelId" placeholder="请选择检测模型" style="width: 100%" filterable>
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

              <!-- 分页控件 -->
              <div class="pagination-container">
                <el-pagination v-model:current-page="currentModelPage" :page-size="modelPageSize"
                  layout="prev, pager, next" :total="modelTotal" @current-change="handleModelPageChange"
                  :disabled="modelLoading" />
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
                  <el-select v-model="selectedMediaId" placeholder="请选择媒体文件" style="width: 100%" filterable>
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

              <!-- 分页控件 -->
              <div class="pagination-container">
                <el-pagination v-model:current-page="currentMediaPage" :page-size="mediaPageSize"
                  layout="prev, pager, next" :total="mediaTotal" @current-change="handleMediaPageChange"
                  :disabled="mediaLoading" />
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

    <!-- 检测分割实时进度对话框 -->
    <el-dialog v-model="detectionDialogVisible" title="病害检测分割进度" width="650px" :close-on-click-modal="false"
      :close-on-press-escape="false" :show-close="detectionStatus !== '检测中'">
      <div class="detection-dialog-content">
        <!-- 状态和进度 -->
        <div class="detection-status">
          <el-tag
            :type="detectionStatus.includes('检测中') ? 'primary' : detectionStatus === '已完成' ? 'success' : detectionStatus === '已取消' ? 'warning' : detectionStatus === '出错' ? 'danger' : 'info'">
            {{ detectionStatus }}
          </el-tag>
          <span class="frame-info" v-if="detectionStatus.includes('检测中') || detectionStatus === '已完成'">
            处理第 {{ frameIndex }} 帧 / 共 {{ totalFrames }} 帧
            <span v-if="frameDuration > 0">（每帧耗时: {{ frameDuration }}ms）</span>
          </span>
        </div>

        <!-- 进度条 -->
        <el-progress :percentage="detectionProgress"
          :status="detectionStatus === '已完成' ? 'success' : detectionStatus === '出错' ? 'exception' : ''"
          :stroke-width="20" :format="percent => `${percent}%`" />

        <!-- 当前帧预览 -->
        <div class="frame-preview" v-if="currentFrameImage">
          <h4>当前帧预览</h4>
          <div class="preview-container detection-preview">
            <img :src="currentFrameImage" class="frame-image" />
          </div>
        </div>

        <!-- 无预览时的提示 -->
        <div class="no-preview" v-else>
          <el-icon class="no-preview-icon">
            <VideoPlay />
          </el-icon>
          <span>等待检测结果...</span>
        </div>

        <!-- 错误提示 -->
        <div class="detection-error" v-if="detectionStatus === '出错'">
          <el-icon>
            <WarningFilled />
          </el-icon>
          <span>检测过程中发生错误，请重试或联系管理员</span>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDetectionTask" :disabled="detectionStatus !== '检测中'" type="danger">
            取消检测
          </el-button>
          <el-button @click="detectionDialogVisible = false" v-if="detectionStatus !== '检测中'">
            关闭
          </el-button>
          <el-button type="primary" @click="handleDetectionComplete" v-if="detectionStatus === '已完成'">
            查看检测记录
          </el-button>
        </span>
      </template>
    </el-dialog>
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
  margin: 30px 0 40px;
}

/* 自定义步骤条样式，使其更加醒目 */
.detection-steps :deep(.el-step__icon) {
  width: 40px;
  height: 40px;
  font-size: 20px;
}

.detection-steps :deep(.el-step__title) {
  font-size: 16px;
  font-weight: 600;
  color: #606266;
}

.detection-steps :deep(.el-step__title.is-process) {
  color: #409EFF;
  font-weight: 700;
}

.detection-steps :deep(.el-step__title.is-success) {
  color: #67C23A;
  font-weight: 600;
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
  font-size: 17px;
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
  max-width: 13%;
  max-height: 13%;
  margin: 10px;
  object-fit: contain;
}

.preview-video {
  max-width: 16%;
  max-height: 16%;
  margin: 10px;
  object-fit: contain;
}

.preview-placeholder {
  color: #909399;
  font-size: 14px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
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

/* 检测对话框样式 */
.detection-dialog-content {
  padding: 10px 0;
}

.detection-status {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  justify-content: space-between;
}

.frame-info {
  font-size: 14px;
  color: #606266;
  margin-left: 10px;
}

.frame-preview {
  margin-top: 20px;
}

.frame-preview h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.detection-preview {
  height: 300px;
  background-color: #f5f7fa;
}

.frame-image {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
}

.no-preview {
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #909399;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-top: 20px;
}

.no-preview-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.detection-error {
  margin-top: 15px;
  padding: 10px;
  background-color: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.detection-error .el-icon {
  margin-right: 8px;
}
</style>
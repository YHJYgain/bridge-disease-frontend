<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ZoomIn } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useUserStore } from '../stores/userStore'
import { useResourceStore } from '../stores/resourceStore'
import { formatDateTime } from '../utils/dateTimeFormatter'
import { getModelDetail, getMediaDetail, getUserDetail } from '../utils/detailFetcher'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const requestBaseURL = request.defaults.baseURL
const router = useRouter()
const { userInfo, getUserInfo } = useUserStore()
const resourceStore = useResourceStore()
const detectionList = ref([])
const detailDialogVisible = ref(false)
const currentDetection = ref(null)

// 分页相关（默认每页 4 条）
const currentPage = ref(1)
const pageSize = ref(4)
const total = ref(0)

// 获取检测分割记录
const getDetectionRecords = async () => {
  try {
    resourceStore.detectionLoading = true

    // 使用共享的资源存储获取检测分割记录列表
    const { detections, total: totalCount, error } = await resourceStore.fetchDetectionList(
      userInfo.value,
      currentPage.value,
      pageSize.value,
      true // 强制刷新，确保获取最新数据
    )

    if (error) {
      throw error
    }

    console.info('【获取检测分割记录响应数据】', { detections, total: totalCount })

    // 处理检测记录数据，获取模型、媒体和用户的详细信息
    const processedDetections = [];
    for (const detection of detections) {
      // 创建检测记录的副本
      const processedDetection = { ...detection };

      // 获取模型详情
      if (detection.model_id) {
        const { model, error: modelError } = await getModelDetail(detection.model_id);
        if (model && !modelError) {
          processedDetection.model_name = model.model_name;
        }
      }

      // 获取媒体详情
      if (detection.media_id) {
        const { media, error: mediaError } = await getMediaDetail(detection.media_id);
        if (media && !mediaError) {
          processedDetection.media_name = media.media_name;
          processedDetection.media_type = media.file_type; // 保存媒体类型信息
        }
      }

      // 获取用户详情
      if (detection.owner_id) {
        const { user, error: userError } = await getUserDetail(detection.owner_id);
        if (user && !userError) {
          processedDetection.owner_username = user.username;
        }
      }

      processedDetections.push(processedDetection);
    }

    detectionList.value = processedDetections;
    total.value = totalCount;
  } catch (error) {
    console.error('【获取检测分割记录错误】', error)
    ElMessage.error({
      message: '【获取检测分割记录错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    resourceStore.detectionLoading = false
  }
}

// 格式化任务状态
const formatStatus = (status) => {
  const statusMap = {
    'PENDING': '待处理',
    'IN_PROGRESS': '处理中',
    'COMPLETED': '已完成',
    'FAILED': '失败'
  }
  return statusMap[status] || status
}

// 任务状态标签类型
const statusType = (status) => {
  const typeMap = {
    'PENDING': 'warning',
    'IN_PROGRESS': 'info',
    'COMPLETED': 'success',
    'FAILED': 'danger'
  }
  return typeMap[status] || ''
}

// 任务状态筛选方法
const filterStatus = (value, row) => {
  return row.status === value
}

// 获取所有任务状态作为筛选选项
const statusFilters = [
  { text: '待处理', value: 'PENDING' },
  { text: '处理中', value: 'IN_PROGRESS' },
  { text: '已完成', value: 'COMPLETED' },
  { text: '失败', value: 'FAILED' }
]

// 格式化病害等级
const formatDiseaseGrade = (grade) => {
  const gradeMap = {
    'MILD': '轻度',
    'MODERATE': '中度',
    'SEVERE': '重度',
    'CRITICAL': '严重'
  }
  return gradeMap[grade] || grade
}

// 病害等级标签类型
const diseaseGradeType = (grade) => {
  const typeMap = {
    'MILD': 'success',
    'MODERATE': 'warning',
    'SEVERE': 'danger',
    'CRITICAL': 'danger'
  }
  return typeMap[grade] || ''
}

// 获取所有病害等级作为筛选选项
const diseaseGradeFilters = [
  { text: '轻度', value: 'MILD' },
  { text: '中度', value: 'MODERATE' },
  { text: '重度', value: 'SEVERE' },
  { text: '严重', value: 'CRITICAL' }
]

// 病害等级筛选方法
const filterDiseaseGrade = (value, row) => {
  return row.disease_grade === value
}

// 格式化日期时间
const dataTimeFormatter = (row, column) => {
  return formatDateTime(row.updated_at); // 使用通用的日期时间格式化工具函数
}

// 用户名筛选方法
const filterOwnerUsername = (value, row) => {
  return row.owner_username === value
}

// 获取所有用户名作为筛选选项
const ownerUsernameFilters = computed(() => {
  // 从检测记录列表中提取不重复的用户名
  const uniqueOwners = [...new Set(detectionList.value.map(item => item.owner_username))]
  return uniqueOwners.map(owner => ({ text: owner, value: owner }))
})

// 查看病害指标详情
const viewDetectionDetail = (detection) => {
  currentDetection.value = detection
  detailDialogVisible.value = true
  console.info('【查看病害指标详情】', detection)
}

// 关闭详情对话框
const closeDetailDialog = () => {
  detailDialogVisible.value = false
  currentDetection.value = null
}

// 删除检测记录
const deleteDetection = async (detection_id) => {
  try {
    // await request.delete(`/detection/${detection_id}`)
    ElMessage.success('删除成功')
    // 重新获取列表
    getDetectionRecords()
  } catch (error) {
    console.error('删除检测记录失败', error)
    ElMessage.error('删除检测记录失败，请重试')
  }
}

onMounted(() => {
  // 先获取用户信息，防止未登录用户能够直接访问该页面
  getUserInfo().then(() => {
    if (userInfo.value) {
      getDetectionRecords()
    } else {
      router.push('/login')
    }
  })
})
</script>

<template>
  <div class="detection-records-container">
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

        <!-- 检测记录列表 -->
        <el-card class="records-card">
          <template #header>
            <div class="card-header">
              <h2>检测分割记录</h2>
              <el-button type="primary" size="small" @click="getDetectionRecords"
                :loading="resourceStore.detectionLoading.value">
                刷新数据
              </el-button>
            </div>
          </template>

          <el-table :data="detectionList" style="width: 100%" v-loading="resourceStore.detectionLoading.value">
            <el-table-column prop="detection_id" label="ID" width="63" />
            <el-table-column prop="model_name" label="使用模型" sortable show-overflow-tooltip />
            <el-table-column prop="media_name" label="检测媒体" sortable show-overflow-tooltip />
            <el-table-column prop="status" label="任务状态" width="94" :filters="statusFilters"
              :filter-method="filterStatus">
              <template #default="scope">
                <el-tag :type="statusType(scope.row.status)">
                  {{ formatStatus(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="disease_severity_score" label="严重性得分" width="118" sortable />
            <el-table-column prop="disease_grade" label="病害等级" width="94" :filters="diseaseGradeFilters"
              :filter-method="filterDiseaseGrade">
              <template #default="scope">
                <el-tag :type="diseaseGradeType(scope.row.disease_grade)">
                  {{ formatDiseaseGrade(scope.row.disease_grade) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="检测分割结果">
              <template #default="scope">
                <!-- 图片结果 -->
                <el-image
                  v-if="scope.row.result_path && ['png', 'jpg', 'jpeg'].includes(scope.row.media_type?.toLowerCase() || '')"
                  style="width: 97px; height: 97px" :src="`${requestBaseURL}/${scope.row.result_path}`"
                  :preview-src-list="[`${requestBaseURL}/${scope.row.result_path}`]" fit="contain" />
                <!-- 视频结果 -->
                <video v-else-if="scope.row.result_path && ['mp4'].includes(scope.row.media_type?.toLowerCase() || '')"
                  style="width: 140px; height: 140px" controls :src="`${requestBaseURL}/${scope.row.result_path}`">
                  您的浏览器不支持视频播放
                </video>
                <!-- 无结果 -->
                <el-tag v-else type="info">暂无结果</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updated_at" label="检测分割时间" width="180" sortable :formatter="dataTimeFormatter" />
            <el-table-column prop="owner_username" label="所属用户" width="118" sortable :filters="ownerUsernameFilters"
              :filter-method="filterOwnerUsername" />
            <el-table-column label="操作" width="227" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="viewDetectionDetail(scope.row)">
                  <el-icon>
                    <ZoomIn />
                  </el-icon>
                  查看详情
                </el-button>
                <el-button type="danger" size="small" @click="deleteDetection(scope.row.detection_id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
              layout="total, prev, pager, next, jumper" :total="total" @current-change="getDetectionRecords" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 病害指标详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="病害指标详情" width="800px" @close="closeDetailDialog" destroy-on-close>
      <div v-if="currentDetection" class="detection-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="病害数量" :span="1">{{currentDetection.disease_count}}</el-descriptions-item>
          <el-descriptions-item label="病害周长（像素）" :span="1">{{currentDetection.disease_perimeter}}</el-descriptions-item>
          <el-descriptions-item label="病害面积（像素）" :span="1">{{currentDetection.disease_area}}</el-descriptions-item>
          <el-descriptions-item label="形状复杂度" :span="1">{{currentDetection.shape_complexity}}</el-descriptions-item>
          <el-descriptions-item label="纹理粗糙度" :span="1">{{currentDetection.texture_roughness}}</el-descriptions-item>
          <el-descriptions-item label="严重性得分" :span="1">{{currentDetection.disease_severity_score}}</el-descriptions-item>
          <el-descriptions-item label="病害等级" :span="1">
            <el-tag :type="diseaseGradeType(currentDetection.disease_grade)">
              {{ formatDiseaseGrade(currentDetection.disease_grade) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 检测结果展示 -->
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDetailDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.detection-records-container {
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
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  border-radius: 20px;
  background-color: #f8fafc;
  background-image: linear-gradient(135deg, #f8fafc 0%, #e6f2ff 100%);
}

.records-card {
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 覆盖表格单元格的 z-index 设置，解决预览与表格层级冲突问题 */
:deep(.el-table .el-table__cell) {
  z-index: auto !important;
}

/* 详情对话框样式 */
.detection-detail {
  padding: 10px;
}

.result-section,
.stats-section {
  margin-top: 20px;
}

.result-section h3,
.stats-section h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #409EFF;
  border-left: 3px solid #409EFF;
  padding-left: 10px;
}

.result-content {
  display: flex;
  justify-content: center;
  margin: 15px 0;
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 10px;
}

.detection-params,
.detection-stats {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  white-space: pre-wrap;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
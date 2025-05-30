<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ZoomIn, Delete, Document } from '@element-plus/icons-vue'
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

// 搜索表单
const searchForm = ref({
  keyword: '',
  start_date: '',
  end_date: '',
})

// 判断用户角色
const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
const isDeveloper = computed(() => userInfo.value?.role === 'DEVELOPER')
const isAdminOrDeveloper = computed(() => isAdmin.value || isDeveloper.value)

// 分页相关（默认每页 3 条）
const currentPage = ref(1)
const pageSize = ref(3)
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
      true, // 强制刷新，确保获取最新数据
    )

    if (error) {
      throw error
    }

    console.info('【获取检测分割记录响应数据】', { detections, total: totalCount })

    // 应用搜索过滤
    let filteredDetections = detections

    // 判断是否有筛选条件
    const hasFilters = searchForm.value.keyword || searchForm.value.start_date || searchForm.value.end_date

    // 关键词搜索（模糊搜索多个字段）
    if (searchForm.value.keyword) {
      const keyword = searchForm.value.keyword.toLowerCase()
      filteredDetections = filteredDetections.filter(detection => {
        // 确保每个字段在比较前转换为字符串并转为小写
        const detectionId = detection.detection_id ? detection.detection_id.toString().toLowerCase() : ''
        const modelId = detection.model_id ? detection.model_id.toString().toLowerCase() : ''
        const modelName = detection.model_name ? detection.model_name.toLowerCase() : ''
        const mediaId = detection.media_id ? detection.media_id.toString().toLowerCase() : ''
        const mediaName = detection.media_name ? detection.media_name.toLowerCase() : ''
        const ownerId = detection.owner_id ? detection.owner_id.toString().toLowerCase() : ''
        const ownerName = detection.owner_username ? detection.owner_username.toLowerCase() : ''
        const status = detection.status ? detection.status.toLowerCase() : ''
        const diseaseGrade = detection.disease_grade ? detection.disease_grade.toLowerCase() : ''
        
        // 检查每个字段是否包含关键词
        return (
          detectionId.includes(keyword) ||
          modelId.includes(keyword) ||
          modelName.includes(keyword) ||
          mediaId.includes(keyword) ||
          mediaName.includes(keyword) ||
          ownerId.includes(keyword) ||
          ownerName.includes(keyword) ||
          status.includes(keyword) ||
          diseaseGrade.includes(keyword)
        )
      })
    }

    // 日期范围过滤
    if (searchForm.value.start_date) {
      const startDate = new Date(searchForm.value.start_date)
      // 直接使用用户选择的完整时间（包含时分秒）
      filteredDetections = filteredDetections.filter(detection => {
        const detectionDate = new Date(detection.updated_at)
        const adjustedDetectionDate = new Date(detectionDate.getTime() - 8 * 60 * 60 * 1000)
        return adjustedDetectionDate >= startDate
      })
    }
    if (searchForm.value.end_date) {
      const endDate = new Date(searchForm.value.end_date)
      // 直接使用用户选择的完整时间（包含时分秒）
      filteredDetections = filteredDetections.filter(detection => {
        const detectionDate = new Date(detection.updated_at)
        const adjustedDetectionDate = new Date(detectionDate.getTime() - 8 * 60 * 60 * 1000)
        return adjustedDetectionDate <= endDate
      })
    }

    detectionList.value = filteredDetections
    total.value = hasFilters ? filteredDetections.length : totalCount
  } catch (error) {
    console.error('【获取检测分割记录错误】', error)
    ElMessage.error({
      message: '【获取检测分割记录错误】' + (error?.message || '请重试'),
      duration: 5000,
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
    'FAILED': '失败',
  }
  return statusMap[status] || status
}

// 任务状态标签类型
const statusType = (status) => {
  const typeMap = {
    'PENDING': 'warning',
    'IN_PROGRESS': 'info',
    'COMPLETED': 'success',
    'FAILED': 'danger',
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
  { text: '失败', value: 'FAILED' },
]

// 格式化病害等级
const formatDiseaseGrade = (grade) => {
  const gradeMap = {
    'MILD': '轻度',
    'MODERATE': '中度',
    'SEVERE': '重度',
    'CRITICAL': '严重',
  }
  return gradeMap[grade] || grade
}

// 病害等级标签类型
const diseaseGradeType = (grade) => {
  const typeMap = {
    'MILD': 'info',
    'MODERATE': 'success',
    'SEVERE': 'warning',
    'CRITICAL': 'danger',
  }
  return typeMap[grade] || ''
}

// 获取所有病害等级作为筛选选项
const diseaseGradeFilters = [
  { text: '轻度', value: 'MILD' },
  { text: '中度', value: 'MODERATE' },
  { text: '重度', value: 'SEVERE' },
  { text: '严重', value: 'CRITICAL' },
]

// 病害等级筛选方法
const filterDiseaseGrade = (value, row) => {
  return row.disease_grade === value
}

// 格式化日期时间
const dataTimeFormatter = (row, column) => {
  return formatDateTime(row[column.property]) // 使用通用的日期时间格式化工具函数
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
}

// 关闭详情对话框
const closeDetailDialog = () => {
  detailDialogVisible.value = false
  currentDetection.value = null
}

// 删除检测记录
const deleteDetection = async (detection_id) => {
  try {
    // 使用确认对话框防止误删除
    await ElMessageBox.confirm(
      '确定要删除该检测分割记录吗？删除后将无法恢复！',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    // 显示加载状态
    resourceStore.detectionLoading = true

    // 发送删除请求
    const data = await request.get(`/detection/delete/${detection_id}`)
    console.info('【删除检测分割记录响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断删除是否成功
    if (data && operation && operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【删除检测分割记录成功】',
        duration: 3000,
      })
      getDetectionRecords() // 重新获取列表
    }
    // 删除失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消删除，不做任何操作
      return
    }
    console.error('【删除检测分割记录错误】', error)
    ElMessage.error({
      message: '【删除检测分割记录错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    resourceStore.detectionLoading = false
  }
}

// 导出检测分割记录
const exportDetections = async () => {
  try {
    resourceStore.detectionLoading = true

    // 创建一个工作簿
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // 准备数据
    const exportData = detectionList.value.map(detection => ({
      'ID': detection.detection_id,
      '使用模型': detection.model_name || '',
      '检测媒体': detection.media_name || '',
      '任务状态': formatStatus(detection.status),
      '严重性得分': detection.disease_severity_score,
      '病害等级': formatDiseaseGrade(detection.disease_grade),
      '病害数量': detection.disease_count,
      '病害周长': detection.disease_perimeter,
      '病害面积': detection.disease_area,
      '形状复杂度': detection.shape_complexity,
      '纹理粗糙度': detection.texture_roughness,
      '裂缝宽度': detection.crack_width,
      '平均色调': detection.avg_hue,
      '检测耗时（ms）': detection.detection_duration,
      '帧平均耗时（）ms）': detection.avg_frame_detection_duration,
      '所属用户': detection.owner_username || '',
      '检测分割时间': formatDateTime(detection.updated_at),
    }))

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exportData)

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "检测分割记录")

    // 生成带年月日时分秒的文件名
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`

    // 导出 Excel 文件
    XLSX.writeFile(wb, `桥梁病害检测与分割系统检测记录_${timestamp}.xlsx`)

    ElMessage.success({
      message: '【导出检测分割记录成功】',
      duration: 3000,
    })
  } catch (error) {
    console.error('【导出检测分割记录错误】', error)
    ElMessage.error({
      message: '【导出检测分割记录错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    resourceStore.detectionLoading = false
  }
}

// 清空所有检测记录
const clearDetections = async () => {
  try {
    resourceStore.detectionLoading = true

    const data = await request.get('/detection/clear')
    console.info('【清空检测分割记录响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断清空是否成功
    if (data && operation && operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【清空检测分割记录成功】',
        duration: 3000,
      })
      getDetectionRecords()
    }
  } catch (error) {
    console.error('【清空检测分割记录错误】', error)
    ElMessage.error({
      message: '【清空检测分割记录错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    resourceStore.detectionLoading = false
  }
}

// 确认清空所有检测记录
const confirmClearDetections = () => {
  ElMessageBox.confirm(
    '确定要清空所有检测分割记录吗？此操作不可恢复！',
    '清空确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    },
  ).then(() => {
    clearDetections()
  }).catch(() => {
    ElMessage.info({
      message: '【已取消清空检测分割记录】',
      duration: 2000,
    })
  })
}

// 重置搜索表单
const resetSearchForm = () => {
  searchForm.value = {
    keyword: '',
    start_date: '',
    end_date: '',
  }
  getDetectionRecords()
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
              <div>
                <el-button type="success" @click="exportDetections" :icon="Document">
                  导出记录
                </el-button>
                <el-button type="danger" @click="confirmClearDetections" :icon="Delete" v-if="isAdminOrDeveloper">
                  清空记录
                </el-button>
                <el-button type="primary" size="small" @click="getDetectionRecords"
                  :loading="resourceStore.detectionLoading.value">
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>

          <!-- 搜索表单 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="关键词搜索">
              <el-input v-model="searchForm.keyword" placeholder="搜索ID/模型/媒体/用户等" clearable style="width: 300px" />
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker v-model="searchForm.start_date" type="datetime" placeholder="开始日期时间" format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss" clearable style="width: 200px" />
              <span class="date-separator">至</span>
              <el-date-picker v-model="searchForm.end_date" type="datetime" placeholder="结束日期时间" format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="getDetectionRecords">搜索</el-button>
              <el-button @click="resetSearchForm">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="detectionList" style="width: 100%" v-loading="resourceStore.detectionLoading.value">
            <el-table-column prop="detection_id" label="ID" width="63" />
            <el-table-column prop="model_name" label="使用模型" width="104" sortable show-overflow-tooltip />
            <el-table-column prop="media_name" label="检测媒体" width="104" sortable show-overflow-tooltip />
            <el-table-column prop="status" label="任务状态" width="118" sortable :filters="statusFilters"
              :filter-method="filterStatus">
              <template #default="scope">
                <el-tag :type="statusType(scope.row.status)">
                  {{ formatStatus(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="disease_severity_score" label="严重性得分" width="118" sortable />
            <el-table-column prop="disease_grade" label="病害等级" width="118" sortable :filters="diseaseGradeFilters"
              :filter-method="filterDiseaseGrade">
              <template #default="scope">
                <el-tag :type="diseaseGradeType(scope.row.disease_grade)">
                  {{ formatDiseaseGrade(scope.row.disease_grade) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="检测分割结果" width="230">
              <template #default="scope">
                <!-- 图片结果 -->
                <el-image
                  v-if="scope.row.result_path && ['png', 'jpg', 'jpeg'].includes(scope.row.media_type?.toLowerCase() || '')"
                  style="width: 50%; height: 50%" :src="`${requestBaseURL}/file/${scope.row.result_path}`"
                  :preview-src-list="[`${requestBaseURL}/file/${scope.row.result_path}`]" fit="contain" />
                <!-- 视频结果 -->
                <video v-else-if="scope.row.result_path && ['mp4'].includes(scope.row.media_type?.toLowerCase() || '')"
                  style="width: 100%; height: 50%" controls :src="`${requestBaseURL}/file/${scope.row.result_path}`">
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
                <el-button type="danger" size="small" @click="deleteDetection(scope.row.detection_id)" v-if="isAdminOrDeveloper">
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
          <el-descriptions-item label="病害数量" :span="1">{{ currentDetection.disease_count }}</el-descriptions-item>
          <el-descriptions-item label="病害周长（像素）" :span="1">{{ currentDetection.disease_perimeter
          }}</el-descriptions-item>
          <el-descriptions-item label="病害面积（像素）" :span="1">{{ currentDetection.disease_area }}</el-descriptions-item>
          <el-descriptions-item label="形状复杂度（0~1）" :span="1">{{ currentDetection.shape_complexity
          }}</el-descriptions-item>
          <el-descriptions-item label="纹理粗糙度（0~1020）" :span="1">{{ currentDetection.texture_roughness
          }}</el-descriptions-item>
          <el-descriptions-item label="裂缝宽度（像素）" :span="1">{{ currentDetection.crack_width }}</el-descriptions-item>
          <el-descriptions-item label="平均色调（0~179）" :span="1">{{ currentDetection.avg_hue }}</el-descriptions-item>
          <el-descriptions-item label="严重性得分（0~1）" :span="1">{{
            currentDetection.disease_severity_score }}</el-descriptions-item>
          <el-descriptions-item label="耗时（ms）" :span="1">{{
            currentDetection.detection_duration }}</el-descriptions-item>
          <el-descriptions-item label="帧平均耗时（ms）" :span="1">{{
            currentDetection.avg_frame_detection_duration }}</el-descriptions-item>
        </el-descriptions>
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

/* 搜索表单样式 */
.search-form {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.date-separator {
  margin: 0 5px;
  line-height: 32px;
}
</style>
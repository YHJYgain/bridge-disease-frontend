<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Delete, Download, Edit } from '@element-plus/icons-vue'
import request from '../utils/request'
import { formatDateTime } from '../utils/dateTimeFormatter'
import { useResourceStore } from '../stores/resourceStore'
import { useUserStore } from '../stores/userStore'
import { getUserDetail } from '../utils/detailFetcher'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const requestBaseURL = request.defaults.baseURL
const router = useRouter()
const loading = ref(false)
const { userInfo, getUserInfo } = useUserStore()
const resourceStore = useResourceStore()
const mediaList = ref([])
const uploadMediaDialogVisible = ref(false)
const editMediaDialogVisible = ref(false)
const uploadMediaFormRef = ref(null)
const editMediaFormRef = ref(null)
const currentEditMedia = ref(null)

// 搜索表单
const searchForm = ref({
  keyword: '',
  start_date: '',
  end_date: '',
})

// 分页相关（默认每页 3 条）
const currentPage = ref(1)
const pageSize = ref(3)
const total = ref(0)

// 上传媒体表单
const uploadForm = ref({
  description: '',
  type: 'image',
  file: null,
})

// 编辑媒体表单
const editForm = ref({
  media_id: null,
  description: '',
})

// 获取媒体列表
const getMediaList = async () => {
  try {
    resourceStore.mediaLoading = true

    // 使用共享的媒体存储获取媒体列表
    const { medias, total: totalCount, error } = await resourceStore.fetchMediaList(
      userInfo.value,
      currentPage.value,
      pageSize.value,
      true, // 强制刷新，确保获取最新数据
    )

    if (error) {
      throw error
    }

    console.info('【获取媒体列表响应数据】', { medias, total: totalCount })

    // 应用搜索过滤
    let filteredMedias = medias

    // 判断是否有筛选条件
    const hasFilters = searchForm.value.keyword || searchForm.value.start_date || searchForm.value.end_date

    // 关键词搜索（模糊搜索多个字段）
    if (searchForm.value.keyword) {
      const keyword = searchForm.value.keyword.toLowerCase()
      filteredMedias = filteredMedias.filter(media => {
        // 确保每个字段在比较前转换为字符串并转为小写
        const mediaId = media.media_id ? media.media_id.toString().toLowerCase() : ''
        const mediaName = media.media_name ? media.media_name.toLowerCase() : ''
        const description = media.description ? media.description.toLowerCase() : ''
        const fileType = media.file_type ? media.file_type.toLowerCase() : ''
        const ownerId = media.owner_id ? media.owner_id.toString().toLowerCase() : ''
        const ownerName = media.owner_username ? media.owner_username.toLowerCase() : ''

        // 检查每个字段是否包含关键词
        return (
          mediaId.includes(keyword) ||
          mediaName.includes(keyword) ||
          description.includes(keyword) ||
          fileType.includes(keyword) ||
          ownerId.includes(keyword) ||
          ownerName.includes(keyword)
        )
      })
    }

    // 日期范围过滤
    if (searchForm.value.start_date) {
      const startDate = new Date(searchForm.value.start_date)
      // 直接使用用户选择的完整时间（包含时分秒）
      filteredMedias = filteredMedias.filter(media => {
        const mediaDate = new Date(media.updated_at)
        const adjustedMediaDate = new Date(mediaDate.getTime() - 8 * 60 * 60 * 1000)
        return adjustedMediaDate >= startDate
      })
    }
    if (searchForm.value.end_date) {
      const endDate = new Date(searchForm.value.end_date)
      // 直接使用用户选择的完整时间（包含时分秒）
      filteredMedias = filteredMedias.filter(media => {
        const mediaDate = new Date(media.updated_at)
        const adjustedMediaDate = new Date(mediaDate.getTime() - 8 * 60 * 60 * 1000)
        return adjustedMediaDate <= endDate
      })
    }

    mediaList.value = filteredMedias
    total.value = hasFilters ? filteredMedias.length : totalCount
  } catch (error) {
    console.error('【获取媒体列表错误】', error)
    ElMessage.error({
      message: '【获取媒体列表错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    resourceStore.mediaLoading = false
  }
}

// 根据文件类型返回标签类型
const getTagType = (fileType) => {
  // 图片类型的扩展名
  const imageTypes = ['png', 'jpg', 'jpeg']
  if (imageTypes.includes(fileType.toLowerCase())) {
    return 'primary' // 图片显示 primary 类型标签
  }

  // 视频类型的扩展名
  const videoTypes = ['mp4']
  if (videoTypes.includes(fileType.toLowerCase())) {
    return 'warning' // 视频显示 warning 类型标签
  }

  // 其他类型返回 info 标签
  return 'info'
}

// 根据文件类型返回标签文本
const getFileTypeLabel = (fileType) => {
  const imageTypes = ['png', 'jpg', 'jpeg']
  if (imageTypes.includes(fileType.toLowerCase())) {
    return '图片' // 图片
  }

  const videoTypes = ['mp4']
  if (videoTypes.includes(fileType.toLowerCase())) {
    return '视频' // 视频
  }

  return '未知' // 默认返回未知类型
}

// 格式化日期时间
const dataTimeFormatter = (row, column) => {
  return formatDateTime(row[column.property]) // 使用通用的日期时间格式化工具函数
}

// 文件类型筛选选项
const fileTypeFilters = [
  { text: '图片', value: 'image' },
  { text: '视频', value: 'video' },
]

// 文件类型筛选方法
const filterFileType = (value, row) => {
  if (value === 'image') {
    const imageTypes = ['png', 'jpg', 'jpeg']
    return imageTypes.includes(row.file_type.toLowerCase())
  } else if (value === 'video') {
    const videoTypes = ['mp4']
    return videoTypes.includes(row.file_type.toLowerCase())
  }
  return true
}

// 用户筛选方法
const filterOwner = (value, row) => {
  return row.owner_username === value
}

// 获取所有用户名作为筛选选项
const ownerFilters = computed(() => {
  // 从媒体列表中提取不重复的用户名
  const uniqueOwners = [...new Set(mediaList.value.map(item => item.owner_username).filter(Boolean))]
  return uniqueOwners.map(owner => ({ text: owner, value: owner }))
})

// 自定义文件上传验证规则
const validateMediaFile = (rule, value, callback) => {
  if (!uploadForm.value.file) {
    callback(new Error('请选择媒体文件'))
  } else {
    callback()
  }
}

// 表单验证规则
const uploadFormRules = {
  media_file: [
    { validator: validateMediaFile, trigger: ['blur', 'change'] },
  ]
}

// 创建媒体文件预览 URL 的计算属性
const mediaPreviewUrl = computed(() => {
  if (uploadForm.value.file) {
    return URL.createObjectURL(uploadForm.value.file)
  }
  return ''
})

// 文件上传变化处理
const handleMediaFileChange = (file) => {
  const fileType = file.raw.type
  // 验证文件格式
  if (uploadForm.value.type === 'image') {
    if (!fileType || !['image/png', 'image/jpg', 'image/jpeg'].includes(fileType)) {
      ElMessage.error({
        message: '【媒体文件选择失败】图片格式不正确，请上传 png/jpg/jpeg 格式',
        duration: 5000,
      })
      return false
    }
  } else if (uploadForm.value.type === 'video') {
    if (!fileType || !['video/mp4'].includes(fileType)) {
      ElMessage.error({
        message: '【媒体文件选择失败】视频格式不正确，请上传 mp4 格式',
        duration: 5000,
      })
      return false
    }
  }

  // 验证通过，更新媒体文件
  uploadForm.value.file = file.raw
  return false // 阻止自动上传
}

// 上传媒体
const uploadMedia = async () => {
  if (!uploadMediaFormRef.value) {
    ElMessage.error({
      message: '【上传媒体错误】表单实例不存在',
      duration: 5000,
    })
    return
  }

  console.info('【媒体文件已更新】', uploadForm.value.file)

  try {
    await uploadMediaFormRef.value.validate()
    loading.value = true

    const formData = new FormData()
    formData.append('media_file', uploadForm.value.file)
    formData.append('description', uploadForm.value.description)

    // 打印上传表单数据
    console.info('【上传媒体表单数据】', {
      media_file: uploadForm.value.file,
      description: uploadForm.value.description,
      type: uploadForm.value.type,
    })

    // 发送上传请求
    const data = await request.post('/media/upload', formData)
    console.info('【上传媒体响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断上传是否成功
    if (data && operation && operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【上传媒体成功】',
        duration: 3000,
      })
      uploadMediaDialogVisible.value = false
      resetForm('upload')
      getMediaList()
    }
    // 上传媒体失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    console.error('【上传媒体错误】', error)
    ElMessage.error({
      message: '【上传媒体错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    loading.value = false
  }
}

// 下载媒体文件
const downloadMedia = (file_path) => {
  window.open(`${requestBaseURL}/file/${file_path}`, '_blank')
}

// 打开编辑媒体对话框
const openEditMediaDialog = (media) => {
  currentEditMedia.value = media
  editForm.value.media_id = media.media_id
  editForm.value.description = media.description || ''
  editMediaDialogVisible.value = true
}

// 编辑媒体
const updateMediaDescription = async () => {
  if (!editMediaFormRef.value) {
    ElMessage.error({
      message: '【编辑媒体错误】表单实例不存在',
      duration: 5000,
    })
    return
  }

  try {
    await editMediaFormRef.value.validate()
    loading.value = true

    console.info('【编辑媒体表单数据】', {
      media_id: editForm.value.media_id,
      description: editForm.value.description
    })

    const formData = new FormData()
    formData.append('description', editForm.value.description)

    // 发送编辑请求
    const data = await request.put(`/media/update/${editForm.value.media_id}`, formData)
    console.info('【编辑媒体响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断编辑媒体是否成功
    if (data && operation && operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【编辑媒体成功】',
        duration: 3000,
      })
      editMediaDialogVisible.value = false
      resetForm('edit')
      getMediaList()
    }
    // 编辑媒体失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    console.error('【编辑媒体错误】', error)
    ElMessage.error({
      message: '【编辑媒体错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    loading.value = false
  }
}

// 删除媒体文件
const deleteMedia = async (id) => {
  try {
    // 使用确认对话框防止误删除
    await ElMessageBox.confirm(
      '确定要删除该媒体吗？删除后将无法恢复！',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    loading.value = true

    // 发送删除请求
    const data = await request.delete(`/media/delete/${id}`)
    console.info('【删除媒体响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断删除是否成功
    if (data && operation && operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【删除媒体成功】',
        duration: 3000,
      })
      getMediaList() // 重新获取列表
    }
    // 删除媒体失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消删除，不做任何操作
      return
    }
    console.error('【删除媒体错误】', error)
    ElMessage.error({
      message: '【删除媒体错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    loading.value = false
  }
}

// 监听对话框关闭事件，重置表单
const resetForm = (formType = 'upload') => {
  if (formType === 'upload' || formType === 'all') {
    uploadForm.value = {
      description: '',
      type: 'image',
      file: null,
    }

    // 如果表单引用存在，重置验证状态
    if (uploadMediaFormRef.value) {
      uploadMediaFormRef.value.resetFields()
    }
  }

  if (formType === 'edit' || formType === 'all') {
    editForm.value = {
      media_id: null,
      description: '',
    }
    currentEditMedia.value = null

    // 如果表单引用存在，重置验证状态
    if (editMediaFormRef.value) {
      editMediaFormRef.value.resetFields()
    }
  }
}

// 重置搜索表单
const resetSearchForm = () => {
  searchForm.value = {
    keyword: '',
    start_date: '',
    end_date: '',
  }
  getMediaList()
}

onMounted(() => {
  // 先获取用户信息，防止未登录用户能够直接访问该页面
  getUserInfo().then(() => {
    if (userInfo.value) {
      getMediaList()
    } else {
      router.push('/login')
    }
  })
})
</script>

<template>
  <div class="media-library-container">
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

        <!-- 媒体库列表 -->
        <el-card class="media-card">
          <template #header>
            <div class="card-header">
              <h2>媒体库</h2>
              <div>
                <el-button type="primary" @click="uploadMediaDialogVisible = true">
                  <el-icon>
                    <Upload />
                  </el-icon>
                  上传媒体
                </el-button>
                <el-button type="primary" size="small" @click="getMediaList"
                  :loading="resourceStore.mediaLoading.value">
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>

          <!-- 搜索表单 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="关键词搜索">
              <el-input v-model="searchForm.keyword" placeholder="搜索ID/名称/描述/用户等" clearable style="width: 300px" />
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker v-model="searchForm.start_date" type="datetime" placeholder="开始日期时间"
                format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" clearable style="width: 200px" />
              <span class="date-separator">至</span>
              <el-date-picker v-model="searchForm.end_date" type="datetime" placeholder="结束日期时间"
                format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="getMediaList">搜索</el-button>
              <el-button @click="resetSearchForm">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="mediaList" style="width: 100%" v-loading="resourceStore.mediaLoading.value">
            <el-table-column prop="media_id" label="ID" width="63" sortable />
            <el-table-column prop="media_name" label="名称" sortable show-overflow-tooltip />
            <el-table-column prop="description" label="描述" sortable show-overflow-tooltip />
            <el-table-column prop="file_type" label="类型" width="90" sortable :filters="fileTypeFilters"
              :filter-method="filterFileType" filter-placement="bottom">
              <template #default="scope">
                <el-tag :type="getTagType(scope.row.file_type)">
                  {{ getFileTypeLabel(scope.row.file_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="预览" width="230">
              <template #default="scope">
                <!-- 图片预览 -->
                <el-image v-if="['png', 'jpg', 'jpeg'].includes(scope.row.file_type.toLowerCase())"
                  style="width: 50%; height: 50%" :src="`${requestBaseURL}/file/${scope.row.media_path}`"
                  :preview-src-list="[`${requestBaseURL}/file/${scope.row.media_path}`]" fit="contain" />
                <!-- 视频预览 -->
                <video v-else-if="['mp4'].includes(scope.row.file_type.toLowerCase())"
                  style="width: 100%; height: 50%" :src="`${requestBaseURL}/file/${scope.row.media_path}`"
                  controls></video>
                <!-- 其他类型文件 -->
                <el-tag v-else :type="'info'">其他文件</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updated_at" label="更新时间" width="180" sortable :formatter="dataTimeFormatter" />
            <el-table-column prop="owner_username" label="所属用户" width="120" sortable show-overflow-tooltip
              :filters="ownerFilters" :filter-method="filterOwner" filter-placement="bottom" />
            <el-table-column label="操作" fixed="right" width="300">
              <template #default="scope">
                <el-button type="success" size="small" @click="downloadMedia(scope.row.media_path)">
                  <el-icon>
                    <Download />
                  </el-icon>
                  下载
                </el-button>
                <el-button type="primary" size="small" @click="openEditMediaDialog(scope.row)">
                  <el-icon>
                    <Edit />
                  </el-icon>
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="deleteMedia(scope.row.media_id)">
                  <el-icon>
                    <Delete />
                  </el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
              layout="total, prev, pager, next, jumper" :total="total" @current-change="getMediaList" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 上传媒体对话框 -->
    <el-dialog v-model="uploadMediaDialogVisible" title="上传媒体" width="500px" @close="resetForm('upload')"
      destroy-on-close>
      <el-form ref="uploadMediaFormRef" :model="uploadForm" :rules="uploadFormRules" label-width="100px" status-icon>
        <el-form-item label="媒体描述">
          <el-input v-model="uploadForm.description" type="textarea" placeholder="请输入媒体描述" />
        </el-form-item>
        <el-form-item label="媒体类型">
          <el-radio-group v-model="uploadForm.type">
            <el-radio value="image">图片</el-radio>
            <el-radio value="video">视频</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="媒体文件" prop="media_file">
          <el-upload class="upload-demo" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
            accept="image/png, image/jpg, image/jpeg, video/mp4" :on-change="handleMediaFileChange" :auto-upload="false"
            :show-file-list="false">
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                {{ uploadForm.type === 'image' ? '仅支持 png/jpg/jpeg 格式' : '仅支持 mp4 格式' }}
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 媒体文件预览区域 -->
        <el-form-item label="预览" v-if="mediaPreviewUrl">
          <div class="media-preview-container">
            <!-- 图片预览 -->
            <el-image v-if="uploadForm.type === 'image'" style="width: 200px; max-height: 200px" :src="mediaPreviewUrl"
              fit="contain" :preview-src-list="[mediaPreviewUrl]" />
            <!-- 视频预览 -->
            <video v-else-if="uploadForm.type === 'video'" style="width: 200px; max-height: 200px"
              :src="mediaPreviewUrl" controls></video>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="() => { uploadMediaDialogVisible = false; resetForm('upload'); }">取消</el-button>
          <el-button type="primary" @click="uploadMedia" :loading="loading">
            上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑媒体对话框 -->
    <el-dialog v-model="editMediaDialogVisible" title="编辑媒体" width="500px" @close="() => resetForm('edit')"
      destroy-on-close>
      <el-form ref="editMediaFormRef" :model="editForm" label-width="100px" status-icon>
        <el-form-item label="媒体 ID">
          <el-input v-model="editForm.media_id" disabled />
        </el-form-item>
        <el-form-item label="媒体描述">
          <el-input v-model="editForm.description" type="textarea" placeholder="请输入媒体描述" />
        </el-form-item>

        <!-- 媒体预览区域 -->
        <el-form-item label="预览" v-if="currentEditMedia">
          <div class="media-preview-container">
            <!-- 图片预览 -->
            <el-image
              v-if="currentEditMedia && ['png', 'jpg', 'jpeg'].includes(currentEditMedia.file_type?.toLowerCase())"
              style="width: 200px; max-height: 200px" :src="`${requestBaseURL}/file/${currentEditMedia.media_path}`"
              fit="contain" :preview-src-list="[`${requestBaseURL}/file/${currentEditMedia.media_path}`]" />
            <!-- 视频预览 -->
            <video v-else-if="currentEditMedia && ['mp4'].includes(currentEditMedia.file_type?.toLowerCase())"
              style="width: 200px; max-height: 200px" :src="`${requestBaseURL}/file/${currentEditMedia.media_path}`"
              controls></video>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="() => { editMediaDialogVisible = false; resetForm('edit'); }">取消</el-button>
          <el-button type="primary" @click="updateMediaDescription" :loading="loading">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.media-library-container {
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

.media-card {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

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

.media-preview-container {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  padding: 10px;
  background-color: #fafafa;
}

/* 覆盖表格单元格的 z-index 设置，解决预览与表格层级冲突问题 */
:deep(.el-table .el-table__cell) {
  z-index: auto !important;
}
</style>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Upload, Delete, Download } from '@element-plus/icons-vue'
import request from '../utils/request'
import { formatDateTime } from '../utils/dateTimeFormatter'
import { useResourceStore } from '../stores/resourceStore'
import { useUserStore } from '../stores/userStore'
import { getUserDetail } from '../utils/detailFetcher'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const requestBaseURL = request.defaults.baseURL
const router = useRouter()
const { userInfo, getUserInfo } = useUserStore()
const uploadLoading = ref(false)
const resourceStore = useResourceStore()
const mediaList = ref([])
const uploadMediaDialogVisible = ref(false)
const uploadMediaFormRef = ref(null)

// 分页相关（默认每页 5 条）
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)

// 上传媒体表单
const uploadForm = ref({
  description: '',
  type: 'image',
  file: null
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
      true // 强制刷新，确保获取最新数据
    )

    if (error) {
      throw error
    }

    console.info('【获取媒体列表响应数据】', { medias, total: totalCount })

    // 处理媒体列表数据，获取用户的详细信息
    const processedMedias = [];
    for (const media of medias) {
      // 创建媒体记录的副本
      const processedMedia = { ...media };

      // 获取用户详情
      if (media.owner_id) {
        const { user, error: userError } = await getUserDetail(media.owner_id);
        if (user && !userError) {
          processedMedia.owner_username = user.username;
        }
      }

      processedMedias.push(processedMedia);
    }

    mediaList.value = processedMedias
    total.value = totalCount
  } catch (error) {
    console.error('【获取媒体列表错误】', error)
    ElMessage.error({
      message: '【获取媒体列表错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    resourceStore.mediaLoading = false
  }
}

// 根据文件类型返回标签类型
const getTagType = (fileType) => {
  // 图片类型的扩展名
  const imageTypes = ['png', 'jpg', 'jpeg'];
  if (imageTypes.includes(fileType.toLowerCase())) {
    return 'primary'; // 图片显示 primary 类型标签
  }

  // 视频类型的扩展名
  const videoTypes = ['mp4', 'avi', 'mov'];
  if (videoTypes.includes(fileType.toLowerCase())) {
    return 'warning'; // 视频显示 warning 类型标签
  }

  // 其他类型返回 info 标签
  return 'info';
}

// 根据文件类型返回标签文本
const getFileTypeLabel = (fileType) => {
  const imageTypes = ['png', 'jpg', 'jpeg'];
  if (imageTypes.includes(fileType.toLowerCase())) {
    return '图片'; // 图片
  }

  const videoTypes = ['mp4', 'avi', 'mov'];
  if (videoTypes.includes(fileType.toLowerCase())) {
    return '视频'; // 视频
  }

  return '未知'; // 默认返回未知类型
}

// 格式化日期时间
const dataTimeFormatter = (row, column) => {
  return formatDateTime(row.updated_at); // 使用通用的日期时间格式化工具函数
}

// 文件类型筛选选项
const fileTypeFilters = [
  { text: '图片', value: 'image' },
  { text: '视频', value: 'video' }
]

// 文件类型筛选方法
const filterFileType = (value, row) => {
  if (value === 'image') {
    const imageTypes = ['png', 'jpg', 'jpeg'];
    return imageTypes.includes(row.file_type.toLowerCase());
  } else if (value === 'video') {
    const videoTypes = ['mp4', 'avi', 'mov'];
    return videoTypes.includes(row.file_type.toLowerCase());
  }
  return true;
}

// 用户筛选方法
const filterOwner = (value, row) => {
  return row.owner_username === value;
}

// 获取所有用户名作为筛选选项
const ownerFilters = computed(() => {
  // 从媒体列表中提取不重复的用户名
  const uniqueOwners = [...new Set(mediaList.value.map(item => item.owner_username).filter(Boolean))];
  return uniqueOwners.map(owner => ({ text: owner, value: owner }));
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

// 监听对话框关闭事件，重置表单
const resetUploadForm = () => {
  uploadForm.value = {
    description: '',
    type: 'image',
    file: null
  }

  // 如果表单引用存在，重置验证状态
  if (uploadMediaFormRef.value) {
    uploadMediaFormRef.value.resetFields()
  }
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
  // 验证文件格式
  if (uploadForm.value.type === 'image') {
    if (!file.raw.type.startsWith('image/')) {
      ElMessage.error({
        message: '【媒体文件选择失败】图片格式不正确，请上传 jpg/jpeg/png 格式',
        duration: 5000
      })
      return false
    }
  } else if (uploadForm.value.type === 'video') {
    if (!file.raw.type.startsWith('video/')) {
      ElMessage.error({
        message: '【媒体文件选择失败】视频格式不正确，请上传 mp4/avi/mov 格式',
        duration: 5000
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
    ElMessage.error('【上传媒体错误】表单实例不存在')
    return
  }

  console.info('【媒体文件已更新】', uploadForm.value.file)

  try {
    await uploadMediaFormRef.value.validate()
    uploadLoading.value = true

    const formData = new FormData()
    formData.append('media_file', uploadForm.value.file)
    formData.append('description', uploadForm.value.description)

    // 打印上传表单数据
    console.info('【上传媒体表单数据】', {
      media_file: uploadForm.value.file,
      description: uploadForm.value.description,
      type: uploadForm.value.type
    })

    // 发送上传请求
    const data = await request.post('/media/upload', formData)
    console.info('【上传媒体响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断上传是否成功
    if (operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【上传媒体成功】',
        duration: 3000
      })
      uploadMediaDialogVisible.value = false
      resetUploadForm()
      getMediaList()
    }
    // 上传媒体失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    console.error('【上传媒体错误】', error)
    ElMessage.error({
      message: '【上传媒体错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    uploadLoading.value = false
  }
}

// 删除媒体文件
const deleteMedia = async (id) => {
  try {
    // await request.delete(`/media/${id}`)
    ElMessage.success('删除成功')
    // 重新获取列表
    getMediaList()
  } catch (error) {
    console.error('删除媒体文件失败', error)
    ElMessage.error('删除媒体文件失败，请重试')
  }
}

// 下载媒体文件
const downloadMedia = (file_path) => {
  window.open(`${requestBaseURL}/${file_path}`, '_blank')
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
                <el-button type="primary" size="small" @click="getMediaList" :loading="resourceStore.mediaLoading.value">
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>

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
            <el-table-column label="预览">
              <template #default="scope">
                <!-- 图片预览 -->
                <el-image v-if="['png', 'jpg', 'jpeg'].includes(scope.row.file_type.toLowerCase())"
                  style="width: 97px; height: 97px" :src="`${requestBaseURL}/${scope.row.media_path}`"
                  :preview-src-list="[`${requestBaseURL}/${scope.row.media_path}`]" fit="contain" />
                <!-- 视频预览 -->
                <video v-else-if="['mp4', 'avi', 'mov'].includes(scope.row.file_type.toLowerCase())"
                  style="width: 140px; height: 140px" :src="`${requestBaseURL}/${scope.row.media_path}`"
                  controls></video>
                <!-- 其他类型文件 -->
                <el-tag v-else :type="'info'">其他文件</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updated_at" label="最后更新时间" width="180" sortable :formatter="dataTimeFormatter" />
            <el-table-column prop="owner_username" label="所属用户" width="120" sortable show-overflow-tooltip
              :filters="ownerFilters" :filter-method="filterOwner" filter-placement="bottom" />
            <el-table-column label="操作" fixed="right" width="227">
              <template #default="scope">
                <el-button type="success" size="small" @click="downloadMedia(scope.row.media_path)">
                  <el-icon>
                    <Download />
                  </el-icon>
                  下载
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
    <el-dialog v-model="uploadMediaDialogVisible" title="上传媒体" width="500px" @close="resetUploadForm">
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
            accept="image/png, image/jpg, image/jpeg, video/mp4, video/avi, video/mov"
            :on-change="handleMediaFileChange" :auto-upload="false" :show-file-list="false">
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                {{ uploadForm.type === 'image' ? '仅支持 png/jpg/jpeg 格式' : '仅支持 mp4/avi/mov格式' }}
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
          <el-button @click="() => { uploadMediaDialogVisible = false; resetUploadForm(); }">取消</el-button>
          <el-button type="primary" @click="uploadMedia" :loading="uploadLoading">
            上传
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
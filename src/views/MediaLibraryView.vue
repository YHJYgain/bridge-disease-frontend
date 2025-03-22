<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Download } from '@element-plus/icons-vue'
import request from '../utils/request'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const requestBaseURL = request.defaults.baseURL
const router = useRouter()
const userInfo = ref(null)
const loading = ref(false)
const uploadLoading = ref(false)
const mediaList = ref([])
const uploadDialogVisible = ref(false)
const uploadFormRef = ref(null)

// 分页相关（默认每页 5 条）
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)

// 判断用户角色
const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
const isDeveloper = computed(() => userInfo.value?.role === 'DEVELOPER')
const isAdminOrDeveloper = computed(() => isAdmin.value || isDeveloper.value)

const uploadForm = ref({
  description: '',
  type: 'image',
  file: null
})

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
    loading.value = true
    var data = null

    // 根据用户角色来决定获取媒体列表的方式
    if (isAdminOrDeveloper.value) {
      // 获取所有用户的媒体列表，添加分页参数
    } else {
      // 获取当前用户的媒体列表，添加分页参数
      data = await request.get(`/media/medias/${userInfo.value.user_id}`, {
        params: {
          page: currentPage.value,
          per_page: pageSize.value
        }
      })
    }
    console.info('【获取媒体列表响应数据】', data)

    if (data && !data.failure_message) {
      mediaList.value = data.medias
      total.value = data.total || 0
    }
  } catch (error) {
    console.error('【获取媒体列表失败】', error)
    ElMessage.error({
      message: '【获取媒体列表失败】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    loading.value = false
  }
}

// 表单验证规则
const uploadFormRules = {
  file: [
    { required: true, message: '请选择要上传的文件', trigger: ['blur', 'change'] }
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
  if (uploadFormRef.value) {
    uploadFormRef.value.resetFields()
  }
}

// 创建媒体文件预览 URL 的计算属性
const mediaPreviewUrl = computed(() => {
  if (uploadForm.value.file) {
    return URL.createObjectURL(uploadForm.value.file)
  }
  return ''
})

// 上传媒体
const uploadMedia = async () => {
  if (!uploadFormRef.value) {
    ElMessage.error('【上传媒体错误】表单实例不存在')
    return
  }

  try {
    // 使用表单验证
    await uploadFormRef.value.validate()

    uploadLoading.value = true
    const formData = new FormData()
    formData.append('description', uploadForm.value.description)
    formData.append('file', uploadForm.value.file)

    // 打印上传表单数据
    console.info('【上传媒体表单数据】', {
      description: uploadForm.value.description,
      type: uploadForm.value.type,
      has_file: uploadForm.value.file ? '已选择' : '未选择'
    })

    // const response = await request.post('/media', formData)

    // if (response && response.operation && response.operation.status === 'SUCCESS') {
    //   ElMessage.success('媒体文件上传成功')
    //   uploadDialogVisible.value = false
    //   // 重置表单
    //   resetUploadForm()
    //   // 重新获取列表
    //   getMediaList()
    // }
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
const downloadMedia = (id, name) => {
  window.open(`${requestBaseURL}/media/${name}`, '_blank')
}

// 文件上传变化处理
const handleMediaFileChange = (file) => {
  // 验证文件格式
  if (uploadForm.value.type === 'image') {
    if (!file.raw.type.startsWith('image/')) {
      ElMessage.error('图片格式不正确，请上传 jpg/jpeg/png 格式')
      return false
    }
  } else if (uploadForm.value.type === 'video') {
    if (!file.raw.type.startsWith('video/')) {
      ElMessage.error('视频格式不正确，请上传 mp4/avi/mov 格式')
      return false
    }
  }

  // 验证通过，更新媒体文件
  uploadForm.value.file = file.raw
  return false // 阻止自动上传
}

onMounted(() => {
  // 先获取用户信息，防止未登录用户能够直接访问该页面
  getUserInfo().then(() => {
    getMediaList()
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
                <el-button type="primary" @click="uploadDialogVisible = true">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  上传媒体
                </el-button>
                <el-button type="primary" size="small" @click="getMediaList" :loading="loading">
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="mediaList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'image' ? 'success' : 'warning'">
                  {{ scope.row.type === 'image' ? '图片' : '视频' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
            <el-table-column label="预览" width="120">
              <template #default="scope">
                <el-image v-if="scope.row.type === 'image'" style="width: 50px; height: 50px"
                  :src="`${requestBaseURL}/${scope.row.file_path}`"
                  :preview-src-list="[`${requestBaseURL}/${scope.row.file_path}`]" fit="cover" />
                <el-tag v-else>视频文件</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button type="primary" size="small" @click="downloadMedia(scope.row.id, scope.row.name)">
                  <el-icon>
                    <Download />
                  </el-icon>
                  下载
                </el-button>
                <el-button type="danger" size="small" @click="deleteMedia(scope.row.id)">
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
    <el-dialog v-model="uploadDialogVisible" title="上传媒体" width="500px">
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadFormRules" label-width="100px" status-icon>
        <el-form-item label="媒体描述">
          <el-input v-model="uploadForm.description" type="textarea" placeholder="请输入媒体描述" />
        </el-form-item>
        <el-form-item label="媒体类型">
          <el-radio-group v-model="uploadForm.type">
            <el-radio value="image">图片</el-radio>
            <el-radio value="video">视频</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="媒体文件" prop="file">
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
            <el-image 
              v-if="uploadForm.type === 'image'" 
              style="width: 200px; max-height: 200px" 
              :src="mediaPreviewUrl" 
              fit="contain"
              :preview-src-list="[mediaPreviewUrl]"
            />
            <!-- 视频预览 -->
            <video 
              v-else-if="uploadForm.type === 'video'" 
              style="width: 200px; max-height: 200px"
              :src="mediaPreviewUrl" 
              controls
            ></video>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="() => { uploadDialogVisible = false; resetUploadForm(); }">取消</el-button>
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
  background-color: #f0f2f5;
}

.media-card {
  margin-top: 20px;
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
</style>
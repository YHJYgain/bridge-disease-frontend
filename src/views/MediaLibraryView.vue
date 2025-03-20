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
const mediaList = ref([])
const uploadDialogVisible = ref(false)
const uploadForm = ref({
  name: '',
  description: '',
  type: 'image',
  file: null
})
const uploadLoading = ref(false)

// 判断用户角色
const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
const isDeveloper = computed(() => userInfo.value?.role === 'DEVELOPER')
const isAdminOrDeveloper = computed(() => isAdmin.value || isDeveloper.value)

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
    console.info('【用户信息】', userInfo.value)
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
    // 管理员和开发人员可以查看所有媒体，普通用户只能查看自己的
    const url = isAdminOrDeveloper.value ? '/media/all' : '/media'
    const response = await request.get(url)
    if (response && response.data) {
      mediaList.value = response.data
    }
  } catch (error) {
    console.error('获取媒体列表失败', error)
    ElMessage.error('获取媒体列表失败，请重试')
  } finally {
    loading.value = false
  }
}

// 上传媒体文件
const uploadMedia = async () => {
  if (!uploadForm.value.name) {
    ElMessage.warning('请输入媒体名称')
    return
  }

  if (!uploadForm.value.file) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  try {
    uploadLoading.value = true
    const formData = new FormData()
    formData.append('name', uploadForm.value.name)
    formData.append('description', uploadForm.value.description)
    formData.append('type', uploadForm.value.type)
    formData.append('file', uploadForm.value.file)

    const response = await request.post('/media', formData)

    if (response && response.operation && response.operation.status === 'SUCCESS') {
      ElMessage.success('媒体文件上传成功')
      uploadDialogVisible.value = false
      // 重置表单
      uploadForm.value = {
        name: '',
        description: '',
        type: 'image',
        file: null
      }
      // 重新获取列表
      getMediaList()
    }
  } catch (error) {
    console.error('上传媒体文件失败', error)
    ElMessage.error('上传媒体文件失败，请重试')
  } finally {
    uploadLoading.value = false
  }
}

// 删除媒体文件
const deleteMedia = async (id) => {
  try {
    await request.delete(`/media/${id}`)
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
  window.open(`${requestBaseURL}/media/download/${id}`, '_blank')
}

// 文件上传变化处理
const handleFileChange = (file) => {
  uploadForm.value.file = file.raw
  return false // 阻止自动上传
}

onMounted(() => {
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
        </el-card>
      </div>
    </div>

    <!-- 上传媒体对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传媒体文件" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="媒体名称" required>
          <el-input v-model="uploadForm.name" placeholder="请输入媒体名称" />
        </el-form-item>
        <el-form-item label="媒体描述">
          <el-input v-model="uploadForm.description" type="textarea" placeholder="请输入媒体描述" />
        </el-form-item>
        <el-form-item label="媒体类型">
          <el-radio-group v-model="uploadForm.type">
            <el-radio label="image">图片</el-radio>
            <el-radio label="video">视频</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="媒体文件" required>
          <el-upload class="upload-demo" action="" :auto-upload="false" :on-change="handleFileChange" :limit="1">
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                {{ uploadForm.type === 'image' ? '支持jpg、png、jpeg格式，不超过10MB' : '支持mp4、avi格式，不超过100MB' }}
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
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
  min-height: 100vh;
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

.sidebar {
  width: 220px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  background-color: #304156;
  transition: width 0.3s;
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
</style>
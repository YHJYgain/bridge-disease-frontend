<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Upload } from '@element-plus/icons-vue'
import request from '../utils/request'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const router = useRouter()
const userInfo = ref(null)
const loading = ref(false)
const uploadLoading = ref(false)
const modelList = ref([])
const uploadDialogVisible = ref(false)

// 判断用户角色
const isDeveloper = computed(() => userInfo.value?.role === 'DEVELOPER')

const uploadForm = ref({
  name: '',
  description: '',
  version: '1.0',
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

    // 如果不是开发人员，跳转到首页
    if (!isDeveloper.value) {
      ElMessage.warning('您没有权限访问此页面')
      router.push('/home')
      return
    }
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

// 获取模型列表
const getModelList = async () => {
  try {
    loading.value = true
    // const response = await request.get('/models')
    // if (response && response.data) {
    //   modelList.value = response.data
    // }
  } catch (error) {
    console.error('获取模型列表失败', error)
    ElMessage.error('获取模型列表失败，请重试')
  } finally {
    loading.value = false
  }
}

// 上传模型
const uploadModel = async () => {
  if (!uploadForm.value.name) {
    ElMessage.warning('请输入模型名称')
    return
  }

  if (!uploadForm.value.version) {
    ElMessage.warning('请输入模型版本')
    return
  }

  if (!uploadForm.value.file) {
    ElMessage.warning('请选择要上传的模型文件')
    return
  }

  try {
    uploadLoading.value = true
    const formData = new FormData()
    formData.append('name', uploadForm.value.name)
    formData.append('description', uploadForm.value.description)
    formData.append('version', uploadForm.value.version)
    formData.append('file', uploadForm.value.file)

    // const response = await request.post('/model', formData)

    // if (response && response.operation && response.operation.status === 'SUCCESS') {
    //   ElMessage.success('模型文件上传成功')
    //   uploadDialogVisible.value = false
    //   // 重置表单
    //   uploadForm.value = {
    //     name: '',
    //     description: '',
    //     version: '1.0',
    //     file: null
    //   }
    //   // 重新获取列表
    //   getModelList()
    // }
  } catch (error) {
    console.error('上传模型文件失败', error)
    ElMessage.error('上传模型文件失败，请重试')
  } finally {
    uploadLoading.value = false
  }
}

// 删除模型
const deleteModel = async (id) => {
  try {
    // await request.delete(`/model/${id}`)
    ElMessage.success('删除成功')
    // 重新获取列表
    getModelList()
  } catch (error) {
    console.error('删除模型失败', error)
    ElMessage.error('删除模型失败，请重试')
  }
}

// 切换模型状态
const toggleModelStatus = async (id, active) => {
  try {
    // await request.put(`/model/${id}/status`, { active: !active })
    ElMessage.success(`模型已${!active ? '激活' : '停用'}`)
    // 重新获取列表
    getModelList()
  } catch (error) {
    console.error('切换模型状态失败', error)
    ElMessage.error('切换模型状态失败，请重试')
  }
}

// 文件上传变化处理
const handleFileChange = (file) => {
  uploadForm.value.file = file.raw
  return false // 阻止自动上传
}

onMounted(() => {
  getUserInfo().then(() => {
    if (isDeveloper.value) {
      getModelList()
    }
  })
})
</script>

<template>
  <div class="model-library-container">
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

        <!-- 模型库列表 -->
        <el-card class="model-card">
          <template #header>
            <div class="card-header">
              <h2>模型库</h2>
              <div>
                <el-button type="primary" @click="uploadDialogVisible = true">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  上传模型
                </el-button>
                <el-button type="primary" size="small" @click="getModelList" :loading="loading">
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="modelList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="version" label="版本" width="100" />
            <el-table-column prop="active" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.active ? 'success' : 'info'">
                  {{ scope.row.active ? '已激活' : '已停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
            <el-table-column label="操作" width="220">
              <template #default="scope">
                <el-button :type="scope.row.active ? 'warning' : 'success'" size="small"
                  @click="toggleModelStatus(scope.row.id, scope.row.active)">
                  {{ scope.row.active ? '停用' : '激活' }}
                </el-button>
                <el-button type="danger" size="small" @click="deleteModel(scope.row.id)">
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

    <!-- 上传模型对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传模型文件" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="模型名称" required>
          <el-input v-model="uploadForm.name" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型描述">
          <el-input v-model="uploadForm.description" type="textarea" placeholder="请输入模型描述" />
        </el-form-item>
        <el-form-item label="模型版本" required>
          <el-input v-model="uploadForm.version" placeholder="请输入模型版本，如1.0" />
        </el-form-item>
        <el-form-item label="模型文件" required>
          <el-upload class="upload-demo" action="" :auto-upload="false" :on-change="handleFileChange" :limit="1">
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持.pt、.pth、.h5等模型文件格式，不超过500MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="uploadModel" :loading="uploadLoading">
            上传
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.model-library-container {
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

.model-card {
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
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const router = useRouter()
const userInfo = ref(null)
const loading = ref(false)
const detectionRecords = ref([])

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

// 获取检测记录
const getDetectionRecords = async () => {
  try {
    loading.value = true
    // 管理员和开发人员可以查看所有记录，普通用户只能查看自己的
    // const url = isAdminOrDeveloper.value ? '/detections/all' : '/detections'
    // const response = await request.get(url)
    // if (response && response.data) {
    //   detectionRecords.value = response.data
    // }
  } catch (error) {
    console.error('获取检测记录失败', error)
    ElMessage.error('获取检测记录失败，请重试')
  } finally {
    loading.value = false
  }
}

// 查看检测结果详情
const viewDetectionDetail = (id) => {
  router.push(`/detection-detail/${id}`)
}

// 删除检测记录
const deleteDetection = async (id) => {
  try {
    // await request.delete(`/detection/${id}`)
    ElMessage.success('删除成功')
    // 重新获取列表
    getDetectionRecords()
  } catch (error) {
    console.error('删除检测记录失败', error)
    ElMessage.error('删除检测记录失败，请重试')
  }
}

// 格式化状态
const formatStatus = (status) => {
  const statusMap = {
    'PENDING': '待处理',
    'IN_PROGRESS': '处理中',
    'COMPLETED': '已完成',
    'FAILED': '失败'
  }
  return statusMap[status] || status
}

// 状态标签类型
const statusType = (status) => {
  const typeMap = {
    'PENDING': 'warning',
    'IN_PROGRESS': 'info',
    'COMPLETED': 'success',
    'FAILED': 'danger'
  }
  return typeMap[status] || ''
}

onMounted(() => {
  // 先获取用户信息，防止未登录用户能够直接访问该页面
  getUserInfo().then(() => {
    getDetectionRecords()
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
              <el-button type="primary" size="small" @click="getDetectionRecords" :loading="loading">
                刷新数据
              </el-button>
            </div>
          </template>

          <el-table :data="detectionRecords" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="media_name" label="媒体文件" />
            <el-table-column prop="model_name" label="使用模型" />
            <el-table-column prop="created_at" label="创建时间" width="180" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="statusType(scope.row.status)">
                  {{ formatStatus(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button type="primary" size="small" @click="viewDetectionDetail(scope.row.id)">
                  查看详情
                </el-button>
                <el-button type="danger" size="small" @click="deleteDetection(scope.row.id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>
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
  background-color: #f0f2f5;
}

.records-card {
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
</style>
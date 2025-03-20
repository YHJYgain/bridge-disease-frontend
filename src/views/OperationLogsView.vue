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
const operationLogs = ref([])
const searchForm = ref({
  user_id: '',
  operation_type: '',
  status: '',
  start_date: '',
  end_date: ''
})

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

    // 如果不是管理员或开发人员，跳转到首页
    if (!isAdminOrDeveloper.value) {
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

// 获取操作日志
const getOperationLogs = async () => {
  try {
    loading.value = true
    // 构建查询参数
    const params = {}
    if (searchForm.value.user_id) params.user_id = searchForm.value.user_id
    if (searchForm.value.operation_type) params.operation_type = searchForm.value.operation_type
    if (searchForm.value.status) params.status = searchForm.value.status
    if (searchForm.value.start_date) params.start_date = searchForm.value.start_date
    if (searchForm.value.end_date) params.end_date = searchForm.value.end_date

    const response = await request.get('/operations', { params })
    if (response && response.data) {
      operationLogs.value = response.data
    }
  } catch (error) {
    console.error('获取操作日志失败', error)
    ElMessage.error('获取操作日志失败，请重试')
  } finally {
    loading.value = false
  }
}

// 重置搜索表单
const resetSearchForm = () => {
  searchForm.value = {
    user_id: '',
    operation_type: '',
    status: '',
    start_date: '',
    end_date: ''
  }
  getOperationLogs()
}

// 格式化操作类型
const formatOperationType = (type) => {
  const typeMap = {
    'login': '登录',
    'logout': '登出',
    'register': '注册',
    'create': '创建',
    'update': '更新',
    'delete': '删除',
    'upload': '上传',
    'download': '下载',
    'detection': '检测分割'
  }
  return typeMap[type] || type
}

// 格式化状态
const formatStatus = (status) => {
  const statusMap = {
    'SUCCESS': '成功',
    'FAILURE': '失败'
  }
  return statusMap[status] || status
}

// 状态标签类型
const statusType = (status) => {
  const typeMap = {
    'SUCCESS': 'success',
    'FAILURE': 'danger'
  }
  return typeMap[status] || ''
}

onMounted(() => {
  getUserInfo().then(() => {
    if (isAdminOrDeveloper.value) {
      getOperationLogs()
    }
  })
})
</script>

<template>
  <div class="operation-logs-container">
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

        <!-- 操作日志列表 -->
        <el-card class="logs-card">
          <template #header>
            <div class="card-header">
              <h2>系统操作日志</h2>
              <el-button type="primary" size="small" @click="getOperationLogs" :loading="loading">
                刷新数据
              </el-button>
            </div>
          </template>

          <!-- 搜索表单 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="用户ID">
              <el-input v-model="searchForm.user_id" placeholder="请输入用户ID" clearable />
            </el-form-item>
            <el-form-item label="操作类型">
              <el-select v-model="searchForm.operation_type" placeholder="请选择操作类型" clearable>
                <el-option label="登录" value="login" />
                <el-option label="登出" value="logout" />
                <el-option label="注册" value="register" />
                <el-option label="创建" value="create" />
                <el-option label="更新" value="update" />
                <el-option label="删除" value="delete" />
                <el-option label="上传" value="upload" />
                <el-option label="下载" value="download" />
                <el-option label="检测分割" value="detection" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                <el-option label="成功" value="SUCCESS" />
                <el-option label="失败" value="FAILURE" />
                <el-option label="处理中" value="PENDING" />
              </el-select>
            </el-form-item>
            <el-form-item label="开始日期">
              <el-date-picker v-model="searchForm.start_date" type="date" placeholder="选择开始日期" format="YYYY-MM-DD"
                value-format="YYYY-MM-DD" clearable />
            </el-form-item>
            <el-form-item label="结束日期">
              <el-date-picker v-model="searchForm.end_date" type="date" placeholder="选择结束日期" format="YYYY-MM-DD"
                value-format="YYYY-MM-DD" clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="getOperationLogs">搜索</el-button>
              <el-button @click="resetSearchForm">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 日志表格 -->
          <el-table :data="operationLogs" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="user_id" label="用户ID" width="80" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="operation_type" label="操作类型" width="100">
              <template #default="scope">
                {{ formatOperationType(scope.row.operation_type) }}
              </template>
            </el-table-column>
            <el-table-column prop="operation_detail" label="操作详情" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="statusType(scope.row.status)">
                  {{ formatStatus(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="failure_message" label="失败原因" />
            <el-table-column prop="created_at" label="操作时间" width="180" />
          </el-table>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.operation-logs-container {
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

.logs-card {
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

.search-form {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}
</style>
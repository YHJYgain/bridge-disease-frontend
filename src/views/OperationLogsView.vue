<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { useUserStore } from '../stores/userStore'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const router = useRouter()
const { userInfo, getUserInfo } = useUserStore()
const operationLogs = ref([])

// 判断用户角色
const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
const isDeveloper = computed(() => userInfo.value?.role === 'DEVELOPER')
const isAdminOrDeveloper = computed(() => isAdmin.value || isDeveloper.value)

const searchForm = ref({
  user_id: '',
  operation_type: '',
  status: '',
  start_date: '',
  end_date: ''
})

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

    // const response = await request.get('/operations', { params })
    // if (response && response.data) {
    //   operationLogs.value = response.data
    // }
  } catch (error) {
    console.error('【获取操作日志错误】', error)
    ElMessage.error({
      message: '【获取操作日志错误】' + (error?.message || '请重试'),
      duration: 5000
    })
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
    'authenticate': '鉴权',
    'create': '创建',
    'read': '读取',
    'update': '更新',
    'delete': '删除',
    'execute': '执行任务',
    'manage': '管理操作'
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
  // 先获取用户信息，防止未登录/无权限用户能够直接访问该页面
  getUserInfo().then(() => {
    if (userInfo.value) {
      if (isAdminOrDeveloper.value) {
        getOperationLogs()
      } else {
        ElMessage.warning({
          message: '【访问页面失败】您非管理员/开发人员，没有权限访问此页面',
          duration: 4000
        })
        router.push('/home')
      }
    } else {
      router.push('/login')
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
                <el-option label="鉴权" value="authenticate" />
                <el-option label="创建" value="create" />
                <el-option label="读取" value="read" />
                <el-option label="更新" value="update" />
                <el-option label="删除" value="delete" />
                <el-option label="执行任务" value="execute" />
                <el-option label="管理操作" value="manage" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                <el-option label="成功" value="SUCCESS" />
                <el-option label="失败" value="FAILURE" />
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

.logs-card {
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

.search-form {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}
</style>
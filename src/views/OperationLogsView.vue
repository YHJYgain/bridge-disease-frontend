<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Document, Delete as DeleteIcon } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useUserStore } from '../stores/userStore'
import { useResourceStore } from '../stores/resourceStore'
import { formatDateTime } from '../utils/dateTimeFormatter'
import { getUserDetail } from '../utils/detailFetcher'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const router = useRouter()
const { userInfo, getUserInfo } = useUserStore()
const resourceStore = useResourceStore()
const operationLogs = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 判断用户角色
const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
const isDeveloper = computed(() => userInfo.value?.role === 'DEVELOPER')
const isAdminOrDeveloper = computed(() => isAdmin.value || isDeveloper.value)

const searchForm = ref({
  keyword: '',
  start_date: '',
  end_date: '',
})

// 获取操作日志
const getOperationLogs = async () => {
  try {
    resourceStore.operationLoading = true

    // 使用 resourceStore 获取操作日志
    const { operations, total: totalCount, error } = await resourceStore.fetchOperationList(
      userInfo.value,
      currentPage.value,
      pageSize.value,
      true, // 强制刷新，确保获取最新数据
    )

    if (error) {
      throw error
    }

    console.info('【获取操作日志响应数据】', { operations, total: totalCount })

    // 应用搜索过滤
    let filteredOperations = operations

    // 判断是否有筛选条件
    const hasFilters = searchForm.value.keyword || searchForm.value.start_date || searchForm.value.end_date

    // 关键词搜索（模糊搜索多个字段）
    if (searchForm.value.keyword) {
      const keyword = searchForm.value.keyword.toLowerCase()
      filteredOperations = filteredOperations.filter(op => {
        // 确保每个字段在比较前转换为字符串并转为小写
        const opId = op.operation_id ? op.operation_id.toString().toLowerCase() : ''
        const ownerId = op.owner_id ? op.owner_id.toString().toLowerCase() : ''
        const ownerName = op.owner_username ? op.owner_username.toLowerCase() : ''
        const desc = op.description ? op.description.toLowerCase() : ''
        const opType = op.operation_type ? op.operation_type.toLowerCase() : ''
        const failMsg = op.failure_message ? op.failure_message.toLowerCase() : ''
        const ipAddr = op.ip_address ? op.ip_address.toLowerCase() : ''
        const deviceInfo = op.device_info ? op.device_info.toLowerCase() : ''
        
        // 检查每个字段是否包含关键词
        return (
          opId.includes(keyword) ||
          ownerId.includes(keyword) ||
          ownerName.includes(keyword) ||
          desc.includes(keyword) ||
          opType.includes(keyword) ||
          failMsg.includes(keyword) ||
          ipAddr.includes(keyword) ||
          deviceInfo.includes(keyword)
        )
      })
    }

    // 日期范围过滤
    if (searchForm.value.start_date) {
      const startDate = new Date(searchForm.value.start_date)
      // 直接使用用户选择的完整时间（包含时分秒）
      filteredOperations = filteredOperations.filter(op => {
        const opDate = new Date(op.created_at)
        const adjustedOpDate = new Date(opDate.getTime() - 8 * 60 * 60 * 1000)
        return adjustedOpDate >= startDate
      })
    }
    if (searchForm.value.end_date) {
      const endDate = new Date(searchForm.value.end_date)
      // 直接使用用户选择的完整时间（包含时分秒）
      filteredOperations = filteredOperations.filter(op => {
        const opDate = new Date(op.created_at)
        const adjustedOpDate = new Date(opDate.getTime() - 8 * 60 * 60 * 1000)
        return adjustedOpDate <= endDate
      })
    }

    operationLogs.value = filteredOperations
    total.value = hasFilters ? filteredOperations.length : totalCount
  } catch (error) {
    console.error('【获取操作日志错误】', error)
    ElMessage.error({
      message: '【获取操作日志错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    resourceStore.operationLoading = false
  }
}

// 删除单条操作日志
const deleteLog = async (operationId) => {
  try {
    resourceStore.operationLoading = true

    const data = await request.delete(`/operation/delete/${operationId}`)

    if (data && !data.failure_message) {
      ElMessage.success({
        message: '【删除操作日志成功】',
        duration: 3000,
      })
      getOperationLogs()
    }
  } catch (error) {
    console.error('【删除操作日志错误】', error)
    ElMessage.error({
      message: '【删除操作日志错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    resourceStore.operationLoading = false
  }
}

// 确认删除单条操作日志
const confirmDeleteLog = (log) => {
  ElMessageBox.confirm(
    `确定要删除 ID 为 ${log.operation_id} 的操作日志吗？此操作不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(() => {
    deleteLog(log.operation_id)
  }).catch(() => {
    ElMessage.info({
      message: '【已取消删除操作日志】',
      duration: 2000,
    })
  })
}

// 导出操作日志（直接使用前端导出功能）
const exportLogs = async () => {
  try {
    resourceStore.operationLoading = true

    // 创建一个工作簿
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // 准备数据
    const exportData = operationLogs.value.map(log => ({
      '操作ID': log.operation_id,
      '用户ID': log.owner_id,
      '操作者': log.owner_username || '',
      '操作类型': formatOperationType(log.operation_type),
      '操作描述': log.description,
      '操作状态': formatStatus(log.status),
      '失败原因': log.failure_message || '',
      '操作IP': log.ip_address,
      '操作设备': log.device_info,
      '操作时间': formatDateTime(log.created_at),
    }))

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exportData)

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "操作日志")

    // 生成带年月日时分秒的文件名
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`

    // 导出Excel文件
    XLSX.writeFile(wb, `桥梁病害检测与分割系统操作日志_${timestamp}.xlsx`)

    ElMessage.success({
      message: '【导出操作日志成功】',
      duration: 3000,
    })
  } catch (error) {
    console.error('【导出操作日志错误】', error)
    ElMessage.error({
      message: '【导出操作日志错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    resourceStore.operationLoading = false
  }
}

// 清空所有操作日志
const clearLogs = async () => {
  try {
    resourceStore.operationLoading = true

    const data = await request.delete('/operation/clear')

    if (data && !data.failure_message) {
      ElMessage.success({
        message: '【清空操作日志成功】',
        duration: 3000,
      })
      // 刷新日志列表
      getOperationLogs()
    }
  } catch (error) {
    console.error('【清空操作日志错误】', error)
    ElMessage.error({
      message: '【清空操作日志错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    resourceStore.operationLoading = false
  }
}

// 确认清空所有操作日志
const confirmClearLogs = () => {
  ElMessageBox.confirm(
    '确定要清空所有操作日志吗？此操作不可恢复！',
    '清空确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(() => {
    clearLogs()
  }).catch(() => {
    ElMessage.info({
      message: '【已取消清空操作日志】',
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
    'manage': '管理操作',
  }
  return typeMap[type] || type
}

// 操作类型筛选选项
const operationTypeFilters = computed(() => {
  return [
    { text: 'AUTHENTICATE', value: 'AUTHENTICATE' },
    { text: 'CREATE', value: 'CREATE' },
    { text: 'READ', value: 'READ' },
    { text: 'UPDATE', value: 'UPDATE' },
    { text: 'DELETE', value: 'DELETE' },
    { text: 'EXECUTE', value: 'EXECUTE' },
    { text: 'MANAGE', value: 'MANAGE' },
  ]
})

// 操作类型筛选方法
const filterOperationType = (value, row) => {
  return row.operation_type === value
}

// 格式化状态
const formatStatus = (status) => {
  const statusMap = {
    'SUCCESS': '成功',
    'FAILURE': '失败',
  }
  return statusMap[status] || status
}

// 操作状态筛选选项
const statusFilters = computed(() => {
  return [
    { text: '成功', value: 'SUCCESS' },
    { text: '失败', value: 'FAILURE' },
  ]
})

// 操作状态筛选方法
const filterStatus = (value, row) => {
  return row.status === value
}

// 状态标签类型
const statusType = (status) => {
  const typeMap = {
    'SUCCESS': 'success',
    'FAILURE': 'danger',
  }
  return typeMap[status] || ''
}

// 获取所有用户名作为筛选选项
const ownerFilters = computed(() => {
  // 从操作日志列表中提取不重复的用户名
  const uniqueOwners = [...new Set(operationLogs.value.map(item => item.owner_username).filter(Boolean))]
  return uniqueOwners.map(owner => ({ text: owner, value: owner }))
})

// 用户筛选方法
const filterOwner = (value, row) => {
  return row.owner_username === value
}

// 格式化日期时间
const dataTimeFormatter = (row, column) => {
  return formatDateTime(row[column.property]) // 使用通用的日期时间格式化工具函数
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
          duration: 4000,
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
              <div>
                <el-button type="success" @click="exportLogs" :icon="Document">
                  导出日志
                </el-button>
                <el-button type="danger" @click="confirmClearLogs" :icon="Delete">
                  清空日志
                </el-button>
                <el-button type="primary" size="small" @click="getOperationLogs"
                  :loading="resourceStore.operationLoading.value">
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>

          <!-- 搜索表单 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="关键词搜索">
              <el-input v-model="searchForm.keyword" placeholder="搜索操作者/ID/描述/失败原因等" clearable style="width: 300px" />
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker v-model="searchForm.start_date" type="datetime" placeholder="开始日期时间" format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss" clearable style="width: 200px" />
              <span class="date-separator">至</span>
              <el-date-picker v-model="searchForm.end_date" type="datetime" placeholder="结束日期时间" format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="getOperationLogs">搜索</el-button>
              <el-button @click="resetSearchForm">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 日志表格 -->
          <el-table :data="operationLogs" style="width: 100%" v-loading="resourceStore.operationLoading.value">
            <el-table-column prop="operation_id" label="ID" width="63" sortable />
            <el-table-column prop="owner_id" label="操作者ID" width="105" sortable />
            <el-table-column prop="owner_username" label="操作者" width="104" sortable show-overflow-tooltip
              :filters="ownerFilters" :filter-method="filterOwner" filter-placement="bottom" />
            <el-table-column prop="operation_type" label="操作类型" width="125" sortable
              :filters="operationTypeFilters" :filter-method="filterOperationType" filter-placement="bottom">
              <template #default="scope">
                {{ formatOperationType(scope.row.operation_type) }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="操作描述" sortable show-overflow-tooltip />
            <el-table-column prop="status" label="操作状态" width="118" sortable
              :filters="statusFilters" :filter-method="filterStatus" filter-placement="bottom">
              <template #default="scope">
                <el-tag :type="statusType(scope.row.status)">
                  {{ formatStatus(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="failure_message" label="失败原因" sortable show-overflow-tooltip />
            <el-table-column prop="ip_address" label="操作IP" sortable show-overflow-tooltip />
            <el-table-column prop="device_info" label="操作设备" sortable show-overflow-tooltip />
            <el-table-column prop="created_at" label="操作时间" width="147" sortable :formatter="dataTimeFormatter" />
            <el-table-column label="操作" width="52" fixed="right">
              <template #default="scope">
                <el-button type="danger" size="small" :icon="DeleteIcon" circle @click="confirmDeleteLog(scope.row)" />
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
              layout="total, prev, pager, next, jumper" :total="total" @current-change="getOperationLogs" />
          </div>
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.date-separator {
  margin: 0 5px;
  line-height: 32px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>
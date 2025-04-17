<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, User, Avatar, Message, Lock, Edit, CloseBold, Delete, Check, RefreshRight } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useUserStore } from '../stores/userStore'
import { useResourceStore } from '../stores/resourceStore'
import { formatDateTime } from '../utils/dateTimeFormatter'
import { handleAvatarUpload } from '../utils/avatarUtils'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const requestBaseURL = request.defaults.baseURL
const router = useRouter()
const { userInfo, getUserInfo } = useUserStore()
const resourceStore = useResourceStore()
const formLoading = ref(false)
const userList = ref([])
const dialogVisible = ref(false)
const selectedUser = ref(null)
const addFormRef = ref(null)
const editFormRef = ref(null)

// 搜索表单
const searchForm = ref({
  keyword: '',
  start_date: '',
  end_date: '',
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 判断用户角色
const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
const isDeveloper = computed(() => userInfo.value?.role === 'DEVELOPER')
const isAdminOrDeveloper = computed(() => isAdmin.value || isDeveloper.value)

// 添加用户表单数据
const addUserForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'USER',
  first_name: '',
  last_name: '',
  phone: '',
  avatar_file: null,
})

// 编辑用户表单数据
const editUserForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'USER',
  first_name: '',
  last_name: '',
  phone: '',
  avatar_file: null,
})

// 获取用户列表
const getUserList = async () => {
  try {
    resourceStore.userLoading = true

    // 使用共享的资源存储获取用户列表
    const { users, total: totalUsers, error } = await resourceStore.fetchUserList(
      userInfo.value,
      currentPage.value,
      pageSize.value,
      true, // 强制刷新，确保获取最新数据
    )

    if (error) {
      return
    }

    console.info('【获取用户列表响应数据】', { users, total: totalUsers })

    // 应用搜索过滤
    let filteredUsers = users

    // 判断是否有筛选条件
    const hasFilters = searchForm.value.keyword || searchForm.value.start_date || searchForm.value.end_date

    // 关键词搜索（模糊搜索多个字段）
    if (searchForm.value.keyword) {
      const keyword = searchForm.value.keyword.toLowerCase()
      filteredUsers = filteredUsers.filter(user => {
        // 确保每个字段在比较前转换为字符串并转为小写
        const userId = user.user_id ? user.user_id.toString().toLowerCase() : ''
        const username = user.username ? user.username.toLowerCase() : ''
        const email = user.email ? user.email.toLowerCase() : ''
        const firstName = user.first_name ? user.first_name.toLowerCase() : ''
        const lastName = user.last_name ? user.last_name.toLowerCase() : ''
        const role = user.role ? user.role.toLowerCase() : ''
        const status = user.status ? user.status.toLowerCase() : ''
        const phone = user.phone ? user.phone.toLowerCase() : ''

        // 检查每个字段是否包含关键词
        return (
          userId.includes(keyword) ||
          username.includes(keyword) ||
          email.includes(keyword) ||
          firstName.includes(keyword) ||
          lastName.includes(keyword) ||
          role.includes(keyword) ||
          status.includes(keyword) ||
          phone.includes(keyword)
        )
      })
    }

    // 日期范围过滤
    if (searchForm.value.start_date) {
      const startDate = new Date(searchForm.value.start_date)
      // 直接使用用户选择的完整时间（包含时分秒）
      filteredUsers = filteredUsers.filter(user => {
        const userDate = new Date(user.updated_at)
        const adjustedUserDate = new Date(userDate.getTime() - 8 * 60 * 60 * 1000)
        return adjustedUserDate >= startDate
      })
    }
    if (searchForm.value.end_date) {
      const endDate = new Date(searchForm.value.end_date)
      // 直接使用用户选择的完整时间（包含时分秒）
      filteredUsers = filteredUsers.filter(user => {
        const userDate = new Date(user.updated_at)
        const adjustedUserDate = new Date(userDate.getTime() - 8 * 60 * 60 * 1000)
        return adjustedUserDate <= endDate
      })
    }

    userList.value = filteredUsers
    total.value = hasFilters ? filteredUsers.length : totalUsers
  } catch (error) {
    console.error('【获取用户列表错误】', error)
    ElMessage.error({
      message: '【获取用户列表错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    resourceStore.userLoading = false
  }
}

// 角色筛选选项
const roleFilters = [
  { text: '管理员', value: 'ADMIN' },
  { text: '开发人员', value: 'DEVELOPER' },
  { text: '普通用户', value: 'USER' },
]

// 状态筛选选项
const statusFilters = [
  { text: '在线', value: 'ACTIVE' },
  { text: '离线', value: 'INACTIVE' },
  { text: '封禁', value: 'BANNED' },
  { text: '注销', value: 'DELETED' },
]

// 格式化角色
const formatRole = (role) => {
  const roleMap = {
    'ADMIN': '管理员',
    'DEVELOPER': '开发人员',
    'USER': '普通用户',
  }
  return roleMap[role] || role
}

// 角色标签类型
const roleType = (role) => {
  const typeMap = {
    'ADMIN': 'warning',
    'DEVELOPER': 'danger',
    'USER': 'info',
  }
  return typeMap[role] || ''
}

// 角色筛选方法
const filterRole = (value, row) => {
  return row.role === value
}

// 格式化用户状态
const formatStatus = (status) => {
  const statusMap = {
    'ACTIVE': '在线',
    'INACTIVE': '离线',
    'BANNED': '封禁',
    'DELETED': '注销',
  }
  return statusMap[status] || status
}

// 角色标签类型
const statusType = (status) => {
  const typeMap = {
    'ACTIVE': 'success',
    'INACTIVE': 'info',
    'BANNED': 'danger',
    'DELETED': 'warning',
  }
  return typeMap[status] || ''
}

// 状态筛选方法
const filterStatus = (value, row) => {
  return row.status === value
}

// 格式化日期时间
const dataTimeFormatter = (row, column) => {
  return formatDateTime(row[column.property]) // 使用通用的日期时间格式化工具函数
}

// 邮箱验证规则
const validateEmail = (rule, value, callback) => {
  const emailRegex = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
  if (!emailRegex.test(value)) {
    callback(new Error('请输入正确的邮箱格式'))
  } else {
    callback()
  }
}

// 名字验证规则
const validateFirstName = (rule, value, callback) => {
  if (!value) {
    callback() // 名字可以为空
    return
  }
  callback()
}

// 姓氏验证规则
const validateLastName = (rule, value, callback) => {
  if (!value) {
    callback() // 姓氏可以为空
    return
  }
  callback()
}

// 头像文件验证规则
const validateAvatar = (rule, value, callback) => {
  if (!value) {
    callback() // 头像可以为空
    return
  }
  callback()
}

// 手机号验证规则
const validatePhone = (rule, value, callback) => {
  if (!value) {
    callback() // 手机号可以为空
    return
  }
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(value)) {
    callback(new Error('请输入正确的手机号格式'))
  } else {
    callback()
  }
}

// 添加用户表单验证规则
const addFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { validator: validateEmail, trigger: ['blur', 'change'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
  first_name: [
    { validator: validateFirstName, trigger: ['blur', 'change'] },
  ],
  last_name: [
    { validator: validateLastName, trigger: ['blur', 'change'] },
  ],
  avatar_file: [
    { validator: validateAvatar, trigger: ['blur', 'change'] },
  ],
  phone: [
    { validator: validatePhone, trigger: ['blur', 'change'] },
  ],
}

// 编辑表单密码验证规则
const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback() // 密码可以不更改
    return
  }
  callback()
}

const editFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { validator: validateEmail, trigger: ['blur', 'change'] },
  ],
  password: [
    { validator: validatePassword, trigger: ['blur', 'change'] },
  ],
  first_name: [
    { validator: validateFirstName, trigger: ['blur', 'change'] },
  ],
  last_name: [
    { validator: validateLastName, trigger: ['blur', 'change'] },
  ],
  avatar_file: [
    { validator: validateAvatar, trigger: ['blur', 'change'] },
  ],
  phone: [
    { validator: validatePhone, trigger: ['blur', 'change'] },
  ],
}

// 创建添加用户头像预览 URL 的计算属性
const addAvatarPreviewUrl = computed(() => {
  if (addUserForm.value.avatar_file) {
    return URL.createObjectURL(addUserForm.value.avatar_file)
  }
  return ''
})

// 创建编辑用户头像预览 URL 的计算属性
const editAvatarPreviewUrl = computed(() => {
  if (editUserForm.value.avatar_file) {
    return URL.createObjectURL(editUserForm.value.avatar_file)
  }
  return selectedUser.value?.avatar_path ? `${requestBaseURL}/${selectedUser.value.avatar_path}` : ''
})

// 处理添加用户头像上传
const handleAddAvatarChange = (file) => {
  return handleAvatarUpload(file, (rawFile) => {
    addUserForm.value.avatar_file = rawFile
  })
}

// 处理编辑用户头像上传
const handleEditAvatarChange = (file) => {
  return handleAvatarUpload(file, (rawFile) => {
    editUserForm.value.avatar_file = rawFile
  })
}

// 打开添加用户对话框
const openAddUserDialog = () => {
  selectedUser.value = null
  addUserForm.value = {
    username: '',
    email: '',
    password: '',
    role: 'USER',
    first_name: '',
    last_name: '',
    phone: '',
    avatar_file: null,
  }
  dialogVisible.value = true

  // 重置表单验证
  if (addFormRef.value) {
    addFormRef.value.resetFields()
  }
}

// 添加用户
const submitAddUserForm = async () => {
  if (!addFormRef.value) {
    ElMessage.error({
      message: '【添加用户错误】表单实例不存在',
      duration: 5000,
    })
    return
  }

  try {
    await addFormRef.value.validate()
    formLoading.value = true

    const formData = new FormData()
    formData.append('username', addUserForm.value.username)
    formData.append('email', addUserForm.value.email)
    formData.append('password', addUserForm.value.password)
    formData.append('role', addUserForm.value.role)

    // 只有当这些选填字段有值时才添加到表单数据中
    if (addUserForm.value.first_name) {
      formData.append('first_name', addUserForm.value.first_name)
    }
    if (addUserForm.value.last_name) {
      formData.append('last_name', addUserForm.value.last_name)
    }
    if (addUserForm.value.avatar_file) {
      formData.append('avatar_file', addUserForm.value.avatar_file)
    }
    if (addUserForm.value.phone) {
      formData.append('phone', addUserForm.value.phone)
    }

    // 打印添加用户表单数据，过滤敏感信息
    const safeFormData = {
      username: addUserForm.value.username,
      email: addUserForm.value.email,
      has_password: addUserForm.value.password ? '已设置' : '未设置',
      role: addUserForm.value.role,
      has_first_name: addUserForm.value.first_name ? '已设置' : '未设置',
      has_last_name: addUserForm.value.last_name ? '已设置' : '未设置',
      has_avatar: addUserForm.value.avatar_file ? '已设置' : '未设置',
      has_phone: addUserForm.value.phone ? '已设置' : '未设置',
    }
    console.info('【添加用户表单数据】', safeFormData)

    // 调用注册接口添加用户
    const data = await request.post('/user/register', formData)
    console.info('【添加用户响应数据】', data)
    const operation = data.operation

    if (data && operation && operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【添加用户成功】',
        duration: 3000,
      })
      dialogVisible.value = false
      getUserList()
    }
  } catch (error) {
    console.error('【添加用户错误】', error)
    ElMessage.error({
      message: '【添加用户错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    formLoading.value = false
  }
}

// 打开编辑用户对话框
const openEditUserDialog = (user) => {
  selectedUser.value = user
  editUserForm.value = {
    username: user.username,
    email: user.email,
    password: '',
    role: user.role,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || '',
    avatar_file: null,
  }
  dialogVisible.value = true

  // 重置表单验证
  if (editFormRef.value) {
    editFormRef.value.resetFields()
  }
}

// 编辑用户
const submitEditUserForm = async () => {
  if (!editFormRef.value) {
    ElMessage.error({
      message: '【编辑用户错误】表单实例不存在',
      duration: 5000,
    })
    return
  }

  try {
    await editFormRef.value.validate()
    formLoading.value = true

    const formData = new FormData()
    formData.append('username', editUserForm.value.username)
    formData.append('email', editUserForm.value.email)
    formData.append('role', editUserForm.value.role)

    // 只有当这些字段有值时才添加到表单数据中
    if (editUserForm.value.password) {
      formData.append('password', editUserForm.value.password)
    }
    if (editUserForm.value.first_name) {
      formData.append('first_name', editUserForm.value.first_name)
    }
    if (editUserForm.value.last_name) {
      formData.append('last_name', editUserForm.value.last_name)
    }
    if (editUserForm.value.avatar_file) {
      formData.append('avatar_file', editUserForm.value.avatar_file)
    }
    if (editUserForm.value.phone) {
      formData.append('phone', editUserForm.value.phone)
    }

    // 打印编辑用户表单数据，过滤敏感信息
    const safeFormData = {
      username: editUserForm.value.username,
      email: editUserForm.value.email,
      has_password: editUserForm.value.password ? '已设置' : '未设置',
      role: editUserForm.value.role,
      has_first_name: editUserForm.value.first_name ? '已设置' : '未设置',
      has_last_name: editUserForm.value.last_name ? '已设置' : '未设置',
      has_avatar: editUserForm.value.avatar_file ? '已设置' : '未设置',
      has_phone: editUserForm.value.phone ? '已设置' : '未设置',
    }
    console.info('【编辑用户表单数据】', safeFormData)

    // 调用更新用户接口
    const data = await request.put(`/user/update/${selectedUser.value.user_id}`, formData)
    console.info('【编辑用户响应数据】', data)
    const operation = data.operation

    if (data && operation && operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【编辑用户成功】',
        duration: 3000,
      })
      dialogVisible.value = false
      getUserList()
    }
  } catch (error) {
    console.error('【编辑用户错误】', error)
    ElMessage.error({
      message: '【编辑用户错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    formLoading.value = false
  }
}

// 封禁用户
const banUser = async (user) => {
  try {
    ElMessageBox.confirm(
      `确定要封禁用户 ${user.username} 吗？封禁后该用户将无法登录系统。`,
      '封禁用户',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger',
      },
    ).then(async () => {
      formLoading.value = true

      const data = await request.put(`/user/ban/${user.user_id}`)
      console.info('【封禁用户响应数据】', data)
      const operation = data.operation

      if (data && operation && operation.status === 'SUCCESS') {
        ElMessage.success({
          message: `【封禁用户成功】已封禁用户 ${user.username}`,
          duration: 3000,
        })
        getUserList()
      }
    }).catch(() => {
      ElMessage.info({
        message: '【已取消封禁操作】',
        duration: 2000,
      })
    })
  } catch (error) {
    console.error('【封禁用户错误】', error)
    ElMessage.error({
      message: '【封禁用户错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    formLoading.value = false
  }
}

// 解禁用户
const unbanUser = async (user) => {
  try {
    ElMessageBox.confirm(
      `确定要解除用户 ${user.username} 的封禁状态吗？解除后该用户将可以正常登录系统。`,
      '解除封禁',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      },
    ).then(async () => {
      formLoading.value = true

      const data = await request.put(`/user/unban/${user.user_id}`)
      console.info('【解禁用户响应数据】', data)
      const operation = data.operation

      if (data && operation && operation.status === 'SUCCESS') {
        ElMessage.success({
          message: `【解禁成功】已解除用户 ${user.username} 的封禁状态`,
          duration: 3000,
        })
        getUserList()
      }
    }).catch(() => {
      ElMessage.info({
        message: '【已取消解禁操作】',
        duration: 2000,
      })
    })
  } catch (error) {
    console.error('【解除封禁用户错误】', error)
    ElMessage.error({
      message: '【解除封禁用户错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    formLoading.value = false
  }
}

// 注销用户
const deleteUser = async (user) => {
  try {
    ElMessageBox.confirm(
      `确定要注销用户 ${user.username} 吗？注销后该用户将无法登录系统`,
      '注销用户',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    ).then(async () => {
      formLoading.value = true

      const data = await request.delete(`/user/delete/${user.user_id}`)
      console.info('【注销用户响应数据】', data)
      const operation = data.operation

      if (data && operation && operation.status === 'SUCCESS') {
        ElMessage.success({
          message: `【注销用户成功】已注销用户 ${user.username}`,
          duration: 3000,
        })
        getUserList()
      }
    }).catch(() => {
      ElMessage.info({
        message: '【已取消注销操作】',
        duration: 2000,
      })
    })
  } catch (error) {
    console.error('【注销用户错误】', error)
    ElMessage.error({
      message: '【注销用户错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    formLoading.value = false
  }
}

// 重置搜索表单
const resetSearchForm = () => {
  searchForm.value = {
    keyword: '',
    start_date: '',
    end_date: '',
  }
  getUserList()
}

// 恢复已注销用户
const undeleteUser = async (user) => {
  try {
    ElMessageBox.confirm(
      `确定要恢复已注销的用户 ${user.username} 吗？恢复后该用户将可以正常登录系统`,
      '恢复注销用户',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      },
    ).then(async () => {
      formLoading.value = true

      const data = await request.put(`/user/undelete/${user.user_id}`)
      console.info('【恢复注销用户响应数据】', data)
      const operation = data.operation

      if (data && operation && operation.status === 'SUCCESS') {
        ElMessage.success({
          message: `【恢复注销用户成功】已恢复用户 ${user.username}`,
          duration: 3000,
        })
        getUserList()
      }
    }).catch(() => {
      ElMessage.info({
        message: '【已取消恢复注销操作】',
        duration: 2000,
      })
    })
  } catch (error) {
    console.error('【恢复注销用户错误】', error)
    ElMessage.error({
      message: '【恢复注销用户错误】' + (error?.message || '请重试'),
      duration: 5000,
    })
  } finally {
    formLoading.value = false
  }
}

onMounted(() => {
  // 先获取用户信息，防止未登录/无权限用户能够直接访问该页面
  getUserInfo().then(() => {
    if (userInfo.value) {
      if (isAdminOrDeveloper.value) {
        getUserList()
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
  <div class="user-management-container">
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

        <!-- 用户列表 -->
        <el-card class="user-card">
          <template #header>
            <div class="card-header">
              <h2>用户管理</h2>
              <div>
                <el-button type="primary" @click="openAddUserDialog">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  添加用户
                </el-button>
                <el-button type="primary" size="small" @click="getUserList" :loading="resourceStore.userLoading.value">
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>

          <!-- 搜索表单 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="关键词搜索">
              <el-input v-model="searchForm.keyword" placeholder="搜索ID/用户名/邮箱/角色等" clearable style="width: 300px" />
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker v-model="searchForm.start_date" type="datetime" placeholder="开始日期时间"
                format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" clearable style="width: 200px" />
              <span class="date-separator">至</span>
              <el-date-picker v-model="searchForm.end_date" type="datetime" placeholder="结束日期时间"
                format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="getUserList">搜索</el-button>
              <el-button @click="resetSearchForm">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="userList" style="width: 100%" v-loading="resourceStore.userLoading.value">
            <el-table-column prop="user_id" label="ID" width="63" sortable />
            <el-table-column prop="username" label="用户名" width="90" sortable show-overflow-tooltip />
            <el-table-column prop="email" label="邮箱" width="167" sortable show-overflow-tooltip />
            <el-table-column prop="last_name" label="姓氏" width="76" sortable show-overflow-tooltip />
            <el-table-column prop="first_name" label="名字" width="76" sortable show-overflow-tooltip />
            <el-table-column prop="role" label="角色" width="110" sortable :filters="roleFilters"
              :filter-method="filterRole" filter-placement="bottom">
              <template #default="scope">
                <el-tag :type="roleType(scope.row.role)">
                  {{ formatRole(scope.row.role) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="avatar_path" label="头像" width="109">
              <template #default="scope">
                <el-avatar :size="85" :src="scope.row.avatar_path ? `${requestBaseURL}/${scope.row.avatar_path}` : ''">
                  <el-icon :size="20">
                    <User />
                  </el-icon>
                </el-avatar>
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="手机号" width="110" sortable />
            <el-table-column prop="status" label="用户状态" width="118" sortable :filters="statusFilters"
              :filter-method="filterStatus" filter-placement="bottom">
              <template #default="scope">
                <el-tag :type="statusType(scope.row.status)">
                  {{ formatStatus(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="注册时间" width="147" sortable :formatter="dataTimeFormatter" />
            <el-table-column prop="last_login" label="最后登录时间" width="147" sortable :formatter="dataTimeFormatter" />
            <el-table-column prop="updated_at" label="最后更新时间" width="147" sortable :formatter="dataTimeFormatter" />
            <el-table-column prop="deleted_at" label="注销时间" width="147" sortable :formatter="dataTimeFormatter" />
            <el-table-column label="操作" fixed="right" width="251">
              <template #default="scope">
                <!-- 编辑按钮 -->
                <el-button type="primary" size="small" @click="openEditUserDialog(scope.row)">
                  <el-icon>
                    <Edit />
                  </el-icon>
                  编辑
                </el-button>

                <!-- 注销/恢复注销按钮 -->
                <el-button v-if="scope.row.status !== 'DELETED'" type="warning" size="small"
                  @click="deleteUser(scope.row)">
                  <el-icon>
                    <Delete />
                  </el-icon>
                  注销
                </el-button>
                <el-button v-else type="success" size="small" @click="undeleteUser(scope.row)">
                  <el-icon>
                    <RefreshRight />
                  </el-icon>
                  恢复注销
                </el-button>

                <!-- 封禁/解除封禁按钮 -->
                <el-button v-if="scope.row.status !== 'BANNED'" type="danger" size="small" @click="banUser(scope.row)">
                  <el-icon>
                    <CloseBold />
                  </el-icon>
                  封禁
                </el-button>
                <el-button v-else type="info" size="small" @click="unbanUser(scope.row)">
                  <el-icon>
                    <Check />
                  </el-icon>
                  解除封禁
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页组件 -->
          <div class="pagination-container">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
              layout="total, prev, pager, next, jumper" :total="total" @current-change="getUserList" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 用户表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="selectedUser ? '编辑用户' : '添加用户'" width="500px">
      <!-- 添加用户表单 -->
      <el-form v-if="!selectedUser" ref="addFormRef" :model="addUserForm" :rules="addFormRules" label-width="100px"
        status-icon>
        <el-form-item prop="avatar_file" class="avatar-upload">
          <p class="upload-label">头像上传（可选）</p>
          <el-upload class="avatar-uploader" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
            accept="image/png, image/jpg, image/jpeg" :on-change="handleAddAvatarChange" :auto-upload="false"
            :show-file-list="false">
            <img v-if="addAvatarPreviewUrl" :src="addAvatarPreviewUrl" class="avatar-preview" />
            <div v-else class="avatar-placeholder">
              <el-icon class="avatar-icon">
                <Avatar />
              </el-icon>
              <span>点击上传</span>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="用户名" prop="username" required>
          <el-input v-model="addUserForm.username" placeholder="请输入用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email" required>
          <el-input v-model="addUserForm.email" placeholder="请输入邮箱" :prefix-icon="Message" />
        </el-form-item>
        <el-form-item label="密码" prop="password" required>
          <el-input v-model="addUserForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock"
            show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="addUserForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="开发人员" value="DEVELOPER" />
            <el-option label="普通用户" value="USER" />
          </el-select>
        </el-form-item>
        <el-form-item label="姓氏" prop="last_name">
          <el-input v-model="addUserForm.last_name" placeholder="请输入姓氏" />
        </el-form-item>
        <el-form-item label="名字" prop="first_name">
          <el-input v-model="addUserForm.first_name" placeholder="请输入名字" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="addUserForm.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>

      <!-- 编辑用户表单 -->
      <el-form v-else ref="editFormRef" :model="editUserForm" :rules="editFormRules" label-width="100px" status-icon>
        <el-form-item prop="avatar_file" class="avatar-upload">
          <p class="upload-label">头像上传（可选）</p>
          <el-upload class="avatar-uploader" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
            accept="image/png, image/jpg, image/jpeg" :on-change="handleEditAvatarChange" :auto-upload="false"
            :show-file-list="false">
            <img v-if="editAvatarPreviewUrl" :src="editAvatarPreviewUrl" class="avatar-preview" />
            <div v-else class="avatar-placeholder">
              <el-icon class="avatar-icon">
                <Avatar />
              </el-icon>
              <span>点击上传</span>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="用户名" prop="username" required>
          <el-input v-model="editUserForm.username" placeholder="请输入用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email" required>
          <el-input v-model="editUserForm.email" placeholder="请输入邮箱" :prefix-icon="Message" />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="editUserForm.password" type="password" placeholder="请输入新密码" :prefix-icon="Lock"
            show-password />
          <div class="form-tip">留空表示不修改密码</div>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editUserForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="开发人员" value="DEVELOPER" />
            <el-option label="普通用户" value="USER" />
          </el-select>
        </el-form-item>
        <el-form-item label="姓氏" prop="last_name">
          <el-input v-model="editUserForm.last_name" placeholder="请输入姓氏" />
        </el-form-item>
        <el-form-item label="名字" prop="first_name">
          <el-input v-model="editUserForm.first_name" placeholder="请输入名字" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editUserForm.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="selectedUser ? submitEditUserForm() : submitAddUserForm()"
            :loading="formLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-management-container {
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

.user-card {
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.search-form {
  margin-bottom: 20px;
  padding: 15px;
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

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.avatar-uploader {
  width: 120px;
  height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  text-align: center;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.avatar-placeholder span {
  font-size: 12px;
  color: #8c939d;
  margin-top: 8px;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  display: block;
  object-fit: cover;
}
</style>
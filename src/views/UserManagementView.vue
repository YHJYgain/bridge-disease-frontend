<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { useUserStore } from '../stores/userStore'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const router = useRouter()
const { userInfo, loading, getUserInfo } = useUserStore()
const formLoading = ref(false)
const userList = ref([])
const dialogVisible = ref(false)
const currentUser = ref(null)

// 判断用户角色
const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
const isDeveloper = computed(() => userInfo.value?.role === 'DEVELOPER')
const isAdminOrDeveloper = computed(() => isAdmin.value || isDeveloper.value)

// 表单数据
const userForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'USER',
  first_name: '',
  last_name: '',
  phone: ''
})

// 获取用户列表
const getUserList = async () => {
  try {
    loading.value = true
    // const response = await request.get('/users')
    // if (response && response.data) {
    //   userList.value = response.data
    // }
  } catch (error) {
    console.error('获取用户列表失败', error)
    ElMessage.error('获取用户列表失败，请重试')
  } finally {
    loading.value = false
  }
}

// 打开添加用户对话框
const openAddUserDialog = () => {
  currentUser.value = null
  userForm.value = {
    username: '',
    email: '',
    password: '',
    role: 'USER',
    first_name: '',
    last_name: '',
    phone: ''
  }
  dialogVisible.value = true
}

// 打开编辑用户对话框
const openEditUserDialog = (user) => {
  currentUser.value = user
  userForm.value = {
    username: user.username,
    email: user.email,
    password: '',
    role: user.role,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || ''
  }
  dialogVisible.value = true
}

// 提交用户表单
const submitUserForm = async () => {
  if (!userForm.value.username) {
    ElMessage.warning('请输入用户名')
    return
  }

  if (!userForm.value.email) {
    ElMessage.warning('请输入邮箱')
    return
  }

  if (!currentUser.value && !userForm.value.password) {
    ElMessage.warning('请输入密码')
    return
  }

  try {
    formLoading.value = true

    if (currentUser.value) {
      // 编辑用户
      const data = { ...userForm.value }
      if (!data.password) {
        delete data.password
      }

      // const response = await request.put(`/user/${currentUser.value.id}`, data)

      // if (response && response.operation && response.operation.status === 'SUCCESS') {
      //   ElMessage.success('用户信息更新成功')
      //   dialogVisible.value = false
      //   getUserList()
      // }
    } else {
      // 添加用户
      // const response = await request.post('/user', userForm.value)

      // if (response && response.operation && response.operation.status === 'SUCCESS') {
      //   ElMessage.success('用户添加成功')
      //   dialogVisible.value = false
      //   getUserList()
      // }
    }
  } catch (error) {
    console.error('提交用户表单失败', error)
    ElMessage.error('提交用户表单失败，请重试')
  } finally {
    formLoading.value = false
  }
}

// 删除用户
const deleteUser = async (id) => {
  try {
    // await request.delete(`/user/${id}`)
    ElMessage.success('删除成功')
    // 重新获取列表
    getUserList()
  } catch (error) {
    console.error('删除用户失败', error)
    ElMessage.error('删除用户失败，请重试')
  }
}

// 格式化角色
const formatRole = (role) => {
  const roleMap = {
    'ADMIN': '管理员',
    'DEVELOPER': '开发人员',
    'USER': '普通用户'
  }
  return roleMap[role] || role
}

// 角色标签类型
const roleType = (role) => {
  const typeMap = {
    'ADMIN': 'danger',
    'DEVELOPER': 'warning',
    'USER': 'info'
  }
  return typeMap[role] || ''
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
                  添加用户
                </el-button>
                <el-button type="primary" size="small" @click="getUserList" :loading="loading">
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="userList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="role" label="角色" width="120">
              <template #default="scope">
                <el-tag :type="roleType(scope.row.role)">
                  {{ formatRole(scope.row.role) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button type="primary" size="small" @click="openEditUserDialog(scope.row)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="deleteUser(scope.row.id)"
                  :disabled="scope.row.id === userInfo.id">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>

    <!-- 用户表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="currentUser ? '编辑用户' : '添加用户'" width="500px">
      <el-form :model="userForm" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item :label="currentUser ? '新密码' : '密码'" :required="!currentUser">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
          <div class="form-tip" v-if="currentUser">留空表示不修改密码</div>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="开发人员" value="developer" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="名">
          <el-input v-model="userForm.first_name" placeholder="请输入名" />
        </el-form-item>
        <el-form-item label="姓">
          <el-input v-model="userForm.last_name" placeholder="请输入姓" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="userForm.phone" placeholder="请输入电话号码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUserForm" :loading="formLoading">
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
</style>
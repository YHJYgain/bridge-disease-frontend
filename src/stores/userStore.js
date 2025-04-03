import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const userInfo = ref(null)
const loading = ref(false)

const getUserInfo = async () => {
  try {
    loading.value = true
    // 检查是否有 token
    const token = localStorage.getItem('access_token')
    if (!token) {
      ElMessage.warning({
        message: '【获取用户信息失败】未登录或登录已过期，请重新登录',
        duration: 4000
      })
      return
    }

    // 从 localStorage 中获取用户信息
    const storedUser = localStorage.getItem('login_user')
    userInfo.value = JSON.parse(storedUser)
  } catch (error) {
    console.error('【获取用户信息错误】', error)
    ElMessage.error({
      message: '【获取用户信息错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    loading.value = false
  }
}

export function useUserStore() {
  return {
    userInfo,
    loading,
    getUserInfo
  }
}
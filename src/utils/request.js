import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '../router'

const request = axios.create({
  baseURL: 'http://127.0.0.1:5000',
  timeout: 5000
})

// 是否正在刷新 token
let isRefreshing = false
// 请求队列
let requestQueue = []

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  async error => {
    // 如果响应中包含数据，则返回数据
    if (error.response?.data) {
      // 处理 token 过期情况 (401 错误)
      if (error.response.status === 401) {
        const originalRequest = error.config
        const refreshToken = localStorage.getItem('refresh_token')

        // 如果没有 refresh_token，直接跳转到登录页
        if (!refreshToken) {
          ElMessage.error({
            message: '登录已过期，请重新登录',
            duration: 5000
          })
          localStorage.clear()
          router.push('/login')
          return Promise.reject(error)
        }

        // 如果已经在刷新 token，将请求加入队列
        if (isRefreshing) {
          return new Promise(resolve => {
            requestQueue.push(() => {
              originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`
              resolve(request(originalRequest))
            })
          })
        }

        isRefreshing = true

        try {
          // 创建一个新的 axios 实例来刷新 token，避免进入拦截器循环
          const refreshResponse = await axios.post('http://127.0.0.1:5000/user/refresh', {}, {
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          })

          // 更新 token
          const newToken = refreshResponse.data.access_token
          localStorage.setItem('access_token', newToken)

          // 重新发送队列中的请求
          requestQueue.forEach(callback => callback())
          requestQueue = []

          // 重新发送原始请求
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return request(originalRequest)
        } catch (refreshError) {
          // 刷新 token 失败，说明 refresh_token 过期，清除 token 并跳转到登录页
          console.error('刷新 token 失败', refreshError)
          ElMessage.error('登录已过期，请重新登录')
          ElMessage.error({
            message: '登录已过期，请重新登录',
            duration: 5000
          })
          localStorage.clear()
          router.push('/login')
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      // 显示错误信息
      ElMessage.error({
        message: error.response.data.operation?.failure_message || error.response.data.failure_message || '请求失败',
        duration: 5000
      })
      // 返回响应数据，让业务代码可以继续处理
      return error.response.data
    }
    // 如果没有响应数据，则拒绝 Promise
    ElMessage.error('网络错误，请稍后重试')
    return Promise.reject(error)
  }
)

export default request
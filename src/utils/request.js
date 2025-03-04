import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: 'http://127.0.0.1:5000',
  timeout: 5000
})

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
  error => {
    // 如果响应中包含数据，则返回数据
    if (error.response?.data) {
      // 显示错误信息
      ElMessage.error({
        message: error.response.data.operation?.failure_message || '请求失败',
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
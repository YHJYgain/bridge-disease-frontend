import { ref, readonly } from 'vue'
import request from '../utils/request'

// 创建一个简单的状态存储，用于缓存媒体列表、模型列表、检测分割记录数据和用户列表数据
const mediaList = ref([])
const modelList = ref([])
const detectionList = ref([])
const userList = ref([])
const operationList = ref([])
const mediaTotal = ref(0)
const modelTotal = ref(0)
const detectionTotal = ref(0)
const userTotal = ref(0)
const operationTotal = ref(0)
const mediaLoading = ref(false)
const modelLoading = ref(false)
const detectionLoading = ref(false)
const userLoading = ref(false)
const operationLoading = ref(false)
const lastMediaFetchTime = ref(null)
const lastModelFetchTime = ref(null)
const lastDetectionFetchTime = ref(null)
const lastUserFetchTime = ref(null)
const lastOperationFetchTime = ref(null)

// 缓存过期时间（毫秒）
const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5 分钟

// 检查缓存是否过期
const isCacheExpired = (lastFetchTime) => {
  if (!lastFetchTime.value) return true
  return Date.now() - lastFetchTime.value > CACHE_EXPIRY_TIME
}

// 媒体列表获取函数
const fetchMediaList = async (userInfo, currentPage = 1, pageSize = 5, forceRefresh = false) => {
  // 如果数据已加载且缓存未过期，则直接返回缓存的数据
  if (mediaList.value.length > 0 && !forceRefresh && !isCacheExpired(lastMediaFetchTime)) {
    return { medias: mediaList.value, total: mediaTotal.value }
  }

  try {
    mediaLoading.value = true
    let data = null

    // 根据用户角色来决定获取媒体列表的方式
    const isAdmin = userInfo?.role === 'ADMIN'
    const isDeveloper = userInfo?.role === 'DEVELOPER'
    const isAdminOrDeveloper = isAdmin || isDeveloper

    if (isAdminOrDeveloper) {
      // 获取所有用户的媒体列表
      data = await request.get('/media/medias/all', {
        params: {
          page: currentPage,
          per_page: pageSize
        }
      })
    } else {
      // 获取当前用户的媒体列表
      data = await request.get(`/media/medias/${userInfo.user_id}`, {
        params: {
          page: currentPage,
          per_page: pageSize
        }
      })
    }

    if (data && !data.failure_message) {
      mediaList.value = data.medias
      mediaTotal.value = data.total
      lastMediaFetchTime.value = Date.now()
      return { medias: data.medias, total: data.total }
    }
    return { medias: [], total: 0 }
  } catch (error) {
    return { medias: [], total: 0, error }
  } finally {
    mediaLoading.value = false
  }
}

// 模型列表获取函数
const fetchModelList = async (currentPage = 1, pageSize = 5, forceRefresh = false) => {
  // 如果数据已加载且缓存未过期，则直接返回缓存的数据
  if (modelList.value.length > 0 && !forceRefresh && !isCacheExpired(lastModelFetchTime)) {
    return { models: modelList.value, total: modelTotal.value }
  }

  try {
    modelLoading.value = true

    // 发送获取模型列表请求
    const data = await request.get('/model/models/all', {
      params: {
        page: currentPage,
        per_page: pageSize
      }
    })

    if (data && !data.failure_message) {
      modelList.value = data.models
      modelTotal.value = data.total
      lastModelFetchTime.value = Date.now()
      return { models: data.models, total: data.total }
    }
    return { models: [], total: 0 }
  } catch (error) {
    return { models: [], total: 0, error }
  } finally {
    modelLoading.value = false
  }
}

// 检测分割记录列表获取函数
const fetchDetectionList = async (userInfo, currentPage = 1, pageSize = 5, forceRefresh = false) => {
  // 如果数据已加载且缓存未过期，则直接返回缓存的数据
  if (detectionList.value.length > 0 && !forceRefresh && !isCacheExpired(lastDetectionFetchTime)) {
    return { detections: detectionList.value, total: detectionTotal.value }
  }

  try {
    detectionLoading.value = true
    let data = null

    // 根据用户角色来决定获取检测分割记录列表的方式
    const isAdmin = userInfo?.role === 'ADMIN'
    const isDeveloper = userInfo?.role === 'DEVELOPER'
    const isAdminOrDeveloper = isAdmin || isDeveloper

    if (isAdminOrDeveloper) {
      // 获取所有用户的检测分割记录列表
      data = await request.get('/detection/detections/all', {
        params: {
          page: currentPage,
          per_page: pageSize
        }
      })
    } else {
      // 获取当前用户的检测分割记录列表
      data = await request.get(`/detection/detections/${userInfo.user_id}`, {
        params: {
          page: currentPage,
          per_page: pageSize
        }
      })
    }

    if (data && !data.failure_message) {
      detectionList.value = data.detections
      detectionTotal.value = data.total
      lastDetectionFetchTime.value = Date.now()
      return { detections: data.detections, total: data.total }
    }
    return { detections: [], total: 0 }
  } catch (error) {
    return { detections: [], total: 0, error }
  } finally {
    detectionLoading.value = false
  }
}

// 用户列表获取函数
const fetchUserList = async (userInfo, currentPage = 1, pageSize = 5, forceRefresh = false) => {
  // 检查用户权限，只有管理员或开发人员才能获取用户列表
  const isAdmin = userInfo?.role === 'ADMIN'
  const isDeveloper = userInfo?.role === 'DEVELOPER'
  const isAdminOrDeveloper = isAdmin || isDeveloper

  // 如果不是管理员或开发人员，拒绝请求
  if (!isAdminOrDeveloper) {
    return { users: [], total: 0, error: '权限不足，只有管理员或开发人员才能查看用户列表' }
  }

  // 如果数据已加载且缓存未过期，则直接返回缓存的数据
  if (userList.value.length > 0 && !forceRefresh && !isCacheExpired(lastUserFetchTime)) {
    return { users: userList.value, total: userTotal.value }
  }

  try {
    userLoading.value = true

    // 发送获取用户列表请求
    const data = await request.get('/user/users/all', {
      params: {
        page: currentPage,
        per_page: pageSize
      }
    })

    if (data && !data.failure_message) {
      userList.value = data.users
      userTotal.value = data.total
      lastUserFetchTime.value = Date.now()
      return { users: data.users, total: data.total }
    }
    return { users: [], total: 0 }
  } catch (error) {
    return { users: [], total: 0, error }
  } finally {
    userLoading.value = false
  }
}

// 操作日志列表获取函数
const fetchOperationList = async (userInfo, currentPage = 1, pageSize = 5, forceRefresh = false) => {
  // 检查用户权限，只有管理员或开发人员才能获取操作日志列表
  const isAdmin = userInfo?.role === 'ADMIN'
  const isDeveloper = userInfo?.role === 'DEVELOPER'
  const isAdminOrDeveloper = isAdmin || isDeveloper

  // 如果不是管理员或开发人员，拒绝请求
  if (!isAdminOrDeveloper) {
    return { operations: [], total: 0, error: '权限不足，只有管理员或开发人员才能查看操作日志' }
  }

  // 如果数据已加载且缓存未过期，则直接返回缓存的数据
  if (operationList.value.length > 0 && !forceRefresh && !isCacheExpired(lastOperationFetchTime)) {
    return { operations: operationList.value, total: operationTotal.value }
  }

  try {
    operationLoading.value = true
    let data = null

    // 获取当前用户的操作日志列表
    data = await request.get(`/operation/operations/all`, {
      params: {
        page: currentPage,
        per_page: pageSize
      }
    })

    if (data && !data.failure_message) {
      operationList.value = data.operations
      operationTotal.value = data.total
      lastOperationFetchTime.value = Date.now()
      return { operations: data.operations, total: data.total }
    }
    return { operations: [], total: 0 }
  } catch (error) {
    return { operations: [], total: 0, error }
  } finally {
    operationLoading.value = false
  }
}

// 清除缓存
const clearCache = () => {
  mediaList.value = []
  modelList.value = []
  detectionList.value = []
  userList.value = []
  operationList.value = []
  mediaTotal.value = 0
  modelTotal.value = 0
  detectionTotal.value = 0
  userTotal.value = 0
  operationTotal.value = 0
  lastMediaFetchTime.value = null
  lastModelFetchTime.value = null
  lastDetectionFetchTime.value = null
  lastUserFetchTime.value = null
  lastOperationFetchTime.value = null
}

// 导出 composable 函数
export function useResourceStore() {
  return {
    // 状态
    mediaList: readonly(mediaList),
    modelList: readonly(modelList),
    detectionList: readonly(detectionList),
    userList: readonly(userList),
    operationList: readonly(operationList),
    mediaTotal: readonly(mediaTotal),
    modelTotal: readonly(modelTotal),
    detectionTotal: readonly(detectionTotal),
    userTotal: readonly(userTotal),
    operationTotal: readonly(operationTotal),
    mediaLoading: readonly(mediaLoading),
    modelLoading: readonly(modelLoading),
    detectionLoading: readonly(detectionLoading),
    userLoading: readonly(userLoading),
    operationLoading: readonly(operationLoading),
    
    // 方法
    fetchMediaList,
    fetchModelList,
    fetchDetectionList,
    fetchUserList,
    fetchOperationList,
    clearCache
  }
}
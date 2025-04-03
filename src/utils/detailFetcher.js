import request from './request'
import { ElMessage } from 'element-plus'

/**
 * 通用错误处理函数
 * @param {Error} error - 错误对象
 * @param {string} entityType - 实体类型名称
 * @returns {Object} 包含错误信息的对象
 */
const handleError = (error, entityType, entityId) => {
    console.error(`【获取${entityType} ID=${entityId} 详情错误】`, error)
    const errorMessage = `【获取${entityType} ID=${entityId} 详情错误】${error?.message || '请重试'}`
    ElMessage.error({
        message: errorMessage,
        duration: 5000
    })
    return { error: errorMessage }
}

/**
 * 根据用户 ID 获取用户详情
 * @param {number} userId - 用户 ID
 * @returns {Promise<Object>} 用户详情对象
 */
export const getUserDetail = async (userId) => {
    if (!userId) {
        return { error: '【获取用户详情失败】用户 ID 为空' }
    }

    try {
        const response = await request.get(`/user/detail/${userId}`)
        console.info(`【获取用户 ID=${userId} 详情响应数据】`, response)

        if (response && !response.failure_message) {
            return { user: response.user }
        }
        return { error: `【获取用户 ID=${userId} 详情错误】${response?.failure_message || '请重试'}` }
    } catch (error) {
        return handleError(error, '用户', userId)
    }
}

/**
 * 根据模型 ID 获取模型详情
 * @param {number} modelId - 模型 ID
 * @returns {Promise<Object>} 模型详情对象
 */
export const getModelDetail = async (modelId) => {
    if (!modelId) {
        return { error: '【获取模型详情失败】模型 ID 为空' }
    }

    try {
        const response = await request.get(`/model/detail/${modelId}`)
        console.info(`【获取模型 ID=${modelId} 详情响应数据】`, response)

        if (response && !response.failure_message) {
            return { model: response.model }
        }
        return { error: `【获取模型 ID=${modelId} 详情错误】${response?.failure_message || '请重试'}` }
    } catch (error) {
        return handleError(error, '模型', modelId)
    }
}

/**
 * 根据媒体 ID 获取媒体详情
 * @param {number} mediaId - 媒体 ID
 * @returns {Promise<Object>} 媒体详情对象
 */
export const getMediaDetail = async (mediaId) => {
    if (!mediaId) {
        return { error: '【获取媒体详情失败】媒体 ID 为空' }
    }

    try {
        const response = await request.get(`/media/detail/${mediaId}`)
        console.info(`【获取媒体 ID=${mediaId} 详情响应数据】`, response)

        if (response && !response.failure_message) {
            return { media: response.media }
        }
        return { error: `【获取媒体 ID=${mediaId} 详情错误】${response?.failure_message || '请重试'}` }
    } catch (error) {
        return handleError(error, '媒体', mediaId)
    }
}

/**
 * 根据检测分割 ID 获取检测分割详情
 * @param {number} detectionId - 检测分割 ID
 * @returns {Promise<Object>} 检测分割详情对象
 */
export const getDetectionDetail = async (detectionId) => {
    if (!detectionId) {
        return { error: '【获取检测分割详情失败】检测分割 ID 为空' }
    }

    try {
        const response = await request.get(`/detection/detail/${detectionId}`)
        console.info(`【获取检测分割 ID=${detectionId} 详情响应数据】`, response)

        if (response && !response.failure_message) {
            return { detection: response.detection }
        }
        return { error: `【获取检测分割 ID=${detectionId} 详情错误】${response?.failure_message || '请重试'}`  }
    } catch (error) {
        return handleError(error, '检测记录', detectionId)
    }
}

/**
 * 根据操作 ID 获取操作详情
 * @param {number} operationId - 操作 ID
 * @returns {Promise<Object>} 操作日志详情对象
 */
export const getOperationLogDetail = async (operationId) => {
    if (!operationId) {
        return { error: '【获取操作详情失败】操作 ID 为空' }
    }

    try {
        const response = await request.get(`/operation/detail/${operationId}`)
        console.info(`【获取操作 ID=${operationId} 详情响应数据】`, response)

        if (response && !response.failure_message) {
            return { operation: response.operation }
        }
        return { error: `【获取操作 ID=${operationId} 详情错误】${response?.failure_message || '请重试'}` }
    } catch (error) {
        return handleError(error, '操作日志', operationId)
    }
}
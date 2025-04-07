/**
 * 日期时间格式化工具函数
 * 提供通用的日期时间格式化功能，支持不同格式和时区处理
 */

/**
 * 格式化日期时间为中文时区的字符串
 * @param {string} dateTimeStr - 日期时间字符串
 * @param {string} defaultValue - 当日期时间为空时返回的默认值，默认为'暂无数据'
 * @returns {string} - 格式化后的日期时间字符串
 */
export const formatDateTime = (dateTimeStr, defaultValue = '暂无数据') => {
  if (!dateTimeStr) return defaultValue
  
  // 创建一个 UTC 日期对象
  const date = new Date(dateTimeStr);
  // 手动调整时区偏移，中国是 UTC+8，所以需要减去 8 小时
  const adjustedDate = new Date(date.getTime() - 8 * 60 * 60 * 1000)
  return adjustedDate.toLocaleString('zh-CN') // 格式化为中文时区的日期字符串
}

/**
 * 格式化日期时间为指定格式的字符串
 * @param {string} dateTimeStr - 日期时间字符串
 * @param {object} options - 格式化选项
 * @param {string} options.locale - 区域设置，默认为'zh-CN'
 * @param {object} options.formatOptions - 格式化选项，参考 Intl.DateTimeFormat 的选项
 * @param {string} defaultValue - 当日期时间为空时返回的默认值，默认为'暂无数据'
 * @returns {string} - 格式化后的日期时间字符串
 */
export const formatDateTimeWithOptions = (dateTimeStr, options = {}, defaultValue = '暂无数据') => {
  if (!dateTimeStr) return defaultValue
  
  const { locale = 'zh-CN', formatOptions = {} } = options
  
  // 创建一个 UTC 日期对象
  const date = new Date(dateTimeStr)
  // 手动调整时区偏移，中国是 UTC+8，所以需要减去 8 小时
  const adjustedDate = new Date(date.getTime() - 8 * 60 * 60 * 1000)
  
  // 使用 Intl.DateTimeFormat 进行格式化
  return new Intl.DateTimeFormat(locale, formatOptions).format(adjustedDate)
}

/**
 * 格式化日期时间为年月日格式
 * @param {string} dateTimeStr - 日期时间字符串
 * @param {string} defaultValue - 当日期时间为空时返回的默认值，默认为'暂无数据'
 * @returns {string} - 格式化后的日期字符串，如：2023 年 1 月 1 日
 */
export const formatDate = (dateTimeStr, defaultValue = '暂无数据') => {
  return formatDateTimeWithOptions(dateTimeStr, {
    formatOptions: {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  }, defaultValue)
}

/**
 * 格式化日期时间为时分秒格式
 * @param {string} dateTimeStr - 日期时间字符串
 * @param {string} defaultValue - 当日期时间为空时返回的默认值，默认为'暂无数据'
 * @returns {string} - 格式化后的时间字符串，如：14:30:45
 */
export const formatTime = (dateTimeStr, defaultValue = '暂无数据') => {
  return formatDateTimeWithOptions(dateTimeStr, {
    formatOptions: {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }
  }, defaultValue)
};

/**
 * 格式化为相对时间（如：3 小时前，2 天前）
 * @param {string} dateTimeStr - 日期时间字符串
 * @param {string} defaultValue - 当日期时间为空时返回的默认值，默认为'暂无数据'
 * @returns {string} - 格式化后的相对时间字符串
 */
export const formatRelativeTime = (dateTimeStr, defaultValue = '暂无数据') => {
  if (!dateTimeStr) return defaultValue
  
  const date = new Date(dateTimeStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  // 定义时间单位和对应的秒数
  const timeUnits = [
    { unit: '年', seconds: 60 * 60 * 24 * 365 },
    { unit: '个月', seconds: 60 * 60 * 24 * 30 },
    { unit: '天', seconds: 60 * 60 * 24 },
    { unit: '小时', seconds: 60 * 60 },
    { unit: '分钟', seconds: 60 },
    { unit: '秒', seconds: 1 }
  ]
  
  // 查找最合适的时间单位
  for (const { unit, seconds } of timeUnits) {
    const value = Math.floor(diffInSeconds / seconds);
    if (value >= 1) {
      return `${value}${unit}前`;
    }
  }
  
  return '刚刚'
};

// 默认导出所有格式化函数
export default {
  formatDateTime,
  formatDateTimeWithOptions,
  formatDate,
  formatTime,
  formatRelativeTime
}
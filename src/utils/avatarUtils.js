/**
 * 头像上传工具函数
 * 提供头像上传相关的通用功能
 */
import { ElMessage } from 'element-plus'

/**
 * 处理头像上传
 * @param {File} file - 上传的文件对象
 * @param {Function} updateCallback - 更新头像文件的回调函数
 * @returns {boolean} - 返回 false 阻止自动上传
 */
export const handleAvatarUpload = (file, updateCallback) => {
  // 检查文件类型
  const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg']
  if (!allowedTypes.includes(file.raw.type)) {
    ElMessage.warning({
      message: '请上传 JPG/PNG/JEPG 格式的图片',
      duration: 4000
    })
    return false
  }

  // 检查文件大小（限制为 5MB）
  const isLt5M = file.raw.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.warning({
      message: '图片大小不能超过 5MB',
      duration: 4000
    })
    return false
  }

  // 验证通过，调用回调函数更新头像文件
  updateCallback(file.raw)
  return false // 阻止自动上传
}
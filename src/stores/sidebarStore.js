// 侧边栏状态管理
import { ref } from 'vue'

// 创建一个全局状态，用于存储侧边栏的折叠状态
const isCollapsed = ref(false)

// 初始化时从 localStorage 读取状态
if (typeof window !== 'undefined') {
  const savedState = localStorage.getItem('sidebar_collapsed')
  if (savedState !== null) {
    isCollapsed.value = savedState === 'true'
  }
}

// 切换折叠状态
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  // 保存到 localStorage
  localStorage.setItem('sidebar_collapsed', isCollapsed.value.toString())
}

export { isCollapsed, toggleCollapse }
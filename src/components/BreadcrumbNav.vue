<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 根据当前路由生成面包屑数据
const breadcrumbs = computed(() => {
  const pathArray = route.path.split('/').filter(Boolean)
  const result = [{ name: '首页', path: '/home' }]

  let currentPath = ''

  pathArray.forEach((segment) => {
    currentPath += `/${segment}`

    // 根据路径生成名称（可以根据实际路由配置调整）
    let name = segment.charAt(0).toUpperCase() + segment.slice(1)

    // 针对特定路径的名称映射
    const nameMap = {
      'home': '首页',
      'disease-detection': '病害检测分割',
      'detection-records': '检测分割记录',
      'media-library': '媒体库',
      'model-library': '模型库',
      'user-management': '用户管理',
      'operation-logs': '系统操作日志',
      'user-center': '个人中心'
    }

    if (nameMap[segment]) {
      name = nameMap[segment]
    }

    // 不重复添加首页
    if (segment !== 'home') {
      result.push({ name, path: currentPath })
    }
  })

  return result
})
</script>

<template>
  <div class="breadcrumb-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index"
        :to="index < breadcrumbs.length - 1 ? { path: item.path } : null">
        {{ item.name }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<style scoped>
.breadcrumb-container {
  padding: 2px 0;
  background-color: transparent;
}
</style>
<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import request from '../utils/request'

const props = defineProps({
  userInfo: {
    type: Object,
    default: () => ({})
  }
})

// 图表 DOM 引用
const userChartRef = ref(null)
const detectionChartRef = ref(null)
const mediaChartRef = ref(null)
const modelChartRef = ref(null)

// 图表实例
let userChart = null
let detectionChart = null
let mediaChart = null
let modelChart = null

// 统计数据
const statistics = ref({
  users: {
    total: 0,
    admin: 0,
    developer: 0,
    user: 0
  },
  detections: {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    failed: 0
  },
  medias: {
    total: 0,
    image: 0,
    video: 0
  },
  models: {
    total: 0
  }
})

// 加载状态
const loading = ref(true)

// 获取用户统计数据
const fetchUserStatistics = async () => {
  try {
    // 调用用户统计接口
    const response = await request.get('/user/statistics')
    if (response && response.data) {
      statistics.value.users = response.data
    }
    return true
  } catch (error) {
    console.error('获取用户统计数据失败', error)
    return false
  }
}

// 获取检测统计数据
const fetchDetectionStatistics = async () => {
  try {
    // 调用检测统计接口
    const response = await request.get('/detection/statistics')
    if (response && response.data) {
      statistics.value.detections = response.data
    }
    return true
  } catch (error) {
    console.error('获取检测统计数据失败', error)
    return false
  }
}

// 获取媒体统计数据
const fetchMediaStatistics = async () => {
  try {
    // 调用媒体统计接口
    const response = await request.get('/media/statistics')
    if (response && response.data) {
      statistics.value.medias = response.data
    }
    return true
  } catch (error) {
    console.error('获取媒体统计数据失败', error)
    return false
  }
}

// 获取模型统计数据
const fetchModelStatistics = async () => {
  try {
    // 调用模型统计接口
    const response = await request.get('/model/statistics')
    if (response && response.data) {
      statistics.value.models = response.data
    }
    return true
  } catch (error) {
    console.error('获取模型统计数据失败', error)
    return false
  }
}

// 获取所有统计数据
const fetchStatistics = async () => {
  try {
    loading.value = true
    // 并行调用四个统计接口
    // await Promise.all([
    //   fetchUserStatistics(),
    //   fetchDetectionStatistics(),
    //   fetchMediaStatistics(),
    //   fetchModelStatistics()
    // ])
  } catch (error) {
    console.error('获取统计数据失败', error)
  } finally {
    loading.value = false
  }
}

// 初始化用户统计图表
const initUserChart = () => {
  if (!userChartRef.value) return

  userChart = echarts.init(userChartRef.value)

  const option = {
    title: {
      text: '用户统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: ['管理员', '开发人员', '普通用户']
    },
    series: [
      {
        name: '用户类型',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: statistics.value.users.admin, name: '管理员' },
          { value: statistics.value.users.developer, name: '开发人员' },
          { value: statistics.value.users.user, name: '普通用户' }
        ]
      }
    ]
  }

  userChart.setOption(option)
}

// 初始化检测统计图表
const initDetectionChart = () => {
  if (!detectionChartRef.value) return

  detectionChart = echarts.init(detectionChartRef.value)

  const option = {
    title: {
      text: '检测分割记录统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: ['待处理', '处理中', '已完成', '失败']
    },
    series: [
      {
        name: '检测状态',
        type: 'pie',
        radius: '50%',
        data: [
          { value: statistics.value.detections.pending, name: '待处理' },
          { value: statistics.value.detections.in_progress, name: '处理中' },
          { value: statistics.value.detections.completed, name: '已完成' },
          { value: statistics.value.detections.failed, name: '失败' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  detectionChart.setOption(option)
}

// 初始化媒体统计图表
const initMediaChart = () => {
  if (!mediaChartRef.value) return

  mediaChart = echarts.init(mediaChartRef.value)

  const option = {
    title: {
      text: '媒体文件统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: ['图片', '视频'],
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: '数量',
        type: 'bar',
        barWidth: '60%',
        data: [
          { value: statistics.value.medias.image, name: '图片' },
          { value: statistics.value.medias.video, name: '视频' }
        ]
      }
    ]
  }

  mediaChart.setOption(option)
}

// 初始化模型统计图表
const initModelChart = () => {
  if (!modelChartRef.value) return

  modelChart = echarts.init(modelChartRef.value)

  const option = {
    title: {
      text: '模型统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: ['活跃', '非活跃']
    },
    series: [
      {
        name: '模型状态',
        type: 'pie',
        radius: ['40%', '70%'],
        itemStyle: {
          borderRadius: 5,
          borderColor: '#fff',
          borderWidth: 2
        },
        data: [
          { value: statistics.value.models.active, name: '活跃' },
          { value: statistics.value.models.inactive, name: '非活跃' }
        ]
      }
    ]
  }

  modelChart.setOption(option)
}

// 初始化所有图表
const initCharts = () => {
  initUserChart()
  initDetectionChart()
  initMediaChart()
  initModelChart()
}

// 监听窗口大小变化，调整图表大小
const handleResize = () => {
  userChart?.resize()
  detectionChart?.resize()
  mediaChart?.resize()
  modelChart?.resize()
}

// 监听统计数据变化，更新图表
watch(
  () => statistics.value,
  () => {
    initCharts()
  },
  { deep: true }
)

// 监听用户信息变化，获取统计数据
watch(
  () => props.userInfo,
  (newVal) => {
    if (newVal) {
      fetchStatistics()
    }
  },
  { immediate: true }
)

onMounted(() => {
  fetchStatistics()
  initCharts()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时移除事件监听
const onBeforeUnmount = () => {
  window.removeEventListener('resize', handleResize)
  userChart?.dispose()
  detectionChart?.dispose()
  mediaChart?.dispose()
  modelChart?.dispose()
}
</script>

<template>
  <div class="statistics-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="statistics-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>系统统计数据</h3>
              <el-button type="primary" size="small" @click="fetchStatistics" :loading="loading">
                刷新数据
              </el-button>
            </div>
          </template>

          <el-skeleton :rows="4" animated v-if="loading" />

          <div v-else>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
                <el-card shadow="never" class="info-card">
                  <div class="info-title">用户总数</div>
                  <div class="info-value">{{ statistics.users.total }}</div>
                </el-card>
              </el-col>

              <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
                <el-card shadow="never" class="info-card">
                  <div class="info-title">检测分割记录总数</div>
                  <div class="info-value">{{ statistics.detections.total }}</div>
                </el-card>
              </el-col>

              <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
                <el-card shadow="never" class="info-card">
                  <div class="info-title">媒体文件总数</div>
                  <div class="info-value">{{ statistics.medias.total }}</div>
                </el-card>
              </el-col>

              <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
                <el-card shadow="never" class="info-card">
                  <div class="info-title">模型总数</div>
                  <div class="info-value">{{ statistics.models.total }}</div>
                </el-card>
              </el-col>
            </el-row>

            <el-divider />

            <el-row :gutter="20">
              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <div ref="userChartRef" class="chart-container"></div>
              </el-col>

              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <div ref="detectionChartRef" class="chart-container"></div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <div ref="mediaChartRef" class="chart-container"></div>
              </el-col>

              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <div ref="modelChartRef" class="chart-container"></div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.statistics-container {
  padding: 1px;
}

.statistics-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-card {
  text-align: center;
  margin-bottom: 20px;
  background-color: #f5f7fa;
}

.info-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.info-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.chart-container {
  height: 350px;
  margin-bottom: 20px;
}
</style>
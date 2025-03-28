<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Upload, Delete, Download, Edit } from '@element-plus/icons-vue'
import request from '../utils/request'
import { formatDateTime } from '../utils/dateTimeFormatter'
import { resourceStore } from '../stores/resourceStore'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const requestBaseURL = request.defaults.baseURL
const router = useRouter()
const userInfo = ref(null)
const loading = ref(false)
const uploadLoading = ref(false)
const mediaStore = resourceStore()
const modelList = ref([])
const uploadDialogVisible = ref(false)
const editDialogVisible = ref(false)
const uploadFormRef = ref(null)

// 分页相关（默认每页 5 条）
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)

// 判断用户角色
const isDeveloper = computed(() => userInfo.value?.role === 'DEVELOPER')

const uploadForm = ref({
  model_file: null,
  disease_category: '',
  augmentation: '原图',
  layers: 0,
  parameters: 0,
  GFLOPs: 0.0,
  box_p: 0.0,
  box_r: 0.0,
  box_mAP50: 0.0,
  box_mAP50_95: 0.0,
  mask_p: 0.0,
  mask_r: 0.0,
  mask_mAP50: 0.0,
  mask_mAP50_95: 0.0,
  fitness_score: 0.0,
  f1_score: 0.0
})

// 获取用户信息
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
      router.push('/login')
      return
    }

    // 从 localStorage 中获取用户信息
    const storedUser = localStorage.getItem('login_user')
    userInfo.value = JSON.parse(storedUser);

    // 如果不是开发人员，跳转到首页
    if (!isDeveloper.value) {
      ElMessage.warning({
        message: '您非开发人员，没有权限访问此页面',
        duration: 4000
      })
      router.push('/home')
      return
    }
  } catch (error) {
    console.error('【获取用户信息错误】', error)
    ElMessage.error({
      message: '【获取用户信息错误】' + (error?.message || '请重试'),
      duration: 5000
    })
    router.push('/login')
  } finally {
    loading.value = false
  }
}

// 获取模型列表
const getModelList = async () => {
  try {
    loading.value = true

    // 使用共享的媒体存储获取模型列表
    const { models, total: totalCount, error } = await mediaStore.fetchModelList(
      currentPage.value,
      pageSize.value,
      true // 强制刷新，确保获取最新数据
    )

    if (error) {
      throw error
    }

    console.info('【获取模型列表响应数据】', { models, total: totalCount })

    modelList.value = models
    total.value = totalCount
  } catch (error) {
    console.error('【获取模型列表错误】', error)
    ElMessage.error({
      message: '【获取模型列表错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    loading.value = false
  }
}

// 格式化日期时间
const dataTimeFormatter = (row, column) => {
  return formatDateTime(row.updated_at); // 使用通用的日期时间格式化工具函数
}

const validateAugmentation = (rule, value, callback) => {
  if (!value) {
    callback() // 数据增强方式可以为空
    return
  }
  callback()
}

// 表单验证规则
const uploadFormRules = {
  model_file: [
    { required: true, message: '请选择要上传的模型文件', trigger: 'blur' }
  ],
  disease_category: [
    { required: true, message: '请输入病害类别', trigger: 'blur' }
  ],
  augmentation: [
    { validator: validateAugmentation, trigger: ['blur', 'change'] },
  ],
}

// 监听对话框关闭事件，重置表单
const resetUploadForm = () => {
  uploadForm.value = {
    model_file: null,
    disease_category: '',
    augmentation: '原图',
    layers: 0,
    parameters: 0,
    GFLOPs: 0.0,
    box_p: 0.0,
    box_r: 0.0,
    box_mAP50: 0.0,
    box_mAP50_95: 0.0,
    mask_p: 0.0,
    mask_r: 0.0,
    mask_mAP50: 0.0,
    mask_mAP50_95: 0.0,
    fitness_score: 0.0,
    f1_score: 0.0
  }

  // 如果表单引用存在，重置验证状态
  if (uploadFormRef.value) {
    uploadFormRef.value.resetFields()
  }
}

// 文件上传变化处理
const handleModelFileChange = (file) => {
  // 验证文件格式
  const allowedTypes = ['.pt', '.engine']
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'))

  if (!allowedTypes.includes(fileExtension)) {
    ElMessage.error('模型文件格式不正确，请上传 .pt/.engine 格式')
    return false
  }

  // 验证通过，更新模型文件
  uploadForm.value.model_file = file.raw
  return false // 阻止自动上传
}

// 上传模型
const uploadModel = async () => {
  if (!uploadFormRef.value) {
    ElMessage.error('【上传模型错误】表单实例不存在')
    return
  }

  try {
    await uploadFormRef.value.validate()
    uploadLoading.value = true

    const formData = new FormData()
    formData.append('model_file', uploadForm.value.model_file)
    formData.append('disease_category', uploadForm.value.disease_category)
    formData.append('augmentation', uploadForm.value.augmentation)
    formData.append('layers', uploadForm.value.layers)
    formData.append('parameters', uploadForm.value.parameters)
    formData.append('GFLOPs', uploadForm.value.GFLOPs)
    formData.append('box_p', uploadForm.value.box_p)
    formData.append('box_r', uploadForm.value.box_r)
    formData.append('box_mAP50', uploadForm.value.box_mAP50)
    formData.append('box_mAP50_95', uploadForm.value.box_mAP50_95)
    formData.append('mask_p', uploadForm.value.mask_p)
    formData.append('mask_r', uploadForm.value.mask_r)
    formData.append('mask_mAP50', uploadForm.value.mask_mAP50)
    formData.append('mask_mAP50_95', uploadForm.value.mask_mAP50_95)
    formData.append('fitness_score', uploadForm.value.fitness_score)
    formData.append('f1_score', uploadForm.value.f1_score)

    // 打印上传表单数据
    console.info('【上传模型表单数据】', {
      model_file: uploadForm.value.model_file ? '已选择' : '未选择',
      disease_category: uploadForm.value.disease_category,
      augmentation: uploadForm.value.augmentation,
      layers: uploadForm.value.layers,
      parameters: uploadForm.value.parameters,
      GFLOPs: uploadForm.value.GFLOPs,
      box_p: uploadForm.value.box_p,
      box_r: uploadForm.value.box_r,
      box_mAP50: uploadForm.value.box_mAP50,
      box_mAP50_95: uploadForm.value.box_mAP50_95,
      mask_p: uploadForm.value.mask_p,
      mask_r: uploadForm.value.mask_r,
      mask_mAP50: uploadForm.value.mask_mAP50,
      mask_mAP50_95: uploadForm.value.mask_mAP50_95,
      fitness_score: uploadForm.value.fitness_score,
      f1_score: uploadForm.value.f1_score
    })

    // 发送上传模型请求
    const data = await request.post('/model/upload', formData)
    console.info('【上传模型响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断上传是否成功
    if (operation && operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【上传模型成功】',
        duration: 3000
      })
      uploadDialogVisible.value = false
      resetUploadForm()
      getModelList()
    }
  } catch (error) {
    console.error('上传模型错误', error)
    ElMessage.error({
      message: '【上传模型错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    uploadLoading.value = false
  }
}

// 下载模型
const downloadModel = (file_path) => {
  window.open(`${requestBaseURL}/${file_path}`, '_blank')
}

// 编辑模型
const editModel = (model) => {
  // 设置当前编辑的模型数据
  uploadForm.value = {
    ...model,
    model_file: null // 不需要重新上传文件
  }
  editDialogVisible.value = true
}

// 保存编辑的模型
const saveEditModel = async () => {
  try {
    uploadLoading.value = true
    // 构建请求数据
    const updateData = {
      disease_category: uploadForm.value.disease_category,
      augmentation: uploadForm.value.augmentation,
      layers: uploadForm.value.layers,
      parameters: uploadForm.value.parameters,
      GFLOPs: uploadForm.value.GFLOPs,
      box_p: uploadForm.value.box_p,
      box_r: uploadForm.value.box_r,
      box_mAP50: uploadForm.value.box_mAP50,
      box_mAP50_95: uploadForm.value.box_mAP50_95,
      mask_p: uploadForm.value.mask_p,
      mask_r: uploadForm.value.mask_r,
      mask_mAP50: uploadForm.value.mask_mAP50,
      mask_mAP50_95: uploadForm.value.mask_mAP50_95,
      fitness_score: uploadForm.value.fitness_score,
      f1_score: uploadForm.value.f1_score
    }

    // await request.put(`/model/${uploadForm.value.model_id}`, updateData)
    ElMessage.success('模型信息更新成功')
    editDialogVisible.value = false
    // 重新获取列表
    getModelList()
  } catch (error) {
    console.error('更新模型信息失败', error)
    ElMessage.error('更新模型信息失败，请重试')
  } finally {
    uploadLoading.value = false
  }
}

// 删除模型
const deleteModel = async (id) => {
  try {
    // await request.delete(`/model/${id}`)
    ElMessage.success('删除成功')
    // 重新获取列表
    getModelList()
  } catch (error) {
    console.error('删除模型失败', error)
    ElMessage.error('删除模型失败，请重试')
  }
}

onMounted(() => {
  // 先获取用户信息，防止未登录/无权限用户能够直接访问该页面
  getUserInfo().then(() => {
    if (isDeveloper.value) {
      getModelList()
    }
  })
})
</script>

<template>
  <div class="model-library-container">
    <!-- 主要内容区域 -->
    <div class="main-container">
      <!-- 侧边栏导航 -->
      <div class="sidebar">
        <SidebarMenu />
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 面包屑导航 -->
        <BreadcrumbNav />

        <!-- 模型库列表 -->
        <el-card class="model-card">
          <template #header>
            <div class="card-header">
              <h2>模型库</h2>
              <div>
                <el-button type="primary" @click="uploadDialogVisible = true">
                  <el-icon>
                    <Upload />
                  </el-icon>
                  上传模型
                </el-button>
                <el-button type="primary" size="small" @click="getModelList" :loading="loading">
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="modelList" style="width: 100%" v-loading="loading">
            <el-table-column prop="model_id" label="ID" width="63" sortable />
            <el-table-column prop="disease_category" label="病害类别" show-overflow-tooltip />
            <el-table-column prop="augmentation" label="数据增强方式" show-overflow-tooltip />
            <el-table-column prop="layers" label="层数（layers）" sortable />
            <el-table-column prop="parameters" label="参数量（parameters）" sortable />
            <el-table-column prop="GFLOPs" label="计算量（GFLOPs）" sortable />
            <el-table-column prop="updated_at" label="更新时间" width="180" sortable :formatter="dataTimeFormatter" />
            <el-table-column prop="owner_id" label="所属用户" width="120" show-overflow-tooltip sortable />
            <el-table-column label="操作" fixed="right">
              <template #default="scope">
                <el-button type="success" size="small" @click="downloadModel(scope.row.file_path)">
                  <el-icon>
                    <Download />
                  </el-icon>
                  下载
                </el-button>
                <el-button type="primary" size="small" @click="editModel(scope.row)">
                  <el-icon>
                    <Edit />
                  </el-icon>
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="deleteModel(scope.row.model_id)">
                  <el-icon>
                    <Delete />
                  </el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
              layout="total, prev, pager, next, jumper" :total="total" @current-change="getModelList" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 上传模型对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传模型文件" width="600px" @closed="resetUploadForm" destroy-on-close>
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadFormRules" label-width="100px" status-icon>
        <el-form-item label="病害类别" prop="disease_category">
          <el-input v-model="uploadForm.disease_category" placeholder="请输入病害类别" />
        </el-form-item>
        <el-form-item label="数据增强方式" prop="augmentation">
          <el-input v-model="uploadForm.augmentation" placeholder="请输入数据增强方式，默认为'原图'" />
        </el-form-item>
        <el-form-item label="模型文件" prop="model_file">
          <el-upload class="upload-demo" action="" :auto-upload="false" :on-change="handleModelFileChange">
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 .pt/.engine 模型文件格式
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="layers">
          <el-input-number v-model="uploadForm.layers" :min="0" placeholder="请输入模型层数" />
        </el-form-item>
        <el-form-item label="parameters">
          <el-input-number v-model="uploadForm.parameters" :min="0" placeholder="请输入参数量" />
        </el-form-item>
        <el-form-item label="GFLOPs">
          <el-input-number v-model="uploadForm.GFLOPs" :min="0" :precision="1" :step="0.1" placeholder="请输入计算量" />
        </el-form-item>
        <el-collapse>
          <el-collapse-item title="性能指标（可选）">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="box_p">
                  <el-input-number v-model="uploadForm.box_p" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="box_r">
                  <el-input-number v-model="uploadForm.box_r" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="box_mAP50">
                  <el-input-number v-model="uploadForm.box_mAP50" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="box_mAP50_95">
                  <el-input-number v-model="uploadForm.box_mAP50_95" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="mask_p">
                  <el-input-number v-model="uploadForm.mask_p" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="mask_r">
                  <el-input-number v-model="uploadForm.mask_r" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="mask_mAP50">
                  <el-input-number v-model="uploadForm.mask_mAP50" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="mask_mAP50_95">
                  <el-input-number v-model="uploadForm.mask_mAP50_95" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="fitness_score">
                  <el-input-number v-model="uploadForm.fitness_score" :min="0" :max="1" :precision="5"
                    :step="0.00001" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="f1_score">
                  <el-input-number v-model="uploadForm.f1_score" :min="0" :max="1" :precision="5" :step="0.00001" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="uploadModel" :loading="uploadLoading">
            上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑模型对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑模型信息" width="600px" @closed="resetUploadForm">
      <el-form :model="uploadForm" label-width="100px" :label-position="right">
        <el-form-item label="病害类别">
          <el-input v-model="uploadForm.disease_category" placeholder="请输入病害类别" />
        </el-form-item>
        <el-form-item label="数据增强方式">
          <el-input v-model="uploadForm.augmentation" placeholder="请输入数据增强方式，默认为'原图'" />
        </el-form-item>
        <el-form-item label="layers">
          <el-input-number v-model="uploadForm.layers" :min="0" placeholder="请输入模型层数" />
        </el-form-item>
        <el-form-item label="parameters">
          <el-input-number v-model="uploadForm.parameters" :min="0" placeholder="请输入参数量" />
        </el-form-item>
        <el-form-item label="GFLOPs">
          <el-input-number v-model="uploadForm.GFLOPs" :min="0" :precision="2" placeholder="请输入计算量" />
        </el-form-item>
        <el-collapse>
          <el-collapse-item title="性能指标（可选）">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="box_p">
                  <el-input-number v-model="uploadForm.box_p" :min="0" :max="1" :precision="2" :step="0.01" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="box_r">
                  <el-input-number v-model="uploadForm.box_r" :min="0" :max="1" :precision="2" :step="0.01" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="box_mAP50">
                  <el-input-number v-model="uploadForm.box_mAP50" :min="0" :max="1" :precision="2" :step="0.01" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="box_mAP50_95">
                  <el-input-number v-model="uploadForm.box_mAP50_95" :min="0" :max="1" :precision="2" :step="0.01" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="mask_p">
                  <el-input-number v-model="uploadForm.mask_p" :min="0" :max="1" :precision="2" :step="0.01" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="mask_r">
                  <el-input-number v-model="uploadForm.mask_r" :min="0" :max="1" :precision="2" :step="0.01" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="mask_mAP50">
                  <el-input-number v-model="uploadForm.mask_mAP50" :min="0" :max="1" :precision="2" :step="0.01" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="mask_mAP50_95">
                  <el-input-number v-model="uploadForm.mask_mAP50_95" :min="0" :max="1" :precision="2" :step="0.01" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="fitness_score">
                  <el-input-number v-model="uploadForm.fitness_score" :min="0" :max="1" :precision="2" :step="0.01" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="f1_score">
                  <el-input-number v-model="uploadForm.f1_score" :min="0" :max="1" :precision="2" :step="0.01" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEditModel" :loading="uploadLoading">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.model-library-container {
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 10;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #4a5568;
  font-weight: 500;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  transition: all 0.3s ease;
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  border-radius: 20px;
  background-color: #f8fafc;
  background-image: linear-gradient(135deg, #f8fafc 0%, #e6f2ff 100%);
}

.model-card {
  margin-top: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
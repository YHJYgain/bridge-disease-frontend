<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Delete, Download, Edit } from '@element-plus/icons-vue'
import request from '../utils/request'
import { formatDateTime } from '../utils/dateTimeFormatter'
import { useResourceStore } from '../stores/resourceStore'
import { useUserStore } from '../stores/userStore'
import { getUserDetail } from '../utils/detailFetcher'
import SidebarMenu from '../components/SidebarMenu.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const requestBaseURL = request.defaults.baseURL
const router = useRouter()
const loading = ref(false)
const { userInfo, getUserInfo } = useUserStore()
const resourceStore = useResourceStore()
const modelList = ref([])
const uploadDialogVisible = ref(false)
const editDialogVisible = ref(false)
const uploadFormRef = ref(null)
const editFormRef = ref(null)

// 分页相关（默认每页 10 条）
const currentPage = ref(1)
const pageSize = ref(10)
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
  f1_score: 0.0,
})

// 编辑模型表单
const editForm = ref({
  model_id: null,
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
  f1_score: 0.0,
})
// 获取模型列表
const getModelList = async () => {
  try {
    resourceStore.modelLoading = true

    // 使用共享的媒体存储获取模型列表
    const { models, total: totalCount, error } = await resourceStore.fetchModelList(
      currentPage.value,
      pageSize.value,
      true // 强制刷新，确保获取最新数据
    )

    if (error) {
      throw error
    }

    console.info('【获取模型列表响应数据】', { models, total: totalCount })

    // 处理模型列表数据，获取用户的详细信息
    const processedModels = [];
    for (const model of models) {
      // 创建模型记录的副本
      const processedModel = { ...model };

      // 获取用户详情
      if (model.owner_id) {
        const { user, error: userError } = await getUserDetail(model.owner_id);
        if (user && !userError) {
          processedModel.owner_username = user.username;
        }
      }

      processedModels.push(processedModel);
    }

    modelList.value = processedModels
    total.value = totalCount
  } catch (error) {
    console.error('【获取模型列表错误】', error)
    ElMessage.error({
      message: '【获取模型列表错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    resourceStore.modelLoading = false
  }
}

// 格式化日期时间
const dataTimeFormatter = (row, column) => {
  return formatDateTime(row.updated_at) // 使用通用的日期时间格式化工具函数
}

// 病害类别筛选方法
const filterDiseaseCategory = (value, row) => {
  return row.disease_category === value;
}

// 数据增强方式筛选方法
const filterAugmentation = (value, row) => {
  return row.augmentation === value;
}

// 用户名筛选方法
const filterOwnerUsername = (value, row) => {
  return row.owner_username === value;
}

// 获取所有病害类别作为筛选选项
const diseaseCategoryFilters = computed(() => {
  // 从模型列表中提取不重复的病害类别
  const uniqueCategories = [...new Set(modelList.value.map(item => item.disease_category))];
  return uniqueCategories.map(category => ({ text: category, value: category }));
})

// 获取所有数据增强方式作为筛选选项
const augmentationFilters = computed(() => {
  // 从模型列表中提取不重复的数据增强方式
  const uniqueAugmentations = [...new Set(modelList.value.map(item => item.augmentation))];
  return uniqueAugmentations.map(augmentation => ({ text: augmentation, value: augmentation }));
})

// 获取所有用户名作为筛选选项
const ownerUsernameFilters = computed(() => {
  // 从模型列表中提取不重复的用户名
  const uniqueOwners = [...new Set(modelList.value.map(item => item.owner_username).filter(Boolean))];
  return uniqueOwners.map(owner => ({ text: owner, value: owner }));
})

const validateAugmentation = (rule, value, callback) => {
  if (!value) {
    callback() // 数据增强方式可以为空
    return
  }
  callback()
}

// 上传模型表单验证规则
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

// 文件上传变化处理
const handleModelFileChange = (file) => {
  // 验证文件格式
  const allowedTypes = ['.pt']
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'))

  if (!allowedTypes.includes(fileExtension)) {
    ElMessage.error('模型文件格式不正确，请上传 .pt 格式')
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
    loading.value = true

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
    formData.append('f1_score', uploadForm.value.f1_score)
    formData.append('fitness_score', uploadForm.value.fitness_score)

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
      f1_score: uploadForm.value.f1_score,
      fitness_score: uploadForm.value.fitness_score,
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
      resetForm('upload')
      getModelList()
    }
    // 上传模型失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    console.error('上传模型错误', error)
    ElMessage.error({
      message: '【上传模型错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    loading.value = false
  }
}

// 下载模型
const downloadModel = (file_path) => {
  window.open(`${requestBaseURL}/${file_path}`, '_blank')
}

// 编辑模型表单验证规则
const editFormRules = {
  disease_category: [
    { required: true, message: '请输入病害类别', trigger: ['blur', 'change'] }
  ],
  augmentation: [
    { validator: validateAugmentation, trigger: ['blur', 'change'] },
  ],
}

// 编辑模型
const editModel = (model) => {
  // 设置当前编辑的模型数据到 editForm 中
  editForm.value = {
    ...model,
  }
  editDialogVisible.value = true
}

// 保存编辑的模型
const saveEditModel = async () => {
  try {
    await editFormRef.value.validate()
    loading.value = true

    const formData = new FormData()
    formData.append('disease_category', editForm.value.disease_category)
    formData.append('augmentation', editForm.value.augmentation)
    formData.append('layers', editForm.value.layers)
    formData.append('parameters', editForm.value.parameters)
    formData.append('GFLOPs', editForm.value.GFLOPs)
    formData.append('box_p', editForm.value.box_p)
    formData.append('box_r', editForm.value.box_r)
    formData.append('box_mAP50', editForm.value.box_mAP50)
    formData.append('box_mAP50_95', editForm.value.box_mAP50_95)
    formData.append('mask_p', editForm.value.mask_p)
    formData.append('mask_r', editForm.value.mask_r)
    formData.append('mask_mAP50', editForm.value.mask_mAP50)
    formData.append('mask_mAP50_95', editForm.value.mask_mAP50_95)
    formData.append('f1_score', editForm.value.f1_score)
    formData.append('fitness_score', editForm.value.fitness_score)

    // 打印编辑表单数据
    console.info('【编辑模型表单数据】', {
      disease_category: editForm.value.disease_category,
      augmentation: editForm.value.augmentation,
      layers: editForm.value.layers,
      parameters: editForm.value.parameters,
      GFLOPs: editForm.value.GFLOPs,
      box_p: editForm.value.box_p,
      box_r: editForm.value.box_r,
      box_mAP50: editForm.value.box_mAP50,
      box_mAP50_95: editForm.value.box_mAP50_95,
      mask_p: editForm.value.mask_p,
      mask_r: editForm.value.mask_r,
      mask_mAP50: editForm.value.mask_mAP50,
      mask_mAP50_95: editForm.value.mask_mAP50_95,
      f1_score: editForm.value.f1_score,
      fitness_score: editForm.value.fitness_score,
    })

    const data = await request.put(`/model/update/${editForm.value.model_id}`, formData)
    console.info('【编辑模型响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断编辑是否成功
    if (operation && operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【编辑模型成功】',
        duration: 3000
      })
      editDialogVisible.value = false
      resetForm('edit')
      getModelList()
    }
    // 编辑模型失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    console.error('更新模型信息失败', error)
    ElMessage.error('更新模型信息失败，请重试')
  } finally {
    loading.value = false
  }
}

// 监听对话框关闭事件，重置表单
const resetForm = (formType = 'all') => {
  if (formType === 'upload' || formType === 'all') {
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
      f1_score: 0.0,
    }

    // 如果表单引用存在，重置验证状态
    if (uploadFormRef.value) {
      uploadFormRef.value.resetFields()
    }
  }

  if (formType === 'edit' || formType === 'all') {
    // 重置编辑表单数据
    editForm.value = {
      model_id: null,
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
      f1_score: 0.0,
    }

    // 如果表单引用存在，重置验证状态
    if (editFormRef.value) {
      editFormRef.value.resetFields()
    }
  }
}

// 删除模型
const deleteModel = async (id) => {
  try {
    // 使用确认对话框防止误删除
    await ElMessageBox.confirm(
      '确定要删除该模型吗？删除后将无法恢复！',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    loading.value = true

    // 发送删除请求
    const data = await request.delete(`/model/delete/${id}`)
    console.info('【删除模型响应数据】', data)
    const operation = data.operation

    // 根据后端操作状态判断删除是否成功
    if (operation && operation.status === 'SUCCESS') {
      ElMessage.success({
        message: '【删除模型成功】',
        duration: 3000
      })
      getModelList() // 重新获取列表
    }
    // 删除失败情况已在响应拦截器中处理，这里不再重复
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消删除，不做任何操作
      return
    }
    console.error('【删除模型错误】', error)
    ElMessage.error({
      message: '【删除模型错误】' + (error?.message || '请重试'),
      duration: 5000
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 先获取用户信息，防止未登录/无权限用户能够直接访问该页面
  getUserInfo().then(() => {
    if (userInfo.value) {
      if (isDeveloper.value) {
        getModelList()
      } else {
        ElMessage.warning({
          message: '【访问页面失败】您非开发人员，没有权限访问此页面',
          duration: 4000
        })
        router.push('/home')
      }
    } else {
      router.push('/login')
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
              <h2>模型库（名称升序/综合性能降序）</h2>
              <div>
                <el-button type="primary" @click="uploadDialogVisible = true">
                  <el-icon>
                    <Upload />
                  </el-icon>
                  上传模型
                </el-button>
                <el-button type="primary" size="small" @click="getModelList"
                  :loading="resourceStore.modelLoading.value">
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="modelList" style="width: 100%" v-loading="resourceStore.modelLoading.value">
            <el-table-column prop="model_id" label="ID" width="63" sortable />
            <el-table-column prop="model_name" label="名称" sortable show-overflow-tooltip />
            <el-table-column prop="disease_category" label="病害类别" sortable show-overflow-tooltip
              :filters="diseaseCategoryFilters" :filter-method="filterDiseaseCategory" filter-placement="bottom" />
            <el-table-column prop="augmentation" label="数据增强方式" sortable show-overflow-tooltip
              :filters="augmentationFilters" :filter-method="filterAugmentation" filter-placement="bottom" />
            <el-table-column prop="f1_score" label="f1_score（F1 分数）" width="182" sortable />
            <el-table-column prop="fitness_score" label="fitness_score（适应度分数）" width="237" sortable />
            <el-table-column prop="updated_at" label="更新时间" width="180" sortable :formatter="dataTimeFormatter" />
            <el-table-column prop="owner_username" label="所属用户" width="120" sortable show-overflow-tooltip
              :filters="ownerUsernameFilters" :filter-method="filterOwnerUsername" filter-placement="bottom" />
            <el-table-column label="操作" fixed="right" width="227">
              <template #default="scope">
                <el-button type="success" size="small" @click="downloadModel(scope.row.model_path)">
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
    <el-dialog v-model="uploadDialogVisible" title="上传模型文件" width="600px" @closed="() => resetForm('upload')"
      destroy-on-close>
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
                仅支持 .pt 模型文件格式
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
                <el-form-item label="f1_score">
                  <el-input-number v-model="uploadForm.f1_score" :min="0" :precision="5" :step="0.00001" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="fitness_score">
                  <el-input-number v-model="uploadForm.fitness_score" :min="0" :precision="5" :step="0.00001" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="uploadModel" :loading="loading">
            上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑模型对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑模型信息" width="600px" @closed="() => resetForm('edit')"
      destroy-on-close>
      <el-form ref="editFormRef" :model="editForm" :rules="editFormRules" label-width="100px" status-icon>
        <el-form-item label="病害类别" prop="disease_category">
          <el-input v-model="editForm.disease_category" placeholder="请输入病害类别" />
        </el-form-item>
        <el-form-item label="数据增强方式" prop="augmentation">
          <el-input v-model="editForm.augmentation" placeholder="请输入数据增强方式，默认为'原图'" />
        </el-form-item>
        <el-form-item label="layers">
          <el-input-number v-model="editForm.layers" :min="0" placeholder="请输入模型层数" />
        </el-form-item>
        <el-form-item label="parameters">
          <el-input-number v-model="editForm.parameters" :min="0" placeholder="请输入参数量" />
        </el-form-item>
        <el-form-item label="GFLOPs">
          <el-input-number v-model="editForm.GFLOPs" :min="0" :precision="1" :step="0.1" placeholder="请输入计算量" />
        </el-form-item>
        <el-collapse>
          <el-collapse-item title="性能指标（可选）">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="box_p">
                  <el-input-number v-model="editForm.box_p" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="box_r">
                  <el-input-number v-model="editForm.box_r" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="box_mAP50">
                  <el-input-number v-model="editForm.box_mAP50" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="box_mAP50_95">
                  <el-input-number v-model="editForm.box_mAP50_95" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="mask_p">
                  <el-input-number v-model="editForm.mask_p" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="mask_r">
                  <el-input-number v-model="editForm.mask_r" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="mask_mAP50">
                  <el-input-number v-model="editForm.mask_mAP50" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="mask_mAP50_95">
                  <el-input-number v-model="editForm.mask_mAP50_95" :min="0" :max="1" :precision="3" :step="0.001" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="f1_score">
                  <el-input-number v-model="editForm.f1_score" :min="0" :precision="5" :step="0.00001" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="fitness_score">
                  <el-input-number v-model="editForm.fitness_score" :min="0" :precision="5" :step="0.00001" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEditModel" :loading="loading">
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
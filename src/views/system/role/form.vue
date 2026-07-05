<template>
  <div class="role-form-container">
    <el-card>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="formData.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="formData.roleCode" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="handleBack">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { getRoleById, addRole, updateRole } from '@/api/role'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()

const isEdit = ref(false)
const formData = reactive({
  id: undefined as number | undefined,
  roleName: '',
  roleCode: '',
  description: '',
  sort: 0,
  status: 1
})

const formRules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
}

const getDetail = async () => {
  const id = route.query.id
  if (id) {
    const res = await getRoleById(Number(id))
    if (res.code === 200) {
      Object.assign(formData, res.data)
      isEdit.value = true
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await updateRole(formData)
      ElMessage.success('更新成功')
    } else {
      await addRole(formData)
      ElMessage.success('新增成功')
    }
    router.push('/system/role/list')
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  getDetail()
})
</script>

<style scoped>
.role-form-container {
  padding: 16px;
}
</style>

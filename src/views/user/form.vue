<template>
  <div class="user-form-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleSubmit">保存</el-button>
      <el-button @click="handleBack">关闭</el-button>
    </div>
    <el-card class="form-card">
      <template #header>
        <span class="card-title">基本信息</span>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="!isEdit">
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" type="password" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="form.nickname" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option label="未提交" :value="0" />
                <el-option label="已提交" :value="1" />
                <el-option label="已审核" :value="2" />
                <el-option label="审批中" :value="10" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { addUser, updateUser, getUserById, type User } from '@/api/user'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const isEdit = ref(false)

const form = reactive<User>({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  status: 0
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const fetchUserDetail = async (id: number) => {
  try {
    const res = await getUserById(id)
    if (res.code === 200) {
      const data = res.data
      Object.assign(form, {
        id: data.id,
        username: data.username,
        nickname: data.nickname,
        email: data.email,
        phone: data.phone,
        status: Number(data.status)
      })
    } else {
      ElMessage.error(res.message || '获取用户详情失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户详情失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res
        if (isEdit.value) {
          res = await updateUser(form)
        } else {
          res = await addUser(form)
        }
        if (res.code === 200) {
          ElMessage.success(res.message || '操作成功')
          handleBack()
        } else {
          ElMessage.error(res.message || '操作失败')
        }
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

const handleBack = () => {
  router.push('/system/user/list')
}

onMounted(() => {
  const id = route.query.id
  if (id) {
    isEdit.value = true
    fetchUserDetail(Number(id))
  }
})
</script>

<style scoped>
.user-form-container {
  padding: 20px;
}

.toolbar {
  background-color: var(--bg-primary);
  padding: 10px 20px;
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: var(--shadow-sm);
}

.form-card {
  background-color: var(--bg-primary);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}
</style>

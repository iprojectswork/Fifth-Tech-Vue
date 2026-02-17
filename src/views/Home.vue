<template>
  <div class="home-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>首页</span>
        </div>
      </template>
      
      <el-space direction="vertical" :size="20" style="width: 100%">
        <el-descriptions title="用户信息" :column="2" border>
          <el-descriptions-item label="用户名">{{ username }}</el-descriptions-item>
          <el-descriptions-item label="状态">在线</el-descriptions-item>
          <el-descriptions-item label="登录时间">{{ loginTime }}</el-descriptions-item>
          <el-descriptions-item label="角色">管理员</el-descriptions-item>
        </el-descriptions>
        
        <el-divider />
        
        <el-card shadow="hover">
          <template #header>
            <span>API测试</span>
          </template>
          <el-button type="primary" @click="testHello" :loading="loading">
            测试后端接口
          </el-button>
          <el-alert
            v-if="response"
            :title="'响应: ' + response"
            type="success"
            :closable="false"
            style="margin-top: 20px"
          />
        </el-card>
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { hello } from '@/api/auth'

const username = ref('admin')
const loginTime = ref('')
const loading = ref(false)
const response = ref('')

onMounted(() => {
  loginTime.value = new Date().toLocaleString('zh-CN')
})

const testHello = async () => {
  loading.value = true
  try {
    const res = await hello()
    response.value = res.data || res
    ElMessage.success('接口调用成功')
  } catch (error) {
    ElMessage.error('接口调用失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.home-container {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}
</style>

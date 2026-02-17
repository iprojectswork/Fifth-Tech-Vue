<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6" v-for="(stat, index) in stats" :key="index">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="32" color="#fff">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>快捷入口</span>
            </div>
          </template>
          <el-space wrap :size="15">
            <el-button type="primary" @click="navigateTo('/system/user/list')">
              <el-icon><User /></el-icon>
              用户管理
            </el-button>
            <el-button type="success">
              <el-icon><Setting /></el-icon>
              系统设置
            </el-button>
            <el-button type="warning">
              <el-icon><Document /></el-icon>
              数据报表
            </el-button>
            <el-button type="info">
              <el-icon><Bell /></el-icon>
              消息通知
            </el-button>
          </el-space>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>系统信息</span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
            <el-descriptions-item label="当前用户">管理员</el-descriptions-item>
            <el-descriptions-item label="登录时间">{{ loginTime }}</el-descriptions-item>
            <el-descriptions-item label="系统状态">运行正常</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近操作</span>
            </div>
          </template>
          <el-table :data="recentActions" style="width: 100%">
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column prop="user" label="操作人" width="120" />
            <el-table-column prop="action" label="操作内容" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === '成功' ? 'success' : 'danger'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Setting, Document, Bell, DataLine, Monitor, Files, Message } from '@element-plus/icons-vue'

const router = useRouter()
const loginTime = ref('')

const stats = ref([
  { label: '用户总数', value: '1,234', icon: User, color: '#3b82f6' },
  { label: '系统模块', value: '8', icon: Setting, color: '#10b981' },
  { label: '今日访问', value: '567', icon: DataLine, color: '#f59e0b' },
  { label: '待办事项', value: '12', icon: Message, color: '#ef4444' }
])

const recentActions = ref([
  { time: '2024-01-15 10:30:00', user: 'admin', action: '新增用户', status: '成功' },
  { time: '2024-01-15 10:25:00', user: 'admin', action: '修改系统配置', status: '成功' },
  { time: '2024-01-15 10:20:00', user: 'admin', action: '删除用户', status: '成功' },
  { time: '2024-01-15 10:15:00', user: 'admin', action: '导出数据', status: '失败' }
])

onMounted(() => {
  loginTime.value = new Date().toLocaleString('zh-CN')
})

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.card-header {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}
</style>

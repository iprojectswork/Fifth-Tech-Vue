<template>
  <div class="user-container">
    <el-card class="query-card">
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="用户名">
          <el-input v-model="queryForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="queryForm.nickname" placeholder="请输入昵称" clearable />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="queryForm.email" placeholder="请输入邮箱" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="queryForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="card-header-left">
            <el-button type="primary" @click="handleAdd">新增</el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">批量删除</el-button>
          </div>
          <span v-if="selectedRows.length > 0" class="selected-info">已选择 {{ selectedRows.length }} 项</span>
        </div>
      </template>

      <div class="table-wrapper">
        <el-table :data="tableData" border style="width: 100%" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="nickname" label="昵称" width="120" />
          <el-table-column prop="email" label="邮箱" width="180" />
          <el-table-column prop="phone" label="手机号" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryForm.current"
          v-model:page-size="queryForm.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { getUserList, deleteUser, type User, type UserQuery } from '@/api/user'

const router = useRouter()
const tableData = ref<User[]>([])
const total = ref(0)
const selectedRows = ref<User[]>([])

const queryForm = reactive<UserQuery>({
  current: 1,
  size: 10,
  username: '',
  nickname: '',
  email: '',
  phone: ''
})

const fetchData = async () => {
  try {
    const res = await getUserList(queryForm)
    tableData.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  }
}

const handleQuery = () => {
  queryForm.current = 1
  fetchData()
}

const handleReset = () => {
  queryForm.username = ''
  queryForm.nickname = ''
  queryForm.email = ''
  queryForm.phone = ''
  queryForm.current = 1
  fetchData()
}

const handleAdd = () => {
  router.push('/system/user/form')
}

const handleEdit = (row: User) => {
  router.push(`/system/user/form?id=${row.id}&username=${row.username}`)
}

const handleDelete = (row: User) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUser(row.id!)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSelectionChange = (rows: User[]) => {
  selectedRows.value = rows
}

const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的用户')
    return
  }
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个用户吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await Promise.all(selectedRows.value.map(row => deleteUser(row.id!)))
      ElMessage.success('批量删除成功')
      selectedRows.value = []
      fetchData()
    } catch (error) {
      ElMessage.error('批量删除失败')
    }
  }).catch(() => {})
}

const handleSizeChange = (val: number) => {
  queryForm.size = val
  fetchData()
}

const handleCurrentChange = (val: number) => {
  queryForm.current = val
  fetchData()
}

const statusMap: Record<number, { text: string; type: string }> = {
  0: { text: '未提交', type: 'info' },
  1: { text: '已提交', type: 'warning' },
  2: { text: '已审核', type: 'success' },
  10: { text: '审批中', type: 'primary' }
}

const getStatusText = (status: number) => {
  return statusMap[status]?.text || '未知'
}

const getStatusType = (status: number) => {
  return statusMap[status]?.type || 'info'
}

const formatTime = (time: string | undefined) => {
  if (!time) return '-'
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.user-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  height: calc(100vh - 60px);
  box-sizing: border-box;
}

.query-card {
  flex-shrink: 0;
}

.query-form {
  margin-bottom: 0;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.card-header-left {
  display: flex;
  gap: 10px;
}

.selected-info {
  color: var(--primary);
  font-size: 14px;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.pagination-wrapper {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding-top: 5px;
  border-top: 1px solid var(--border);
}
</style>

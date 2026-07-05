<template>
  <div class="permission-list-container">
    <el-card class="query-card">
      <el-form :inline="true" :model="queryParams" class="query-form">
        <el-form-item label="权限名称">
          <el-input v-model="queryParams.permissionName" placeholder="请输入权限名称" clearable />
        </el-form-item>
        <el-form-item label="权限编码">
          <el-input v-model="queryParams.permissionCode" placeholder="请输入权限编码" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="table-header">
        <el-button type="primary" @click="handleAdd">新增</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" row-key="id">
        <el-table-column prop="permissionName" label="权限名称" />
        <el-table-column prop="permissionCode" label="权限编码" />
        <el-table-column prop="permissionType" label="权限类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.permissionType === 1 ? 'primary' : 'success'">
              {{ row.permissionType === 1 ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" />
        <el-table-column prop="icon" label="图标" width="100" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="queryParams.current"
        v-model:page-size="queryParams.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="上级权限">
          <el-tree-select
            v-model="formData.parentId"
            :data="permissionTree"
            :props="{ label: 'permissionName', value: 'id', children: 'children' }"
            check-strictly
            clearable
            placeholder="请选择上级权限"
          />
        </el-form-item>
        <el-form-item label="权限名称" prop="permissionName">
          <el-input v-model="formData.permissionName" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限编码" prop="permissionCode">
          <el-input v-model="formData.permissionCode" placeholder="请输入权限编码" />
        </el-form-item>
        <el-form-item label="权限类型" prop="permissionType">
          <el-radio-group v-model="formData.permissionType">
            <el-radio :value="1">菜单</el-radio>
            <el-radio :value="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="formData.permissionType === 1" label="路由路径">
          <el-input v-model="formData.path" placeholder="请输入路由路径" />
        </el-form-item>
        <el-form-item v-if="formData.permissionType === 1" label="组件路径">
          <el-input v-model="formData.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item v-if="formData.permissionType === 1" label="图标">
          <el-input v-model="formData.icon" placeholder="请输入图标" />
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
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { getPermissionList, addPermission, updatePermission, deletePermission, getPermissionTree } from '@/api/permission'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = reactive({
  current: 1,
  size: 10,
  permissionName: '',
  permissionCode: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref<FormInstance>()
const permissionTree = ref<any[]>([])

const formData = reactive({
  id: undefined as number | undefined,
  permissionName: '',
  permissionCode: '',
  permissionType: 1,
  parentId: 0,
  path: '',
  component: '',
  icon: '',
  sort: 0,
  status: 1
})

const formRules: FormRules = {
  permissionName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  permissionCode: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  permissionType: [{ required: true, message: '请选择权限类型', trigger: 'change' }]
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getPermissionList(queryParams)
    if (res.code === 200) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const getTree = async () => {
  try {
    const res = await getPermissionTree()
    if (res.code === 200) {
      permissionTree.value = [{ id: 0, permissionName: '根目录', children: res.data }]
    }
  } catch (error) {
    console.error(error)
  }
}

const handleQuery = () => {
  queryParams.current = 1
  getList()
}

const handleReset = () => {
  queryParams.permissionName = ''
  queryParams.permissionCode = ''
  handleQuery()
}

const handleAdd = () => {
  formData.id = undefined
  formData.permissionName = ''
  formData.permissionCode = ''
  formData.permissionType = 1
  formData.parentId = 0
  formData.path = ''
  formData.component = ''
  formData.icon = ''
  formData.sort = 0
  formData.status = 1
  dialogTitle.value = '新增权限'
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  formData.id = row.id
  formData.permissionName = row.permissionName
  formData.permissionCode = row.permissionCode
  formData.permissionType = row.permissionType
  formData.parentId = row.parentId || 0
  formData.path = row.path || ''
  formData.component = row.component || ''
  formData.icon = row.icon || ''
  formData.sort = row.sort || 0
  formData.status = row.status
  dialogTitle.value = '编辑权限'
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  try {
    if (formData.id) {
      await updatePermission(formData)
      ElMessage.success('更新成功')
    } else {
      await addPermission(formData)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
    getTree()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm('确认删除该权限吗？', '提示', { type: 'warning' })
  try {
    await deletePermission(row.id)
    ElMessage.success('删除成功')
    getList()
    getTree()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

onMounted(() => {
  getList()
  getTree()
})
</script>

<style scoped>
.permission-list-container {
  padding: 16px;
}

.query-card {
  margin-bottom: 16px;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-header {
  margin-bottom: 16px;
}

.el-table {
  flex: 1;
}

.el-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>

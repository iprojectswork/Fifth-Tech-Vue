<template>
  <div class="role-list-container">
    <el-card class="query-card">
      <el-form :inline="true" :model="queryParams" class="query-form">
        <el-form-item label="角色名称">
          <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable />
        </el-form-item>
        <el-form-item label="角色编码">
          <el-input v-model="queryParams.roleCode" placeholder="请输入角色编码" clearable />
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
      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="roleName" label="角色名称" />
        <el-table-column prop="roleCode" label="角色编码" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handlePermission(row)">分配权限</el-button>
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
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialogVisible" title="分配权限" width="400px">
      <el-tree
        ref="permissionTreeRef"
        :data="permissionTree"
        :props="{ label: 'permissionName', children: 'children' }"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedPermissions"
      />
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePermissionSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { getRoleList, addRole, updateRole, deleteRole, getRolePermissions, assignRolePermissions, getPermissionTree } from '@/api/role'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = reactive({
  current: 1,
  size: 10,
  roleName: '',
  roleCode: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref<FormInstance>()
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

const permissionDialogVisible = ref(false)
const permissionTree = ref<any[]>([])
const checkedPermissions = ref<number[]>([])
const currentRoleId = ref<number>()
const permissionTreeRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const res = await getRoleList(queryParams)
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

const handleQuery = () => {
  queryParams.current = 1
  getList()
}

const handleReset = () => {
  queryParams.roleName = ''
  queryParams.roleCode = ''
  handleQuery()
}

const handleAdd = () => {
  formData.id = undefined
  formData.roleName = ''
  formData.roleCode = ''
  formData.description = ''
  formData.sort = 0
  formData.status = 1
  dialogTitle.value = '新增角色'
  dialogVisible.value = true
}

const handleEdit = async (row: any) => {
  formData.id = row.id
  formData.roleName = row.roleName
  formData.roleCode = row.roleCode
  formData.description = row.description || ''
  formData.sort = row.sort || 0
  formData.status = row.status
  dialogTitle.value = '编辑角色'
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  try {
    if (formData.id) {
      await updateRole(formData)
      ElMessage.success('更新成功')
    } else {
      await addRole(formData)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm('确认删除该角色吗？', '提示', { type: 'warning' })
  try {
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    getList()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

const handlePermission = async (row: any) => {
  currentRoleId.value = row.id
  try {
    const treeRes = await getPermissionTree()
    if (treeRes.code === 200) {
      permissionTree.value = treeRes.data
    }
    const permRes = await getRolePermissions(row.id)
    if (permRes.code === 200) {
      checkedPermissions.value = permRes.data
    }
    permissionDialogVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const handlePermissionSubmit = async () => {
  if (!permissionTreeRef.value || !currentRoleId.value) return
  const checkedNodes = permissionTreeRef.value.getCheckedKeys()
  try {
    await assignRolePermissions(currentRoleId.value, checkedNodes as number[])
    ElMessage.success('权限分配成功')
    permissionDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.role-list-container {
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

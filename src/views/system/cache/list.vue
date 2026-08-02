<template>
  <div class="cache-container">
    <el-card class="query-card">
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="匹配模式">
          <el-input v-model="queryForm.pattern" placeholder="Redis glob，如 *" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
        <el-form-item label="快捷筛选">
          <el-check-tag
            v-for="pattern in quickPatterns"
            :key="pattern"
            :checked="queryForm.pattern === pattern"
            @change="applyPattern(pattern)"
          >{{ pattern }}</el-check-tag>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="card-header-left">
            <el-button v-permission="'system:cache:add'" type="primary" @click="openAdd">新增</el-button>
            <el-button
              v-permission="'system:cache:delete'"
              type="danger"
              :disabled="selectedRows.length === 0"
              @click="handleBatchDelete"
            >批量删除</el-button>
          </div>
          <span v-if="selectedRows.length" class="selected-info">已选择 {{ selectedRows.length }} 项</span>
        </div>
      </template>

      <div class="table-wrapper">
        <el-table v-loading="loading" :data="tableData" border height="100%" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="key" label="Key" min-width="320" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="ttl" label="TTL（秒）" width="140">
            <template #default="{ row }">{{ formatTtl(row.ttl) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button v-permission="'system:cache:view'" link type="primary" @click="openDetail(row, 'view')">查看</el-button>
              <el-button v-permission="'system:cache:edit'" link type="primary" @click="openDetail(row, 'edit')">编辑</el-button>
              <el-button v-permission="'system:cache:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
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
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="Key" required>
          <el-input v-model="form.key" :readonly="dialogMode !== 'add'" placeholder="请输入缓存 Key" />
        </el-form-item>
        <el-form-item label="TTL（秒）">
          <el-input-number v-model="form.ttlSeconds" :disabled="dialogMode === 'view'" :min="-1" controls-position="right" />
          <span class="field-hint">留空表示永久；编辑时 -1 表示移除过期时间</span>
        </el-form-item>
        <el-form-item label="Value" required>
          <div class="value-editor">
            <div class="json-toolbar">
              <el-button size="small" :disabled="dialogMode === 'view'" @click="formatJson">格式化</el-button>
              <el-button size="small" :disabled="dialogMode === 'view'" @click="compactJson">压缩</el-button>
              <el-button size="small" @click="validateJson">校验</el-button>
            </div>
            <el-input v-model="form.value" type="textarea" :rows="14" :readonly="dialogMode === 'view'" placeholder="支持 JSON 或普通文本" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ dialogMode === 'view' ? '关闭' : '取消' }}</el-button>
        <el-button v-if="dialogMode !== 'view'" type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// allow: SIZE_OK — 单一缓存管理页，模板、交互状态与 scoped 样式不可拆分且需求限定唯一业务文件。
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteCache,
  expireCache,
  getCacheDetail,
  getCacheKeys,
  setCache,
  type CacheKeyItem,
  type CacheKeyQuery
} from '@/api/cache'

type DialogMode = 'add' | 'edit' | 'view'

const quickPatterns = ['auth:token:*', 'auth:user:*'] as const
const loading = ref(false)
const saving = ref(false)
const tableData = ref<CacheKeyItem[]>([])
const selectedRows = ref<CacheKeyItem[]>([])
const total = ref(0)
const queryForm = reactive({ pattern: '*', current: 1, size: 10 } satisfies CacheKeyQuery)
const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('view')
const dialogTitle = ref('查看缓存')
const form = reactive<{ key: string; value: string; ttlSeconds: number | undefined }>({
  key: '', value: '', ttlSeconds: undefined
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getCacheKeys(queryForm)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
      selectedRows.value = []
      if (res.data.truncated || (res.data.max !== undefined && res.data.total === res.data.max)) {
        ElMessage.warning(`匹配键过多，仅显示前 ${res.data.max ?? res.data.total} 条，请缩小 pattern。`)
      }
    } else {
      ElMessage.error(res.message || '获取缓存列表失败')
    }
  } catch (error) {
    ElMessage.error('获取缓存列表失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = () => { queryForm.current = 1; void fetchData() }
const handleReset = () => { queryForm.pattern = '*'; handleQuery() }
const applyPattern = (pattern: string) => { queryForm.pattern = pattern; handleQuery() }
const handleSelectionChange = (rows: CacheKeyItem[]) => { selectedRows.value = rows }
const formatTtl = (ttl: number) => ttl === -1 ? '永不过期' : ttl === -2 ? '不存在' : String(ttl)

const openAdd = () => {
  dialogMode.value = 'add'
  dialogTitle.value = '新增缓存'
  Object.assign(form, { key: '', value: '', ttlSeconds: undefined })
  dialogVisible.value = true
}

const openDetail = async (row: CacheKeyItem, mode: Exclude<DialogMode, 'add'>) => {
  if (row.type.toLowerCase() !== 'string') {
    ElMessage.warning(`当前键类型为 ${row.type}，仅支持 String 的查看与编辑。`)
    return
  }
  try {
    const res = await getCacheDetail(row.key)
    if (res.code === 200 && res.data) {
      dialogMode.value = mode
      dialogTitle.value = mode === 'view' ? '查看缓存' : '编辑缓存'
      let value = res.data.value
      try { value = JSON.stringify(JSON.parse(value), null, 2) } catch (error) {
        if (!(error instanceof SyntaxError)) throw error
      }
      Object.assign(form, { key: res.data.key, value, ttlSeconds: res.data.ttl })
      dialogVisible.value = true
    } else {
      ElMessage.error(res.message || '获取缓存详情失败')
    }
  } catch (error) {
    ElMessage.error('获取缓存详情失败')
  }
}

const parseJson = (): unknown => JSON.parse(form.value)
const formatJson = () => {
  try { form.value = JSON.stringify(parseJson(), null, 2); ElMessage.success('格式化成功') }
  catch (error) { if (error instanceof SyntaxError) ElMessage.error('JSON 格式错误'); else throw error }
}
const compactJson = () => {
  try { form.value = JSON.stringify(parseJson()); ElMessage.success('压缩成功') }
  catch (error) { if (error instanceof SyntaxError) ElMessage.error('JSON 格式错误'); else throw error }
}
const validateJson = () => {
  try { parseJson(); ElMessage.success('JSON 校验通过') }
  catch (error) { if (error instanceof SyntaxError) ElMessage.error(`JSON 校验失败：${error.message}`); else throw error }
}

const handleSave = async () => {
  const key = form.key.trim()
  if (!key || /\s/.test(key)) {
    ElMessage.warning('Key 不能为空且不能包含空白字符')
    return
  }
  saving.value = true
  try {
    // 编辑时若 TTL 为 -1（持久化），走 set 不带 ttl + expire(-1)；其余尽量单次 set 带 ttl，减少非原子双写
    const ttl = form.ttlSeconds
    if (dialogMode.value === 'edit' && ttl === -1) {
      const setRes = await setCache({ key, value: form.value })
      if (setRes.code !== 200) {
        ElMessage.error(setRes.message || '保存失败')
        return
      }
      const expireRes = await expireCache({ key, ttlSeconds: -1 })
      if (expireRes.code !== 200) {
        ElMessage.error(expireRes.message || '保存失败')
        return
      }
    } else {
      const payload =
        ttl === undefined || ttl === null || ttl < 0
          ? { key, value: form.value }
          : { key, value: form.value, ttlSeconds: ttl }
      const setRes = await setCache(payload)
      if (setRes.code !== 200) {
        ElMessage.error(setRes.message || '保存失败')
        return
      }
    }
    ElMessage.success(dialogMode.value === 'add' ? '新增成功' : '更新成功')
    dialogVisible.value = false
    void fetchData()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (keys: readonly string[]) => {
  const isAuth = keys.some(key => key.startsWith('auth:'))
  const authWarning = isAuth
    ? '该操作将导致相关用户会话立即失效（强制下线）。'
    : '删除后无法恢复。'
  const title = isAuth ? '删除确认（强制下线）' : '删除确认'
  return ElMessageBox.confirm(`确定删除选中的 ${keys.length} 个缓存键吗？${authWarning}`, title, {
    confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning'
  }).then(() => true, () => false)
}

const removeKeys = async (keys: readonly string[]) => {
  if (!await confirmDelete(keys)) return
  try {
    const res = await deleteCache(keys)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      void fetchData()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}
const handleDelete = (row: CacheKeyItem) => { void removeKeys([row.key]) }
const handleBatchDelete = () => {
  if (!selectedRows.value.length) { ElMessage.warning('请先选择要删除的缓存键'); return }
  void removeKeys(selectedRows.value.map(row => row.key))
}

onMounted(() => { void fetchData() })
</script>

<style scoped>
.cache-container { display: flex; flex-direction: column; gap: 10px; padding: 10px; height: calc(100vh - 60px); box-sizing: border-box; }
.query-card { flex-shrink: 0; }
.query-form { margin-bottom: 0; }
.query-form :deep(.el-check-tag) { margin-right: 8px; }
.table-card { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
.table-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.card-header-left { display: flex; gap: 10px; }
.selected-info { color: var(--primary); font-size: 14px; }
.table-wrapper { flex: 1; overflow: hidden; min-height: 0; }
.pagination-wrapper { flex-shrink: 0; display: flex; justify-content: flex-end; padding-top: 5px; border-top: 1px solid var(--border); }
.value-editor { width: 100%; }
.json-toolbar { display: flex; gap: 8px; margin-bottom: 8px; }
.field-hint { margin-left: 10px; color: var(--text-muted); font-size: 12px; }
</style>


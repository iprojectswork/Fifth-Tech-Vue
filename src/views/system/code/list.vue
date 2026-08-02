<template>
  <div class="code-container">
    <el-card class="query-card">
      <el-form :inline="true" :model="queryForm" class="query-form" @keyup.enter="handleQuery">
        <el-form-item label="规则名称">
          <el-input v-model="queryForm.ruleName" placeholder="请输入规则名称" clearable />
        </el-form-item>
        <el-form-item label="规则编码">
          <el-input v-model="queryForm.ruleCode" placeholder="请输入规则编码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable class="status-select">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
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
            <el-button v-permission="'system:code:add'" type="primary" @click="openAdd">新增规则</el-button>
          </div>
          <span class="header-hint">流水号按规则与日期周期独立记账</span>
        </div>
      </template>

      <div class="table-wrapper">
        <el-table v-loading="loading" :data="tableData" border height="100%">
          <el-table-column prop="ruleName" label="规则名称" min-width="170" show-overflow-tooltip />
          <el-table-column prop="ruleCode" label="规则编码" min-width="170" show-overflow-tooltip />
          <el-table-column prop="batchSize" label="号段大小" width="110" align="center" />
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip />
          <el-table-column label="操作" width="330" fixed="right">
            <template #default="{ row }">
              <el-button v-permission="'system:code:view'" link type="primary" @click="openDetail(row, 'view')">查看</el-button>
              <el-button v-permission="'system:code:edit'" link type="primary" @click="openDetail(row, 'edit')">编辑</el-button>
              <el-button v-permission="'system:code:view'" link type="primary" @click="openPreview(row.ruleCode)">试生成</el-button>
              <el-button v-permission="'system:code:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="960px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px" class="rule-form">
        <div class="form-grid">
          <el-form-item label="规则编码" prop="ruleCode">
            <el-input v-model="formData.ruleCode" :disabled="isView" placeholder="如 order_no" />
          </el-form-item>
          <el-form-item label="规则名称" prop="ruleName">
            <el-input v-model="formData.ruleName" :disabled="isView" placeholder="请输入展示名称" />
          </el-form-item>
          <el-form-item label="号段大小" prop="batchSize">
            <el-input-number v-model="formData.batchSize" :disabled="isView" :min="1" :max="5000" controls-position="right" />
            <span class="field-hint">下次补段时生效</span>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status" :disabled="isView">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" :disabled="isView" type="textarea" :rows="2" maxlength="512" show-word-limit placeholder="请输入备注" />
        </el-form-item>

        <div class="section-heading">
          <div>
            <span class="section-title">编码片段</span>
            <span class="section-hint">按从左到右拼接，不会自动添加分隔符</span>
          </div>
          <el-button v-if="!isView" type="primary" plain size="small" @click="addSegment">添加片段</el-button>
        </div>
        <div class="segment-list">
          <div v-for="(segment, index) in formData.segments" :key="segment.key" class="segment-row">
            <span class="segment-index">{{ index + 1 }}</span>
            <el-select v-model="segment.type" :disabled="isView" class="segment-type" @change="handleSegmentTypeChange(segment)">
              <el-option v-for="type in segmentTypes" :key="type.value" :label="type.label" :value="type.value" />
            </el-select>
            <el-input
              v-if="segment.type === 'FIXED'"
              v-model="segment.value"
              :disabled="isView"
              class="segment-value"
              placeholder="固定内容，如 PO 或 -"
            />
            <el-select v-else-if="segment.type === 'DATE'" v-model="segment.pattern" :disabled="isView" class="segment-value">
              <el-option v-for="option in datePatternOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
            <div v-else class="sequence-fields">
              <label>位数</label>
              <el-input-number v-model="segment.length" :disabled="isView" :min="1" :max="18" controls-position="right" />
              <label>起始</label>
              <el-input-number v-model="segment.start" :disabled="isView" :min="1" controls-position="right" />
              <label>步长</label>
              <el-input-number v-model="segment.step" :disabled="isView" :min="1" controls-position="right" />
            </div>
            <div v-if="!isView" class="segment-actions">
              <el-button text circle :disabled="index === 0" title="上移" @click="moveSegment(index, -1)"><el-icon><ArrowUp /></el-icon></el-button>
              <el-button text circle :disabled="index === formData.segments.length - 1" title="下移" @click="moveSegment(index, 1)"><el-icon><ArrowDown /></el-icon></el-button>
              <el-button text circle type="danger" title="删除" @click="removeSegment(index)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
          <el-empty v-if="formData.segments.length === 0" description="请至少添加一个片段" :image-size="64" />
        </div>
        <p class="segment-hint">硬规则：恰好一个 SEQUENCE，至多一个 DATE；FIXED 可配置多个。</p>

        <div v-if="isView" class="sequence-panel">
          <div class="section-heading">
            <div>
              <span class="section-title">流水水位</span>
              <span class="section-hint">只读展示已预支到的最大序号，不提供重置入口</span>
            </div>
          </div>
          <el-table v-loading="sequenceLoading" :data="sequenceRows" border size="small">
            <el-table-column prop="periodKey" label="周期" min-width="160" />
            <el-table-column prop="currentMax" label="已预支最大值" width="150" align="right" />
            <el-table-column prop="updateTime" label="更新时间" min-width="180" />
          </el-table>
          <el-empty v-if="!sequenceLoading && sequenceRows.length === 0" description="暂无流水水位记录" :image-size="56" />
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ isView ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!isView" type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" title="试生成结果" width="440px" destroy-on-close>
      <div class="preview-content">
        <span class="preview-label">按当前规则试拼样例</span>
        <code>{{ previewSample || '—' }}</code>
        <p>试生成不占用流水号，展示「下一号大致形态」；实际取号可能因并发略有差异。</p>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// allow: SIZE_OK — 单页规则管理需要同时承载片段编辑、预览与水位只读区，保持与 C1 管理页一致的单文件交付。
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ArrowDown, ArrowUp, Delete } from '@element-plus/icons-vue'
import {
  DATE_PATTERNS,
  addCodeRule,
  deleteCodeRule,
  getCodeRuleById,
  getCodeRuleList,
  getCodeSequenceList,
  previewCode,
  updateCodeRule,
  type CodeRule,
  type CodeRuleQuery,
  type CodeSegment,
  type CodeSegmentType,
  type CodeSequence
} from '@/api/code'

interface SegmentForm {
  key: number
  type: CodeSegmentType
  value: string
  pattern: (typeof DATE_PATTERNS)[number]
  length: number
  start: number
  step: number
}

type DialogMode = 'add' | 'edit' | 'view'

const segmentTypes = [
  { value: 'FIXED', label: '固定串' },
  { value: 'DATE', label: '日期' },
  { value: 'SEQUENCE', label: '流水号' }
] as const
const datePatternOptions = [
  { value: 'yy', label: 'yy（26）' },
  { value: 'yyyy', label: 'yyyy（2026）' },
  { value: 'yyMM', label: 'yyMM（2608）' },
  { value: 'yyyyMM', label: 'yyyyMM（202608）' },
  { value: 'yyMMdd', label: 'yyMMdd（260802）' },
  { value: 'yyyyMMdd', label: 'yyyyMMdd（20260802）' }
] as const
const loading = ref(false)
const saving = ref(false)
const tableData = ref<CodeRule[]>([])
const total = ref(0)
const queryForm = reactive<CodeRuleQuery & { current: number; size: number; ruleCode: string; ruleName: string; status: number | undefined }>({
  current: 1,
  size: 10,
  ruleCode: '',
  ruleName: '',
  status: undefined
})
const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('view')
const dialogTitle = ref('查看编码规则')
const formRef = ref<FormInstance>()
const nextSegmentKey = ref(1)
const formData = reactive({
  id: undefined as string | undefined,
  ruleCode: '',
  ruleName: '',
  batchSize: 100,
  status: 1,
  remark: '',
  segments: [] as SegmentForm[]
})
const sequenceLoading = ref(false)
const sequenceRows = ref<CodeSequence[]>([])
const previewVisible = ref(false)
const previewSample = ref('')

const isView = computed(() => dialogMode.value === 'view')
const formRules: FormRules = {
  ruleCode: [
    { required: true, message: '请输入规则编码', trigger: 'blur' },
    { pattern: /^[A-Za-z][A-Za-z0-9_]{0,63}$/, message: '规则编码需以字母开头，仅支持字母、数字、下划线，最长 64', trigger: 'blur' }
  ],
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  batchSize: [{ required: true, message: '请输入号段大小', trigger: 'change' }]
}

const createSegment = (type: CodeSegmentType): SegmentForm => ({
  key: nextSegmentKey.value++,
  type,
  value: '',
  pattern: 'yyyyMMdd',
  length: 3,
  start: 1,
  step: 1
})

const resetForm = () => {
  Object.assign(formData, {
    id: undefined,
    ruleCode: '',
    ruleName: '',
    batchSize: 100,
    status: 1,
    remark: '',
    segments: [createSegment('FIXED'), createSegment('SEQUENCE')]
  })
  formData.segments[0].value = ''
  sequenceRows.value = []
  formRef.value?.clearValidate()
}

const toSegmentForm = (segment: CodeSegment): SegmentForm => {
  switch (segment.type) {
    case 'FIXED':
      return { ...createSegment('FIXED'), value: segment.value }
    case 'DATE':
      return { ...createSegment('DATE'), pattern: segment.pattern }
    case 'SEQUENCE':
      return {
        ...createSegment('SEQUENCE'),
        length: segment.length,
        start: segment.start,
        step: segment.step
      }
    default:
      return assertNever(segment)
  }
}

const toApiSegment = (segment: SegmentForm): CodeSegment => {
  switch (segment.type) {
    case 'FIXED':
      return { type: 'FIXED', value: segment.value.trim() }
    case 'DATE':
      return { type: 'DATE', pattern: segment.pattern }
    case 'SEQUENCE':
      return { type: 'SEQUENCE', length: segment.length, start: segment.start, step: segment.step }
    default:
      return assertNever(segment.type)
  }
}

function assertNever(value: never): never {
  throw new Error(`未知片段类型：${String(value)}`)
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getCodeRuleList(queryForm)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    } else {
      ElMessage.error(res.message || '获取编码规则失败')
    }
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '获取编码规则失败'))
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryForm.current = 1
  void fetchData()
}

const handleReset = () => {
  queryForm.ruleCode = ''
  queryForm.ruleName = ''
  queryForm.status = undefined
  handleQuery()
}

const openAdd = () => {
  resetForm()
  dialogMode.value = 'add'
  dialogTitle.value = '新增编码规则'
  dialogVisible.value = true
}

const loadSequenceRows = async (rule: CodeRule) => {
  sequenceLoading.value = true
  try {
    const params = rule.id === undefined ? { ruleCode: rule.ruleCode } : { ruleId: rule.id }
    const res = await getCodeSequenceList(params)
    if (res.code === 200 && res.data) {
      sequenceRows.value = [...res.data]
    } else {
      ElMessage.error(res.message || '获取流水水位失败')
    }
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '获取流水水位失败'))
  } finally {
    sequenceLoading.value = false
  }
}

const openDetail = async (row: CodeRule, mode: Exclude<DialogMode, 'add'>) => {
  if (row.id === undefined) {
    ElMessage.error('规则缺少有效 ID')
    return
  }
  try {
    const res = await getCodeRuleById(row.id)
    if (res.code !== 200 || !res.data) {
      ElMessage.error(res.message || '获取编码规则详情失败')
      return
    }
    const detail = res.data
    Object.assign(formData, {
      id: detail.id,
      ruleCode: detail.ruleCode,
      ruleName: detail.ruleName,
      batchSize: detail.batchSize,
      status: detail.status,
      remark: detail.remark || '',
      segments: detail.segments.map(toSegmentForm)
    })
    sequenceRows.value = []
    dialogMode.value = mode
    dialogTitle.value = mode === 'view' ? '查看编码规则' : '编辑编码规则'
    dialogVisible.value = true
    if (mode === 'view') void loadSequenceRows(detail)
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '获取编码规则详情失败'))
  }
}

const addSegment = () => {
  formData.segments.push(createSegment('FIXED'))
}

const removeSegment = (index: number) => {
  formData.segments.splice(index, 1)
}

const moveSegment = (index: number, offset: -1 | 1) => {
  const targetIndex = index + offset
  const target = formData.segments[targetIndex]
  const current = formData.segments[index]
  if (!target || !current) return
  formData.segments.splice(index, 1)
  formData.segments.splice(targetIndex, 0, current)
}

const handleSegmentTypeChange = (segment: SegmentForm) => {
  segment.value = ''
  segment.pattern = 'yyyyMMdd'
  segment.length = 3
  segment.start = 1
  segment.step = 1
}

const validateSegments = () => {
  const sequenceCount = formData.segments.filter(segment => segment.type === 'SEQUENCE').length
  const dateCount = formData.segments.filter(segment => segment.type === 'DATE').length
  if (sequenceCount !== 1) {
    ElMessage.warning('编码片段必须恰好包含一个流水号片段')
    return false
  }
  if (dateCount > 1) {
    ElMessage.warning('编码片段最多只能包含一个日期片段')
    return false
  }
  const emptyFixed = formData.segments.some(segment => segment.type === 'FIXED' && !segment.value.trim())
  if (emptyFixed) {
    ElMessage.warning('固定串片段不能为空')
    return false
  }
  return true
}

const buildPayload = (): CodeRule => {
  const base = {
    ruleCode: formData.ruleCode.trim(),
    ruleName: formData.ruleName.trim(),
    batchSize: formData.batchSize,
    status: formData.status,
    remark: formData.remark.trim(),
    segments: formData.segments.map(toApiSegment)
  }
  return formData.id === undefined ? base : { ...base, id: formData.id }
}

const handleSave = async () => {
  if (!formRef.value) return
  const basicValid = await formRef.value.validate().then(() => true, () => false)
  if (!basicValid || !validateSegments()) return
  saving.value = true
  try {
    const payload = buildPayload()
    const res = formData.id === undefined ? await addCodeRule(payload) : await updateCodeRule(payload)
    if (res.code !== 200) {
      ElMessage.error(res.message || '保存编码规则失败')
      return
    }
    ElMessage.success(formData.id === undefined ? '新增成功' : '更新成功')
    dialogVisible.value = false
    void fetchData()
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '保存编码规则失败'))
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: CodeRule) => {
  if (row.id === undefined) {
    ElMessage.error('规则缺少有效 ID')
    return
  }
  const confirmed = await ElMessageBox.confirm('删除规则后将不再允许按此规则生成新编码，确定继续吗？', '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => true, () => false)
  if (!confirmed) return
  try {
    const res = await deleteCodeRule(row.id)
    if (res.code !== 200) {
      ElMessage.error(res.message || '删除失败')
      return
    }
    ElMessage.success('删除成功')
    void fetchData()
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '删除失败'))
  }
}

const openPreview = async (ruleCode: string) => {
  const normalizedCode = ruleCode.trim()
  if (!normalizedCode) {
    ElMessage.warning('规则编码不能为空')
    return
  }
  try {
    const res = await previewCode({ ruleCode: normalizedCode })
    if (res.code !== 200 || !res.data) {
      ElMessage.error(res.message || '试生成失败')
      return
    }
    previewSample.value = res.data.sample
    previewVisible.value = true
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '试生成失败'))
  }
}

onMounted(() => { void fetchData() })
</script>

<style scoped>
.code-container { display: flex; flex-direction: column; gap: 10px; padding: 10px; height: calc(100vh - 60px); box-sizing: border-box; }
.query-card { flex-shrink: 0; }
.query-form { margin-bottom: 0; }
.status-select { width: 120px; }
.table-card { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
.table-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-header-left { display: flex; gap: 10px; }
.header-hint, .section-hint, .field-hint, .segment-hint { color: var(--text-muted, var(--text-tertiary)); font-size: 12px; }
.table-wrapper { flex: 1; overflow: hidden; min-height: 0; }
.pagination-wrapper { flex-shrink: 0; display: flex; justify-content: flex-end; padding-top: 5px; border-top: 1px solid var(--border); }
.rule-form { max-height: 68vh; overflow-y: auto; padding-right: 8px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 24px; }
.form-grid :deep(.el-input-number) { width: 160px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; margin: 4px 0 10px; padding-top: 12px; border-top: 1px solid var(--border-light); }
.section-title { color: var(--text-primary); font-size: 15px; font-weight: 600; }
.section-hint { margin-left: 12px; }
.segment-list { display: flex; flex-direction: column; gap: 8px; }
.segment-row { display: flex; align-items: center; gap: 8px; min-height: 42px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-secondary); }
.segment-index { width: 22px; color: var(--text-tertiary); text-align: center; }
.segment-type { width: 120px; flex-shrink: 0; }
.segment-value { flex: 1; min-width: 150px; }
.sequence-fields { display: flex; align-items: center; gap: 6px; flex: 1; flex-wrap: wrap; }
.sequence-fields label { color: var(--text-tertiary); font-size: 12px; }
.sequence-fields :deep(.el-input-number) { width: 116px; }
.segment-actions { display: flex; flex-shrink: 0; gap: 2px; }
.segment-hint { margin: 8px 0 0 0; }
.sequence-panel { margin-top: 16px; }
.preview-content { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 12px 0 20px; }
.preview-label { color: var(--text-tertiary); font-size: 13px; }
.preview-content code { width: 100%; padding: 16px; border: 1px solid var(--primary-light); border-radius: 4px; background: var(--primary-lighter); color: var(--primary); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 24px; font-weight: 600; text-align: center; word-break: break-all; }
.preview-content p { margin: 0; color: var(--text-tertiary); font-size: 12px; }
@media (max-width: 760px) {
  .code-container { padding: 8px; }
  .form-grid { grid-template-columns: 1fr; column-gap: 0; }
  .segment-row { align-items: flex-start; flex-wrap: wrap; }
  .segment-index { padding-top: 8px; }
  .segment-value, .sequence-fields { flex-basis: calc(100% - 38px); }
  .segment-actions { margin-left: 30px; }
}
</style>

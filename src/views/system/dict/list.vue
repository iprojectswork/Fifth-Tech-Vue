<template>
  <div class="dict-container">
    <el-card class="dict-card">
      <template #header>
        <div class="card-header">
          <div class="card-header-left">
            <el-button @click="handleRefresh" :disabled="treeDirty">刷新</el-button>
            <el-button v-if="!fullMode" @click="enterFullMode" :disabled="treeDirty">全部展开</el-button>
            <el-button v-else @click="enterLazyMode" :disabled="treeDirty">回到懒加载</el-button>
            <el-button v-permission="'system:dict:add'" type="primary" @click="openAddRoot" :disabled="treeDirty">新增根节点</el-button>
            <el-button
              v-permission="'system:dict:edit'"
              type="success"
              :disabled="!treeDirty"
              :loading="savingTree"
              @click="saveTreeMoves"
            >
              保存调整{{ pendingMoveCount > 0 ? `（${pendingMoveCount}）` : '' }}
            </el-button>
            <el-button v-if="treeDirty" @click="discardTreeMoves">放弃调整</el-button>
          </div>
          <span class="header-hint">
            {{ treeDirty ? '有未保存的拖拽调整，可继续拖动，点「保存调整」一次提交' : '叶子可拖；调整后点「保存调整」才会写入' }}
          </span>
        </div>
      </template>

      <div class="split">
        <div class="split-left" :style="{ width: `${leftWidth}px` }">
          <el-tree
            ref="treeRef"
            :key="treeKey"
            :data="treeData"
            :props="treeProps"
            node-key="id"
            :lazy="!fullMode"
            :load="fullMode ? undefined : loadNode"
            :default-expand-all="fullMode"
            :expand-on-click-node="false"
            :empty-text="fullMode ? '暂无字典节点，请新增' : '加载中…'"
            highlight-current
            draggable
            :allow-drag="allowDrag"
            :allow-drop="allowDrop"
            @node-click="handleNodeClick"
            @node-dblclick="handleNodeDblClick"
            @node-drop="handleNodeDrop"
          >
            <template #default="{ data }">
              <span class="tree-node-label" :title="formatTooltip(data)">
                <el-tag size="small" effect="plain">{{ data.code }}</el-tag>
                <span class="node-name">{{ data.name }}</span>
              </span>
            </template>
          </el-tree>
        </div>
        <div class="split-divider" @mousedown.prevent="startDrag" />
        <div class="split-right">
          <template v-if="currentNode">
            <div class="right-header">
              <div class="path-info">
                <span class="path-label">当前：</span>
                <span class="path-text">{{ currentNode.pathName || currentNode.name }}</span>
                <span class="path-text path-code">（{{ currentNode.pathCode || currentNode.code }}）</span>
              </div>
              <div class="right-toolbar">
                <el-button v-permission="'system:dict:add'" type="primary" @click="openAddChild">新增子节点</el-button>
                <el-button v-permission="'system:dict:edit'" @click="openEdit(currentNode)">编辑</el-button>
                <el-button v-permission="'system:dict:delete'" type="danger" @click="handleDelete(currentNode)">删除</el-button>
              </div>
            </div>

            <!-- §5.3：非叶 = hasChildren 或 list 非空；叶才空态。增删后以 list 结果回写 hasChildren -->
            <div v-if="showChildrenPanel" class="right-body">
              <el-table v-loading="childrenLoading" :data="children" border>
                <el-table-column prop="code" label="编码" min-width="120" show-overflow-tooltip />
                <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
                <el-table-column prop="sort" label="排序" width="80" align="center" />
                <el-table-column label="状态" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'info'">
                      {{ row.status === 1 ? '启用' : '禁用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="pathCode" label="路径编码" min-width="180" show-overflow-tooltip />
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="{ row }">
                    <el-button v-permission="'system:dict:view'" link type="primary" @click="openDetail(row)">查看</el-button>
                    <el-button v-permission="'system:dict:edit'" link type="primary" @click="openEdit(row)">编辑</el-button>
                    <el-button v-permission="'system:dict:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="!childrenLoading && children.length === 0" description="暂无子节点" :image-size="60" />
            </div>
            <el-empty v-else description="当前为叶子节点，无子节点" :image-size="80" />
          </template>
          <el-empty v-else description="请先选择左侧节点" :image-size="80" />
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      destroy-on-close
      @close="onDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <el-form-item label="父节点" prop="parentId">
          <template v-if="isView || dialogMode === 'addRoot' || dialogMode === 'addChild'">
            <span class="parent-display">{{ formData.parentDisplay }}</span>
          </template>
          <template v-else>
            <el-tree-select
              v-model="formData.parentId"
              class="parent-tree-select"
              :data="parentSelectTree"
              :props="parentSelectProps"
              node-key="id"
              check-strictly
              filterable
              clearable
              :render-after-expand="false"
              default-expand-all
              placeholder="不选则为根节点"
              :disabled="parentSelectDisabled"
              style="width: 100%"
            />
            <div v-if="parentSelectDisabled" class="field-hint block-hint">
              当前节点下仍有子节点，不可改挂父级（请先清空子节点或只拖叶子）
            </div>
            <div v-else class="field-hint block-hint">可改为其它节点下，或清空表示挂到根</div>
          </template>
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="formData.code" :disabled="isView" placeholder="如 gender；不可包含 /" maxlength="64" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" :disabled="isView" placeholder="请输入名称" maxlength="128" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :disabled="isView" :min="0" :max="99999" controls-position="right" />
          <span class="field-hint">同级按 sort 升序，缺省 0</span>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status" :disabled="isView">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" :disabled="isView" type="textarea" :rows="2" maxlength="512" show-word-limit placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ isView ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!isView" type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// allow: SIZE_OK — 单页字典管理需要同时承载左树懒/全展开、拖拽改挂、右栏子表、CRUD 弹窗与自定义分栏，按 C3 §5/§6.3/§8.2 强制唯一业务文件。
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  addDictNode,
  deleteDictNode,
  DICT_ROOT_PARENT_ID,
  getDictNodeById,
  getDictNodeChildren,
  getDictNodeList,
  getDictNodeTree,
  moveDictNode,
  updateDictNode,
  type DictNodeDTO,
  type DictNodeTreeVO,
  type DictNodeVO,
  type SnowflakeId
} from '@/api/dict'

type DialogMode = 'addRoot' | 'addChild' | 'edit' | 'view'

interface DictNodeFormData {
  id?: SnowflakeId
  parentId: SnowflakeId
  /** 打开编辑时的原始父 id，用于判断是否改挂 */
  originalParentId: SnowflakeId
  parentDisplay: string
  /** 编辑目标是否有子（有子则禁止改父） */
  editingHasChildren: boolean
  code: string
  name: string
  sort: number
  status: number
  remark: string
}

/** el-tree-select 选项 */
interface ParentSelectNode {
  id: SnowflakeId
  label: string
  disabled?: boolean
  children?: ParentSelectNode[]
}

const SPLIT_KEY = 'dict-split-width'
const MIN_WIDTH = 180
const MAX_RATIO = 0.5
const DEFAULT_WIDTH = 280

const treeRef = ref<any>(null)
const treeKey = ref(0)
const fullMode = ref(false)
const treeData = ref<(DictNodeVO | DictNodeTreeVO)[]>([])
const treeProps = {
  label: (data: any) => data.name,
  isLeaf: (data: any) => !data.hasChildren,
  children: 'children'
}

/** 编辑弹窗：父节点树选择数据 */
const parentSelectTree = ref<ParentSelectNode[]>([])
const parentSelectProps = {
  value: 'id',
  label: 'label',
  children: 'children',
  disabled: 'disabled'
}
const parentSelectDisabled = computed(
  () => dialogMode.value === 'edit' && formData.editingHasChildren
)

const currentNode = ref<DictNodeVO | null>(null)
const children = ref<DictNodeVO[]>([])
const childrenLoading = ref(false)

/** 拖拽草稿：nodeId → 新 parentId；点「保存调整」才批量提交 */
const pendingMoves = ref<Record<string, SnowflakeId>>({})
const savingTree = ref(false)
const treeDirty = computed(() => Object.keys(pendingMoves.value).length > 0)
const pendingMoveCount = computed(() => Object.keys(pendingMoves.value).length)

/** §5.3 右栏：hasChildren 或 list 非空则展示子表（增删后靠 loadChildren 回写 hasChildren） */
const showChildrenPanel = computed(() => {
  const n = currentNode.value
  if (!n) return false
  return Boolean(n.hasChildren) || children.value.length > 0
})

const leftWidth = ref(loadSavedWidth())
const dragState = ref<{ startX: number; startWidth: number; maxWidth: number } | null>(null)

function loadSavedWidth(): number {
  if (typeof localStorage === 'undefined') return DEFAULT_WIDTH
  try {
    const raw = localStorage.getItem(SPLIT_KEY)
    if (!raw) return DEFAULT_WIDTH
    const n = parseInt(raw, 10)
    if (!Number.isFinite(n) || n < MIN_WIDTH) return DEFAULT_WIDTH
    return n
  } catch {
    return DEFAULT_WIDTH
  }
}

function persistWidth(w: number): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SPLIT_KEY, String(w))
  } catch {
    /* localStorage 不可用，忽略 */
  }
}

function startDrag(e: MouseEvent): void {
  const divider = e.currentTarget as HTMLElement | null
  const container = divider?.parentElement
  if (!container) return
  const rect = container.getBoundingClientRect()
  dragState.value = {
    startX: e.clientX,
    startWidth: leftWidth.value,
    maxWidth: Math.max(MIN_WIDTH, Math.floor(rect.width * MAX_RATIO))
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
}

function onDrag(e: MouseEvent): void {
  const s = dragState.value
  if (!s) return
  const dx = e.clientX - s.startX
  let w = s.startWidth + dx
  if (w < MIN_WIDTH) w = MIN_WIDTH
  if (w > s.maxWidth) w = s.maxWidth
  leftWidth.value = w
}

function endDrag(): void {
  if (!dragState.value) return
  persistWidth(leftWidth.value)
  dragState.value = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
})

async function loadNode(node: any, resolve: (data: DictNodeVO[]) => void): Promise<void> {
  const level: number = node?.level ?? 0
  const parentId: SnowflakeId = level === 0 ? DICT_ROOT_PARENT_ID : String(node?.data?.id ?? DICT_ROOT_PARENT_ID)
  try {
    const res = await getDictNodeChildren({ parentId })
    if (res.code === 200 && res.data) {
      resolve(res.data)
      return
    }
    ElMessage.error(res.message || '加载子节点失败')
    resolve([])
  } catch (error) {
    const msg = error instanceof Error && error.message ? error.message : '加载子节点失败'
    ElMessage.error(msg)
    resolve([])
  }
}

async function enterFullMode(): Promise<void> {
  childrenLoading.value = true
  try {
    const res = await getDictNodeTree()
    if (res.code === 200 && res.data) {
      treeData.value = res.data as DictNodeTreeVO[]
      fullMode.value = true
      treeKey.value++
      await nextTick()
      const target = currentNode.value?.id ?? null
      if (target !== null) treeRef.value?.setCurrentKey?.(target)
    } else {
      ElMessage.error(res.message || '加载全量树失败')
    }
  } catch (error) {
    const msg = error instanceof Error && error.message ? error.message : '加载全量树失败'
    ElMessage.error(msg)
  } finally {
    childrenLoading.value = false
  }
}

function enterLazyMode(): void {
  if (treeDirty.value) {
    ElMessage.warning('请先保存或放弃调整')
    return
  }
  fullMode.value = false
  treeData.value = []
  treeKey.value++
  currentNode.value = null
  children.value = []
}

async function handleRefresh(): Promise<void> {
  if (treeDirty.value) {
    ElMessage.warning('请先保存或放弃调整')
    return
  }
  if (fullMode.value) {
    await enterFullMode()
    return
  }
  const preserved = currentNode.value?.id ?? null
  currentNode.value = null
  children.value = []
  treeKey.value++
  if (preserved !== null) {
    await nextTick()
    treeRef.value?.setCurrentKey?.(preserved)
  }
}

async function loadChildren(parentId: SnowflakeId): Promise<void> {
  childrenLoading.value = true
  try {
    const res = await getDictNodeList({ parentId })
    if (res.code === 200 && res.data) {
      children.value = res.data
    } else {
      ElMessage.error(res.message || '加载子节点失败')
      children.value = []
    }
  } catch (error) {
    const msg = error instanceof Error && error.message ? error.message : '加载子节点失败'
    ElMessage.error(msg)
    children.value = []
  } finally {
    childrenLoading.value = false
    // 与 §5.3 对齐：用 list 结果回写选中节点 hasChildren，避免「叶子下新增后仍显示空态」
    if (currentNode.value && String(currentNode.value.id) === String(parentId)) {
      currentNode.value = {
        ...currentNode.value,
        hasChildren: children.value.length > 0
      }
    }
  }
}

function findInTree(list: readonly DictNodeTreeVO[], id: SnowflakeId): DictNodeTreeVO | null {
  for (const n of list) {
    if (n.id === id) return n
    const sub = findInTree(n.children, id)
    if (sub) return sub
  }
  return null
}

async function handleNodeClick(data: DictNodeVO): Promise<void> {
  currentNode.value = data
  await loadChildren(data.id)
}

async function handleNodeDblClick(data: DictNodeVO): Promise<void> {
  await openEdit(data)
}

function allowDrag(node: any): boolean {
  const d = node?.data
  if (!d) return false
  // 有子不可拖；hasChildren 缺省按可拖处理，避免字段异常导致完全拖不动
  return !d.hasChildren
}

function allowDrop(draggingNode: any, dropNode: any, _type: string): boolean {
  const dragId = draggingNode?.data?.id
  const dropId = dropNode?.data?.id
  if (dragId === undefined || dropId === undefined) return false
  // 允许 prev/inner/next，扩大可落点区域；最终父级在 drop 时解析
  return String(dragId) !== String(dropId)
}

/** 解析 drop 后的新父 id：inner=目标自身；prev/next=目标的父 */
function resolveDropParentId(dropNode: any, dropType: string): SnowflakeId | null {
  const data = dropNode?.data
  if (!data) return null
  if (dropType === 'inner') {
    return data.id != null ? String(data.id) : null
  }
  // 插到目标前后 = 与目标同级 → 父为 target.parentId
  if (data.parentId != null && String(data.parentId) !== '') {
    return String(data.parentId)
  }
  // 树节点对象上的 parent
  const parentData = dropNode?.parent?.data
  if (parentData?.id != null) return String(parentData.id)
  return DICT_ROOT_PARENT_ID
}

/** 深拷贝树节点（仅结构字段） */
function cloneTreeNodes(nodes: readonly DictNodeTreeVO[]): DictNodeTreeVO[] {
  return nodes.map((n) => ({
    ...n,
    id: String(n.id),
    parentId: n.parentId != null ? String(n.parentId) : DICT_ROOT_PARENT_ID,
    children: n.children?.length ? cloneTreeNodes(n.children) : []
  }))
}

/** 从树中摘下 id 节点，返回 [新树, 摘下的节点] */
function detachNode(
  nodes: DictNodeTreeVO[],
  id: SnowflakeId
): { tree: DictNodeTreeVO[]; node: DictNodeTreeVO | null } {
  const target = String(id)
  const result: DictNodeTreeVO[] = []
  let found: DictNodeTreeVO | null = null
  for (const n of nodes) {
    if (String(n.id) === target) {
      found = { ...n, children: n.children ? [...n.children] : [] }
      continue
    }
    if (n.children?.length) {
      const sub = detachNode(n.children as DictNodeTreeVO[], target)
      if (sub.node) found = sub.node
      result.push({ ...n, children: sub.tree, hasChildren: sub.tree.length > 0 })
    } else {
      result.push({ ...n, children: [] })
    }
  }
  return { tree: result, node: found }
}

/** 把 node 挂到 parentId 下（0=根） */
function attachNode(
  nodes: DictNodeTreeVO[],
  node: DictNodeTreeVO,
  parentId: SnowflakeId
): DictNodeTreeVO[] {
  const pid = String(parentId)
  const attached = {
    ...node,
    parentId: pid,
    children: node.children?.length ? node.children : [],
    hasChildren: Boolean(node.children?.length)
  }
  if (pid === DICT_ROOT_PARENT_ID) {
    return [...nodes, attached]
  }
  return nodes.map((n) => {
    if (String(n.id) === pid) {
      const kids = [...(n.children || []), attached] as DictNodeTreeVO[]
      return { ...n, children: kids, hasChildren: true }
    }
    if (n.children?.length) {
      return { ...n, children: attachNode(n.children as DictNodeTreeVO[], node, parentId) }
    }
    return n
  })
}

/** 按 pendingMoves 重算 path 与 hasChildren */
function recomputeTreeMeta(nodes: DictNodeTreeVO[], parentPathCode = '', parentPathName = ''): DictNodeTreeVO[] {
  return nodes.map((n) => {
    const pathCode = parentPathCode ? `${parentPathCode}/${n.code}` : n.code
    const pathName = parentPathName ? `${parentPathName}/${n.name}` : n.name
    const kids = n.children?.length
      ? recomputeTreeMeta(n.children as DictNodeTreeVO[], pathCode, pathName)
      : []
    return {
      ...n,
      pathCode,
      pathName,
      parentId: n.parentId != null ? String(n.parentId) : DICT_ROOT_PARENT_ID,
      hasChildren: kids.length > 0,
      children: kids
    }
  })
}

function applyMoveOnTree(
  nodes: DictNodeTreeVO[],
  moveId: SnowflakeId,
  targetParentId: SnowflakeId
): DictNodeTreeVO[] {
  const { tree, node } = detachNode(nodes, moveId)
  if (!node) return nodes
  // 禁止挂到自己的子孙（本地校验）
  if (isDescendant(tree, targetParentId, moveId)) {
    ElMessage.warning('不能移动到自己的子节点下')
    return nodes
  }
  const next = attachNode(tree, node, targetParentId)
  return recomputeTreeMeta(next)
}

function isDescendant(nodes: DictNodeTreeVO[], maybeDescendantId: SnowflakeId, ancestorId: SnowflakeId): boolean {
  if (String(maybeDescendantId) === DICT_ROOT_PARENT_ID) return false
  const anc = findInTree(nodes, String(ancestorId))
  if (!anc) return false
  const walk = (list: readonly DictNodeTreeVO[]): boolean => {
    for (const n of list) {
      if (String(n.id) === String(maybeDescendantId)) return true
      if (n.children?.length && walk(n.children)) return true
    }
    return false
  }
  return walk(anc.children || [])
}

/** 拉取全量树并套上当前草稿 moves，用于本地预览 */
async function rebuildTreeWithPending(): Promise<void> {
  const res = await getDictNodeTree()
  if (res.code !== 200 || !res.data) {
    ElMessage.error(res.message || '加载树失败')
    return
  }
  let nodes = cloneTreeNodes(res.data)
  for (const [id, parentId] of Object.entries(pendingMoves.value)) {
    nodes = applyMoveOnTree(nodes, id, parentId)
  }
  fullMode.value = true
  treeData.value = nodes
  treeKey.value++
  await nextTick()
  // 同步当前选中
  if (currentNode.value) {
    const refreshed = findInTree(nodes, String(currentNode.value.id))
    if (refreshed) {
      currentNode.value = refreshed
      // 右栏用本地 children
      children.value = (refreshed.children || []) as DictNodeVO[]
    }
  }
}

/**
 * 拖放：只记草稿并刷新本地树预览，不调 API。
 * 需点顶部「保存调整」才批量落库。
 */
async function handleNodeDrop(draggingNode: any, dropNode: any, dropType: string): Promise<void> {
  const id = draggingNode?.data?.id
  if (id === undefined || id === null || id === '') {
    await rebuildTreeWithPending()
    return
  }
  if (draggingNode?.data?.hasChildren) {
    ElMessage.warning('有子节点的节点不允许移动')
    await rebuildTreeWithPending()
    return
  }
  const moveId = String(id)
  const moveTarget = resolveDropParentId(dropNode, dropType)
  if (moveTarget === null || moveId === moveTarget) {
    await rebuildTreeWithPending()
    return
  }

  pendingMoves.value = {
    ...pendingMoves.value,
    [moveId]: String(moveTarget)
  }
  await rebuildTreeWithPending()
}

async function saveTreeMoves(): Promise<void> {
  const entries = Object.entries(pendingMoves.value)
  if (!entries.length) return
  savingTree.value = true
  try {
    let ok = 0
    let fail = 0
    for (const [id, parentId] of entries) {
      const res = await moveDictNode({ id, targetParentId: parentId })
      if (res.code === 200) ok++
      else fail++
    }
    if (fail === 0) {
      ElMessage.success(`已保存 ${ok} 项调整`)
      pendingMoves.value = {}
      await refreshAfterMutation()
    } else {
      ElMessage.error(`保存完成：成功 ${ok}，失败 ${fail}。请检查后重试失败项`)
      // 失败时仍清空？保留草稿更安全——但服务端可能已部分成功。重新对齐：清空草稿并刷新
      pendingMoves.value = {}
      await refreshAfterMutation()
    }
  } catch (error) {
    const msg = error instanceof Error && error.message ? error.message : '保存失败'
    ElMessage.error(msg)
    pendingMoves.value = {}
    await refreshAfterMutation()
  } finally {
    savingTree.value = false
  }
}

async function discardTreeMoves(): Promise<void> {
  if (!treeDirty.value) return
  pendingMoves.value = {}
  await refreshAfterMutation()
  ElMessage.info('已放弃未保存的调整')
}

async function doMove(
  id: SnowflakeId,
  targetParentId: SnowflakeId,
  targetLabel?: string,
  options?: { silent?: boolean; skipRefresh?: boolean }
): Promise<boolean> {
  try {
    const res = await moveDictNode({ id, targetParentId })
    if (res.code === 200) {
      if (!options?.silent) {
        ElMessage.success(targetLabel ? `已移到「${targetLabel}」下` : '移动成功')
      }
      if (!options?.skipRefresh) {
        await refreshAfterMutation()
      }
      return true
    }
    ElMessage.error(res.message || '移动失败')
    if (!options?.skipRefresh) {
      await refreshAfterMutation()
    }
    return false
  } catch (error) {
    const msg = error instanceof Error && error.message ? error.message : '移动失败'
    ElMessage.error(msg)
    if (!options?.skipRefresh) {
      await refreshAfterMutation()
    }
    return false
  }
}

/** 构建父节点选择树：排除自身及其子孙，避免环 */
function buildParentSelectTree(
  nodes: readonly DictNodeTreeVO[],
  excludeId: SnowflakeId | undefined
): ParentSelectNode[] {
  const mapNode = (n: DictNodeTreeVO): ParentSelectNode | null => {
    if (excludeId != null && String(n.id) === String(excludeId)) {
      return null
    }
    const kids = (n.children || [])
      .map(mapNode)
      .filter((x): x is ParentSelectNode => x !== null)
    return {
      id: String(n.id),
      label: `${n.name}（${n.pathCode || n.code}）`,
      children: kids.length ? kids : undefined
    }
  }
  return nodes.map(mapNode).filter((x): x is ParentSelectNode => x !== null)
}

async function loadParentSelectOptions(excludeId?: SnowflakeId): Promise<void> {
  try {
    const res = await getDictNodeTree()
    if (res.code === 200 && res.data) {
      parentSelectTree.value = buildParentSelectTree(res.data, excludeId)
    } else {
      parentSelectTree.value = []
    }
  } catch {
    parentSelectTree.value = []
  }
}

async function refreshAfterMutation(): Promise<void> {
  if (fullMode.value) {
    const preserved = currentNode.value?.id ?? null
    const res = await getDictNodeTree()
    if (res.code === 200 && res.data) {
      treeData.value = res.data as DictNodeTreeVO[]
      treeKey.value++
      await nextTick()
      // 全展开模式下保持 selected；并尝试同步 currentNode 的引用
      if (preserved !== null) {
        const refreshed = findInTree(res.data, preserved)
        if (refreshed) {
          currentNode.value = refreshed
          await loadChildren(refreshed.id)
        } else {
          currentNode.value = null
          children.value = []
        }
        treeRef.value?.setCurrentKey?.(preserved)
      }
    }
    return
  }
  // 懒加载模式：保留当前选中，仅重置 tree 触发重渲染；当前选中节点的右栏使用 list 接口重拉
  const preserved = currentNode.value
  treeKey.value++
  await nextTick()
  if (preserved) {
    try {
      const res = await getDictNodeList({ parentId: preserved.id })
      if (res.code === 200 && res.data) {
        children.value = res.data
      }
    } catch {
      /* noop：刷新主要是视觉恢复 */
    }
    treeRef.value?.setCurrentKey?.(preserved.id)
  }
}

const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('addRoot')
const dialogTitle = computed(() => {
  switch (dialogMode.value) {
    case 'addRoot':
      return '新增根节点'
    case 'addChild':
      return `新增子节点（父：${currentNode.value?.name ?? ''}）`
    case 'edit':
      return '编辑节点'
    case 'view':
      return '查看节点'
    default:
      return '字典节点'
  }
})
const isView = computed(() => dialogMode.value === 'view')
const formRef = ref<FormInstance>()
const saving = ref(false)

function makeEmptyForm(): DictNodeFormData {
  return {
    id: undefined,
    parentId: DICT_ROOT_PARENT_ID,
    originalParentId: DICT_ROOT_PARENT_ID,
    parentDisplay: '根节点',
    editingHasChildren: false,
    code: '',
    name: '',
    sort: 0,
    status: 1,
    remark: ''
  }
}

const formData = reactive<DictNodeFormData>(makeEmptyForm())

const formRules: FormRules = {
  code: [
    { required: true, message: '请输入编码', trigger: 'blur' },
    {
      validator: (_rule, value, cb) => {
        const v = String(value ?? '').trim()
        if (!v) {
          cb(new Error('编码不能为空'))
          return
        }
        if (v.includes('/')) {
          cb(new Error('编码不能包含 /'))
          return
        }
        if (!/^[A-Za-z0-9_\-.]{1,64}$/.test(v)) {
          cb(new Error('仅支持字母、数字、下划线、点、中划线，长度 ≤ 64'))
          return
        }
        cb()
      },
      trigger: 'blur'
    }
  ],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

function resetForm(): void {
  Object.assign(formData, makeEmptyForm())
  formRef.value?.clearValidate()
}

function onDialogClose(): void {
  resetForm()
}

function openAddRoot(): void {
  resetForm()
  dialogMode.value = 'addRoot'
  formData.parentId = DICT_ROOT_PARENT_ID
  formData.parentDisplay = '根节点'
  dialogVisible.value = true
}

function openAddChild(): void {
  if (!currentNode.value) {
    ElMessage.warning('请先在左侧选中父节点')
    return
  }
  const parent = currentNode.value
  resetForm()
  dialogMode.value = 'addChild'
  formData.parentId = parent.id
  formData.parentDisplay = `${parent.pathName}（${parent.pathCode}）`
  dialogVisible.value = true
}

async function applyDetailIntoForm(detail: DictNodeVO): Promise<void> {
  const parentDisplay =
    String(detail.parentId) === DICT_ROOT_PARENT_ID
      ? '根节点'
      : (() => {
          const codeParts = detail.pathCode.split('/').slice(0, -1)
          const nameParts = detail.pathName.split('/').slice(0, -1)
          if (codeParts.length === 0) return '根节点'
          return `${nameParts.join('/')}（${codeParts.join('/')}）`
        })()
  const parentId =
    detail.parentId == null || String(detail.parentId) === DICT_ROOT_PARENT_ID
      ? DICT_ROOT_PARENT_ID
      : String(detail.parentId)
  Object.assign(formData, {
    id: String(detail.id),
    parentId,
    originalParentId: parentId,
    parentDisplay,
    editingHasChildren: Boolean(detail.hasChildren),
    code: detail.code,
    name: detail.name,
    sort: detail.sort ?? 0,
    status: detail.status ?? 1,
    remark: detail.remark ?? ''
  })
  await nextTick()
  formRef.value?.clearValidate()
}

async function openDetail(row: DictNodeVO): Promise<void> {
  try {
    const res = await getDictNodeById(row.id)
    if (res.code !== 200 || !res.data) {
      ElMessage.error(res.message || '获取详情失败')
      return
    }
    await applyDetailIntoForm(res.data)
    dialogMode.value = 'view'
    dialogVisible.value = true
  } catch (error) {
    const msg = error instanceof Error && error.message ? error.message : '获取详情失败'
    ElMessage.error(msg)
  }
}

async function openEdit(row: DictNodeVO): Promise<void> {
  try {
    const res = await getDictNodeById(row.id)
    if (res.code !== 200 || !res.data) {
      ElMessage.error(res.message || '获取详情失败')
      return
    }
    await applyDetailIntoForm(res.data)
    await loadParentSelectOptions(String(res.data.id))
    // tree-select 清空表示根：用 null 不便，保持 DICT_ROOT_PARENT_ID；展示上 clearable 清空后写回根
    if (String(formData.parentId) === DICT_ROOT_PARENT_ID) {
      formData.parentId = DICT_ROOT_PARENT_ID
    }
    dialogMode.value = 'edit'
    dialogVisible.value = true
  } catch (error) {
    const msg = error instanceof Error && error.message ? error.message : '获取详情失败'
    ElMessage.error(msg)
  }
}

/** 规范化父 id：空 / null → 根 */
function normalizeParentId(raw: SnowflakeId | null | undefined): SnowflakeId {
  if (raw === null || raw === undefined || raw === '' || String(raw) === 'null') {
    return DICT_ROOT_PARENT_ID
  }
  return String(raw)
}

async function handleSave(): Promise<void> {
  if (!formRef.value) return
  let valid = false
  try {
    await formRef.value.validate()
    valid = true
  } catch {
    valid = false
  }
  if (!valid) return
  saving.value = true
  try {
    const trimmedCode = formData.code.trim()
    const trimmedName = formData.name.trim()
    const trimmedRemark = formData.remark?.trim() ?? ''
    const parentId = normalizeParentId(formData.parentId)

    // 编辑且改了父节点 → 先 move（仅无子可改挂）
    if (formData.id !== undefined && dialogMode.value === 'edit') {
      const original = normalizeParentId(formData.originalParentId)
      if (parentId !== original) {
        if (formData.editingHasChildren) {
          ElMessage.warning('有子节点的节点不允许改挂父级')
          return
        }
        const moved = await doMove(String(formData.id), parentId, undefined, {
          silent: true,
          skipRefresh: true
        })
        if (!moved) return
      }
      const payload: DictNodeDTO = {
        id: formData.id,
        parentId,
        code: trimmedCode,
        name: trimmedName,
        sort: formData.sort,
        status: formData.status,
        remark: trimmedRemark ? trimmedRemark : undefined
      }
      const res = await updateDictNode(payload)
      if (res.code !== 200) {
        ElMessage.error(res.message || '保存失败')
        return
      }
      ElMessage.success('更新成功')
      dialogVisible.value = false
      await refreshAfterMutation()
      return
    }

    const payload: DictNodeDTO = {
      id: formData.id,
      parentId,
      code: trimmedCode,
      name: trimmedName,
      sort: formData.sort,
      status: formData.status,
      remark: trimmedRemark ? trimmedRemark : undefined
    }
    const res = await addDictNode(payload)
    if (res.code !== 200) {
      ElMessage.error(res.message || '保存失败')
      return
    }
    ElMessage.success('新增成功')
    dialogVisible.value = false
    await refreshAfterMutation()
  } catch (error) {
    const msg = error instanceof Error && error.message ? error.message : '保存失败'
    ElMessage.error(msg)
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: DictNodeVO): Promise<void> {
  const ok = await ElMessageBox.confirm(
    `确定删除节点「${row.name}」(${row.code}) 吗？有未删子节点的节点将被后端拒绝。`,
    '删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => true, () => false)
  if (!ok) return
  try {
    const res = await deleteDictNode(row.id)
    if (res.code !== 200) {
      ElMessage.error(res.message || '删除失败')
      return
    }
    ElMessage.success('删除成功')
    if (currentNode.value?.id === row.id) {
      currentNode.value = null
      children.value = []
    } else if (currentNode.value) {
      await loadChildren(currentNode.value.id)
    }
    await refreshAfterMutation()
  } catch (error) {
    const msg = error instanceof Error && error.message ? error.message : '删除失败'
    ElMessage.error(msg)
  }
}

function formatTooltip(data: any): string {
  const pn = data?.pathName ? String(data.pathName) : ''
  const pc = data?.pathCode ? String(data.pathCode) : ''
  if (pn && pc) return `${pn}（${pc}）`
  if (pc) return pc
  if (pn) return pn
  return ''
}

onMounted(() => {
  // 懒加载模式：treeData = []，由 loadNode 加载根（parentId=0）
  treeData.value = []
})
</script>

<style scoped>
.dict-container {
  display: flex;
  flex-direction: column;
  padding: 10px;
  height: calc(100vh - 60px);
  box-sizing: border-box;
}
.dict-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.dict-card :deep(.el-card__body) {
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
}
.card-header-left {
  display: flex;
  gap: 10px;
}
.header-hint {
  color: var(--text-tertiary);
  font-size: 12px;
}
.split {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  background: var(--bg-primary);
}
.split-left {
  flex-shrink: 0;
  overflow: auto;
  padding: 8px;
  border-right: 0;
  background: var(--bg-secondary);
  min-width: 180px;
  /* 建立层叠上下文，避免指示线被右侧栏/背景盖住 */
  position: relative;
  z-index: 1;
  isolation: isolate;
}
.split-left :deep(.el-tree) {
  position: relative;
  background: transparent;
}
.split-left :deep(.el-tree-node__content) {
  height: auto;
  min-height: 28px;
  padding: 4px 0;
  background-color: transparent;
}
/* 自定义节点不抢事件，避免挡住拖拽命中与指示线 */
.tree-node-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  pointer-events: none;
}
.node-name {
  color: var(--text-primary);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
/* 拖放指示线：加粗、提层，不被节点背景挡住 */
.split-left :deep(.el-tree__drop-indicator) {
  position: absolute;
  z-index: 20;
  height: 2px;
  margin-top: -1px;
  background-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary-light);
  pointer-events: none;
}
/* 拖入节点内部时高亮目标行（半透明，不盖住指示线） */
.split-left :deep(.el-tree-node.is-drop-inner > .el-tree-node__content) {
  background-color: color-mix(in srgb, var(--primary-light) 70%, transparent) !important;
  outline: 1px dashed var(--primary);
  outline-offset: -1px;
}
.split-divider {
  flex-shrink: 0;
  width: 6px;
  cursor: col-resize;
  background: var(--border-light);
  position: relative;
  transition: background 0.15s ease;
}
.split-divider:hover,
.split-divider:active {
  background: var(--primary-light);
}
.split-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 18px;
  border-radius: 1px;
  background: var(--secondary-light);
  opacity: 0.6;
}
.split-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  padding: 12px;
  gap: 12px;
}
.right-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light);
}
.path-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
  font-size: 14px;
  line-height: 1.5;
}
.path-label {
  color: var(--text-secondary);
  font-weight: 400;
}
.path-text {
  color: var(--text-primary);
  font-weight: 400;
  word-break: break-all;
}
.path-code {
  color: var(--text-secondary);
}
.right-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.right-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.right-body :deep(.el-table) {
  flex: 1;
}
.parent-display {
  color: var(--text-secondary);
  font-size: 14px;
  font-family: inherit;
  word-break: break-all;
  line-height: 1.5;
}
.parent-tree-select {
  width: 100%;
}
.field-hint {
  margin-left: 10px;
  color: var(--text-tertiary);
  font-size: 12px;
}
.field-hint.block-hint {
  display: block;
  margin-left: 0;
  margin-top: 6px;
  line-height: 1.4;
}
@media (max-width: 760px) {
  .dict-container { padding: 8px; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 4px; }
  .header-hint { display: none; }
}
</style>

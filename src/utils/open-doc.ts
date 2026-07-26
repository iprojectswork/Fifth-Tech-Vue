/**
 * 统一打开单据入口（B2 openDoc）
 * 使用 router 单例，禁止在此调用 useNavigation/useRoute（事件回调无当前实例）。
 */
import { ElMessage } from 'element-plus'
import router from '@/router'
import {
  getDocDefByType,
  type DocMode
} from '@/router/routes/doc-registry'
import { usePermissionStore } from '@/store/permission'
import { useTabsStore } from '@/store/tabs'
import { useMenuStore } from '@/store/menu'

export type OpenDocOptions = {
  readonly docType: string
  readonly id?: string | number | null
  readonly mode?: DocMode
  readonly query?: Readonly<Record<string, string | number | undefined>>
}

function codeBySuffix(codes: readonly string[], suffix: string): string | undefined {
  return codes.find((c) => c.endsWith(suffix))
}

function resolveMode(docType: string, options: OpenDocOptions): DocMode | null {
  const def = getDocDefByType(docType)
  if (!def) return null
  const ps = usePermissionStore()
  const id = options.id
  const isCreate =
    options.mode === 'create' || id === undefined || id === null || id === ''

  if (isCreate) {
    return ps.hasAnyCode(def.createCodes) ? 'create' : null
  }

  if (!ps.hasAnyCode(def.detailCodes)) {
    return null
  }

  const viewCode = codeBySuffix(def.detailCodes, ':view')
  const editCode = codeBySuffix(def.detailCodes, ':edit')

  if (options.mode === 'edit' && editCode && ps.hasCode(editCode)) {
    return 'edit'
  }
  if (options.mode === 'view' && viewCode && ps.hasCode(viewCode)) {
    return 'view'
  }

  if (viewCode && ps.hasCode(viewCode)) return 'view'
  if (editCode && ps.hasCode(editCode)) return 'edit'
  return null
}

function buildFullPath(path: string, query: Record<string, string>): string {
  const qs = new URLSearchParams(query).toString()
  return qs ? `${path}?${qs}` : path
}

async function pushFullPath(fullPath: string): Promise<void> {
  const menuStore = useMenuStore()
  if (!menuStore.loaded) {
    menuStore.loadFromStorage()
  }

  const tabsStore = useTabsStore()
  const existing = tabsStore.findByPath(fullPath)
  const target = existing?.path ?? fullPath
  if (existing) {
    tabsStore.setActiveByKey(existing.key)
  }

  const current = router.currentRoute.value
  if (current.fullPath === target) {
    return
  }

  const qIndex = target.indexOf('?')
  if (qIndex === -1) {
    await router.push(target)
    return
  }

  const path = target.slice(0, qIndex)
  const query: Record<string, string> = {}
  new URLSearchParams(target.slice(qIndex + 1)).forEach((v, k) => {
    query[k] = v
  })
  await router.push({ path, query })
}

export async function openDoc(options: OpenDocOptions): Promise<boolean> {
  const def = getDocDefByType(options.docType)
  if (!def) {
    ElMessage.warning('未知单据类型')
    return false
  }

  const mode = resolveMode(options.docType, options)
  if (!mode) {
    ElMessage.warning('无权限访问该单据')
    return false
  }

  const idKey = def.idQueryKey ?? 'id'
  const query: Record<string, string> = { mode }
  if (mode !== 'create' && options.id != null && options.id !== '') {
    query[idKey] = String(options.id)
  }
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== '') {
        query[k] = String(v)
      }
    }
  }

  await pushFullPath(buildFullPath(def.path, query))
  return true
}

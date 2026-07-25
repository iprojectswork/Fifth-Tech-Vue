/**
 * G-tabs 页签状态（Pinia）
 *
 * 职责：只存业务页签状态，不含工作台。
 * 路由跳转由 useNavigation 编排；本 store 不 import router。
 *
 * 关键约定：
 * - list：同一菜单 path 全局最多一个 tab，title=菜单名
 * - doc：按业务主键多开（如多个用户详情），title=编码/名称
 * - 关当前 tab：先右邻后左邻，不强制跳回列表
 * - 关光最后一个 tab：回工作台；domainLastPath 不记已关详情 URL
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DomainId } from '@/utils/menu'

/** list=菜单列表页；doc=详情/表单等单据页 */
export type TabKind = 'list' | 'doc'

export interface Tab {
  /** 稳定唯一键，供页签 UI 与激活态使用（勿含 `/`） */
  key: string
  title: string
  /** 完整定位：列表一般为 path；详情含 query（如 ?id=） */
  path: string
  /** 所属一级业务域，切 tab 时驱动侧栏/顶栏高亮 */
  domainId: DomainId
  kind: TabKind
  /** 详情对应的列表菜单 path，用于侧栏高亮 */
  menuPath?: string
  docType?: string
  docId?: string
  closable: true
}

export interface OpenTabInput {
  key: string
  title: string
  path: string
  domainId: DomainId
  kind: TabKind
  menuPath?: string
  docType?: string
  docId?: string
}

export const useTabsStore = defineStore('tabs', () => {
  /** 全局业务页签（跨域都在一条里，不按域裁切） */
  const tabs = ref<Tab[]>([])
  /** 当前激活页签；null 表示工作台壳或尚未激活业务 tab */
  const activeTabKey = ref<string | null>(null)
  /**
   * 每域上次业务 path，用于顶栏再次进入该域时的落点。
   * 注意：关闭最后一个详情时会改记列表 path，避免再进域又钻回已关详情。
   */
  const domainLastPath = ref<Record<string, string>>({})
  /**
   * 关闭「当前」tab 的临界区标志。
   * 关当前 tab 时：Pinia 已删 tab，但 URL 尚短暂停留在旧页；
   * 若此时 syncRoute 按旧 URL openOrActivate，会把刚删的 tab 加回来。
   */
  const suppressRouteSync = ref(false)

  const activeTab = computed(() => {
    if (!activeTabKey.value) return null
    return tabs.value.find((t) => t.key === activeTabKey.value) ?? null
  })

  const activeDomainId = computed<DomainId | null>(() => activeTab.value?.domainId ?? null)

  function findByKey(key: string): Tab | undefined {
    return tabs.value.find((t) => t.key === key)
  }

  /**
   * 按 URL 查 tab。
   * - 先 exact fullPath（详情必须区分 ?id=1 / ?id=2）
   * - 仅 list 允许按 path 去 query 匹配（同一列表页一个 tab）
   */
  function findByPath(fullPath: string): Tab | undefined {
    const base = fullPath.split('?')[0]
    const exact = tabs.value.find((t) => t.path === fullPath)
    if (exact) return exact

    return tabs.value.find((t) => {
      if (t.kind !== 'list') return false
      return t.path === base || t.path.split('?')[0] === base
    })
  }

  function rememberDomainPath(domainId: DomainId, fullPath: string): void {
    domainLastPath.value = {
      ...domainLastPath.value,
      [String(domainId)]: fullPath
    }
  }

  function getDomainLastPath(domainId: DomainId): string | undefined {
    return domainLastPath.value[String(domainId)]
  }

  function clearDomainLastPath(domainId: DomainId): void {
    const next = { ...domainLastPath.value }
    delete next[String(domainId)]
    domainLastPath.value = next
  }

  function tabsInDomain(domainId: DomainId): Tab[] {
    return tabs.value.filter((t) => t.domainId === domainId)
  }

  /** 按 key 打开或激活；不负责 router.push */
  function openOrActivate(input: OpenTabInput): Tab {
    const existing = findByKey(input.key)
    if (existing) {
      const nextTabs = tabs.value.map((t) =>
        t.key === existing.key
          ? {
              ...t,
              title: input.title || t.title,
              path: input.path,
              menuPath: input.menuPath ?? t.menuPath
            }
          : t
      )
      tabs.value = nextTabs
      activeTabKey.value = existing.key
      rememberDomainPath(existing.domainId, input.path)
      return nextTabs.find((t) => t.key === existing.key)!
    }

    const tab: Tab = {
      key: input.key,
      title: input.title,
      path: input.path,
      domainId: input.domainId,
      kind: input.kind,
      menuPath: input.menuPath,
      docType: input.docType,
      docId: input.docId,
      closable: true
    }
    tabs.value = [...tabs.value, tab]
    activeTabKey.value = tab.key
    rememberDomainPath(tab.domainId, tab.path)
    return tab
  }

  function setActiveByKey(key: string): Tab | null {
    const tab = findByKey(key)
    if (!tab) return null
    activeTabKey.value = key
    rememberDomainPath(tab.domainId, tab.path)
    return tab
  }

  /**
   * 删除 tab，返回「接下来应激活」的 tab；一个不剩则返回 null（调用方回工作台）。
   * 关当前：先右邻 remaining[index]，再左邻 remaining[index-1]（浏览器习惯）。
   */
  function removeTab(key: string): Tab | null {
    const index = tabs.value.findIndex((t) => t.key === key)
    if (index < 0) {
      return activeTab.value
    }

    const closing = tabs.value[index]
    const wasActive = activeTabKey.value === key
    const remaining = tabs.value.filter((t) => t.key !== key)
    tabs.value = remaining

    if (remaining.length === 0) {
      activeTabKey.value = null
      // 最后一个 tab 关掉后，进域落点不要再用已关的详情 URL
      if (closing.kind === 'list') {
        rememberDomainPath(closing.domainId, closing.path)
      } else if (closing.menuPath) {
        rememberDomainPath(closing.domainId, closing.menuPath)
      } else {
        clearDomainLastPath(closing.domainId)
      }
      return null
    }

    if (!wasActive) {
      return remaining.find((t) => t.key === activeTabKey.value) ?? remaining[0]
    }

    const next = remaining[index] ?? remaining[index - 1] ?? remaining[0]
    activeTabKey.value = next.key
    rememberDomainPath(next.domainId, next.path)
    return next
  }

  function beginSuppressRouteSync(): void {
    suppressRouteSync.value = true
  }

  function endSuppressRouteSync(): void {
    suppressRouteSync.value = false
  }

  /** 登出 / 401：清空全部页签状态 */
  function clearAll(): void {
    tabs.value = []
    activeTabKey.value = null
    domainLastPath.value = {}
    suppressRouteSync.value = false
  }

  /** 回工作台壳：只取消激活，保留 tabs 内存（出域不丢现场） */
  function deactivateShell(): void {
    activeTabKey.value = null
  }

  return {
    tabs,
    activeTabKey,
    activeTab,
    activeDomainId,
    domainLastPath,
    suppressRouteSync,
    findByKey,
    findByPath,
    openOrActivate,
    setActiveByKey,
    rememberDomainPath,
    getDomainLastPath,
    clearDomainLastPath,
    tabsInDomain,
    removeTab,
    beginSuppressRouteSync,
    endSuppressRouteSync,
    clearAll,
    deactivateShell
  }
})

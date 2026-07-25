/**
 * 导航编排层（composable）
 *
 * 分层：
 * - Pinia tabs/menu：状态唯一来源
 * - 本文件：router 跳转 + 关 tab 时序 + URL→tab 同步
 *
 * 壳模式：
 * - 工作台：activeDomain=null，无侧栏/无页签条
 * - 域壳：有侧栏 + G-tabs；shellDomainId 来自当前激活 tab 的 domainId
 *
 * 契约：docs/B1-NAVIGATION.md
 */
import { computed } from 'vue'
import { useRoute, useRouter, type RouteLocationNormalizedLoaded } from 'vue-router'
import { WORKBENCH_PATH } from '@/constants/nav'
import { useMenuStore } from '@/store/menu'
import { useTabsStore, type OpenTabInput, type TabKind } from '@/store/tabs'
// RouteMeta 字段定义：types/router-meta.d.ts
import {
  findDomainById,
  getFirstLeafPath,
  getSidebarTree,
  isPathInDomain,
  resolveDomainIdByPath,
  type DomainId
} from '@/utils/menu'

function parseFullPath(fullPath: string): { path: string; query: Record<string, string> } {
  if (!fullPath.includes('?')) {
    return { path: fullPath, query: {} }
  }
  const [path, qs] = fullPath.split('?')
  const query: Record<string, string> = {}
  qs.split('&').forEach((pair) => {
    const [k, v] = pair.split('=')
    if (k) query[decodeURIComponent(k)] = decodeURIComponent(v ?? '')
  })
  return { path, query }
}

/**
 * 生成页签 key。
 * 不能含 `/`，否则部分 UI 组件会截断 name 导致激活态错乱。
 * 例：list__system_user_list、doc__user__3
 */
function safeTabKey(prefix: string, ...parts: string[]): string {
  const body = parts
    .map((p) => p.replace(/^\/+/, '').replace(/\/+/g, '_').replace(/[^\w.-]/g, '_'))
    .filter(Boolean)
    .join('__')
  return `${prefix}__${body}`
}

function queryValue(
  query: Record<string, string | string[] | undefined | null>,
  key: string
): string | undefined {
  const v = query[key]
  if (v == null) return undefined
  return Array.isArray(v) ? v[0] : String(v)
}

/**
 * 从 route.meta + query 组装页签数据。
 * 业务差异（标题字段、侧栏列表 path、新建标题）只读 meta，不写死 path 分支。
 * 后续后端菜单可映射为相同 meta 结构。
 */
function buildTabFromRoute(
  route: RouteLocationNormalizedLoaded,
  resolveDomain: (path: string, activeMenu?: string) => DomainId | null,
  getMenuName: (path: string) => string | undefined
): OpenTabInput | null {
  const path = route.path
  if (!path || path === WORKBENCH_PATH || path === '/login') return null

  const meta = route.meta
  const kind: TabKind = meta.kind ?? 'list'
  const activeMenu = meta.activeMenu || meta.menuPath
  const menuPathForDomain = activeMenu || (kind === 'list' ? path : undefined)
  const domainId = resolveDomain(path, menuPathForDomain)
  if (domainId == null) return null

  if (kind === 'list') {
    const title = getMenuName(path) || meta.title || '页面'
    return {
      key: safeTabKey('list', path),
      title,
      path,
      domainId,
      kind: 'list',
      menuPath: path
    }
  }

  // kind === 'doc'：字段全部来自 meta
  const idKey = meta.idQueryKey || 'id'
  const docId = queryValue(route.query, idKey) || 'new'
  const docType = meta.docType || 'doc'
  const titleKeys = meta.titleQueryKeys ?? []
  let titleFromQuery: string | undefined
  for (const key of titleKeys) {
    const v = queryValue(route.query, key)
    if (v) {
      titleFromQuery = v
      break
    }
  }

  let title: string
  if (titleFromQuery) {
    title = titleFromQuery
  } else if (docId === 'new') {
    title = meta.newTitle || meta.title || '新增'
  } else {
    title = String(docId)
  }

  // 侧栏高亮 / 关光详情后的 domainLastPath 回退：必须配置 activeMenu
  const listPath = activeMenu || path

  return {
    key: safeTabKey('doc', docType, String(docId)),
    title,
    path: route.fullPath,
    domainId,
    kind: 'doc',
    menuPath: listPath,
    docType,
    docId: String(docId)
  }
}

export function useNavigation() {
  const router = useRouter()
  const route = useRoute()
  const menuStore = useMenuStore()
  const tabsStore = useTabsStore()

  const isWorkbench = computed(() => route.path === WORKBENCH_PATH)

  /**
   * 当前壳所属域：
   * - 工作台路由 → null
   * - 有激活业务 tab → tab.domainId
   * - 否则按 path/meta 反查（深链首屏）
   */
  const shellDomainId = computed<DomainId | null>(() => {
    if (route.path === WORKBENCH_PATH) return null
    if (tabsStore.activeTabKey && tabsStore.activeTab) {
      return tabsStore.activeTab.domainId
    }
    return resolveDomainIdByPath(
      menuStore.flatMenus,
      menuStore.menuTree,
      route.path,
      route.meta.activeMenu || route.meta.menuPath
    )
  })

  const showSidebar = computed(() => shellDomainId.value != null)
  const showTabsBar = computed(() => shellDomainId.value != null && tabsStore.tabs.length > 0)

  const sidebarMenus = computed(() => getSidebarTree(menuStore.menuTree, shellDomainId.value))

  /** 侧栏高亮：详情优先 tab.menuPath / meta.activeMenu */
  const sidebarActivePath = computed(() => {
    const tab = tabsStore.activeTab
    if (tab?.menuPath) return tab.menuPath
    if (route.meta.activeMenu) return route.meta.activeMenu
    if (route.meta.menuPath) return route.meta.menuPath
    return route.path
  })

  function ensureMenusLoaded(): void {
    if (!menuStore.loaded) {
      menuStore.loadFromStorage()
    }
  }

  function resolveDomain(path: string, activeMenu?: string): DomainId | null {
    ensureMenusLoaded()
    return resolveDomainIdByPath(menuStore.flatMenus, menuStore.menuTree, path, activeMenu)
  }

  async function navigateFullPath(fullPath: string): Promise<void> {
    const { path, query } = parseFullPath(fullPath)
    if (
      route.fullPath === fullPath ||
      (route.path === path && JSON.stringify(route.query) === JSON.stringify(query))
    ) {
      return
    }
    await router.push(Object.keys(query).length ? { path, query } : path)
  }

  /** 顶栏「工作台」/ Logo：出域，tabs 内存保留 */
  async function goWorkbench(): Promise<void> {
    ensureMenusLoaded()
    tabsStore.deactivateShell()
    if (route.path !== WORKBENCH_PATH) {
      await router.push(WORKBENCH_PATH)
    }
  }

  function isDocLikePath(path: string): boolean {
    return path.includes('?') || path.includes('/form')
  }

  /**
   * 顶栏点一级域时的落点 URL。
   * 1) 域内仍有未关 tab → 回到这些 tab（优先 lastPath 精确匹配）
   * 2) lastPath 是列表 → 可用
   * 3) lastPath 是已关详情 → 忽略，用域首叶子（避免再进系统管理又打开李四）
   */
  function resolveDomainLanding(domainId: DomainId): string | null {
    ensureMenusLoaded()
    const domain = findDomainById(menuStore.menuTree, domainId)
    const firstLeaf = getFirstLeafPath(domain ?? undefined)

    const openInDomain = tabsStore.tabsInDomain(domainId)
    if (openInDomain.length > 0) {
      const last = tabsStore.getDomainLastPath(domainId)
      if (last) {
        const exact = openInDomain.find((t) => t.path === last)
        if (exact) return exact.path
      }
      return openInDomain[openInDomain.length - 1].path
    }

    const last = tabsStore.getDomainLastPath(domainId)
    if (last && !isDocLikePath(last)) {
      if (isPathInDomain(menuStore.flatMenus, menuStore.menuTree, domainId, last.split('?')[0])) {
        return last
      }
    }

    return firstLeaf
  }

  /** 顶栏点一级域；已在该域则 no-op */
  async function enterDomain(domainId: DomainId): Promise<void> {
    ensureMenusLoaded()
    if (shellDomainId.value === domainId && route.path !== WORKBENCH_PATH) {
      return
    }
    const landing = resolveDomainLanding(domainId)
    if (!landing) return
    await openPath(landing)
  }

  /** 侧栏/快捷入口：有已开 tab 则激活，否则只 push（由 syncRoute 建 tab） */
  async function openPath(fullPathOrPath: string): Promise<void> {
    ensureMenusLoaded()
    const fullPath = fullPathOrPath.startsWith('/') ? fullPathOrPath : `/${fullPathOrPath}`
    const pathOnly = fullPath.split('?')[0]

    if (pathOnly === WORKBENCH_PATH) {
      await goWorkbench()
      return
    }

    const byPath = tabsStore.findByPath(fullPath)
    if (byPath) {
      tabsStore.setActiveByKey(byPath.key)
      await navigateFullPath(byPath.path)
      return
    }

    await navigateFullPath(fullPath)
  }

  async function activateTabKey(key: string): Promise<void> {
    const tab = tabsStore.setActiveByKey(key)
    if (tab) {
      await navigateFullPath(tab.path)
    }
  }

  /**
   * 关闭指定页签（页签条 ×）。
   * 关当前 tab 时必须 suppressRouteSync，否则 URL 未变时 sync 会重建 tab。
   * 跳转判断只用 fullPath 全等（不能用 path 去 query，否则同 form 不同 id 会误判）。
   */
  async function closeTabKey(key: string): Promise<void> {
    if (!tabsStore.findByKey(key)) return

    const closingActive = tabsStore.activeTabKey === key
    tabsStore.beginSuppressRouteSync()
    try {
      const next = tabsStore.removeTab(key)

      if (!next) {
        await goWorkbench()
        return
      }

      if (!closingActive) {
        return
      }

      if (route.fullPath === next.path) {
        tabsStore.setActiveByKey(next.key)
        return
      }

      await navigateFullPath(next.path)
      tabsStore.setActiveByKey(next.key)
    } finally {
      tabsStore.endSuppressRouteSync()
    }
  }

  /**
   * 表单页「关闭/返回/保存成功」用：关掉当前路由对应 tab。
   * 不要只 router.push 列表，否则页签残留。
   */
  async function closeCurrentTab(fallbackPath?: string): Promise<void> {
    const tab =
      tabsStore.findByPath(route.fullPath) ||
      (tabsStore.activeTabKey ? tabsStore.findByKey(tabsStore.activeTabKey) : undefined)
    if (tab) {
      await closeTabKey(tab.key)
      return
    }
    if (fallbackPath) {
      await openPath(fallbackPath)
    } else {
      await goWorkbench()
    }
  }

  /**
   * URL → Pinia 同步（Layout watch fullPath / onMounted）。
   * - 已有 tab：只激活
   * - suppress 中：禁止新建（关当前 tab 竞态保护）
   * - 否则 openOrActivate 新建
   */
  function syncRoute(r: RouteLocationNormalizedLoaded = route): void {
    ensureMenusLoaded()
    if (r.path === WORKBENCH_PATH || r.path === '/login') {
      tabsStore.deactivateShell()
      return
    }

    const existing = tabsStore.findByPath(r.fullPath)
    if (existing) {
      tabsStore.setActiveByKey(existing.key)
      return
    }

    if (tabsStore.suppressRouteSync) {
      return
    }

    const input = buildTabFromRoute(r, resolveDomain, (p) => menuStore.getMenuNameByPath(p))
    if (!input) return
    tabsStore.openOrActivate(input)
  }

  async function openOrActivateTab(input: OpenTabInput): Promise<void> {
    const tab = tabsStore.openOrActivate(input)
    await navigateFullPath(tab.path)
  }

  function clearSessionNav(): void {
    tabsStore.clearAll()
    menuStore.clear()
  }

  return {
    WORKBENCH_PATH,
    isWorkbench,
    shellDomainId,
    showSidebar,
    showTabsBar,
    sidebarMenus,
    sidebarActivePath,
    ensureMenusLoaded,
    goWorkbench,
    enterDomain,
    openPath,
    activateTabKey,
    closeTabKey,
    closeCurrentTab,
    syncRoute,
    openOrActivateTab,
    clearSessionNav,
    tabsStore,
    menuStore
  }
}

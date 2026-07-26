/**
 * 权限与动态路由状态（B2）
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationNormalized, Router } from 'vue-router'
import { getMenus, getUserInfo, type MenuItem, type UserInfo } from '@/api/auth'
import { useMenuStore } from '@/store/menu'
import { generateRoutes } from '@/router/routes/generate'
import {
  getDocDefByPath,
  getDocDefByType,
  type DocMode,
  type DocRouteDef
} from '@/router/routes/doc-registry'
import { LAYOUT_ROUTE_NAME } from '@/router/routes/static'
import { resetDynamicRoutes, trackDynamicRouteName } from '@/router/reset'

let routerInstance: Router | null = null

export function bindPermissionRouter(router: Router): void {
  routerInstance = router
}

function requireRouter(): Router {
  if (!routerInstance) {
    throw new Error('permission router not bound')
  }
  return routerInstance
}

function intersects(owned: readonly string[], need: readonly string[]): boolean {
  const set = new Set(owned)
  return need.some((c) => set.has(c))
}

function codeBySuffix(codes: readonly string[], suffix: string): string | undefined {
  return codes.find((c) => c.endsWith(suffix))
}

function queryOne(
  query: RouteLocationNormalized['query'],
  key: string
): string | undefined {
  const raw = query[key]
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw)) return raw[0]
  return undefined
}

function parseMode(raw: string | undefined): DocMode | undefined {
  if (raw === 'create' || raw === 'edit' || raw === 'view') return raw
  return undefined
}

export const usePermissionStore = defineStore('permission', () => {
  const routesLoaded = ref(false)
  const permissionCodes = ref<string[]>([])
  const userInfo = ref<UserInfo | null>(null)

  let bootstrapPromise: Promise<void> | null = null

  function hasCode(code: string): boolean {
    return permissionCodes.value.includes(code)
  }

  function hasAnyCode(codes: readonly string[]): boolean {
    return intersects(permissionCodes.value, codes)
  }

  function canOpenDocWithDef(
    def: DocRouteDef,
    options?: { readonly id?: string | number | null; readonly mode?: DocMode }
  ): boolean {
    const mode = options?.mode
    const id = options?.id
    const hasId = id !== undefined && id !== null && id !== ''
    const isCreate = mode === 'create' || (!hasId && mode !== 'edit' && mode !== 'view')

    if (isCreate) {
      return hasAnyCode(def.createCodes)
    }

    const viewCode = codeBySuffix(def.detailCodes, ':view')
    const editCode = codeBySuffix(def.detailCodes, ':edit')

    if (mode === 'edit') {
      return Boolean(editCode && hasCode(editCode))
    }
    if (mode === 'view') {
      return Boolean(
        (viewCode && hasCode(viewCode)) || (editCode && hasCode(editCode))
      )
    }
    return hasAnyCode(def.detailCodes)
  }

  function canOpenDoc(
    docType: string,
    options?: { readonly id?: string | number | null; readonly mode?: DocMode }
  ): boolean {
    const def = getDocDefByType(docType)
    if (!def) return false
    return canOpenDocWithDef(def, options)
  }

  function canAccessRoute(to: RouteLocationNormalized): boolean {
    const path = to.path
    if (
      path === '/login' ||
      path === '/dashboard' ||
      path === '/403' ||
      path === '/404' ||
      path === '/'
    ) {
      return true
    }

    const doc = getDocDefByPath(path)
    if (doc) {
      const idKey = doc.idQueryKey ?? 'id'
      const id = queryOne(to.query, idKey)
      const mode = parseMode(queryOne(to.query, 'mode'))
      return canOpenDocWithDef(doc, { id, mode })
    }

    return to.matched.some((r) => {
      const code = r.meta.permissionCode
      if (typeof code === 'string' && code.length > 0) {
        return hasCode(code)
      }
      return false
    })
  }

  function applyDynamicRoutes(menus: MenuItem[], codes: readonly string[]): void {
    const router = requireRouter()
    resetDynamicRoutes(router)
    const dyn = generateRoutes(menus, codes)
    for (const r of dyn) {
      const name = typeof r.name === 'string' ? r.name : String(r.name ?? '')
      if (!name) continue
      if (router.hasRoute(name)) {
        router.removeRoute(name)
      }
      router.addRoute(LAYOUT_ROUTE_NAME, r)
      trackDynamicRouteName(name)
    }
  }

  async function bootstrap(): Promise<void> {
    if (routesLoaded.value) return
    if (bootstrapPromise) return bootstrapPromise

    bootstrapPromise = (async () => {
      const menuStore = useMenuStore()

      const userRes = await getUserInfo()
      if (userRes.code !== 200 || !userRes.data) {
        throw new Error(userRes.message || '获取用户信息失败')
      }
      userInfo.value = userRes.data
      permissionCodes.value = userRes.data.permissions ?? []
      localStorage.setItem('userInfo', JSON.stringify(userRes.data))

      const menusRes = await getMenus()
      if (menusRes.code !== 200) {
        throw new Error(menusRes.message || '获取菜单失败')
      }
      const menus = menusRes.data ?? []
      localStorage.setItem('menus', JSON.stringify(menus))
      menuStore.setMenus(menus)

      applyDynamicRoutes(menus, permissionCodes.value)
      routesLoaded.value = true
    })()

    try {
      await bootstrapPromise
    } finally {
      bootstrapPromise = null
    }
  }

  function reset(): void {
    if (routerInstance) {
      resetDynamicRoutes(routerInstance)
    }
    routesLoaded.value = false
    permissionCodes.value = []
    userInfo.value = null
    bootstrapPromise = null
  }

  return {
    routesLoaded,
    permissionCodes,
    userInfo,
    hasCode,
    hasAnyCode,
    canOpenDoc,
    canAccessRoute,
    bootstrap,
    reset
  }
})

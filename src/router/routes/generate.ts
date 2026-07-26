/**
 * menus → 列表路由；doc-registry × permissionCodes → 单据路由（拍平）
 */
import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem } from '@/api/auth'
import { resolveView } from '@/utils/resolve-view'
import { routeEnhancers } from './enhancers'
import { docRouteRegistry, isDocPath } from './doc-registry'

const MENU_TYPE = 1
const BUTTON_TYPE = 2

function normalizeRoutePath(path: string): string {
  if (!path) return path
  return path.startsWith('/') ? path : `/${path}`
}

function hasAny(codes: readonly string[], required: readonly string[]): boolean {
  const set = new Set(codes)
  return required.some((c) => set.has(c))
}

function walkMenus(nodes: readonly MenuItem[], out: RouteRecordRaw[]): void {
  for (const n of nodes) {
    if (n.permissionType === BUTTON_TYPE) continue

    const path = n.path ? normalizeRoutePath(n.path) : ''
    const component = (n.component || '').trim()

    if (
      n.permissionType === MENU_TYPE &&
      path &&
      component &&
      !isDocPath(path)
    ) {
      const loader = resolveView(normalizeComponentKey(component))
      if (!loader) {
        console.warn(`[generateRoutes] unknown list component: ${component}`)
      } else {
        const enhancer = routeEnhancers[n.permissionCode] ?? {}
        out.push({
          path,
          name: n.permissionCode,
          component: loader,
          meta: {
            title: n.permissionName,
            permissionCode: n.permissionCode,
            menuPath: path,
            kind: 'list',
            ...enhancer
          }
        })
      }
    }

    if (n.children?.length) {
      walkMenus(n.children, out)
    }
  }
}

/** 兼容历史灌数 views/user/list → user/list */
function normalizeComponentKey(component: string): string {
  return component
    .replace(/^\/+/, '')
    .replace(/^views\//, '')
    .replace(/\.vue$/i, '')
}

function buildDocRoutes(permissionCodes: readonly string[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  for (const def of Object.values(docRouteRegistry)) {
    if (!hasAny(permissionCodes, def.routeCodes)) continue
    const loader = resolveView(def.component)
    if (!loader) {
      console.warn(`[generateRoutes] unknown doc component: ${def.component}`)
      continue
    }
    routes.push({
      path: def.path,
      name: `doc:${def.docType}`,
      component: loader,
      meta: {
        title: def.permissionName ?? def.docType,
        kind: 'doc',
        docType: def.docType,
        activeMenu: def.activeMenu,
        menuPath: def.activeMenu,
        titleQueryKeys: def.titleQueryKeys ? [...def.titleQueryKeys] : undefined,
        newTitle: def.newTitle,
        idQueryKey: def.idQueryKey ?? 'id',
        detailCodes: [...def.detailCodes],
        createCodes: [...def.createCodes]
      }
    })
  }
  return routes
}

export function generateRoutes(
  menus: readonly MenuItem[],
  permissionCodes: readonly string[]
): RouteRecordRaw[] {
  const listRoutes: RouteRecordRaw[] = []
  walkMenus(menus, listRoutes)
  return [...listRoutes, ...buildDocRoutes(permissionCodes)]
}

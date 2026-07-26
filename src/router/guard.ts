import type { Router } from 'vue-router'
import { WORKBENCH_PATH } from '@/constants/nav'
import { usePermissionStore } from '@/store/permission'
import { clearAuthSession } from '@/utils/auth-session'

const WHITE_LIST = new Set(['/login'])

function isLayoutShellOnly(to: { matched: readonly { name?: string | symbol | null }[] }): boolean {
  // 仅匹配到 Layout、没有具体业务/静态子页
  return (
    to.matched.length === 1 &&
    to.matched[0]?.name === 'Layout'
  )
}

export function setupRouterGuard(router: Router): void {
  router.beforeEach(async (to, _from, next) => {
    const token = localStorage.getItem('token')

    if (!token) {
      if (WHITE_LIST.has(to.path)) {
        next()
        return
      }
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }

    if (to.path === '/login') {
      next(WORKBENCH_PATH)
      return
    }

    const ps = usePermissionStore()

    if (!ps.routesLoaded) {
      try {
        await ps.bootstrap()
      } catch {
        clearAuthSession()
        next('/login')
        return
      }
      // 禁止 next({ ...to })：会带上刷新前错误匹配的 name（如旧 CatchAll）
      next({
        path: to.path,
        query: to.query,
        hash: to.hash,
        replace: true
      })
      return
    }

    if (to.matched.length === 0 || isLayoutShellOnly(to)) {
      if (to.path !== '/404') {
        next({ path: '/404', replace: true })
        return
      }
    }

    if (to.path !== '/404' && to.path !== '/403' && !ps.canAccessRoute(to)) {
      next({ path: '/403', replace: true })
      return
    }

    next()
  })
}

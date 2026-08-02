/**
 * 列表菜单 permissionCode → RouteMeta 补丁
 */
import type { RouteMeta } from 'vue-router'

export const routeEnhancers: Readonly<Record<string, Partial<RouteMeta>>> = {
  'system:user:list': { kind: 'list' },
  'system:role:list': { kind: 'list' },
  'system:permission:list': { kind: 'list' },
  'system:cache:list': { kind: 'list' }
}

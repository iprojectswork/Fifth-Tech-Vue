/**
 * 清本地会话 + Pinia 导航/权限 + 动态路由
 */
import { useTabsStore } from '@/store/tabs'
import { useMenuStore } from '@/store/menu'
import { usePermissionStore } from '@/store/permission'

export function clearAuthSession(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('menus')
  useTabsStore().clearAll()
  useMenuStore().clear()
  usePermissionStore().reset()
}

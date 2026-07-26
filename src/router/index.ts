/**
 * 路由入口：静态底座 + guard（业务路由动态 addRoute，见 B2）
 */
import { createRouter, createWebHistory } from 'vue-router'
import { staticRoutes } from './routes/static'
import { setupRouterGuard } from './guard'
import { bindPermissionRouter } from '@/store/permission'

const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes
})

bindPermissionRouter(router)
setupRouterGuard(router)

export default router

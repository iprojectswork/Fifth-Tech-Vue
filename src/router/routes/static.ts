/**
 * 静态底座：login / Layout / 工作台 / 403 / 404
 * 不设全局 CatchAll（会在动态路由注册前把业务 path 重定向成 404）。
 * 未匹配路径由 guard 在 routesLoaded 后跳转 /404。
 */
import type { RouteRecordRaw } from 'vue-router'
import { WORKBENCH_PATH } from '@/constants/nav'

export const LAYOUT_ROUTE_NAME = 'Layout' as const

export const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    name: LAYOUT_ROUTE_NAME,
    component: () => import('@/layout/Layout.vue'),
    redirect: WORKBENCH_PATH,
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台' }
      },
      {
        path: '403',
        name: 'Forbidden',
        component: () => import('@/views/error/Forbidden.vue'),
        meta: { title: '无权限' }
      },
      {
        path: '404',
        name: 'NotFound',
        component: () => import('@/views/error/NotFound.vue'),
        meta: { title: '未找到' }
      }
    ]
  }
]

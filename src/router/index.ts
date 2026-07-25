/**
 * 路由表
 *
 * 页签/侧栏相关一律写在 meta，禁止在 useNavigation 里按 path 硬编码业务名。
 * 后续后端菜单可映射为同名字段注入动态路由。
 *
 * meta 字段见 types/router-meta.d.ts
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { WORKBENCH_PATH } from '@/constants/nav'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    name: 'Layout',
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
        path: 'system',
        name: 'System',
        component: () => import('@/views/system/SystemHome.vue'),
        meta: { title: '系统管理', kind: 'list' }
      },
      {
        path: 'system/user/list',
        name: 'UserList',
        component: () => import('@/views/user/list.vue'),
        meta: { title: '用户管理', kind: 'list' }
      },
      {
        path: 'system/user/form',
        name: 'UserForm',
        component: () => import('@/views/user/form.vue'),
        meta: {
          title: '用户表单',
          kind: 'doc',
          docType: 'user',
          activeMenu: '/system/user/list',
          titleQueryKeys: ['username', 'nickname'],
          newTitle: '新增用户',
          idQueryKey: 'id'
        }
      },
      {
        path: 'system/role/list',
        name: 'RoleList',
        component: () => import('@/views/system/role/list.vue'),
        meta: { title: '角色管理', kind: 'list' }
      },
      {
        path: 'system/role/form',
        name: 'RoleForm',
        component: () => import('@/views/system/role/form.vue'),
        meta: {
          title: '角色表单',
          kind: 'doc',
          docType: 'role',
          activeMenu: '/system/role/list',
          titleQueryKeys: ['name', 'roleName'],
          newTitle: '新增角色',
          idQueryKey: 'id'
        }
      },
      {
        path: 'system/permission/list',
        name: 'PermissionList',
        component: () => import('@/views/system/permission/list.vue'),
        meta: { title: '权限管理', kind: 'list' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router

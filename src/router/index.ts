import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

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
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'system',
        name: 'System',
        component: () => import('@/views/system/SystemHome.vue'),
        meta: { title: '系统管理' }
      },
      {
        path: 'system/user/list',
        name: 'UserList',
        component: () => import('@/views/user/list.vue'),
        meta: { title: '用户列表' }
      },
      {
        path: 'system/user/form',
        name: 'UserForm',
        component: () => import('@/views/user/form.vue'),
        meta: { title: '用户表单' }
      },
      {
        path: 'system/role/list',
        name: 'RoleList',
        component: () => import('@/views/system/role/list.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: 'system/role/form',
        name: 'RoleForm',
        component: () => import('@/views/system/role/form.vue'),
        meta: { title: '角色表单' }
      },
      {
        path: 'system/permission/list',
        name: 'PermissionList',
        component: () => import('@/views/system/permission/list.vue'),
        meta: { title: '权限管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router

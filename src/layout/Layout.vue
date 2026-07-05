<template>
  <el-container class="layout-container">
    <el-header>
      <div class="header-content">
        <div class="logo">Vue Demo</div>
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          @select="handleMenuSelect"
          class="top-menu"
        >
          <el-menu-item v-for="menu in topMenus" :key="menu.id" :index="String(menu.id)">
            {{ menu.permissionName }}
          </el-menu-item>
        </el-menu>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <el-icon><User /></el-icon>
              {{ username }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    <el-container>
      <el-aside v-if="currentSidebarMenus.length > 0" width="200px">
        <el-menu
          :default-active="sidebarActiveMenu"
          @select="handleSidebarSelect"
          class="sidebar-menu"
        >
          <el-menu-item v-for="menu in currentSidebarMenus" :key="menu.id" :index="menu.path">
            {{ menu.permissionName }}
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container class="content-container">
        <TabsView />
        <el-main>
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" :key="$route.fullPath" />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, ArrowDown } from '@element-plus/icons-vue'
import { useTabsStore } from '@/store/tabs'
import { logout } from '@/api/auth'
import TabsView from '@/components/TabsView.vue'
import type { MenuItem } from '@/api/auth'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

const menuTree = ref<MenuItem[]>([])
const flatMenus = ref<MenuItem[]>([])
const username = ref('管理员')

const flattenMenus = (menus: MenuItem[], parentId: number = 0): MenuItem[] => {
  const result: MenuItem[] = []
  menus.forEach(menu => {
    const flatMenu: MenuItem = { ...menu, parentId, children: undefined }
    result.push(flatMenu)
    if (menu.children && menu.children.length > 0) {
      result.push(...flattenMenus(menu.children, menu.id))
    }
  })
  return result
}

onMounted(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    const userInfo = JSON.parse(userInfoStr)
    username.value = userInfo.nickname || userInfo.username || '管理员'
  }
  
  const menusStr = localStorage.getItem('menus')
  if (menusStr) {
    menuTree.value = JSON.parse(menusStr)
    flatMenus.value = flattenMenus(menuTree.value)
  }
})

const topMenus = computed(() => {
  return menuTree.value
})

const currentSidebarMenus = computed(() => {
  const path = route.path
  const currentMenu = flatMenus.value.find(menu => menu.path === path)
  if (currentMenu && currentMenu.parentId !== 0) {
    return flatMenus.value.filter(menu => menu.parentId === currentMenu.parentId)
  }
  return []
})

const activeMenu = computed(() => {
  const path = route.path
  const currentMenu = flatMenus.value.find(menu => menu.path === path)
  if (currentMenu) {
    return String(currentMenu.parentId)
  }
  return ''
})

const sidebarActiveMenu = computed(() => {
  return route.path
})

const handleMenuSelect = (index: string) => {
  const menuId = parseInt(index)
  const topMenu = menuTree.value.find(m => m.id === menuId)
  if (topMenu && topMenu.children && topMenu.children.length > 0) {
    router.push(topMenu.children[0].path)
  }
}

const handleSidebarSelect = (index: string) => {
  router.push(index)
}

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await logout()
    } catch (e) {
    }
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('menus')
    ElMessage.success('退出登录成功')
    router.push('/login')
  }
}

const getTabTitle = (path: string, query: Record<string, string>): string => {
  if (path === '/system/user/form') {
    if (query.id) {
      return query.username || '编辑用户'
    }
    return '新增用户'
  }
  if (path === '/system/role/form') {
    if (query.id) {
      return query.name || '编辑角色'
    }
    return '新增角色'
  }
  if (path === '/system/permission/form') {
    if (query.id) {
      return query.name || '编辑权限'
    }
    return '新增权限'
  }
  const menu = flatMenus.value.find(m => m.path === path)
  return menu?.permissionName || '页面'
}

watch(() => route, (newRoute) => {
  const path = newRoute.path
  const query = newRoute.query as Record<string, string>
  const fullPath = newRoute.fullPath
  
  const existingTab = tabsStore.tabs.find(t => t.path === fullPath)
  if (!existingTab) {
    const title = getTabTitle(path, query)
    tabsStore.addTab({
      title,
      path: fullPath,
      closable: path !== '/dashboard'
    })
  } else {
    tabsStore.setActiveTab(fullPath)
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.el-header {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding: 0;
  box-shadow: var(--shadow-sm);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: var(--primary);
}

.el-menu {
  flex: 1;
  border-bottom: none;
  margin: 0 20px;
}

.top-menu {
  background-color: var(--bg-primary) !important;
}

.top-menu .el-menu-item {
  color: var(--text-secondary);
}

.top-menu .el-menu-item:hover {
  background-color: var(--bg-secondary) !important;
  color: var(--primary);
}

.top-menu .el-menu-item.is-active {
  background-color: var(--primary-lighter) !important;
  color: var(--primary);
  border-bottom: 2px solid var(--primary);
}

.user-info {
  color: var(--text-secondary);
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
}

.el-dropdown-link:hover {
  color: var(--primary);
}

.el-aside {
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border);
}

.el-aside .el-menu {
  border-right: none;
  margin: 0;
  background-color: var(--bg-secondary) !important;
}

.sidebar-menu .el-menu-item {
  color: var(--text-secondary);
}

.sidebar-menu .el-menu-item:hover {
  background-color: var(--bg-tertiary) !important;
  color: var(--primary);
}

.sidebar-menu .el-menu-item.is-active {
  background-color: var(--primary-lighter) !important;
  color: var(--primary);
}

.content-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.el-main {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background-color: var(--bg-secondary);
}
</style>

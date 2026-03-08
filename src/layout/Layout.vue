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
          <el-menu-item index="/system">系统管理</el-menu-item>
        </el-menu>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <el-icon><User /></el-icon>
              管理员
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
      <el-aside v-if="showSidebar" width="200px">
        <el-menu
          :default-active="sidebarActiveMenu"
          @select="handleSidebarSelect"
          class="sidebar-menu"
        >
          <el-menu-item index="/system/user/list">用户管理</el-menu-item>
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
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, ArrowDown } from '@element-plus/icons-vue'
import { useTabsStore } from '@/store/tabs'
import TabsView from '@/components/TabsView.vue'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

const activeMenu = computed(() => route.path)
const showSidebar = computed(() => route.path.startsWith('/system'))
const sidebarActiveMenu = computed(() => {
  if (route.path.startsWith('/system/user')) {
    return route.path
  }
  return ''
})

const handleMenuSelect = (index: string) => {
  if (index === '/system') {
    tabsStore.addTab({ title: '系统管理', path: '/system', closable: true })
    router.push('/system')
  }
}

const handleSidebarSelect = (index: string) => {
  const titleMap: Record<string, string> = {
    '/system/user/list': '用户列表'
  }
  const title = titleMap[index] || '未知页面'
  tabsStore.addTab({ title, path: index, closable: true })
  router.push(index)
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    ElMessage.success('退出登录成功')
    router.push('/login')
  }
}

watch(() => route.fullPath, (fullPath) => {
  const path = route.path
  const titleMap: Record<string, string> = {
    '/dashboard': '首页',
    '/system': '系统管理',
    '/system/user/list': '用户列表'
  }
  
  let title = titleMap[path]
  if (!title) {
    if (path === '/system/user/form') {
      if (route.query.id) {
        title = route.query.username as string || '编辑用户'
      } else {
        title = '新增用户'
      }
    } else {
      title = '未知页面'
    }
  }
  
  const existingTab = tabsStore.tabs.find(t => t.path === fullPath)
  
  if (!existingTab) {
    tabsStore.addTab({
      title,
      path: fullPath,
      closable: path !== '/dashboard'
    })
  } else {
    tabsStore.setActiveTab(fullPath)
  }
}, { immediate: true })
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

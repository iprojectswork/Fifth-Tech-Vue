<!--
  B1 主布局：工作台壳 / 域壳
  - 顶栏：Logo、工作台、一级域、更多、用户
  - 域壳才显示侧栏 + TabsView
  - 内容 keep-alive key = route.fullPath（跟 URL，不跟 activeTabKey，避免关 tab 时内容抢先切换）
  逻辑见 composables/useNavigation.ts；契约 docs/B1-NAVIGATION.md
-->
<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <div class="header-content">
        <!-- Logo / 工作台：出域回门户 -->
        <div class="logo" @click="onWorkbench">Vue Demo</div>

        <nav class="top-nav">
          <button
            type="button"
            class="nav-item"
            :class="{ active: isWorkbench }"
            @click="onWorkbench"
          >
            工作台
          </button>

          <!-- 一级域平铺（前 TOP_NAV_VISIBLE_COUNT 个） -->
          <button
            v-for="domain in visibleDomains"
            :key="domain.id"
            type="button"
            class="nav-item"
            :class="{ active: shellDomainId === domain.id }"
            @click="onEnterDomain(domain.id)"
          >
            {{ domain.permissionName }}
          </button>

          <!-- 溢出一级：hover 延迟展开 + click 立即 toggle -->
          <div
            v-if="moreDomains.length > 0"
            ref="moreWrapRef"
            class="nav-more-wrap"
            @mouseenter="onMoreEnter"
            @mouseleave="onMoreLeave"
          >
            <button
              type="button"
              class="nav-item nav-more-trigger"
              :class="{ active: moreContainsActive, open: moreOpen }"
              @click.stop="onMoreClick"
            >
              更多
              <el-icon class="more-arrow"><ArrowDown /></el-icon>
            </button>
            <div
              v-show="moreOpen"
              class="more-dropdown"
              @mouseenter="onMorePanelEnter"
              @mouseleave="onMoreLeave"
            >
              <button
                v-for="domain in moreDomains"
                :key="domain.id"
                type="button"
                class="more-item"
                :class="{ active: shellDomainId === domain.id }"
                @click="onMoreSelect(domain.id)"
              >
                {{ domain.permissionName }}
              </button>
            </div>
          </div>
        </nav>

        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <el-icon><User /></el-icon>
              {{ username }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
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

    <el-container class="body-container">
      <!-- 仅域壳显示侧栏；key 只用 domainId，避免切 tab 时整树重挂载丢折叠态 -->
      <el-aside v-if="showSidebar" width="200px" class="layout-aside">
        <el-menu
          :key="String(shellDomainId ?? 'none')"
          :default-active="sidebarActivePath"
          class="sidebar-menu"
          @select="onSidebarSelect"
        >
          <SidebarMenuNodes :menus="sidebarMenus" />
        </el-menu>
      </el-aside>

      <el-container class="content-container">
        <TabsView v-if="showTabsBar" />
        <el-main>
          <router-view v-slot="{ Component }">
            <keep-alive :max="30">
              <component
                :is="Component"
                v-if="Component"
                :key="route.fullPath"
              />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, ArrowDown } from '@element-plus/icons-vue'
import { logout } from '@/api/auth'
import TabsView from '@/components/TabsView.vue'
import SidebarMenuNodes from '@/components/SidebarMenuNodes.vue'
import { useNavigation } from '@/composables/useNavigation'
import {
  TOP_NAV_VISIBLE_COUNT,
  MORE_OPEN_DELAY,
  MORE_CLOSE_DELAY
} from '@/constants/nav'
import type { DomainId } from '@/utils/menu'

const route = useRoute()
const username = ref('管理员')

const {
  isWorkbench,
  shellDomainId,
  showSidebar,
  showTabsBar,
  sidebarMenus,
  sidebarActivePath,
  ensureMenusLoaded,
  goWorkbench,
  enterDomain,
  openPath,
  syncRoute,
  clearSessionNav,
  menuStore
} = useNavigation()

// —— 「更多」下拉：延迟 hover + click ——
const moreOpen = ref(false)
const moreWrapRef = ref<HTMLElement | null>(null)
let openTimer: ReturnType<typeof setTimeout> | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null

const visibleDomains = computed(() => menuStore.topDomains.slice(0, TOP_NAV_VISIBLE_COUNT))
const moreDomains = computed(() => menuStore.topDomains.slice(TOP_NAV_VISIBLE_COUNT))
const moreContainsActive = computed(() => {
  const id = shellDomainId.value
  if (id == null) return false
  return moreDomains.value.some((d) => d.id === id)
})

function clearOpenTimer() {
  if (openTimer) {
    clearTimeout(openTimer)
    openTimer = null
  }
}

function clearCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function onMoreEnter() {
  clearCloseTimer()
  clearOpenTimer()
  openTimer = setTimeout(() => {
    moreOpen.value = true
  }, MORE_OPEN_DELAY)
}

function onMorePanelEnter() {
  clearCloseTimer()
  clearOpenTimer()
  moreOpen.value = true
}

function onMoreLeave() {
  clearOpenTimer()
  clearCloseTimer()
  closeTimer = setTimeout(() => {
    moreOpen.value = false
  }, MORE_CLOSE_DELAY)
}

function onMoreClick() {
  clearOpenTimer()
  clearCloseTimer()
  moreOpen.value = !moreOpen.value
}

async function onMoreSelect(domainId: DomainId) {
  moreOpen.value = false
  await enterDomain(domainId)
}

function onDocClick(e: MouseEvent) {
  if (!moreOpen.value) return
  const el = moreWrapRef.value
  if (el && e.target instanceof Node && !el.contains(e.target)) {
    moreOpen.value = false
  }
}

function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') moreOpen.value = false
}

onMounted(() => {
  ensureMenusLoaded()
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      username.value = userInfo.nickname || userInfo.username || '管理员'
    } catch {
      // ignore bad JSON
    }
  }
  // 深链/刷新：按当前 URL 建/激活 tab
  syncRoute(route)
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onEsc)
})

onUnmounted(() => {
  clearOpenTimer()
  clearCloseTimer()
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onEsc)
})

// 路由变化 → 同步 Pinia 页签（侧栏点菜单、页签切换、浏览器前进后退）
watch(
  () => route.fullPath,
  () => {
    syncRoute(route)
  }
)

async function onWorkbench() {
  await goWorkbench()
}

async function onEnterDomain(domainId: DomainId) {
  await enterDomain(domainId)
}

async function onSidebarSelect(index: string) {
  if (!index) return
  await openPath(index)
}

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await logout()
    } catch {
      // 登出接口失败仍清本地会话
    }
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('menus')
    clearSessionNav()
    ElMessage.success('退出登录成功')
    const { default: router } = await import('@/router')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.layout-header {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding: 0;
  box-shadow: var(--shadow-sm);
  height: 56px;
  z-index: 20;
}

.header-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 20px;
  gap: 8px;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary);
  cursor: pointer;
  flex-shrink: 0;
  margin-right: 12px;
  user-select: none;
}

.logo:hover {
  opacity: 0.85;
}

.top-nav {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 4px;
  overflow: visible;
}

.nav-item {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0 14px;
  height: 56px;
  line-height: 56px;
  font-size: 14px;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color 0.2s, background-color 0.2s, border-color 0.2s;
}

.nav-item:hover {
  color: var(--primary);
  background-color: var(--bg-secondary);
}

.nav-item.active {
  color: var(--primary);
  background-color: var(--primary-lighter);
  border-bottom-color: var(--primary);
}

.nav-more-wrap {
  position: relative;
}

.nav-more-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.more-arrow {
  font-size: 12px;
}

.more-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: var(--shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.08));
  padding: 6px 0;
  z-index: 100;
}

.more-item {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 10px 16px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}

.more-item:hover {
  background: var(--bg-secondary);
  color: var(--primary);
}

.more-item.active {
  color: var(--primary);
  background: var(--primary-lighter);
}

.user-info {
  color: var(--text-secondary);
  flex-shrink: 0;
  margin-left: auto;
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

.body-container {
  flex: 1;
  min-height: 0;
  height: calc(100vh - 56px);
}

.layout-aside {
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border);
  overflow-y: auto;
}

.sidebar-menu {
  border-right: none;
  background-color: var(--bg-secondary) !important;
  height: 100%;
}

.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  color: var(--text-secondary);
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: var(--bg-tertiary) !important;
  color: var(--primary);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: var(--primary-lighter) !important;
  color: var(--primary);
}

.content-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.el-main {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background-color: var(--bg-secondary);
}
</style>

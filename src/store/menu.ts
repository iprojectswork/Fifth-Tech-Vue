/**
 * 菜单树状态（Pinia）
 * 数据来源：登录后 /auth/menus → localStorage.menus
 * 顶栏一级域 = topDomains；侧栏 = 当前域的 children
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { MenuItem } from '@/api/auth'
import {
  flattenMenus,
  getTopDomains,
  normalizeMenuTree,
  type FlatMenu,
  type DomainId
} from '@/utils/menu'

export const useMenuStore = defineStore('menu', () => {
  const menuTree = ref<MenuItem[]>([])
  const loaded = ref(false)

  const flatMenus = computed<FlatMenu[]>(() => flattenMenus(menuTree.value))

  /** parent_id=0 的一级业务域，供顶栏渲染 */
  const topDomains = computed(() => getTopDomains(menuTree.value))

  function loadFromStorage(): void {
    const menusStr = localStorage.getItem('menus')
    if (menusStr) {
      try {
        const parsed = JSON.parse(menusStr) as MenuItem[]
        menuTree.value = normalizeMenuTree(parsed)
      } catch {
        menuTree.value = []
      }
    } else {
      menuTree.value = []
    }
    loaded.value = true
  }

  function setMenus(menus: MenuItem[]): void {
    menuTree.value = normalizeMenuTree(menus)
    loaded.value = true
  }

  function clear(): void {
    menuTree.value = []
    loaded.value = false
  }

  /** 列表 tab 标题：用菜单 permissionName */
  function getMenuNameByPath(path: string): string | undefined {
    const base = path.split('?')[0]
    return flatMenus.value.find((m) => m.path === base)?.permissionName
  }

  function getDomain(domainId: DomainId): MenuItem | undefined {
    return topDomains.value.find((m) => m.id === domainId)
  }

  return {
    menuTree,
    flatMenus,
    topDomains,
    loaded,
    loadFromStorage,
    setMenus,
    clear,
    getMenuNameByPath,
    getDomain
  }
})

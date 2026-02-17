import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Tab {
  title: string
  path: string
  closable: boolean
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<Tab[]>([
    { title: '首页', path: '/dashboard', closable: false }
  ])
  const activeTab = ref('/dashboard')

  const addTab = (tab: Tab) => {
    const existingTab = tabs.value.find(t => t.path === tab.path)
    if (!existingTab) {
      tabs.value.push(tab)
    }
    activeTab.value = tab.path
  }

  const removeTab = (path: string) => {
    const tab = tabs.value.find(t => t.path === path)
    if (!tab || !tab.closable) {
      return
    }
    const index = tabs.value.findIndex(t => t.path === path)
    if (index > -1) {
      tabs.value.splice(index, 1)
      if (activeTab.value === path && tabs.value.length > 0) {
        activeTab.value = tabs.value[Math.max(0, index - 1)].path
      }
    }
  }

  const setActiveTab = (path: string) => {
    activeTab.value = path
  }

  const clearTabs = () => {
    tabs.value = tabs.value.filter(t => !t.closable)
    activeTab.value = tabs.value[0]?.path || '/dashboard'
  }

  return {
    tabs,
    activeTab,
    addTab,
    removeTab,
    setActiveTab,
    clearTabs
  }
})

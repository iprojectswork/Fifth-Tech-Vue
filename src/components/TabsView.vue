<template>
  <div class="tabs-view">
    <el-tabs
      v-model="activeTab"
      type="card"
      closable
      @tab-click="handleTabClick"
      @tab-remove="handleTabRemove"
    >
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.path"
        :label="tab.title"
        :name="tab.path"
        :closable="tab.closable"
      />
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTabsStore } from '@/store/tabs'

const router = useRouter()
const tabsStore = useTabsStore()

const tabs = computed(() => tabsStore.tabs)
const activeTab = computed({
  get: () => tabsStore.activeTab,
  set: (val) => tabsStore.setActiveTab(val)
})

const handleTabClick = (tab: any) => {
  router.push(tab.props.name)
}

const handleTabRemove = (path: string) => {
  tabsStore.removeTab(path)
  if (tabsStore.activeTab !== path) {
    router.push(tabsStore.activeTab)
  }
}
</script>

<style scoped>
.tabs-view {
  background-color: var(--bg-primary);
  padding: 5px 10px 0;
  border-bottom: 1px solid var(--border);
}

.tabs-view :deep(.el-tabs__header) {
  margin: 0;
  border-bottom: none;
}

.tabs-view :deep(.el-tabs__nav) {
  border: none;
}

.tabs-view :deep(.el-tabs__item) {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  border-bottom: none;
  margin-right: 5px;
  border-radius: 5px 5px 0 0;
  color: var(--text-secondary);
  transition: all 0.3s;
}

.tabs-view :deep(.el-tabs__item:hover) {
  color: var(--primary);
  background-color: var(--bg-tertiary);
}

.tabs-view :deep(.el-tabs__item.is-active) {
  background-color: var(--bg-primary);
  color: var(--primary);
  border-bottom: 1px solid var(--bg-primary);
  border-bottom-color: var(--bg-primary);
}

.tabs-view :deep(.el-tabs__item.is-active::before) {
  display: none;
}
</style>

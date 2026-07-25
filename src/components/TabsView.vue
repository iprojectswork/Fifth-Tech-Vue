<!--
  G-tabs 页签条（自绘，不用 el-tabs）
  状态全部来自 Pinia tabsStore；点击/关闭走 useNavigation。
  横向 overflow 仅在 tab 过多时出现；禁止纵向滚动条。
-->
<template>
  <div class="tabs-view">
    <div class="tabs-nav">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: tab.key === activeTabKey }"
        @click="onSelect(tab.key)"
      >
        <span class="tab-title">{{ tab.title }}</span>
        <button
          type="button"
          class="tab-close"
          aria-label="关闭"
          @click.stop="onClose(tab.key)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useTabsStore } from '@/store/tabs'
import { useNavigation } from '@/composables/useNavigation'

const tabsStore = useTabsStore()
// storeToRefs 保持 tabs/activeTabKey 响应式
const { tabs, activeTabKey } = storeToRefs(tabsStore)
const { activateTabKey, closeTabKey } = useNavigation()

async function onSelect(key: string) {
  if (key === activeTabKey.value) return
  await activateTabKey(key)
}

async function onClose(key: string) {
  await closeTabKey(key)
}
</script>

<style scoped>
.tabs-view {
  background-color: var(--bg-primary);
  padding: 6px 10px 0;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  overflow: hidden;
}

.tabs-nav {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-end;
  gap: 6px;
  min-height: 36px;
  /* 仅横向可滚；必须 hidden 纵向，否则 overflow-x:auto 会带出右侧竖条 */
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.tabs-nav::-webkit-scrollbar {
  height: 4px;
}

.tabs-nav::-webkit-scrollbar:vertical {
  width: 0;
  height: 0;
}

.tabs-nav::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 180px;
  padding: 7px 10px 7px 12px;
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: 5px 5px 0 0;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  transition: color 0.15s, background-color 0.15s;
}

.tab-item:hover {
  color: var(--primary);
  background-color: var(--bg-tertiary);
}

.tab-item.active {
  background-color: var(--bg-primary);
  color: var(--primary);
  border-bottom: 1px solid var(--bg-primary);
  margin-bottom: -1px;
  font-weight: 500;
}

.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  line-height: 1.2;
}

.tab-close {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  border-radius: 2px;
  opacity: 0.65;
}

.tab-close:hover {
  opacity: 1;
  color: var(--primary);
  background-color: var(--bg-tertiary);
}
</style>

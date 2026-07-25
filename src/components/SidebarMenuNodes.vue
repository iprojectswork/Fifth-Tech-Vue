<!--
  侧栏多级菜单递归节点（一期 el-sub-menu，非右 flyout）
  叶子 index=path，供 el-menu @select 跳转
-->
<template>
  <template v-for="menu in menus" :key="menu.id">
    <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="String(menu.id)">
      <template #title>
        <span>{{ menu.permissionName }}</span>
      </template>
      <SidebarMenuNodes :menus="menu.children" />
    </el-sub-menu>
    <el-menu-item v-else-if="menu.path" :index="menu.path">
      {{ menu.permissionName }}
    </el-menu-item>
  </template>
</template>

<script setup lang="ts">
import type { MenuItem } from '@/api/auth'

// 递归组件需要显式 name
defineOptions({ name: 'SidebarMenuNodes' })

defineProps<{
  menus: MenuItem[]
}>()
</script>

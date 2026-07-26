/**
 * 将权限/注册表中的 component 逻辑 key 解析为 views 懒加载函数（白名单）。
 * 例：user/list → @/views/user/list.vue
 */
import type { Component } from 'vue'

const viewModules = import.meta.glob<{ default: Component }>('@/views/**/*.vue')

export type ViewLoader = () => Promise<{ default: Component }>

function toModuleKey(component: string): string {
  const normalized = component.replace(/^\/+/, '').replace(/\.vue$/i, '')
  return `/src/views/${normalized}.vue`
}

export function resolveView(component: string): ViewLoader | null {
  if (!component.trim()) return null
  const key = toModuleKey(component)
  const loader = viewModules[key]
  return loader ?? null
}

export function listViewModuleKeys(): readonly string[] {
  return Object.keys(viewModules)
}

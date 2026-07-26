/**
 * v-permission：无权限移除 DOM（不 disabled）
 * 用法：v-permission="'system:user:add'" 或 v-permission="['a','b']"（任一即可）
 */
import type { App, Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/store/permission'

function check(el: HTMLElement, binding: DirectiveBinding<string | readonly string[]>) {
  const value = binding.value
  const codes = typeof value === 'string' ? [value] : value ? [...value] : []
  if (codes.length === 0) return

  const ps = usePermissionStore()
  if (!ps.hasAnyCode(codes)) {
    el.parentNode?.removeChild(el)
  }
}

export const permissionDirective: Directive<HTMLElement, string | readonly string[]> = {
  mounted(el, binding) {
    check(el, binding)
  },
  updated(el, binding) {
    // 权限码运行时一般不变；若 codes 变化且仍无权限则移除
    check(el, binding)
  }
}

export function setupPermissionDirective(app: App): void {
  app.directive('permission', permissionDirective)
}

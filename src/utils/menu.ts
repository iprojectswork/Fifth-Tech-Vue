/**
 * 菜单树纯函数工具（无 Vue 依赖）
 * 负责：树规范化、拍平、一级域、首叶子、path→domainId
 */
import type { MenuItem } from '@/api/auth'
import { WORKBENCH_PATH } from '@/constants/nav'

export type DomainId = number

export interface FlatMenu extends MenuItem {
  parentId: number
  /** 该节点所属一级域 id（根节点即自身 id） */
  domainId: DomainId
}

/** 补齐 parentId，保证侧栏/拍平逻辑一致 */
export function normalizeMenuTree(menus: MenuItem[], parentId = 0): MenuItem[] {
  return menus.map((m) => ({
    ...m,
    parentId: m.parentId ?? parentId,
    children: m.children?.length ? normalizeMenuTree(m.children, m.id) : undefined
  }))
}

/** DFS 拍平，并写入 domainId */
export function flattenMenus(menus: MenuItem[], parentId = 0, domainId?: DomainId): FlatMenu[] {
  const result: FlatMenu[] = []
  for (const menu of menus) {
    const dId = parentId === 0 ? menu.id : (domainId as DomainId)
    const flat: FlatMenu = {
      ...menu,
      parentId,
      domainId: dId,
      children: undefined
    }
    result.push(flat)
    if (menu.children?.length) {
      result.push(...flattenMenus(menu.children, menu.id, dId))
    }
  }
  return result
}

/** 顶栏一级：parent 为空或 0 */
export function getTopDomains(menuTree: MenuItem[]): MenuItem[] {
  return menuTree.filter((m) => !m.parentId || m.parentId === 0)
}

export function findDomainById(menuTree: MenuItem[], domainId: DomainId): MenuItem | undefined {
  return getTopDomains(menuTree).find((m) => m.id === domainId)
}

/** 域下第一个叶子 path（进域默认落点的最终兜底） */
export function getFirstLeafPath(node: MenuItem | undefined): string | null {
  if (!node) return null
  if (node.path && (!node.children || node.children.length === 0)) {
    return node.path
  }
  if (node.children?.length) {
    for (const child of node.children) {
      const p = getFirstLeafPath(child)
      if (p) return p
    }
  }
  if (node.path) return node.path
  return null
}

export function findMenuByPath(flat: FlatMenu[], path: string): FlatMenu | undefined {
  if (!path || path === WORKBENCH_PATH) return undefined
  return flat.find((m) => m.path === path)
}

/**
 * 由路由 path 反查一级域 id。
 * 顺序：activeMenu/path 精确匹配 → 最长 path 前缀 → 首段与域叶子前缀 → 失败返回 null（不再默认第一个域）
 */
export function resolveDomainIdByPath(
  flat: FlatMenu[],
  menuTree: MenuItem[],
  path: string,
  activeMenuPath?: string
): DomainId | null {
  if (!path || path === WORKBENCH_PATH) return null

  const hint = activeMenuPath || path
  const exact = findMenuByPath(flat, hint)
  if (exact) return exact.domainId

  let best: FlatMenu | undefined
  for (const m of flat) {
    if (!m.path) continue
    if (hint === m.path || hint.startsWith(m.path + '/')) {
      if (!best || m.path.length > (best.path?.length ?? 0)) {
        best = m
      }
    }
  }
  if (best) return best.domainId

  const segment = path.split('/').filter(Boolean)[0]
  if (segment) {
    const prefix = `/${segment}`
    for (const domain of getTopDomains(menuTree)) {
      const leaf = getFirstLeafPath(domain)
      if (leaf?.startsWith(prefix)) return domain.id
      if (domain.path === prefix || domain.path?.startsWith(prefix)) return domain.id
    }
  }

  return null
}

/** 当前域侧栏树 = 一级域的 children */
export function getSidebarTree(menuTree: MenuItem[], domainId: DomainId | null): MenuItem[] {
  if (domainId == null) return []
  const domain = findDomainById(menuTree, domainId)
  return domain?.children ?? []
}

export function isPathInDomain(
  flat: FlatMenu[],
  menuTree: MenuItem[],
  domainId: DomainId,
  fullOrPath: string
): boolean {
  const path = fullOrPath.split('?')[0]
  const d = resolveDomainIdByPath(flat, menuTree, path)
  return d === domainId
}

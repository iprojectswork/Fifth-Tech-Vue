/**
 * 单据（详情/表单）路由注册表。
 * routeCodes：注册 form 路由；detailCodes：打开已有；createCodes：新建。
 */
export type DocMode = 'create' | 'edit' | 'view'

export type DocRouteDef = {
  readonly docType: string
  readonly path: string
  readonly component: string
  readonly activeMenu: string
  readonly routeCodes: readonly string[]
  readonly detailCodes: readonly string[]
  readonly createCodes: readonly string[]
  readonly titleQueryKeys?: readonly string[]
  readonly newTitle?: string
  readonly idQueryKey?: string
  readonly permissionName?: string
}

export const docRouteRegistry: Readonly<Record<string, DocRouteDef>> = {
  user: {
    docType: 'user',
    path: '/system/user/form',
    component: 'user/form',
    activeMenu: '/system/user/list',
    routeCodes: ['system:user:add', 'system:user:edit', 'system:user:view'],
    detailCodes: ['system:user:view', 'system:user:edit'],
    createCodes: ['system:user:add'],
    titleQueryKeys: ['username', 'nickname'],
    newTitle: '新增用户',
    idQueryKey: 'id',
    permissionName: '用户表单'
  }
}

export function getDocDefByType(docType: string): DocRouteDef | undefined {
  return docRouteRegistry[docType]
}

export function getDocDefByPath(path: string): DocRouteDef | undefined {
  const base = path.split('?')[0]
  return Object.values(docRouteRegistry).find((d) => d.path === base)
}

export function isDocPath(path: string): boolean {
  return getDocDefByPath(path) != null
}

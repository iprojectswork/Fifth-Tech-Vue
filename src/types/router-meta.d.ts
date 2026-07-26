/**
 * Vue Router meta 扩展（页签 / 侧栏 / B2 权限）
 */
import 'vue-router'
import type { TabKind } from '@/store/tabs'

declare module 'vue-router' {
  interface RouteMeta {
    /** 默认标题（列表 tab / 兜底） */
    title?: string
    /** list=列表页签；doc=详情/表单页签 */
    kind?: TabKind
    /** 详情业务类型，用于 tab key：doc__{docType}__{id} */
    docType?: string
    /**
     * 侧栏应高亮的菜单 path（详情页指向对应列表）
     * 同时作为 doc 的 menuPath，关最后一个详情时 domainLastPath 回退用
     */
    activeMenu?: string
    /** 与 activeMenu 同义，兼容旧字段 */
    menuPath?: string
    /**
     * 从 query 取页签标题时按顺序尝试的 key
     * 例：用户详情 ['username','nickname']
     */
    titleQueryKeys?: string[]
    /** 无业务 id 时（新建）的页签标题 */
    newTitle?: string
    /** 业务主键 query 名，默认 id */
    idQueryKey?: string
    /** 菜单/按钮权限码 */
    permissionCode?: string
    /** 打开已有单据所需码 */
    detailCodes?: string[]
    /** 新建所需码 */
    createCodes?: string[]
  }
}

export {}

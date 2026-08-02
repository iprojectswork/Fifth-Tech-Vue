/**
 * 数据字典 API（C3 §7.2）
 * - 懒加载 children / 全量 tree / 右栏 list
 * - info / add / edit / move / delete
 * - 业务只读 /dict/data（按 pathCode 取启用直接子）
 *
 * 雪花 id 与 C2 一致：后端 ToStringSerializer 下发字符串，避免 JS Number 精度丢失。
 */
import request from '@/utils/request'
import type { Result } from '@/api/user'

/** 雪花 id 后端以字符串下发 */
export type SnowflakeId = string

/** 根 parentId（与后端 parent_id = 0 对齐，序列化后为 "0"） */
export const DICT_ROOT_PARENT_ID: SnowflakeId = '0'

/** 扁平节点 VO（含 pathCode/pathName/hasChildren） */
export interface DictNodeVO {
  readonly id: SnowflakeId
  readonly parentId: SnowflakeId
  readonly code: string
  readonly name: string
  readonly sort: number
  readonly status: number
  readonly remark?: string
  readonly pathCode: string
  readonly pathName: string
  readonly hasChildren: boolean
}

/** 全量树 VO（继承扁平字段 + children[]） */
export interface DictNodeTreeVO extends DictNodeVO {
  readonly children: readonly DictNodeTreeVO[]
}

/** 入参：add/edit；edit 时必传 id，edit 不改 parent */
export interface DictNodeDTO {
  readonly id?: SnowflakeId
  readonly parentId: SnowflakeId
  readonly code: string
  readonly name: string
  readonly sort: number
  readonly status: number
  readonly remark?: string
}

/** 入参：move（仅无子节点可调） */
export interface DictNodeMoveDTO {
  readonly id: SnowflakeId
  readonly targetParentId: SnowflakeId
}

/** 列表查询（与 children 同义；右栏直接子） */
export interface DictNodeListQuery {
  readonly parentId?: SnowflakeId
}

/** children 懒加载查询 */
export interface DictNodeChildrenQuery {
  readonly parentId?: SnowflakeId
}

/** 业务只读 query */
export interface DictDataQuery {
  readonly pathCode: string
}

/** 懒加载根层：GET /dict/node/children?parentId=0 → 直接子 VO[] */
export const getDictNodeChildren = (params?: DictNodeChildrenQuery) =>
  request.get<Result<DictNodeVO[]>>('/dict/node/children', { params })

/** 全量树：GET /dict/node/tree → TreeVO[]（含叶子与 path） */
export const getDictNodeTree = () =>
  request.get<Result<DictNodeTreeVO[]>>('/dict/node/tree')

/** 右栏直接子：GET /dict/node/list?parentId= → VO[]（与 children 可同源） */
export const getDictNodeList = (params: DictNodeListQuery) =>
  request.get<Result<DictNodeVO[]>>('/dict/node/list', { params })

/** 详情：GET /dict/node/info-by-id/{id} → VO（含 path） */
export const getDictNodeById = (id: SnowflakeId) =>
  request.get<Result<DictNodeVO>>(`/dict/node/info-by-id/${encodeURIComponent(id)}`)

/** 新增：POST /dict/node，body: DTO（含 parentId） */
export const addDictNode = (data: DictNodeDTO) =>
  request.post<Result<DictNodeVO>>('/dict/node', data)

/** 更新：PUT /dict/node，body: DTO（含 id），忽略 parentId */
export const updateDictNode = (data: DictNodeDTO) =>
  request.put<Result<DictNodeVO>>('/dict/node', data)

/** 移动：PUT /dict/node/move，body: { id, targetParentId } */
export const moveDictNode = (data: DictNodeMoveDTO) =>
  request.put<Result<void>>('/dict/node/move', data)

/** 删除：DELETE /dict/node/{id}，有子则后端失败 */
export const deleteDictNode = (id: SnowflakeId) =>
  request.delete<Result<void>>(`/dict/node/${encodeURIComponent(id)}`)

/** 业务只读：GET /dict/data?pathCode= → 启用直接子 VO[]，节点不存在业务错 */
export const getDictData = (params: DictDataQuery) =>
  request.get<Result<DictNodeVO[]>>('/dict/data', { params })

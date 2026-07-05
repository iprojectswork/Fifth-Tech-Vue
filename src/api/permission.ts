import request from '@/utils/request'
import { PageResult, Result } from '@/api/user'

export interface Permission {
  id?: number
  permissionName: string
  permissionCode: string
  permissionType: number
  parentId?: number
  path?: string
  component?: string
  icon?: string
  status?: number
  sort?: number
  children?: Permission[]
}

export interface PermissionQuery {
  current?: number
  size?: number
  permissionName?: string
  permissionCode?: string
}

export interface PermissionTree {
  id: number
  permissionName: string
  permissionCode: string
  permissionType: number
  parentId: number
  path?: string
  component?: string
  icon?: string
  status?: number
  sort?: number
  children?: PermissionTree[]
}

export const getPermissionList = (params: PermissionQuery) => {
  return request.get<Result<PageResult<Permission>>>('/permission/list', { params })
}

export const getPermissionTree = () => {
  return request.get<Result<PermissionTree[]>>('/permission/tree')
}

export const getPermissionById = (id: number) => {
  return request.get<Result<Permission>>(`/permission/${id}`)
}

export const addPermission = (data: Permission) => {
  return request.post<Result<Permission>>('/permission', data)
}

export const updatePermission = (data: Permission) => {
  return request.put<Result<Permission>>('/permission', data)
}

export const deletePermission = (id: number) => {
  return request.delete<Result<void>>(`/permission/${id}`)
}

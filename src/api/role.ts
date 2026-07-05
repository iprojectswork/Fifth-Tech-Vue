import request from '@/utils/request'
import { PageResult, Result } from '@/api/user'

export interface Role {
  id?: number
  roleName: string
  roleCode: string
  description?: string
  status?: number
  sort?: number
  createId?: number
  createName?: string
  createTime?: string
  updateId?: number
  updateName?: string
  updateTime?: string
}

export interface RoleQuery {
  current?: number
  size?: number
  roleName?: string
  roleCode?: string
}

export const getRoleList = (params: RoleQuery) => {
  return request.get<Result<PageResult<Role>>>('/role/list', { params })
}

export const getRoleById = (id: number) => {
  return request.get<Result<Role>>(`/role/${id}`)
}

export const addRole = (data: Role) => {
  return request.post<Result<Role>>('/role', data)
}

export const updateRole = (data: Role) => {
  return request.put<Result<Role>>('/role', data)
}

export const deleteRole = (id: number) => {
  return request.delete<Result<void>>(`/role/${id}`)
}

export const getAllRoles = () => {
  return request.get<Result<Role[]>>('/role/all')
}

export const getRolePermissions = (roleId: number) => {
  return request.get<Result<number[]>>(`/role/${roleId}/permissions`)
}

export const assignRolePermissions = (roleId: number, permissionIds: number[]) => {
  return request.put<Result<void>>(`/role/${roleId}/permissions`, permissionIds)
}

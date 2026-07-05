import request from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginData {
  success: boolean
  token?: string
  message?: string
}

export interface Result<T> {
  code: number
  message: string
  data: T
}

export interface UserInfo {
  userId: number
  username: string
  nickname: string
  permissions: string[]
}

export interface MenuItem {
  id: number
  permissionName: string
  permissionCode: string
  permissionType: number
  parentId: number
  path: string
  component: string
  icon: string
  children?: MenuItem[]
}

export const login = (params: LoginParams) => {
  return request.post<Result<LoginData>>('/auth/login', params)
}

export const getUserInfo = () => {
  return request.get<Result<UserInfo>>('/auth/user-info')
}

export const getMenus = () => {
  return request.get<Result<MenuItem[]>>('/auth/menus')
}

export const logout = () => {
  return request.post<Result<void>>('/auth/logout')
}

export const hello = () => {
  return request.get<string>('/demo/hello')
}

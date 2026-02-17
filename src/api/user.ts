import request from '@/utils/request'

export interface User {
  id?: number
  username: string
  password?: string
  nickname?: string
  email?: string
  phone?: string
  status?: number
  createTime?: string
  updateTime?: string
}

export interface UserQuery {
  current?: number
  size?: number
  username?: string
  nickname?: string
  email?: string
  phone?: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export interface Result<T> {
  code: number
  message: string
  data: T
}

export const getUserList = (params: UserQuery) => {
  return request.get<Result<PageResult<User>>>('/user/list', { params })
}

export const getUserById = (id: number) => {
  return request.get<Result<User>>(`/user/${id}`)
}

export const addUser = (data: User) => {
  return request.post<Result<User>>('/user', data)
}

export const updateUser = (data: User) => {
  return request.put<Result<User>>('/user', data)
}

export const deleteUser = (id: number) => {
  return request.delete<Result<void>>(`/user/${id}`)
}

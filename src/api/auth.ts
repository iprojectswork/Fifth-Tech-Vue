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

export const login = (params: LoginParams) => {
  return request.post<Result<LoginData>>('/auth/login', params)
}

export const hello = () => {
  return request.get<string>('/demo/hello')
}

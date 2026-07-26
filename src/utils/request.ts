/**
 * Axios 封装
 * - 请求头挂 Bearer token
 * - 响应直接返回 body（后端 Result）
 * - 401：清本地会话 + Pinia 导航/权限状态，跳登录
 */
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError
} from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { clearAuthSession } from '@/utils/auth-session'

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

request.interceptors.response.use(
  <T>(response: AxiosResponse<T>): T => response.data as T,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuthSession()
      if (router.currentRoute.value.path !== '/login') {
        void router.push('/login')
      }
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    return Promise.reject(error)
  }
)

export default request

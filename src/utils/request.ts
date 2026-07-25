/**
 * Axios 封装
 * - 请求头挂 Bearer token
 * - 响应直接返回 body（后端 Result）
 * - 401：清本地会话 + Pinia 导航状态，跳登录
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useTabsStore } from '@/store/tabs'
import { useMenuStore } from '@/store/menu'

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

/** 与 Layout 登出、Login 成功前清理保持一致 */
function clearAuthSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('menus')
  useTabsStore().clearAll()
  useMenuStore().clear()
}

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  <T>(response: AxiosResponse<T>): T => {
    return response.data as T
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuthSession()
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    return Promise.reject(error)
  }
)

export default request

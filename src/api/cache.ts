import request from '@/utils/request'
import type { PageResult, Result } from '@/api/user'

export interface CacheKeyItem {
  readonly key: string
  readonly type: string
  readonly ttl: number
}

export interface CacheDetail extends CacheKeyItem {
  readonly value: string
}

export interface CachePage extends PageResult<CacheKeyItem> {
  readonly truncated?: boolean
  readonly max?: number
}

export interface CacheKeyQuery {
  readonly pattern?: string
  readonly current?: number
  readonly size?: number
}

export interface CacheSetData {
  readonly key: string
  readonly value: string
  readonly ttlSeconds?: number
}

export interface CacheExpireData {
  readonly key: string
  readonly ttlSeconds: number
}

export interface CacheDeleteResult {
  readonly deleted: number
  readonly requested: number
}

export const getCacheKeys = (params: CacheKeyQuery) =>
  request.get<Result<CachePage>>('/cache/keys', { params })

export const getCacheDetail = (key: string) =>
  request.get<Result<CacheDetail>>('/cache/detail', { params: { key } })

export const setCache = (data: CacheSetData) =>
  request.post<Result<void>>('/cache', data)

export const expireCache = (data: CacheExpireData) =>
  request.put<Result<void>>('/cache/expire', data)

export const deleteCache = (keys: readonly string[]) =>
  request.delete<Result<CacheDeleteResult>>('/cache', { data: { keys } })


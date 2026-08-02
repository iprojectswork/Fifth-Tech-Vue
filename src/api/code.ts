import request from '@/utils/request'
import type { PageResult, Result } from '@/api/user'

export const DATE_PATTERNS = ['yy', 'yyyy', 'yyMM', 'yyyyMM', 'yyMMdd', 'yyyyMMdd'] as const
export type DatePattern = (typeof DATE_PATTERNS)[number]
export type CodeSegmentType = 'FIXED' | 'DATE' | 'SEQUENCE'

export interface FixedSegment {
  readonly type: 'FIXED'
  readonly value: string
}

export interface DateSegment {
  readonly type: 'DATE'
  readonly pattern: DatePattern
}

export interface SequenceSegment {
  readonly type: 'SEQUENCE'
  readonly length: number
  readonly start: number
  readonly step: number
}

export type CodeSegment = FixedSegment | DateSegment | SequenceSegment

/** 雪花 id 后端以字符串下发，避免 JS Number 精度丢失 */
export type SnowflakeId = string

export interface CodeRule {
  readonly id?: SnowflakeId
  readonly ruleCode: string
  readonly ruleName: string
  readonly segments: readonly CodeSegment[]
  readonly batchSize: number
  readonly status: number
  readonly remark?: string
  readonly createTime?: string
  readonly updateTime?: string
}

export interface CodeRuleQuery {
  readonly current?: number
  readonly size?: number
  readonly ruleCode?: string
  readonly ruleName?: string
  readonly status?: number
}

export interface CodeSequence {
  readonly id?: SnowflakeId
  readonly ruleId?: SnowflakeId
  readonly ruleCode: string
  readonly periodKey: string
  readonly currentMax: number | string
  readonly updateTime?: string
}

export interface CodeSequenceQuery {
  readonly ruleId?: SnowflakeId
  readonly ruleCode?: string
}

export interface GenerateCodeRequest {
  readonly ruleCode: string
  readonly count?: number
  readonly bizTime?: string
}

export interface GenerateCodeResponse {
  readonly codes: readonly string[]
}

export interface PreviewCodeRequest {
  readonly ruleCode: string
}

export interface PreviewCodeResponse {
  readonly sample: string
}

export const getCodeRuleList = (params: CodeRuleQuery) =>
  request.get<Result<PageResult<CodeRule>>>('/code/rule/list', { params })

export const getCodeRuleById = (id: SnowflakeId) =>
  request.get<Result<CodeRule>>(`/code/rule/${encodeURIComponent(id)}`)

export const addCodeRule = (data: CodeRule) =>
  request.post<Result<CodeRule>>('/code/rule', data)

export const updateCodeRule = (data: CodeRule) =>
  request.put<Result<CodeRule>>('/code/rule', data)

export const deleteCodeRule = (id: SnowflakeId) =>
  request.delete<Result<void>>(`/code/rule/${encodeURIComponent(id)}`)

export const getCodeSequenceList = (params: CodeSequenceQuery) =>
  request.get<Result<readonly CodeSequence[]>>('/code/sequence/list', { params })

export const generateCode = (data: GenerateCodeRequest) =>
  request.post<Result<GenerateCodeResponse>>('/code/generate', data)

export const previewCode = (data: PreviewCodeRequest) =>
  request.post<Result<PreviewCodeResponse>>('/code/preview', data)

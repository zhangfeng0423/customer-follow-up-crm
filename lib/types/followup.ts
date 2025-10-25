/**
 * 跟进记录相关的类型定义
 * 基于PRD数据契约定义
 */

import { FollowUpType, PlanStatus, UserRole } from '@/app/generated/prisma'

/**
 * 跟进记录显示标签
 */
export const FOLLOWUP_TYPE_LABELS: Record<FollowUpType, string> = {
  PHONE_CALL: '电话沟通',
  MEETING: '线上会议',
  VISIT: '上门拜访',
  BUSINESS_DINNER: '商务宴请',
} as const

/**
 * 计划状态显示标签
 */
export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  PENDING: '待办',
  DONE: '已完成',
} as const

/**
 * 用户角色显示标签
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SALES: '销售',
  MANAGER: '经理',
  ADMIN: '管理员',
} as const

/**
 * 跟进记录创建请求接口
 */
export interface CreateFollowUpRequest {
  customerId: string
  content: string
  followUpType: FollowUpType
  attachments?: Array<{
    fileName: string
    fileUrl: string
    fileType: string
    fileSize?: number
  }>
  nextStep?: {
    dueDate: string
    notes?: string
  }
}

/**
 * 跟进记录响应接口
 */
export interface FollowUpRecordResponse {
  id: string
  content: string
  followUpType: FollowUpType
  createdAt: string
  updatedAt: string
  customerId: string
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  attachments: Array<{
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize?: number
    createdAt: string
  }>
  nextStepPlans: Array<{
    id: string
    dueDate: string
    notes?: string
    status: PlanStatus
    createdAt: string
  }>
}

/**
 * 时间轴项目接口
 */
export interface TimelineItem {
  id: string
  type: 'followup' | 'next_step'
  date: string
  title: string
  description?: string
  attachments?: Array<{
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize?: number
  }>
  nextStep?: {
    dueDate: string
    notes?: string
    status: PlanStatus
  }
  author: string
}

/**
 * 客户详情接口
 */
export interface CustomerDetail {
  id: string
  name: string
  companyInfo?: string
  email?: string
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  _count: {
    followUpRecords: number
    nextStepPlans: number
  }
}

/**
 * 文件上传响应接口
 */
export interface FileUploadResponse {
  success: boolean
  file?: {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
  }
  error?: string
}

/**
 * API响应基础接口
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 语音识别状态
 */
export type SpeechRecognitionState = 'idle' | 'recording' | 'processing' | 'error'

/**
 * 内联输入组件状态
 */
export interface InlineInputState {
  content: string
  followUpType: FollowUpType
  isRecording: boolean
  isUploading: boolean
  attachments: File[]
  nextStep: {
    enabled: boolean
    dueDate: string
    notes: string
  }
}
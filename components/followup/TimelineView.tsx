/**
 * TimelineView组件
 * 客户跟进记录时间轴视图，符合PRD设计的时间倒序展示
 */

'use client'

import * as React from 'react'
import { useState } from 'react'
import { formatRelativeTime, formatDateTime, isImageFile, cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FOLLOWUP_TYPE_LABELS,
  PLAN_STATUS_LABELS,
  FollowUpRecordResponse,
} from '@/lib/types/followup'
import { FollowUpType, PlanStatus } from '@/app/generated/prisma'
import {
  Phone,
  Video,
  Users,
  Utensils,
  Paperclip,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
} from 'lucide-react'

/**
 * 时间轴视图Props接口
 */
export interface TimelineViewProps {
  /** 跟进记录列表 */
  followUpRecords: FollowUpRecordResponse[]
  /** 加载状态 */
  isLoading?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * 获取跟进类型图标
 */
const getFollowUpTypeIcon = (type: FollowUpType) => {
  switch (type) {
    case 'PHONE_CALL':
      return <Phone className="h-4 w-4" />
    case 'MEETING':
      return <Video className="h-4 w-4" />
    case 'VISIT':
      return <Users className="h-4 w-4" />
    case 'BUSINESS_DINNER':
      return <Utensils className="h-4 w-4" />
    default:
      return <Calendar className="h-4 w-4" />
  }
}

/**
 * 获取跟进类型样式
 */
const getFollowUpTypeStyle = (type: FollowUpType) => {
  switch (type) {
    case 'PHONE_CALL':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'MEETING':
      return 'bg-primary/5 text-primary/90 border-primary/25'
    case 'VISIT':
      return 'bg-primary/15 text-primary/80 border-primary/35'
    case 'BUSINESS_DINNER':
      return 'bg-accent text-accent-foreground border-accent/50'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

/**
 * 获取计划状态图标
 */
const getPlanStatusIcon = (status: PlanStatus) => {
  switch (status) {
    case 'DONE':
      return <CheckCircle className="h-4 w-4 text-primary" />
    case 'PENDING':
      return <Clock className="h-4 w-4 text-accent-foreground" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

/**
 * 时间轴项目组件
 */
interface TimelineItemProps {
  record: FollowUpRecordResponse
  isLast: boolean
}

const TimelineItem: React.FC<TimelineItemProps> = ({ record, isLast }) => {
  const [showAttachments, setShowAttachments] = useState(false)

  return (
    <div className="relative">
      {/* 时间轴线 */}
      {!isLast && (
        <div className="absolute left-6 top-12 w-0.5 h-full bg-border" />
      )}

      {/* 时间轴内容 */}
      <div className="relative flex items-start space-x-4 pb-8">
        {/* 时间轴圆点 */}
        <div className="flex-shrink-0 w-12 h-12 bg-background border-2 border-border rounded-full flex items-center justify-center z-10">
          {getFollowUpTypeIcon(record.followUpType)}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* 头部信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* 用户信息 */}
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs">
                    {record.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{record.user.name}</span>
              </div>

              {/* 跟进类型标签 */}
              <div className={cn(
                'inline-flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium',
                getFollowUpTypeStyle(record.followUpType)
              )}>
                {getFollowUpTypeIcon(record.followUpType)}
                <span>{FOLLOWUP_TYPE_LABELS[record.followUpType]}</span>
              </div>
            </div>

            {/* 时间 */}
            <div className="text-xs text-muted-foreground">
              <div>{formatRelativeTime(record.createdAt)}</div>
              <div className="hidden sm:block">{formatDateTime(record.createdAt)}</div>
            </div>
          </div>

          {/* 跟进内容 */}
          <Card className="p-4">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {record.content}
            </div>

            {/* 附件 */}
            {record.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                    <span>{record.attachments.length} 个附件</span>
                  </div>
                  {record.attachments.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAttachments(!showAttachments)}
                      className="text-xs"
                    >
                      {showAttachments ? '收起' : `展开全部 ${record.attachments.length} 个`}
                    </Button>
                  )}
                </div>

                <div className={cn(
                  'grid gap-2',
                  showAttachments ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                )}>
                  {(showAttachments ? record.attachments : record.attachments.slice(0, 3)).map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md"
                    >
                      {isImageFile(attachment.fileType) ? (
                        <div className="flex-shrink-0 w-10 h-10 bg-muted rounded overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={attachment.fileUrl}
                            alt={attachment.fileName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 下一步计划 */}
            {record.nextStepPlans.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  <span>下一步计划</span>
                </div>
                {record.nextStepPlans.map((plan) => (
                  <div key={plan.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-md">
                    {getPlanStatusIcon(plan.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {PLAN_STATUS_LABELS[plan.status]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(plan.dueDate)}
                        </span>
                      </div>
                      {plan.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{plan.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

/**
 * 时间轴视图组件
 *
 * @param props 组件属性
 * @returns {JSX.Element} 时间轴视图组件
 */
export function TimelineView({
  followUpRecords,
  isLoading = false,
  className,
}: TimelineViewProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="relative flex items-start space-x-4 pb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-20 h-4 bg-muted rounded animate-pulse" />
                <div className="w-16 h-4 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-24 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (followUpRecords.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">暂无跟进记录</h3>
          <p className="text-sm">
            开始记录您的第一次客户跟进吧
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-0', className)}>
      {followUpRecords.map((record, index) => (
        <TimelineItem
          key={record.id}
          record={record}
          isLast={index === followUpRecords.length - 1}
        />
      ))}
    </div>
  )
}
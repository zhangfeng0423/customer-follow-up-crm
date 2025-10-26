/**
 * 简化版本的InlineFollowUpInput组件
 * 用于调试构建错误
 */

'use client'

import * as React from 'react'
import { useState, useCallback, useRef } from 'react'
import { Plus, Minus, Send, Calendar as CalendarIcon, Paperclip, X, FileImage, FileText } from 'lucide-react'
import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { VoiceInput } from './VoiceInput'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'
import {
  FOLLOWUP_TYPE_LABELS,
  CreateFollowUpRequest,
} from '@/lib/types/followup'
import { FollowUpType } from '@/app/generated/prisma'

/**
 * 文件信息接口
 */
interface UploadedFile {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
}

/**
 * 表单验证Schema
 */
const followUpFormSchema = z.object({
  content: z.string().min(1, '请输入跟进内容').max(2000, '跟进内容不能超过2000字符'),
  followUpType: z.enum(['PHONE_CALL', 'MEETING', 'VISIT', 'BUSINESS_DINNER']),
  hasNextStep: z.boolean(),
  nextStep: z.object({
    dueDate: z.string().min(1, '请选择截止日期'),
    notes: z.string().max(500, '下一步说明不能超过500字符').optional(),
  }).optional(),
}).refine((data) => {
  if (data.hasNextStep && (!data.nextStep || !data.nextStep.dueDate)) {
    return false
  }
  return true
}, {
  message: '添加下一步计划时必须选择截止日期',
  path: ['nextStep']
})

/**
 * 表单数据类型
 */
type FollowUpFormData = z.infer<typeof followUpFormSchema>

/**
 * 内联跟进输入组件Props接口
 */
export interface InlineFollowUpInputProps {
  /** 客户ID */
  customerId: string
  /** 提交回调函数 */
  onSubmit: (data: CreateFollowUpRequest) => Promise<void>
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
  /** 是否自动聚焦输入框 */
  autoFocus?: boolean
}

/**
 * 内联跟进输入组件
 *
 * @param props 组件属性
 * @returns {JSX.Element} 内联跟进输入组件
 */
export function InlineFollowUpInput({
  customerId,
  onSubmit,
  disabled = false,
  className,
  autoFocus = false,
}: InlineFollowUpInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isValid },
  } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      content: '',
      followUpType: 'PHONE_CALL',
      hasNextStep: false,
      nextStep: {
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
        notes: '',
      },
    },
  })

  // 使用 useController 来管理字段
  const {
    field: contentField,
    fieldState: contentFieldState,
  } = useController({
    control,
    name: 'content',
  })

  const {
    field: nextStepNotesField,
  } = useController({
    control,
    name: 'nextStep.notes',
  })

  const watchedFollowUpType = watch('followUpType')
  const hasNextStep = watch('hasNextStep')
  const nextStepDueDate = watch('nextStep.dueDate')

  /**
   * 自动聚焦输入框
   */
  React.useEffect(() => {
    if (autoFocus && !disabled && textareaRef.current) {
      // 使用 requestAnimationFrame 确保 DOM 完全渲染后执行聚焦
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          // 将光标移动到文本末尾
          const textLength = textareaRef.current.value.length
          textareaRef.current.setSelectionRange(textLength, textLength)
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [autoFocus, disabled])

  /**
   * 处理键盘事件，支持Ctrl/Cmd + Enter 提交
   */
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }, [])

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '文件上传失败')
        }

        const result = await response.json()
        return result.data as UploadedFile
      })

      const uploadedFilesData = await Promise.all(uploadPromises)
      setUploadedFiles(prev => [...prev, ...uploadedFilesData])

      toast({
        title: '上传成功',
        description: `成功上传 ${uploadedFilesData.length} 个文件`,
      })
    } catch (error) {
      console.error('文件上传失败:', error)
      toast({
        title: '上传失败',
        description: error instanceof Error ? error.message : '文件上传失败，请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      // 清空文件输入，允许重复选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [toast])

  /**
   * 移除已上传的文件
   */
  const handleRemoveFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }, [])

  /**
   * 获取文件图标
   */
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <FileImage className="h-4 w-4" />
      case 'pdf':
      case 'document':
      case 'spreadsheet':
        return <FileText className="h-4 w-4" />
      default:
        return <Paperclip className="h-4 w-4" />
    }
  }

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  /**
   * 提交表单
   */
  const handleFormSubmit = useCallback(async (data: FollowUpFormData) => {
    if (!isValid || isSubmitting) return

    setIsSubmitting(true)

    try {
      // 构建请求数据
      const requestData: CreateFollowUpRequest = {
        customerId,
        content: data.content,
        followUpType: data.followUpType,
        attachments: uploadedFiles.length > 0 ? uploadedFiles.map(file => ({
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileType: file.fileType,
          fileSize: file.fileSize,
        })) : undefined,
        nextStep: data.hasNextStep ? {
          dueDate: data.nextStep?.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notes: data.nextStep?.notes || '',
        } : undefined,
      }

      // 提交跟进记录
      await onSubmit(requestData)

      // 重置表单和文件
      reset()
      setUploadedFiles([])

      // 显示成功提示
      toast({
        title: "跟进记录已创建",
        description: "您的客户跟进记录已成功保存。",
      })

    } catch (error) {
      console.error('提交跟进记录失败:', error)
      toast({
        title: "提交失败",
        description: "创建跟进记录时出现错误，请重试。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [customerId, isValid, isSubmitting, onSubmit, reset, toast])

  
  /**
   * 处理下一步按钮点击
   */
  const handleNextStepToggle = useCallback(() => {
    const newHasNextStep = !hasNextStep
    setValue('hasNextStep', newHasNextStep)

    // 如果启用下一步计划且没有设置截止日期，设置为明天
    if (newHasNextStep && !nextStepDueDate) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      setValue('nextStep.dueDate', tomorrow.toISOString(), { shouldValidate: true })
    }
  }, [hasNextStep, nextStepDueDate, setValue])

  /**
   * 处理语音转文字结果
   */
  const handleVoiceTranscript = useCallback((transcript: string) => {
    // 将语音识别的结果追加到现有内容后面
    const currentContent = contentField.value || ''
    const newContent = currentContent + (currentContent ? ' ' : '') + transcript
    setValue('content', newContent, { shouldValidate: true })
  }, [contentField.value, setValue])

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <form ref={formRef} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-4">
            {/* 文本输入框 */}
            <div className="space-y-2">
              <Textarea
                {...contentField}
                ref={(node) => {
                  contentField.ref(node)
                  textareaRef.current = node
                }}
                onKeyDown={handleKeyDown}
                placeholder="记录今天的客户跟进情况..."
                className="min-h-[80px] resize-none border-0 bg-muted/50 focus:bg-background"
                disabled={disabled || isSubmitting}
              />
              {contentFieldState.error && (
                <p className="text-sm text-destructive">{contentFieldState.error.message}</p>
              )}
            </div>

            {/* 跟进类型选择 */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(FOLLOWUP_TYPE_LABELS).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={watchedFollowUpType === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setValue('followUpType', value as FollowUpType, { shouldValidate: true })}
                  disabled={disabled || isSubmitting}
                  className="text-sm"
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* 下一步计划 */}
            {hasNextStep && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="nextStepDueDate" className="text-xs text-muted-foreground">
                    截止日期
                  </Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      id="nextStepDueDate"
                      value={nextStepDueDate ? format(new Date(nextStepDueDate), 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setValue('nextStep.dueDate', new Date(e.target.value).toISOString(), { shouldValidate: true })
                        }
                      }}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="pl-10 h-9"
                      disabled={disabled || isSubmitting}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextStepNotes" className="text-xs text-muted-foreground">
                    说明（可选）
                  </Label>
                  <textarea
                    id="nextStepNotes"
                    {...nextStepNotesField}
                    placeholder="添加下一步计划的详细说明..."
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    disabled={disabled || isSubmitting}
                    maxLength={500}
                  />
                </div>
              </div>
            )}

            {/* 文件上传区域 */}
            {uploadedFiles.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
                    >
                      <div className="text-muted-foreground">
                        {getFileIcon(file.fileType)}
                      </div>
                      <span className="truncate max-w-[120px]" title={file.fileName}>
                        {file.fileName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(file.fileSize)})
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(file.id)}
                        disabled={disabled || isSubmitting}
                        className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 按钮区域 */}
            <div className="flex items-center justify-between">
              {/* 左侧：录音按钮、附件按钮和下一步按钮 */}
              <div className="flex items-center space-x-2">
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  disabled={disabled || isSubmitting}
                />

                {/* 文件上传按钮 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileSelect}
                  disabled={disabled || isSubmitting || isUploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isSubmitting || isUploading}
                  className="h-8 px-2"
                >
                  {isUploading ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                      <span className="text-xs">上传中</span>
                    </>
                  ) : (
                    <>
                      <Paperclip className="h-3 w-3 mr-1" />
                      <span className="text-xs">附件</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleNextStepToggle}
                  disabled={disabled || isSubmitting}
                  className="h-8 px-2"
                >
                  {hasNextStep ? (
                    <>
                      <Minus className="h-3 w-3 mr-1" />
                      <span className="text-xs">取消</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      <span className="text-xs">下一步</span>
                    </>
                  )}
                </Button>
              </div>

              {/* 右侧：提交按钮 */}
              <Button
                type="submit"
                disabled={!isValid || disabled || isSubmitting}
                className="min-w-[80px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    发布
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    发布
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Card>
  )
}
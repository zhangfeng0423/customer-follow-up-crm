/**
 * NextStepForm组件
 * 下一步计划表单组件，用于设置下次跟进的时间和备注
 */

'use client'

import * as React from 'react'
import { useState, useCallback } from 'react'
import { Calendar, Clock, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * 表单验证Schema
 */
const nextStepFormSchema = z.object({
  dueDate: z.string().min(1, '请选择跟进日期'),
  dueTime: z.string().min(1, '请选择跟进时间'),
  notes: z.string().max(500, '备注不能超过500字符').optional(),
})

/**
 * 表单数据类型
 */
type NextStepFormData = z.infer<typeof nextStepFormSchema>

/**
 * 下一步计划表单Props接口
 */
export interface NextStepFormProps {
  /** 提交回调函数 */
  onSubmit: (data: { dueDate: string; notes: string }) => void
  /** 取消回调函数 */
  onCancel: () => void
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * 快捷时间选项
 */
const QUICK_DATE_OPTIONS = [
  { label: '明天', days: 1 },
  { label: '3天后', days: 3 },
  { label: '1周后', days: 7 },
  { label: '2周后', days: 14 },
]

/**
 * 常用时间选项
 */
const TIME_OPTIONS = [
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
]

/**
 * 下一步计划表单组件
 *
 * @param props 组件属性
 * @returns {JSX.Element} 下一步计划表单组件
 */
export function NextStepForm({
  onSubmit,
  onCancel,
  disabled = false,
  className,
}: NextStepFormProps) {
  const [selectedQuickDate, setSelectedQuickDate] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<NextStepFormData>({
    resolver: zodResolver(nextStepFormSchema),
    defaultValues: {
      dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      dueTime: '10:00',
      notes: '',
    },
  })

  const watchedDueDate = watch('dueDate')
  const watchedDueTime = watch('dueTime')
  const watchedNotes = watch('notes')

  /**
   * 处理快捷日期选择
   */
  const handleQuickDateSelect = useCallback((days: number) => {
    const targetDate = addDays(new Date(), days)
    const dateStr = format(targetDate, 'yyyy-MM-dd')
    setValue('dueDate', dateStr, { shouldValidate: true })
    setSelectedQuickDate(days)
  }, [setValue])

  /**
   * 处理自定义日期选择
   */
  const handleCustomDateChange = useCallback((dateStr: string) => {
    setValue('dueDate', dateStr, { shouldValidate: true })
    setSelectedQuickDate(null)
  }, [setValue])

  /**
   * 处理时间选择
   */
  const handleTimeSelect = useCallback((time: string) => {
    setValue('dueTime', time, { shouldValidate: true })
  }, [setValue])

  /**
   * 提交表单
   */
  const handleFormSubmit = useCallback((data: NextStepFormData) => {
    if (!isValid) return

    // 合并日期和时间
    const dueDateTime = new Date(`${data.dueDate}T${data.dueTime}:00`)

    onSubmit({
      dueDate: dueDateTime.toISOString(),
      notes: data.notes || '',
    })
  }, [isValid, onSubmit])

  /**
   * 格式化显示的日期时间
   */
  const formatDisplayDateTime = useCallback(() => {
    if (!watchedDueDate || !watchedDueTime) return ''

    try {
      const date = new Date(`${watchedDueDate}T${watchedDueTime}:00`)
      return format(date, 'MM月dd日 HH:mm')
    } catch {
      return ''
    }
  }, [watchedDueDate, watchedDueTime])

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h4 className="font-medium">设置下次跟进</h4>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={disabled}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 快捷日期选择 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">快速选择</label>
          <div className="flex flex-wrap gap-2">
            {QUICK_DATE_OPTIONS.map((option) => (
              <Button
                key={option.days}
                type="button"
                variant={selectedQuickDate === option.days ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickDateSelect(option.days)}
                disabled={disabled}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 日期时间选择 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">日期</label>
            <input
              type="date"
              {...register('dueDate')}
              onChange={(e) => handleCustomDateChange(e.target.value)}
              className={cn(
                'w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors',
                'file:border-0 file:bg-transparent file:text-sm file:font-medium',
                'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              disabled={disabled}
            />
            {errors.dueDate && (
              <p className="text-sm text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">时间</label>
            <div className="space-y-2">
              <input
                type="time"
                {...register('dueTime')}
                className={cn(
                  'w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors',
                  'file:border-0 file:bg-transparent file:text-sm file:font-medium',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
                disabled={disabled}
              />

              {/* 常用时间快捷选择 */}
              <div className="flex flex-wrap gap-1">
                {TIME_OPTIONS.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={watchedDueTime === time ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleTimeSelect(time)}
                    disabled={disabled}
                    className="h-6 px-2 text-xs"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
            {errors.dueTime && (
              <p className="text-sm text-destructive">{errors.dueTime.message}</p>
            )}
          </div>
        </div>

        {/* 选中时间预览 */}
        {watchedDueDate && watchedDueTime && (
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              将在 {formatDisplayDateTime()} 提醒您
            </span>
          </div>
        )}

        {/* 备注输入 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">备注说明</label>
          <textarea
            {...register('notes')}
            placeholder="可选：添加下次跟进的要点或准备事项..."
            className={cn(
              'w-full min-h-[60px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            disabled={disabled}
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground text-right">
            {watchedNotes?.length || 0}/500
          </div>
          {errors.notes && (
            <p className="text-sm text-destructive">{errors.notes.message}</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={disabled}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit(handleFormSubmit)}
            disabled={!isValid || disabled}
          >
            确认设置
          </Button>
        </div>
      </div>
    </Card>
  )
}
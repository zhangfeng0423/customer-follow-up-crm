/**
 * FileUpload组件
 * 文件上传组件，支持拖拽和点击上传
 */

'use client'

import * as React from 'react'
import { useCallback, useState } from 'react'
import { Paperclip, X, File as FileIcon, Image, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn, formatFileSize } from '@/lib/utils'

/**
 * 文件上传组件Props接口
 */
export interface FileUploadProps {
  /** 已上传的文件列表 */
  files: File[]
  /** 文件变更回调函数 */
  onFilesChange: (files: File[]) => void
  /** 最大文件数量 */
  maxFiles?: number
  /** 最大文件大小（字节） */
  maxFileSize?: number
  /** 允许的文件类型 */
  accept?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * 文件上传组件
 *
 * @param props 组件属性
 * @returns {JSX.Element} 文件上传组件
 */
export function FileUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt',
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  /**
   * 验证文件
   */
  const validateFile = useCallback((file: File): string | null => {
    // 检查文件大小
    if (file.size > maxFileSize) {
      return `文件 ${file.name} 大小超过限制 (${formatFileSize(maxFileSize)})`
    }

    // 检查文件类型
    if (accept && accept !== '*') {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          // 文件扩展名检查
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        } else {
          // MIME类型检查
          if (type.endsWith('/*')) {
            const baseType = type.split('/*')[0]
            return file.type.startsWith(baseType)
          }
          return file.type === type
        }
      })

      if (!isAccepted) {
        return `文件 ${file.name} 类型不被支持`
      }
    }

    return null
  }, [maxFileSize, accept])

  /**
   * 处理文件选择
   */
  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const filesArray = Array.from(newFiles)
    const validFiles: File[] = []
    const errors: string[] = []

    // 检查文件数量限制
    if (files.length + filesArray.length > maxFiles) {
      errors.push(`最多只能上传 ${maxFiles} 个文件`)
      setUploadError(errors.join(', '))
      return
    }

    // 验证每个文件
    filesArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      setUploadError(errors.join(', '))
      setTimeout(() => setUploadError(null), 5000)
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles])
      setUploadError(null)
    }
  }, [files, maxFiles, validateFile, onFilesChange])

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  /**
   * 处理拖拽经过
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  /**
   * 处理文件放置
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }, [disabled, handleFiles])

  /**
   * 处理文件输入变化
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = ''
  }, [handleFiles])

  /**
   * 移除文件
   */
  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }, [files, onFilesChange])

  /**
   * 获取文件图标
   */
  const getFileIcon = useCallback((file: File) => {
    const fileType = file.type.toLowerCase()
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-primary" />
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-primary/80" />
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-4 w-4 text-primary/60" />
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileText className="h-4 w-4 text-primary/40" />
    } else {
      return <FileIcon className="h-4 w-4 text-muted-foreground" />
    }
  }, [])

  /**
   * 点击上传区域
   */
  const handleUploadClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  return (
    <div className={cn('space-y-3', className)}>
      {/* 文件上传区域 */}
      {files.length < maxFiles && (
        <Card
          className={cn(
            'border-2 border-dashed transition-colors cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <div className="p-6 text-center">
            <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">
              点击或拖拽文件到此处上传
            </p>
            <p className="text-xs text-muted-foreground">
              支持图片、PDF、Word、Excel等文件，最大 {formatFileSize(maxFileSize)}
            </p>
          </div>
        </Card>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInputChange}
        disabled={disabled}
        className="hidden"
      />

      {/* 错误提示 */}
      {uploadError && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {uploadError}
        </div>
      )}

      {/* 已上传文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">已上传文件 ({files.length}/{maxFiles})</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={disabled}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
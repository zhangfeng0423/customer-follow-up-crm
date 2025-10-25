/**
 * UI工具函数
 * 提供类名合并、条件样式等通用功能
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并Tailwind CSS类名
 * 解决类名冲突问题
 *
 * @param inputs 类名数组
 * @returns {string} 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期为相对时间
 *
 * @param date 日期对象或ISO字符串
 * @returns {string} 相对时间字符串
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return diffInMinutes <= 1 ? '刚刚' : `${diffInMinutes}分钟前`
    }
    return `${diffInHours}小时前`
  } else if (diffInDays === 1) {
    return '昨天'
  } else if (diffInDays < 7) {
    return `${diffInDays}天前`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks}周前`
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `${months}个月前`
  } else {
    const years = Math.floor(diffInDays / 365)
    return `${years}年前`
  }
}

/**
 * 格式化日期为本地字符串
 *
 * @param date 日期对象或ISO字符串
 * @param options 格式化选项
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  }

  return targetDate.toLocaleDateString('zh-CN', defaultOptions)
}

/**
 * 格式化日期时间为本地字符串
 *
 * @param date 日期对象或ISO字符串
 * @param options 格式化选项
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }

  return targetDate.toLocaleString('zh-CN', defaultOptions)
}

/**
 * 格式化文件大小
 *
 * @param bytes 文件大小（字节）
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 检查是否为图片文件
 *
 * @param fileType 文件类型
 * @returns {boolean} 是否为图片
 */
export function isImageFile(fileType: string): boolean {
  return fileType === 'image'
}

/**
 * 检查是否为PDF文件
 *
 * @param fileType 文件类型
 * @returns {boolean} 是否为PDF
 */
export function isPdfFile(fileType: string): boolean {
  return fileType === 'pdf'
}

/**
 * 获取文件扩展名
 *
 * @param fileName 文件名
 * @returns {string} 文件扩展名
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

/**
 * 防抖函数
 *
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
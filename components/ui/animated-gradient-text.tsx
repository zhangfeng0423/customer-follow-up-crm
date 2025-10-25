/**
 * 渐变文字组件
 * 动态渐变文字效果
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * 渐变文字Props接口
 */
export interface AnimatedGradientTextProps {
  children: React.ReactNode
  className?: string
  duration?: number
}

/**
 * 渐变文字组件
 *
 * @param props 组件属性
 * @returns {JSX.Element} 渐变文字组件
 */
export function AnimatedGradientText({
  children,
  className,
  duration = 8
}: AnimatedGradientTextProps) {
  return (
    <div
      className={cn(
        'animate-gradient bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent',
        className
      )}
      style={{
        backgroundSize: '200% 200%',
        animation: `gradient ${duration}s ease infinite`,
      }}
    >
      {children}
    </div>
  )
}
/**
 * 翻转文字组件
 * 类似 Aceternity UI 的翻转文字效果
 */

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * 翻转文字Props接口
 */
export interface FlipWordsProps {
  words: string[]
  duration?: number
  className?: string
  as?: keyof React.JSX.IntrinsicElements
}

/**
 * 翻转文字组件
 *
 * @param props 组件属性
 * @returns {JSX.Element} 翻转文字组件
 */
export function FlipWords({
  words,
  duration = 2000,
  className,
  as: Component = 'span'
}: FlipWordsProps) {
  const [mounted, setMounted] = React.useState(false)
  const [currentWordIndex, setCurrentWordIndex] = React.useState(0)
  // const [isAnimating, setIsAnimating] = React.useState(false)

  // 避免服务端渲染不匹配
  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return

    const interval = setInterval(() => {
      // setIsAnimating(true)
      setTimeout(() => {
        setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length)
        // setIsAnimating(false)
      }, 150) // 翻转动画时间
    }, duration)

    return () => clearInterval(interval)
  }, [words, duration, mounted])

  const currentWord = words[currentWordIndex]

  // 在服务端渲染时显示第一个单词，避免hydration不匹配
  if (!mounted) {
    return (
      <Component className={cn('inline-block', className)}>
        <span>{words[0] || ''}</span>
      </Component>
    )
  }

  return (
    <Component className={cn('inline-block', className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentWord}
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{
            opacity: 1,
            y: 0,
            rotateX: 0,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 30,
              duration: 0.6
            }
          }}
          exit={{
            opacity: 0,
            y: -50,
            rotateX: 90,
            transition: {
              duration: 0.3
            }
          }}
          style={{
            display: 'inline-block',
            perspective: '1000px'
          }}
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>
    </Component>
  )
}
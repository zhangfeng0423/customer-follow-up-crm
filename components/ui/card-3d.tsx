/**
 * 3D卡片组件
 * 基于 Framer Motion 的3D悬停效果
 */

'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * 3D卡片Props接口
 */
export interface Card3DProps {
  children: React.ReactNode
  className?: string
  intensity?: number
}

/**
 * 3D卡片组件
 *
 * @param props 组件属性
 * @returns {JSX.Element} 3D卡片组件
 */
export function Card3D({ children, className, intensity = 20 }: Card3DProps) {
  const [rotate, setRotate] = React.useState({ x: 0, y: 0 })

  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setRotate({
      x: (y - 0.5) * intensity,
      y: (x - 0.5) * -intensity
    })
  }, [intensity])

  const handleMouseLeave = React.useCallback(() => {
    setRotate({ x: 0, y: 0 })
  }, [])

  return (
    <motion.div
      className={cn("transform-gpu", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotate.x,
        rotateY: rotate.y,
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {children}
    </motion.div>
  )
}
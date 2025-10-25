/**
 * 简化版本的主题切换组件
 * 支持手动切换和基于时间的自动切换
 */

'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

/**
 * 主题切换组件
 * 支持手动切换和基于时间的自动切换
 *
 * @returns {JSX.Element} 主题切换组件
 */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isAutoMode, setIsAutoMode] = React.useState(false)

  // 默认配置
  const [autoConfig, setAutoConfig] = React.useState({
    dayStartHour: 7,
    nightStartHour: 19,
  })

  // 避免服务端渲染不匹配
  React.useEffect(() => {
    setMounted(true)

    // 从本地存储读取配置
    try {
      const stored = localStorage.getItem('crm-auto-theme-config')
      if (stored) {
        const config = JSON.parse(stored)
        setAutoConfig(config)
        setIsAutoMode(config.enabled !== false)
      }
    } catch (error) {
      console.warn('读取主题配置失败:', error)
    }
  }, [])

  // 自动主题切换逻辑
  React.useEffect(() => {
    if (!mounted || !isAutoMode) return

    const checkAndSwitchTheme = () => {
      const currentHour = new Date().getHours()
      const expectedTheme = currentHour >= autoConfig.dayStartHour && currentHour < autoConfig.nightStartHour ? 'light' : 'dark'

      if (resolvedTheme !== expectedTheme) {
        setTheme(expectedTheme)
      }
    }

    // 立即检查一次
    checkAndSwitchTheme()

    // 设置定时器，每分钟检查一次
    const interval = setInterval(checkAndSwitchTheme, 60000)

    return () => clearInterval(interval)
  }, [mounted, isAutoMode, autoConfig, resolvedTheme, setTheme])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">加载主题</span>
      </Button>
    )
  }

  const handleThemeToggle = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
    // 手动切换时关闭自动模式
    setIsAutoMode(false)
    try {
      localStorage.setItem('crm-auto-theme-config', JSON.stringify({ ...autoConfig, enabled: false }))
    } catch (error) {
      console.warn('保存主题配置失败:', error)
    }
  }

  const toggleAutoMode = () => {
    const newAutoMode = !isAutoMode
    setIsAutoMode(newAutoMode)
    try {
      localStorage.setItem('crm-auto-theme-config', JSON.stringify({ ...autoConfig, enabled: newAutoMode }))
    } catch (error) {
      console.warn('保存主题配置失败:', error)
    }
  }

  const getCurrentHour = () => new Date().getHours()
  const getExpectedTheme = () => {
    const hour = getCurrentHour()
    return hour >= autoConfig.dayStartHour && hour < autoConfig.nightStartHour ? 'light' : 'dark'
  }

  return (
    <div className="flex items-center gap-2">
      {/* 自动模式切换按钮 */}
      <Button
        variant={isAutoMode ? 'default' : 'outline'}
        size="sm"
        onClick={toggleAutoMode}
        className="text-xs"
      >
        {isAutoMode ? '自动模式' : '手动模式'}
      </Button>

      {/* 主题切换按钮 */}
      <Button variant="outline" size="icon" onClick={handleThemeToggle} title="切换主题">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">切换主题</span>
      </Button>

      {/* 自动模式状态显示 */}
      {isAutoMode && (
        <div className="text-xs text-muted-foreground">
          {getCurrentHour()}:00 → {getExpectedTheme() === 'dark' ? '夜间' : '白天'}模式
        </div>
      )}
    </div>
  )
}
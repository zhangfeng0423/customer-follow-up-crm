/**
 * 自动主题切换Hook
 * 根据系统主题和时间自动切换主题
 */

'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

/**
 * 自动主题切换配置
 */
interface AutoThemeConfig {
  /** 是否启用自动切换 */
  enabled: boolean
  /** 白天模式开始时间（小时，24小时制） */
  dayStartHour: number
  /** 夜间模式开始时间（小时，24小时制） */
  nightStartHour: number
  /** 是否跟随系统主题 */
  followSystem: boolean
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: AutoThemeConfig = {
  enabled: true,
  dayStartHour: 7, // 早上7点切换到白天模式
  nightStartHour: 19, // 晚上7点切换到夜间模式
  followSystem: true,
}

/**
 * 获取当前小时
 */
const getCurrentHour = (): number => {
  return new Date().getHours()
}

/**
 * 根据时间确定应该使用的主题
 */
const getThemeByTime = (hour: number): 'light' | 'dark' => {
  return hour >= 7 && hour < 19 ? 'light' : 'dark'
}

/**
 * 本地存储键名
 */
const STORAGE_KEYS = {
  autoThemeConfig: 'crm-auto-theme-config',
  lastAutoSwitch: 'crm-last-auto-switch',
} as const

/**
 * 自动主题切换Hook
 *
 * @param userConfig 用户配置
 * @returns 主题切换相关状态和方法
 */
export function useAutoTheme(userConfig: Partial<AutoThemeConfig> = {}) {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [config, setConfig] = React.useState<AutoThemeConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.autoThemeConfig)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...DEFAULT_CONFIG, ...parsed, ...userConfig }
      }
    } catch (error) {
      console.warn('读取自动主题配置失败:', error)
    }

    return { ...DEFAULT_CONFIG, ...userConfig }
  })

  const [isAutoMode, setIsAutoMode] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.autoThemeConfig)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.enabled !== false
      }
    } catch (error) {
      console.warn('读取自动模式状态失败:', error)
    }

    return true
  })

  // 避免服务端渲染不匹配
  React.useEffect(() => {
    setMounted(true)
  }, [])

  /**
   * 保存配置到本地存储
   */
  const saveConfig = React.useCallback((newConfig: AutoThemeConfig) => {
    try {
      localStorage.setItem(STORAGE_KEYS.autoThemeConfig, JSON.stringify(newConfig))
    } catch (error) {
      console.warn('保存自动主题配置失败:', error)
    }
  }, [])

  /**
   * 更新配置
   */
  const updateConfig = React.useCallback((newConfig: Partial<AutoThemeConfig>) => {
    const updatedConfig = { ...config, ...newConfig }
    setConfig(updatedConfig)
    saveConfig(updatedConfig)
  }, [config, saveConfig])

  /**
   * 切换自动模式
   */
  const toggleAutoMode = React.useCallback(() => {
    const newAutoMode = !isAutoMode
    setIsAutoMode(newAutoMode)
    updateConfig({ enabled: newAutoMode })
  }, [isAutoMode, updateConfig])

  /**
   * 手动设置主题（会暂时禁用自动模式）
   */
  const manualSetTheme = React.useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    // 如果用户手动切换，暂时禁用自动模式
    if (isAutoMode && newTheme !== 'system') {
      setIsAutoMode(false)
      updateConfig({ enabled: false })
    }
  }, [setTheme, isAutoMode, updateConfig])

  /**
   * 自动主题切换逻辑
   */
  React.useEffect(() => {
    if (!mounted || !isAutoMode || !config.enabled) return

    const checkAndSwitchTheme = () => {
      const currentHour = getCurrentHour()
      const expectedTheme = getThemeByTime(currentHour)

      // 检查当前主题是否与期望主题一致
      const currentTheme = resolvedTheme as 'light' | 'dark' | undefined
      if (currentTheme && currentTheme !== expectedTheme) {
        setTheme(expectedTheme)

        // 记录自动切换时间
        try {
          localStorage.setItem(STORAGE_KEYS.lastAutoSwitch, JSON.stringify({
            timestamp: Date.now(),
            from: currentTheme,
            to: expectedTheme,
            hour: currentHour,
          }))
        } catch (error) {
          console.warn('记录自动切换失败:', error)
        }
      }
    }

    // 立即检查一次
    checkAndSwitchTheme()

    // 设置定时器，每分钟检查一次
    const interval = setInterval(checkAndSwitchTheme, 60000)

    return () => clearInterval(interval)
  }, [mounted, isAutoMode, config.enabled, setTheme, resolvedTheme])

  /**
   * 监听系统主题变化（如果启用跟随系统）
   */
  React.useEffect(() => {
    if (!mounted || !config.followSystem || !isAutoMode) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      // 只有在当前时间适合跟随系统时才切换
      const currentHour = getCurrentHour()
      const timeBasedTheme = getThemeByTime(currentHour)
      const systemPreferredTheme = e.matches ? 'dark' : 'light'

      // 如果系统偏好与当前时间偏好一致，则跟随系统
      if (timeBasedTheme === systemPreferredTheme) {
        setTheme(systemPreferredTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mounted, config.followSystem, isAutoMode, setTheme])

  return {
    // 主题相关
    theme,
    resolvedTheme,
    systemTheme,
    setTheme: manualSetTheme,

    // 自动模式相关
    isAutoMode,
    config,
    updateConfig,
    toggleAutoMode,

    // 工具方法
    getCurrentHour,
    getThemeByTime,
  }
}
/**
 * ThemeWrapper组件
 * 解决next-themes在服务端渲染时的hydration问题
 */

'use client'

import * as React from 'react'

interface ThemeWrapperProps {
  children: React.ReactNode
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // 在客户端挂载前，不渲染任何可能导致hydration不匹配的内容
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
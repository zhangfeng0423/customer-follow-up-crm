/**
 * 全局Provider组件
 * 提供React Query等全局状态管理
 */

'use client'

import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from 'next-themes'

/**
 * 创建React Query客户端实例
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 在生产环境中设置更长的重试间隔
      retry: (failureCount, error) => {
        // 对于4xx错误不重试
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number
          if (status >= 400 && status < 500) {
            return false
          }
        }
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 10 * 60 * 1000, // 10分钟
    },
    mutations: {
      retry: false,
    },
  },
})

/**
 * 主题Provider包装器，避免hydration错误
 */
function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // 在服务端渲染或客户端未挂载时，返回原始children
    return <>{children}</>
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="crm-theme"
    >
      {children}
    </ThemeProvider>
  )
}

/**
 * Provider组件Props接口
 */
interface ProvidersProps {
  children: React.ReactNode
}

/**
 * 全局Provider组件
 *
 * @param props 组件属性
 * @returns {JSX.Element} Provider组件
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProviderWrapper>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProviderWrapper>
  )
}
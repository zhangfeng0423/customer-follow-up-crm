/**
 * 客户详情页面
 * 符合PRD设计的对话流式客户跟进记录界面
 */

'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Building, Mail, Phone, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TimelineView } from '@/components/followup/TimelineView'
import { InlineFollowUpInput } from '@/components/followup/InlineFollowUpInput'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  CustomerDetail,
  FollowUpRecordResponse,
  CreateFollowUpRequest,
} from '@/lib/types/followup'
import { useRouter } from 'next/navigation'


/**
 * 获取客户详情的查询键
 */
const getCustomerQueryKey = (customerId: string) => ['customer', customerId]

/**
 * 获取跟进记录的查询键
 */
const getFollowUpsQueryKey = (customerId: string) => ['followups', customerId]

/**
 * 获取客户详情数据
 */
const fetchCustomerDetail = async (customerId: string): Promise<CustomerDetail> => {
  const response = await fetch(`/api/customers/${customerId}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('客户不存在')
    }
    throw new Error('获取客户详情失败')
  }

  const result = await response.json()
  return result.data
}

/**
 * 获取跟进记录数据
 */
const fetchFollowUpRecords = async (customerId: string): Promise<FollowUpRecordResponse[]> => {
  const response = await fetch(`/api/customers/${customerId}/followups`)

  if (!response.ok) {
    throw new Error('获取跟进记录失败')
  }

  const result = await response.json()
  return result.data
}

/**
 * 创建跟进记录
 */
const createFollowUpRecord = async (data: CreateFollowUpRequest): Promise<void> => {
  const response = await fetch(`/api/customers/${data.customerId}/followups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '创建跟进记录失败')
  }
}

/**
 * 客户详情页面组件
 *
 * @param props 页面属性
 * @returns {JSX.Element} 客户详情页面
 */
export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = React.use(params)
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 获取客户详情
  const {
    data: customer,
    error: customerError,
  } = useQuery({
    queryKey: getCustomerQueryKey(customerId),
    queryFn: () => fetchCustomerDetail(customerId),
    enabled: !!customerId,
  })

  // 获取跟进记录
  const {
    data: followUpRecords = [],
    isLoading: isLoadingFollowUps,
    error: followUpsError,
  } = useQuery({
    queryKey: getFollowUpsQueryKey(customerId),
    queryFn: () => fetchFollowUpRecords(customerId),
    enabled: !!customerId,
  })

  // 创建跟进记录的mutation
  const createFollowUpMutation = useMutation({
    mutationFn: createFollowUpRecord,
    onSuccess: () => {
      // 刷新跟进记录列表
      queryClient.invalidateQueries({ queryKey: getFollowUpsQueryKey(customerId) })

      toast({
        title: '成功',
        description: '跟进记录已创建',
      })
    },
    onError: (error: Error) => {
      console.error('创建跟进记录失败:', error)
      toast({
        title: '错误',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // 处理创建跟进记录
  const handleCreateFollowUp = React.useCallback(async (data: CreateFollowUpRequest) => {
    await createFollowUpMutation.mutateAsync(data)
  }, [createFollowUpMutation])

  // 处理返回按钮点击
  const handleBackClick = React.useCallback(() => {
    router.back()
  }, [router])

  // 处理客户不存在的情况
  React.useEffect(() => {
    if (customerError && customerError.message === '客户不存在') {
      // 自动重定向到第一个可用客户
      const redirectToFirstCustomer = async () => {
        try {
          const response = await fetch('/api/customers/first')
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data.id !== customerId) {
              router.replace(`/customers/${result.data.id}`)
              return
            }
          }
        } catch (error) {
          console.error('获取第一个客户失败:', error)
        }
        // 如果无法获取第一个客户，重定向到客户列表
        router.replace('/customers')
      }

      redirectToFirstCustomer()
    }
  }, [customerError, customerId, router])

  // 处理其他错误状态
  if (customerError || followUpsError) {
    // 如果是客户不存在错误，显示加载状态而不是错误页面
    if (customerError?.message === '客户不存在') {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
              <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
              <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
            </div>
            <p className="text-muted-foreground mt-4">
              正在为您重定向到可用客户...
            </p>
          </div>
        </div>
      )
    }

    // 其他错误的处理
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            加载失败
          </h2>
          <p className="text-muted-foreground mb-4">
            {customerError?.message || followUpsError?.message || '未知错误'}
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleBackClick} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <Button onClick={() => window.location.reload()} variant="default">
              重试
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 主题切换按钮 */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* 页面头部 */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 返回按钮和客户信息 */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">返回</span>
              </Button>

              {customer && (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {customer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-lg font-semibold">{customer.name}</h1>
                    {customer.companyInfo && (
                      <p className="text-sm text-muted-foreground">
                        {customer.companyInfo}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 统计信息 */}
            {customer && (
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{customer._count.followUpRecords} 次跟进</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{customer._count.nextStepPlans} 个待办</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧边栏 - 客户信息 */}
          <div className="lg:col-span-1">
            {customer ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">客户信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 基本信息 */}
                  <div className="space-y-3">
                    {customer.companyInfo && (
                      <div className="flex items-start space-x-3">
                        <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="text-sm">{customer.companyInfo}</div>
                      </div>
                    )}

                    {customer.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="text-sm">{customer.email}</div>
                      </div>
                    )}

                    {customer.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="text-sm">{customer.phone}</div>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="text-sm">{customer.address}</div>
                      </div>
                    )}
                  </div>

                  {/* 负责人信息 */}
                  <div className="pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-2">负责人</div>
                    {customer.user ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-xs">
                            {customer.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{customer.user.name}</div>
                          <div className="text-xs text-muted-foreground">{customer.user.email}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">未分配</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧主要内容 - 跟进记录 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 内联输入区域 */}
            {customer && (
              <InlineFollowUpInput
                customerId={customer.id}
                onSubmit={handleCreateFollowUp}
                disabled={createFollowUpMutation.isPending}
                autoFocus={true}
              />
            )}

            {/* 时间轴区域 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">跟进记录</h2>
              <TimelineView
                followUpRecords={followUpRecords}
                isLoading={isLoadingFollowUps}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Toast消息容器 */}
      <Toaster />
    </div>
  )
}
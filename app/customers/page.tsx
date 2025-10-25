/**
 * 客户列表页面
 * 从数据库获取真实客户数据的服务器组件
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Card3D } from '@/components/ui/card-3d'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Building, Users, ArrowRight, Calendar } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { format, differenceInDays, isToday, isYesterday, isTomorrow, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
// import type { Customer as PrismaCustomer, User } from '@/app/generated/prisma'

/**
 * 客户查询结果类型
 */
// type CustomerWithRelations = PrismaCustomer & {
//   user?: User | null
//   _count: {
//     followUpRecords: number
//     nextStepPlans: number
//   }
//   latestFollowUpRecord?: {
//     id: string
//     createdAt: Date
//     content: string
//     followUpType: string
//   } | null
// }

/**
 * 客户数据类型
 */
interface Customer {
  id: string
  name: string
  companyInfo: string | null
  email: string | null
  phone: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string | null
  } | null
  _count: {
    followUpRecords: number
    nextStepPlans: number
  }
  latestFollowUpRecord?: {
    id: string
    createdAt: string
    content: string
    followUpType: string
  } | null
}

/**
 * 格式化跟进日期显示
 * 返回相对今天的描述
 */
function formatFollowUpDate(dateString: string): { text: string; color: string } {
  const date = new Date(dateString)
  const today = startOfDay(new Date())
  const followUpDate = startOfDay(date)
  const daysDiff = differenceInDays(followUpDate, today)

  if (isToday(date)) {
    return { text: '今天', color: 'text-green-600 dark:text-green-400' }
  }

  if (isYesterday(date)) {
    return { text: '昨天', color: 'text-orange-600 dark:text-orange-400' }
  }

  if (isTomorrow(date)) {
    return { text: '明天', color: 'text-blue-600 dark:text-blue-400' }
  }

  if (daysDiff > 0) {
    return {
      text: `${daysDiff}天后`,
      color: 'text-blue-600 dark:text-blue-400'
    }
  }

  if (daysDiff < 0) {
    const absDays = Math.abs(daysDiff)
    return {
      text: `${absDays}天前`,
      color: 'text-red-600 dark:text-red-400'
    }
  }

  return {
    text: format(date, 'MM月dd日', { locale: zhCN }),
    color: 'text-muted-foreground'
  }
}

/**
 * 获取所有客户数据（暂时显示所有客户，包括公共客户和私有客户）
 */
async function getCustomers(): Promise<Customer[]> {
  try {
    // 暂时显示所有客户（包括 userId 为 null 的公共客户和有 userId 的私有客户）
    const customers = await prisma.customer.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            followUpRecords: true,
            nextStepPlans: true,
          },
        },
        followUpRecords: {
          select: {
            id: true,
            createdAt: true,
            content: true,
            followUpType: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    const mappedCustomers = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      companyInfo: customer.companyInfo,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      user: customer.user,
      _count: customer._count,
      latestFollowUpRecord: customer.followUpRecords[0] ? {
        id: customer.followUpRecords[0].id,
        createdAt: customer.followUpRecords[0].createdAt.toISOString(),
        content: customer.followUpRecords[0].content,
        followUpType: customer.followUpRecords[0].followUpType,
      } : null,
      // 添加排序权重：有跟进记录的按跟进时间排序，没有的按创建时间排序
      sortKey: customer.followUpRecords[0]
        ? customer.followUpRecords[0].createdAt.getTime()
        : new Date(0).getTime(), // 用一个很早的时间表示没有跟进记录
    }))

    // 按跟进时间排序，最新的在前
    return mappedCustomers.sort((a, b) => {
      // 如果都有跟进记录，按跟进时间排序
      if (a.latestFollowUpRecord && b.latestFollowUpRecord) {
        return new Date(b.latestFollowUpRecord.createdAt).getTime() - new Date(a.latestFollowUpRecord.createdAt).getTime()
      }
      // 如果只有A有跟进记录，A排前面
      if (a.latestFollowUpRecord && !b.latestFollowUpRecord) {
        return -1
      }
      // 如果只有B有跟进记录，B排前面
      if (!a.latestFollowUpRecord && b.latestFollowUpRecord) {
        return 1
      }
      // 如果都没有跟进记录，按创建时间排序
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  } catch (error) {
    console.error('获取客户列表失败:', error)
    return []
  }
}

/**
 * 客户列表页面
 *
 * @returns {JSX.Element} 客户列表页面
 */
export default async function CustomersPage() {
  const customers = await getCustomers()

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
      {/* 主题切换按钮 */}
      <div className="fixed top-3 sm:top-4 right-3 sm:right-4 z-50">
        <ThemeToggle />
      </div>

      {/* 页面头部 */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">客户管理</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
          <Calendar className="h-4 w-4 text-muted-foreground hidden sm:inline" />
          <p className="text-sm text-muted-foreground">
            按最近跟进时间排序 - 最新的跟进记录排在前面
          </p>
        </div>
      </div>

      {/* 客户列表 */}
      {customers.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="mb-4">
            <Building className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2">暂无客户</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            开始添加您的第一个客户吧
          </p>
          <Link href="/customers/new">
            <Button size="sm" className="sm:size-default">
              添加客户
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {customers.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card3D>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm sm:text-base">
                            {customer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">{customer.name}</CardTitle>
                          {customer.companyInfo && (
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center truncate">
                              <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{customer.companyInfo}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4 flex flex-col">
                    {/* 联系信息 */}
                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm min-h-[32px] sm:min-h-[40px]">
                      {customer.email && (
                        <div className="text-muted-foreground truncate">{customer.email}</div>
                      )}
                      {customer.phone && (
                        <div className="text-muted-foreground truncate">{customer.phone}</div>
                      )}
                      {!customer.email && !customer.phone && (
                        <div className="text-muted-foreground text-xs">联系方式未提供</div>
                      )}
                    </div>

                    {/* 最近跟进信息 */}
                    <div className="flex-1">
                      {customer.latestFollowUpRecord ? (
                        <div className="bg-muted/50 rounded-lg p-2 sm:p-3 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                <span className="text-xs sm:text-sm font-medium">最近跟进</span>
                              </div>
                              <span className={`text-xs font-medium ${formatFollowUpDate(customer.latestFollowUpRecord.createdAt).color}`}>
                                {formatFollowUpDate(customer.latestFollowUpRecord.createdAt).text}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-3 min-h-[24px] sm:min-h-[36px]">
                              {customer.latestFollowUpRecord.content}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 sm:mt-2">
                            {format(new Date(customer.latestFollowUpRecord.createdAt), 'HH:mm', { locale: zhCN })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 sm:py-6 bg-muted/30 rounded-lg h-full flex flex-col items-center justify-center">
                          <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-1 sm:mb-2" />
                          <p className="text-xs sm:text-sm text-muted-foreground">暂无跟进记录</p>
                        </div>
                      )}
                    </div>

                    {/* 统计信息 */}
                    <div className="flex items-center justify-between text-xs sm:text-sm min-h-[28px] sm:min-h-[32px]">
                      <div className="flex items-center space-x-3 sm:space-x-4 text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden xs:inline">{customer._count.followUpRecords} 次跟进</span>
                          <span className="xs:hidden">{customer._count.followUpRecords}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="h-2 w-2 bg-primary rounded-full" />
                          <span className="hidden xs:inline">{customer._count.nextStepPlans} 个待办</span>
                          <span className="xs:hidden">{customer._count.nextStepPlans}</span>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮区域 - 只显示负责人信息 */}
                    <div className="flex justify-between items-center pt-2 border-t min-h-[32px] sm:min-h-[40px]">
                      <div className="text-xs text-muted-foreground truncate flex-1 mr-2">
                        <span className="hidden sm:inline">负责人: </span>
                        {customer.user?.name || '未分配'}
                      </div>
                      <div className="text-primary flex-shrink-0">
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Card3D>
            </Link>
          ))}
        </div>
      )}

      {/* 添加新客户按钮（固定在右下角） */}
      <div className="fixed bottom-6 sm:bottom-8 right-6 sm:right-8">
        <Link href="/customers/new">
          <Button size="lg" className="rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 text-xl sm:text-2xl">
            <span>+</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
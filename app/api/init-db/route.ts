/**
 * 数据库初始化 API 端点
 * 用于在生产环境创建初始数据
 * 包含三重安全保护：密钥验证、幂等性检查、时间窗口限制
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, FollowUpType, UserRole, PlanStatus } from '../../../app/generated/prisma'

// 创建 Prisma 客户端实例
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

/**
 * 安全检查1：验证初始化密钥
 */
async function validateSecretKey(request: NextRequest): Promise<boolean> {
  const { searchParams } = new URL(request.url)
  let secret = searchParams.get('secret')

  // 如果URL参数中没有密钥，尝试从请求体中获取（支持POST方式）
  if (!secret && request.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = await request.json()
      secret = body?.secret
    } catch {
      // 忽略JSON解析错误
    }
  }

  const expectedSecret = process.env.SEED_SECRET || 'init-database-2024'
  return secret === expectedSecret
}

/**
 * 安全检查2：幂等性检查 - 验证数据库是否已初始化
 */
async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const existingUser = await prisma.user.findFirst({
      where: { email: 'wanglei@company.com' },
    })
    return !!existingUser
  } catch (error) {
    console.error('检查数据库初始化状态失败:', error)
    return false
  }
}

/**
 * 安全检查3：时间窗口限制
 */
function isValidTimeWindow(): boolean {
  // 检查是否在部署后的合理时间窗口内（1小时）
  const deployTime = process.env.VERCEL_DEPLOYMENT_TIME
    ? new Date(process.env.VERCEL_DEPLOYMENT_TIME).getTime()
    : Date.now() // 如果没有部署时间信息，使用当前时间

  const currentTime = Date.now()
  const oneHour = 60 * 60 * 1000 // 1小时的毫秒数

  return (currentTime - deployTime) <= oneHour
}

/**
 * 执行数据库初始化的核心逻辑
 */
async function performInitialization(): Promise<NextResponse> {
  try {
    console.log('🚀 开始安全初始化生产环境数据库...')

    // 创建默认销售用户
    const salesUser = await prisma.user.upsert({
      where: { email: 'wanglei@company.com' },
      update: {},
      create: {
        name: '王磊',
        email: 'wanglei@company.com',
        role: UserRole.SALES,
      },
    })

    console.log('✅ 创建默认用户:', salesUser.name)

    // 创建示例客户
    const customers = [
      {
        name: '张总',
        companyInfo: '远洋物流集团',
        email: 'zhang.yuan@yuanyang-logistics.com',
        phone: '+86-21-88886666',
        address: '上海市浦东新区世纪大道100号远洋大厦',
        userId: salesUser.id,
      },
      {
        name: '李经理',
        companyInfo: '科技创新有限公司',
        email: 'li.manager@techinnov.com.cn',
        phone: '+86-010-88887777',
        address: '北京市海淀区中关村大街1号科技大厦',
        userId: salesUser.id,
      },
      {
        name: '王董',
        companyInfo: '智能制造股份',
        email: 'wang.chairman@smartmfg.com',
        phone: '+86-0755-88885555',
        address: '深圳市南山区科技园路88号智能制造中心',
        userId: salesUser.id,
      },
      {
        name: '赵总监',
        companyInfo: '金融投资集团',
        email: 'zhao.director@finance-group.com',
        phone: '+86-021-88884444',
        address: '上海市静安区南京西路1266号恒隆广场',
        userId: salesUser.id,
      },
      {
        name: '陈总',
        companyInfo: '新能源科技',
        email: 'chen.ceo@newenergy-tech.com',
        phone: '+86-0755-88883333',
        address: '深圳市南山区高新技术产业园A座',
        userId: salesUser.id,
      },
    ]

    const createdCustomers = []
    for (const customerData of customers) {
      const customer = await prisma.customer.create({
        data: customerData,
      })
      createdCustomers.push(customer)
      console.log('✅ 创建客户:', customer.name)
    }

    // 为每个客户创建跟进记录
    for (const customer of createdCustomers) {
      const followUpRecords = [
        {
          content: '初步电话沟通，了解了客户的基本业务需求和当前使用CRM系统的情况。客户对我们的智能语音录入功能特别感兴趣，认为能大幅提升他们的工作效率。',
          followUpType: FollowUpType.PHONE_CALL,
          customerId: customer.id,
          userId: salesUser.id,
        },
        {
          content: '线上会议详细演示了完整的客户跟进流程，包括时间轴展示、附件上传和下一步计划设置。客户对对话流式的设计理念非常认可，认为这符合他们销售团队的使用习惯。',
          followUpType: FollowUpType.MEETING,
          customerId: customer.id,
          userId: salesUser.id,
        },
        {
          content: '上门拜访，实地了解了客户公司的业务流程和现有系统的痛点。针对他们提出的问题，我们提供了定制化的解决方案，特别是数据迁移和系统集成方面。',
          followUpType: FollowUpType.VISIT,
          customerId: customer.id,
          userId: salesUser.id,
        },
      ]

      for (const recordData of followUpRecords) {
        const record = await prisma.followUpRecord.create({
          data: recordData,
        })
        console.log('✅ 创建跟进记录:', record.followUpType)

        // 为拜访记录创建下一步计划
        if (recordData.followUpType === FollowUpType.VISIT) {
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + 7 + Math.floor(Math.random() * 14)) // 1-3周后

          await prisma.nextStepPlan.create({
            data: {
              dueDate: futureDate,
              notes: `准备${customer.companyInfo}的定制化方案和报价单，包括技术实施细节和时间计划。重点关注语音识别准确率和数据迁移方案。`,
              status: PlanStatus.PENDING,
              customerId: customer.id,
              userId: salesUser.id,
              followUpRecordId: record.id,
            },
          })
          console.log('✅ 创建下一步计划')
        }
      }
    }

    const result = {
      success: true,
      message: '✅ 生产环境数据库初始化完成！',
      data: {
        users: 1,
        customers: customers.length,
        followUpRecords: customers.length * 3,
        nextStepPlans: customers.length,
        defaultAccount: {
          email: 'wanglei@company.com',
          name: '王磊',
          role: 'SALES'
        }
      }
    }

    console.log('🎉 初始化结果:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)

    return NextResponse.json(
      {
        error: '数据库初始化失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * 处理数据库初始化请求（POST方式）
 */
export async function POST(request: NextRequest) {
  try {
    // 安全检查1：验证密钥
    if (!(await validateSecretKey(request))) {
      return NextResponse.json(
        { error: '未授权的初始化请求：缺少有效密钥' },
        { status: 401 }
      )
    }

    // 安全检查2：幂等性检查
    if (await isDatabaseInitialized()) {
      return NextResponse.json({
        message: '数据库已经初始化，跳过重复执行',
        status: 'already_initialized'
      })
    }

    // 安全检查3：时间窗口限制
    if (!isValidTimeWindow()) {
      return NextResponse.json(
        { error: '初始化请求已超时，请在部署后1小时内执行' },
        { status: 403 }
      )
    }

    // 执行初始化逻辑
    return await performInitialization()
  } catch (error) {
    console.error('❌ POST初始化请求失败:', error)
    return NextResponse.json(
      {
        error: '数据库初始化失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * 获取数据库状态或执行初始化（GET方式）
 */
export async function GET(request: NextRequest) {
  try {
    // 检查是否包含初始化参数
    const { searchParams } = new URL(request.url)
    const shouldInitialize = searchParams.has('secret')

    if (shouldInitialize) {
      // 执行初始化流程
      // 安全检查1：验证密钥
      if (!(await validateSecretKey(request))) {
        return NextResponse.json(
          { error: '未授权的初始化请求：缺少有效密钥' },
          { status: 401 }
        )
      }

      // 安全检查2：幂等性检查
      if (await isDatabaseInitialized()) {
        return NextResponse.json({
          message: '数据库已经初始化，跳过重复执行',
          status: 'already_initialized'
        })
      }

      // 安全检查3：时间窗口限制
      if (!isValidTimeWindow()) {
        return NextResponse.json(
          { error: '初始化请求已超时，请在部署后1小时内执行' },
          { status: 403 }
        )
      }

      // 执行初始化逻辑
      return await performInitialization()
    } else {
      // 仅返回数据库状态
      const userCount = await prisma.user.count()
      const customerCount = await prisma.customer.count()
      const followUpCount = await prisma.followUpRecord.count()
      const planCount = await prisma.nextStepPlan.count()

      return NextResponse.json({
        status: 'success',
        data: {
          users: userCount,
          customers: customerCount,
          followUpRecords: followUpCount,
          nextStepPlans: planCount,
          isEmpty: userCount === 0 && customerCount === 0,
          message: userCount === 0 ? '数据库为空，需要初始化' : '数据库已有数据'
        }
      })
    }
  } catch (error) {
    console.error('GET请求处理失败:', error)
    return NextResponse.json(
      { error: '请求处理失败' },
      { status: 500 }
    )
  }
}
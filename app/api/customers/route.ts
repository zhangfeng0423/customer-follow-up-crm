/**
 * 客户API路由
 *
 * GET: 获取客户列表
 * POST: 创建新客户
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, handleDatabaseError } from '@/lib/prisma'
import { UserRole } from '../../generated/prisma'

/**
 * 获取或创建默认用户
 * 确保客户创建时有有效的用户关联
 */
async function getOrCreateDefaultUser(): Promise<string> {
  try {
    // 首先尝试查找默认用户
    let user = await prisma.user.findFirst({
      where: { email: 'wanglei@company.com' }
    })

    // 如果用户不存在，创建默认用户
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: '王磊',
          email: 'wanglei@company.com',
          role: UserRole.SALES,
        }
      })
      console.log('✅ 创建默认用户:', user.name)
    }

    return user.id
  } catch (error) {
    console.error('获取或创建默认用户失败:', error)
    throw new Error('无法获取有效的用户ID')
  }
}

/**
 * 创建客户的请求体验证Schema
 */
const createCustomerSchema = z.object({
  name: z.string().min(1, '客户姓名不能为空').max(100, '客户姓名不能超过100个字符'),
  companyInfo: z.string().max(200, '公司信息不能超过200个字符').optional(),
  email: z.string().email('请输入有效的邮箱地址').max(100, '邮箱地址不能超过100个字符').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码').optional(),
  address: z.string().max(300, '地址不能超过300个字符').optional(),
})

/**
 * GET - 获取客户列表
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 计算偏移量
    const offset = (page - 1) * limit

    // 构建查询条件
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { companyInfo: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // 获取客户列表和总数
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
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
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: offset,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ])

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        customers: customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          companyInfo: customer.companyInfo,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          createdAt: customer.createdAt.toISOString(),
          updatedAt: customer.updatedAt.toISOString(),
          user: customer.user,
          followUpCount: customer._count.followUpRecords,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('获取客户列表失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error),
      },
      { status: 500 }
    )
  }
}

/**
 * POST - 创建新客户
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json()

    // 验证请求数据
    const validatedData = createCustomerSchema.parse(body)

    // 获取或创建默认用户ID
    const currentUserId = await getOrCreateDefaultUser()

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (validatedData.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { email: validatedData.email },
      })

      if (existingCustomer) {
        return NextResponse.json(
          {
            success: false,
            error: '该邮箱地址已被使用',
          },
          { status: 400 }
        )
      }
    }

    // 检查手机号是否已存在（如果提供了手机号）
    if (validatedData.phone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { phone: validatedData.phone },
      })

      if (existingCustomer) {
        return NextResponse.json(
          {
            success: false,
            error: '该手机号码已被使用',
          },
          { status: 400 }
        )
      }
    }

    // 创建客户记录
    const customer = await prisma.customer.create({
      data: {
        name: validatedData.name,
        companyInfo: validatedData.companyInfo || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        userId: currentUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // 返回创建成功的客户数据
    return NextResponse.json(
      {
        success: true,
        data: {
          id: customer.id,
          name: customer.name,
          companyInfo: customer.companyInfo,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          createdAt: customer.createdAt.toISOString(),
          updatedAt: customer.updatedAt.toISOString(),
          user: customer.user,
        },
        message: '客户创建成功',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('创建客户失败:', error)

    // 处理验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '请求数据验证失败',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    // 处理数据库错误
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error),
      },
      { status: 500 }
    )
  }
}
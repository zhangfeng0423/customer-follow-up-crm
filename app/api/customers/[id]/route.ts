/**
 * 客户详情API路由
 *
 * GET: 获取客户详细信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/prisma'
import { CustomerDetail, ApiResponse } from '@/lib/types/followup'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * GET - 获取客户详细信息
 *
 * @param request Next.js请求对象
 * @param params 路由参数，包含客户ID
 * @returns Promise<NextResponse> 客户详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CustomerDetail>>> {
  try {
    const { id: customerId } = await params

    // 获取客户详细信息，包含关联统计
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
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
      },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: '客户不存在' },
        { status: 404 }
      )
    }

    // 转换为响应格式
    const response: CustomerDetail = {
      id: customer.id,
      name: customer.name,
      companyInfo: customer.companyInfo || undefined,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      address: customer.address || undefined,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      user: customer.user,
      _count: customer._count,
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('获取客户详情失败:', error)
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
 * 更新客户的请求体验证Schema
 */
const updateCustomerSchema = z.object({
  name: z.string().min(1, '客户姓名不能为空').max(100, '客户姓名不能超过100个字符').optional(),
  companyInfo: z.string().max(200, '公司信息不能超过200个字符').optional(),
  email: z.string().email('请输入有效的邮箱地址').max(100, '邮箱地址不能超过100个字符').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码').optional(),
  address: z.string().max(300, '地址不能超过300个字符').optional(),
})

/**
 * PUT - 更新客户信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: customerId } = await params
    const body = await request.json()

    // 验证请求数据
    const validatedData = updateCustomerSchema.parse(body)

    // 检查客户是否存在
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: '客户不存在' },
        { status: 404 }
      )
    }

    // 检查邮箱是否已被其他客户使用
    if (validatedData.email && validatedData.email !== existingCustomer.email) {
      const existingEmailCustomer = await prisma.customer.findFirst({
        where: {
          email: validatedData.email,
          id: { not: customerId }
        },
      })

      if (existingEmailCustomer) {
        return NextResponse.json(
          { success: false, error: '该邮箱地址已被其他客户使用' },
          { status: 400 }
        )
      }
    }

    // 检查手机号是否已被其他客户使用
    if (validatedData.phone && validatedData.phone !== existingCustomer.phone) {
      const existingPhoneCustomer = await prisma.customer.findFirst({
        where: {
          phone: validatedData.phone,
          id: { not: customerId }
        },
      })

      if (existingPhoneCustomer) {
        return NextResponse.json(
          { success: false, error: '该手机号码已被其他客户使用' },
          { status: 400 }
        )
      }
    }

    // 更新客户信息
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.companyInfo !== undefined && { companyInfo: validatedData.companyInfo || null }),
        ...(validatedData.email !== undefined && { email: validatedData.email || null }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
        ...(validatedData.address !== undefined && { address: validatedData.address || null }),
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

    // 【关键步骤】清除相关页面的缓存
    revalidatePath('/customers')
    revalidatePath(`/customers/${customerId}`)

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        companyInfo: updatedCustomer.companyInfo,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        address: updatedCustomer.address,
        createdAt: updatedCustomer.createdAt.toISOString(),
        updatedAt: updatedCustomer.updatedAt.toISOString(),
        user: updatedCustomer.user,
      },
      message: '客户信息更新成功'
    })
  } catch (error) {
    console.error('更新客户失败:', error)

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

    return NextResponse.json(
      { success: false, error: handleDatabaseError(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE - 删除客户
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: customerId } = await params

    // 检查客户是否存在
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: '客户不存在' },
        { status: 404 }
      )
    }

    // 删除客户（由于设置了外键约束，相关的跟进记录和计划也会被自动删除）
    await prisma.customer.delete({
      where: { id: customerId }
    })

    // 【关键步骤】清除相关页面的缓存
    revalidatePath('/customers')
    revalidatePath(`/customers/${customerId}`)

    return NextResponse.json({
      success: true,
      message: '客户删除成功'
    })
  } catch (error) {
    console.error('删除客户失败:', error)
    return NextResponse.json(
      { success: false, error: handleDatabaseError(error) },
      { status: 500 }
    )
  }
}
/**
 * 客户详情API路由
 *
 * GET: 获取客户详细信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/prisma'
import { CustomerDetail, ApiResponse } from '@/lib/types/followup'

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
/**
 * 获取第一个可用客户的API路由
 * 用于重定向到有效客户
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/lib/types/followup'

/**
 * GET - 获取第一个可用客户的ID
 *
 * @returns Promise<NextResponse> 第一个客户的ID或错误信息
 */
export async function GET(): Promise<NextResponse<ApiResponse<{ id: string; name: string }>>> {
  try {
    // 获取第一个客户
    const customer = await prisma.customer.findFirst({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: '暂无客户数据' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
      },
    })
  } catch (error) {
    console.error('获取第一个客户失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    )
  }
}
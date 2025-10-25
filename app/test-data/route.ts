/**
 * 测试数据 API 端点
 * 绕过环境变量验证，直接检查生产数据库数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../app/generated/prisma'

// 直接使用环境变量创建客户端
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

/**
 * 处理测试数据请求
 */
export async function GET() {
  try {
    console.log('开始测试数据连接...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置')

    // 简单检查数据库连接
    const userCount = await prisma.user.count()
    const customerCount = await prisma.customer.count()

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: '数据库连接测试成功',
      data: {
        userCount,
        customerCount,
        totalRecords: userCount + customerCount,
        databaseConnected: true
      }
    })
  } catch (error) {
    console.error('数据库连接测试失败:', error)

    return NextResponse.json({
      success: false,
      message: '数据库连接测试失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}
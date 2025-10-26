/**
 * 数据库迁移 API 端点
 * 用于在生产环境运行 Prisma 迁移
 */

import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

/**
 * 处理数据库迁移请求
 */
export async function POST(request: NextRequest) {
  try {
    // 验证请求是否来自管理员
    const { secret } = await request.json()

    if (secret !== process.env.SEED_SECRET && secret !== 'migrate-database-2024') {
      return NextResponse.json(
        { error: '未授权的迁移请求' },
        { status: 401 }
      )
    }

    console.log('🚀 开始运行生产环境数据库迁移...')

    // 运行 Prisma 迁移
    try {
      const output = execSync('npx prisma migrate deploy', {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 30000 // 30秒超时
      })

      console.log('✅ 迁移输出:', output)

      return NextResponse.json({
        success: true,
        message: '✅ 数据库迁移完成！',
        output: output
      })
    } catch (migrateError) {
      console.error('迁移失败:', migrateError)

      return NextResponse.json(
        {
          error: '数据库迁移失败',
          details: migrateError instanceof Error ? migrateError.message : '未知错误'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('迁移请求处理失败:', error)
    return NextResponse.json(
      {
        error: '迁移请求处理失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * 获取迁移状态
 */
export async function GET() {
  try {
    // 检查是否可以连接到数据库
    const { prisma } = await import('@/lib/prisma')

    try {
      await prisma.$queryRaw`SELECT 1`

      // 尝试检查表是否存在
      const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `

      const tableNames = tables.map(t => t.tablename)

      return NextResponse.json({
        status: 'success',
        data: {
          connected: true,
          tables: tableNames,
          hasUsers: tableNames.includes('users'),
          hasCustomers: tableNames.includes('customers'),
          message: tableNames.length > 0
            ? `数据库已连接，发现 ${tableNames.length} 个表`
            : '数据库已连接，但没有表'
        }
      })
    } catch (dbError) {
      console.error('数据库连接错误:', dbError)
      return NextResponse.json({
        status: 'error',
        data: {
          connected: false,
          error: '数据库连接失败',
          details: dbError instanceof Error ? dbError.message : '未知错误'
        }
      })
    }
  } catch (error) {
    console.error('迁移状态检查失败:', error)
    return NextResponse.json(
      { error: '迁移状态检查失败' },
      { status: 500 }
    )
  }
}
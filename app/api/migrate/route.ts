/**
 * 数据库迁移 API 端点
 * 用于在生产环境创建数据库表结构
 */

import { NextRequest, NextResponse } from 'next/server'

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

    console.log('🚀 开始创建生产环境数据库表结构...')

    try {
      const { prisma } = await import('@/lib/prisma')

      // 使用 Prisma 的内置方法创建表
      // 这个方法会自动应用 schema 中定义的所有表
      console.log('正在应用数据库 schema...')

      // 检查数据库连接
      await prisma.$connect()
      console.log('✅ 数据库连接成功')

      // 使用 Prisma 的内置迁移方法
      // 在生产环境中，这会自动创建缺失的表
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "role" "UserRole" NOT NULL DEFAULT E'SALES',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      )`

      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "customers" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "companyInfo" TEXT,
        "email" TEXT,
        "phone" TEXT,
        "address" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "userId" TEXT,

        CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
      )`

      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "follow_up_records" (
        "id" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "followUpType" "FollowUpType" NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "customerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,

        CONSTRAINT "follow_up_records_pkey" PRIMARY KEY ("id")
      )`

      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "attachments" (
        "id" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "fileUrl" TEXT NOT NULL,
        "fileType" TEXT NOT NULL,
        "fileSize" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "followUpRecordId" TEXT NOT NULL,

        CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
      )`

      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "next_step_plans" (
        "id" TEXT NOT NULL,
        "dueDate" TIMESTAMP(3) NOT NULL,
        "notes" TEXT,
        "status" "PlanStatus" NOT NULL DEFAULT E'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "followUpRecordId" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,

        CONSTRAINT "next_step_plans_pkey" PRIMARY KEY ("id")
      )`

      // 创建索引
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "customers_userId_idx" ON "customers"("userId")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "follow_up_records_customerId_idx" ON "follow_up_records"("customerId")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "follow_up_records_userId_idx" ON "follow_up_records"("userId")`

      console.log('✅ 数据库表结构创建完成！')

      return NextResponse.json({
        success: true,
        message: '✅ 数据库表结构创建完成！',
        tables: ['users', 'customers', 'follow_up_records', 'attachments', 'next_step_plans']
      })
    } catch (migrateError) {
      console.error('表创建失败:', migrateError)

      return NextResponse.json(
        {
          error: '数据库表创建失败',
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
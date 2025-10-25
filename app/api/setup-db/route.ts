/**
 * 数据库初始化API路由
 * 用于在Vercel部署后初始化数据库表结构
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 开始初始化数据库...')

    // 检查数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

    // 检查表是否已存在
    try {
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `

      console.log('📊 检查表状态:', tableExists)

      if (tableExists) {
        return NextResponse.json({
          success: true,
          message: '数据库表已存在，无需重复初始化',
          alreadySetup: true
        })
      }
    } catch (error) {
      console.log('❌ 检查表状态失败:', error)
    }

    // 创建表结构
    console.log('📝 创建数据库表结构...')

    // 创建用户表
    await prisma.$executeRaw`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'SALES',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `

    // 创建客户表
    await prisma.$executeRaw`
      CREATE TABLE customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company_info TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT NOT NULL
      );
    `

    // 创建跟进记录表
    await prisma.$executeRaw`
      CREATE TABLE follow_up_records (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        follow_up_type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        customer_id TEXT NOT NULL,
        user_id TEXT NOT NULL
      );
    `

    // 创建附件表
    await prisma.$executeRaw`
      CREATE TABLE attachments (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        follow_up_record_id TEXT NOT NULL
      );
    `

    // 创建下一步计划表
    await prisma.$executeRaw`
      CREATE TABLE next_step_plans (
        id TEXT PRIMARY KEY,
        due_date TIMESTAMP WITH TIME ZONE NOT NULL,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        follow_up_record_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        user_id TEXT NOT NULL
      );
    `

    // 创建索引
    await prisma.$executeRaw`CREATE INDEX customers_user_id_idx ON customers(user_id);`
    await prisma.$executeRaw`CREATE INDEX follow_up_records_customer_id_idx ON follow_up_records(customer_id);`
    await prisma.$executeRaw`CREATE INDEX follow_up_records_user_id_idx ON follow_up_records(user_id);`
    await prisma.$executeRaw`CREATE INDEX attachments_follow_up_record_id_idx ON attachments(follow_up_record_id);`
    await prisma.$executeRaw`CREATE INDEX next_step_plans_customer_id_idx ON next_step_plans(customer_id);`
    await prisma.$executeRaw`CREATE INDEX next_step_plans_user_id_idx ON next_step_plans(user_id);`

    console.log('✅ 数据库表结构创建成功')

    // 测试连接
    const userCount = await prisma.user.count()
    const customerCount = await prisma.customer.count()

    console.log(`📊 当前用户数量: ${userCount}`)
    console.log(`📊 当前客户数量: ${customerCount}`)

    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
      data: {
        userCount,
        customerCount
      }
    })

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '数据库初始化失败',
        details: error
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    // 检查数据库状态
    await prisma.$connect()

    const userCount = await prisma.user.count()
    const customerCount = await prisma.customer.count()

    return NextResponse.json({
      success: true,
      message: '数据库状态检查完成',
      data: {
        connected: true,
        userCount,
        customerCount
      }
    })

  } catch (error) {
    console.error('❌ 数据库状态检查失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '数据库连接失败',
        connected: false
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
    }
  }
}
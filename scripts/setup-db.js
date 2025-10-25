/**
 * 数据库初始化脚本
 * 用于在Vercel部署时创建数据库表结构
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupDatabase() {
  try {
    console.log('🚀 开始初始化数据库...')

    // 检查数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

    // 创建表结构（使用push而不是migrate，因为migrate文件不存在）
    console.log('📝 创建数据库表结构...')

    // 尝试执行一个简单的查询来创建表
    // 这里我们使用 Prisma 的 db push 功能的底层逻辑
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'SALES',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS customers (
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

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS follow_up_records (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        follow_up_type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        customer_id TEXT NOT NULL,
        user_id TEXT NOT NULL
      );
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        follow_up_record_id TEXT NOT NULL
      );
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS next_step_plans (
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

    console.log('✅ 数据库表结构创建成功')

    // 创建索引
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id);`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS follow_up_records_customer_id_idx ON follow_up_records(customer_id);`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS follow_up_records_user_id_idx ON follow_up_records(user_id);`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS attachments_follow_up_record_id_idx ON attachments(follow_up_record_id);`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS next_step_plans_customer_id_idx ON next_step_plans(customer_id);`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS next_step_plans_user_id_idx ON next_step_plans(user_id);`

    console.log('✅ 数据库索引创建成功')

    // 测试连接
    const userCount = await prisma.user.count()
    console.log(`📊 当前用户数量: ${userCount}`)

    const customerCount = await prisma.customer.count()
    console.log(`📊 当前客户数量: ${customerCount}`)

    console.log('🎉 数据库初始化完成!')

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ 脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error)
      process.exit(1)
    })
  }
}

module.exports = { setupDatabase }
/**
 * Prisma客户端配置和数据库连接工具
 *
 * 提供统一的数据库访问接口，包含连接管理和错误处理
 */

import { PrismaClient } from '../app/generated/prisma'

/**
 * 扩展的Prisma客户端类型，包含自定义方法
 */
export type ExtendedPrismaClient = PrismaClient

/**
 * 全局Prisma客户端实例
 * 在开发环境中避免创建多个连接实例
 */
const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined
}

/**
 * 创建Prisma客户端实例
 *
 * @returns {ExtendedPrismaClient} Prisma客户端实例
 */
export const createPrismaClient = (): ExtendedPrismaClient => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  }) as ExtendedPrismaClient

  // 添加连接错误处理
  client.$connect()
    .then(() => {
      console.log('✅ 数据库连接成功')
    })
    .catch((error: unknown) => {
      console.error('❌ 数据库连接失败:', error)
    })

  return client
}

/**
 * 获取Prisma客户端实例
 * 在生产环境每次调用都会创建新实例，在开发环境复用实例
 *
 * @returns {ExtendedPrismaClient} Prisma客户端实例
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

/**
 * 开发环境下将客户端实例保存到全局对象，避免热重载时创建多个连接
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * 数据库连接状态检查
 *
 * @returns {Promise<boolean>} 连接是否正常
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('数据库连接检查失败:', error)
    return false
  }
}

/**
 * 优雅关闭数据库连接
 *
 * @returns {Promise<void>}
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect()
    console.log('✅ 数据库连接已关闭')
  } catch (error) {
    console.error('❌ 关闭数据库连接时出错:', error)
  }
}

/**
 * 数据库事务辅助函数
 *
 * @param callback 事务回调函数
 * @returns {Promise<T>} 事务执行结果
 */
export const withTransaction = async <T>(
  callback: (tx: ExtendedPrismaClient) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(callback as (tx: unknown) => Promise<T>) as Promise<T>
}

/**
 * 错误处理辅助函数
 *
 * @param error 原始错误
 * @returns {string} 用户友好的错误信息
 */
export const handleDatabaseError = (error: unknown): string => {
  if (error instanceof Error) {
    // Prisma特定错误处理
    if (error.message.includes('Unique constraint')) {
      return '数据已存在，请勿重复提交'
    }
    if (error.message.includes('Foreign key constraint')) {
      return '关联数据不存在，请检查相关记录'
    }
    if (error.message.includes('Record to update does not exist')) {
      return '要更新的记录不存在'
    }

    return error.message
  }

  return '数据库操作失败，请稍后重试'
}
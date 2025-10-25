/**
 * 环境变量验证模块
 *
 * 使用 Zod 对所有必需的环境变量进行严格验证
 * 如果验证失败，应用将在构建或启动阶段就失败
 */

import { z } from 'zod'

/**
 * 环境变量验证 schema
 * 定义所有必需和可选的环境变量及其格式
 */
const envSchema = z.object({
  // 数据库配置
  DATABASE_URL: z
    .string()
    .min(1, '数据库连接 URL 不能为空')
    .url('数据库连接 URL 格式无效')
    .refine(
      (url) => url.startsWith('postgresql://'),
      '数据库连接 URL 必须是 PostgreSQL 格式'
    ),

  // NextAuth 配置
  NEXTAUTH_URL: z
    .string()
    .min(1, 'NextAuth URL 不能为空')
    .url('NextAuth URL 格式无效'),

  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NextAuth Secret 至少需要 32 个字符')
    .regex(
      /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
      'NextAuth Secret 只能包含字母、数字和特殊字符'
    ),

  // Next.js 配置
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // 可选配置
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT 必须是数字')
    .transform(Number)
    .pipe(z.number().min(1).max(65535))
    .optional()
    .default(3000),

  // 自定义配置（示例）
  CUSTOM_KEY: z
    .string()
    .optional(),
})

/**
 * 环境变量验证函数
 *
 * @throws {Error} 当环境变量验证失败时抛出错误
 * @returns {z.infer<typeof envSchema>} 验证后的环境变量对象
 */
export function validateEnv(): z.infer<typeof envSchema> {
  try {
    const env = envSchema.parse(process.env)
    console.log('✅ 环境变量验证通过')
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 环境变量验证失败:')
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      throw new Error('环境变量验证失败，请检查配置')
    }
    console.error('❌ 环境变量验证过程中发生未知错误:', error)
    throw error
  }
}

/**
 * 获取类型安全的环境变量
 *
 * @returns {z.infer<typeof envSchema>} 类型安全的环境变量对象
 */
export const env = validateEnv()

/**
 * 检查是否为开发环境
 *
 * @returns {boolean}
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * 检查是否为生产环境
 *
 * @returns {boolean}
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * 检查是否为测试环境
 *
 * @returns {boolean}
 */
export const isTest = env.NODE_ENV === 'test'

/**
 * 获取数据库配置信息（隐藏敏感信息）
 *
 * @returns {object} 数据库配置信息（不包含密码）
 */
export const getDatabaseConfig = () => {
  try {
    const url = new URL(env.DATABASE_URL)
    return {
      protocol: url.protocol,
      host: url.host,
      username: url.username,
      database: url.pathname.substring(1),
      // 不返回密码以保护敏感信息
    }
  } catch {
    return {
      error: '数据库 URL 格式无效'
    }
  }
}

// 类型导出
export type Env = z.infer<typeof envSchema>
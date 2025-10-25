/**
 * 客户跟进记录API路由
 *
 * POST: 创建新的跟进记录
 * GET: 获取客户的所有跟进记录
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, handleDatabaseError } from '@/lib/prisma'
// import type { Attachment, NextStepPlan } from '@/app/generated/prisma'
import { FollowUpRecordResponse, ApiResponse } from '@/lib/types/followup'

/**
 * 创建跟进记录的请求体验证Schema
 */
const createFollowUpSchema = z.object({
  content: z.string().min(1, '跟进内容不能为空').max(2000, '跟进内容不能超过2000字符'),
  followUpType: z.enum(['PHONE_CALL', 'MEETING', 'VISIT', 'BUSINESS_DINNER']),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().url(),
    fileType: z.string(),
    fileSize: z.number().optional(),
  })).optional(),
  nextStep: z.object({
    dueDate: z.string().datetime(),
    notes: z.string().max(500, '下一步说明不能超过500字符').optional(),
  }).optional(),
})

/**
 * GET - 获取客户的所有跟进记录
 *
 * @param request Next.js请求对象
 * @param params 路由参数，包含客户ID
 * @returns Promise<NextResponse> 跟进记录列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<FollowUpRecordResponse[]>>> {
  try {
    const { id: customerId } = await params

    // 验证客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: '客户不存在' },
        { status: 404 }
      )
    }

    // 获取跟进记录，按创建时间倒序排列
    const followUpRecords = await prisma.followUpRecord.findMany({
      where: { customerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        nextStepPlans: {
          select: {
            id: true,
            dueDate: true,
            notes: true,
            status: true,
            createdAt: true,
          },
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 转换为响应格式
    const response: FollowUpRecordResponse[] = followUpRecords.map((record) => ({
      id: record.id,
      content: record.content,
      followUpType: record.followUpType,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      customerId: record.customerId,
      userId: record.userId,
      user: record.user,
      attachments: record.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize || undefined,
        createdAt: attachment.createdAt.toISOString(),
      })),
      nextStepPlans: record.nextStepPlans.map((plan) => ({
        id: plan.id,
        dueDate: plan.dueDate.toISOString(),
        notes: plan.notes || undefined,
        status: plan.status,
        createdAt: plan.createdAt.toISOString(),
      })),
    }))

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('获取跟进记录失败:', error)
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
 * POST - 创建新的跟进记录
 *
 * @param request Next.js请求对象
 * @param params 路由参数，包含客户ID
 * @returns Promise<NextResponse> 创建结果
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<FollowUpRecordResponse>>> {
  try {
    const { id: customerId } = await params
    const body = await request.json()

    // 验证请求数据
    const validatedData = createFollowUpSchema.parse(body)

    // 验证客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: '客户不存在' },
        { status: 404 }
      )
    }

    // 获取第一个可用用户作为当前用户（实际应用中应该从认证信息中获取）
    const currentUser = await prisma.user.findFirst({
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: '系统中没有可用用户' },
        { status: 400 }
      )
    }

    const currentUserId = currentUser.id // TODO: 从认证系统获取真实用户ID

    // 使用事务创建跟进记录和相关数据
    const result = await prisma.$transaction(async (tx) => {
      // 创建跟进记录
      const followUpRecord = await tx.followUpRecord.create({
        data: {
          content: validatedData.content,
          followUpType: validatedData.followUpType,
          customerId,
          userId: currentUserId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
          nextStepPlans: true,
        },
      })

      // 创建附件记录（如果有）
      if (validatedData.attachments && validatedData.attachments.length > 0) {
        await tx.attachment.createMany({
          data: validatedData.attachments.map(attachment => ({
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            followUpRecordId: followUpRecord.id,
          })),
        })
      }

      // 创建下一步计划（如果有）
      if (validatedData.nextStep) {
        await tx.nextStepPlan.create({
          data: {
            dueDate: new Date(validatedData.nextStep.dueDate),
            notes: validatedData.nextStep.notes,
            customerId,
            userId: currentUserId,
            followUpRecordId: followUpRecord.id,
          },
        })
      }

      // 重新查询完整的记录信息
      const completeRecord = await tx.followUpRecord.findUnique({
        where: { id: followUpRecord.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              fileType: true,
              fileSize: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          nextStepPlans: {
            select: {
              id: true,
              dueDate: true,
              notes: true,
              status: true,
              createdAt: true,
            },
            orderBy: { dueDate: 'asc' },
          },
        },
      })

      return completeRecord
    })

    if (!result) {
      throw new Error('创建跟进记录失败')
    }

    // 转换为响应格式
    const response: FollowUpRecordResponse = {
      id: result.id,
      content: result.content,
      followUpType: result.followUpType,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      customerId: result.customerId,
      userId: result.userId,
      user: result.user,
      attachments: result.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize || undefined,
        createdAt: attachment.createdAt.toISOString(),
      })),
      nextStepPlans: result.nextStepPlans.map((plan) => ({
        id: plan.id,
        dueDate: plan.dueDate.toISOString(),
        notes: plan.notes || undefined,
        status: plan.status,
        createdAt: plan.createdAt.toISOString(),
      })),
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: '跟进记录创建成功',
    }, { status: 201 })

  } catch (error) {
    console.error('创建跟进记录失败:', error)

    // 处理Zod验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '请求参数验证失败',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error),
      },
      { status: 500 }
    )
  }
}
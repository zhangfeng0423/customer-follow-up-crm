/**
 * 文件上传API路由
 *
 * POST: 上传文件并返回文件信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { FileUploadResponse, ApiResponse } from '@/lib/types/followup'

/**
 * 支持的文件类型
 */
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

/**
 * 最大文件大小 (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * 验证文件是否符合要求
 */
const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // 检查文件类型
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `不支持的文件类型。支持的类型: ${ALLOWED_FILE_TYPES.join(', ')}`
    }
  }

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  return { isValid: true }
}

/**
 * 生成唯一文件名
 *
 * @param originalName 原始文件名
 * @returns {string} 唯一文件名
 */
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  const extension = originalName.split('.').pop()
  return `${timestamp}_${random}.${extension}`
}

/**
 * 检查Vercel Blob环境变量是否配置
 */
const checkBlobEnvironment = (): { isValid: boolean; error?: string } => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      isValid: false,
      error: 'BLOB_READ_WRITE_TOKEN 环境变量未配置。请在 Vercel 项目的 Storage 标签页连接 Blob 存储并等待环境变量自动添加。'
    }
  }
  return { isValid: true }
}

/**
 * 获取文件类型分类
 *
 * @param mimeType MIME类型
 * @returns {string} 文件类型分类
 */
const getFileTypeCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet'
  if (mimeType.startsWith('text/')) return 'text'
  return 'other'
}

/**
 * POST - 上传文件到 Vercel Blob
 *
 * @param request Next.js请求对象
 * @returns Promise<NextResponse> 上传结果
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<FileUploadResponse['file']>>> {
  try {
    // 检查 Blob 环境配置
    const blobCheck = checkBlobEnvironment()
    if (!blobCheck.isValid) {
      return NextResponse.json(
        { success: false, error: blobCheck.error },
        { status: 500 }
      )
    }

    // 解析表单数据
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的文件' },
        { status: 400 }
      )
    }

    // 验证文件
    const validation = validateFile(file)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: '文件验证失败',
          details: [{ field: 'file', message: validation.error }],
        },
        { status: 400 }
      )
    }

    // 生成唯一文件名
    const uniqueFileName = generateUniqueFileName(file.name)

    // 上传到 Vercel Blob
    const blob = await put(uniqueFileName, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // 构建响应数据
    const fileData = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      fileName: file.name,
      fileUrl: blob.url,
      fileType: getFileTypeCategory(file.type),
      fileSize: file.size,
    }

    console.log('✅ 文件上传到 Vercel Blob 成功:', {
      fileName: file.name,
      url: blob.url,
      size: file.size
    })

    return NextResponse.json({
      success: true,
      data: fileData,
      message: '文件上传成功',
    })

  } catch (error: unknown) {
    console.error('文件上传失败:', error)

    // 检查是否是 Blob 配置错误
    if (error instanceof Error && error.message.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vercel Blob 配置错误：请确保已在 Vercel 项目的 Storage 标签页连接了 Blob 存储',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '文件上传失败，请稍后重试',
      },
      { status: 500 }
    )
  }
}
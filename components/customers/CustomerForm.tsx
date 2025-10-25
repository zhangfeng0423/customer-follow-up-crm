"use client"

/**
 * 客户表单组件
 *
 * 提供客户信息录入和编辑功能，使用 React Hook Form 和 Zod 进行表单验证
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { Building, User, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

/**
 * 客户信息验证 Schema
 */
const customerSchema = z.object({
  name: z
    .string()
    .min(1, '客户姓名不能为空')
    .max(100, '客户姓名不能超过100个字符'),
  companyInfo: z
    .string()
    .max(200, '公司信息不能超过200个字符')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('请输入有效的邮箱地址')
    .max(100, '邮箱地址不能超过100个字符')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(300, '地址不能超过300个字符')
    .optional()
    .or(z.literal('')),
})

/**
 * 客户表单数据类型
 */
type CustomerFormData = z.infer<typeof customerSchema>

/**
 * 创建客户 API 函数
 */
async function createCustomer(data: CustomerFormData) {
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || '创建客户失败')
  }

  return response.json()
}

/**
 * 客户表单组件属性
 */
interface CustomerFormProps {
  /** 初始客户数据（编辑模式时使用） */
  initialData?: Partial<CustomerFormData>
  /** 表单提交成功后的回调函数 */
  onSuccess?: (customer: {
    id: string
    name: string
    companyInfo?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
  }) => void
}

/**
 * 客户表单组件
 */
export function CustomerForm({ initialData, onSuccess }: CustomerFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 初始化表单
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || '',
      companyInfo: initialData?.companyInfo || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
    },
  })

  // 创建客户的 mutation
  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      toast({
        title: '操作成功',
        description: '客户创建成功',
      })
      queryClient.invalidateQueries({ queryKey: ['customers'] })

      if (onSuccess) {
        onSuccess(data)
      } else {
        // 默认跳转到客户列表页
        router.push('/customers')
      }
    },
    onError: (error: Error) => {
      toast({
        title: '操作失败',
        description: error.message || '创建客户失败',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  // 表单提交处理
  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true)

    await createCustomerMutation.mutateAsync(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 基本信息 */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  基本信息
                </h3>

                {/* 客户姓名 */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>客户姓名 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="请输入客户姓名"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 邮箱 */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>邮箱地址</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="example@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 手机号 */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>手机号码</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="请输入11位手机号码"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 公司和地址信息 */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  公司信息
                </h3>

                {/* 公司信息 */}
                <FormField
                  control={form.control}
                  name="companyInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>公司信息</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="请输入公司名称和职位"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 地址 */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>联系地址</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="请输入详细地址"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createCustomerMutation.isPending}
          >
            {(isSubmitting || createCustomerMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {initialData ? '更新客户' : '创建客户'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
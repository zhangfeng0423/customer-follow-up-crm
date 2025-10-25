/**
 * 新增客户页面
 *
 * 提供客户信息录入表单，支持创建新客户记录
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: '新增客户 - 智能CRM客户跟进工具',
  description: '创建新的客户记录',
}

/**
 * 新增客户页面组件
 */
export default function NewCustomerPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/customers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">新增客户</h1>
            <p className="text-muted-foreground">
              填写客户基本信息，创建新的客户记录
            </p>
          </div>
        </div>
      </div>

      {/* 表单卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Save className="h-5 w-5" />
            <span>客户信息</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm />
        </CardContent>
      </Card>
    </div>
  )
}
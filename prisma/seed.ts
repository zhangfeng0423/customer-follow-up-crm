/**
 * 数据库种子文件
 * 创建示例数据用于演示
 */

import { PrismaClient, FollowUpType, UserRole, PlanStatus } from '../app/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建示例数据...')

  // 创建示例用户
  const user = await prisma.user.upsert({
    where: { email: 'wanglei@company.com' },
    update: {},
    create: {
      name: '王磊',
      email: 'wanglei@company.com',
      role: UserRole.SALES,
    },
  })

  console.log('创建用户:', user.name)

  // 创建示例客户
  const customers = [
    {
      name: '张总',
      companyInfo: '远洋物流集团',
      email: 'zhang@yuanyang.com',
      phone: '13800138001',
      address: '上海市浦东新区世纪大道100号',
      userId: user.id,
    },
    {
      name: '李经理',
      companyInfo: '科技创新有限公司',
      email: 'li@techinnov.com',
      phone: '13900139001',
      address: '北京市海淀区中关村大街1号',
      userId: user.id,
    },
    {
      name: '王董',
      companyInfo: '智能制造股份',
      email: 'wang@smartmfg.com',
      phone: '13700137001',
      address: '深圳市南山区科技园路88号',
      userId: user.id,
    },
  ]

  for (const customerData of customers) {
    // 检查客户是否已存在
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: customerData.email },
    })

    let customer
    if (existingCustomer) {
      customer = existingCustomer
      console.log('客户已存在:', customer.name)
    } else {
      customer = await prisma.customer.create({
        data: customerData,
      })
      console.log('创建客户:', customer.name)
    }

    // 为每个客户创建一些跟进记录
    const followUpRecords = [
      {
        content: '初次电话沟通，介绍了我们的核心产品和服务优势。客户对智能CRM系统表现出浓厚兴趣，特别是语音录入功能。',
        followUpType: FollowUpType.PHONE_CALL,
        customerId: customer.id,
        userId: user.id,
      },
      {
        content: '线上会议演示了完整的客户跟进流程，包括时间轴展示、附件上传和下一步计划设置。客户对UI设计非常满意。',
        followUpType: FollowUpType.MEETING,
        customerId: customer.id,
        userId: user.id,
      },
      {
        content: '上门拜访，实地了解了客户的业务流程和痛点。针对他们现有系统的不足，提供了定制化的解决方案。',
        followUpType: FollowUpType.VISIT,
        customerId: customer.id,
        userId: user.id,
      },
    ]

    for (const recordData of followUpRecords) {
      const record = await prisma.followUpRecord.create({
        data: recordData,
      })
      console.log('创建跟进记录:', record.followUpType)

      // 为某些跟进记录创建下一步计划
      if (record.followUpType === FollowUpType.VISIT) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 7) // 一周后

        await prisma.nextStepPlan.create({
          data: {
            dueDate: futureDate,
            notes: '准备详细报价单和合同条款',
            status: PlanStatus.PENDING,
            customerId: customer.id,
            userId: user.id,
            followUpRecordId: record.id,
          },
        })
        console.log('创建下一步计划')
      }
    }
  }

  console.log('示例数据创建完成!')
}

main()
  .catch((e) => {
    console.error('创建示例数据时出错:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
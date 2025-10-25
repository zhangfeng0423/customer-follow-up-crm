/**
 * 生产环境数据库种子文件
 * 创建示例数据用于演示
 */

import { PrismaClient, FollowUpType, UserRole, PlanStatus } from '../app/generated/prisma'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log('开始创建生产环境示例数据...')

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

  console.log('创建默认用户:', user.name)

  // 创建示例客户
  const customers = [
    {
      name: '张总',
      companyInfo: '远洋物流集团',
      email: 'zhang.yuan@yuanyang-logistics.com',
      phone: '+86-21-88886666',
      address: '上海市浦东新区世纪大道100号远洋大厦',
      // userId: user.id, // 注释掉这行，使 userId 为 null（公共客户）
    },
    {
      name: '李经理',
      companyInfo: '科技创新有限公司',
      email: 'li.manager@techinnov.com.cn',
      phone: '+86-010-88887777',
      address: '北京市海淀区中关村大街1号科技大厦',
      // userId: user.id, // 注释掉这行，使 userId 为 null（公共客户）
    },
    {
      name: '王董',
      companyInfo: '智能制造股份',
      email: 'wang.chairman@smartmfg.com',
      phone: '+86-0755-88885555',
      address: '深圳市南山区科技园路88号智能制造中心',
      // userId: user.id, // 注释掉这行，使 userId 为 null（公共客户）
    },
    {
      name: '赵总监',
      companyInfo: '金融投资集团',
      email: 'zhao.director@finance-group.com',
      phone: '+86-021-88884444',
      address: '上海市静安区南京西路1266号恒隆广场',
      // userId: user.id, // 注释掉这行，使 userId 为 null（公共客户）
    },
    {
      name: '陈总',
      companyInfo: '新能源科技',
      email: 'chen.ceo@newenergy-tech.com',
      phone: '+86-0755-88883333',
      address: '深圳市南山区高新技术产业园A座',
      // userId: user.id, // 注释掉这行，使 userId 为 null（公共客户）
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

    // 为每个客户创建跟进记录
    const followUpRecords = [
      {
        content: '初步电话沟通，了解了客户的基本业务需求和当前使用CRM系统的情况。客户对我们的智能语音录入功能特别感兴趣，认为能大幅提升他们的工作效率。',
        followUpType: FollowUpType.PHONE_CALL,
        customerId: customer.id,
        userId: user.id,
      },
      {
        content: '线上会议详细演示了完整的客户跟进流程，包括时间轴展示、附件上传和下一步计划设置。客户对对话流式的设计理念非常认可，认为这符合他们销售团队的使用习惯。',
        followUpType: FollowUpType.MEETING,
        customerId: customer.id,
        userId: user.id,
      },
      {
        content: '上门拜访，实地了解了客户公司的业务流程和现有系统的痛点。针对他们提出的问题，我们提供了定制化的解决方案，特别是数据迁移和系统集成方面。',
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

      // 为拜访记录创建下一步计划
      if (record.followUpType === FollowUpType.VISIT) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 7 + Math.floor(Math.random() * 14)) // 1-3周后

        await prisma.nextStepPlan.create({
          data: {
            dueDate: futureDate,
            notes: `准备${customer.companyInfo}的定制化方案和报价单，包括技术实施细节和时间计划。重点关注语音识别准确率和数据迁移方案。`,
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

  console.log('✅ 生产环境示例数据创建完成!')
  console.log('')
  console.log('📋 创建的账户信息:')
  console.log('默认账号: wanglei@company.com (王磊)')
  console.log('客户数量:', customers.length)
  console.log('每个客户都有3条跟进记录和1个下一步计划')
}

main()
  .catch((e) => {
    console.error('❌ 创建生产环境示例数据时出错:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
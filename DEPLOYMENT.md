# 智能CRM客户跟进工具 - 部署指南

## 📋 项目架构

本项目采用现代化的分离架构：

- **本地开发**: Docker PostgreSQL + 本地Next.js开发服务器
- **生产部署**: Vercel Postgres + Vercel Serverless部署

## 🚀 快速开始

### 本地开发环境

#### 1. 环境准备
确保已安装：
- Node.js 18+
- pnpm
- Docker & Docker Compose

#### 2. 启动数据库
```bash
# 启动PostgreSQL和Redis
pnpm db:start

# 查看数据库状态
pnpm db:status

# 查看数据库日志
pnpm db:logs
```

#### 3. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑配置文件，确保数据库密码正确
```

#### 4. 初始化数据库
```bash
# 生成Prisma客户端
pnpm db:generate

# 推送数据库schema
pnpm db:push

# 运行种子数据
pnpm db:seed
```

#### 5. 启动应用
```bash
# 方式1: 分别启动
pnpm db:start
pnpm dev

# 方式2: 一键启动
pnpm dev:with-db
```

访问 http://localhost:3000

## 🌐 Vercel部署

### 1. 准备代码仓库
- 将代码推送到GitHub/GitLab/Bitbucket

### 2. 创建Vercel项目
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的代码仓库
4. Vercel会自动识别为Next.js项目

### 3. 配置数据库

#### 选项A: Vercel Postgres (推荐)
1. 在Vercel项目中，进入 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "Postgres" 并创建数据库
4. 自动获取DATABASE_URL

#### 选项B: 其他云数据库
- [Supabase](https://supabase.com/)
- [Neon](https://neon.tech/)
- [Railway](https://railway.app/)

### 4. 配置环境变量
在Vercel项目设置中添加：

```env
# 数据库连接 (由Vercel Postgres自动提供)
DATABASE_URL=your_postgres_connection_string

# NextAuth配置
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_production_secret

# 应用环境
NODE_ENV=production
```

### 5. 部署
```bash
# 推送代码到GitHub，Vercel会自动部署
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## 🛠️ 常用命令

### 数据库管理
```bash
# 启动数据库
pnpm db:start

# 停止数据库
pnpm db:stop

# 重置数据库 (删除所有数据)
pnpm db:reset

# 查看数据库状态
pnpm db:status

# 查看数据库日志
pnpm db:logs
```

### Prisma操作
```bash
# 生成Prisma客户端
pnpm db:generate

# 推送schema到数据库
pnpm db:push

# 打开Prisma Studio
pnpm db:studio

# 运行种子数据
pnpm db:seed

# 生产环境迁移
pnpm db:prod:migrate
```

### 开发
```bash
# 本地开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint
```

## 📁 项目结构

```
customer/
├── docker-compose.db.yml     # 仅数据库服务配置
├── docker-compose.yml        # 完整Docker配置 (生产备用)
├── .env.local                 # 本地开发环境变量
├── .env.example              # 环境变量模板
├── .env.vercel.example       # Vercel环境变量模板
├── DEPLOYMENT.md             # 本部署文档
├── prisma/
│   ├── schema.prisma         # 数据库schema
│   └── seed.ts              # 种子数据
└── scripts/
    └── export-data.js       # 数据导出脚本 (如需要)
```

## 🔧 故障排除

### 本地开发问题

#### 数据库连接失败
```bash
# 检查数据库是否运行
pnpm db:status

# 重启数据库
pnpm db:stop
pnpm db:start

# 检查环境变量
cat .env.local
```

#### 端口冲突
```bash
# 检查端口占用
lsof -i :5432
lsof -i :3000

# 停止占用端口的进程
kill -9 <PID>
```

### Vercel部署问题

#### 环境变量错误
1. 检查Vercel项目设置中的环境变量
2. 确保DATABASE_URL格式正确
3. 验证NEXTAUTH_SECRET足够长

#### 数据库连接问题
1. 确认云数据库已创建
2. 检查连接字符串是否正确
3. 验证数据库是否可从Vercel访问

## 📚 参考资料

- [Vercel文档](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma文档](https://www.prisma.io/docs/)
- [Next.js部署](https://nextjs.org/docs/deployment)

## 🆘 获取帮助

如果遇到问题：
1. 查看Vercel部署日志
2. 检查本地控制台错误
3. 参考上述故障排除步骤
4. 查看相关官方文档

---

**🎉 祝你部署顺利！**
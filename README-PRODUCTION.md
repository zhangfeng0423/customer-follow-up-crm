# 智能CRM客户跟进工具 - 生产环境部署指南

## 🚀 快速开始

### 环境要求

- Docker 20.0+
- Docker Compose 2.0+
- Git

### 一键部署

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd customer

# 2. 复制环境变量文件并配置
cp .env.example .env
# 编辑 .env 文件，设置您的数据库密码和其他配置

# 3. 构建并启动服务
docker-compose up -d

# 4. 等待服务启动（大约1-2分钟）
docker-compose logs -f crm-app
```

服务启动后，访问 http://localhost:3000 即可使用应用。

## 📋 详细配置

### 1. 环境变量配置

创建 `.env` 文件：

```env
# 数据库配置（必须设置强密码）
POSTGRES_PASSWORD=your_secure_password_here

# Next.js配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here_make_it_long_and_random

# 应用配置
NODE_ENV=production
```

### 2. 数据库配置

系统使用 PostgreSQL 作为主数据库，配置如下：

- **数据库名**: `crm_db`
- **用户名**: `crm_user`
- **密码**: 由环境变量 `POSTGRES_PASSWORD` 设置

### 3. 文件存储

用户上传的文件存储在 `./public/uploads` 目录中，通过Docker卷挂载持久化保存。

## 🐳 Docker 服务说明

### 服务架构

```
┌─────────────────┐    ┌─────────────────┐
│   crm-app       │    │   postgres       │
│   (Next.js)      │    │   (PostgreSQL)    │
│   Port: 3000     │    │   Port: 5432      │
└─────────────────┘    └─────────────────┘
         │                      │
         └──────────────────────┘
```

### 服务详情

1. **crm-app**: 主应用服务
   - 基于 Node.js 18 Alpine
   - 运行 Next.js 应用
   - 端口: 3000

2. **postgres**: 数据库服务
   - PostgreSQL 15 Alpine
   - 持久化数据存储
   - 端口: 5432

3. **redis**: 缓存服务（可选）
   - Redis 7 Alpine
   - 提供应用缓存
   - 端口: 6379

## 📊 监控和维护

### 查看服务状态

```bash
# 查看所有服务状态
docker-compose ps

# 查看应用日志
docker-compose logs -f crm-app

# 查看数据库日志
docker-compose logs -f postgres
```

### 数据库管理

```bash
# 数据库迁移
docker-compose exec crm-app pnpm db:prod:migrate

# 查看数据库
docker-compose exec postgres psql -U crm_user -d crm_db

# 备份数据库
docker-compose exec postgres pg_dump -U crm_user crm_db > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U crm_user -d crm_db < backup.sql
```

### 示例数据

首次部署时，可以运行示例数据脚本：

```bash
# 等待数据库启动完成
docker-compose exec crm-app pnpm db:seed
```

这将创建：
- 1个管理员账户
- 5个示例客户
- 每个客户3条跟进记录
- 对应的下一步计划

## 🔒 安全配置

### 生产环境安全建议

1. **更改默认密码**
   - 修改 `.env` 文件中的数据库密码
   - 使用强密码（至少16位，包含大小写字母、数字和特殊字符）

2. **HTTPS配置**
   - 在生产环境中配置反向代理（如Nginx）
   - 启用SSL证书

3. **网络安全**
   - 限制数据库端口访问（仅内部网络）
   - 配置防火墙规则

4. **定期备份**
   - 设置数据库定期备份
   - 备份上传文件目录

## 🚀 扩展部署

### 高可用部署

对于生产环境，建议考虑：

1. **数据库集群**
   - PostgreSQL主从复制
   - 连接池配置

2. **负载均衡**
   - 多个应用实例
   - 反向代理负载均衡

3. **监控告警**
   - 服务健康检查
   - 日志收集和分析

### 云平台部署

本Docker配置兼容以下云平台：

- AWS ECS/EKS
- Azure Container Instances/AKS
- Google Cloud Run/GKE
- 阿里云容器服务ACK

## 🛠️ 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :5432
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose exec postgres pg_isready -U crm_user -d crm_db

   # 查看数据库日志
   docker-compose logs postgres
   ```

3. **应用启动失败**
   ```bash
   # 查看应用日志
   docker-compose logs crm-app

   # 重启服务
   docker-compose restart crm-app
   ```

### 重置部署

如需完全重置部署：

```bash
# 停止并删除所有服务
docker-compose down -v

# 删除所有镜像
docker rmi $(docker images -q crm-app)

# 重新构建和启动
docker-compose up -d --build
```

## 📞 技术支持

如遇到部署问题，请：

1. 查看详细日志：`docker-compose logs -f`
2. 检查服务状态：`docker-compose ps`
3. 参考本文档的故障排除部分

---

**部署成功！** 🎉

您的智能CRM客户跟进工具现在已经运行在Docker + PostgreSQL环境中。访问 http://localhost:3000 开始使用！
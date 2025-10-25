# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装依赖阶段
FROM base AS deps
# 安装pnpm
RUN npm install -g pnpm

# 复制package.json和pnpm-lock.yaml文件
COPY package.json pnpm-lock.yaml* ./

# 安装所有依赖，包括开发依赖
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
# 安装pnpm
RUN npm install -g pnpm

# 从deps阶段复制node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制项目文件
COPY . .

# 生成Prisma客户端
RUN pnpm prisma generate

# 设置数据库URL为构建时的临时值（构建过程不需要真实数据库）
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"

# 构建应用
RUN pnpm build

# 生产运行阶段
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 安装pnpm
RUN npm install -g pnpm

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# 创建uploads目录
RUN mkdir -p /app/public/uploads
RUN chown nextjs:nodejs /app/public/uploads

# 设置用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 启动应用
CMD ["node", "server.js"]
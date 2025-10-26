# Vercel 环境变量配置指南

## 🔑 已生成的密钥

```
SEED_SECRET=/iTNSaRcRpSHQhknsUxsFpecIKHcRY8sN58CxFg4tnA=
```

## 📋 在 Vercel 中添加环境变量的步骤

### 1. 登录 Vercel Dashboard
- 访问 [vercel.com](https://vercel.com)
- 进入您的项目

### 2. 配置环境变量
1. 点击项目 → **Settings** → **Environment Variables**
2. 添加以下环境变量：

```
Key: SEED_SECRET
Value: /iTNSaRcRpSHQhknsUxsFpecIKHcRY8sN58CxFg4tnA=
Environment: Production (和 Preview)
```

### 3. 确认已有环境变量
确保以下变量也已配置：
- ✅ `DATABASE_URL` (Vercel Postgres 自动提供)
- ✅ `NEXTAUTH_URL`
- ✅ `NEXTAUTH_SECRET`
- ✅ `NODE_ENV` = "production"

### 4. 重新部署
添加环境变量后：
- 在 **Deployments** 页面点击 **Redeploy**
- 或推送新代码触发自动部署

## 🚀 部署后初始化数据库

部署成功后，访问以下URL初始化种子数据：

```
https://your-app.vercel.app/api/init-db?secret=/iTNSaRcRpSHQhknsUxsFpecIKHcRY8sN58CxFg4tnA=
```

## ⚠️ 重要提醒

1. **保密性**: 请勿在代码或公共地方暴露此密钥
2. **一次性**: 初始化完成后，重复调用会安全地跳过
3. **时间限制**: 初始化只能在部署后1小时内进行

## 🧪 验证配置

### 检查环境变量是否生效
```bash
curl https://your-app.vercel.app/api/init-db
```

应该返回数据库状态信息。

### 测试安全保护
```bash
# 错误密钥测试（应返回401）
curl "https://your-app.vercel.app/api/init-db?secret=wrong-key"

# 正确密钥测试（应成功初始化）
curl "https://your-app.vercel.app/api/init-db?secret=/iTNSaRcRpSHQhknsUxsFpecIKHcRY8sN58CxFg4tnA="
```

## 🆘 故障排除

### 如果初始化失败
1. 确认 `SEED_SECRET` 在 Vercel 中正确配置
2. 检查是否使用完整的密钥（包含所有字符）
3. 查看 Vercel 函数日志

### 如果环境变量不生效
1. 确认选择了正确的环境（Production + Preview）
2. 重新部署项目
3. 清除浏览器缓存

---

🎉 **配置完成后，您的CRM系统将包含完整的演示数据！**
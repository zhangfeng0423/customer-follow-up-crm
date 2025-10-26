# Vercel Blob 文件存储配置指南

## 📋 概述

本 CRM 系统已升级为使用 Vercel Blob 云存储来替代本地文件系统，确保文件在生产环境中持久化保存。

## 🚀 快速设置

### 1. 在 Vercel 项目中连接 Blob 存储

1. 打开您的 Vercel 项目仪表板
2. 进入项目的 **Storage** 标签页
3. 点击 **"Connect Database"** 或 **"Create Database"**
4. 选择 **"Blob"** 存储
5. 点击 **"Connect"**

### 2. 等待环境变量自动添加

Vercel 会自动为您的项目添加以下环境变量：
```
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

## 📁 文件存储特性

### ✅ 优势
- **持久化存储**: 文件永久保存，不会因部署而丢失
- **全球CDN**: 通过 Vercel 的全球网络快速访问
- **安全可靠**: 由 Vercel 托管，自动备份
- **简单集成**: 无需额外的配置代码

### 📊 支持的文件类型
- **图片**: JPEG, PNG, GIF, WebP
- **文档**: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)
- **文本**: .txt 文件
- **最大文件大小**: 5MB

## 🔧 技术实现

### API 端点
- **路径**: `/api/upload`
- **方法**: POST
- **格式**: `multipart/form-data`

### 响应格式
```json
{
  "success": true,
  "data": {
    "id": "file_1698281234567_abc123.jpg",
    "fileName": "document.pdf",
    "fileUrl": "https://blob.vercel-storage.com/app/document.pdf",
    "fileType": "pdf",
    "fileSize": 2048576
  },
  "message": "文件上传成功"
}
```

## 🛠️ 开发和测试

### 本地开发
- 本地开发时会自动使用 Vercel Blob
- 无需额外配置
- 与生产环境行为一致

### 生产部署
- 确保 Vercel 项目已连接 Blob 存储
- 环境变量会自动配置
- 部署后立即可用

## 🔍 故障排除

### 常见错误

1. **"BLOB_READ_WRITE_TOKEN 环境变量未配置"**
   - **解决方案**: 在 Vercel 项目的 Storage 标签页连接 Blob 存储

2. **"文件上传失败"**
   - **检查**: 文件大小是否超过 5MB
   - **检查**: 文件类型是否在支持列表中

3. **"无法访问上传的文件"**
   - **原因**: 可能是网络问题或权限问题
   - **解决方案**: 重新上传文件

### 调试技巧
- 查看 Vercel 函数日志获取详细错误信息
- 检查浏览器开发者工具的网络请求
- 验证文件格式和大小是否符合要求

## 📈 成本说明

Vercel Blob 提供：
- **免费额度**: 每月 1GB 存储 + 100GB 带宽
- **付费方案**: 超出免费额度后按使用量计费
- **适合场景**: 中小型 CRM 系统完全够用

## 🔗 相关链接

- [Vercel Blob 官方文档](https://vercel.com/docs/concepts/projects/storage)
- [Vercel 存储定价](https://vercel.com/pricing)
- [项目仪表板](https://vercel.com/dashboard)

---

**注意**: 配置完成后，所有上传的文件将安全存储在云端，可在任何地方访问。
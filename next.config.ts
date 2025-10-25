import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用独立输出，用于Docker部署
  output: 'standalone',

  // 配置环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;

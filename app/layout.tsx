import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// 环境变量验证 - 必须在应用启动时执行
import '@/lib/env'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "智能CRM客户跟进工具",
  description: "通过AI驱动的极致易用工具，将销售从繁琐的客户跟进记录中解放出来",
  keywords: "CRM, 客户管理, 跟进记录, 语音转文字, 销售工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.variable} ${notoSansSC.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

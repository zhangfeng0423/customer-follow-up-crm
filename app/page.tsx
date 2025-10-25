import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Card3D } from '@/components/ui/card-3d'
import { FlipWords } from '@/components/ui/flip-words'
import { TypewriterEffect } from '@/components/ui/typewriter-effect'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { MessageSquare, Users, Calendar, Mic, FileText } from 'lucide-react'

/**
 * 首页 - 智能CRM客户跟进工具
 *
 * @returns {JSX.Element} 首页组件
 */
export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 主题切换按钮 */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* 渐变背景层 */}
      <div className="absolute inset-0 gradient-bg opacity-10" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* 头部区域 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-[1.2]">
            <TypewriterEffect
              words={[
                {
                  text: "智能CRM",
                  className: "text-primary"
                }
              ]}
              duration={150}
            />
            <br />
            <span className="text-foreground">客户跟进工具</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            通过AI驱动的极致易用工具，将销售从繁琐的客户跟进记录中解放出来，
            让他们聚焦于建立客户关系和赢取订单。
          </p>

          <div className="text-2xl md:text-3xl text-primary font-semibold mb-12">
            <FlipWords
              words={[
                "解放销售生产力",
                "智能记录跟进",
                "提升客户体验",
                "数据驱动决策"
              ]}
              duration={2500}
              className="gradient-text"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Card3D className="p-2">
              <Link href="/customers">
                <Button size="lg" className="text-lg px-12 py-4 min-w-[200px]">
                  开始体验
                  <Users className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </Card3D>

            <Card3D className="p-2">
              <Button variant="outline" size="lg" className="text-lg px-12 py-4 min-w-[200px]">
                了解更多
              </Button>
            </Card3D>
          </div>
        </div>

        {/* 功能特色 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card3D>
            <Card className="text-center h-full">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">语音转文字录入</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  支持按住说话，自动将语音实时转为文字，填充到跟进内容中，大幅提升记录效率。
                </p>
              </CardContent>
            </Card>
          </Card3D>

          <Card3D>
            <Card className="text-center h-full">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">附件与图片上传</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  支持上传与跟进相关的图片和常见文档附件，让记录更加丰富完整。
                </p>
              </CardContent>
            </Card>
          </Card3D>

          <Card3D>
            <Card className="text-center h-full">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">下一步行动管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  设置下次跟进计划和提醒，确保不错过任何重要的客户沟通时机。
                </p>
              </CardContent>
            </Card>
          </Card3D>

          <Card3D>
            <Card className="text-center h-full">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">客户时间轴</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  以时间倒序清晰展示所有历史跟进记录，包括类型、时间、内容和附件信息。
                </p>
              </CardContent>
            </Card>
          </Card3D>

          <Card3D>
            <Card className="text-center h-full">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">对话流式设计</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  内联输入框设计，像发朋友圈一样自然记录，沉浸感最强的跟进体验。
                </p>
              </CardContent>
            </Card>
          </Card3D>

          <Card3D>
            <Card className="text-center h-full">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">团队协作</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  支持多用户协作，团队成员可以查看彼此的跟进记录，提升团队效率。
                </p>
              </CardContent>
            </Card>
          </Card3D>
        </div>

        {/* 演示区域 */}
        <div className="text-center">
          <Card3D>
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/20 backdrop-blur-sm">
              <h2 className="text-3xl font-bold text-foreground mb-8">
                体验智能CRM的客户管理新方式
              </h2>
              <Link href="/customers">
                <Button size="lg" className="text-lg px-12 py-4">
                  查看演示客户
                  <Users className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </Card>
          </Card3D>
        </div>
      </div>
    </div>
  )
}

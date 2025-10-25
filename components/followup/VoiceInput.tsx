/**
 * VoiceInput组件
 * 语音转文字输入组件，基于Web Speech API
 */

'use client'

import * as React from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SpeechRecognitionState } from '@/lib/types/followup'

/**
 * VoiceInput组件Props接口
 */
export interface VoiceInputProps {
  /** 语音识别结果的回调函数 */
  onTranscript: (transcript: string) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * 语音输入组件
 *
 * @param props 组件属性
 * @returns {JSX.Element} 语音输入组件
 */
export function VoiceInput({ onTranscript, disabled = false, className }: VoiceInputProps) {
  const [mounted, setMounted] = React.useState(false)
  const [recognitionState, setRecognitionState] = React.useState<SpeechRecognitionState>('idle')
  const recognitionRef = React.useRef<SpeechRecognition | null>(null)

  // 避免服务端渲染不匹配
  React.useEffect(() => {
    setMounted(true)
  }, [])

  /**
   * 初始化语音识别
   */
  React.useEffect(() => {
    if (!mounted) return

    // 检查浏览器是否支持语音识别
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'zh-CN'

        recognitionRef.current.onstart = () => {
          setRecognitionState('recording')
        }

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript
          onTranscript(transcript)
          setRecognitionState('idle')
        }

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('语音识别错误:', event.error)
          setRecognitionState('error')

          // 2秒后重置状态
          setTimeout(() => {
            setRecognitionState('idle')
          }, 2000)
        }

        recognitionRef.current.onend = () => {
          setRecognitionState('idle')
        }
      }
    }

    // 清理函数
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [onTranscript, mounted])

  /**
   * 开始录音
   */
  const startRecording = React.useCallback(() => {
    if (recognitionRef.current && recognitionState === 'idle') {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('启动语音识别失败:', error)
        setRecognitionState('error')
        setTimeout(() => {
          setRecognitionState('idle')
        }, 2000)
      }
    }
  }, [recognitionState])

  /**
   * 停止录音
   */
  const stopRecording = React.useCallback(() => {
    if (recognitionRef.current && recognitionState === 'recording') {
      recognitionRef.current.stop()
    }
  }, [recognitionState])

  /**
   * 处理按钮点击
   */
  const handleButtonClick = React.useCallback(() => {
    if (recognitionState === 'recording') {
      stopRecording()
    } else if (recognitionState === 'idle') {
      startRecording()
    }
  }, [recognitionState, startRecording, stopRecording])

  /**
   * 获取按钮图标
   */
  const getButtonIcon = React.useCallback(() => {
    switch (recognitionState) {
      case 'recording':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'error':
        return <MicOff className="h-4 w-4" />
      default:
        return <Mic className="h-4 w-4" />
    }
  }, [recognitionState])

  /**
   * 获取按钮文本
   */
  const getButtonText = React.useCallback(() => {
    switch (recognitionState) {
      case 'recording':
        return '录音中...'
      case 'error':
        return '语音识别不可用'
      default:
        return '语音输入'
    }
  }, [recognitionState])

  /**
   * 获取按钮变体
   */
  const getButtonVariant = React.useCallback(() => {
    switch (recognitionState) {
      case 'recording':
        return 'destructive' as const
      case 'error':
        return 'outline' as const
      default:
        return 'ghost' as const
    }
  }, [recognitionState])

  // 检查浏览器支持 - 等待mounted后进行检查
  const isSupported = mounted &&
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

  // 在服务端渲染时显示加载状态
  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className={className}
      >
        <Mic className="h-4 w-4 mr-2" />
        加载中...
      </Button>
    )
  }

  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className={className}
      >
        <MicOff className="h-4 w-4 mr-2" />
        浏览器不支持语音输入
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant={getButtonVariant()}
      size="sm"
      disabled={disabled || recognitionState === 'error'}
      onClick={handleButtonClick}
      className={className}
    >
      {getButtonIcon()}
      <span className="ml-2 hidden sm:inline">
        {getButtonText()}
      </span>
    </Button>
  )
}
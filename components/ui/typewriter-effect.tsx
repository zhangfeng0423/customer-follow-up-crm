'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface TypewriterEffectProps {
  words: Array<{
    text: string
    className?: string
  }>
  className?: string
  cursorClassName?: string
  duration?: number
}

export const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  words,
  className,
  cursorClassName,
  duration = 100
}) => {
  const [mounted, setMounted] = React.useState(false)
  const [currentWordIndex, setCurrentWordIndex] = React.useState(0)
  const [currentCharIndex, setCurrentCharIndex] = React.useState(0)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isPaused, setIsPaused] = React.useState(false)

  // 避免服务端渲染不匹配
  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return

    const currentWord = words[currentWordIndex]

    const handleTyping = () => {
      if (!isDeleting) {
        if (currentCharIndex < currentWord.text.length) {
          setCurrentCharIndex(currentCharIndex + 1)
        } else {
          setIsPaused(true)
          setTimeout(() => {
            setIsPaused(false)
            if (currentWordIndex < words.length - 1) {
              setIsDeleting(true)
            }
          }, 2000)
        }
      } else {
        if (currentCharIndex > 0) {
          setCurrentCharIndex(currentCharIndex - 1)
        } else {
          setIsDeleting(false)
          setCurrentWordIndex(currentWordIndex + 1)
        }
      }
    }

    const timer = setTimeout(handleTyping, duration)
    return () => clearTimeout(timer)
  }, [currentCharIndex, currentWordIndex, isDeleting, isPaused, words, duration, mounted])

  const displayText = words
    .slice(0, currentWordIndex)
    .map(word => word.text)
    .join('')

  const currentWord = words[currentWordIndex]
  const currentText = currentWord
    ? currentWord.text.slice(0, currentCharIndex)
    : ''

  // 在服务端渲染时显示完整的第一个单词，避免hydration不匹配
  if (!mounted) {
    return (
      <div className={cn('inline-flex', className)}>
        <span className="text-foreground">
          {words[0] && (
            <span className={words[0].className}>
              {words[0].text}
            </span>
          )}
        </span>
        <span
          className={cn(
            'animate-pulse',
            cursorClassName || 'text-primary'
          )}
        >
          |
        </span>
      </div>
    )
  }

  return (
    <div className={cn('inline-flex', className)}>
      <span className="text-foreground">
        {displayText && <span>{displayText} </span>}
        {currentWord && (
          <span className={currentWord.className}>
            {currentText}
          </span>
        )}
      </span>
      <span
        className={cn(
          'animate-pulse',
          cursorClassName || 'text-primary'
        )}
      >
        |
      </span>
    </div>
  )
}
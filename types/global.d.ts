/**
 * 全局类型声明
 * 包含Web Speech API等浏览器API的类型定义
 */

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    maxAlternatives: number
    serviceURI: string

    start(): void
    stop(): void
    abort(): void

    onstart: ((event: Event) => void) | null
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: ((event: Event) => void) | null
    onaudiostart: ((event: Event) => void) | null
    onsoundstart: ((event: Event) => void) | null
    onspeechstart: ((event: Event) => void) | null
    onspeechend: ((event: Event) => void) | null
    onsoundend: ((event: Event) => void) | null
    onaudioend: ((event: Event) => void) | null
    onnomatch: ((event: SpeechRecognitionEvent) => void) | null
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported'
    message: string
  }

  interface SpeechRecognitionResultList {
    length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
    isFinal: boolean
  }

  interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition
  }

  var SpeechRecognition: SpeechRecognitionConstructor
}

export {}
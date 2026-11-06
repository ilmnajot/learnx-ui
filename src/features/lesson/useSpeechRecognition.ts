import { useCallback, useEffect, useRef, useState } from 'react'

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: RecognitionResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type RecognitionConstructor = new () => Recognition

function recognitionConstructor(): RecognitionConstructor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export type SpeechError = 'denied' | 'failed' | null

/** Wraps the browser's speech recognition. Unsupported browsers fall back to typing. */
export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<SpeechError>(null)
  const recognition = useRef<Recognition | null>(null)
  const callback = useRef(onTranscript)
  useEffect(() => {
    callback.current = onTranscript
  }, [onTranscript])
  const supported = recognitionConstructor() !== undefined

  useEffect(() => () => recognition.current?.abort(), [])

  const start = useCallback(() => {
    const Constructor = recognitionConstructor()
    if (!Constructor) return
    const instance = new Constructor()
    instance.lang = 'en-US'
    instance.interimResults = true
    instance.continuous = true
    instance.onresult = (event) => {
      let text = ''
      for (let i = 0; i < event.results.length; i++) text += event.results[i]?.[0]?.transcript ?? ''
      callback.current(text.trim())
    }
    instance.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return
      setError(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'denied' : 'failed')
    }
    instance.onend = () => setListening(false)
    recognition.current = instance
    setError(null)
    setListening(true)
    instance.start()
  }, [])

  const stop = useCallback(() => recognition.current?.stop(), [])

  return { supported, listening, error, start, stop }
}

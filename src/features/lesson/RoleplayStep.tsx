import { useMutation } from '@tanstack/react-query'
import { Mic, Square } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import type { RoleplayStarted, RoleplayTurn } from '../../api/types'
import { Button, ErrorNote, ListenButton, speak } from '../../components/ui'
import { t } from '../../i18n'
import { useSpeechRecognition } from './useSpeechRecognition'

interface Exchange {
  userText: string
  turn: RoleplayTurn
}

export function RoleplayStep({ lessonId, onFinished }: { lessonId: string; onFinished: () => void }) {
  const [session, setSession] = useState<RoleplayStarted | null>(null)
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [text, setText] = useState('')
  const startedRef = useRef(false)

  const start = useMutation({
    mutationFn: () => api<RoleplayStarted>(`/lessons/${lessonId}/roleplay`, { method: 'POST' }),
    onSuccess: setSession,
  })
  const startSession = start.mutate

  useEffect(() => {
    // Guards against React StrictMode's double effect creating a second session.
    if (startedRef.current) return
    startedRef.current = true
    startSession()
  }, [startSession])

  const send = useMutation({
    mutationFn: (userText: string) =>
      api<RoleplayTurn>(`/roleplay/${session?.sessionId}/turns`, { method: 'POST', body: { text: userText } }),
    onSuccess: (turn, userText) => {
      setExchanges((current) => [...current, { userText, turn }])
      setText('')
      speak(turn.reply)
    },
  })

  const speech = useSpeechRecognition(setText)
  const last = exchanges.at(-1)
  const finished = last?.turn.finished ?? false

  function submit(event: FormEvent) {
    event.preventDefault()
    if (speech.listening) speech.stop()
    const value = text.trim()
    if (value && !send.isPending) send.mutate(value)
  }

  if (!session) {
    return start.isError
      ? <ErrorNote error={start.error} />
      : <p className="muted center pad">{t.loading}</p>
  }

  return (
    <div className="stack">
      <div className="row between">
        <div className="bubble coach">{session.openingLine}</div>
        <ListenButton text={session.openingLine} />
      </div>

      {exchanges.map(({ userText, turn }) => (
        <div key={turn.turnNumber} className="stack-sm">
          <div className="bubble learner">{userText}</div>
          <div className="feedback">
            <span className="eyebrow ok">{t.sayLikeThis}</span>
            <div className="row between">
              <p>{turn.improved}</p>
              <ListenButton text={turn.improved} />
            </div>
          </div>
          {turn.tips.length > 0 ? (
            <div className="card tip">
              <span className="eyebrow">{t.tip}</span>
              {turn.tips.map((tip) => <p key={tip}>{tip}</p>)}
            </div>
          ) : (
            <p className="ok small">{t.noCorrections}</p>
          )}
          {turn.provider === 'rule_based' && <p className="muted small">{t.basicChecker}</p>}
          <div className="row between">
            <div className="bubble coach">{turn.reply}</div>
            <ListenButton text={turn.reply} />
          </div>
        </div>
      ))}

      {send.isPending && (
        <div className="bubble coach typing" role="status" aria-label={t.checking}>
          <span /><span /><span />
        </div>
      )}

      {finished ? (
        <Button variant="primary" onClick={onFinished}>{t.completeLesson}</Button>
      ) : (
        <form className="stack-sm" onSubmit={submit}>
          <div className="row between">
            <span className="eyebrow">{t.yourTurn}</span>
            <span className="muted small mono">{t.turnOf(exchanges.length + 1, session.maxTurns)}</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.typePlaceholder}
            aria-label={t.yourTurn}
            maxLength={500}
            rows={3}
            disabled={send.isPending}
          />
          {!speech.supported && <p className="muted small">{t.micUnsupported}</p>}
          {speech.error === 'denied' && <p className="error">{t.micDenied}</p>}
          {speech.error === 'failed' && <p className="error">{t.micError}</p>}
          <ErrorNote error={send.error} />
          <div className="row gap">
            {speech.supported && (
              <Button
                className={speech.listening ? 'recording grow' : 'grow'}
                aria-pressed={speech.listening}
                onClick={speech.listening ? speech.stop : speech.start}
                disabled={send.isPending}
              >
                {speech.listening
                  ? <><Square size={16} aria-hidden /> {t.stopSpeaking}</>
                  : <><Mic size={16} aria-hidden /> {t.speak}</>}
              </Button>
            )}
            <Button type="submit" variant="primary" className="grow" disabled={send.isPending || !text.trim()}>
              {send.isPending ? t.checking : t.send}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

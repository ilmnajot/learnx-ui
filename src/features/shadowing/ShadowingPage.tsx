import { useQuery } from '@tanstack/react-query'
import { Check, Mic, RotateCcw, Snail, Square, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '../../api/client'
import type { ReviewCard, VideoDetail } from '../../api/types'
import { Button, ProgressBar, QueryView, Screen, speak } from '../../components/ui'
import { t } from '../../i18n'
import { GameEnd } from '../games/GameEnd'
import { useSpeechRecognition } from '../lesson/useSpeechRecognition'
import { compareSpeech, PASS_PERCENT } from './speechMatch'

const SENTENCES = 5
const SLOW_RATE = 0.7

export interface Sentence {
  id: string
  text: string
  translation: string
}

function SentenceCard({ sentence, onDone }: { sentence: Sentence; onDone: (passed: boolean) => void }) {
  const [heard, setHeard] = useState('')
  const [started, setStarted] = useState(false)
  const [best, setBest] = useState(0)
  const speech = useSpeechRecognition((text) => {
    setHeard(text)
    setBest((current) => Math.max(current, compareSpeech(sentence.text, text).percent))
  })
  const { listening, stop } = speech
  const match = useMemo(() => compareSpeech(sentence.text, heard), [sentence.text, heard])
  const percent = match.percent
  const attempted = started && !listening

  useEffect(() => {
    // Everything was caught, so the learner doesn't have to press stop.
    if (listening && percent === 100) stop()
  }, [percent, listening, stop])

  function record() {
    window.speechSynthesis?.cancel()
    setHeard('')
    setStarted(true)
    speech.start()
  }

  const showWords = listening || (attempted && heard !== '')
  const passed = best >= PASS_PERCENT

  return (
    <div className="stack">
      <div className="card center stack-sm">
        <p className="sentence-line" aria-live="polite">
          {match.words.map(({ word, matched }, i) => (
            <span key={`${word}-${i}`} className={showWords ? (matched ? 'said hit' : 'said miss') : 'said'}>{word} </span>
          ))}
        </p>
        <p className="muted small">{sentence.translation}</p>
        <div className="row center-row gap">
          <Button onClick={() => speak(sentence.text)} disabled={listening}>
            <Volume2 size={16} aria-hidden /> {t.listen}
          </Button>
          <Button onClick={() => speak(sentence.text, SLOW_RATE)} disabled={listening}>
            <Snail size={16} aria-hidden /> {t.shadowSlow}
          </Button>
        </div>
      </div>

      {speech.supported && speech.error === null ? (
        <>
          {attempted && heard === '' && <p className="muted center small">{t.shadowNotHeard}</p>}
          {attempted && heard !== '' && (
            <p className={`center score ${match.passed ? 'ok' : 'muted'}`} role="status">
              {percent}% {match.passed ? t.shadowGreat : percent >= 50 ? t.shadowAlmost : t.shadowListenAgain}
            </p>
          )}
          <Button
            variant={listening || !attempted ? 'primary' : 'secondary'}
            className={listening ? 'recording' : ''}
            aria-pressed={listening}
            onClick={listening ? speech.stop : record}
          >
            {listening && <><Square size={16} aria-hidden /> {t.stopSpeaking}</>}
            {!listening && !attempted && <><Mic size={16} aria-hidden /> {t.shadowRepeat}</>}
            {!listening && attempted && <><RotateCcw size={16} aria-hidden /> {t.shadowAgain}</>}
          </Button>
          {(attempted || best > 0) && !listening && (
            <Button variant={passed ? 'primary' : 'ghost'} onClick={() => onDone(passed)}>
              {passed ? t.next : t.shadowSkip}
            </Button>
          )}
        </>
      ) : (
        <>
          <p className="notice small">
            {speech.error === 'denied' ? t.micDenied : speech.error === 'failed' ? t.micError : t.micUnsupported}{' '}
            {t.shadowNoMic}
          </p>
          <Button variant="primary" onClick={() => onDone(false)}>
            <Check size={16} aria-hidden /> {t.shadowSaidIt}
          </Button>
        </>
      )}
    </div>
  )
}

export function ShadowingSession({ sentences, onReplay }: { sentences: Sentence[]; onReplay: () => void }) {
  const [index, setIndex] = useState(0)
  const [passed, setPassed] = useState(0)
  const sentence = sentences[index]

  if (!sentence) return <GameEnd game="SHADOWING" correct={passed} total={sentences.length} onReplay={onReplay} />

  return (
    <div className="stack">
      <p className="muted small">{t.shadowingSteps}</p>
      <ProgressBar percent={(index / sentences.length) * 100} label={t.shadowing} />
      <span className="muted small mono">{t.round(index + 1, sentences.length)}</span>
      <SentenceCard
        key={sentence.id}
        sentence={sentence}
        onDone={(wasPassed) => {
          if (wasPassed) setPassed(passed + 1)
          setIndex(index + 1)
        }}
      />
    </div>
  )
}

export default function ShadowingPage() {
  const [params] = useSearchParams()
  const videoId = params.get('video')
  const [round, setRound] = useState(0)
  const query = useQuery({
    queryKey: ['shadowing', videoId, round],
    queryFn: async (): Promise<Sentence[]> => {
      if (videoId) {
        const detail = await api<VideoDetail>(`/videos/${encodeURIComponent(videoId)}`)
        return detail.phrases.map((p) => ({ id: p.id, text: p.example, translation: p.translation }))
      }
      const cards = await api<ReviewCard[]>(`/games/pool?size=${SENTENCES}`)
      return cards.map((c) => ({ id: c.phraseId, text: c.example, translation: c.translation }))
    },
    staleTime: Infinity,
    gcTime: 0,
  })

  return (
    <Screen backTo={videoId ? `/videos/${videoId}` : '/games'} title={t.shadowing}>
      <QueryView query={query}>
        {(sentences) => <ShadowingSession key={round} sentences={sentences} onReplay={() => setRound(round + 1)} />}
      </QueryView>
    </Screen>
  )
}

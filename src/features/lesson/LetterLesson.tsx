import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Ear, Eye, Sparkles, Volume2, XCircle, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client'
import type { Letter } from '../../api/types'
import { Confetti } from '../../components/Confetti'
import { Button, ErrorNote, ProgressBar, QueryView, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'
import { buildRounds, playLetter, type Round } from './letterLogic'

type Step = 'meet' | 'quiz' | 'done'

const STEPS: { id: Step; icon: LucideIcon; label: string }[] = [
  { id: 'meet', icon: Eye, label: t.stepMeet },
  { id: 'quiz', icon: Ear, label: t.stepQuiz },
  { id: 'done', icon: Sparkles, label: t.stepResult },
]

function Arabic({ children, className = '' }: { children: string; className?: string }) {
  return <span lang="ar" dir="rtl" className={`arabic ${className}`}>{children}</span>
}

function useArabicVoiceMissing(): boolean {
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const check = () => {
      const voices = window.speechSynthesis.getVoices()
      // Voices load asynchronously. An empty list means "not loaded yet", not "none".
      if (voices.length > 0) setMissing(!voices.some((v) => v.lang.toLowerCase().startsWith('ar')))
    }
    check()
    window.speechSynthesis.addEventListener('voiceschanged', check)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', check)
  }, [])
  return missing
}

function MeetStep({ letter, onNext }: { letter: Letter; onNext: () => void }) {
  const voiceMissing = useArabicVoiceMissing()
  const forms = [
    { label: t.formIsolated, form: letter.isolatedForm },
    { label: t.formInitial, form: letter.initialForm },
    { label: t.formMedial, form: letter.medialForm },
    { label: t.formFinal, form: letter.finalForm },
  ]
  return (
    <div className="stack">
      <div className="card center stack-sm">
        <Arabic className="letter-hero pop">{letter.glyph}</Arabic>
        <p className="prompt">{letter.name} — «{letter.latin}»</p>
        <p className="muted">{letter.hint}</p>
        <Button onClick={() => playLetter(letter)}><Volume2 size={18} aria-hidden /> {t.letterPlay}</Button>
        {voiceMissing && !letter.audioUrl && <p className="muted small">{t.letterNoVoice}</p>}
      </div>
      <section className="card stack-sm">
        <strong>{t.letterForms}</strong>
        <div className="letter-forms">
          {forms.map(({ label, form }) => (
            <div key={label} className="letter-form">
              <Arabic>{form}</Arabic>
              <span className="muted small">{label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="card stack-xs">
        <strong>{t.letterExample}</strong>
        <p><Arabic className="letter-word">{letter.word}</Arabic></p>
        <p className="muted">{letter.wordLatin} — {letter.wordMeaning}</p>
      </section>
      <Button variant="primary" onClick={onNext}>{t.letterStartQuiz}</Button>
    </div>
  )
}

function QuizStep({ rounds, onFinished }: { rounds: Round[]; onFinished: (right: number) => void }) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<Letter | null>(null)
  const [right, setRight] = useState(0)
  const round = rounds[index]

  useEffect(() => {
    if (round?.kind === 'hear') playLetter(round.answer)
  }, [round])

  if (!round) return null
  const correct = picked?.glyph === round.answer.glyph

  return (
    <div className="stack">
      <ProgressBar percent={(index / rounds.length) * 100} label={t.letterQuiz} />
      <div className="card center stack-sm">
        <span className="eyebrow">{round.kind === 'hear' ? t.letterHearHint : t.letterSeeHint}</span>
        {round.kind === 'hear' ? (
          <Button onClick={() => playLetter(round.answer)}><Volume2 size={18} aria-hidden /> {t.letterPlay}</Button>
        ) : (
          <Arabic className="letter-hero">{round.shown ?? round.answer.glyph}</Arabic>
        )}
      </div>
      <div className="letter-options">
        {round.options.map((option) => {
          const state = picked === null ? '' : option.glyph === round.answer.glyph ? 'ok' : option === picked ? 'bad' : ''
          return (
            <Button
              key={option.glyph}
              className={`letter-option ${state}`}
              disabled={picked !== null}
              aria-label={round.kind === 'hear' ? option.name : option.latin}
              onClick={() => {
                setPicked(option)
                if (option.glyph === round.answer.glyph) setRight((r) => r + 1)
              }}
            >
              {round.kind === 'hear' ? <Arabic>{option.glyph}</Arabic> : <span>{option.latin}</span>}
            </Button>
          )
        })}
      </div>
      {picked !== null && (
        <>
          <p className={correct ? 'ok center' : 'bad center'} role="status">
            {correct
              ? <><CheckCircle2 size={18} aria-hidden /> {t.letterCorrect}</>
              : <><XCircle size={18} aria-hidden /> {t.letterWrong(`${round.answer.glyph} — ${round.answer.name} «${round.answer.latin}»`)}</>}
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setPicked(null)
              if (index + 1 < rounds.length) setIndex(index + 1)
              else onFinished(right)
            }}
          >
            {t.next}
          </Button>
        </>
      )}
    </div>
  )
}

export function LetterLesson({ lessonId, letter, canDo }: { lessonId: string; letter: Letter; canDo: string }) {
  const queryClient = useQueryClient()
  const lettersQuery = useApiQuery<Letter[]>(['letters'], '/letters')
  const [step, setStep] = useState<Step>('meet')
  const [score, setScore] = useState(0)

  const complete = useMutation({
    mutationFn: () => api(`/lessons/${lessonId}/complete`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries()
      setStep('done')
    },
  })

  const letters = lettersQuery.data
  const rounds = useMemo(() => (letters ? buildRounds(letter, letters) : []), [letter, letters])
  const next = letters?.[letters.findIndex((l) => l.glyph === letter.glyph) + 1]

  return (
    <div className="stack">
      <ol className="steps" aria-label={letter.name}>
        {STEPS.map(({ id, icon: Icon, label }, i) => {
          const current = STEPS.findIndex((s) => s.id === step)
          const state = i < current ? 'past' : i === current ? 'now' : ''
          return (
            <li key={id} className={`step ${state}`} aria-current={id === step ? 'step' : undefined}>
              <span className="step-dot"><Icon size={16} aria-hidden /></span>
              <span>{label}</span>
            </li>
          )
        })}
      </ol>
      {step === 'meet' && <MeetStep letter={letter} onNext={() => setStep('quiz')} />}
      {step === 'quiz' && (
        <QueryView query={lettersQuery}>
          {() => (
            <>
              <QuizStep rounds={rounds} onFinished={(right) => { setScore(right); complete.mutate() }} />
              <ErrorNote error={complete.error} />
            </>
          )}
        </QueryView>
      )}
      {step === 'done' && (
        <div className="center stack">
          <Confetti />
          <CheckCircle2 size={56} className="ok self-center pop" aria-hidden />
          <p className="prompt">{canDo}</p>
          <p className="muted">{t.letterScore(score, rounds.length)}</p>
          <p className="muted">{t.phrasesScheduled}</p>
          {next
            ? <Link className="btn btn-primary" to={`/lessons/${next.lessonId}`}>{t.letterNext}: <Arabic>{next.glyph}</Arabic></Link>
            : <Link className="btn btn-primary" to="/">{t.home}</Link>}
        </div>
      )}
    </div>
  )
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Brain, CheckCircle2, Mic, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../../api/client'
import type { LessonDetail, Phrase } from '../../api/types'
import { Confetti } from '../../components/Confetti'
import { Button, ErrorNote, ListenButton, QueryView, Screen, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'
import { RoleplayStep } from './RoleplayStep'

type Step = 'learn' | 'recall' | 'roleplay' | 'done'

const STEPS: { id: Step; icon: LucideIcon; label: string }[] = [
  { id: 'learn', icon: BookOpen, label: t.stepLearn },
  { id: 'recall', icon: Brain, label: t.stepRecall },
  { id: 'roleplay', icon: Mic, label: t.stepSpeak },
]

function LearnStep({ phrases, onNext }: { phrases: Phrase[]; onNext: () => void }) {
  return (
    <div className="stack">
      {phrases.map((phrase) => (
        <article key={phrase.id} className="card stack-sm">
          <div className="row between">
            <strong className="phrase">{phrase.english}</strong>
            <ListenButton text={phrase.example} />
          </div>
          <p className="muted">{phrase.translation}</p>
          <p className="example">{phrase.example}</p>
        </article>
      ))}
      <Button variant="primary" onClick={onNext}>{t.startRecall}</Button>
    </div>
  )
}

function RecallStep({ phrases, onNext }: { phrases: Phrase[]; onNext: () => void }) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const phrase = phrases[index]
  if (!phrase) return null

  return (
    <div className="stack">
      <div className="card center stack-sm">
        <span className="eyebrow">{t.sayInEnglish}</span>
        <p className="prompt">{phrase.translation}</p>
        {revealed
          ? <p className="answer">{phrase.english}</p>
          : <p className="muted small">{t.tryAloud}</p>}
      </div>
      {revealed ? (
        <Button
          variant="primary"
          onClick={() => {
            setRevealed(false)
            if (index + 1 < phrases.length) setIndex(index + 1)
            else onNext()
          }}
        >
          {t.next}
        </Button>
      ) : (
        <Button variant="primary" onClick={() => setRevealed(true)}>{t.showAnswer}</Button>
      )}
    </div>
  )
}

export default function LessonPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const query = useApiQuery<LessonDetail>(['lesson', id], `/lessons/${id}`)
  const [step, setStep] = useState<Step>('learn')

  const complete = useMutation({
    mutationFn: () => api(`/lessons/${id}/complete`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries()
      setStep('done')
    },
  })

  const titles: Record<Step, string> = {
    learn: t.lessonLearn,
    recall: t.lessonRecall,
    roleplay: t.lessonRoleplay,
    done: t.lessonDone,
  }

  return (
    <Screen backTo="/" title={titles[step]}>
      <QueryView query={query}>
        {({ lesson, phrases }) => (
          <div className="stack">
            <ol className="steps" aria-label={lesson.title}>
              {STEPS.map(({ id: stepId, icon: Icon, label }, i) => {
                const state = i < STEPS.findIndex((s) => s.id === step) || step === 'done' ? 'past' : stepId === step ? 'now' : ''
                return (
                  <li key={stepId} className={`step ${state}`} aria-current={stepId === step ? 'step' : undefined}>
                    <span className="step-dot"><Icon size={16} aria-hidden /></span>
                    <span>{label}</span>
                  </li>
                )
              })}
            </ol>
            {step !== 'done' && <h2>{lesson.title}</h2>}
            {step === 'learn' && <LearnStep phrases={phrases} onNext={() => setStep('recall')} />}
            {step === 'recall' && <RecallStep phrases={phrases} onNext={() => setStep('roleplay')} />}
            {step === 'roleplay' && (
              <>
                <RoleplayStep lessonId={id} onFinished={() => complete.mutate()} />
                <ErrorNote error={complete.error} />
              </>
            )}
            {step === 'done' && (
              <div className="center stack">
                <Confetti />
                <CheckCircle2 size={56} className="ok self-center pop" aria-hidden />
                <p className="prompt">{lesson.canDo}</p>
                <p className="muted">{t.phrasesScheduled}</p>
                <Link className="btn btn-primary" to="/">{t.home}</Link>
              </div>
            )}
          </div>
        )}
      </QueryView>
    </Screen>
  )
}

import { useMutation } from '@tanstack/react-query'
import {
  BookOpenText,
  Building2,
  Cloud,
  Database,
  Globe,
  Handshake,
  Languages,
  LayoutTemplate,
  MessagesSquare,
  Server,
  Smartphone,
  Sparkles,
  TestTube2,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api/client'
import type { PlacementQuestion, PlacementResult, User } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Confetti } from '../../components/Confetti'
import { Button, ErrorNote, ProgressBar, QueryView, Screen, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'

type Step = 'course' | 'arabic' | 'role' | 'goal' | 'placement' | 'result'

const ROLE_ICONS: LucideIcon[] = [Server, LayoutTemplate, Smartphone, TestTube2, Cloud, Database, Sparkles]
const GOAL_ICONS: LucideIcon[] = [MessagesSquare, Building2, UserCheck, Handshake]

function Choices({ options, icons, onPick }: { options: readonly string[]; icons: LucideIcon[]; onPick: (value: string) => void }) {
  return (
    <div className="stack-sm">
      {options.map((option, i) => {
        const Icon = icons[i] ?? Globe
        return (
          <Button key={option} className="choice" onClick={() => onPick(option)}>
            <span className="chip green"><Icon size={18} aria-hidden /></span>
            {option}
          </Button>
        )
      })}
    </div>
  )
}

function Placement({ onDone }: { onDone: (result: PlacementResult) => void }) {
  const query = useApiQuery<PlacementQuestion[]>(['placement'], '/placement/questions')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([])
  const submit = useMutation({
    mutationFn: (body: typeof answers) =>
      api<PlacementResult>('/placement/submit', { method: 'POST', body: { answers: body } }),
    onSuccess: onDone,
  })

  return (
    <QueryView query={query}>
      {(questions) => {
        const question = questions[index]
        if (!question) return <ErrorNote error={submit.error} />
        return (
          <div className="stack">
            <p className="muted">{t.onboardingPlacementHint}</p>
            <ProgressBar percent={(index / questions.length) * 100} label={t.onboardingPlacement} />
            <div key={question.id} className="stack question">
              <p className="prompt">{question.prompt}</p>
              <div className="stack-sm">
                {question.options.map((option, optionIndex) => (
                  <Button
                    key={option}
                    className="choice"
                    disabled={submit.isPending}
                    onClick={() => {
                      const next = [...answers, { questionId: question.id, selectedIndex: optionIndex }]
                      setAnswers(next)
                      if (index + 1 < questions.length) setIndex(index + 1)
                      else submit.mutate(next)
                    }}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
            <ErrorNote error={submit.error} />
          </div>
        )
      }}
    </QueryView>
  )
}

export default function OnboardingPage() {
  const { setUser } = useAuth()
  const [step, setStep] = useState<Step>('course')
  const [jobRole, setJobRole] = useState('')
  const [goal, setGoal] = useState('')
  const [result, setResult] = useState<PlacementResult | null>(null)

  const complete = useMutation({
    mutationFn: () => api<User>('/me', { method: 'PATCH', body: { course: 'ENGLISH', jobRole, goal, onboarded: true } }),
    onSuccess: setUser,
  })
  // The alphabet course has no levels, so Arabic learners skip the role, goal and placement questions.
  const startArabic = useMutation({
    mutationFn: () => api<User>('/me', { method: 'PATCH', body: { course: 'ARABIC_LETTERS', onboarded: true } }),
    onSuccess: setUser,
  })

  return (
    <Screen>
      <div className="narrow stack">
        <p className="brand"><span aria-hidden>&gt;_</span> {t.appName}</p>
        {step === 'course' && (
          <>
            <h1>{t.onboardingCourse}</h1>
            <div className="stack-sm">
              <Button className="choice" onClick={() => setStep('role')}>
                <span className="chip green"><Languages size={18} aria-hidden /></span>
                <span className="stack-xs">
                  <strong>{t.courseEnglish}</strong>
                  <span className="muted small">{t.courseEnglishHint}</span>
                </span>
              </Button>
              <Button className="choice" onClick={() => setStep('arabic')}>
                <span className="chip violet"><BookOpenText size={18} aria-hidden /></span>
                <span className="stack-xs">
                  <strong>{t.courseArabic}</strong>
                  <span className="muted small">{t.courseArabicHint}</span>
                </span>
              </Button>
            </div>
          </>
        )}
        {step === 'arabic' && (
          <>
            <h1>{t.arabicReady}</h1>
            <div className="card center stack-sm">
              <p className="letter-hero arabic" lang="ar" dir="rtl">أ ب ت</p>
              <p className="muted">{t.arabicReadyHint}</p>
            </div>
            <ErrorNote error={startArabic.error} />
            <Button variant="primary" disabled={startArabic.isPending} onClick={() => startArabic.mutate()}>
              {t.onboardingStart}
            </Button>
            <Button onClick={() => setStep('course')}>{t.back}</Button>
          </>
        )}
        {step === 'role' && (
          <>
            <h1>{t.onboardingRole}</h1>
            <Choices options={t.roles} icons={ROLE_ICONS} onPick={(value) => { setJobRole(value); setStep('goal') }} />
          </>
        )}
        {step === 'goal' && (
          <>
            <h1>{t.onboardingGoal}</h1>
            <Choices options={t.goals} icons={GOAL_ICONS} onPick={(value) => { setGoal(value); setStep('placement') }} />
          </>
        )}
        {step === 'placement' && (
          <>
            <h1>{t.onboardingPlacement}</h1>
            <Placement onDone={(r) => { setResult(r); setStep('result') }} />
          </>
        )}
        {step === 'result' && result && (
          <>
            <Confetti />
            <h1>{t.onboardingResult}</h1>
            <div className="card center">
              <p className="big-number pop">{result.level}</p>
              <p className="muted">{t.score(result.score, result.maxScore)}</p>
            </div>
            <ErrorNote error={complete.error} />
            <Button variant="primary" disabled={complete.isPending} onClick={() => complete.mutate()}>
              {t.onboardingStart}
            </Button>
          </>
        )}
      </div>
    </Screen>
  )
}

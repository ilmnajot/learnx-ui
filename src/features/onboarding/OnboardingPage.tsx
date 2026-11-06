import { useMutation } from '@tanstack/react-query'
import {
  Building2,
  Cloud,
  Database,
  Globe,
  Handshake,
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

type Step = 'role' | 'goal' | 'placement' | 'result'

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
  const [step, setStep] = useState<Step>('role')
  const [jobRole, setJobRole] = useState('')
  const [goal, setGoal] = useState('')
  const [result, setResult] = useState<PlacementResult | null>(null)

  const complete = useMutation({
    mutationFn: () => api<User>('/me', { method: 'PATCH', body: { jobRole, goal, onboarded: true } }),
    onSuccess: setUser,
  })

  return (
    <Screen>
      <div className="narrow stack">
        <p className="brand"><span aria-hidden>&gt;_</span> {t.appName}</p>
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

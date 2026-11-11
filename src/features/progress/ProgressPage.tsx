import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Globe, MessageSquarePlus, Repeat, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { api } from '../../api/client'
import type { Course, Progress, User } from '../../api/types'
import { useAuth, useUser } from '../../auth/AuthContext'
import { ThemeToggle } from '../../components/ThemeToggle'
import { Button, ErrorNote, QueryView, Screen, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'

const HEATMAP_DAYS = 28

/** Local calendar days, oldest first. The server sends active days in the learner's timezone. */
function lastDays(count: number): string[] {
  const days: string[] = []
  const today = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const month = String(day.getMonth() + 1).padStart(2, '0')
    const date = String(day.getDate()).padStart(2, '0')
    days.push(`${day.getFullYear()}-${month}-${date}`)
  }
  return days
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span className="muted small">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const COURSE_NAMES: Record<Course, string> = { ENGLISH: t.courseEnglish, ARABIC_LETTERS: t.courseArabic }

/** Progress in each course is kept, so learners can switch back and forth. */
function CourseSwitch() {
  const user = useUser()
  const { setUser } = useAuth()
  const queryClient = useQueryClient()
  const other: Course = user.course === 'ARABIC_LETTERS' ? 'ENGLISH' : 'ARABIC_LETTERS'
  const change = useMutation({
    mutationFn: () => api<User>('/me', { method: 'PATCH', body: { course: other } }),
    onSuccess: (updated) => {
      setUser(updated)
      void queryClient.invalidateQueries()
    },
  })
  return (
    <>
      <p className="muted small">{t.yourCourse}: {COURSE_NAMES[user.course]}</p>
      <Button disabled={change.isPending} onClick={() => change.mutate()}>
        <Repeat size={16} aria-hidden /> {t.switchCourse(COURSE_NAMES[other])}
      </Button>
      <ErrorNote error={change.error} />
    </>
  )
}

export default function ProgressPage() {
  const user = useUser()
  const { logout } = useAuth()
  const query = useApiQuery<Progress>(['progress'], '/progress')

  return (
    <Screen title={t.progressTitle}>
      <QueryView query={query}>
        {(progress) => {
          const active = new Set(progress.recentDays)
          return (
            <div className="stack">
              <div className="stats">
                <Stat label={t.currentStreak} value={t.streakDays(progress.streak)} />
                <Stat label={t.practiceDays} value={progress.totalPracticeDays} />
                <Stat label={t.lessonsDone} value={`${progress.completedLessons}/${progress.totalLessons}`} />
              </div>

              <section className="card stack-sm">
                <strong>{t.last28}</strong>
                <div className="heatmap">
                  {lastDays(HEATMAP_DAYS).map((day, i) => (
                    <span key={day} title={day} className={active.has(day) ? 'cell on' : 'cell'} style={{ animationDelay: `${i * 18}ms` }} />
                  ))}
                </div>
              </section>

              <section className="card stack-sm">
                <strong>{t.skills}</strong>
                {progress.canDos.length === 0 ? (
                  <p className="muted small">{t.noSkills}</p>
                ) : (
                  <ul className="list">
                    {progress.canDos.map((skill) => (
                      <li key={skill} className="row gap skill">
                        <CheckCircle2 size={16} className="ok" aria-hidden /> <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card stack-sm">
                <div className="row between">
                  <strong>{t.account}</strong>
                  <ThemeToggle />
                </div>
                <p className="muted small">{user.displayName} · {user.email}</p>
                {user.level && user.course === 'ENGLISH' && <p className="muted small">{t.level}: {user.level}</p>}
                <CourseSwitch />
                {user.admin && (
                  <Link to="/admin" className="btn btn-primary"><ShieldCheck size={16} aria-hidden /> {t.adminPanel}</Link>
                )}
                <Link to="/feedback" className="btn btn-secondary"><MessageSquarePlus size={16} aria-hidden /> {t.feedbackTitle}</Link>
                <Link to="/about" className="btn btn-secondary"><Globe size={16} aria-hidden /> {t.aboutLink}</Link>
                <Button onClick={() => void logout()}>{t.signOut}</Button>
              </section>
            </div>
          )
        }}
      </QueryView>
    </Screen>
  )
}

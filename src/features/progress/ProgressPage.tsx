import { CheckCircle2 } from 'lucide-react'
import type { Progress } from '../../api/types'
import { useAuth, useUser } from '../../auth/AuthContext'
import { Button, QueryView, Screen, useApiQuery } from '../../components/ui'
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
                  {lastDays(HEATMAP_DAYS).map((day) => (
                    <span key={day} title={day} className={active.has(day) ? 'cell on' : 'cell'} />
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
                <strong>{t.account}</strong>
                <p className="muted small">{user.displayName} · {user.email}</p>
                {user.level && <p className="muted small">{t.level}: {user.level}</p>}
                <Button onClick={() => void logout()}>{t.signOut}</Button>
              </section>
            </div>
          )
        }}
      </QueryView>
    </Screen>
  )
}

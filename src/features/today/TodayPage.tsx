import { Flame, PenLine, RefreshCw } from 'lucide-react'
import { Link } from 'react-router'
import type { Today } from '../../api/types'
import { useUser } from '../../auth/AuthContext'
import { ProgressBar, QueryView, Screen, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'

export default function TodayPage() {
  const user = useUser()
  const query = useApiQuery<Today>(['today'], '/today')

  return (
    <Screen>
      <QueryView query={query}>
        {(today) => (
          <div className="stack">
            <header className="row between">
              <h1>{t.greeting(user.displayName)}</h1>
              <span className="pill"><Flame size={16} aria-hidden /> {t.streakDays(today.streak)}</span>
            </header>

            {today.nextLesson ? (
              <section className="card hero stack-sm">
                <span className="eyebrow">{t.todaySituation}</span>
                <h2>{today.nextLesson.title}</h2>
                <p className="muted">{t.lessonMeta(today.nextLesson.estMinutes)}</p>
                <Link className="btn btn-primary" to={`/lessons/${today.nextLesson.id}`}>{t.startLesson}</Link>
              </section>
            ) : (
              <section className="card hero"><p>{t.courseComplete}</p></section>
            )}

            <Link className="tired" to={today.dueReviews > 0 ? '/review?limit=3' : '/games/match?size=4'}>
              {t.tiredOption}
            </Link>

            {today.dueReviews > 0 && (
              <Link className="card row between link-card" to="/review">
                <span><RefreshCw size={16} aria-hidden /> {t.phrasesDue(today.dueReviews)}</span>
                <span className="link-text">{t.review}</span>
              </Link>
            )}

            <section className="card stack-sm">
              <div className="row between">
                <strong>{t.courseProgress}</strong>
                <span className="muted mono">{today.completedLessons} / {today.totalLessons}</span>
              </div>
              <ProgressBar percent={(today.completedLessons / Math.max(today.totalLessons, 1)) * 100} label={t.courseProgress} />
              {today.latestCanDo && <p className="muted small">{t.latestSkill}: {today.latestCanDo}</p>}
            </section>

            <Link className="card row between link-card" to="/writing">
              <span>
                <strong><PenLine size={16} aria-hidden /> {t.fixMessage}</strong>
                <br />
                <span className="muted small">{t.fixMessageHint}</span>
              </span>
            </Link>
          </div>
        )}
      </QueryView>
    </Screen>
  )
}

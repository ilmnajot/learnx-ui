import { ArrowRight, BatteryLow, Clapperboard, Clock, Flame, Mic, PenLine, RefreshCw, Sparkles } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import type { Today } from '../../api/types'
import { useUser } from '../../auth/AuthContext'
import { ThemeToggle } from '../../components/ThemeToggle'
import { QueryView, Screen, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'

function ProgressRing({ done, total }: { done: number; total: number }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const ratio = done / Math.max(total, 1)
  return (
    <svg className="ring" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label={`${done} / ${total}`}>
      <circle className="ring-track" cx="32" cy="32" r={radius} />
      <circle
        className="ring-fill"
        cx="32"
        cy="32"
        r={radius}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        style={{ '--ring-from': `${circumference}` } as CSSProperties}
      />
      <text x="32" y="37" textAnchor="middle">{done}</text>
    </svg>
  )
}

export default function TodayPage() {
  const user = useUser()
  const query = useApiQuery<Today>(['today'], '/today')
  const arabic = user.course === 'ARABIC_LETTERS'

  return (
    <Screen>
      <QueryView query={query}>
        {(today) => (
          <div className="stack">
            <header className="row between">
              <h1>{t.greeting(user.displayName)}</h1>
              <div className="row gap-sm">
                <span className={today.streak > 0 ? 'pill flame lit' : 'pill flame'}>
                  <Flame size={16} aria-hidden /> {t.streakDays(today.streak)}
                </span>
                <ThemeToggle />
              </div>
            </header>

            {today.nextLesson ? (
              <section className="hero-card">
                <span className="glyph g1" aria-hidden>&gt;_</span>
                <span className="glyph g2" aria-hidden>{'{ }'}</span>
                <span className="glyph g3" aria-hidden>&lt;/&gt;</span>
                <span className="hero-tag"><Sparkles size={14} aria-hidden /> {arabic ? t.todayLetter : t.todaySituation}</span>
                <h2>{today.nextLesson.title}</h2>
                <p className="hero-meta">
                  <span><Clock size={14} aria-hidden /> {today.nextLesson.estMinutes} {t.minutes}</span>
                  {!arabic && <span><Mic size={14} aria-hidden /> {t.roleplayShort}</span>}
                </p>
                <Link className="btn btn-hero" to={`/lessons/${today.nextLesson.id}`}>
                  {t.startLesson} <ArrowRight size={18} aria-hidden />
                </Link>
              </section>
            ) : (
              <section className="hero-card"><p>{t.courseComplete}</p></section>
            )}

            <Link className="tired" to={today.dueReviews > 0 ? '/review?limit=3' : '/games/match?size=4'}>
              <BatteryLow size={16} aria-hidden /> {t.tiredOption}
            </Link>

            {today.dueReviews > 0 && (
              <Link className="card row gap link-card" to="/review">
                <span className="chip amber"><RefreshCw size={20} aria-hidden /></span>
                <span className="grow">{t.phrasesDue(today.dueReviews)}</span>
                <ArrowRight size={18} className="muted arrow" aria-hidden />
              </Link>
            )}

            <section className="card row gap">
              <ProgressRing done={today.completedLessons} total={today.totalLessons} />
              <div className="grow stack-xs">
                <strong>{t.courseProgress}</strong>
                <span className="muted small">{today.completedLessons} / {today.totalLessons}</span>
                {today.latestCanDo && <span className="muted small">{today.latestCanDo}</span>}
              </div>
            </section>

            {!arabic && (
            <>
            <Link className="card row gap link-card" to="/videos">
              <span className="chip amber"><Clapperboard size={20} aria-hidden /></span>
              <span className="grow">
                <strong>{t.videosCard}</strong>
                <br />
                <span className="muted small">{t.videosCardHint}</span>
              </span>
              <ArrowRight size={18} className="muted arrow" aria-hidden />
            </Link>

            <Link className="card row gap link-card" to="/writing">
              <span className="chip violet"><PenLine size={20} aria-hidden /></span>
              <span className="grow">
                <strong>{t.fixMessage}</strong>
                <br />
                <span className="muted small">{t.fixMessageHint}</span>
              </span>
              <ArrowRight size={18} className="muted arrow" aria-hidden />
            </Link>
            </>
            )}
          </div>
        )}
      </QueryView>
    </Screen>
  )
}

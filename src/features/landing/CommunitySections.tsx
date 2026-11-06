import { useQuery } from '@tanstack/react-query'
import { Check, Copy, CreditCard, Heart, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client'
import type { PublicDonation, PublicSite, PublicStats } from '../../api/types'
import { landing as l } from '../../i18n/landing'

export function formatCard(card: string): string {
  return card.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function usePublicSite() {
  return useQuery({
    queryKey: ['public-site'],
    queryFn: () => api<PublicSite>('/public/site'),
    staleTime: 60_000,
    // The homepage works fine without these sections, so a failure just leaves them out.
    retry: false,
  })
}

function skipAnimation(): boolean {
  return typeof IntersectionObserver === 'undefined'
    || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

function Counter({ value }: { value: number }) {
  const element = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(() => (skipAnimation() ? value : 0))

  useEffect(() => {
    const target = element.current
    if (!target || skipAnimation()) return
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      const started = performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / 1100)
        setShown(Math.round(value * (1 - (1 - progress) ** 3)))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })
    observer.observe(target)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value])

  return <strong ref={element}>{shown.toLocaleString('en-US').replace(/,/g, ' ')}</strong>
}

export function CommunityStats({ stats }: { stats: PublicStats }) {
  const { totals, levels } = stats
  const metrics = [
    { value: totals.learners, label: l.statLearners },
    { value: totals.activeThisWeek, label: l.statActive },
    { value: totals.lessonsCompleted, label: l.statLessons },
    { value: totals.practiceDays, label: l.statPracticeDays },
  ]
  const placed = levels.reduce((sum, level) => sum + level.learners, 0)

  return (
    <div className="cm-stats">
      <div>
        <h2>{l.statsTitle}</h2>
        <p className="lp-lead">{l.statsText}</p>
        <div className="lp-stats-grid cm-metrics">
          {metrics.map((metric) => (
            <div key={metric.label} className="lp-stat">
              <Counter value={metric.value} />
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </div>
      {placed > 0 && (
        <div className="cm-levels">
          <h3>{l.statsLevels}</h3>
          {levels.map((level) => {
            const percent = Math.round((level.learners / placed) * 100)
            return (
              <div key={level.level} className="cm-level">
                <span className="mono">{level.level}</span>
                <div className="cm-level-bar"><div style={{ width: `${percent}%` }} /></div>
                <span className="mono small">{percent}%</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CommentsWall({ site }: { site: PublicSite }) {
  return (
    <div className="stack">
      <h2 className="center">{l.commentsTitle}</h2>
      {site.comments.length > 0 ? (
        <div className="lp-cards">
          {site.comments.map((comment) => (
            <figure key={comment.id} className="lp-card tilt cm-comment">
              <span className="cm-stars" aria-label={`${comment.rating} / 5`}>
                {Array.from({ length: comment.rating }, (_, i) => <Star key={i} size={15} aria-hidden />)}
              </span>
              {/* Plain text only, with no links, so reviews can't be used for spam or to inject markup. */}
              <blockquote>{comment.body}</blockquote>
              <figcaption>
                <span className="cm-avatar" aria-hidden>{comment.displayName.trim().charAt(0).toUpperCase()}</span>
                <span>
                  <strong>{comment.displayName}</strong>
                  <br />
                  <span className="muted small">{[comment.jobRole, comment.level].filter(Boolean).join(' · ')}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="muted center">{l.commentsEmpty}</p>
      )}
      {site.commentsEnabled && (
        <Link to="/feedback" className="btn btn-secondary self-center">{l.commentsCta}</Link>
      )}
    </div>
  )
}

export function DonationSection({ donation }: { donation: PublicDonation }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(donation.card)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="cm-donate">
      <div className="cm-donate-copy">
        <span className="chip pink"><Heart size={20} aria-hidden /></span>
        <h2>{l.donateTitle}</h2>
        <p className="lp-lead">{donation.message || l.donateText}</p>
        <ul className="cm-donate-points">
          {l.donatePoints.map((point) => (
            <li key={point}><Check size={16} className="ok" aria-hidden /> {point}</li>
          ))}
        </ul>
        <p className="muted small">{l.donateNote}</p>
      </div>
      <div className="cm-card-stage">
        <div className="cm-card">
          <div className="row between">
            <span className="cm-card-brand">&gt;_ LearnX</span>
            <CreditCard size={24} aria-hidden />
          </div>
          <span className="cm-chip" aria-hidden />
          <p className="cm-card-number" aria-label={l.donateCardLabel}>{formatCard(donation.card)}</p>
          {donation.holder && <p className="cm-card-holder">{donation.holder}</p>}
        </div>
        <button type="button" className="btn btn-primary cm-copy" onClick={() => void copy()}>
          {copied ? <Check size={17} aria-hidden /> : <Copy size={17} aria-hidden />} {copied ? l.donateCopied : l.donateCopy}
        </button>
      </div>
    </div>
  )
}

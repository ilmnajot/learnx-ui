import { BarChart3, Clapperboard, MessageSquare, ScrollText, Settings, Users, type LucideIcon } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Button, Screen, QueryView, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'
import { a } from '../../i18n/admin'
import './admin.css'
import { CommentsTab } from './CommentsTab'
import { SettingsTab } from './SettingsTab'
import type { AdminStats, AuditEntry } from './types'
import { UsersTab } from './UsersTab'
import { VideosTab } from './VideosTab'

function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (rows.length === 0) return <p className="muted small">{a.noData}</p>
  return (
    <div className="stack-sm">
      {rows.map(({ label, value }) => (
        <div key={label} className="ad-bar-row">
          <span className="mono small">{label}</span>
          <div className="ad-bar"><div style={{ width: `${(value / max) * 100}%` }} /></div>
          <span className="mono small">{value}</span>
        </div>
      ))}
    </div>
  )
}

function OverviewTab() {
  const query = useApiQuery<AdminStats>(['admin', 'stats'], '/admin/stats')
  return (
    <QueryView query={query}>
      {({ totals: x, aiGlobalDailyLimit, levels, signups }) => {
        const metrics: [string, string | number][] = [
          [a.users, x.users],
          [a.verified, x.verified],
          [a.newThisWeek, x.newThisWeek],
          [a.activeToday, x.activeToday],
          [a.activeThisWeek, x.activeThisWeek],
          [a.lessonsCompleted, x.lessonsCompleted],
          [a.videosCompleted, x.videosCompleted],
          [a.squads, x.squads],
          [a.banned, x.banned],
          [a.pendingComments, x.pendingComments],
          [a.aiToday, `${x.aiRequestsToday} / ${aiGlobalDailyLimit}`],
        ]
        const peak = Math.max(1, ...signups.map((s) => s.count))
        return (
          <div className="stack">
            <div className="ad-metrics">
              {metrics.map(([label, value]) => (
                <div key={label} className="stat">
                  <span className="muted small">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <section className="card stack-sm">
              <strong>{a.levels}</strong>
              <BarList rows={levels.map((l) => ({ label: l.level, value: l.count }))} />
            </section>
            <section className="card stack-sm">
              <strong>{a.signups}</strong>
              {signups.length === 0 ? (
                <p className="muted small">{a.noData}</p>
              ) : (
                <div className="ad-chart" role="img" aria-label={a.signups}>
                  {signups.map((s) => (
                    <div key={s.day} title={`${s.day}: ${s.count}`} style={{ height: `${Math.max(6, (s.count / peak) * 100)}%` }} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )
      }}
    </QueryView>
  )
}

function AuditTab() {
  const query = useApiQuery<AuditEntry[]>(['admin', 'audit'], '/admin/audit')
  return (
    <QueryView query={query}>
      {(entries) =>
        entries.length === 0 ? (
          <p className="muted">{a.auditEmpty}</p>
        ) : (
          <ul className="list ad-list">
            {entries.map((entry) => (
              <li key={entry.id} className="ad-row">
                <div className="grow">
                  <strong className="small">{a.actions[entry.action] ?? entry.action}</strong>
                  {entry.target && <p className="muted small ad-break">{entry.target}</p>}
                  <p className="muted small ad-break">{entry.adminEmail}</p>
                </div>
                <time className="muted small mono" dateTime={entry.createdAt}>
                  {new Date(entry.createdAt).toLocaleString('uz-UZ')}
                </time>
              </li>
            ))}
          </ul>
        )
      }
    </QueryView>
  )
}

const TABS: { id: string; label: string; icon: LucideIcon; panel: ComponentType }[] = [
  { id: 'overview', label: a.tabOverview, icon: BarChart3, panel: OverviewTab },
  { id: 'users', label: a.tabUsers, icon: Users, panel: UsersTab },
  { id: 'comments', label: a.tabComments, icon: MessageSquare, panel: CommentsTab },
  { id: 'videos', label: a.tabVideos, icon: Clapperboard, panel: VideosTab },
  { id: 'settings', label: a.tabSettings, icon: Settings, panel: SettingsTab },
  { id: 'audit', label: a.tabAudit, icon: ScrollText, panel: AuditTab },
]

export default function AdminPage() {
  const { logout } = useAuth()
  const [active, setActive] = useState('overview')
  const Panel = (TABS.find((tab) => tab.id === active) ?? TABS[0])?.panel ?? OverviewTab

  return (
    <div className="ad-shell">
      <Screen backTo="/progress" title={a.title}>
        <nav className="ad-tabs" aria-label={a.title}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={active === id ? 'filter active' : 'filter'}
              aria-pressed={active === id}
              onClick={() => setActive(id)}
            >
              <Icon size={15} aria-hidden /> {label}
            </button>
          ))}
        </nav>
        <Panel />
        <Button onClick={() => void logout()}>{t.signOut}</Button>
      </Screen>
    </div>
  )
}

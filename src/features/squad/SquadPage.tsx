import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, CheckCircle2, Copy, Flame } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client'
import type { Squad } from '../../api/types'
import { Button, ErrorNote, QueryView, Screen, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'

const RACK_LIGHTS = Array.from({ length: 12 }, (_, i) => i)

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase()
}

function NoSquad() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const onSuccess = (squad: Squad) => queryClient.setQueryData(['squad'], squad)
  const create = useMutation({
    mutationFn: () => api<Squad>('/squads', { method: 'POST', body: { name } }),
    onSuccess,
  })
  const join = useMutation({
    mutationFn: () => api<Squad>('/squads/join', { method: 'POST', body: { inviteCode: code } }),
    onSuccess,
  })

  function submit(event: FormEvent, action: () => void) {
    event.preventDefault()
    action()
  }

  return (
    <div className="stack">
      <p className="muted">{t.squadIntro}</p>
      <form className="card stack-sm" onSubmit={(e) => submit(e, create.mutate)}>
        <h2>{t.createSquad}</h2>
        <label className="field">
          {t.squadName}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.squadNamePlaceholder} required maxLength={40} />
        </label>
        <ErrorNote error={create.error} />
        <Button type="submit" variant="primary" disabled={create.isPending}>{t.createSquad}</Button>
      </form>
      <form className="card stack-sm" onSubmit={(e) => submit(e, join.mutate)}>
        <h2>{t.joinSquad}</h2>
        <label className="field">
          {t.inviteCode}
          <input className="mono" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={16} autoCapitalize="characters" />
        </label>
        <ErrorNote error={join.error} />
        <Button type="submit" disabled={join.isPending}>{t.joinSquad}</Button>
      </form>
    </div>
  )
}

function SquadBoard({ squad }: { squad: Squad }) {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const leave = useMutation({
    mutationFn: () => api<void>('/squads/me', { method: 'DELETE' }),
    onSuccess: () => queryClient.setQueryData(['squad'], null),
  })
  const { incident } = squad

  async function copyCode() {
    await navigator.clipboard.writeText(squad.inviteCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="stack">
      <header className="row between">
        <h2>{squad.name}</h2>
        <span className="pill"><Flame size={16} aria-hidden /> {t.streakDays(squad.streak)}</span>
      </header>

      <section className={`card incident ${incident.resolved ? 'resolved' : ''}`}>
        <strong>
          {incident.resolved
            ? <CheckCircle2 size={18} aria-hidden />
            : <AlertTriangle size={18} aria-hidden />}{' '}
          {incident.title}
        </strong>
        <p className="small">{incident.resolved ? t.incidentResolved : t.incidentFix}</p>
      </section>

      <section className="stack-sm">
        <div className="row between">
          <strong>{t.systemRestored}</strong>
          <span className="mono">{incident.progressPercent}%</span>
        </div>
        <div className="rack" role="progressbar" aria-valuenow={incident.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={t.systemRestored}>
          {RACK_LIGHTS.map((i) => (
            <span
              key={i}
              className={(i + 1) * 100 <= incident.progressPercent * RACK_LIGHTS.length ? 'light on' : 'light'}
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
        <p className="muted small">
          {t.todayPractised(squad.practisedToday, squad.members.length)}:{' '}
          {squad.streakSafeToday ? t.streakSafe : t.streakNeeds(squad.requiredToday)}
        </p>
      </section>

      <ul className="list">
        {squad.members.map((member) => (
          <li key={member.userId} className="row gap member">
            <span className={`avatar ${member.practisedToday ? '' : 'off'}`} aria-hidden>{initials(member.displayName)}</span>
            <span className="grow">{member.displayName}</span>
            <span className="muted small">
              {member.practisedToday
                ? <><Check size={14} aria-hidden /> {t.points(member.weekPoints)}</>
                : t.notYet}
            </span>
          </li>
        ))}
      </ul>

      <Link className="btn btn-primary" to="/games">{t.play2min}</Link>

      <section className="card stack-sm">
        <span className="muted small">{t.shareCode}</span>
        <div className="row between">
          <strong className="mono invite">{squad.inviteCode}</strong>
          <Button onClick={copyCode}>
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copied ? t.copied : t.copy}
          </Button>
        </div>
      </section>

      <ErrorNote error={leave.error} />
      {confirming ? (
        <div className="card stack-sm">
          <p>{t.leaveConfirm}</p>
          <div className="row gap">
            <Button className="grow" onClick={() => setConfirming(false)}>{t.cancel}</Button>
            <Button className="grow danger" disabled={leave.isPending} onClick={() => leave.mutate()}>{t.confirm}</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setConfirming(true)}>{t.leaveSquad}</Button>
      )}
    </div>
  )
}

export default function SquadPage() {
  // The API answers 204 when the learner has no squad yet, which arrives here as null.
  const query = useApiQuery<Squad | null>(['squad'], '/squads/me')

  return (
    <Screen title={t.squadTitle}>
      <QueryView query={query}>
        {(squad) => (squad ? <SquadBoard squad={squad} /> : <NoSquad />)}
      </QueryView>
    </Screen>
  )
}

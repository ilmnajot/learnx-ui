import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import { Button, ErrorNote, QueryView, useApiQuery } from '../../components/ui'
import { a } from '../../i18n/admin'
import type { SiteSettingsValues } from './types'

function SettingsForm({ initial }: { initial: SiteSettingsValues }) {
  const client = useQueryClient()
  const [values, setValues] = useState(initial)
  const [cardError, setCardError] = useState(false)
  const save = useMutation({
    mutationFn: (body: SiteSettingsValues) => api<SiteSettingsValues>('/admin/settings', { method: 'PUT', body }),
    onSuccess: (saved) => {
      setValues(saved)
      void client.invalidateQueries({ queryKey: ['admin'] })
      void client.invalidateQueries({ queryKey: ['public-site'] })
    },
  })

  function update<K extends keyof SiteSettingsValues>(key: K, value: SiteSettingsValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    save.reset()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const card = values.donationCard.replace(/\s/g, '')
    const invalid = card !== '' && !/^\d{16}$/.test(card)
    setCardError(invalid)
    if (!invalid) save.mutate({ ...values, donationCard: card })
  }

  return (
    <form className="stack" onSubmit={submit}>
      <section className="card stack-sm">
        <h2>{a.settingsDonation}</h2>
        <p className="notice small">{a.donationWarning}</p>
        <label className="ad-check">
          <input type="checkbox" checked={values.donationEnabled} onChange={(e) => update('donationEnabled', e.target.checked)} />
          {a.donationEnabled}
        </label>
        <label className="field">
          {a.donationCard}
          <input className="mono" inputMode="numeric" autoComplete="off" value={values.donationCard} onChange={(e) => update('donationCard', e.target.value)} maxLength={19} />
        </label>
        {cardError && <p className="error" role="alert">{a.cardInvalid}</p>}
        <label className="field">
          {a.donationHolder}
          <input autoComplete="off" value={values.donationHolder} onChange={(e) => update('donationHolder', e.target.value)} maxLength={60} />
        </label>
        <label className="field">
          {a.donationMessage}
          <textarea value={values.donationMessage} onChange={(e) => update('donationMessage', e.target.value)} maxLength={300} rows={3} />
        </label>
      </section>

      <section className="card stack-sm">
        <h2>{a.settingsCommunity}</h2>
        <label className="ad-check">
          <input type="checkbox" checked={values.commentsEnabled} onChange={(e) => update('commentsEnabled', e.target.checked)} />
          {a.commentsEnabled}
        </label>
        <label className="field">
          {a.statsMin}
          <input type="number" min={0} max={1000000} value={values.statsMinLearners} onChange={(e) => update('statsMinLearners', Number(e.target.value))} required />
          <small className="muted">{a.statsMinHint}</small>
        </label>
      </section>

      <ErrorNote error={save.error} />
      <Button type="submit" variant="primary" disabled={save.isPending}>{save.isSuccess ? a.saved : a.save}</Button>
    </form>
  )
}

export function SettingsTab() {
  const query = useApiQuery<SiteSettingsValues>(['admin', 'settings'], '/admin/settings')
  return <QueryView query={query}>{(values) => <SettingsForm initial={values} />}</QueryView>
}

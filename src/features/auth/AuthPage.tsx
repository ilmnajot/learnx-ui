import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Button, ErrorNote } from '../../components/ui'
import { t } from '../../i18n'

export function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signUp')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const signingUp = mode === 'signUp'

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (signingUp) await register(email, password, name)
      else await login(email, password)
    } catch (e) {
      setError(e)
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <section className="auth-intro">
        <p className="brand"><span aria-hidden>&gt;_</span> {t.appName}</p>
        <h1>{t.tagline}</h1>
        <p className="muted">{t.subTagline}</p>
      </section>
      <form className="card stack" onSubmit={submit}>
        <h2>{signingUp ? t.signUp : t.signIn}</h2>
        {signingUp && (
          <label className="field">
            {t.name}
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" />
          </label>
        )}
        <label className="field">
          {t.email}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} autoComplete="email" />
        </label>
        <label className="field">
          {t.password}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={signingUp ? 8 : undefined}
            maxLength={72}
            autoComplete={signingUp ? 'new-password' : 'current-password'}
          />
          {signingUp && <small className="muted">{t.passwordHint}</small>}
        </label>
        <ErrorNote error={error} />
        <Button type="submit" variant="primary" disabled={busy}>
          {signingUp ? t.signUp : t.signIn}
        </Button>
        <p className="muted center">
          {signingUp ? t.haveAccount : t.noAccount}{' '}
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(signingUp ? 'signIn' : 'signUp')
              setError(null)
            }}
          >
            {signingUp ? t.signIn : t.signUp}
          </button>
        </p>
      </form>
    </main>
  )
}

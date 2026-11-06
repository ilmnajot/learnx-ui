import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/AuthContext'
import { ThemeToggle } from '../../components/ThemeToggle'
import { Button, ErrorNote } from '../../components/ui'
import { t } from '../../i18n'

function TerminalDemo() {
  return (
    <div className="terminal" aria-hidden>
      <div className="terminal-bar"><i /><i /><i /><span>standup.sh</span></div>
      <p className="line l1"><b>$</b> say "it is not finish"</p>
      <p className="line l2 warn">! 1 grammar issue found</p>
      <p className="line l3"><b>$</b> learnx fix --speak</p>
      <p className="line l4 good">It's taking longer than expected.</p>
      <p className="line l5 good">build passed: confidence +1<span className="caret" /></p>
    </div>
  )
}

export function AuthPage() {
  const { login, register } = useAuth()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'signIn' | 'signUp'>(params.get('mode') === 'signin' ? 'signIn' : 'signUp')
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
        <div className="row between">
          <Link to="/" className="brand"><span aria-hidden>&gt;_</span> {t.appName}</Link>
          <ThemeToggle />
        </div>
        <h1>{t.tagline}</h1>
        <p className="muted">{t.subTagline}</p>
        <TerminalDemo />
      </section>
      <form className="card stack auth-form" onSubmit={submit}>
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

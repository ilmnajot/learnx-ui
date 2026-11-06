import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client'
import type { User } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Button, ErrorNote } from '../../components/ui'
import { t } from '../../i18n'

/** Reads the token from the URL fragment once and removes it, so it leaves no trace in browser history. */
function useLinkToken(): string {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '')
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname)
  }, [])
  return token
}

function AccountScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="screen">
      <div className="narrow">
        <Link to="/" className="brand"><span aria-hidden>&gt;_</span> {t.appName}</Link>
        <div className="card stack">
          <h1>{title}</h1>
          {children}
        </div>
      </div>
    </main>
  )
}

export function VerifyEmailPage() {
  const token = useLinkToken()
  const { status, setUser } = useAuth()
  const started = useRef(false)
  const verify = useMutation({
    mutationFn: () => api<void>('/auth/verify-email', { method: 'POST', body: { token } }),
    onSuccess: () => {
      if (status === 'signedIn') void api<User>('/me').then(setUser)
    },
  })
  const run = verify.mutate

  useEffect(() => {
    // Links are single use, so React StrictMode's double effect must not send it twice.
    if (started.current || !token || status === 'loading') return
    started.current = true
    run()
  }, [token, status, run])

  return (
    <AccountScreen title={t.verifyTitle}>
      {verify.isSuccess ? (
        <>
          <CheckCircle2 size={48} className="ok pop" aria-hidden />
          <p>{t.verifyDone}</p>
          <Link className="btn btn-primary" to="/">{t.home}</Link>
        </>
      ) : verify.isError || !token ? (
        <>
          <XCircle size={48} className="error pop" aria-hidden />
          <p>{t.linkInvalid}</p>
          <Link className="btn btn-secondary" to="/">{t.home}</Link>
        </>
      ) : (
        <p className="muted">{t.loading}</p>
      )}
    </AccountScreen>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const request = useMutation({
    mutationFn: () => api<void>('/auth/forgot-password', { method: 'POST', body: { email } }),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    request.mutate()
  }

  return (
    <AccountScreen title={t.forgotTitle}>
      {request.isSuccess ? (
        <>
          <MailCheck size={48} className="ok pop" aria-hidden />
          <p>{t.forgotSent}</p>
          <Link className="btn btn-secondary" to="/signin?mode=signin">{t.signIn}</Link>
        </>
      ) : (
        <form className="stack" onSubmit={submit}>
          <p className="muted">{t.forgotHint}</p>
          <label className="field">
            {t.email}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} autoComplete="email" />
          </label>
          <ErrorNote error={request.error} />
          <Button type="submit" variant="primary" disabled={request.isPending}>{t.forgotSend}</Button>
          <Link className="link center" to="/signin?mode=signin">{t.signIn}</Link>
        </form>
      )}
    </AccountScreen>
  )
}

export function ResetPasswordPage() {
  const token = useLinkToken()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const reset = useMutation({
    mutationFn: () => api<void>('/auth/reset-password', { method: 'POST', body: { token, password } }),
  })
  const mismatch = confirm !== '' && password !== confirm

  function submit(event: FormEvent) {
    event.preventDefault()
    if (password === confirm) reset.mutate()
  }

  if (!token) {
    return (
      <AccountScreen title={t.resetTitle}>
        <p>{t.linkInvalid}</p>
        <Link className="btn btn-secondary" to="/forgot-password">{t.forgotSend}</Link>
      </AccountScreen>
    )
  }

  return (
    <AccountScreen title={t.resetTitle}>
      {reset.isSuccess ? (
        <>
          <CheckCircle2 size={48} className="ok pop" aria-hidden />
          <p>{t.resetDone}</p>
          <Link className="btn btn-primary" to="/signin?mode=signin">{t.signIn}</Link>
        </>
      ) : (
        <form className="stack" onSubmit={submit}>
          <label className="field">
            {t.newPassword}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" />
            <small className="muted">{t.passwordHint}</small>
          </label>
          <label className="field">
            {t.confirmPassword}
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required maxLength={72} autoComplete="new-password" />
          </label>
          {mismatch && <p className="error" role="alert">{t.passwordsDiffer}</p>}
          <ErrorNote error={reset.error} />
          <Button type="submit" variant="primary" disabled={reset.isPending || mismatch}>{t.resetSave}</Button>
        </form>
      )}
    </AccountScreen>
  )
}

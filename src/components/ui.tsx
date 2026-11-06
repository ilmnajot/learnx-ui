import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { ArrowLeft, Volume2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { api, ApiError } from '../api/client'
import { t } from '../i18n'

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return t.errors[error.code] ?? t.genericError
  if (error instanceof TypeError) return t.networkError
  return t.genericError
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return <button type="button" className={`btn btn-${variant} ${className}`} {...props} />
}

export function Screen({ title, backTo, children }: { title?: string; backTo?: string; children: ReactNode }) {
  return (
    <main className="screen">
      {(title || backTo) && (
        <header className="screen-header">
          {backTo && (
            <Link to={backTo} className="icon-link" aria-label={t.back}>
              <ArrowLeft size={20} aria-hidden />
            </Link>
          )}
          {title && <h1>{title}</h1>}
        </header>
      )}
      {children}
    </main>
  )
}

export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div className="bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div style={{ width: `${value}%` }} />
    </div>
  )
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <p className="error" role="alert">
      {errorMessage(error)}
    </p>
  )
}

/** Renders loading and failure states, so screens only describe their success state. */
export function QueryView<T>({ query, children }: { query: UseQueryResult<T>; children: (data: T) => ReactNode }) {
  if (query.isPending) return <p className="muted center pad">{t.loading}</p>
  if (query.isError) {
    return (
      <div className="center pad stack">
        <ErrorNote error={query.error} />
        <Button onClick={() => query.refetch()}>{t.retry}</Button>
      </div>
    )
  }
  return <>{children(query.data)}</>
}

export function useApiQuery<T>(key: readonly unknown[], path: string) {
  // Empty responses become null, because React Query does not allow undefined as data.
  return useQuery<T>({ queryKey: key, queryFn: async () => (await api<T>(path)) ?? (null as T) })
}

export function speak(text: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

export function ListenButton({ text }: { text: string }) {
  if (!('speechSynthesis' in window)) return null
  return (
    <button type="button" className="icon-btn" aria-label={t.listen} title={t.listen} onClick={() => speak(text)}>
      <Volume2 size={18} aria-hidden />
    </button>
  )
}

export function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j] as T, copy[i] as T]
  }
  return copy
}

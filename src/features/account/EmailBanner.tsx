import { useMutation } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { ErrorNote } from '../../components/ui'
import { t } from '../../i18n'

/** Reminds unconfirmed learners why AI practice is locked, and lets them ask for another link. */
export function EmailBanner() {
  const { user } = useAuth()
  const resend = useMutation({
    mutationFn: () => api<void>('/me/resend-verification', { method: 'POST' }),
  })

  if (!user || user.emailVerified) return null

  return (
    <div className="email-banner" role="status">
      <Mail size={18} aria-hidden />
      <div className="grow">
        <p>{t.confirmBanner(user.email)}</p>
        <ErrorNote error={resend.error} />
      </div>
      {resend.isSuccess ? (
        <span className="small">{t.confirmSent}</span>
      ) : (
        <button type="button" className="link small" disabled={resend.isPending} onClick={() => resend.mutate()}>
          {t.confirmResend}
        </button>
      )}
    </div>
  )
}

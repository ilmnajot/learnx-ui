import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock, Star, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import type { OwnComment } from '../../api/types'
import { useUser } from '../../auth/AuthContext'
import { Button, ErrorNote, QueryView, Screen, useApiQuery } from '../../components/ui'
import { t } from '../../i18n'

const MIN_LENGTH = 10
const MAX_LENGTH = 500

function StatusNote({ status }: { status: OwnComment['status'] }) {
  if (status === 'APPROVED') return <p className="ok small"><CheckCircle2 size={15} aria-hidden /> {t.feedbackApproved}</p>
  if (status === 'REJECTED') return <p className="error"><XCircle size={15} aria-hidden /> {t.feedbackRejected}</p>
  return <p className="muted small"><Clock size={15} aria-hidden /> {t.feedbackPending}</p>
}

function FeedbackForm({ existing }: { existing: OwnComment | null }) {
  const user = useUser()
  const client = useQueryClient()
  const [body, setBody] = useState(existing?.body ?? '')
  const [rating, setRating] = useState(existing?.rating ?? 5)
  const save = useMutation({
    mutationFn: () => api<OwnComment>('/comments/me', { method: 'PUT', body: { body: body.trim(), rating } }),
    onSuccess: (saved) => client.setQueryData(['comments', 'me'], saved),
  })
  const status = save.data?.status ?? existing?.status
  const tooShort = body.trim().length < MIN_LENGTH

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!tooShort) save.mutate()
  }

  return (
    <form className="stack" onSubmit={submit}>
      <p className="muted">{t.feedbackHint}</p>
      {status && <StatusNote status={status} />}
      <div className="rating" role="radiogroup" aria-label={t.feedbackRating}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} / 5`}
            className={value <= rating ? 'rating-star on' : 'rating-star'}
            onClick={() => setRating(value)}
          >
            <Star size={28} aria-hidden />
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t.feedbackPlaceholder}
        aria-label={t.feedbackTitle}
        rows={5}
        minLength={MIN_LENGTH}
        maxLength={MAX_LENGTH}
        required
      />
      <p className="muted small">{t.feedbackPublicAs(user.displayName)} {body.length} / {MAX_LENGTH}</p>
      <ErrorNote error={save.error} />
      <Button type="submit" variant="primary" disabled={save.isPending || tooShort}>{t.feedbackSend}</Button>
    </form>
  )
}

export default function FeedbackPage() {
  const query = useApiQuery<OwnComment | null>(['comments', 'me'], '/comments/me')
  return (
    <Screen backTo="/progress" title={t.feedbackTitle}>
      <QueryView query={query}>{(existing) => <FeedbackForm existing={existing} />}</QueryView>
    </Screen>
  )
}

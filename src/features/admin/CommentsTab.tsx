import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api/client'
import { Button, ErrorNote, QueryView, useApiQuery } from '../../components/ui'
import { a } from '../../i18n/admin'
import type { AdminComment, CommentStatus } from './types'

const FILTERS: { id: CommentStatus | ''; label: string }[] = [
  { id: 'PENDING', label: a.statusPending },
  { id: 'APPROVED', label: a.statusApproved },
  { id: 'REJECTED', label: a.statusRejected },
  { id: '', label: a.statusAll },
]

export function CommentsTab() {
  const client = useQueryClient()
  const [filter, setFilter] = useState<CommentStatus | ''>('PENDING')
  const query = useApiQuery<AdminComment[]>(['admin', 'comments', filter], `/admin/comments${filter ? `?status=${filter}` : ''}`)
  const refresh = () => client.invalidateQueries({ queryKey: ['admin'] })
  const moderate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api<void>(`/admin/comments/${id}/status`, { method: 'POST', body: { status } }),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (id: string) => api<void>(`/admin/comments/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  })
  const busy = moderate.isPending || remove.isPending

  return (
    <div className="stack">
      <div className="filters" role="group" aria-label={a.tabComments}>
        {FILTERS.map(({ id, label }) => (
          <button key={label} type="button" className={filter === id ? 'filter active' : 'filter'} aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      <ErrorNote error={moderate.error ?? remove.error} />
      <QueryView query={query}>
        {(comments) =>
          comments.length === 0 ? (
            <p className="muted">{a.noComments}</p>
          ) : (
            <ul className="list ad-list">
              {comments.map((comment) => (
                <li key={comment.id} className="ad-row wrap">
                  <div className="grow">
                    <div className="row gap-sm wrap">
                      <strong>{comment.displayName}</strong>
                      <span className="ad-stars" aria-label={`${comment.rating} / 5`}>
                        {Array.from({ length: comment.rating }, (_, i) => <Star key={i} size={13} aria-hidden />)}
                      </span>
                    </div>
                    <p className="muted small ad-break">{comment.email}</p>
                    {/* Rendered as plain text by React, so a review can't inject markup into the admin panel. */}
                    <p className="ad-break">{comment.body}</p>
                  </div>
                  <div className="ad-actions">
                    {comment.status !== 'APPROVED' && (
                      <Button variant="primary" disabled={busy} onClick={() => moderate.mutate({ id: comment.id, status: 'APPROVED' })}>{a.approve}</Button>
                    )}
                    {comment.status !== 'REJECTED' && (
                      <Button disabled={busy} onClick={() => moderate.mutate({ id: comment.id, status: 'REJECTED' })}>{a.reject}</Button>
                    )}
                    <Button className="danger" disabled={busy} onClick={() => { if (window.confirm(a.confirmDeleteComment)) remove.mutate(comment.id) }}>{a.remove}</Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </QueryView>
    </div>
  )
}

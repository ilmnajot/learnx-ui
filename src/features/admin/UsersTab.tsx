import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useUser } from '../../auth/AuthContext'
import { Button, ErrorNote, QueryView } from '../../components/ui'
import { a } from '../../i18n/admin'
import type { AdminUser, UserPage } from './types'

const PAGE_SIZE = 20

type Action = { path: string; method?: 'POST' | 'DELETE'; body?: unknown; confirm?: string }

function UserRow({ user, isSelf, run, busy }: { user: AdminUser; isSelf: boolean; run: (action: Action) => void; busy: boolean }) {
  const base = `/admin/users/${user.id}`
  return (
    <li className="ad-row wrap">
      <div className="grow">
        <div className="row gap-sm wrap">
          <strong>{user.displayName}</strong>
          {user.role === 'ADMIN' && <span className="tag violet">{a.badgeAdmin}</span>}
          {user.bannedAt && <span className="tag danger-tag">{a.badgeBanned}</span>}
          {!user.emailVerifiedAt && <span className="tag amber">{a.badgeUnverified}</span>}
        </div>
        <p className="muted small ad-break">{user.email}</p>
        <p className="muted small">
          {[user.jobRole, user.level, `${user.lessonsCompleted} ${a.lessons}`].filter(Boolean).join(' · ')}
          {' · '}{a.lastActive}: {user.lastActive ?? a.never}
        </p>
      </div>
      {!isSelf && (
        <div className="ad-actions">
          {!user.emailVerifiedAt && (
            <Button disabled={busy} onClick={() => run({ path: `${base}/confirm-email` })}>{a.confirmEmail}</Button>
          )}
          {user.role === 'ADMIN' ? (
            <Button disabled={busy} onClick={() => run({ path: `${base}/role`, body: { admin: false } })}>{a.removeAdmin}</Button>
          ) : (
            <Button disabled={busy || !user.emailVerifiedAt || Boolean(user.bannedAt)}
              onClick={() => run({ path: `${base}/role`, body: { admin: true }, confirm: a.confirmAdmin(user.email) })}>
              {a.makeAdmin}
            </Button>
          )}
          {user.bannedAt ? (
            <Button disabled={busy} onClick={() => run({ path: `${base}/unban` })}>{a.unban}</Button>
          ) : (
            <Button disabled={busy} className="danger" onClick={() => run({ path: `${base}/ban`, confirm: a.confirmBan(user.email) })}>{a.ban}</Button>
          )}
          <Button disabled={busy} className="danger"
            onClick={() => run({ path: base, method: 'DELETE', confirm: a.confirmRemove(user.email) })}>
            {a.remove}
          </Button>
        </div>
      )}
    </li>
  )
}

export function UsersTab() {
  const me = useUser()
  const client = useQueryClient()
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    // Waits for a pause in typing, so each keystroke doesn't send a query.
    const timer = window.setTimeout(() => {
      setSearch(input.trim())
      setPage(0)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [input])

  const query = useQuery({
    queryKey: ['admin', 'users', search, page],
    queryFn: () => api<UserPage>(`/admin/users?q=${encodeURIComponent(search)}&page=${page}&size=${PAGE_SIZE}`),
    placeholderData: keepPreviousData,
  })

  const action = useMutation({
    mutationFn: ({ path, method = 'POST', body }: Action) => api<void>(path, { method, body }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin'] }),
  })

  function run(item: Action) {
    if (!item.confirm || window.confirm(item.confirm)) action.mutate(item)
  }

  return (
    <div className="stack">
      <input
        type="search"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={a.search}
        aria-label={a.search}
        maxLength={100}
      />
      <ErrorNote error={action.error} />
      <QueryView query={query}>
        {(data) => {
          const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
          return (
            <div className="stack-sm">
              <p className="muted small">{a.total(data.total)}</p>
              <ul className="list ad-list">
                {data.users.map((user) => (
                  <UserRow key={user.id} user={user} isSelf={user.id === me.id} run={run} busy={action.isPending} />
                ))}
              </ul>
              {pages > 1 && (
                <div className="row between">
                  <Button disabled={page === 0} onClick={() => setPage(page - 1)}>{a.previous}</Button>
                  <span className="muted small mono">{a.page(page + 1, pages)}</span>
                  <Button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>{a.next}</Button>
                </div>
              )}
            </div>
          )
        }}
      </QueryView>
    </div>
  )
}

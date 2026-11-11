import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAccessToken } from '../../api/client'
import type { PublicSite, User } from '../../api/types'
import { App } from '../../App'
import { AuthProvider } from '../../auth/AuthContext'
import { t } from '../../i18n'
import { a } from '../../i18n/admin'
import { landing as l } from '../../i18n/landing'
import { formatCard } from './CommunitySections'
import { apiError, apiOk } from '../../test/api'

const SITE: PublicSite = {
  stats: {
    totals: { learners: 1234, activeThisWeek: 200, lessonsCompleted: 5000, practiceDays: 9000, squads: 12 },
    levels: [{ level: 'A2', learners: 3 }, { level: 'B1', learners: 1 }],
  },
  comments: [{ id: 'c1', displayName: 'Madina', jobRole: 'QA', level: 'B1', body: 'Standupda gapira boshladim.', rating: 5, updatedAt: '2026-11-01T00:00:00Z' }],
  commentsEnabled: true,
  donation: { card: '1234567812345678', holder: 'T**** H*****', message: '' },
}

const USER: User = {
  id: '1', email: 'a@example.test', displayName: 'Aziz', nativeLanguage: 'uz', timezone: 'Asia/Tashkent',
  onboarded: true, emailVerified: true, admin: false, course: 'ENGLISH',
}

function json(status: number, body: unknown = {}): Response {
  return status < 400 ? apiOk(body, status) : apiError(status, (body as { code?: string }).code)
}

function stub(site: Partial<PublicSite> | null, user: User | null = null, signsInAs: User | null = null) {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input) => {
    const path = String(input)
    if (path.endsWith('/auth/refresh')) return user ? json(200, { accessToken: 't', user }) : json(401)
    if (path.endsWith('/auth/login')) return json(200, { accessToken: 't', user: signsInAs })
    if (path.endsWith('/public/site')) return site ? json(200, { ...SITE, ...site }) : json(500)
    if (path.endsWith('/admin/stats')) {
      return json(200, {
        totals: { users: 42, verified: 40, banned: 1, newThisWeek: 5, activeToday: 3, activeThisWeek: 9, lessonsCompleted: 7, videosCompleted: 2, squads: 1, pendingComments: 4, aiRequestsToday: 10 },
        aiGlobalDailyLimit: 1000, levels: [], signups: [],
      })
    }
    return json(200, { streak: 0, dueReviews: 0, completedLessons: 0, totalLessons: 30 })
  }))
}

function renderAt(path: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('homepage community sections', () => {
  beforeEach(() => setAccessToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it('shows real statistics with level shares', async () => {
    stub({})
    renderAt('/')
    expect(await screen.findByRole('heading', { name: l.statsTitle })).toBeInTheDocument()
    expect(screen.getByText('1 234')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('leaves statistics out when the server withholds them', async () => {
    stub({ stats: undefined })
    renderAt('/')
    await screen.findByRole('heading', { name: l.commentsTitle })
    expect(screen.queryByRole('heading', { name: l.statsTitle })).toBeNull()
  })

  it('shows approved reviews and a way to add one', async () => {
    stub({})
    renderAt('/')
    expect(await screen.findByText('Standupda gapira boshladim.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: l.commentsCta })).toHaveAttribute('href', '/feedback')
  })

  it('shows donation details readably and copies digits only', async () => {
    stub({})
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    renderAt('/')
    expect(await screen.findByText('1234 5678 1234 5678')).toBeInTheDocument()
    expect(screen.getByText('T**** H*****')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: l.donateCopy }))
    expect(writeText).toHaveBeenCalledWith('1234567812345678')
    expect(await screen.findByRole('button', { name: l.donateCopied })).toBeInTheDocument()
  })

  it('leaves donation out when it is not enabled', async () => {
    stub({ donation: undefined })
    renderAt('/')
    await screen.findByRole('heading', { name: l.commentsTitle })
    expect(screen.queryByRole('heading', { name: l.donateTitle })).toBeNull()
  })

  it('still shows the homepage when the community data fails to load', async () => {
    stub(null)
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: l.heroTitle })).toBeInTheDocument()
  })

  it('formats card numbers in groups of four', () => {
    expect(formatCard('1234567812345678')).toBe('1234 5678 1234 5678')
  })
})

describe('admin access', () => {
  beforeEach(() => setAccessToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it('sends ordinary learners away from the admin panel', async () => {
    stub({}, USER)
    renderAt('/admin')
    expect(await screen.findByRole('heading', { level: 1, name: 'Salom, Aziz' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: a.title })).toBeNull()
  })

  it('opens for admins', async () => {
    stub({}, { ...USER, admin: true })
    renderAt('/admin')
    expect(await screen.findByRole('heading', { name: a.title })).toBeInTheDocument()
    expect(await screen.findByText('42')).toBeInTheDocument()
  })

  it('sends visitors to sign-in', async () => {
    stub({})
    renderAt('/admin')
    expect(await screen.findByRole('heading', { level: 2, name: 'Roʻyxatdan oʻtish' })).toBeInTheDocument()
  })

  it('lets admins use the panel before finishing onboarding', async () => {
    stub({}, { ...USER, admin: true, onboarded: false })
    renderAt('/admin')
    expect(await screen.findByRole('heading', { name: a.title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t.signOut })).toBeInTheDocument()
  })

  async function signIn() {
    const user = userEvent.setup()
    renderAt('/signin?mode=signin')
    await user.type(await screen.findByLabelText(t.email), 'a@example.test')
    await user.type(screen.getByLabelText(t.password), 'test-password')
    await user.click(screen.getByRole('button', { name: t.signIn }))
  }

  it('takes admins straight to the panel after signing in', async () => {
    stub({}, null, { ...USER, admin: true, onboarded: false })
    await signIn()
    expect(await screen.findByRole('heading', { name: a.title })).toBeInTheDocument()
  })

  it('takes ordinary learners to the home screen after signing in', async () => {
    stub({}, null, USER)
    await signIn()
    expect(await screen.findByRole('heading', { level: 1, name: 'Salom, Aziz' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: a.title })).toBeNull()
  })
})

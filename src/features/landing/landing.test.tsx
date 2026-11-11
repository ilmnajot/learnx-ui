import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAccessToken } from '../../api/client'
import { App } from '../../App'
import { AuthProvider } from '../../auth/AuthContext'
import { landing as l } from '../../i18n/landing'
import { t } from '../../i18n'
import { apiError, apiOk } from '../../test/api'

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

describe('public pages', () => {
  beforeEach(() => {
    setAccessToken(null)
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => apiError(401)))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('shows visitors the homepage at the root', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: l.heroTitle })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: l.heroCta })).toHaveAttribute('href', '/signin')
  })

  it('still sends visitors from private pages to sign-in', async () => {
    renderAt('/progress')
    expect(await screen.findByRole('heading', { level: 2, name: t.signUp })).toBeInTheDocument()
  })

  it('opens sign-in directly from the login link', async () => {
    renderAt('/signin?mode=signin')
    expect(await screen.findByRole('heading', { level: 2, name: t.signIn })).toBeInTheDocument()
  })

  it('shows the privacy policy without an account', async () => {
    renderAt('/privacy')
    expect(await screen.findByRole('heading', { level: 1, name: l.privacyTitle })).toBeInTheDocument()
  })

  it('switches between correction examples', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const second = l.demos[1]
    if (!second) throw new Error('missing demo')
    await user.click(await screen.findByRole('button', { name: second.label }))
    expect(screen.getByText(second.better)).toBeInTheDocument()
  })

  it('shows signed-in learners the app rather than the homepage', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input) => {
      const path = String(input)
      if (path.endsWith('/auth/refresh')) {
        return apiOk({
          accessToken: 'token',
          user: { id: '1', email: 'a@example.test', displayName: 'Aziz', nativeLanguage: 'uz', timezone: 'Asia/Tashkent', onboarded: true },
        })
      }
      return apiOk({ streak: 0, dueReviews: 0, completedLessons: 0, totalLessons: 30 })
    }))
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: t.greeting('Aziz') })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(l.heroTitle)).toBeNull())
  })
})

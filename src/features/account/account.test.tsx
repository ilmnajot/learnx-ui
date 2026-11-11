import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAccessToken } from '../../api/client'
import type { User } from '../../api/types'
import { App } from '../../App'
import { AuthProvider } from '../../auth/AuthContext'
import { t } from '../../i18n'
import { apiError, apiOk } from '../../test/api'

const USER: User = {
  id: '1',
  email: 'aziz@example.test',
  displayName: 'Aziz',
  nativeLanguage: 'uz',
  timezone: 'Asia/Tashkent',
  onboarded: true,
  emailVerified: false,
  admin: false,
  course: 'ENGLISH',
}

type Handler = (path: string, init?: RequestInit) => Response

function stubApi(handler: Handler) {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => handler(String(input), init))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function json(status: number, body: unknown = {}): Response {
  return status < 400 ? apiOk(body, status) : apiError(status, (body as { code?: string }).code)
}

function renderAt(path: string, hash = '') {
  window.history.replaceState(null, '', path + hash)
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

const callsTo = (fetchMock: ReturnType<typeof stubApi>, suffix: string) =>
  fetchMock.mock.calls.filter(([input]) => String(input).endsWith(suffix))

describe('account pages', () => {
  beforeEach(() => setAccessToken(null))
  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.replaceState(null, '', '/')
  })

  it('confirms an email exactly once and removes the token from the address bar', async () => {
    const fetchMock = stubApi((path) => {
      if (path.endsWith('/auth/verify-email')) return apiOk()
      return json(401)
    })
    renderAt('/verify-email', '#token=abc123')
    expect(await screen.findByText(t.verifyDone)).toBeInTheDocument()
    const calls = callsTo(fetchMock, '/auth/verify-email')
    expect(calls).toHaveLength(1)
    expect(JSON.parse(calls[0]?.[1]?.body as string)).toEqual({ token: 'abc123' })
    expect(window.location.hash).toBe('')
  })

  it('explains a used or expired link', async () => {
    stubApi((path) => (path.endsWith('/auth/verify-email') ? json(400, { code: 'invalid_link' }) : json(401)))
    renderAt('/verify-email', '#token=old')
    expect(await screen.findByText(t.linkInvalid)).toBeInTheDocument()
  })

  it('shows the same message after a reset request, whatever the email', async () => {
    const user = userEvent.setup()
    const fetchMock = stubApi((path) =>
      path.endsWith('/auth/forgot-password') ? apiOk(undefined, 202) : json(401))
    renderAt('/forgot-password')
    await user.type(await screen.findByLabelText(t.email), 'someone@example.test')
    await user.click(screen.getByRole('button', { name: t.forgotSend }))
    expect(await screen.findByText(t.forgotSent)).toBeInTheDocument()
    expect(callsTo(fetchMock, '/auth/forgot-password')).toHaveLength(1)
  })

  it('will not submit a new password until both entries match', async () => {
    const user = userEvent.setup()
    const fetchMock = stubApi((path) =>
      path.endsWith('/auth/reset-password') ? apiOk() : json(401))
    renderAt('/reset-password', '#token=abc123')
    await user.type(await screen.findByLabelText(new RegExp(`^${t.newPassword}`)), 'brand-new-password')
    await user.type(screen.getByLabelText(t.confirmPassword), 'different')
    expect(screen.getByRole('alert')).toHaveTextContent(t.passwordsDiffer)
    expect(screen.getByRole('button', { name: t.resetSave })).toBeDisabled()

    await user.clear(screen.getByLabelText(t.confirmPassword))
    await user.type(screen.getByLabelText(t.confirmPassword), 'brand-new-password')
    await user.click(screen.getByRole('button', { name: t.resetSave }))
    expect(await screen.findByText(t.resetDone)).toBeInTheDocument()
    expect(JSON.parse(callsTo(fetchMock, '/auth/reset-password')[0]?.[1]?.body as string))
      .toEqual({ token: 'abc123', password: 'brand-new-password' })
  })

  it('links to password reset from sign-in', async () => {
    stubApi(() => json(401))
    renderAt('/signin?mode=signin')
    expect(await screen.findByRole('link', { name: t.forgotLink })).toHaveAttribute('href', '/forgot-password')
  })

  describe('confirmation banner', () => {
    const signedIn = (user: User) => stubApi((path) => {
      if (path.endsWith('/auth/refresh')) return json(200, { accessToken: 'token', user })
      if (path.endsWith('/me/resend-verification')) return apiOk(undefined, 202)
      return json(200, { streak: 0, dueReviews: 0, completedLessons: 0, totalLessons: 30 })
    })

    it('offers another link to unconfirmed learners', async () => {
      const user = userEvent.setup()
      const fetchMock = signedIn(USER)
      renderAt('/')
      await user.click(await screen.findByRole('button', { name: t.confirmResend }))
      expect(await screen.findByText(t.confirmSent)).toBeInTheDocument()
      expect(callsTo(fetchMock, '/me/resend-verification')).toHaveLength(1)
    })

    it('stays away once the email is confirmed', async () => {
      signedIn({ ...USER, emailVerified: true })
      renderAt('/')
      await screen.findByRole('heading', { level: 1, name: t.greeting('Aziz') })
      await waitFor(() => expect(screen.queryByRole('button', { name: t.confirmResend })).toBeNull())
    })
  })
})

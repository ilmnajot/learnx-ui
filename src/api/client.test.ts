import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, refreshSession, setAccessToken, setSessionLostHandler } from './client'

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  setAccessToken('old-token')
  setSessionLostHandler(null)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const authHeader = (call: number) =>
  (fetchMock.mock.calls[call]?.[1]?.headers as Record<string, string> | undefined)?.Authorization

describe('api', () => {
  it('sends the access token and parses JSON', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }))
    await expect(api('/today')).resolves.toEqual({ ok: true })
    expect(authHeader(0)).toBe('Bearer old-token')
  })

  it('returns undefined for empty responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(api('/squads/me')).resolves.toBeUndefined()
  })

  it('turns problem details into ApiError', async () => {
    fetchMock.mockResolvedValueOnce(json(409, { code: 'email_taken', detail: 'Taken' }))
    const error = await api('/auth/register', { method: 'POST', body: {} }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('email_taken')
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(200, { accessToken: 'new-token' }))
      .mockResolvedValueOnce(json(200, { ok: true }))
    await expect(api('/today')).resolves.toEqual({ ok: true })
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/v1/auth/refresh')
    expect(authHeader(2)).toBe('Bearer new-token')
  })

  it('reports a lost session when refresh fails', async () => {
    const lost = vi.fn()
    setSessionLostHandler(lost)
    fetchMock.mockResolvedValueOnce(json(401, {})).mockResolvedValueOnce(json(401, {}))
    await expect(api('/today')).rejects.toBeInstanceOf(ApiError)
    expect(lost).toHaveBeenCalledOnce()
  })

  it('does not try to refresh after a failed login', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { code: 'invalid_credentials' }))
    await expect(api('/auth/login', { method: 'POST', body: {} })).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('shares one refresh between concurrent callers, because reuse would revoke the session', async () => {
    fetchMock.mockImplementation(async () => json(200, { accessToken: 'new-token' }))
    await Promise.all([refreshSession(), refreshSession(), refreshSession()])
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

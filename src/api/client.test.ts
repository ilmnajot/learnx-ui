import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, refreshSession, setAccessToken, setSessionLostHandler } from './client'

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status })
}

/** A successful response, wrapped the way the API wraps every payload. */
function ok(data: unknown): Response {
  return json(200, { status: 'OK', message: 'success', data })
}

/** A failed response, with its code in meta. */
function failure(status: number, code: string): Response {
  return json(status, { status: 'ERROR', message: 'Failed', meta: { code } })
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
    fetchMock.mockResolvedValueOnce(ok({ ok: true }))
    await expect(api('/today')).resolves.toEqual({ ok: true })
    expect(authHeader(0)).toBe('Bearer old-token')
  })

  it('returns undefined for empty responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(api('/squads/me')).resolves.toBeUndefined()
  })

  it('returns undefined when the response carries no data', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { status: 'OK', message: 'success' }))
    await expect(api('/squads/me')).resolves.toBeUndefined()
  })

  it('reads field errors from meta', async () => {
    fetchMock.mockResolvedValueOnce(
      json(400, { message: 'Request validation failed', meta: { code: 'validation_failed', fields: { email: 'invalid' } } }),
    )
    const error = (await api('/auth/register', { method: 'POST', body: {} }).catch((e: unknown) => e)) as ApiError
    expect(error.code).toBe('validation_failed')
    expect(error.fields).toEqual({ email: 'invalid' })
  })

  it('turns problem details into ApiError', async () => {
    fetchMock.mockResolvedValueOnce(failure(409, 'email_taken'))
    const error = await api('/auth/register', { method: 'POST', body: {} }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('email_taken')
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(ok({ accessToken: 'new-token' }))
      .mockResolvedValueOnce(ok({ ok: true }))
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
    fetchMock.mockResolvedValueOnce(failure(401, 'invalid_credentials'))
    await expect(api('/auth/login', { method: 'POST', body: {} })).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('shares one refresh between concurrent callers, because reuse would revoke the session', async () => {
    fetchMock.mockImplementation(async () => ok({ accessToken: 'new-token' }))
    await Promise.all([refreshSession(), refreshSession(), refreshSession()])
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

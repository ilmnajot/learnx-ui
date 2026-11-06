/**
 * HTTP client. The access token lives in memory only; the refresh token is an HttpOnly cookie that
 * scripts can't read. Expired access tokens are renewed transparently, once per request.
 */

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: Record<string, string>

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

const BASE = '/api/v1'

let accessToken: string | null = null
let onSessionLost: (() => void) | null = null
let refreshInFlight: Promise<unknown> | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function setSessionLostHandler(handler: (() => void) | null): void {
  onSessionLost = handler
}

async function send<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(BASE + path, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'same-origin',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (response.ok) {
    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as T
  }
  throw await toError(response)
}

async function toError(response: Response): Promise<ApiError> {
  try {
    const problem = (await response.json()) as { code?: string; detail?: string; fields?: Record<string, string> }
    return new ApiError(response.status, problem.code ?? 'error', problem.detail ?? 'Request failed', problem.fields)
  } catch {
    return new ApiError(response.status, 'error', 'Request failed')
  }
}

/**
 * Runs one refresh at a time, across tabs too. Refresh tokens rotate and reuse revokes every session,
 * so two simultaneous refreshes would sign the learner out. Inside the lock, the browser sends
 * whichever cookie the previous holder received.
 */
export function refreshSession<T extends { accessToken: string }>(): Promise<T> {
  if (!refreshInFlight) {
    const run = async () => {
      const session = await send<T>('/auth/refresh', { method: 'POST' })
      accessToken = session.accessToken
      return session
    }
    const locked = typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('learnx-refresh', run)
      : run()
    refreshInFlight = locked.finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight as Promise<T>
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await send<T>(path, options)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || path.startsWith('/auth/')) throw error
    try {
      await refreshSession()
    } catch {
      accessToken = null
      onSessionLost?.()
      throw error
    }
    return send<T>(path, options)
  }
}

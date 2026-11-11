/** Fake API responses, wrapped the way the server wraps every response. */

export function apiOk(data?: unknown, status = 200): Response {
  return new Response(JSON.stringify({ status: 'OK', message: 'success', data }), { status })
}

export function apiError(status: number, code = 'error'): Response {
  return new Response(JSON.stringify({ status: 'ERROR', message: 'Request failed', meta: { code } }), { status })
}

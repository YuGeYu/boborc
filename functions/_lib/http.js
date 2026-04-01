export function json(data, init = {}) {
  const headers = new Headers(init.headers || {})
  headers.set('content-type', 'application/json; charset=utf-8')

  return new Response(JSON.stringify(data), {
    ...init,
    headers
  })
}

export async function readJsonBody(request) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return {}
  }

  try {
    return await request.json()
  } catch (error) {
    return {}
  }
}

export function createErrorResponse(status, code, message, extra = {}) {
  return json({
    ok: false,
    error: {
      code,
      message
    },
    ...extra
  }, { status })
}

export function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return ''
  }

  return token.trim()
}

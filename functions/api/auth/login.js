import { createSession, findUserByUsername, normalizeUser, verifyPassword } from '../../_lib/db'
import { createErrorResponse, json, readJsonBody } from '../../_lib/http'

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase()
}

export async function onRequestPost(context) {
  const body = await readJsonBody(context.request)
  const username = normalizeUsername(body.username)
  const password = String(body.password || '')

  if (!username || !password) {
    return createErrorResponse(400, 'MISSING_CREDENTIALS', 'Username and password are required.')
  }

  const user = await findUserByUsername(context.env.DB, username)
  if (!user) {
    return createErrorResponse(401, 'INVALID_CREDENTIALS', 'Invalid username or password.')
  }

  const matches = await verifyPassword(password, user.password_salt, user.password_hash)
  if (!matches) {
    return createErrorResponse(401, 'INVALID_CREDENTIALS', 'Invalid username or password.')
  }

  const session = await createSession(context.env.DB, user.id)

  return json({
    ok: true,
    user: normalizeUser(user),
    token: session.token,
    expiresAt: session.expiresAt
  })
}

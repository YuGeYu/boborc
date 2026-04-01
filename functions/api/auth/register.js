import { createSession, createUser, findUserByUsername, normalizeUser } from '../../_lib/db'
import { createErrorResponse, json, readJsonBody } from '../../_lib/http'

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase()
}

export async function onRequestPost(context) {
  const body = await readJsonBody(context.request)
  const username = normalizeUsername(body.username)
  const password = String(body.password || '')
  const displayName = String(body.displayName || '').trim()

  if (!username || username.length < 3 || username.length > 24) {
    return createErrorResponse(400, 'INVALID_USERNAME', 'Username must be 3 to 24 characters.')
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return createErrorResponse(400, 'INVALID_USERNAME', 'Username can only contain lowercase letters, numbers, and underscores.')
  }

  if (password.length < 6) {
    return createErrorResponse(400, 'INVALID_PASSWORD', 'Password must be at least 6 characters.')
  }

  const existing = await findUserByUsername(context.env.DB, username)
  if (existing) {
    return createErrorResponse(409, 'USERNAME_TAKEN', 'This username is already in use.')
  }

  const user = await createUser(context.env.DB, {
    username,
    displayName: displayName || username,
    password
  })
  const session = await createSession(context.env.DB, user.id)

  return json({
    ok: true,
    user: normalizeUser(user),
    token: session.token,
    expiresAt: session.expiresAt
  })
}

import { getSessionUser } from '../../_lib/db'
import { createErrorResponse, json, getBearerToken } from '../../_lib/http'

export async function onRequestGet(context) {
  const token = getBearerToken(context.request)
  const user = await getSessionUser(context.env.DB, token)

  if (!user) {
    return createErrorResponse(401, 'UNAUTHORIZED', 'You need to log in first.')
  }

  return json({
    ok: true,
    user
  })
}

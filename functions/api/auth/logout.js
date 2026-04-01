import { deleteSession } from '../../_lib/db'
import { json, getBearerToken } from '../../_lib/http'

export async function onRequestPost(context) {
  const token = getBearerToken(context.request)
  await deleteSession(context.env.DB, token)

  return json({
    ok: true
  })
}

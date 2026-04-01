import { getCloudSave, getSessionUser, upsertCloudSave } from '../_lib/db'
import { createErrorResponse, json, getBearerToken, readJsonBody } from '../_lib/http'

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function validatePayload(payload) {
  return isObject(payload) && Array.isArray(payload.accounts) && typeof payload.currentAccountId === 'string'
}

export async function onRequestGet(context) {
  const token = getBearerToken(context.request)
  const user = await getSessionUser(context.env.DB, token)

  if (!user) {
    return createErrorResponse(401, 'UNAUTHORIZED', 'You need to log in first.')
  }

  const save = await getCloudSave(context.env.DB, user.id)
  return json({
    ok: true,
    save
  })
}

export async function onRequestPut(context) {
  const token = getBearerToken(context.request)
  const user = await getSessionUser(context.env.DB, token)

  if (!user) {
    return createErrorResponse(401, 'UNAUTHORIZED', 'You need to log in first.')
  }

  const body = await readJsonBody(context.request)
  const payload = body.payload
  const baseVersion = Number(body.baseVersion || 0)
  const force = Boolean(body.force)

  if (!validatePayload(payload)) {
    return createErrorResponse(400, 'INVALID_PAYLOAD', 'Cloud save payload is invalid.')
  }

  const result = await upsertCloudSave(context.env.DB, user.id, payload, {
    baseVersion,
    force
  })

  if (result.conflict) {
    return createErrorResponse(409, 'SAVE_CONFLICT', 'Cloud save version conflict detected.', {
      save: result.current
    })
  }

  return json({
    ok: true,
    save: {
      userId: user.id,
      payload,
      version: result.version,
      updatedAt: result.updatedAt,
      createdAt: result.createdAt
    }
  })
}

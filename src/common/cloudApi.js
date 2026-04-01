import { API_URL } from '@/common/config'

const SESSION_TOKEN_KEY = 'fightback:cloud-session-v1'
const ERROR_MESSAGE_MAP = {
  INVALID_USERNAME: '用户名需要 3 到 24 位，并且只能包含小写字母、数字或下划线。',
  INVALID_PASSWORD: '密码至少需要 6 位。',
  USERNAME_TAKEN: '这个用户名已经被注册了，请换一个。',
  INVALID_CREDENTIALS: '用户名或密码错误。',
  MISSING_CREDENTIALS: '请输入用户名和密码。',
  UNAUTHORIZED: '你还没有登录云账号。',
  SAVE_CONFLICT: '检测到云存档冲突，请先下载云端存档，或使用强制上传覆盖云端。',
  INVALID_PAYLOAD: '上传的存档数据格式不正确。'
}

function getApiBaseUrl() {
  return String(API_URL || '/api').replace(/\/+$/, '')
}

function createCloudError(message, options = {}) {
  const error = new Error(message)
  error.code = options.code || 'CLOUD_ERROR'
  error.status = options.status || 500
  error.payload = options.payload || null
  return error
}

async function requestJson(path, options = {}) {
  const headers = {
    'content-type': 'application/json',
    ...(options.headers || {})
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  let payload = null
  try {
    payload = await response.json()
  } catch (error) {
    payload = null
  }

  if (!response.ok) {
    const code = payload?.error?.code || 'HTTP_ERROR'
    const fallbackMessage = response.status >= 500
      ? '云端服务暂时异常，请稍后再试。'
      : `请求失败，状态码 ${response.status}`
    const message = ERROR_MESSAGE_MAP[code] || payload?.error?.message || fallbackMessage
    throw createCloudError(message, {
      code,
      status: response.status,
      payload
    })
  }

  return payload
}

export function getStoredSessionToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY) || ''
}

export function setStoredSessionToken(token) {
  if (!token) {
    localStorage.removeItem(SESSION_TOKEN_KEY)
    return
  }

  localStorage.setItem(SESSION_TOKEN_KEY, token)
}

export function clearStoredSessionToken() {
  localStorage.removeItem(SESSION_TOKEN_KEY)
}

function withAuthHeaders(token) {
  return token
    ? {
        authorization: `Bearer ${token}`
      }
    : {}
}

export function registerCloudAccount(payload) {
  return requestJson('/auth/register', {
    method: 'POST',
    body: payload
  })
}

export function loginCloudAccount(payload) {
  return requestJson('/auth/login', {
    method: 'POST',
    body: payload
  })
}

export function logoutCloudAccount(token) {
  return requestJson('/auth/logout', {
    method: 'POST',
    headers: withAuthHeaders(token)
  })
}

export function fetchCurrentCloudUser(token) {
  return requestJson('/auth/me', {
    headers: withAuthHeaders(token)
  })
}

export function fetchCloudSave(token) {
  return requestJson('/cloud-save', {
    headers: withAuthHeaders(token)
  })
}

export function pushCloudSave(token, payload, options = {}) {
  return requestJson('/cloud-save', {
    method: 'PUT',
    headers: withAuthHeaders(token),
    body: {
      payload,
      baseVersion: options.baseVersion || 0,
      force: Boolean(options.force)
    }
  })
}

export function fetchLeaderboard() {
  return requestJson('/leaderboard')
}

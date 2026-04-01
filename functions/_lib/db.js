const SESSION_TTL_DAYS = 30

function toBase64Url(uint8Array) {
  let binary = ''
  for (let index = 0; index < uint8Array.length; index += 1) {
    binary += String.fromCharCode(uint8Array[index])
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function isoNow() {
  return new Date().toISOString()
}

function addDays(date, days) {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

async function sha256(value) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toBase64Url(new Uint8Array(digest))
}

async function derivePasswordHash(password, salt) {
  return sha256(`${salt}:${password}`)
}

function createRandomToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  return toBase64Url(bytes)
}

async function hashPassword(password) {
  const salt = createRandomToken(16)
  const hash = await derivePasswordHash(password, salt)
  return {
    salt,
    hash
  }
}

async function verifyPassword(password, passwordSalt, passwordHash) {
  const derived = await derivePasswordHash(password, passwordSalt)
  return derived === passwordHash
}

export function normalizeUser(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    createdAt: row.created_at
  }
}

export async function findUserByUsername(db, username) {
  const result = await db
    .prepare('SELECT * FROM users WHERE username = ?1 LIMIT 1')
    .bind(username)
    .first()

  return result || null
}

export async function createUser(db, { username, displayName, password }) {
  const timestamp = isoNow()
  const { salt, hash } = await hashPassword(password)
  await db
    .prepare(`
      INSERT INTO users (username, display_name, password_hash, password_salt, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `)
    .bind(username, displayName || username, hash, salt, timestamp)
    .run()

  const created = await findUserByUsername(db, username)
  return created || {
    id: null,
    username,
    display_name: displayName || username,
    created_at: timestamp
  }
}

export async function createSession(db, userId) {
  const now = new Date()
  const createdAt = now.toISOString()
  const expiresAt = addDays(now, SESSION_TTL_DAYS).toISOString()
  const token = createRandomToken(32)
  const tokenHash = await sha256(token)

  await db
    .prepare(`
      INSERT INTO sessions (user_id, token_hash, created_at, last_seen_at, expires_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `)
    .bind(userId, tokenHash, createdAt, createdAt, expiresAt)
    .run()

  return {
    token,
    expiresAt
  }
}

export async function getSessionUser(db, token) {
  if (!token) {
    return null
  }

  const tokenHash = await sha256(token)
  const row = await db
    .prepare(`
      SELECT
        sessions.id AS session_id,
        sessions.expires_at,
        users.id,
        users.username,
        users.display_name,
        users.created_at
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?1
      LIMIT 1
    `)
    .bind(tokenHash)
    .first()

  if (!row) {
    return null
  }

  if (Date.parse(row.expires_at) <= Date.now()) {
    await db.prepare('DELETE FROM sessions WHERE id = ?1').bind(row.session_id).run()
    return null
  }

  await db
    .prepare('UPDATE sessions SET last_seen_at = ?2 WHERE id = ?1')
    .bind(row.session_id, isoNow())
    .run()

  return normalizeUser(row)
}

export async function deleteSession(db, token) {
  if (!token) {
    return
  }

  const tokenHash = await sha256(token)
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(tokenHash).run()
}

export async function getCloudSave(db, userId) {
  const row = await db
    .prepare('SELECT user_id, payload, version, updated_at, created_at FROM cloud_saves WHERE user_id = ?1 LIMIT 1')
    .bind(userId)
    .first()

  if (!row) {
    return null
  }

  return {
    userId: row.user_id,
    payload: JSON.parse(row.payload),
    version: row.version,
    updatedAt: row.updated_at,
    createdAt: row.created_at
  }
}

export async function upsertCloudSave(db, userId, payload, options = {}) {
  const now = isoNow()
  const existing = await db
    .prepare('SELECT version, created_at FROM cloud_saves WHERE user_id = ?1 LIMIT 1')
    .bind(userId)
    .first()

  if (!existing) {
    await db
      .prepare(`
        INSERT INTO cloud_saves (user_id, payload, version, created_at, updated_at)
        VALUES (?1, ?2, 1, ?3, ?3)
      `)
      .bind(userId, JSON.stringify(payload), now)
      .run()

    return {
      version: 1,
      updatedAt: now,
      createdAt: now
    }
  }

  const nextVersion = Number(existing.version) + 1

  if (!options.force) {
    const baseVersion = Number(options.baseVersion || 0)
    if (baseVersion !== Number(existing.version)) {
      const current = await getCloudSave(db, userId)
      return {
        conflict: true,
        current
      }
    }
  }

  await db
    .prepare(`
      UPDATE cloud_saves
      SET payload = ?2, version = ?3, updated_at = ?4
      WHERE user_id = ?1
    `)
    .bind(userId, JSON.stringify(payload), nextVersion, now)
    .run()

  return {
    version: nextVersion,
    updatedAt: now,
    createdAt: existing.created_at
  }
}

function deriveHighestClearedLevel(payload) {
  const accounts = Array.isArray(payload?.accounts) ? payload.accounts : []
  let highestLevel = 0
  let highestUpdatedAt = ''

  accounts.forEach((account) => {
    const progression = account?.progression || {}
    const clearedLevelIds = Array.isArray(progression.clearedLevelIds) ? progression.clearedLevelIds : []
    const accountHighest = clearedLevelIds.length
      ? Math.max(...clearedLevelIds.map((id) => Number(id) || 0))
      : 0
    if (accountHighest > highestLevel) {
      highestLevel = accountHighest
      highestUpdatedAt = account?.updatedAt || account?.createdAt || ''
    }
  })

  return {
    highestLevel,
    highestUpdatedAt
  }
}

export async function getLeaderboardEntries(db, limit = 50) {
  const result = await db
    .prepare(`
      SELECT
        users.id,
        users.username,
        users.display_name,
        users.created_at,
        cloud_saves.payload,
        cloud_saves.updated_at
      FROM users
      INNER JOIN cloud_saves ON cloud_saves.user_id = users.id
    `)
    .all()

  const rows = Array.isArray(result?.results) ? result.results : []
  const entries = rows.map((row) => {
    let payload = null
    try {
      payload = JSON.parse(row.payload)
    } catch (error) {
      payload = null
    }

    const { highestLevel, highestUpdatedAt } = deriveHighestClearedLevel(payload)
    return {
      userId: row.id,
      username: row.username,
      displayName: row.display_name || row.username,
      highestLevel,
      updatedAt: highestUpdatedAt || row.updated_at || row.created_at
    }
  })
    .filter((entry) => entry.highestLevel > 0)
    .sort((a, b) => {
      if (b.highestLevel !== a.highestLevel) {
        return b.highestLevel - a.highestLevel
      }
      return Date.parse(a.updatedAt || 0) - Date.parse(b.updatedAt || 0)
    })
    .slice(0, limit)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry
    }))

  return entries
}

export { verifyPassword }

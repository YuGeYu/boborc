const ALPHABET = 'Q7W5ER8TY2UP4AS6DF9GH3JKLZXCVBNM'
const CODE_LENGTH = 16
const VERSION_LEGACY = 2n
const VERSION_CURRENT = 3n
const PAYLOAD_MASK = (1n << 60n) - 1n
const TAG_MASK = (1n << 20n) - 1n
const HALF_MASK = (1n << 40n) - 1n
const MASK_64 = (1n << 64n) - 1n
const SECRET_A = 0x9e3779b97f4a7c15n
const SECRET_B = 0xbf58476d1ce4e5b9n
const SECRET_C = 0x94d049bb133111ebn
const ROUND_KEYS = [
  0x243f6a8885n,
  0x13198a2e03n,
  0xa409382229n,
  0x082efa98ecn,
  0x452821e638n,
  0xd01377be54n,
  0xbe5466cf34n,
  0xe90c6c7d90n
]

const ITEM_TYPES = {
  zhuYue: 0n,
  unlockLevels: 1n
}

const ITEM_TYPE_NAMES = {
  0: 'zhuYue',
  1: 'unlockLevels'
}

const LEGACY_AMOUNT_MAX = 4095
export const MAX_REDEEM_AMOUNT = 1048575
const LEGACY_NONCE_MAX = 4095
const BASE_EPOCH_MINUTE = Math.floor(Date.UTC(2025, 0, 1, 0, 0, 0) / 60000)
const EXPIRY_OFFSET_MAX = 16777215

function sanitizeCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function getAlphabetIndex(char) {
  return ALPHABET.indexOf(char)
}

function toBase32(value) {
  let remaining = BigInt(value)
  let output = ''

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    const digit = Number(remaining & 31n)
    output = `${ALPHABET[digit]}${output}`
    remaining >>= 5n
  }

  return output
}

function fromBase32(code) {
  let result = 0n

  for (const char of code) {
    const digit = getAlphabetIndex(char)
    if (digit < 0) {
      throw new Error('invalid-char')
    }

    result = (result << 5n) | BigInt(digit)
  }

  return result
}

function mix64(value) {
  let cursor = BigInt(value) & MASK_64
  cursor = ((cursor ^ (cursor >> 30n)) * SECRET_B) & MASK_64
  cursor = ((cursor ^ (cursor >> 27n)) * SECRET_C) & MASK_64
  cursor ^= cursor >> 31n
  return cursor & MASK_64
}

function computeTag(payload) {
  const normalized = BigInt(payload) & PAYLOAD_MASK
  const a = mix64(normalized ^ SECRET_A)
  const b = mix64((normalized << 1n) ^ SECRET_B)
  const c = mix64((normalized >> 1n) ^ SECRET_C)
  return (a ^ b ^ c) & TAG_MASK
}

function feistelRound(rightHalf, roundIndex) {
  const roundKey = ROUND_KEYS[roundIndex % ROUND_KEYS.length]
  const mixed = mix64((rightHalf ^ roundKey ^ SECRET_A) + SECRET_C + BigInt(roundIndex))
  return mixed & HALF_MASK
}

function encryptBlock(block) {
  let left = (BigInt(block) >> 40n) & HALF_MASK
  let right = BigInt(block) & HALF_MASK

  for (let round = 0; round < 10; round += 1) {
    const next = (left ^ feistelRound(right, round)) & HALF_MASK
    left = right
    right = next
  }

  return (left << 40n) | right
}

function decryptBlock(block) {
  let left = (BigInt(block) >> 40n) & HALF_MASK
  let right = BigInt(block) & HALF_MASK

  for (let round = 9; round >= 0; round -= 1) {
    const previousRight = left
    const previousLeft = (right ^ feistelRound(left, round)) & HALF_MASK
    left = previousLeft
    right = previousRight
  }

  return (left << 40n) | right
}

function formatCode(rawCode) {
  return `${rawCode.slice(0, 4)}-${rawCode.slice(4, 8)}-${rawCode.slice(8, 12)}-${rawCode.slice(12)}`
}

function validateRewardType(rewardType) {
  if (!Object.prototype.hasOwnProperty.call(ITEM_TYPES, rewardType)) {
    throw new Error('unsupported-reward-type')
  }
}

function normalizeAmount(amount) {
  const normalizedAmount = Math.floor(Number(amount) || 0)
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error('invalid-amount')
  }
  if (normalizedAmount > MAX_REDEEM_AMOUNT) {
    throw new Error('amount-out-of-range')
  }
  return normalizedAmount
}

function normalizeNonce(nonceValue) {
  const normalizedNonce = Math.floor(Number(nonceValue) || 0)
  if (!Number.isFinite(normalizedNonce) || normalizedNonce < 0 || normalizedNonce > LEGACY_NONCE_MAX) {
    throw new Error('nonce-out-of-range')
  }
  return normalizedNonce
}

function normalizeExpiryMinute(expiryMinute) {
  const normalizedExpiry = Math.floor(Number(expiryMinute) || 0)
  if (!Number.isFinite(normalizedExpiry) || normalizedExpiry < 0) {
    throw new Error('invalid-expiry')
  }
  return normalizedExpiry
}

function packPayloadV2({ itemType, amount, expiryMinute, nonce }) {
  let payload = VERSION_LEGACY
  payload = (payload << 2n) | BigInt(itemType)
  payload = (payload << 12n) | BigInt(amount)
  payload = (payload << 32n) | BigInt(expiryMinute)
  payload = (payload << 12n) | BigInt(nonce)
  return payload & PAYLOAD_MASK
}

function unpackPayloadV2(payload) {
  let cursor = BigInt(payload) & PAYLOAD_MASK
  const nonce = Number(cursor & 0xfffn)
  cursor >>= 12n
  const expiryMinute = Number(cursor & 0xffffffffn)
  cursor >>= 32n
  const amount = Number(cursor & 0xfffn)
  cursor >>= 12n
  const itemType = Number(cursor & 0x3n)
  cursor >>= 2n
  const version = Number(cursor & 0x3n)

  return {
    version,
    itemType,
    amount,
    expiryMinute,
    nonce
  }
}

function packPayloadV3({ itemType, amount, expiryMinute, nonce }) {
  const expiryOffset = expiryMinute - BASE_EPOCH_MINUTE
  if (expiryOffset < 0 || expiryOffset > EXPIRY_OFFSET_MAX) {
    throw new Error('expiry-out-of-range')
  }

  let payload = VERSION_CURRENT
  payload = (payload << 2n) | BigInt(itemType)
  payload = (payload << 20n) | BigInt(amount)
  payload = (payload << 24n) | BigInt(expiryOffset)
  payload = (payload << 12n) | BigInt(nonce)
  return payload & PAYLOAD_MASK
}

function unpackPayloadV3(payload) {
  let cursor = BigInt(payload) & PAYLOAD_MASK
  const nonce = Number(cursor & 0xfffn)
  cursor >>= 12n
  const expiryOffset = Number(cursor & 0xffffffn)
  cursor >>= 24n
  const amount = Number(cursor & 0xfffffn)
  cursor >>= 20n
  const itemType = Number(cursor & 0x3n)
  cursor >>= 2n
  const version = Number(cursor & 0x3n)

  return {
    version,
    itemType,
    amount,
    expiryMinute: BASE_EPOCH_MINUTE + expiryOffset,
    nonce
  }
}

function readVersion(payload) {
  return Number((BigInt(payload) >> 58n) & 0x3n)
}

function unpackPayload(payload) {
  const version = readVersion(payload)
  if (version === Number(VERSION_LEGACY)) {
    return unpackPayloadV2(payload)
  }
  if (version === Number(VERSION_CURRENT)) {
    return unpackPayloadV3(payload)
  }
  return {
    version
  }
}

export function getCurrentMinuteTimestamp(date = new Date()) {
  return Math.floor(date.getTime() / 60000)
}

export function encodeRedeemCode({
  rewardType = 'zhuYue',
  amount,
  expiryMinute,
  salt,
  nonce
}) {
  validateRewardType(rewardType)

  const normalizedAmount = normalizeAmount(amount)
  const normalizedExpiry = normalizeExpiryMinute(expiryMinute)
  const normalizedNonce = normalizeNonce(nonce ?? salt ?? 0)
  const payload = packPayloadV3({
    itemType: ITEM_TYPES[rewardType],
    amount: normalizedAmount,
    expiryMinute: normalizedExpiry,
    nonce: normalizedNonce
  })
  const tag = computeTag(payload)
  const encoded = toBase32(encryptBlock((payload << 20n) | tag))
  return formatCode(encoded)
}

export function decodeRedeemCode(inputCode, nowMinute = getCurrentMinuteTimestamp()) {
  const sanitized = sanitizeCode(inputCode)
  if (sanitized.length !== CODE_LENGTH) {
    return {
      ok: false,
      reason: 'length'
    }
  }

  let rawValue
  try {
    rawValue = decryptBlock(fromBase32(sanitized))
  } catch (error) {
    return {
      ok: false,
      reason: 'format'
    }
  }

  const payload = (rawValue >> 20n) & PAYLOAD_MASK
  const tag = rawValue & TAG_MASK
  if (tag !== computeTag(payload)) {
    return {
      ok: false,
      reason: 'checksum'
    }
  }

  const decoded = unpackPayload(payload)
  if (![Number(VERSION_LEGACY), Number(VERSION_CURRENT)].includes(decoded.version)) {
    return {
      ok: false,
      reason: 'version'
    }
  }

  const rewardType = ITEM_TYPE_NAMES[decoded.itemType]
  if (!rewardType) {
    return {
      ok: false,
      reason: 'reward-type'
    }
  }

  if (nowMinute > decoded.expiryMinute) {
    return {
      ok: false,
      reason: 'expired',
      rewardType,
      amount: decoded.amount,
      expiryMinute: decoded.expiryMinute,
      codeId: sanitized
    }
  }

  return {
    ok: true,
    codeId: sanitized,
    rewardType,
    amount: decoded.amount,
    expiryMinute: decoded.expiryMinute,
    nonce: decoded.nonce,
    version: decoded.version
  }
}

export function formatExpiryMinute(expiryMinute) {
  const date = new Date(Number(expiryMinute) * 60000)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getRedeemCodeLimits() {
  return {
    maxAmount: MAX_REDEEM_AMOUNT,
    maxNonce: LEGACY_NONCE_MAX,
    baseEpochMinute: BASE_EPOCH_MINUTE,
    maxExpiryMinute: BASE_EPOCH_MINUTE + EXPIRY_OFFSET_MAX
  }
}

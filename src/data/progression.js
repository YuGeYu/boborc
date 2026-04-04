import { ACTIVITY_CURRENCY_LABEL, CURRENCY_LABEL, LEVELS, PLAYER_CHARACTERS } from '@/data/gameContent'

const STORAGE_KEY = 'fightback:profiles-v3'
const LEGACY_STORAGE_KEY = 'fightback:progression-v1'
const LEGACY_PROFILE_STORAGE_KEY = 'fightback:profiles-v2'
const DEVICE_KEY = 'fightback:device-id-v1'
const SAVE_SLOT_COUNT = 3

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function getOrCreateDeviceId() {
  const existing = localStorage.getItem(DEVICE_KEY)
  if (existing) {
    return existing
  }

  const next = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem(DEVICE_KEY, next)
  return next
}

function createEmptySaveSlot(index) {
  if (index === 0) {
    return {
      id: 'slot-default',
      name: 'Auto Save',
      savedAt: '',
      progress: null,
      readOnly: true
    }
  }

  return {
    id: `slot-${index + 1}`,
    name: `Save ${index + 1}`,
    savedAt: '',
    progress: null,
    readOnly: false
  }
}

export function createDefaultProgress() {
  const characterMastery = Object.fromEntries(
    PLAYER_CHARACTERS.map((character) => [character.id, 0])
  )

  return {
    currencyLabel: CURRENCY_LABEL,
    activityCurrencyLabel: ACTIVITY_CURRENCY_LABEL,
    zhuYue: 0,
    starlightBadge: 0,
    activeLevelId: LEVELS[0].id,
    selectedCharacterId: PLAYER_CHARACTERS[0].id,
    selectedSkinIds: {
      starter: 'starter-default'
    },
    selectedEquipmentId: null,
    equipmentEvolutionSelections: {
      none: 'alert-pulse-ring',
      sword: 'pojun-edge',
      shield: 'yaogang-bulwark',
      shoes: 'zhuifeng-lv',
      spring: 'rebound-core'
    },
    equipmentSecondEvolutionSelections: {
      'alert-pulse-ring': 'ember-pulse-core',
      'shockwave-greaves': 'rift-quake-greaves',
      'pojun-edge': 'tianzhu-breaking-edge',
      'liuguang-blade': 'soulmirror-edge',
      'yaogang-bulwark': 'xuantie-aegis',
      'liufeng-cloak': 'mufeng-lifecape',
      'zhuifeng-lv': 'swiftshadow-greaves',
      'lingyue-boots': 'shenxing-battleboots',
      'rebound-core': 'guardecho-spring',
      'quake-spring': 'skyquake-spring'
    },
    unlockedCharacterIds: [PLAYER_CHARACTERS[0].id],
    unlockedLevelIds: [LEVELS[0].id],
    clearedLevelIds: [],
    battleHistory: [],
    dailyRewards: {
      loginClaimedOn: '',
      participatedOn: '',
      firstWinOn: ''
    },
    characterMastery
  }
}

function normalizeProgress(progress) {
  const defaultProgress = createDefaultProgress()
  const characterMastery = { ...defaultProgress.characterMastery }
  const merged = {
    ...defaultProgress,
    ...(progress || {})
  }

  merged.unlockedCharacterIds = Array.isArray(merged.unlockedCharacterIds)
    ? [...new Set(merged.unlockedCharacterIds)]
    : [PLAYER_CHARACTERS[0].id]
  merged.selectedEquipmentId = typeof merged.selectedEquipmentId === 'string' && merged.selectedEquipmentId
    ? merged.selectedEquipmentId
    : null
  merged.selectedSkinIds = merged.selectedSkinIds && typeof merged.selectedSkinIds === 'object'
    ? {
        ...defaultProgress.selectedSkinIds,
        ...merged.selectedSkinIds
      }
    : defaultProgress.selectedSkinIds
  merged.equipmentEvolutionSelections = merged.equipmentEvolutionSelections && typeof merged.equipmentEvolutionSelections === 'object'
    ? {
        ...defaultProgress.equipmentEvolutionSelections,
        ...merged.equipmentEvolutionSelections
      }
    : defaultProgress.equipmentEvolutionSelections
  merged.equipmentSecondEvolutionSelections = merged.equipmentSecondEvolutionSelections && typeof merged.equipmentSecondEvolutionSelections === 'object'
    ? {
        ...defaultProgress.equipmentSecondEvolutionSelections,
        ...merged.equipmentSecondEvolutionSelections
      }
    : defaultProgress.equipmentSecondEvolutionSelections
  merged.unlockedLevelIds = Array.isArray(merged.unlockedLevelIds)
    ? [...new Set(merged.unlockedLevelIds)]
    : [LEVELS[0].id]
  merged.clearedLevelIds = Array.isArray(merged.clearedLevelIds) ? merged.clearedLevelIds : []
  merged.battleHistory = Array.isArray(merged.battleHistory) ? merged.battleHistory : []
  merged.dailyRewards = merged.dailyRewards && typeof merged.dailyRewards === 'object'
    ? {
        ...defaultProgress.dailyRewards,
        ...merged.dailyRewards
      }
    : defaultProgress.dailyRewards
  merged.characterMastery = merged.characterMastery && typeof merged.characterMastery === 'object'
    ? {
        ...characterMastery,
        ...merged.characterMastery
      }
    : characterMastery

  return merged
}

function createDefaultSyncMeta() {
  return {
    deviceId: getOrCreateDeviceId(),
    localUpdatedAt: '',
    cloudVersion: 0,
    cloudUpdatedAt: '',
    lastSyncedAt: ''
  }
}

function createDefaultAccount(name = 'Default Account') {
  const now = new Date().toISOString()
  const progression = createDefaultProgress()
  const saveSlots = Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => createEmptySaveSlot(index))
  saveSlots[0] = {
    ...saveSlots[0],
    savedAt: now,
    progress: clone(progression)
  }

  return {
    id: `account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: now,
    lastRedeemedOn: '',
    progression,
    saveSlots
  }
}

function normalizeSaveSlots(saveSlots) {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => {
    const slot = Array.isArray(saveSlots) ? saveSlots[index] : null
    const fallback = createEmptySaveSlot(index)

    if (!slot) {
      return fallback
    }

    return {
      ...fallback,
      ...slot,
      progress: slot.progress ? normalizeProgress(slot.progress) : null
    }
  })
}

function normalizeAccount(account, index) {
  const fallback = createDefaultAccount(`Account ${index + 1}`)
  const progression = normalizeProgress(account?.progression)
  const saveSlots = normalizeSaveSlots(account?.saveSlots)

  saveSlots[0] = {
    ...saveSlots[0],
    id: 'slot-default',
    name: 'Auto Save',
    readOnly: true,
    savedAt: saveSlots[0].savedAt || account?.createdAt || fallback.createdAt,
    progress: clone(progression)
  }

  return {
    ...fallback,
    ...account,
    name: account?.name || fallback.name,
    progression,
    saveSlots,
    lastRedeemedOn: account?.lastRedeemedOn || ''
  }
}

function normalizeSyncMeta(syncMeta) {
  return {
    ...createDefaultSyncMeta(),
    ...(syncMeta || {})
  }
}

export function normalizeProfileStore(store) {
  const accounts = Array.isArray(store?.accounts) && store.accounts.length
    ? store.accounts.map(normalizeAccount)
    : [createDefaultAccount()]

  const currentAccountId = accounts.some((account) => account.id === store?.currentAccountId)
    ? store.currentAccountId
    : accounts[0].id

  return {
    currentAccountId,
    accounts,
    redeemedCodeRecords: store?.redeemedCodeRecords && typeof store.redeemedCodeRecords === 'object'
      ? store.redeemedCodeRecords
      : {},
    syncMeta: normalizeSyncMeta(store?.syncMeta)
  }
}

function createInitialStore() {
  const account = createDefaultAccount()
  return normalizeProfileStore({
    currentAccountId: account.id,
    accounts: [account],
    redeemedCodeRecords: {},
    syncMeta: createDefaultSyncMeta()
  })
}

function migrateLegacyProgress() {
  try {
    const legacyProfiles = JSON.parse(localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY))
    if (legacyProfiles?.accounts?.length) {
      return normalizeProfileStore(legacyProfiles)
    }

    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY))
    if (!legacy) {
      return null
    }

    const migrated = createDefaultAccount('Default Account')
    migrated.progression = normalizeProgress(legacy)

    return normalizeProfileStore({
      currentAccountId: migrated.id,
      accounts: [migrated],
      redeemedCodeRecords: {}
    })
  } catch (error) {
    return null
  }
}

export function loadProfileStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved) {
      const migrated = migrateLegacyProgress()
      if (migrated) {
        return saveProfileStore(migrated)
      }

      return saveProfileStore(createInitialStore())
    }

    return normalizeProfileStore(saved)
  } catch (error) {
    return saveProfileStore(createInitialStore())
  }
}

export function saveProfileStore(store, options = {}) {
  const normalized = normalizeProfileStore(store)

  if (options.touchLocal) {
    normalized.syncMeta.localUpdatedAt = new Date().toISOString()
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function exportProgress(progress) {
  return clone(normalizeProgress(progress))
}

export function createFreshProgress() {
  return createDefaultProgress()
}

export function createAccount(name) {
  return createDefaultAccount(name)
}

export function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

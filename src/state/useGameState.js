import { computed, reactive } from 'vue'
import {
  ACTIVITY_CURRENCY_LABEL,
  ATTACK_COOLDOWNS,
  AI_OPPONENT,
  CHARACTER_SKINS,
  CURRENCY_LABEL,
  EQUIPMENT_OPTIONS,
  LEVELS,
  PLAYER_CHARACTERS,
  STARTER_SKIN_UNLOCK_LEVEL,
  SUPER_CABBO_UNLOCK_LEVEL,
  getCharacterById,
  getEquipmentEvolutionById,
  getEquipmentById,
  getUnequippedEvolutionById,
  getLevelById
} from '@/data/gameContent'
import { createBattleActor, normalizeBattleConfigShape } from '@/game/battleConfig'
import {
  createAccount,
  createFreshProgress,
  exportProgress,
  getTodayKey,
  loadProfileStore,
  normalizeProfileStore,
  saveProfileStore
} from '@/data/progression'
import { decodeRedeemCode, formatExpiryMinute } from '@/common/redeemCodes'
import {
  clearStoredSessionToken,
  fetchCloudSave,
  fetchCurrentCloudUser,
  getStoredSessionToken,
  loginCloudAccount,
  logoutCloudAccount,
  pushCloudSave,
  registerCloudAccount,
  setStoredSessionToken
} from '@/common/cloudApi'

const accountStore = reactive(loadProfileStore())
const progress = reactive(exportProgress(getCurrentAccountRecord().progression))
const session = reactive({
  activeLevelId: progress.activeLevelId || progress.unlockedLevelIds[0],
  lastBattleResult: null,
  battleLaunchId: 0,
  settingsMessage: '',
  settingsError: '',
  saveMessage: '',
  saveError: ''
})
const auth = reactive({
  sessionToken: getStoredSessionToken(),
  user: null,
  status: 'idle',
  initialized: false,
  message: '',
  error: '',
  syncStatus: 'idle',
  syncMessage: '',
  syncError: '',
  apiAvailable: true,
  migrationNotice: ''
})

let cloudSyncTimer = null
let localMutationVersion = 0
let storeSyncListenersRegistered = false
const DAILY_ACTIVITY_REWARDS = {
  login: 20,
  participation: 12,
  firstWin: 30
}
const MASTERY_LEVEL_ASSETS = [
  '/mastery-icons/1.jpg',
  '/mastery-icons/2.jpg',
  '/mastery-icons/3.jpg',
  '/mastery-icons/4.jpg',
  '/mastery-icons/5.jpg',
  '/mastery-icons/6.jpg',
  '/mastery-icons/7.jpg',
  '/mastery-icons/8.jpg',
  '/mastery-icons/9.jpg'
]
const MASTERY_LEVEL_LABELS = ['入门', '熟悉', '稳练', '专注', '炽亮', '高阶', '星旋', '辉耀', '极境']
const CHARACTER_MASTERY_REWARDS = {
  participation: 5,
  win: 10,
  firstWinBonus: 10
}

function validateUsername(value) {
  const username = String(value || '').trim().toLowerCase()
  if (username.length < 3 || username.length > 24) {
    return '用户名需要 3 到 24 位。'
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return '用户名只能包含小写字母、数字和下划线。'
  }

  return ''
}

function validatePassword(value) {
  const password = String(value || '')
  if (password.length < 6) {
    return '密码至少需要 6 位。'
  }

  return ''
}

function roundToTenth(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10
}

function getMasteryPresentation(mastery) {
  const normalizedMastery = Math.max(0, Number(mastery || 0))
  let level = 1

  for (let nextLevel = 2; nextLevel <= 9; nextLevel += 1) {
    const threshold = Math.pow(nextLevel - 1, 2) * 100
    if (normalizedMastery >= threshold) {
      level = nextLevel
    }
  }

  const nextLevelAt = level >= 9 ? null : Math.pow(level, 2) * 100
  const nextLevelNeed = nextLevelAt === null ? null : Math.max(0, nextLevelAt - normalizedMastery)

  return {
    mastery: normalizedMastery,
    level,
    levelLabel: `Lv${level}`,
    title: MASTERY_LEVEL_LABELS[level - 1],
    iconUrl: MASTERY_LEVEL_ASSETS[level - 1],
    nextLevelAt,
    nextLevelNeed,
    canGlow: level >= 5,
    canOrbit: level >= 7,
    canPulse: level >= 9
  }
}

function ensureCharacterMasteryMap() {
  const nextMastery = Object.fromEntries(
    PLAYER_CHARACTERS.map((character) => [
      character.id,
      Number(progress.characterMastery?.[character.id] || 0)
    ])
  )
  progress.characterMastery = nextMastery
  return nextMastery
}

function addActivityCurrency(amount) {
  const normalizedAmount = Math.max(0, Number(amount || 0))
  if (normalizedAmount <= 0) {
    return 0
  }

  progress.starlightBadge = Number(progress.starlightBadge || 0) + normalizedAmount
  return normalizedAmount
}

function addCharacterMastery(characterId, amount, options = {}) {
  const normalizedAmount = Math.max(0, Number(amount || 0))
  if (!characterId || normalizedAmount <= 0) {
    return 0
  }

  const mastery = ensureCharacterMasteryMap()
  mastery[characterId] = Number(mastery[characterId] || 0) + normalizedAmount
  progress.characterMastery = {
    ...mastery
  }

  if (!options.silent) {
    session.settingsMessage = `${getCharacterById(characterId).name} 熟练度 +${normalizedAmount}`
    session.settingsError = ''
  }

  return normalizedAmount
}

function getAvailableCharacterSkins(characterId) {
  const skins = CHARACTER_SKINS[characterId] || []
  const masteryLevel = getMasteryPresentation(progress.characterMastery?.[characterId] || 0).level

  return skins.filter((skin) => !skin.unlockMasteryLevel || masteryLevel >= skin.unlockMasteryLevel)
}

function getSelectedSkinForCharacter(characterId) {
  const skins = CHARACTER_SKINS[characterId] || []
  if (!skins.length) {
    return null
  }

  const selectedSkinId = progress.selectedSkinIds?.[characterId] || skins[0].id
  const availableSkins = getAvailableCharacterSkins(characterId)
  return availableSkins.find((skin) => skin.id === selectedSkinId) || availableSkins[0] || skins[0]
}

function selectCharacterSkin(characterId, skinId) {
  const availableSkins = getAvailableCharacterSkins(characterId)
  const targetSkin = availableSkins.find((skin) => skin.id === skinId)

  if (!targetSkin) {
    session.settingsError = '该皮肤当前还不能使用。'
    session.settingsMessage = ''
    return false
  }

  progress.selectedSkinIds = {
    ...(progress.selectedSkinIds || {}),
    [characterId]: targetSkin.id
  }
  session.settingsMessage = `${getCharacterById(characterId).name} 已切换为${targetSkin.name}`
  session.settingsError = ''
  persistStore()
  return true
}

function spendActivityCurrencyOnMastery(characterId, amount) {
  const targetCharacter = getCharacterById(characterId)
  const spendAmount = Math.max(0, Math.floor(Number(amount || 0)))

  if (!targetCharacter?.id || spendAmount <= 0) {
    session.settingsError = '请输入有效的星辉徽记数量。'
    session.settingsMessage = ''
    return false
  }

  if (Number(progress.starlightBadge || 0) < spendAmount) {
    session.settingsError = `${ACTIVITY_CURRENCY_LABEL} 不足。`
    session.settingsMessage = ''
    return false
  }

  progress.starlightBadge -= spendAmount
  addCharacterMastery(targetCharacter.id, spendAmount, { silent: true })
  session.settingsMessage = `已为 ${targetCharacter.name} 消耗 ${spendAmount} ${ACTIVITY_CURRENCY_LABEL}，熟练度 +${spendAmount}`
  session.settingsError = ''
  persistStore()
  return true
}

function exchangeZhuYueForActivityCurrency(amount) {
  const spendAmount = Math.max(0, Math.floor(Number(amount || 0)))

  if (spendAmount <= 0) {
    session.settingsError = '请输入有效的朱玥数量。'
    session.settingsMessage = ''
    return false
  }

  if (Number(progress.zhuYue || 0) < spendAmount) {
    session.settingsError = `朱玥不足，当前仅有 ${progress.zhuYue}。`
    session.settingsMessage = ''
    return false
  }

  const badgeGain = spendAmount * 10
  progress.zhuYue -= spendAmount
  addActivityCurrency(badgeGain)
  session.settingsMessage = `已消耗 ${spendAmount} 朱玥，兑换 ${badgeGain} ${ACTIVITY_CURRENCY_LABEL}`
  session.settingsError = ''
  persistStore()
  return true
}

function claimDailyLoginRewardIfNeeded(options = {}) {
  const todayKey = getTodayKey()
  const dailyRewards = {
    loginClaimedOn: '',
    participatedOn: '',
    firstWinOn: '',
    ...(progress.dailyRewards || {})
  }

  if (dailyRewards.loginClaimedOn === todayKey) {
    progress.dailyRewards = dailyRewards
    return false
  }

  dailyRewards.loginClaimedOn = todayKey
  progress.dailyRewards = dailyRewards
  addActivityCurrency(DAILY_ACTIVITY_REWARDS.login)

  if (!options.silent) {
    session.settingsMessage = `每日登录奖励已发放：+${DAILY_ACTIVITY_REWARDS.login} ${ACTIVITY_CURRENCY_LABEL}`
    session.settingsError = ''
  }

  return true
}

function applyDailyBattleRewards(result) {
  const todayKey = getTodayKey()
  const dailyRewards = {
    loginClaimedOn: '',
    participatedOn: '',
    firstWinOn: '',
    ...(progress.dailyRewards || {})
  }
  const rewardNotices = []

  if (dailyRewards.participatedOn !== todayKey) {
    dailyRewards.participatedOn = todayKey
    addActivityCurrency(DAILY_ACTIVITY_REWARDS.participation)
    rewardNotices.push(`每日参加关卡 +${DAILY_ACTIVITY_REWARDS.participation} ${ACTIVITY_CURRENCY_LABEL}`)
  }

  if (result.isWinner && dailyRewards.firstWinOn !== todayKey) {
    dailyRewards.firstWinOn = todayKey
    addActivityCurrency(DAILY_ACTIVITY_REWARDS.firstWin)
    addCharacterMastery(result.playerId, CHARACTER_MASTERY_REWARDS.firstWinBonus, { silent: true })
    rewardNotices.push(`每日首胜 +${DAILY_ACTIVITY_REWARDS.firstWin} ${ACTIVITY_CURRENCY_LABEL}`)
  }

  progress.dailyRewards = dailyRewards
  return rewardNotices
}

function getCurrentAccountRecord() {
  return accountStore.accounts.find((account) => account.id === accountStore.currentAccountId) || accountStore.accounts[0]
}

function applyProgress(nextProgress) {
  const cloned = exportProgress(nextProgress)
  Object.assign(progress, cloned)
  session.activeLevelId = cloned.activeLevelId || cloned.unlockedLevelIds[0]
  session.lastBattleResult = null
}

function replaceStore(nextStore) {
  const normalized = normalizeProfileStore(nextStore)

  accountStore.currentAccountId = normalized.currentAccountId
  accountStore.accounts.splice(0, accountStore.accounts.length, ...normalized.accounts)
  accountStore.redeemedCodeRecords = normalized.redeemedCodeRecords
  accountStore.syncMeta = normalized.syncMeta

  applyProgress(getCurrentAccountRecord().progression)
}

function mergeProgressPreservingLocalSelections(remoteProgress, localProgressSnapshot) {
  const mergedProgress = exportProgress(remoteProgress)
  const localProgress = exportProgress(localProgressSnapshot)

  if (localProgress.selectedCharacterId && mergedProgress.unlockedCharacterIds.includes(localProgress.selectedCharacterId)) {
    mergedProgress.selectedCharacterId = localProgress.selectedCharacterId
  }

  if (localProgress.activeLevelId && mergedProgress.unlockedLevelIds.includes(localProgress.activeLevelId)) {
    mergedProgress.activeLevelId = localProgress.activeLevelId
  }

  mergedProgress.selectedSkinIds = {
    ...(mergedProgress.selectedSkinIds || {}),
    ...(localProgress.selectedSkinIds || {})
  }
  mergedProgress.selectedEquipmentId = localProgress.selectedEquipmentId ?? null
  mergedProgress.equipmentEvolutionSelections = {
    ...(mergedProgress.equipmentEvolutionSelections || {}),
    ...(localProgress.equipmentEvolutionSelections || {})
  }

  return mergedProgress
}

function mergeRemoteSavePreservingLocalSelections(save, localProgressSnapshot) {
  if (!save?.payload?.accounts?.length) {
    return save
  }

  const currentAccountId = accountStore.currentAccountId

  return {
    ...save,
    payload: {
      ...save.payload,
      accounts: save.payload.accounts.map((account) => {
        if (account.id !== currentAccountId) {
          return account
        }

        return {
          ...account,
          progression: mergeProgressPreservingLocalSelections(account.progression, localProgressSnapshot)
        }
      })
    }
  }
}

function toTimestamp(value) {
  const timestamp = value ? new Date(value).getTime() : Number.NaN
  return Number.isFinite(timestamp) ? timestamp : Number.NaN
}

function shouldPreserveLocalSelectionsForRemoteSave(save, options = {}) {
  const localUpdatedAt = options.localUpdatedAt || accountStore.syncMeta?.localUpdatedAt
  const localUpdatedTimestamp = toTimestamp(localUpdatedAt)
  const remoteUpdatedTimestamp = toTimestamp(save?.updatedAt)

  if (!Number.isFinite(localUpdatedTimestamp)) {
    return false
  }

  if (!Number.isFinite(remoteUpdatedTimestamp)) {
    return true
  }

  return localUpdatedTimestamp > remoteUpdatedTimestamp
}

function serializeAccount(entry, sourceProgress) {
  const normalizedProgress = exportProgress(sourceProgress)
  const now = new Date().toISOString()

  return {
    ...entry,
    progression: normalizedProgress,
    saveSlots: entry.saveSlots.map((slot, index) => {
      if (index === 0 || slot.readOnly) {
        return {
          ...slot,
          id: 'slot-default',
          name: 'Auto Save',
          readOnly: true,
          savedAt: now,
          progress: normalizedProgress
        }
      }

      return {
        ...slot,
        readOnly: false,
        progress: slot.progress ? exportProgress(slot.progress) : null
      }
    })
  }
}

function createStoreSnapshot() {
  const account = getCurrentAccountRecord()

  return {
    currentAccountId: accountStore.currentAccountId,
    accounts: accountStore.accounts.map((entry) => serializeAccount(entry, entry.id === account.id ? progress : entry.progression)),
    redeemedCodeRecords: accountStore.redeemedCodeRecords || {},
    syncMeta: {
      ...(accountStore.syncMeta || {})
    }
  }
}

function persistStore(options = {}) {
  const touchLocal = options.touchLocal !== false
  if (touchLocal) {
    localMutationVersion += 1
  }

  const saved = saveProfileStore(createStoreSnapshot(), {
    touchLocal
  })

  replaceStore(saved)

  if (!options.skipSync) {
    scheduleCloudSync()
  }

  return saved
}

function updateSyncMeta(patch) {
  accountStore.syncMeta = {
    ...(accountStore.syncMeta || {}),
    ...patch
  }
}

function clearAuthMessages() {
  auth.message = ''
  auth.error = ''
  auth.migrationNotice = ''
}

function clearSyncMessages() {
  auth.syncMessage = ''
  auth.syncError = ''
}

function canSyncToCloud() {
  return auth.status === 'authenticated' && Boolean(auth.sessionToken)
}

function setCloudUnavailable(error) {
  auth.apiAvailable = false
  auth.syncStatus = 'offline'
  auth.syncError = error?.message || '云端接口当前不可用。'
}

function hasMeaningfulLocalProgress() {
  return accountStore.accounts.length > 1
    || progress.zhuYue > 0
    || progress.unlockedCharacterIds.length > 1
    || progress.unlockedLevelIds.length > 1
    || progress.clearedLevelIds.length > 0
    || progress.battleHistory.length > 0
}

function applyRemoteSave(save) {
  if (!save?.payload) {
    return false
  }

  const nextStore = normalizeProfileStore({
    ...save.payload,
    syncMeta: {
      ...(accountStore.syncMeta || {}),
      cloudVersion: save.version || 0,
      cloudUpdatedAt: save.updatedAt || '',
      lastSyncedAt: new Date().toISOString()
    }
  })

  const stored = saveProfileStore(nextStore, { touchLocal: false })
  replaceStore(stored)
  if (claimDailyLoginRewardIfNeeded({ silent: true })) {
    persistStore({
      touchLocal: false,
      skipSync: true
    })
  }

  auth.syncStatus = 'synced'
  auth.syncMessage = save.version ? `已读取云存档（版本 ${save.version}）。` : '已读取云存档。'
  auth.syncError = ''
  auth.apiAvailable = true
  return true
}

async function uploadLocalSave(options = {}) {
  if (!canSyncToCloud()) {
    return false
  }

  auth.syncStatus = 'syncing'
  if (!options.silent) {
    clearSyncMessages()
  }

  try {
    const localPayload = createStoreSnapshot()
    const response = await pushCloudSave(auth.sessionToken, {
      currentAccountId: localPayload.currentAccountId,
      accounts: localPayload.accounts,
      redeemedCodeRecords: localPayload.redeemedCodeRecords
    }, {
      baseVersion: accountStore.syncMeta?.cloudVersion || 0,
      force: Boolean(options.force)
    })

    updateSyncMeta({
      cloudVersion: response.save.version,
      cloudUpdatedAt: response.save.updatedAt,
      lastSyncedAt: new Date().toISOString()
    })
    persistStore({
      touchLocal: false,
      skipSync: true
    })

    auth.syncStatus = 'synced'
    auth.syncMessage = options.force
      ? '本地进度已强制上传，并覆盖云端存档。'
      : '本地进度已同步到云端。'
    auth.syncError = ''
    auth.apiAvailable = true
    return true
  } catch (error) {
    if (error.code === 'SAVE_CONFLICT') {
      auth.syncStatus = 'conflict'
      auth.syncError = '检测到云存档冲突。你可以先下载云端存档，或使用强制上传覆盖云端。'
      return false
    }

    setCloudUnavailable(error)
    return false
  }
}

async function downloadCloudSave() {
  if (!canSyncToCloud()) {
    return false
  }

  auth.syncStatus = 'syncing'
  clearSyncMessages()

  try {
    const response = await fetchCloudSave(auth.sessionToken)
    auth.apiAvailable = true

    if (!response.save) {
      auth.syncStatus = 'idle'
      auth.syncMessage = '这个云账号还没有云存档。'
      return false
    }

    return applyRemoteSave(response.save)
  } catch (error) {
    setCloudUnavailable(error)
    return false
  }
}

function scheduleCloudSync() {
  if (!canSyncToCloud()) {
    return
  }

  if (cloudSyncTimer) {
    clearTimeout(cloudSyncTimer)
  }

  cloudSyncTimer = window.setTimeout(() => {
    cloudSyncTimer = null
    void uploadLocalSave({ silent: true })
  }, 1200)
}

async function bootstrapCloudSaveAfterLogin() {
  clearSyncMessages()
  const bootstrapMutationVersion = localMutationVersion
  const bootstrapLocalProgress = exportProgress(progress)
  const bootstrapLocalUpdatedAt = accountStore.syncMeta?.localUpdatedAt || ''

  try {
    const response = await fetchCloudSave(auth.sessionToken)
    auth.apiAvailable = true

    if (!response.save) {
      if (hasMeaningfulLocalProgress()) {
        auth.migrationNotice = '首次登录检测到本机已有进度。系统将把当前浏览器里的本地存档上传到云端，作为你的初始云存档。'
        await uploadLocalSave({ silent: false })
      } else {
        auth.syncStatus = 'idle'
        auth.syncMessage = '云存档已准备好。你后续的进度会自动同步。'
      }
      return true
    }

    auth.migrationNotice = '已检测到现有云存档，当前设备将以云端版本为准。'
    if (
      localMutationVersion !== bootstrapMutationVersion
      || shouldPreserveLocalSelectionsForRemoteSave(response.save, { localUpdatedAt: bootstrapLocalUpdatedAt })
    ) {
      auth.migrationNotice = '云存档加载期间检测到你刚修改了关卡、角色或装备，已保留这些本地选择，并与云端进度合并。'
      applyRemoteSave(mergeRemoteSavePreservingLocalSelections(response.save, bootstrapLocalProgress))
      return true
    }

    applyRemoteSave(response.save)
    return true
  } catch (error) {
    setCloudUnavailable(error)
    return false
  }
}

async function initializeCloudSession() {
  if (auth.initialized) {
    return
  }

  if (!auth.sessionToken) {
    auth.status = 'guest'
    auth.initialized = true
    return
  }

  auth.status = 'loading'

  try {
    const response = await fetchCurrentCloudUser(auth.sessionToken)
    auth.user = response.user
    auth.status = 'authenticated'
    auth.initialized = true
    auth.apiAvailable = true
    await bootstrapCloudSaveAfterLogin()
  } catch (error) {
    clearStoredSessionToken()
    auth.sessionToken = ''
    auth.user = null
    auth.status = 'guest'
    auth.initialized = true
    auth.error = 'Cloud session expired. Please log in again.'
  }
}

function syncStoreFromBrowserStorage() {
  replaceStore(loadProfileStore())
}

function handlePageShow(event) {
  if (event.persisted) {
    syncStoreFromBrowserStorage()
  }
}

function handleStorage(event) {
  if (event.key && event.key !== 'fightback:profiles-v3') {
    return
  }

  syncStoreFromBrowserStorage()
}

function registerStoreSyncListeners() {
  if (storeSyncListenersRegistered || typeof window === 'undefined') {
    return
  }

  window.addEventListener('pageshow', handlePageShow)
  window.addEventListener('storage', handleStorage)
  storeSyncListenersRegistered = true
}

function isCharacterUnlocked(characterId) {
  return progress.unlockedCharacterIds.includes(characterId)
}

function isLevelUnlocked(levelId) {
  return progress.unlockedLevelIds.includes(levelId)
}

function getNextLevelById(levelId) {
  return LEVELS.find((level) => level.id === levelId + 1) || null
}

function purchaseCharacter(characterId) {
  const character = getCharacterById(characterId)
  if (!character || character.unlockCost === null || progress.zhuYue < character.unlockCost) {
    return false
  }

  progress.zhuYue -= character.unlockCost
  progress.unlockedCharacterIds = [...new Set([...progress.unlockedCharacterIds, characterId])]
  progress.selectedCharacterId = characterId
  persistStore()
  return true
}

function selectCharacter(characterId) {
  if (!isCharacterUnlocked(characterId)) {
    return false
  }

  progress.selectedCharacterId = characterId
  persistStore()
  return true
}

function selectEquipment(equipmentId) {
  if (equipmentId !== null && !getEquipmentById(equipmentId)) {
    return false
  }

  progress.selectedEquipmentId = equipmentId
  persistStore()
  return true
}

function selectEquipmentEvolution(equipmentId, evolutionId) {
  if (equipmentId === null) {
    if (evolutionId !== null && !getUnequippedEvolutionById(evolutionId)) {
      return false
    }

    progress.equipmentEvolutionSelections = {
      ...(progress.equipmentEvolutionSelections || {}),
      none: evolutionId
    }
    persistStore()
    return true
  }

  const equipment = getEquipmentById(equipmentId)
  if (!equipment) {
    return false
  }

  if (evolutionId !== null && !getEquipmentEvolutionById(equipmentId, evolutionId)) {
    return false
  }

  progress.equipmentEvolutionSelections = {
    ...(progress.equipmentEvolutionSelections || {}),
    [equipmentId]: evolutionId
  }
  persistStore()
  return true
}

function selectLevel(levelId) {
  if (!isLevelUnlocked(levelId)) {
    return false
  }

  session.activeLevelId = levelId
  progress.activeLevelId = levelId
  persistStore()
  return true
}

function handleBattleComplete(result) {
  session.lastBattleResult = result
  const rewardNotices = applyDailyBattleRewards(result)
  addCharacterMastery(result.playerId, CHARACTER_MASTERY_REWARDS.participation, { silent: true })

  if (result.isWinner) {
    progress.zhuYue += result.reward
    addCharacterMastery(result.playerId, CHARACTER_MASTERY_REWARDS.win, { silent: true })

    if (!progress.clearedLevelIds.includes(result.level)) {
      progress.clearedLevelIds = [...progress.clearedLevelIds, result.level]
    }

    const nextLevel = getNextLevelById(result.level)
    if (nextLevel && !progress.unlockedLevelIds.includes(nextLevel.id)) {
      progress.unlockedLevelIds = [...progress.unlockedLevelIds, nextLevel.id]
    }

    if (result.level >= SUPER_CABBO_UNLOCK_LEVEL && !progress.unlockedCharacterIds.includes('cabbo')) {
      progress.unlockedCharacterIds = [...progress.unlockedCharacterIds, 'cabbo']
    }

    if (result.level >= 100 && !progress.unlockedCharacterIds.includes('dream-catbug')) {
      progress.unlockedCharacterIds = [...progress.unlockedCharacterIds, 'dream-catbug']
      rewardNotices.push('梦想猫虫已加入队伍')
    }
  }

  progress.battleHistory = [
    {
      id: result.id || `${result.level}-${result.updatedAt}`,
      level: result.level,
      playerId: result.playerId,
      playerName: result.playerName,
      enemyName: result.enemyName,
      score: result.score,
      reward: result.reward,
      isWinner: result.isWinner,
      playedAt: result.updatedAt,
      summary: result.summary || null,
      debugLog: Array.isArray(result.debugLog) ? result.debugLog : []
    },
    ...progress.battleHistory
  ].slice(0, 20)

  if (rewardNotices.length) {
    session.settingsMessage = rewardNotices.join('，')
    session.settingsError = ''
  }

  persistStore()
}

function launchBattle() {
  session.battleLaunchId += 1
  return true
}

function restartCurrentLevel() {
  return launchBattle()
}

function goToNextLevel() {
  const nextLevel = getNextLevelById(session.activeLevelId)
  if (!nextLevel || !isLevelUnlocked(nextLevel.id)) {
    return false
  }

  session.activeLevelId = nextLevel.id
  progress.activeLevelId = nextLevel.id
  persistStore()
  return true
}

function challengeNextLevel() {
  if (!goToNextLevel()) {
    return false
  }

  return launchBattle()
}

function resetAllProgress() {
  applyProgress(createFreshProgress())
  claimDailyLoginRewardIfNeeded({ silent: true })
  persistStore()
}

function saveToSlot(slotId) {
  const account = getCurrentAccountRecord()
  const slot = account.saveSlots.find((item) => item.id === slotId)
  if (!slot) {
    session.saveError = 'Save slot not found.'
    session.saveMessage = ''
    return false
  }

  if (slot.readOnly) {
    session.saveError = `${slot.name} is read-only.`
    session.saveMessage = ''
    return false
  }

  slot.progress = exportProgress(progress)
  slot.savedAt = new Date().toISOString()
  session.saveMessage = `${slot.name} saved.`
  session.saveError = ''
  persistStore()
  return true
}

function loadFromSlot(slotId) {
  const account = getCurrentAccountRecord()
  const slot = account.saveSlots.find((item) => item.id === slotId)
  if (!slot || !slot.progress) {
    session.saveError = 'This slot is empty.'
    session.saveMessage = ''
    return false
  }

  applyProgress(slot.progress)
  session.saveMessage = `${slot.name} loaded.`
  session.saveError = ''
  persistStore()
  return true
}

function startFreshSave() {
  applyProgress(createFreshProgress())
  claimDailyLoginRewardIfNeeded({ silent: true })
  session.saveMessage = 'Started a fresh save.'
  session.saveError = ''
  persistStore()
  return true
}

function switchAccount(accountId) {
  const account = accountStore.accounts.find((entry) => entry.id === accountId)
  if (!account) {
    session.saveError = 'Account not found.'
    session.saveMessage = ''
    return false
  }

  persistStore({
    skipSync: true
  })
  accountStore.currentAccountId = account.id
  applyProgress(account.progression)
  claimDailyLoginRewardIfNeeded({ silent: true })
  session.saveMessage = `Switched to ${account.name}.`
  session.saveError = ''
  persistStore()
  return true
}

function addAccount(name) {
  const trimmed = String(name || '').trim()
  if (!trimmed) {
    session.saveError = 'Account name is required.'
    session.saveMessage = ''
    return false
  }

  const account = createAccount(trimmed)
  accountStore.accounts.push(account)
  accountStore.currentAccountId = account.id
  applyProgress(account.progression)
  claimDailyLoginRewardIfNeeded({ silent: true })
  session.saveMessage = `Created account ${trimmed}.`
  session.saveError = ''
  persistStore()
  return true
}

function redeemCode(code) {
  const trimmed = String(code || '').trim().toUpperCase()
  const account = getCurrentAccountRecord()
  const decoded = decodeRedeemCode(trimmed)

    if (!decoded.ok) {
      session.settingsError = decoded.reason === 'expired'
        ? `兑换码已过期，截止时间：${formatExpiryMinute(decoded.expiryMinute)}。`
        : '兑换码无效，请检查后重新输入。'
      session.settingsMessage = ''
      return false
    }

  const redeemedCodeRecords = accountStore.redeemedCodeRecords || {}
  const existingRecord = redeemedCodeRecords[decoded.codeId]
    if (existingRecord) {
      session.settingsError = existingRecord.accountId === account.id
        ? '这个兑换码已经被当前账号使用过了。'
        : '这个兑换码已经被其他账号使用过了。'
      session.settingsMessage = ''
      return false
    }

  const nextRedeemedCodeRecords = {
    ...redeemedCodeRecords,
    [decoded.codeId]: {
      accountId: account.id,
      accountName: account.name,
      rewardType: decoded.rewardType,
      amount: decoded.amount,
      redeemedAt: new Date().toISOString(),
      expiresAt: formatExpiryMinute(decoded.expiryMinute)
    }
  }

    if (decoded.rewardType === 'zhuYue') {
      accountStore.redeemedCodeRecords = nextRedeemedCodeRecords
      account.lastRedeemedOn = new Date().toISOString()
      progress.zhuYue += decoded.amount
      session.settingsMessage = `兑换成功，已获得 ${decoded.amount} ${CURRENCY_LABEL}。`
      session.settingsError = ''
      persistStore()
      return true
  }

  if (decoded.rewardType === 'unlockLevels') {
    const unlockCount = Math.max(1, Math.min(decoded.amount, LEVELS.length))
    const unlockedLevelIds = LEVELS
      .filter((level) => level.id <= unlockCount)
      .map((level) => level.id)

    accountStore.redeemedCodeRecords = nextRedeemedCodeRecords
    account.lastRedeemedOn = new Date().toISOString()
    progress.unlockedLevelIds = [...new Set([...progress.unlockedLevelIds, ...unlockedLevelIds])]

    const highestUnlockedLevelId = unlockedLevelIds[unlockedLevelIds.length - 1] || session.activeLevelId
    if ((session.activeLevelId || 0) < highestUnlockedLevelId) {
      session.activeLevelId = highestUnlockedLevelId
      progress.activeLevelId = highestUnlockedLevelId
    }

      session.settingsMessage = `兑换成功，已解锁前 ${unlockCount} 个关卡。`
      session.settingsError = ''
      persistStore()
      return true
    }

    session.settingsError = '当前版本暂不支持这个兑换码。'
    session.settingsMessage = ''
    return false
  }

async function registerAccount(form) {
  clearAuthMessages()
  const usernameError = validateUsername(form.username)
  if (usernameError) {
    auth.status = 'guest'
    auth.error = usernameError
    return false
  }

  const passwordError = validatePassword(form.password)
  if (passwordError) {
    auth.status = 'guest'
    auth.error = passwordError
    return false
  }

  auth.status = 'loading'

  try {
    const response = await registerCloudAccount(form)
    auth.sessionToken = response.token
    auth.user = response.user
    auth.status = 'authenticated'
    auth.initialized = true
    auth.apiAvailable = true
    setStoredSessionToken(response.token)
    auth.message = `已登录云账号：${response.user.displayName}。`
    await bootstrapCloudSaveAfterLogin()
    return true
  } catch (error) {
    auth.status = 'guest'
    auth.error = error.message
    return false
  }
}

async function loginAccount(form) {
  clearAuthMessages()
  const usernameError = validateUsername(form.username)
  if (usernameError) {
    auth.status = 'guest'
    auth.error = usernameError
    return false
  }

  const passwordError = validatePassword(form.password)
  if (passwordError) {
    auth.status = 'guest'
    auth.error = passwordError
    return false
  }

  auth.status = 'loading'

  try {
    const response = await loginCloudAccount(form)
    auth.sessionToken = response.token
    auth.user = response.user
    auth.status = 'authenticated'
    auth.initialized = true
    auth.apiAvailable = true
    setStoredSessionToken(response.token)
    auth.message = `欢迎回来，${response.user.displayName}。`
    await bootstrapCloudSaveAfterLogin()
    return true
  } catch (error) {
    auth.status = 'guest'
    auth.error = error.message
    return false
  }
}

async function logoutAccount() {
  clearAuthMessages()

  try {
    if (auth.sessionToken) {
      await logoutCloudAccount(auth.sessionToken)
    }
  } catch (error) {
    auth.error = error.message
  }

  clearStoredSessionToken()
  auth.sessionToken = ''
  auth.user = null
  auth.status = 'guest'
  auth.message = '已退出云账号。本机本地存档不会被删除。'
  clearSyncMessages()
}

ensureCharacterMasteryMap()
if (claimDailyLoginRewardIfNeeded({ silent: true })) {
  persistStore({
    skipSync: true
  })
}

registerStoreSyncListeners()
void initializeCloudSession()

export function useGameState() {
  const currentAccount = computed(() => getCurrentAccountRecord())
    const selectedCharacter = computed(() => {
      const baseCharacter = getCharacterById(progress.selectedCharacterId) || PLAYER_CHARACTERS[0]
      const selectedSkin = getSelectedSkinForCharacter(baseCharacter.id)
  
      return {
        ...baseCharacter,
        selectedSkin,
        battleSpriteSheet: selectedSkin?.battleSpriteSheet || null,
        battleSpriteSheetConfig: selectedSkin?.battleSpriteSheetConfig || null,
        battleSpriteScale: selectedSkin?.battleSpriteScale || null,
        battleSpriteAnimations: selectedSkin?.battleSpriteAnimations || null
      }
    })
  const selectedEquipment = computed(() => getEquipmentById(progress.selectedEquipmentId))
  const selectedEquipmentEvolution = computed(() => {
    const equipment = selectedEquipment.value
    if (!equipment) {
      const evolutionId = progress.equipmentEvolutionSelections?.none || null
      return getUnequippedEvolutionById(evolutionId) || getUnequippedEvolutionById('alert-pulse-ring')
    }

    const evolutionId = progress.equipmentEvolutionSelections?.[equipment.id] || null
    return getEquipmentEvolutionById(equipment.id, evolutionId) || equipment.evolutionPaths?.[0] || null
  })
  const activeLevel = computed(() => getLevelById(session.activeLevelId) || LEVELS[0])
  const battleConfig = computed(() => {
    const enemyScale = activeLevel.value.enemyScale
    const baseEnemy = AI_OPPONENT.baseStats
    const equipment = selectedEquipment.value
    const equipmentBonuses = equipment?.bonuses || {}
    const equipmentEvolution = selectedEquipmentEvolution.value
    const playerAbilities = {
      ...(selectedCharacter.value.abilities || {})
    }

    if (equipmentBonuses.shieldCharges) {
      playerAbilities.shieldCharges = (playerAbilities.shieldCharges || 0) + equipmentBonuses.shieldCharges
    }

    if (equipmentBonuses.shieldReduction) {
      playerAbilities.shieldReduction = Math.max(playerAbilities.shieldReduction || 0, equipmentBonuses.shieldReduction)
    }

    const player = {
        ...selectedCharacter.value,
        baseAbilities: {
          ...(selectedCharacter.value.abilities || {})
        },
      mastery: getMasteryPresentation(progress.characterMastery?.[selectedCharacter.value.id] || 0),
      equipment,
      equipmentEvolution,
      stats: {
        ...selectedCharacter.value.stats,
        health: roundToTenth(selectedCharacter.value.stats.health),
        moveSpeed: roundToTenth(selectedCharacter.value.stats.moveSpeed + (equipmentBonuses.moveSpeed || 0)),
        jumpVelocity: roundToTenth(selectedCharacter.value.stats.jumpVelocity + (equipmentBonuses.jumpVelocity || 0)),
        punchDamage: roundToTenth(selectedCharacter.value.stats.punchDamage + (equipmentBonuses.punchDamage || 0)),
        kickDamage: roundToTenth(selectedCharacter.value.stats.kickDamage + (equipmentBonuses.kickDamage || 0))
      },
      abilities: playerAbilities,
      attackCooldowns: {
        ...ATTACK_COOLDOWNS
      }
    }

    const enemyAbilities = {
      ...(activeLevel.value.enemyAbilities || {})
    }

    const enemyActor = {
      ...AI_OPPONENT,
      name: activeLevel.value.enemyName || AI_OPPONENT.name,
      title: activeLevel.value.enemyTitle || AI_OPPONENT.title,
      avatar: activeLevel.value.enemyAvatar || AI_OPPONENT.avatar,
      abilities: enemyAbilities,
      attackCooldowns: {
        ...ATTACK_COOLDOWNS
      },
      stats: {
        health: roundToTenth(baseEnemy.health * enemyScale.health),
        moveSpeed: baseEnemy.moveSpeed,
        jumpVelocity: baseEnemy.jumpVelocity,
        punchDamage: Math.max(0.1, roundToTenth(baseEnemy.punchDamage * enemyScale.punchDamage)),
        kickDamage: Math.max(0.1, roundToTenth(baseEnemy.kickDamage * enemyScale.kickDamage)),
        reactionDelay: Math.max(180, Math.round(baseEnemy.reactionDelay * enemyScale.reactionMultiplier))
      }
    }

    return normalizeBattleConfigShape({
      player,
      enemy: enemyActor,
      allies: [
        createBattleActor({
          actor: player,
          team: 'allies',
          controlMode: 'human',
          slot: 0,
          isPrimary: true
        })
      ],
      enemies: [
        createBattleActor({
          actor: enemyActor,
          team: 'enemies',
          controlMode: 'ai',
          slot: 0,
          isPrimary: true
        })
      ],
      level: activeLevel.value
    })
  })
  const battleKey = computed(() => {
    const allies = battleConfig.value?.allies || []
    const enemies = battleConfig.value?.enemies || []
    const allyKey = allies.map(actor => actor.id).join('+') || selectedCharacter.value.id
    const enemyKey = enemies.map(actor => actor.id || actor.name).join('+') || AI_OPPONENT.id

    return `${allyKey}-vs-${enemyKey}-${activeLevel.value.id}-${selectedEquipment.value?.id || 'none'}-${selectedEquipmentEvolution.value?.id || 'base'}`
  })
  const activityCurrencyLabel = ACTIVITY_CURRENCY_LABEL
  const characterMasteryList = computed(() => PLAYER_CHARACTERS.map((character) => {
    const mastery = Number(progress.characterMastery?.[character.id] || 0)
    const rankIndex = Math.min(4, Math.floor(mastery / 100))
    const rankLabels = ['见习', '熟手', '老练', '精英', '大师']

    return {
      ...character,
      mastery,
      rankLabel: rankLabels[rankIndex],
      nextRankAt: (rankIndex + 1) * 100
    }
  }))
  const characterMasteryListEnhanced = computed(() => PLAYER_CHARACTERS.map((character) => {
    const masteryPresentation = getMasteryPresentation(progress.characterMastery?.[character.id] || 0)
    const selectedSkin = getSelectedSkinForCharacter(character.id)

    return {
      ...character,
      mastery: masteryPresentation.mastery,
      masteryLevel: masteryPresentation.level,
      rankLabel: masteryPresentation.title,
      levelLabel: masteryPresentation.levelLabel,
      iconUrl: masteryPresentation.iconUrl,
      nextRankAt: masteryPresentation.nextLevelAt,
      nextRankNeed: masteryPresentation.nextLevelNeed,
      availableSkins: getAvailableCharacterSkins(character.id),
      selectedSkinId: selectedSkin?.id || null,
      selectedSkinName: selectedSkin?.name || '默认皮肤',
      canGlow: masteryPresentation.canGlow,
      canOrbit: masteryPresentation.canOrbit,
      canPulse: masteryPresentation.canPulse
    }
  }))
  const dailyActivityStatus = computed(() => {
    const todayKey = getTodayKey()
    const rewards = progress.dailyRewards || {}

    return {
      loginClaimed: rewards.loginClaimedOn === todayKey,
      participated: rewards.participatedOn === todayKey,
      firstWinClaimed: rewards.firstWinOn === todayKey
    }
  })

  return {
    attackCooldowns: ATTACK_COOLDOWNS,
    activityCurrencyLabel,
    currencyLabel: CURRENCY_LABEL,
    characters: PLAYER_CHARACTERS,
    characterMasteryList: characterMasteryListEnhanced,
    dailyActivityRewards: DAILY_ACTIVITY_REWARDS,
    dailyActivityStatus,
    equipmentOptions: EQUIPMENT_OPTIONS,
    levels: LEVELS,
    aiOpponent: AI_OPPONENT,
    progress,
    session,
    auth,
    accountStore,
    currentAccount,
    selectedCharacter,
    selectedEquipment,
    selectedEquipmentEvolution,
    activeLevel,
    battleConfig,
    battleKey,
    isCharacterUnlocked,
    isLevelUnlocked,
    purchaseCharacter,
    selectCharacter,
    selectEquipment,
    selectEquipmentEvolution,
    selectLevel,
    launchBattle,
    restartCurrentLevel,
    goToNextLevel,
    challengeNextLevel,
    handleBattleComplete,
    resetAllProgress,
    getAvailableCharacterSkins,
    getSelectedSkinForCharacter,
    saveToSlot,
    loadFromSlot,
    startFreshSave,
    switchAccount,
    addAccount,
    addCharacterMastery,
    claimDailyLoginRewardIfNeeded,
    exchangeZhuYueForActivityCurrency,
    selectCharacterSkin,
    spendActivityCurrencyOnMastery,
    starterSkinUnlockLevel: STARTER_SKIN_UNLOCK_LEVEL,
    redeemCode,
    loginAccount,
    registerAccount,
    logoutAccount,
    downloadCloudSave,
    uploadLocalSave
  }
}

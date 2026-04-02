import Phaser, { Scene } from 'phaser'
import { normalizeBattleConfigShape } from '@/game/battleConfig'
import { getCharacterById } from '@/data/gameContent'

const playerWidth = 40
const playerHeight = 94

let platforms
let player
let keyA
let keyD
let keyW
let keyKick
let keyPunch
let keyUltimate
let keyESC
let scorePlayer
let scoreTextPlayer
let healthBarPlayer
let lifePlayer
let maxLifePlayer
let music
let fightSound
let kickSound
let punchSound
let justDownPlayer
let goingToMoveFromScene
let loadedEndAnimations
let playerShieldCharges
let playerKickHitStreak
let playerPunchFollowUpTarget
let battleDebugLog
let lastDamageDealt
let lastDamageTaken
let playerFatalGuardCharges
let playerInvisibleUntil
let playerNextInvisibilityAt
let playerProjectiles
let playerGarlicForm
let playerGarlicTrueFormUntil
let playerGarlicTransitionUntil
let playerGarlicShieldCharges
let playerStatusText
let playerPersistentDamageReduction
let playerEquipmentPunchHealCharges
let playerEquipmentPunchHealRatio
let playerEquipmentState
let playerInnateShieldCharges
let playerInnateShieldReduction
let playerNextPunchAt
let playerNextKickAt
let playerNextUltimateAt
let playerEquipmentAuraTimer
let playerJumpBoostStacks
let playerJumpState
let playerWudiDeathDanceUntil
let playerControlUntil
let playerControlReason
let enemyProjectiles
let playerIq45PunchEnergy
let playerIq45KickEnergy
let playerIq45PendingEnhancedPunch
let playerIq45LastEnergyTickAt
let playerIq45StoneUsed
let playerIq45StoneUntil
let playerIq45StoneHealTotal
let playerDreamCandySupport
let playerDefeatTimeoutId
let playerMasteryHud
let playerMasteryIcon
let playerMasteryText
let playerMasteryGlow
let playerMasteryPulseRing
let playerMasteryOrbitParticles
let playerMasteryDimUntil

const roundToTenth = (value) => Math.round((Number(value) + Number.EPSILON) * 10) / 10

const setPlayerValuebar = (bar, percentage) => {
  bar.scaleX = -percentage / 100
}

const setEnemyValuebar = (bar, percentage) => {
  bar.scaleX = percentage / 100
}

const getMasteryHudAlpha = (timeNow, dimUntil) => (timeNow < dimUntil ? 0.35 : 1)

function createEnemyState(scene, id, x, y, enemyConfig = {}) {
  const stats = enemyConfig.stats || enemyConfig
  const sprite = scene.physics.add.sprite(x, y, 'brawler2')
  sprite.setSize(playerWidth, playerHeight)
  sprite.setOffset(15, 5)
  sprite.scaleX = 2
  sprite.scaleY = 2
  sprite.setCollideWorldBounds(true)
  scene.physics.add.collider(sprite, platforms)

  return {
    id,
    sprite,
    stats: { ...stats },
    abilities: { ...(enemyConfig.abilities || {}) },
    maxLife: stats.health,
    life: stats.health,
    justDown: false,
    hitPlayer: false,
    nextDecisionAt: 0,
    actionLockUntil: 0,
    nextPunchAt: 0,
    nextKickAt: 0,
    lastJumpAt: -99999,
    pressureUntil: 0,
    repositionUntil: 0,
    gabengArrowChanceOffset: Number(enemyConfig.gabengArrowChanceOffset || 0),
    nextArrowCheckAt: 0,
    uiBar: null,
    uiBack: null,
    uiFace: null,
    label: null,
    dreamCatbugMark: null,
    defeatHandled: false
  }
}

export default class PlayScene extends Scene {
  constructor() {
    super({ key: 'PlayScene' })
  }

  init(data) {
    this.token = data.token
    this.battleConfig = normalizeBattleConfigShape(data.battleConfig || this.game.registry.get('battleConfig'))
  }

  getAllyConfigs() {
    return Array.isArray(this.battleConfig?.allies) && this.battleConfig.allies.length
      ? this.battleConfig.allies
      : [this.battleConfig.player].filter(Boolean)
  }

  getEnemyConfigs() {
    return Array.isArray(this.battleConfig?.enemies) && this.battleConfig.enemies.length
      ? this.battleConfig.enemies
      : [this.battleConfig.enemy].filter(Boolean)
  }

  create() {
    this.setUpSounds()
    this.initializeStatistics()
    this.setUpBackground()
    this.setUpPlatforms()
    this.createHpmNoteTexture()
    this.setUpPlayer()
    this.setUpInputKeys()
    this.setUpEnemyWave()
    this.setUpPlayerProjectiles()
    this.setUpEnemyProjectiles()
    this.setUpHealthBars()
    this.setUpTexts()
    this.setUpAnimationsPlayer()
    this.setUpAnimationsEnemy()
    this.addTimeEvent()
    this.setUpEquipmentAuraTimer()
  }

  update() {
    this.updatePlayerState()
    this.handlePlayerInput()
    this.updateHpmState()
    this.updateAlliedSupportUnits()
    this.handleEnemyAI()
    this.updatePlayerProjectiles()
    this.updateEnemyProjectiles()
    this.updatePlayerMasteryHud()
    this.updatePauseSnapshot()
    this.updatePlayersFlip()
    this.updateSceneNavigation()
  }

  initializeStatistics() {
    const playerStats = this.battleConfig.player.stats

    this.enemies = []
    this.enemyUi = []
    this.phase = 1
    this.phaseTransitionUntil = 0
    this.splitTriggered = false
    this.phaseBanner = null
    this.levelText = null
    this.enemyNameText = null
    this.playerAttackConnected = false
    scorePlayer = 0
    maxLifePlayer = playerStats.health
    lifePlayer = maxLifePlayer
    justDownPlayer = false
    goingToMoveFromScene = false
    loadedEndAnimations = false
    playerShieldCharges = this.battleConfig.player.abilities?.shieldCharges || 0
    playerKickHitStreak = 0
    playerPunchFollowUpTarget = null
    battleDebugLog = []
    lastDamageDealt = 0
    lastDamageTaken = 0
    playerFatalGuardCharges = this.battleConfig.player.abilities?.fatalGuardCharges || 0
    playerInvisibleUntil = 0
    playerNextInvisibilityAt = this.battleConfig.player.id === 'yuzijiang'
      ? this.time.now + 3500
      : Number.POSITIVE_INFINITY
    playerGarlicForm = this.isGarlicPlayer() ? 'fake-1' : null
    playerGarlicTrueFormUntil = 0
    playerGarlicTransitionUntil = 0
    playerGarlicShieldCharges = 0
    playerStatusText = null
    playerPersistentDamageReduction = 0
    playerEquipmentPunchHealCharges = 0
    playerEquipmentPunchHealRatio = 0
    playerNextPunchAt = 0
    playerNextKickAt = 0
    playerNextUltimateAt = 0
    playerEquipmentAuraTimer = null
    playerJumpBoostStacks = 0
    playerJumpState = {
      airborne: false,
      startY: null,
      peakY: null,
      shockwavePending: false
    }
    playerWudiDeathDanceUntil = 0
    playerControlUntil = 0
    playerControlReason = null
    playerIq45PunchEnergy = 0
    playerIq45PendingEnhancedPunch = false
    playerIq45KickEnergy = 0
    playerIq45LastEnergyTickAt = this.time.now
    playerIq45StoneUsed = false
    playerIq45StoneUntil = 0
    playerIq45StoneHealTotal = 0
    playerDreamCandySupport = null
    playerDefeatTimeoutId = null
    playerMasteryHud = null
    playerMasteryIcon = null
    playerMasteryText = null
    playerMasteryGlow = null
    playerMasteryPulseRing = null
    playerMasteryOrbitParticles = []
    playerMasteryDimUntil = 0
    this.hpmState = this.createHpmState()
    this.alliedCompanions = []
    this.alliedZones = []
    playerInnateShieldCharges = this.battleConfig.player.baseAbilities?.shieldCharges || 0
    playerInnateShieldReduction = this.battleConfig.player.baseAbilities?.shieldReduction || 0
    playerEquipmentState = this.createPlayerEquipmentState()
    this.applyEquipmentBonuses(playerEquipmentState?.currentBonuses || {}, 'battle-start')

    this.recordEvent('battle-start', {
      playerId: this.battleConfig.player.id,
      enemyId: this.battleConfig.enemy.id,
      initialShieldCharges: playerShieldCharges,
      fatalGuardCharges: playerFatalGuardCharges,
      garlicForm: playerGarlicForm,
      equipmentName: this.battleConfig.player.equipment?.name || '未装备',
      equipmentEvolutionName: this.battleConfig.player.equipmentEvolution?.name || null,
      battleMode: this.battleConfig.level.battleMode || 'single'
    })
  }

  setUpEnemyWave() {
    const enemyConfigs = this.getEnemyConfigs()
    const startX = 600
    const spacing = 140

    this.enemies = enemyConfigs.map((enemyConfig, index) => (
      createEnemyState(
        this,
        enemyConfig.runtimeId || `${enemyConfig.id || 'enemy'}-${index + 1}`,
        startX + (index * spacing),
        800,
        enemyConfig
      )
    ))
  }

  setUpPlayerProjectiles() {
    playerProjectiles = this.physics.add.group({
      allowGravity: false,
      immovable: true
    })
  }

  setUpEnemyProjectiles() {
    enemyProjectiles = this.physics.add.group({
      allowGravity: false,
      immovable: true
    })
  }

  livingEnemies() {
    return this.enemies.filter((enemy) => enemy.life > 0 && enemy.sprite?.active)
  }

  getPrimaryEnemy() {
    const living = this.livingEnemies()
    if (!living.length) {
      return null
    }

    return living.slice().sort((a, b) => Math.abs(a.sprite.x - player.x) - Math.abs(b.sprite.x - player.x))[0]
  }

  getEnemyInRange(deltaX, deltaY, origin = player, preferredId = null) {
    const living = this.livingEnemies()
    if (!living.length) {
      return null
    }

    if (preferredId) {
      const preferred = living.find((enemy) => enemy.id === preferredId)
      if (
        preferred &&
        Math.abs(origin.x - preferred.sprite.x) < deltaX &&
        Math.abs(origin.y - preferred.sprite.y) <= deltaY
      ) {
        return preferred
      }
    }

    const candidates = living.filter((enemy) => (
      Math.abs(origin.x - enemy.sprite.x) < deltaX &&
      Math.abs(origin.y - enemy.sprite.y) <= deltaY
    ))

    if (!candidates.length) {
      return null
    }

    return candidates.sort((a, b) => Math.abs(origin.x - a.sprite.x) - Math.abs(origin.x - b.sprite.x))[0]
  }

  isPlayerInvisible() {
    return this.time.now < playerInvisibleUntil
  }

  isGarlicPlayer() {
    return this.battleConfig?.player?.id === 'garlic'
  }

  isWudiPlayer() {
    return this.battleConfig?.player?.id === 'wudi-xiaokeai'
  }

  isIQ45Player() {
    return this.battleConfig?.player?.id === 'iq45'
  }

  getGarlicConfig() {
    return this.battleConfig.player.abilities?.garlic || {}
  }

  getWudiConfig() {
    return this.battleConfig.player.abilities?.wudiXiaokeai || {}
  }

  getIQ45Config() {
    return this.battleConfig.player.abilities?.iq45 || {}
  }

  isHpmPlayer() {
    return this.battleConfig?.player?.id === 'hpm'
  }

  getHpmConfig() {
    return this.battleConfig.player.abilities?.hpm || {}
  }

  isDreamCatbugPlayer() {
    return this.battleConfig?.player?.id === 'dream-catbug'
  }

  getDreamCatbugConfig() {
    return this.battleConfig.player.abilities?.dreamCatbug || {}
  }

  healPlayer(healAmount, reason = 'heal', detail = {}, options = {}) {
    const normalizedHeal = roundToTenth(Math.max(0, Number(healAmount || 0)))
    const allowRevive = Boolean(options.allowRevive)
    if (!player?.active || normalizedHeal <= 0) {
      return 0
    }

    if (lifePlayer <= 0 && !allowRevive) {
      return 0
    }

    const lifeBeforeHeal = lifePlayer
    lifePlayer = roundToTenth(Math.min(maxLifePlayer, lifePlayer + normalizedHeal))
    const actualHeal = roundToTenth(lifePlayer - lifeBeforeHeal)

    if (actualHeal <= 0) {
      return 0
    }

    setPlayerValuebar(healthBarPlayer, this.toPercent(lifePlayer, maxLifePlayer))
    if (allowRevive && lifeBeforeHeal <= 0 && lifePlayer > 0 && goingToMoveFromScene) {
      goingToMoveFromScene = false
      if (playerDefeatTimeoutId) {
        window.clearTimeout(playerDefeatTimeoutId)
        playerDefeatTimeoutId = null
      }
    }
    this.recordEvent('player-heal', {
      reason,
      healAmount: actualHeal,
      playerLifeAfter: lifePlayer,
      ...detail
    })
    return actualHeal
  }

  getGabengArrowConfig(enemyState = this.battleConfig.enemy) {
    return enemyState?.abilities?.gabengArrow || this.battleConfig.enemy?.abilities?.gabengArrow || null
  }

  isGabengEnemy(enemyState) {
    return this.battleConfig.level.battleMode === 'gabeng-split' && Boolean(this.getGabengArrowConfig(enemyState))
  }

  createPlayerEquipmentState() {
    const baseEquipment = this.battleConfig.player.equipment || null
    const evolution = this.battleConfig.player.equipmentEvolution || null

    return {
      baseEquipment,
      evolution,
      isEvolved: false,
      totalDamageDealt: 0,
      threshold: 100,
      currentBonuses: { ...(baseEquipment?.bonuses || {}) }
    }
  }

  getBaseEquipmentBonuses() {
    return playerEquipmentState?.baseEquipment?.bonuses || {}
  }

  getCurrentEquipmentBonuses() {
    return playerEquipmentState?.currentBonuses || {}
  }

  getEquipmentBonusDelta(key) {
    return Number(this.getCurrentEquipmentBonuses()[key] || 0) - Number(this.getBaseEquipmentBonuses()[key] || 0)
  }

  applyEquipmentBonuses(bonuses, reason = 'equipment-update') {
    playerShieldCharges = Number(playerInnateShieldCharges || 0) + Number(bonuses.shieldCharges || 0)
    this.battleConfig.player.abilities = {
      ...(this.battleConfig.player.abilities || {}),
      shieldReduction: Math.max(Number(playerInnateShieldReduction || 0), Number(bonuses.shieldReduction || 0))
    }

    playerPersistentDamageReduction = Number(bonuses.persistentDamageReduction || 0)
    playerEquipmentPunchHealCharges = Number(bonuses.punchHealCharges || 0)
    playerEquipmentPunchHealRatio = Number(bonuses.punchHealRatio || 0)

    if (reason !== 'battle-start') {
      this.recordEvent('装备-效果更新', {
        reason,
        shieldCharges: playerShieldCharges,
        shieldReduction: this.battleConfig.player.abilities?.shieldReduction || 0,
        persistentDamageReduction: playerPersistentDamageReduction,
        punchHealCharges: playerEquipmentPunchHealCharges,
        punchHealRatio: playerEquipmentPunchHealRatio
      })
    }
  }

  setUpEquipmentAuraTimer() {
    playerEquipmentAuraTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.applyPlayerProximityAura,
      callbackScope: this
    })
  }

  getHostileTargetsNearPlayer(rangeX, rangeY) {
    return this.livingEnemies().filter((enemyState) => (
      Math.abs(enemyState.sprite.x - player.x) <= rangeX &&
      Math.abs(enemyState.sprite.y - player.y) <= rangeY
    ))
  }

  getHostileTargetsNearEnemy(originEnemy, rangeX, rangeY) {
    if (!originEnemy?.id) {
      return []
    }

    return this.livingEnemies().filter((enemyState) => (
      enemyState.id !== originEnemy.id &&
      Math.abs(enemyState.sprite.x - originEnemy.sprite.x) <= rangeX &&
      Math.abs(enemyState.sprite.y - originEnemy.sprite.y) <= rangeY
    ))
  }

  getNearestEnemies(count = 1, origin = player) {
    return this.livingEnemies()
      .slice()
      .sort((a, b) => Math.abs(a.sprite.x - origin.x) - Math.abs(b.sprite.x - origin.x))
      .slice(0, count)
  }

  getRepeatedNearestEnemies(count = 1, origin = player) {
    const nearest = this.getNearestEnemies(count, origin)
    if (!nearest.length) {
      return []
    }

    const repeated = []
    for (let index = 0; index < count; index += 1) {
      repeated.push(nearest[Math.min(index, nearest.length - 1)])
    }
    return repeated
  }

  createHpmState() {
    return {
      extraLife: 0,
      passivePunchLayers: 0,
      passiveKickLayers: 0,
      passiveShieldCharges: 0,
      auraShieldCharges: 0,
      lastSkillAt: -99999,
      nextDecayAt: 0,
      speedBoostUntil: 0,
      protectionCircle: null,
      summon: null
    }
  }

  createHpmNoteTexture() {
    if (this.textures.exists('hpm-note')) {
      if (this.textures.exists('hpm-summon-laser')) {
        return
      }
    } else {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false })
      graphics.fillStyle(0xfff0a8, 1)
      graphics.fillCircle(12, 12, 9)
      graphics.fillStyle(0xff9ec4, 1)
      graphics.fillRoundedRect(14, 4, 4, 14, 2)
      graphics.fillRoundedRect(18, 4, 4, 10, 2)
      graphics.generateTexture('hpm-note', 24, 24)
      graphics.destroy()
    }

    if (this.textures.exists('hpm-summon-laser')) {
      return
    }

    const laserGraphics = this.make.graphics({ x: 0, y: 0, add: false })
    laserGraphics.fillStyle(0x9af6ff, 1)
    laserGraphics.fillRoundedRect(0, 4, 54, 10, 5)
    laserGraphics.fillStyle(0xffffff, 0.95)
    laserGraphics.fillRoundedRect(6, 7, 42, 4, 2)
    laserGraphics.generateTexture('hpm-summon-laser', 54, 18)
    laserGraphics.destroy()
  }

  getDreamCatbugActor() {
    return getCharacterById('dream-catbug')
  }

  getAlliedCompanions() {
    return (this.alliedCompanions || []).filter((companion) => companion?.sprite?.active && companion.life > 0)
  }

  getAlliedTargets(includePlayer = true) {
    const allies = []
    if (includePlayer && player?.active && lifePlayer > 0) {
      allies.push({
        id: 'player',
        kind: 'player',
        sprite: player,
        getLife: () => lifePlayer,
        getMaxLife: () => maxLifePlayer
      })
    }

    this.getAlliedCompanions().forEach((companion) => {
      allies.push({
        id: companion.id,
        kind: 'companion',
        sprite: companion.sprite,
        companion
      })
    })

    return allies
  }

  getNearestAllyTarget(originSprite, includePlayer = true) {
    return this.getAlliedTargets(includePlayer)
      .slice()
      .sort((a, b) => (
        Phaser.Math.Distance.Between(originSprite.x, originSprite.y, a.sprite.x, a.sprite.y) -
        Phaser.Math.Distance.Between(originSprite.x, originSprite.y, b.sprite.x, b.sprite.y)
      ))[0] || null
  }

  applyDamageToAllyTarget(target, totalDamage, detail = {}) {
    if (!target || totalDamage <= 0) {
      return 0
    }

    if (target.kind === 'player') {
      const reducedDamage = this.getReducedPlayerDamage(totalDamage)
      lastDamageTaken = reducedDamage
      lifePlayer = roundToTenth(Math.max(0, lifePlayer - reducedDamage))
      setPlayerValuebar(healthBarPlayer, this.toPercent(lifePlayer, maxLifePlayer))
      this.recordEvent('damage-to-player', {
        targetId: 'player',
        totalDamage: reducedDamage,
        playerLifeAfter: lifePlayer,
        ...detail
      })
      return reducedDamage
    }

    const companion = target.companion
    if (!companion?.sprite?.active || companion.life <= 0) {
      return 0
    }

    let finalDamage = roundToTenth(totalDamage)
    if (Number(companion.auraShieldCharges || 0) > 0) {
      companion.auraShieldCharges -= 1
      finalDamage = roundToTenth(finalDamage * (1 - Number(this.getHpmConfig().auraShieldReduction || 0.3)))
    }

    companion.life = roundToTenth(Math.max(0, companion.life - finalDamage))
    lastDamageTaken = finalDamage
    this.recordEvent('damage-to-ally', {
      targetId: companion.id,
      totalDamage: finalDamage,
      allyLifeAfter: companion.life,
      ...detail
    })

    if (companion.life <= 0) {
      companion.sprite.destroy()
    }
    return finalDamage
  }

  getAlliesNear(originX, originY, radius, includePlayer = true) {
    return this.getAlliedTargets(includePlayer).filter((target) => (
      Phaser.Math.Distance.Between(originX, originY, target.sprite.x, target.sprite.y) <= radius
    ))
  }

  hpmProtectionCircleActive() {
    return Boolean(this.hpmState?.protectionCircle) && this.time.now < this.hpmState.protectionCircle.expiresAt
  }

  getHpmExtraLife() {
    return roundToTenth(this.hpmState?.extraLife || 0)
  }

  gainHpmExtraLife(amount, reason) {
    if (!this.isHpmPlayer()) {
      return
    }

    const config = this.getHpmConfig()
    const before = Number(this.hpmState.extraLife || 0)
    const cap = Number(config.extraLifeCap || 40)
    this.hpmState.extraLife = Math.min(cap, roundToTenth(before + Number(amount || 0)))
    this.hpmState.lastSkillAt = this.time.now
    this.hpmState.nextDecayAt = this.time.now + Number(config.extraLifeDecayDelayMs || 1000)

    const beforeLayers = Math.floor(before / 10)
    const afterLayers = Math.floor(this.hpmState.extraLife / 10)
    const gainedLayers = Math.max(0, afterLayers - beforeLayers)
    const maxLayers = Number(config.passiveMaxLayers || 4)

    if (gainedLayers > 0) {
      this.hpmState.passivePunchLayers = Math.min(maxLayers, this.hpmState.passivePunchLayers + gainedLayers)
      this.hpmState.passiveKickLayers = Math.min(maxLayers, this.hpmState.passiveKickLayers + gainedLayers)
      this.hpmState.passiveShieldCharges = Math.min(maxLayers, this.hpmState.passiveShieldCharges + gainedLayers)
    }

    this.recordEvent('hpm-extra-life-gained', {
      reason,
      amount: Number(amount || 0),
      extraLife: this.hpmState.extraLife,
      passivePunchLayers: this.hpmState.passivePunchLayers,
      passiveKickLayers: this.hpmState.passiveKickLayers,
      passiveShieldCharges: this.hpmState.passiveShieldCharges
    })
  }

  getHpmProtectionBonuses() {
    if (!this.isHpmPlayer() || !this.hpmProtectionCircleActive()) {
      return {
        punchBonus: 0,
        kickBonus: 0
      }
    }

    const circle = this.hpmState.protectionCircle
    const config = this.getHpmConfig()
    const inside = Phaser.Math.Distance.Between(player.x, player.y, circle.x, circle.y) <= Number(config.protectionCircleRadius || 155)
    return inside
      ? {
        punchBonus: Number(config.protectionCirclePunchBonus || 7),
        kickBonus: Number(config.protectionCircleKickBonus || 8)
      }
      : {
        punchBonus: 0,
        kickBonus: 0
      }
  }

  getPlayerJumpBoostRatio() {
    const perHit = Number(this.getCurrentEquipmentBonuses().jumpRetaliationBoostPerHit || 0)
    return roundToTenth(perHit * playerJumpBoostStacks)
  }

  applyPlayerProximityAura() {
    if (!player?.active || lifePlayer <= 0 || this.time.now < this.phaseTransitionUntil) {
      return
    }

    const bonuses = this.getCurrentEquipmentBonuses()
    const ratio = Number(bonuses.proximityPulseDamageRatio || 0)
    const rangeX = Number(bonuses.proximityPulseRange || 0)
    const rangeY = Number(bonuses.proximityPulseVerticalRange || 0)
    if (ratio <= 0 || rangeX <= 0 || rangeY <= 0) {
      return
    }

    const pulseDamage = roundToTenth(this.getPlayerPunchDamage() * ratio)
    if (pulseDamage <= 0) {
      return
    }

    this.getHostileTargetsNearPlayer(rangeX, rangeY).forEach((enemyState) => {
      this.applyFlatDamageToEnemy(enemyState, pulseDamage, 'equipment-proximity-pulse', {
        baseDamage: pulseDamage,
        skipSound: true,
        skipReward: true
      })
    })
  }

  triggerKickSplashFromHit(primaryTarget, primaryDamage) {
    const bonuses = this.getCurrentEquipmentBonuses()
    const ratio = Number(bonuses.kickSplashDamageRatio || 0)
    const rangeX = Number(bonuses.kickSplashRange || 0)
    const rangeY = Number(bonuses.kickSplashVerticalRange || 0)
    if (!primaryTarget || ratio <= 0 || rangeX <= 0 || rangeY <= 0) {
      return
    }

    const splashDamage = roundToTenth(primaryDamage * ratio)
    if (splashDamage <= 0) {
      return
    }

    this.getHostileTargetsNearEnemy(primaryTarget, rangeX, rangeY).forEach((enemyState) => {
      this.applyFlatDamageToEnemy(enemyState, splashDamage, 'equipment-kick-splash', {
        baseDamage: splashDamage,
        splashFrom: primaryTarget.id,
        skipSound: true,
        skipReward: true
      })
    })
  }

  maybeTriggerRetaliatoryStun(enemyState) {
    const bonuses = this.getCurrentEquipmentBonuses()
    const stunChance = Number(bonuses.retaliatoryStunChance || 0)
    const stunDurationMs = Number(bonuses.retaliatoryStunDurationMs || 0)
    if (!enemyState?.sprite?.active || stunChance <= 0 || stunDurationMs <= 0) {
      return
    }

    if (Math.random() >= stunChance) {
      return
    }

    this.controlEnemy(enemyState, stunDurationMs, 0, 0)
    this.recordEvent('equipment-retaliatory-stun', {
      enemyId: enemyState.id,
      stunDurationMs,
      stunChance
    })
  }

  registerJumpRetaliationBoost(enemyState) {
    const bonuses = this.getCurrentEquipmentBonuses()
    const perHit = Number(bonuses.jumpRetaliationBoostPerHit || 0)
    if (perHit <= 0) {
      return
    }

    playerJumpBoostStacks += 1
    playerJumpState.shockwavePending = true
    this.recordEvent('equipment-jump-boost', {
      enemyId: enemyState.id,
      jumpBoostStacks: playerJumpBoostStacks,
      jumpBoostRatio: this.getPlayerJumpBoostRatio()
    })
  }

  applyLandingShockwave(jumpHeight) {
    const bonuses = this.getCurrentEquipmentBonuses()
    const ratio = Number(bonuses.landingShockwaveHeightRatio || 0)
    const rangeX = Number(bonuses.landingShockwaveRange || 0)
    const rangeY = Number(bonuses.landingShockwaveVerticalRange || 0)
    if (ratio <= 0 || rangeX <= 0 || rangeY <= 0 || jumpHeight <= 0) {
      return
    }

    const damage = roundToTenth(jumpHeight * ratio)
    if (damage <= 0) {
      return
    }

    const targets = this.getHostileTargetsNearPlayer(rangeX, rangeY)
    targets.forEach((enemyState) => {
      this.applyFlatDamageToEnemy(enemyState, damage, 'equipment-landing-shockwave', {
        baseDamage: damage,
        jumpHeight: roundToTenth(jumpHeight),
        skipSound: true
      })
    })

    this.recordEvent('equipment-landing-shockwave', {
      jumpHeight: roundToTenth(jumpHeight),
      totalDamage: damage,
      hitTargets: targets.map((enemyState) => enemyState.id)
    })
  }

  applyShockwaveAroundEnemy(originEnemy, jumpHeight, ratio, rangeX, rangeY, attackType) {
    if (!originEnemy?.sprite?.active || jumpHeight <= 0 || ratio <= 0 || rangeX <= 0 || rangeY <= 0) {
      return
    }

    const damage = roundToTenth(jumpHeight * ratio)
    if (damage <= 0) {
      return
    }

    const targets = this.getHostileTargetsNearEnemy(originEnemy, rangeX, rangeY)
    targets.forEach((enemyState) => {
      this.applyFlatDamageToEnemy(enemyState, damage, attackType, {
        baseDamage: damage,
        jumpHeight: roundToTenth(jumpHeight),
        splashFrom: originEnemy.id,
        skipSound: true
      })
    })

    this.recordEvent(attackType, {
      jumpHeight: roundToTenth(jumpHeight),
      totalDamage: damage,
      splashFrom: originEnemy.id,
      hitTargets: targets.map((enemyState) => enemyState.id)
    })
  }

  maybeTriggerEquipmentEvolution() {
    if (!playerEquipmentState || playerEquipmentState.isEvolved || !playerEquipmentState.evolution) {
      return
    }

    if (playerEquipmentState.totalDamageDealt <= playerEquipmentState.threshold) {
      return
    }

    playerEquipmentState.isEvolved = true
    playerEquipmentState.currentBonuses = { ...(playerEquipmentState.evolution.bonuses || {}) }
    this.applyEquipmentBonuses(playerEquipmentState.currentBonuses, 'equipment-evolved')
    this.recordEvent('装备-自动进化', {
      threshold: playerEquipmentState.threshold,
      totalDamageDealt: roundToTenth(playerEquipmentState.totalDamageDealt),
      from: playerEquipmentState.baseEquipment?.name || '未装备',
      to: playerEquipmentState.evolution.name
    })
  }

  registerPlayerDamageDealt(totalDamage) {
    if (!playerEquipmentState) {
      return
    }

    playerEquipmentState.totalDamageDealt = roundToTenth(playerEquipmentState.totalDamageDealt + totalDamage)
    this.maybeTriggerEquipmentEvolution()
  }

  isGarlicTrueForm() {
    return this.isGarlicPlayer() && playerGarlicForm === 'true'
  }

  isGarlicSecondFakeForm() {
    return this.isGarlicPlayer() && playerGarlicForm === 'fake-2'
  }

  isGarlicTransitioning() {
    return this.isGarlicPlayer() && this.time.now < playerGarlicTransitionUntil
  }

  isWudiDeathDanceActive() {
    return this.isWudiPlayer() && this.time.now < playerWudiDeathDanceUntil
  }

  isIQ45StoneActive() {
    return this.isIQ45Player() && this.time.now < playerIq45StoneUntil
  }

  isPlayerUntargetable() {
    return this.isPlayerInvisible() || this.isGarlicTrueForm() || this.isGarlicTransitioning() || this.isWudiDeathDanceActive()
  }

  getPlayerUntargetableReason() {
    if (this.isWudiDeathDanceActive()) {
      return {
        reason: '亡崩死裂',
        remainingMs: Math.max(0, playerWudiDeathDanceUntil - this.time.now)
      }
    }

    if (this.isGarlicPlayer()) {
      return {
        reason: this.isGarlicTrueForm() ? '大蒜真身不可命中' : '大蒜切换期无敌',
        remainingMs: this.isGarlicTrueForm()
          ? Math.max(0, playerGarlicTrueFormUntil - this.time.now)
          : Math.max(0, playerGarlicTransitionUntil - this.time.now)
      }
    }

    return {
      reason: 'timed-invisibility',
      remainingMs: Math.max(0, playerInvisibleUntil - this.time.now)
    }
  }

  getPlayerMoveSpeed() {
    const baseSpeed = this.battleConfig.player.stats.moveSpeed
    const equipmentSpeedDelta = this.getEquipmentBonusDelta('moveSpeed')
    const hpmBonus = this.isHpmPlayer() && this.time.now < this.hpmState.speedBoostUntil
      ? Number(this.getHpmConfig().ultimateMoveSpeedBonus || 90)
      : 0
    if (!this.isGarlicTrueForm()) {
      return baseSpeed + equipmentSpeedDelta + hpmBonus
    }

    return baseSpeed + equipmentSpeedDelta + hpmBonus + (this.getGarlicConfig().trueFormMoveSpeedBonus || 0)
  }

  getDreamCatbugMarkState(target) {
    return target?.dreamCatbugMark || null
  }

  getDreamCatbugDamageMultiplier(target) {
    if (!this.isDreamCatbugPlayer()) {
      return 1
    }

    const markState = this.getDreamCatbugMarkState(target)
    return markState && this.time.now < markState.expiresAt
      ? Number(this.getDreamCatbugConfig().markedDamageMultiplier || 2)
      : 1
  }

  getDreamCatbugSlowMultiplier(target) {
    const markState = this.getDreamCatbugMarkState(target)
    if (!markState || this.time.now >= markState.expiresAt) {
      return 1
    }

    const elapsedMs = this.time.now - markState.appliedAt
    if (elapsedMs < 1000) {
      return 0.9
    }

    if (elapsedMs < 2000) {
      return 0.5
    }

    return 0
  }

  applyDreamCatbugMarkFromHit(target, totalDamage, attackType) {
    if (!this.isDreamCatbugPlayer() || !target) {
      return
    }

    const now = this.time.now
    const config = this.getDreamCatbugConfig()
    const activeMark = this.getDreamCatbugMarkState(target)

    if (activeMark && now < activeMark.expiresAt) {
      activeMark.accumulatedDamage = roundToTenth(activeMark.accumulatedDamage + totalDamage)
      activeMark.lastHitAt = now
      activeMark.lastAttackType = attackType
      return
    }

    target.dreamCatbugMark = {
      appliedAt: now,
      expiresAt: now + Number(config.markDurationMs || 3000),
      accumulatedDamage: roundToTenth(totalDamage),
      lastHitAt: now,
      lastAttackType: attackType
    }

    this.recordEvent('dream-catbug-mark-applied', {
      enemyId: target.id,
      attackType,
      expiresAtMs: target.dreamCatbugMark.expiresAt
    })
  }

  resolveDreamCatbugMark(target, reason = 'expired') {
    const markState = this.getDreamCatbugMarkState(target)
    if (!markState) {
      return
    }

    const config = this.getDreamCatbugConfig()
    const healCap = roundToTenth(maxLifePlayer * Number(config.markHealCapRatio || 0.25))
    const healAmount = Math.min(
      healCap,
      roundToTenth(Number(markState.accumulatedDamage || 0) * Number(config.markHealRatio || 0.35))
    )

    target.dreamCatbugMark = null
    const actualHeal = this.healPlayer(healAmount, 'dream-catbug-mark-expired', {
      enemyId: target.id,
      markReason: reason,
      markAccumulatedDamage: roundToTenth(markState.accumulatedDamage || 0)
    }, {
      allowRevive: true
    })

    this.recordEvent('dream-catbug-mark-ended', {
      enemyId: target.id,
      reason,
      markAccumulatedDamage: roundToTenth(markState.accumulatedDamage || 0),
      healAmount: actualHeal
    })
  }

  updateDreamCatbugState() {
    if (!this.isDreamCatbugPlayer()) {
      return
    }

    this.enemies.forEach((enemyState) => {
      const markState = this.getDreamCatbugMarkState(enemyState)
      if (!markState) {
        if (enemyState.sprite?.active && enemyState.sprite.isTinted) {
          enemyState.sprite.clearTint()
        }
        return
      }

      if (this.time.now >= markState.expiresAt) {
        this.resolveDreamCatbugMark(enemyState, enemyState.life <= 0 ? 'expired-after-defeat' : 'expired')
        if (enemyState.sprite?.active && enemyState.sprite.isTinted) {
          enemyState.sprite.clearTint()
        }
        return
      }

      if (!enemyState.sprite?.active) {
        return
      }

      const slowMultiplier = this.getDreamCatbugSlowMultiplier(enemyState)
      if (slowMultiplier <= 0) {
        enemyState.sprite.setTint(0xf8d66d)
      } else if (slowMultiplier <= 0.5) {
        enemyState.sprite.setTint(0xf09cf4)
      } else {
        enemyState.sprite.setTint(0x8dd6ff)
      }
    })

    this.updateDreamCandySupport()
  }

  clearDreamCandySupport() {
    if (!playerDreamCandySupport) {
      return
    }

    playerDreamCandySupport.circle?.destroy()
    playerDreamCandySupport.label?.destroy()
    playerDreamCandySupport = null
  }

  summonDreamCandySupport() {
    if (!this.isDreamCatbugPlayer()) {
      return
    }

    const config = this.getDreamCatbugConfig()
    const direction = player.flipX ? -1 : 1
    const x = player.x + direction * 56
    const y = player.y - 24

    const healRadius = Number(config.summonHealRadius || 169)
    const healAmount = Number(config.summonHealAmount || 11.7)
    const healIntervalMs = Number(config.summonHealIntervalMs || 520)
    const summonDurationMs = Number(config.summonDurationMs || 3900)

    if (playerDreamCandySupport) {
      playerDreamCandySupport.x = x
      playerDreamCandySupport.y = y
      playerDreamCandySupport.radius = healRadius
      playerDreamCandySupport.healAmount = healAmount
      playerDreamCandySupport.expiresAt = this.time.now + summonDurationMs
      playerDreamCandySupport.circle?.setPosition(x, y)
      playerDreamCandySupport.label?.setPosition(x, y - 26)
    } else {
      const circle = this.add.circle(x, y, 18, 0xf7a8d8, 0.9).setDepth(7)
      const label = this.add.text(x, y - 26, '想吃棒棒糖', {
        font: 'bold 12px Arial',
        fill: '#fff4fb'
      }).setOrigin(0.5).setDepth(7)

      playerDreamCandySupport = {
        x,
        y,
        radius: healRadius,
        healAmount,
        nextHealAt: this.time.now + healIntervalMs,
        expiresAt: this.time.now + summonDurationMs,
        circle,
        label
      }
    }

    this.recordEvent('dream-candy-summoned', {
      x: roundToTenth(x),
      y: roundToTenth(y),
      healRadius: playerDreamCandySupport.radius,
      healAmount: playerDreamCandySupport.healAmount,
      healIntervalMs,
      expiresAtMs: playerDreamCandySupport.expiresAt
    })
  }

  updateDreamCandySupport() {
    if (!playerDreamCandySupport) {
      return
    }

    if (this.time.now >= playerDreamCandySupport.expiresAt || lifePlayer <= 0) {
      this.recordEvent('dream-candy-ended', {
        reason: lifePlayer <= 0 ? 'player-defeated' : 'timeout'
      })
      this.clearDreamCandySupport()
      return
    }

    playerDreamCandySupport.circle?.setAlpha(0.65 + Math.sin(this.time.now / 130) * 0.18)

    if (this.time.now < playerDreamCandySupport.nextHealAt) {
      return
    }

    playerDreamCandySupport.nextHealAt = this.time.now + Number(this.getDreamCatbugConfig().summonHealIntervalMs || 520)

    if (Math.hypot(player.x - playerDreamCandySupport.x, player.y - playerDreamCandySupport.y) > playerDreamCandySupport.radius) {
      return
    }

    this.healPlayer(playerDreamCandySupport.healAmount, 'dream-candy-heal', {
      source: '想吃棒棒糖',
      healRadius: playerDreamCandySupport.radius
    })
  }

  getEnemyMoveSpeed(enemyState) {
    const baseSpeed = Number(enemyState?.stats?.moveSpeed || this.battleConfig.enemy.stats.moveSpeed || 0)
    return roundToTenth(baseSpeed * this.getDreamCatbugSlowMultiplier(enemyState))
  }

  getPlayerJumpHeightEstimate() {
    const jumpVelocity = roundToTenth((this.battleConfig.player.stats.jumpVelocity + this.getEquipmentBonusDelta('jumpVelocity')) * (1 + this.getPlayerJumpBoostRatio()))
    return roundToTenth(jumpVelocity * 0.42)
  }

  getIQ45PunchEnergyMax() {
    return Number(this.getIQ45Config().punchEnergyMax || 100)
  }

  getIQ45KickEnergyMax() {
    return Number(this.getIQ45Config().extendedKickEnergyMax || 100)
  }

  addIQ45PunchEnergy(amount, reason = 'energy-gain') {
    if (!this.isIQ45Player()) {
      return
    }

    const maxEnergy = this.getIQ45PunchEnergyMax()
    const previousEnergy = playerIq45PunchEnergy
    playerIq45PunchEnergy = Math.max(0, Math.min(maxEnergy, roundToTenth(playerIq45PunchEnergy + Number(amount || 0))))

    if (playerIq45PunchEnergy === previousEnergy) {
      return
    }

    const reachedFullFromBelow = previousEnergy < maxEnergy && playerIq45PunchEnergy >= maxEnergy
    const shouldLog = reason !== 'time-charge' || reachedFullFromBelow

    if (shouldLog) {
      this.recordEvent('iq45-energy-updated', {
        reason,
        currentEnergy: playerIq45PunchEnergy,
        maxEnergy
      })
    }
  }

  addIQ45KickEnergy(amount, reason = 'kick-energy-gain') {
    if (!this.isIQ45Player()) {
      return
    }

    const maxEnergy = this.getIQ45KickEnergyMax()
    const previousEnergy = playerIq45KickEnergy
    playerIq45KickEnergy = Math.max(0, Math.min(maxEnergy, roundToTenth(playerIq45KickEnergy + Number(amount || 0))))

    if (playerIq45KickEnergy === previousEnergy) {
      return
    }

    this.recordEvent('iq45-kick-energy-updated', {
      reason,
      currentEnergy: playerIq45KickEnergy,
      maxEnergy
    })
  }

  triggerIQ45StoneForm(reason = 'low-life-trigger') {
    if (!this.isIQ45Player() || playerIq45StoneUsed || lifePlayer <= 0) {
      return
    }

    playerIq45StoneUsed = true
    playerIq45StoneUntil = this.time.now + Number(this.getIQ45Config().stoneDurationMs || 2800)
    playerIq45StoneHealTotal = 0
    player.setVelocity(0, 0)
    justDownPlayer = false

    this.recordEvent('iq45-stone-started', {
      reason,
      currentLife: lifePlayer,
      maxLife: maxLifePlayer,
      remainingMs: Math.max(0, playerIq45StoneUntil - this.time.now)
    })
  }

  resolveIQ45StoneForm() {
    if (!this.isIQ45Player() || playerIq45StoneUntil <= 0) {
      return
    }

    const config = this.getIQ45Config()
    const totalHeal = roundToTenth(playerIq45StoneHealTotal)
    playerIq45StoneUntil = 0

    if (totalHeal < Number(config.stoneMinimumHealBonus || 45)) {
      const healBonus = Number(config.stoneMinimumHealBonus || 45)
      lifePlayer = roundToTenth(Math.min(maxLifePlayer, lifePlayer + healBonus))
      setPlayerValuebar(healthBarPlayer, this.toPercent(lifePlayer, maxLifePlayer))
      this.recordEvent('iq45-stone-bonus-heal', {
        healAmount: healBonus,
        playerLifeAfter: lifePlayer,
        accumulatedStoneHeal: totalHeal
      })
      return
    }

    const target = this.getPrimaryEnemy()
    if (!target) {
      return
    }

    this.applyFlatDamageToEnemy(target, Number(config.stoneBurstDamage || 45), 'iq45-stone-burst', {
      baseDamage: Number(config.stoneBurstDamage || 45),
      skipReward: true
    })
    this.recordEvent('iq45-stone-burst', {
      enemyId: target.id,
      totalDamage: Number(config.stoneBurstDamage || 45),
      accumulatedStoneHeal: totalHeal
    })
  }

  getPlayerStatusLabel() {
    if (this.isWudiDeathDanceActive()) {
      const remainingMs = Math.max(0, playerWudiDeathDanceUntil - this.time.now)
      return `无敌小可爱状态：亡崩死裂 ${this.formatNumber(remainingMs / 1000)} 秒`
    }

    if (this.isIQ45StoneActive()) {
      const remainingMs = Math.max(0, playerIq45StoneUntil - this.time.now)
      return `IQ45 状态：石像 ${this.formatNumber(remainingMs / 1000)} 秒 / 石像回血 ${this.formatNumber(playerIq45StoneHealTotal)} / 拳能 ${this.formatNumber(playerIq45PunchEnergy)} / 飞踢能 ${this.formatNumber(playerIq45KickEnergy)}`
    }

    if (this.time.now < playerControlUntil) {
      const remainingMs = Math.max(0, playerControlUntil - this.time.now)
      return `${this.battleConfig.player.name} 状态：${playerControlReason || '受控'} ${this.formatNumber(remainingMs / 1000)} 秒`
    }

    if (this.isGarlicPlayer()) {
      if (this.isGarlicTransitioning()) {
        return '大蒜状态：切换中（无敌）'
      }

      if (this.isGarlicTrueForm()) {
        const remainingMs = Math.max(0, playerGarlicTrueFormUntil - this.time.now)
        return `大蒜状态：真身 ${this.formatNumber(remainingMs / 1000)} 秒 / 护盾 ${playerGarlicShieldCharges}`
      }

      if (this.isGarlicSecondFakeForm()) {
        return `大蒜状态：第二次假身 / 护盾 ${playerGarlicShieldCharges}`
      }

      return '大蒜状态：第一次假身'
    }

    if (this.isPlayerInvisible()) {
      const remainingMs = Math.max(0, playerInvisibleUntil - this.time.now)
      return `${this.battleConfig.player.name} 状态：隐身 ${this.formatNumber(remainingMs / 1000)} 秒`
    }

    if (this.isIQ45Player()) {
      const maxPunchEnergy = this.getIQ45PunchEnergyMax()
      const maxKickEnergy = this.getIQ45KickEnergyMax()
      const punchReadyText = playerIq45PunchEnergy >= maxPunchEnergy ? '强化拳就绪' : '强化拳蓄能中'
      const kickReadyText = playerIq45KickEnergy >= maxKickEnergy ? '拉拽飞踢就绪' : '拉拽飞踢蓄能中'
      return `IQ45 状态：${punchReadyText} / 拳能 ${this.formatNumber(playerIq45PunchEnergy)} / ${this.formatNumber(maxPunchEnergy)} / ${kickReadyText} / 飞踢能 ${this.formatNumber(playerIq45KickEnergy)} / ${this.formatNumber(maxKickEnergy)}`
    }

    if (this.isDreamCatbugPlayer()) {
      const markedCount = this.enemies.filter((enemyState) => this.getDreamCatbugMarkState(enemyState) && this.time.now < enemyState.dreamCatbugMark.expiresAt).length
      const candyRemainingMs = playerDreamCandySupport ? Math.max(0, playerDreamCandySupport.expiresAt - this.time.now) : 0
      return `梦想猫虫状态：梦印 ${markedCount} / 糖灵 ${this.formatNumber(candyRemainingMs / 1000)} 秒`
    }

    if (this.isHpmPlayer()) {
      const remainingUltimate = Math.max(0, playerNextUltimateAt - this.time.now)
      return `hpm 状态：额外生命 ${this.formatNumber(this.getHpmExtraLife())} / 被动盾 ${this.hpmState.passiveShieldCharges} / 飞踢盾 ${this.hpmState.auraShieldCharges} / L ${this.formatNumber(remainingUltimate / 1000)} 秒`
    }

    return `${this.battleConfig.player.name} 状态：常态`
  }

  getGarlicFormLabel(form) {
    if (form === 'true') {
      return '真身'
    }
    if (form === 'fake-2') {
      return '第二次假身'
    }
    return '第一次假身'
  }

  triggerPlayerInvisibility(reason = 'timed-invisibility') {
    if (this.battleConfig.player.id !== 'yuzijiang') {
      return
    }

    const duration = this.battleConfig.player.abilities?.invisibilityDurationMs || 2800
    const cooldown = this.battleConfig.player.abilities?.invisibilityCooldownMs || 12000
    playerInvisibleUntil = this.time.now + duration
    playerNextInvisibilityAt = this.time.now + cooldown
    player.setAlpha(0.38)
    this.recordEvent('invisibility-started', {
      reason,
      invisibilityStarted: 1,
      invisibilityRemainingMs: duration
    })
  }

  enterGarlicForm(nextForm, reason) {
    if (!this.isGarlicPlayer()) {
      return
    }

    const config = this.getGarlicConfig()
    const transitionMs = config.transitionInvincibleMs || 900
    playerGarlicForm = nextForm
    playerGarlicTransitionUntil = this.time.now + transitionMs
    lifePlayer = maxLifePlayer
    setPlayerValuebar(healthBarPlayer, this.toPercent(lifePlayer, maxLifePlayer))
    this.stop(player)
    player.setVelocityY(0)
    justDownPlayer = false

    if (nextForm === 'true') {
      playerGarlicTrueFormUntil = this.time.now + (config.trueFormDurationMs || 6000)
      player.setAlpha(0.42)
    } else {
      playerGarlicTrueFormUntil = 0
      player.setAlpha(1)
    }

    this.recordEvent('大蒜-形态切换', {
      form: this.getGarlicFormLabel(nextForm),
      reason,
      transitionMs,
      shieldCharges: playerGarlicShieldCharges
    })
  }

  updatePlayerState() {
    this.updatePlayerJumpState()

    if (this.time.now >= playerControlUntil) {
      playerControlReason = null
    }

    if (this.isIQ45Player()) {
      const elapsedMs = Math.max(0, this.time.now - playerIq45LastEnergyTickAt)
      playerIq45LastEnergyTickAt = this.time.now

      if (elapsedMs > 0 && lifePlayer > 0) {
        const energyGain = (elapsedMs / 1000) * Number(this.getIQ45Config().punchEnergyPerSecond || 25)
        this.addIQ45PunchEnergy(energyGain, 'time-charge')
      }

      if (playerIq45StoneUntil > 0 && this.time.now >= playerIq45StoneUntil) {
        this.resolveIQ45StoneForm()
      }
    }

    if (this.battleConfig.player.id === 'yuzijiang') {
      if (this.time.now >= playerNextInvisibilityAt && this.time.now >= playerInvisibleUntil && lifePlayer > 0) {
        this.triggerPlayerInvisibility('timed-invisibility')
      }

      if (this.isPlayerInvisible()) {
        player.setAlpha(0.38)
      } else if (player.alpha !== 1 && !this.isGarlicTrueForm()) {
        player.setAlpha(1)
        this.recordEvent('invisibility-ended', {
          reason: 'timeout'
        })
      }
    }

    if (this.isGarlicTrueForm() && this.time.now >= playerGarlicTrueFormUntil) {
      this.enterGarlicForm('fake-2', '真身计时结束')
    }

    if (this.isGarlicPlayer()) {
      if (this.isGarlicTransitioning()) {
        player.setAlpha(0.6)
      } else if (this.isGarlicTrueForm()) {
        player.setAlpha(0.42)
      } else if (!this.isPlayerInvisible() && player.alpha !== 1) {
        player.setAlpha(1)
      }
    }

    if (this.isWudiPlayer() && !this.isWudiDeathDanceActive() && !this.isPlayerInvisible() && !this.isGarlicTrueForm() && player.alpha !== 1) {
      player.setAlpha(1)
    }

    if (this.isIQ45Player()) {
      if (this.isIQ45StoneActive()) {
        player.setTint(0x9e9e9e)
      } else if (player.isTinted) {
        player.clearTint()
      }
    }

    this.updateDreamCatbugState()

    if (playerStatusText) {
      playerStatusText.setText(this.getPlayerStatusLabel())
    }
  }

  updateHpmState() {
    if (!this.isHpmPlayer()) {
      return
    }

    const config = this.getHpmConfig()
    const decayDelayMs = Number(config.extraLifeDecayDelayMs || 1000)
    const decayIntervalMs = Number(config.extraLifeDecayIntervalMs || 500)
    const decayStep = Number(config.extraLifeDecayStep || 10)

    if (this.time.now >= this.hpmState.nextDecayAt && this.time.now - this.hpmState.lastSkillAt >= decayDelayMs && this.hpmState.extraLife > 0) {
      this.hpmState.extraLife = Math.max(0, roundToTenth(this.hpmState.extraLife - decayStep))
      this.hpmState.nextDecayAt = this.time.now + decayIntervalMs
      this.recordEvent('hpm-extra-life-decayed', {
        extraLife: this.hpmState.extraLife
      })
    }

    if (this.hpmState.protectionCircle && this.time.now >= this.hpmState.protectionCircle.expiresAt) {
      this.hpmState.protectionCircle.circle?.destroy()
      this.hpmState.protectionCircle.border?.destroy()
      this.hpmState.protectionCircle = null
      this.recordEvent('hpm-protection-circle-ended', {
        reason: 'timeout'
      })
    }

    if (this.hpmProtectionCircleActive()) {
      const circle = this.hpmState.protectionCircle
      circle.circle?.setAlpha(0.12 + Math.sin(this.time.now / 130) * 0.03)
      circle.border?.setAlpha(0.55 + Math.sin(this.time.now / 180) * 0.12)

      if (this.time.now >= circle.nextTickAt) {
        circle.nextTickAt = this.time.now + Number(config.protectionCircleTickMs || 1000)
        const healAmount = roundToTenth(this.getHpmExtraLife() * Number(config.protectionCircleHealRatio || 0.05))
        this.getAlliesNear(circle.x, circle.y, Number(config.protectionCircleRadius || 155)).forEach((ally) => {
          this.healAllyTarget(ally, healAmount, 'hpm-protection-circle')
        })
      }
    }

    if (this.time.now >= this.hpmState.speedBoostUntil && player.tintTopLeft === 0xc6fff4) {
      player.clearTint()
    } else if (this.time.now < this.hpmState.speedBoostUntil) {
      player.setTint(0xc6fff4)
    }
  }

  updateAlliedSupportUnits() {
    this.updateHpmSummon()
    this.updateAlliedZones()
  }

  updatePlayerJumpState() {
    if (!player?.body) {
      return
    }

    const grounded = Boolean(player.body.touching.down || player.body.blocked.down)

    if (!grounded) {
      if (!playerJumpState.airborne) {
        playerJumpState.airborne = true
        playerJumpState.startY = player.y
        playerJumpState.peakY = player.y
      } else {
        playerJumpState.peakY = Math.min(playerJumpState.peakY ?? player.y, player.y)
      }
      return
    }

    if (!playerJumpState.airborne) {
      return
    }

    const jumpHeight = Math.max(0, Number(playerJumpState.startY || 0) - Number(playerJumpState.peakY || player.y))
    const shouldShockwave = Boolean(playerJumpState.shockwavePending)

    playerJumpState = {
      airborne: false,
      startY: null,
      peakY: null,
      shockwavePending: false
    }

    if (shouldShockwave) {
      this.applyLandingShockwave(jumpHeight)
    }

  }

  updateSceneNavigation() {
    music.resume()

    if (lifePlayer <= 0 && !goingToMoveFromScene) {
      goingToMoveFromScene = true
      playerDefeatTimeoutId = window.setTimeout(() => {
        if (lifePlayer > 0) {
          goingToMoveFromScene = false
          playerDefeatTimeoutId = null
          return
        }
        music.stop()
        playerDefeatTimeoutId = null
        this.scene.start('LoseScene', {
          token: this.token,
          score1: scorePlayer,
          battleConfig: this.battleConfig,
          battleSummary: this.buildBattleSummary()
        })
      }, 1500)
      return
    }

    const splitPhaseTransitioning = this.splitTriggered && this.phase === 1 && this.time.now < this.phaseTransitionUntil

    if (!this.livingEnemies().length && !goingToMoveFromScene) {
      if (this.shouldTriggerSplitPhase()) {
        this.triggerSplitPhase()
        return
      }

      if (splitPhaseTransitioning) {
        return
      }

      goingToMoveFromScene = true
      window.setTimeout(() => {
        music.stop()
        this.scene.start('WinScene', {
          token: this.token,
          score1: scorePlayer,
          battleConfig: this.battleConfig,
          battleSummary: this.buildBattleSummary()
        })
      }, 1500)
      return
    }

    if (keyESC.isDown) {
      music.pause()
      this.scene.launch('PauseScene')
      this.scene.pause()
    }
  }

  shouldTriggerSplitPhase() {
    return this.battleConfig.level.battleMode === 'gabeng-split' && this.phase === 1 && !this.splitTriggered
  }

  triggerSplitPhase() {
    this.splitTriggered = true
    this.phaseTransitionUntil = this.time.now + 2200
    const originalEnemy = this.enemies[0]

    this.recordEvent('boss-phase-split', {
      level: this.battleConfig.level.id,
      enemyName: this.battleConfig.enemy.name
    })

    if (!this.phaseBanner) {
      this.phaseBanner = this.add.text(180, 250, this.battleConfig.level.splitAnimationText || 'BOSS 分裂！', {
        font: 'bold 30px Arial',
        fill: '#ffe082'
      }).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)
    } else {
      this.phaseBanner.setText(this.battleConfig.level.splitAnimationText || 'BOSS 分裂！').setVisible(true)
    }

    player.setVelocity(0, 0)

    if (originalEnemy?.sprite?.active) {
      originalEnemy.sprite.setVelocity(0, 0)
      this.tweens.add({
        targets: originalEnemy.sprite,
        scaleX: 2.5,
        scaleY: 2.5,
        alpha: 0.15,
        duration: 700,
        yoyo: true
      })
    }

    this.time.delayedCall(1100, () => {
      if (originalEnemy?.sprite?.active) {
        originalEnemy.sprite.destroy()
      }

      this.phase = 2
      const splitEnemyConfig = {
        stats: { ...this.battleConfig.enemy.stats },
        abilities: { ...(this.battleConfig.enemy.abilities || {}) },
        gabengArrowChanceOffset: Number(originalEnemy?.gabengArrowChanceOffset || 0)
      }
      this.enemies = [
        createEnemyState(this, 'gabeng-left', 530, 800, splitEnemyConfig),
        createEnemyState(this, 'gabeng-right', 670, 800, splitEnemyConfig)
      ]
      this.refreshEnemyUi()
      this.updatePhaseTexts()
    })

    this.time.delayedCall(2100, () => {
      if (this.phaseBanner) {
        this.phaseBanner.setVisible(false)
      }
    })
  }

  handlePlayerInput() {
    const now = this.time.now

    if (
      this.time.now < this.phaseTransitionUntil ||
      this.isGarlicTransitioning() ||
      this.isWudiDeathDanceActive() ||
      this.isIQ45StoneActive() ||
      now < playerControlUntil
    ) {
      this.doAnim(player, 'idle')
      this.stop(player)
      return
    }

    if (this.isHpmPlayer() && this.availableHitJustDown(keyUltimate) && now >= playerNextUltimateAt) {
      justDownPlayer = true
      playerNextUltimateAt = now + this.getPlayerUltimateCooldown()
      this.executeHpmUltimate()
    } else if (this.availableHitJustDown(keyKick) && now >= playerNextKickAt) {
      justDownPlayer = true
      playerNextKickAt = now + this.getPlayerAttackCooldown('kick')
      this.doAnim(player, 'jumpkick')
      this.stopIfWalking(player)
      this.setPlayerJumpkickTimeout()
    } else if (this.availableHitJustDown(keyPunch) && now >= playerNextPunchAt) {
      justDownPlayer = true
      playerNextPunchAt = now + this.getPlayerAttackCooldown('punch')
      this.doAnim(player, 'punch')
      this.stopIfWalking(player)
      this.setPlayerPunchTimeout()
    } else if (this.availableJumpIsDown(keyW)) {
      this.jump(player)
    } else if (this.availableSideIsDown(keyA)) {
      this.doAnim(player, 'walk')
      this.moveLeft(player)
    } else if (this.availableSideIsDown(keyD)) {
      this.doAnim(player, 'walk')
      this.moveRight(player)
    } else if (this.livingEnemies().length && lifePlayer > 0 && !justDownPlayer) {
      this.doAnim(player, 'idle')
      this.stop(player)
    }
  }

  getEnemiesInDirectionalRange(rangeX, rangeY, origin = player) {
    const direction = origin.flipX ? -1 : 1
    return this.livingEnemies()
      .filter((enemyState) => {
        const deltaX = enemyState.sprite.x - origin.x
        const deltaY = Math.abs(enemyState.sprite.y - origin.y)
        return deltaY <= rangeY && deltaX * direction >= 0 && Math.abs(deltaX) <= rangeX
      })
      .sort((a, b) => Math.abs(a.sprite.x - origin.x) - Math.abs(b.sprite.x - origin.x))
  }

  controlEnemy(enemyState, durationMs, knockbackX = 0, knockbackY = 0) {
    if (!enemyState?.sprite?.active || enemyState.life <= 0) {
      return
    }

    enemyState.justDown = false
    enemyState.hitPlayer = false
    enemyState.actionLockUntil = Math.max(enemyState.actionLockUntil, this.time.now + durationMs)
    enemyState.nextDecisionAt = Math.max(enemyState.nextDecisionAt, this.time.now + durationMs)
    enemyState.repositionUntil = Math.max(enemyState.repositionUntil, this.time.now + Math.max(160, durationMs * 0.35))
    enemyState.sprite.setVelocity(knockbackX, knockbackY)
    this.doAnim(enemyState.sprite, 'idle2')
  }

  controlPlayer(durationMs, knockbackX = 0, knockbackY = 0, reason = '受控') {
    if (!player?.active || lifePlayer <= 0) {
      return
    }

    justDownPlayer = false
    playerControlUntil = Math.max(playerControlUntil, this.time.now + durationMs)
    playerControlReason = reason
    this.dimPlayerMasteryHud(Math.max(220, durationMs * 0.45))
    player.setVelocity(knockbackX, knockbackY)
    this.doAnim(player, 'idle')
  }

  getGabengArrowChance(enemyState) {
    const config = this.getGabengArrowConfig(enemyState)
    if (!config) {
      return 0
    }

    const baseChance = Number(config.baseChance || 0)
    const maxBonus = Number(config.maxChanceBonus || 0)
    const maxPenalty = Number(config.maxChancePenalty || 0)
    const clampedOffset = Math.max(-maxPenalty, Math.min(maxBonus, Number(enemyState?.gabengArrowChanceOffset || 0)))
    return Math.max(0, Math.min(1, roundToTenth(baseChance + clampedOffset)))
  }

  adjustGabengArrowChance(enemyState, delta, reason) {
    const config = this.getGabengArrowConfig(enemyState)
    if (!config || !enemyState) {
      return
    }

    const nextOffset = Number(enemyState.gabengArrowChanceOffset || 0) + Number(delta || 0)
    enemyState.gabengArrowChanceOffset = roundToTenth(
      Math.max(-Number(config.maxChancePenalty || 0), Math.min(Number(config.maxChanceBonus || 0), nextOffset))
    )

    this.recordEvent('gabeng-arrow-rate-updated', {
      enemyId: enemyState.id,
      reason,
      arrowChance: this.getGabengArrowChance(enemyState)
    })
  }

  applyFlatDamageToEnemy(target, totalDamage, attackType, detail = {}) {
    if (!target?.sprite?.active || target.life <= 0) {
      return false
    }

    const damageMultiplier = this.getDreamCatbugDamageMultiplier(target)
    const normalizedDamage = roundToTenth(totalDamage * damageMultiplier)
    target.life = roundToTenth(Math.max(0, target.life - normalizedDamage))
    lastDamageDealt = normalizedDamage
    this.refreshEnemyUi()
    scorePlayer = roundToTenth(scorePlayer + normalizedDamage)
    if (scoreTextPlayer) { scoreTextPlayer.setText(`分数 ${this.formatNumber(scorePlayer)}`) }
    if (!detail.skipSound) {
      this.playAttackSound(attackType)
    }
    if (!detail.skipReward) {
      this.handlePlayerHitReward(attackType, normalizedDamage)
    }
    this.applyDreamCatbugMarkFromHit(target, normalizedDamage, attackType)
    this.registerPlayerDamageDealt(normalizedDamage)
    this.recordEvent('damage-to-enemy', {
      attackType,
      totalDamage: normalizedDamage,
      enemyId: target.id,
      enemyLifeAfter: target.life,
      dreamCatbugAmplified: damageMultiplier > 1,
      ...detail
    })
    this.handleEnemyDefeat(target)
    return true
  }

  executeGarlicFakePunch() {
    const config = this.getGarlicConfig()
    const direction = player.flipX ? -1 : 1
    const target = this.getEnemyInRange(118, 92, player)
    if (!target) {
      return
    }

    const connected = this.applyFlatDamageToEnemy(target, config.fakePunchDamage || 35, '大蒜-假身J', {
      baseDamage: config.fakePunchDamage || 35
    })
    if (!connected) {
      return
    }

    this.controlEnemy(target, config.fakePunchControlMs || 500, direction * (config.fakePunchKnockbackX || 240), -120)
  }

  executeGarlicFakeKick() {
    const config = this.getGarlicConfig()
    const direction = player.flipX ? -1 : 1
    const targets = this.getEnemiesInDirectionalRange(config.fakeKickRange || 180, config.fakeKickVerticalRange || 150)
    targets.forEach((enemyState) => {
      const connected = this.applyFlatDamageToEnemy(enemyState, config.fakeKickDamage || 45, '大蒜-假身K', {
        baseDamage: config.fakeKickDamage || 45
      })
      if (connected) {
        this.controlEnemy(enemyState, config.fakeKickControlMs || 750, direction * (config.fakeKickKnockbackX || 320), -150)
      }
    })
  }

  executeGarlicTruePunch() {
    const config = this.getGarlicConfig()
    const direction = player.flipX ? -1 : 1
    playerGarlicShieldCharges += 1
    player.setVelocityX(direction * (config.truePunchDashSpeed || 420))
    window.setTimeout(() => {
      if (!player?.active || lifePlayer <= 0) {
        return
      }
      const targets = this.getEnemiesInDirectionalRange(config.truePunchRange || 210, 112)
      const hitTargets = []
      targets.forEach((enemyState) => {
        const connected = this.applyFlatDamageToEnemy(enemyState, config.truePunchDamage || 82, '大蒜-真身J', {
          baseDamage: config.truePunchDamage || 82
        })
        if (connected) {
          hitTargets.push(enemyState.id)
          this.controlEnemy(
            enemyState,
            config.truePunchControlMs || 1000,
            direction * (config.truePunchKnockbackX || 420),
            config.truePunchKnockbackY || -220
          )
        }
      })
      this.recordEvent('大蒜-真身J结算', {
        hitTargets,
        shieldCharges: playerGarlicShieldCharges
      })
    }, 110)
    window.setTimeout(() => {
      if (player?.active) {
        this.stop(player)
      }
    }, config.truePunchDashDurationMs || 180)
  }

  executeGarlicTrueKick() {
    const config = this.getGarlicConfig()
    const target = this.getPrimaryEnemy()
    if (!target) {
      return
    }

    justDownPlayer = true
    this.stop(player)
    this.controlEnemy(target, config.trueKickLockMs || 1400, 0, config.trueKickKnockbackY || -360)
    player.setVelocityY(-260)
    window.setTimeout(() => {
      if (!target?.sprite?.active || target.life <= 0 || lifePlayer <= 0) {
        return
      }
      player.x = target.sprite.x
      this.applyFlatDamageToEnemy(target, config.trueKickDamage || 168, '大蒜-真身K', {
        baseDamage: config.trueKickDamage || 168
      })
      target.sprite.setVelocityX((player.flipX ? -1 : 1) * (config.trueKickKnockbackX || 120))
    }, config.trueKickTakeoffDelayMs || 280)
    window.setTimeout(() => {
      if (lifePlayer > 0) {
        this.enterGarlicForm('fake-2', '真身K结束后回到第二次假身')
      }
      justDownPlayer = false
    }, config.trueKickRecoverToFakeDelayMs || 520)
  }

  healAllyTarget(target, amount, reason) {
    const normalizedAmount = roundToTenth(Math.max(0, Number(amount || 0)))
    if (!target || normalizedAmount <= 0) {
      return 0
    }

    if (target.kind === 'player') {
      return this.healPlayer(normalizedAmount, reason, {
        targetId: 'player'
      })
    }

    const companion = target.companion
    if (!companion?.sprite?.active || companion.life <= 0) {
      return 0
    }

    const before = companion.life
    companion.life = roundToTenth(Math.min(companion.maxLife, companion.life + normalizedAmount))
    const actualHeal = roundToTenth(companion.life - before)
    if (actualHeal > 0) {
      this.recordEvent('ally-heal', {
        reason,
        targetId: companion.id,
        healAmount: actualHeal,
        allyLifeAfter: companion.life
      })
    }
    return actualHeal
  }

  reduceHpmUltimateCooldown() {
    if (!this.isHpmPlayer()) {
      return
    }

    const now = this.time.now
    const remaining = Math.max(0, playerNextUltimateAt - now)
    playerNextUltimateAt = now + remaining * 0.5
  }

  executeHpmPunch() {
    const config = this.getHpmConfig()
    this.gainHpmExtraLife(Number(config.punchGainExtraLife || 10), 'punch-cast')

    const target = this.getEnemyInRange(124, 96, player)
    if (target) {
      const totalDamage = roundToTenth(Number(config.punchDamageBase || 50) + this.getPlayerPunchDamage() * Number(config.punchDamageRatio || 0.15))
      const connected = this.applyFlatDamageToEnemy(target, totalDamage, 'hpm-punch', {
        baseDamage: totalDamage
      })
      if (connected) {
        const direction = player.flipX ? -1 : 1
        target.sprite.setVelocity(direction * Number(config.punchKnockbackX || 280), -80)
      }
    }

    const selfHeal = roundToTenth(Number(config.punchSelfHealBase || 75) + this.getHpmExtraLife() * Number(config.punchSelfHealExtraLifeRatio || 0.1))
    this.healPlayer(selfHeal, 'hpm-punch-self-heal', {
      extraLife: this.getHpmExtraLife()
    })
    this.reduceHpmUltimateCooldown()

    const allyHeal = roundToTenth(this.getHpmExtraLife() * Number(config.punchAllyHealRatio || 0.2))
    this.getAlliesNear(player.x, player.y, Number(config.punchAllyHealRadius || 170), false).forEach((ally) => {
      this.healAllyTarget(ally, allyHeal, 'hpm-punch-ally-heal')
    })
  }

  createHpmProtectionCircle() {
    const config = this.getHpmConfig()
    const radius = Number(config.protectionCircleRadius || 155)
    const circle = this.add.circle(player.x, player.y, radius, 0x72f3db, 0.12).setDepth(5)
    const border = this.add.circle(player.x, player.y, radius, 0x72f3db, 0).setStrokeStyle(3, 0xd9fff7, 0.7).setDepth(6)
    this.hpmState.protectionCircle = {
      x: player.x,
      y: player.y,
      radius,
      circle,
      border,
      nextTickAt: this.time.now + Number(config.protectionCircleTickMs || 1000),
      expiresAt: this.time.now + Number(config.protectionCircleDurationMs || 4000)
    }

    this.getHostileTargetsNearPlayer(radius, radius).forEach((enemyState) => {
      const direction = enemyState.sprite.x >= player.x ? 1 : -1
      enemyState.sprite.setVelocity(direction * Number(config.protectionCircleKnockbackX || 260), -80)
    })

    this.recordEvent('hpm-protection-circle-created', {
      radius,
      durationMs: Number(config.protectionCircleDurationMs || 4000)
    })
  }

  executeHpmKick() {
    const config = this.getHpmConfig()
    this.gainHpmExtraLife(Number(config.kickGainExtraLife || 20), 'kick-cast')

    const target = this.getEnemyInRange(124 + this.getPlayerKickRangeBonus(), 138, player)
    if (target) {
      this.applyDamageToEnemy(target, this.getPlayerKickDamage(), 'kick')
    }

    if (!this.hpmProtectionCircleActive()) {
      this.createHpmProtectionCircle()
      return
    }

    const allies = this.getAlliesNear(player.x, player.y, Number(config.auraShieldGrantRadius || 185))
    const maxCharges = Number(config.auraShieldMaxCharges || 4)
    allies.forEach((ally) => {
      if (ally.kind === 'player') {
        this.hpmState.auraShieldCharges = Math.min(maxCharges, this.hpmState.auraShieldCharges + 1)
      } else if (ally.companion) {
        ally.companion.auraShieldCharges = Math.min(maxCharges, Number(ally.companion.auraShieldCharges || 0) + 1)
      }
    })

    this.recordEvent('hpm-aura-shield-granted', {
      playerAuraShieldCharges: this.hpmState.auraShieldCharges,
      allyCount: allies.length
    })
  }

  spawnHpmNoteProjectile(index) {
    const config = this.getHpmConfig()
    const direction = player.flipX ? -1 : 1
    const projectile = playerProjectiles.create(player.x + direction * 28, player.y - 26, 'hpm-note')
    projectile.setDepth(8)
    projectile.setCollideWorldBounds(true)
    projectile.setBounce(1, 1)
    projectile.body.setAllowGravity(false)
    projectile.body.onWorldBounds = true
    projectile.setVelocity(direction * Number(config.noteSpeed || 430), Math.sin(index * 0.75) * 110)
    projectile.displayWidth = Number(config.noteDisplayWidth || 24)
    projectile.displayHeight = Number(config.noteDisplayHeight || 24)
    projectile.projectileKind = 'hpm-note'
    projectile.spawnedAt = this.time.now
  }

  summonHpmDreamCatbug() {
    const config = this.getHpmConfig()
    const actor = this.getDreamCatbugActor()
    const actorDreamConfig = actor?.abilities?.dreamCatbug || {}
    const existing = this.getAlliedCompanions().find((companion) => companion.type === 'hpm-dream-catbug')
    if (existing) {
      existing.life = existing.maxLife
      existing.expiresAt = this.time.now + Number(config.summonDurationMs || 25000)
      return
    }

    const sprite = this.physics.add.sprite(
      player.x + (player.flipX ? -1 : 1) * Number(config.summonSpawnOffsetX || 56),
      player.y - 12,
      'brawler2'
    )
    sprite.setSize(playerWidth, playerHeight)
    sprite.setOffset(15, 5)
    sprite.scaleX = 1.7
    sprite.scaleY = 1.7
    sprite.setDepth(7)
    sprite.setCollideWorldBounds(true)
    sprite.setBounce(0, 0)
    sprite.body.setAllowGravity(true)
    this.physics.add.collider(sprite, platforms)
    this.doAnim(sprite, 'idle2')
    sprite.setTint(0x9ef0ff)

    this.alliedCompanions.push({
      id: 'hpm-dream-catbug',
      type: 'hpm-dream-catbug',
      actor,
      sprite,
      life: Number(actor?.stats?.health || config.summonHealth || 550),
      maxLife: Number(actor?.stats?.health || config.summonHealth || 550),
      stats: { ...(actor?.stats || {}) },
      abilities: {
        ...(actor?.abilities || {}),
        dreamCatbug: { ...actorDreamConfig }
      },
      attackCooldowns: {
        ...(actor?.attackCooldowns || { punchMs: 390, kickMs: 450 })
      },
      nextPunchAt: 0,
      nextKickAt: 0,
      nextDecisionAt: 0,
      actionLockUntil: this.time.now + 400,
      nextZoneAt: 0,
      auraShieldCharges: 0,
      expiresAt: this.time.now + Number(config.summonDurationMs || 25000)
    })

    this.recordEvent('hpm-summon-created', {
      targetId: 'hpm-dream-catbug',
      durationMs: Number(config.summonDurationMs || 25000),
      inheritedCharacter: actor?.name || '梦想猫虫'
    })
  }

  executeHpmUltimate() {
    const config = this.getHpmConfig()
    this.gainHpmExtraLife(Number(config.ultimateGainExtraLife || 10), 'ultimate-cast')
    this.hpmState.speedBoostUntil = this.time.now + Number(config.ultimateSpeedDurationMs || 4000)
    this.summonHpmDreamCatbug()
    for (let index = 0; index < Number(config.noteCount || 6); index += 1) {
      window.setTimeout(() => {
        if (player?.active && lifePlayer > 0) {
          this.spawnHpmNoteProjectile(index)
        }
      }, index * Number(config.noteIntervalMs || 120))
    }
    window.setTimeout(() => {
      justDownPlayer = false
    }, Math.max(360, Number(config.noteCount || 6) * Number(config.noteIntervalMs || 120)))
  }

  executeWudiPunch() {
    const config = this.getWudiConfig()
    const direction = player.flipX ? -1 : 1
    const startX = player.x
    const startY = player.y
    const dashDuration = config.punchDashDurationMs || 260
    const dashDistance = roundToTenth((config.punchDashSpeed || 540) * (dashDuration / 1000))
    const endX = startX + direction * dashDistance

    player.setVelocityX(direction * (config.punchDashSpeed || 540))
    window.setTimeout(() => {
      if (!player?.active || lifePlayer <= 0) {
        return
      }

      player.x = endX
      this.stop(player)
      const minX = Math.min(startX, endX) - 24
      const maxX = Math.max(startX, endX) + 24
      const verticalRange = config.punchPathVerticalRange || 140
      const bonusDamage = roundToTenth(this.getPlayerPunchDamage() * (config.punchBonusRatio || 0.1))
      const totalDamage = roundToTenth(this.getPlayerPunchDamage() + bonusDamage)
      const hitTargets = this.livingEnemies().filter((enemyState) => (
        enemyState.sprite.x >= minX &&
        enemyState.sprite.x <= maxX &&
        Math.abs(enemyState.sprite.y - startY) <= verticalRange
      ))

      hitTargets.forEach((enemyState) => {
        const connected = this.applyFlatDamageToEnemy(enemyState, totalDamage, 'wudi-punch-dash', {
          baseDamage: this.getPlayerPunchDamage(),
          bonusDamage,
          pathStartX: roundToTenth(startX),
          pathEndX: roundToTenth(endX)
        })
        if (connected) {
          this.controlEnemy(enemyState, config.punchControlMs || 500, 0, config.punchControlKnockbackY || -220)
        }
      })

      this.recordEvent('wudi-punch-finished', {
        hitTargets: hitTargets.map((enemyState) => enemyState.id),
        pathStartX: roundToTenth(startX),
        pathEndX: roundToTenth(endX)
      })
    }, dashDuration)
  }

  executeWudiKick() {
    const config = this.getWudiConfig()
    const target = this.getPrimaryEnemy()
    if (!target) {
      justDownPlayer = false
      return
    }

    const jumpHeight = this.getPlayerJumpHeightEstimate()
    const bonusDamage = roundToTenth(this.getPlayerKickDamage() * (config.kickBonusRatio || 0.1))
    const totalDamage = roundToTenth(this.getPlayerKickDamage() + bonusDamage)
    justDownPlayer = true
    this.stop(player)
    player.setVelocityY(-(config.kickTakeoffVelocity || 300))

    window.setTimeout(() => {
      if (!target?.sprite?.active || target.life <= 0 || lifePlayer <= 0) {
        return
      }

      player.x = target.sprite.x
      const connected = this.applyFlatDamageToEnemy(target, totalDamage, 'wudi-kick-lock', {
        baseDamage: this.getPlayerKickDamage(),
        bonusDamage,
        jumpHeight
      })
      if (connected) {
        this.applyShockwaveAroundEnemy(
          target,
          jumpHeight,
          config.kickShockwaveHeightRatio || 0.1,
          config.kickShockwaveRange || 128,
          config.kickShockwaveVerticalRange || 128,
          'wudi-kick-shockwave'
        )
      }
    }, config.kickTravelDelayMs || 240)

    window.setTimeout(() => {
      justDownPlayer = false
    }, config.kickRecoverDelayMs || 520)
  }

  executeWudiDeathDance() {
    const config = this.getWudiConfig()
    const targets = this.getRepeatedNearestEnemies(config.deathDanceLockCount || 3)
    if (!targets.length) {
      return
    }

    const totalDuration = config.deathDanceTotalDurationMs || 1800
    playerWudiDeathDanceUntil = this.time.now + totalDuration
    justDownPlayer = true
    this.stop(player)
    player.setAlpha(0.48)
    this.recordEvent('wudi-death-dance-start', {
      hitTargets: targets.map((enemyState) => enemyState.id),
      remainingFatalGuardCharges: playerFatalGuardCharges
    })

    targets.forEach((target, index) => {
      window.setTimeout(() => {
        const resolvedTarget = target?.sprite?.active && target.life > 0 ? target : this.getPrimaryEnemy()
        if (!resolvedTarget?.sprite?.active || lifePlayer <= 0) {
          return
        }

        const jumpHeight = this.getPlayerJumpHeightEstimate()
        const bonusDamage = roundToTenth(this.getPlayerPunchDamage() * (config.punchBonusRatio || 0.1))
        const totalDamage = roundToTenth(this.getPlayerPunchDamage() + bonusDamage)
        player.x = resolvedTarget.sprite.x
        player.setVelocityY(-(config.kickTakeoffVelocity || 300))
        const connected = this.applyFlatDamageToEnemy(resolvedTarget, totalDamage, 'wudi-death-dance-punch', {
          baseDamage: this.getPlayerPunchDamage(),
          bonusDamage,
          jumpHeight,
          hitIndex: index + 1
        })
        if (connected) {
          this.controlEnemy(resolvedTarget, config.punchControlMs || 500, 0, config.punchControlKnockbackY || -220)
          this.applyShockwaveAroundEnemy(
            resolvedTarget,
            jumpHeight,
            config.deathDanceShockwaveHeightRatio || 0.1,
            config.deathDanceShockwaveRange || 132,
            config.deathDanceShockwaveVerticalRange || 132,
            'wudi-death-dance-shockwave'
          )
        }
      }, (config.deathDanceStartDelayMs || 120) + index * (config.deathDanceJumpIntervalMs || 420))
    })

    window.setTimeout(() => {
      playerWudiDeathDanceUntil = 0
      justDownPlayer = false
      if (player?.active && !this.isPlayerInvisible() && !this.isGarlicTrueForm()) {
        player.setAlpha(1)
      }
      this.recordEvent('wudi-death-dance-ended', {
        playerLifeAfter: lifePlayer
      })
    }, totalDuration)
  }

  createAlliedZone({ x, y, radius, amount, intervalMs, durationMs, source, ownerId }) {
    const circle = this.add.circle(x, y, 18, 0xf7a8d8, 0.75).setDepth(6)
    this.alliedZones.push({
      x,
      y,
      radius,
      amount,
      intervalMs,
      nextTickAt: this.time.now + intervalMs,
      expiresAt: this.time.now + durationMs,
      source,
      ownerId,
      circle
    })
  }

  updateAlliedZones() {
    this.alliedZones = (this.alliedZones || []).filter((zone) => {
      if (!zone?.circle?.active || this.time.now >= zone.expiresAt) {
        zone?.circle?.destroy()
        return false
      }

      zone.circle.setAlpha(0.5 + Math.sin(this.time.now / 150) * 0.18)
      if (this.time.now < zone.nextTickAt) {
        return true
      }

      zone.nextTickAt = this.time.now + zone.intervalMs
      this.getAlliesNear(zone.x, zone.y, zone.radius).forEach((ally) => {
        this.healAllyTarget(ally, zone.amount, zone.source)
      })
      return true
    })
  }

  getCompanionMarkState(target) {
    return target?.hpmDreamMark || null
  }

  getCompanionMarkedDamageMultiplier(target) {
    const markState = this.getCompanionMarkState(target)
    if (!markState || this.time.now >= markState.expiresAt) {
      return 1
    }
    return Number(this.getHpmConfig().summonMarkedDamageMultiplier || 2)
  }

  applyCompanionMark(target, totalDamage) {
    const companion = this.getAlliedCompanions().find((ally) => ally.id === 'hpm-dream-catbug')
    const config = companion?.abilities?.dreamCatbug || this.getHpmConfig()
    const active = this.getCompanionMarkState(target)
    if (active && this.time.now < active.expiresAt) {
      active.accumulatedDamage = roundToTenth(active.accumulatedDamage + totalDamage)
      return
    }

    target.hpmDreamMark = {
      appliedAt: this.time.now,
      expiresAt: this.time.now + Number(config.summonMarkDurationMs || 3000),
      accumulatedDamage: roundToTenth(totalDamage)
    }
  }

  resolveCompanionMark(target, companion) {
    const markState = this.getCompanionMarkState(target)
    if (!markState) {
      return
    }

    const config = companion?.abilities?.dreamCatbug || this.getHpmConfig()
    const healCap = roundToTenth(companion.maxLife * Number(config.summonMarkHealCapRatio || 0.25))
    const healAmount = Math.min(
      healCap,
      roundToTenth(Number(markState.accumulatedDamage || 0) * Number(config.summonMarkHealRatio || 0.35))
    )
    target.hpmDreamMark = null
    companion.life = roundToTenth(Math.min(companion.maxLife, companion.life + healAmount))
  }

  applyCompanionDamageToEnemy(companion, target, totalDamage, attackType) {
    if (!companion?.sprite?.active || !target?.sprite?.active || target.life <= 0) {
      return false
    }

    const normalizedDamage = roundToTenth(totalDamage * this.getCompanionMarkedDamageMultiplier(target))
    target.life = roundToTenth(Math.max(0, target.life - normalizedDamage))
    lastDamageDealt = normalizedDamage
    scorePlayer = roundToTenth(scorePlayer + normalizedDamage)
    this.refreshEnemyUi()
    this.applyCompanionMark(target, normalizedDamage)
    this.recordEvent('hpm-summon-damage', {
      attackType,
      enemyId: target.id,
      totalDamage: normalizedDamage,
      enemyLifeAfter: target.life
    })
    this.handleEnemyDefeat(target)
    return true
  }

  updateHpmSummon() {
    this.alliedCompanions = this.getAlliedCompanions().filter((companion) => {
      const dreamConfig = companion?.abilities?.dreamCatbug || {}
      const punchProjectiles = companion?.abilities?.attackProjectiles?.punch || []
      const laserConfig = punchProjectiles[0] || {}

      this.enemies.forEach((enemyState) => {
        if (enemyState?.hpmDreamMark && this.time.now >= enemyState.hpmDreamMark.expiresAt) {
          this.resolveCompanionMark(enemyState, companion)
        }
      })

      if (!companion?.sprite?.active || companion.life <= 0 || this.time.now >= companion.expiresAt) {
        companion?.sprite?.clearTint()
        companion?.sprite?.destroy()
        return false
      }

      const target = this.getNearestEnemies(1, companion.sprite)[0]
      if (!target) {
        return true
      }

      const deltaX = target.sprite.x - companion.sprite.x
      const absDeltaX = Math.abs(deltaX)
      const verticalGap = Math.abs(target.sprite.y - companion.sprite.y)
      const direction = deltaX >= 0 ? 1 : -1
      companion.sprite.flipX = direction < 0

      if (this.time.now < Number(companion.actionLockUntil || 0) || this.time.now < Number(companion.nextDecisionAt || 0)) {
        this.doAnim(companion.sprite, absDeltaX > 74 ? 'walk2' : 'idle2')
        if (absDeltaX > 74) {
          companion.sprite.setVelocityX(direction * Number(companion.stats.moveSpeed || 210))
        } else {
          companion.sprite.setVelocityX(0)
        }
        return true
      }

      if (this.time.now >= companion.nextKickAt && absDeltaX < 118 && verticalGap < 138) {
        companion.nextKickAt = this.time.now + Number(companion.attackCooldowns?.kickMs || 450)
        companion.actionLockUntil = this.time.now + Math.max(260, Number(companion.attackCooldowns?.kickMs || 450) * 0.85)
        companion.nextDecisionAt = this.time.now + 180
        this.doAnim(companion.sprite, 'jumpkick2')
        if (this.applyCompanionDamageToEnemy(companion, target, Number(companion.stats.kickDamage || 65), 'kick')) {
          this.createAlliedZone({
            x: companion.sprite.x,
            y: companion.sprite.y - 16,
            radius: Number(dreamConfig.summonHealRadius || 169),
            amount: Number(dreamConfig.summonHealAmount || 16.9),
            intervalMs: Number(dreamConfig.summonHealIntervalMs || 480),
            durationMs: Number(dreamConfig.summonDurationMs || 3900),
            source: 'hpm-dream-candy',
            ownerId: companion.id
          })
        }
        return true
      }

      if (this.time.now >= companion.nextPunchAt && absDeltaX < 112 && verticalGap < 95) {
        companion.nextPunchAt = this.time.now + Number(companion.attackCooldowns?.punchMs || 390)
        companion.actionLockUntil = this.time.now + Math.max(220, Number(companion.attackCooldowns?.punchMs || 390) * 0.85)
        companion.nextDecisionAt = this.time.now + 160
        this.doAnim(companion.sprite, 'punch2')
        if (this.applyCompanionDamageToEnemy(companion, target, Number(companion.stats.punchDamage || 55), 'punch')) {
          const projectile = playerProjectiles.create(companion.sprite.x + direction * 22, companion.sprite.y - 16, 'hpm-summon-laser')
          projectile.setDepth(8)
          projectile.body.setAllowGravity(false)
          projectile.setVelocity(direction * Number(laserConfig.speed || dreamConfig.laserSpeed || 605), 0)
          projectile.displayWidth = Number(laserConfig.displayWidth || dreamConfig.laserDisplayWidth || 54)
          projectile.displayHeight = Number(laserConfig.displayHeight || dreamConfig.laserDisplayHeight || 18)
          projectile.projectileKind = 'hpm-summon-laser'
          projectile.projectileDamage = Number(laserConfig.damage || dreamConfig.laserDamage || 19.3)
          projectile.maxTravelDistance = Number(laserConfig.maxTravelDistance || dreamConfig.laserMaxTravelDistance || 176)
          projectile.startX = companion.sprite.x + direction * 22
          projectile.startY = companion.sprite.y - 16
        }
        return true
      }

      if (absDeltaX > 74) {
        this.doAnim(companion.sprite, 'walk2')
        companion.sprite.setVelocityX(direction * Number(companion.stats.moveSpeed || 210))
      } else {
        this.doAnim(companion.sprite, 'idle2')
        companion.sprite.setVelocityX(0)
      }
      return true
    })
  }

  handleEnemyAI() {
    if (this.time.now < this.phaseTransitionUntil || lifePlayer <= 0) {
      return
    }

    if (this.isPlayerUntargetable() && !this.getAlliedCompanions().length) {
      this.livingEnemies().forEach((enemyState) => {
        enemyState.nextDecisionAt = Math.max(enemyState.nextDecisionAt, this.time.now + 120)
        this.stop(enemyState.sprite)
        this.doAnim(enemyState.sprite, 'idle2')
      })
      return
    }

    this.livingEnemies().forEach((enemyState) => {
      const enemySprite = enemyState.sprite
      const now = this.time.now
      const target = this.getNearestAllyTarget(enemySprite)

      this.tryGabengArrowAttack(enemyState)

      if (!target || enemyState.justDown || now < enemyState.actionLockUntil) {
        return
      }

      const targetSprite = target.sprite
      const deltaX = targetSprite.x - enemySprite.x
      const absDeltaX = Math.abs(deltaX)
      const verticalGap = Math.abs(targetSprite.y - enemySprite.y)
      const targetStandingStill = Math.abs(targetSprite.body?.velocity?.x || 0) < 8
      const targetGrounded = Boolean(targetSprite.body?.touching?.down || targetSprite.body?.blocked?.down)
      const enemyGrounded = enemySprite.body.touching.down

      if (now < enemyState.repositionUntil) {
        this.handleEnemyReposition(enemyState, deltaX, absDeltaX, verticalGap)
        return
      }

      if (now < enemyState.nextDecisionAt) {
        return
      }

      if (absDeltaX > 200) {
        this.doAnim(enemySprite, 'walk2')
        if (deltaX > 0) {
          this.moveRight(enemySprite)
        } else {
          this.moveLeft(enemySprite)
        }
        enemyState.nextDecisionAt = now + Math.max(90, enemyState.stats.reactionDelay - 220)
        return
      }

      if (targetGrounded && enemyGrounded && verticalGap < 90 && absDeltaX < 132) {
        const shouldKick = absDeltaX > 88 || targetStandingStill || enemyState.life < enemyState.maxLife * 0.55
        const punchReady = now >= enemyState.nextPunchAt
        const kickReady = now >= enemyState.nextKickAt

        if (!punchReady && !kickReady) {
          enemyState.nextDecisionAt = Math.min(enemyState.nextPunchAt, enemyState.nextKickAt)
          return
        }

        enemyState.justDown = true
        if (shouldKick && kickReady) {
          enemyState.nextKickAt = now + this.getEnemyAttackCooldown('kick')
          this.doAnim(enemySprite, 'jumpkick2')
          this.stopIfWalking(enemySprite)
          this.setEnemyJumpkickTimeout(enemyState, target)
        } else {
          if (!punchReady) {
            enemyState.justDown = false
            enemyState.nextDecisionAt = enemyState.nextPunchAt
            return
          }
          enemyState.nextPunchAt = now + this.getEnemyAttackCooldown('punch')
          this.doAnim(enemySprite, 'punch2')
          this.stopIfWalking(enemySprite)
          this.setEnemyPunchTimeout(enemyState, target)
        }
        enemyState.actionLockUntil = now + Math.max(130, enemyState.stats.reactionDelay - 150)
        enemyState.pressureUntil = now + 420
        enemyState.nextDecisionAt = now + Math.max(110, enemyState.stats.reactionDelay - 120)
        return
      }

      if (targetStandingStill && targetGrounded && enemyGrounded && verticalGap < 90 && absDeltaX < 170) {
        this.doAnim(enemySprite, 'walk2')
        if (deltaX > 0) {
          this.moveRight(enemySprite)
        } else {
          this.moveLeft(enemySprite)
        }
        enemyState.pressureUntil = now + 320
        enemyState.nextDecisionAt = now + 80
        return
      }

      const shouldAttemptJump = (
        targetSprite.y + 130 < enemySprite.y &&
        enemyGrounded &&
        absDeltaX > 118 &&
        absDeltaX < 168 &&
        now - enemyState.lastJumpAt > 2200 &&
        Math.abs(targetSprite.body?.velocity?.y || 0) > 80 &&
        Math.random() < 0.28
      )

      if (shouldAttemptJump) {
        this.jump(enemySprite)
        enemyState.lastJumpAt = now
        enemyState.nextDecisionAt = now + Math.max(240, enemyState.stats.reactionDelay + 20)
        return
      }

      if (absDeltaX < 78) {
        this.doAnim(enemySprite, 'walk2')
        if (deltaX > 0) {
          this.moveLeft(enemySprite)
        } else {
          this.moveRight(enemySprite)
        }
        enemyState.nextDecisionAt = now + Math.max(80, enemyState.stats.reactionDelay - 190)
        return
      }

      this.doAnim(enemySprite, 'walk2')
      if (deltaX > 0) {
        this.moveRight(enemySprite)
      } else {
        this.moveLeft(enemySprite)
      }
      enemyState.nextDecisionAt = now + (now < enemyState.pressureUntil ? 70 : Math.max(90, enemyState.stats.reactionDelay - 170))
    })
  }

  setUpPlayer() {
      const battleSpriteScale = this.battleConfig?.player?.battleSpriteScale || {}
      player = this.physics.add.sprite(100, 800, 'brawler')
      player.setSize(playerWidth, playerHeight)
      player.scaleX = Number(battleSpriteScale.x || 2)
      player.scaleY = Number(battleSpriteScale.y || 2)
      player.setCollideWorldBounds(true)
      this.physics.add.collider(player, platforms)
    }
  
    setUpAnimationsPlayer() {
      const playerAnimations = this.battleConfig?.player?.battleSpriteAnimations || {}
      this.createAnimationFromConfig('walk', 'brawler', playerAnimations.walk, [0, 1, 2, 3, 4, 5], 8, 0)
      this.createAnimationFromConfig('idle', 'brawler', playerAnimations.idle, [6, 7, 8, 9, 10], 6, 0)
      this.createAnimationFromConfig('jumpkick', 'brawler', playerAnimations.jumpkick, [14, 15, 16, 17, 16, 15, 14], 12, 0)
      this.createAnimationFromConfig('punch', 'brawler', playerAnimations.punch, [12, 13, 12], 7, 0)
      this.createAnimationFromConfig('win', 'brawler', playerAnimations.win, [21, 22], 2, 0)
      this.createAnimationFromConfig('die', 'brawler', playerAnimations.die, [18, 19, 20], 3, 0)
    }

  setUpAnimationsEnemy() {
    this.createAnimation('walk2', 'brawler2', [1, 2, 3, 4], 6, 0)
    this.createAnimation('idle2', 'brawler2', [0, 6, 15, 6], 4, 0)
    this.createAnimation('jumpkick2', 'brawler2', [10, 11, 12], 6, 0)
    this.createAnimation('punch2', 'brawler2', [5, 7, 5], 7, 0)
    this.createAnimation('win2', 'brawler2', [15, 16, 17, 18, 19], 4)
    this.createAnimation('die2', 'brawler2', [20, 21, 22, 23], 4)
  }

  setPlayerJumpkickTimeout() {
    if (this.isWudiPlayer()) {
      this.executeWudiKick()
      return
    }

    if (this.isHpmPlayer()) {
      this.executeHpmKick()
      window.setTimeout(() => {
        justDownPlayer = false
      }, this.getPlayerAttackCooldown('kick'))
      return
    }

    if (this.isIQ45Player()) {
      const config = this.getIQ45Config()
      const normalRange = 114 + this.getPlayerKickRangeBonus()
      const normalTarget = this.getEnemyInRange(normalRange, 138, player)
      const kickEnergyReady = playerIq45KickEnergy >= this.getIQ45KickEnergyMax()

      if (!normalTarget && kickEnergyReady) {
        const extendedTarget = this.getEnemyInRange(Number(config.extendedKickRange || 260), Number(config.extendedKickVerticalRange || 155), player)
        if (extendedTarget) {
          const deltaX = extendedTarget.sprite.x - player.x
          const direction = deltaX >= 0 ? 1 : -1
          const pullDuration = Number(config.extendedKickPullDurationMs || 260)
          const controlMs = Number(config.extendedKickControlMs || 500)
          const damage = roundToTenth(this.getPlayerKickDamage() * Number(config.extendedKickDamageMultiplier || 1.6))

          playerIq45KickEnergy = 0
          this.playerAttackConnected = true
          this.stop(player)
          this.controlEnemy(extendedTarget, pullDuration + controlMs, 0, 0)
          this.recordEvent('iq45-extended-kick-armed', {
            enemyId: extendedTarget.id,
            currentEnergy: playerIq45KickEnergy,
            maxEnergy: this.getIQ45KickEnergyMax()
          })

          window.setTimeout(() => {
            if (!extendedTarget?.sprite?.active || extendedTarget.life <= 0 || lifePlayer <= 0) {
              return
            }

            extendedTarget.sprite.x = player.x + direction * Number(config.extendedKickPullOffsetX || 88)
            extendedTarget.sprite.setVelocity(0, 0)
          }, Math.max(60, Math.round(pullDuration * 0.55)))

          window.setTimeout(() => {
            if (!extendedTarget?.sprite?.active || extendedTarget.life <= 0 || lifePlayer <= 0) {
              return
            }

            const connected = this.applyFlatDamageToEnemy(extendedTarget, damage, 'iq45-extended-kick', {
              baseDamage: this.getPlayerKickDamage(),
              bonusDamage: roundToTenth(damage - this.getPlayerKickDamage())
            })
            if (connected) {
              this.controlEnemy(
                extendedTarget,
                controlMs,
                direction * Number(config.extendedKickKnockbackX || 240),
                Number(config.extendedKickKnockbackY || -140)
              )
            }
          }, pullDuration)

          window.setTimeout(() => {
            justDownPlayer = false
          }, Math.max(this.getPlayerAttackCooldown('kick'), pullDuration + controlMs))
          return
        }
      }
    }

    if (this.isGarlicPlayer()) {
      const recoverDelay = this.isGarlicTrueForm()
        ? (this.getGarlicConfig().trueKickRecoverToFakeDelayMs || 520)
        : 450
      if (this.isGarlicTrueForm()) {
        this.executeGarlicTrueKick()
      } else {
        this.executeGarlicFakeKick()
      }
      window.setTimeout(() => {
        justDownPlayer = false
      }, Math.max(recoverDelay, this.getPlayerAttackCooldown('kick')))
      return
    }

    this.playerAttackConnected = false
    this.triggerPlayerAttackProjectiles('kick')
    if (this.isDreamCatbugPlayer()) {
      this.summonDreamCandySupport()
    }
    this.setPlayerScoreCalcTimeout(
      [150, 200, 250, 300, 330, 360],
      this.getPlayerKickDamage(),
      114 + this.getPlayerKickRangeBonus(),
      138,
      'kick'
    )
    window.setTimeout(() => {
      if (this.battleConfig.player.id === 'tank' && !this.playerAttackConnected) {
        playerKickHitStreak = 0
      }
      justDownPlayer = false
    }, this.getPlayerAttackCooldown('kick'))
  }

  setEnemyJumpkickTimeout(enemyState, target) {
    enemyState.hitPlayer = false
    this.setEnemyScoreCalcTimeout(enemyState, target, [150, 200, 250, 300, 330, 360], enemyState.stats.kickDamage, 114, 138)
    window.setTimeout(() => {
      this.handleEnemyAttackRecovery(enemyState, 'kick')
      enemyState.justDown = false
    }, this.getEnemyAttackCooldown('kick'))
  }

  setPlayerPunchTimeout() {
    if (this.isWudiPlayer()) {
      this.executeWudiPunch()
      window.setTimeout(() => {
        justDownPlayer = false
      }, this.getWudiConfig().punchDashDurationMs || this.getPlayerAttackCooldown('punch'))
      return
    }

    if (this.isHpmPlayer()) {
      this.executeHpmPunch()
      window.setTimeout(() => {
        justDownPlayer = false
      }, this.getPlayerAttackCooldown('punch'))
      return
    }

    if (this.isIQ45Player()) {
      playerIq45PendingEnhancedPunch = playerIq45PunchEnergy >= this.getIQ45PunchEnergyMax()
      if (playerIq45PendingEnhancedPunch) {
        playerIq45PunchEnergy = 0
        this.recordEvent('iq45-enhanced-punch-armed', {
          currentEnergy: playerIq45PunchEnergy,
          maxEnergy: this.getIQ45PunchEnergyMax()
        })
      }
    }

    if (this.isGarlicPlayer()) {
      if (this.isGarlicTrueForm()) {
        this.executeGarlicTruePunch()
      } else {
        this.executeGarlicFakePunch()
      }
      window.setTimeout(() => {
        justDownPlayer = false
      }, this.getPlayerAttackCooldown('punch'))
      return
    }

    this.playerAttackConnected = false
    this.triggerPlayerAttackProjectiles('punch')
    this.setPlayerScoreCalcTimeout([70, 110, 150, 200, 245, 290, 330], this.getPlayerPunchDamage(), 113, 90, 'punch')
    if (this.battleConfig.player.id === 'tank') {
      playerKickHitStreak = 0
    }
    window.setTimeout(() => {
      if (this.isIQ45Player()) {
        playerIq45PendingEnhancedPunch = false
      }
      justDownPlayer = false
    }, this.getPlayerAttackCooldown('punch'))
  }

  setEnemyPunchTimeout(enemyState, target) {
    enemyState.hitPlayer = false
    this.setEnemyScoreCalcTimeout(enemyState, target, [70, 110, 150, 200, 245, 290, 330], enemyState.stats.punchDamage, 113, 90)
    window.setTimeout(() => {
      this.handleEnemyAttackRecovery(enemyState, 'punch')
      enemyState.justDown = false
    }, this.getEnemyAttackCooldown('punch'))
  }

  getPlayerAttackCooldown(attackType) {
    const cooldowns = this.battleConfig.player.attackCooldowns || {}
    return attackType === 'kick' ? (cooldowns.kickMs || 450) : (cooldowns.punchMs || 390)
  }

  getEnemyAttackCooldown(attackType) {
    const cooldowns = this.battleConfig.enemy.attackCooldowns || this.battleConfig.player.attackCooldowns || {}
    return attackType === 'kick' ? (cooldowns.kickMs || 450) : (cooldowns.punchMs || 390)
  }

  getPlayerUltimateCooldown() {
    return Number(this.battleConfig.player.abilities?.ultimateCooldownMs || 25000)
  }

  getPlayerPunchDamage() {
    const equipmentDamageDelta = this.getEquipmentBonusDelta('punchDamage')
    if (this.battleConfig.player.id === 'starter') {
      return roundToTenth(this.battleConfig.player.stats.punchDamage + equipmentDamageDelta)
    }

    if (this.battleConfig.player.id === 'tank') {
      const missingLifeBonus = roundToTenth((maxLifePlayer - lifePlayer) * 2)
      const kickComboBonus = playerKickHitStreak >= 2 ? playerKickHitStreak : 0
      return roundToTenth(this.battleConfig.player.stats.punchDamage + equipmentDamageDelta + missingLifeBonus + kickComboBonus)
    }

    if (this.isHpmPlayer()) {
      const config = this.getHpmConfig()
      const circleBonus = this.getHpmProtectionBonuses().punchBonus
      return roundToTenth(
        this.battleConfig.player.stats.punchDamage +
        equipmentDamageDelta +
        Number(config.passivePunchBonusPerLayer || 6) * Number(this.hpmState.passivePunchLayers || 0) +
        circleBonus
      )
    }

    return roundToTenth(this.battleConfig.player.stats.punchDamage + equipmentDamageDelta)
  }

  getPlayerKickDamage() {
    if (this.isHpmPlayer()) {
      const config = this.getHpmConfig()
      const circleBonus = this.getHpmProtectionBonuses().kickBonus
      return roundToTenth(
        this.battleConfig.player.stats.kickDamage +
        this.getEquipmentBonusDelta('kickDamage') +
        Number(config.passiveKickBonusPerLayer || 8) * Number(this.hpmState.passiveKickLayers || 0) +
        circleBonus
      )
    }

    return roundToTenth(this.battleConfig.player.stats.kickDamage + this.getEquipmentBonusDelta('kickDamage'))
  }

  getPlayerKickRangeBonus() {
    if (this.isHpmPlayer()) {
      return Number(this.getHpmConfig().kickRangeBonus || 0)
    }
    return this.battleConfig.player.abilities?.kickRangeBonus || 0
  }

  setPlayerScoreCalcTimeout(msList, damagePoints, deltaX, deltaY, attackType) {
    for (const ms of msList) {
      window.setTimeout(() => {
        const preferredId = attackType === 'punch' && playerPunchFollowUpTarget ? playerPunchFollowUpTarget.enemyId : null
        const target = this.getEnemyInRange(deltaX, deltaY, player, preferredId)
        if (target && !this.playerAttackConnected && lifePlayer > 0) {
          this.playerAttackConnected = true
          this.applyDamageToEnemy(target, damagePoints, attackType)
        }
      }, ms)
    }
  }

  triggerPlayerAttackProjectiles(attackType) {
    const projectileConfig = this.battleConfig.player.abilities?.attackProjectiles
    if (!projectileConfig || lifePlayer <= 0) {
      return
    }

    const baseProjectiles = Array.isArray(projectileConfig[attackType]) ? projectileConfig[attackType] : []
    baseProjectiles.forEach((config) => {
      this.spawnPlayerProjectile(config, attackType, false)
    })

    const extraChance = Number(projectileConfig.extraChance || 0)
    const extraProjectiles = Array.isArray(projectileConfig.extra) ? projectileConfig.extra : []
    const shouldTriggerExtra = extraChance > 0 && Math.random() < extraChance

    if (!shouldTriggerExtra) {
      return
    }

    extraProjectiles
      .filter((config) => !Array.isArray(config.on) || config.on.includes(attackType))
      .forEach((config) => {
        this.spawnPlayerProjectile(config, attackType, true)
      })
  }

  spawnPlayerProjectile(config, attackType, isExtraProjectile) {
    if (!playerProjectiles || !config?.textureKey) {
      return
    }

    const direction = player.flipX ? -1 : 1
    const startX = player.x + direction * (config.offsetX || 50)
    const startY = player.y + (config.offsetY || -24)
    const projectile = playerProjectiles.create(startX, startY, config.textureKey)
    const speed = Number(config.speed || 480)
    let velocityX = direction * speed
    let velocityY = Number(config.velocityY || 0)

    if (config.aimAtNearestEnemy) {
      const target = this.getNearestEnemies(1, player)[0]
      if (target?.sprite?.active) {
        const deltaX = target.sprite.x - startX
        const deltaY = target.sprite.y - startY
        const magnitude = Math.max(1, Math.hypot(deltaX, deltaY))
        velocityX = (deltaX / magnitude) * speed
        velocityY = (deltaY / magnitude) * speed
      }
    }

    projectile.setDepth(8)
    projectile.setCollideWorldBounds(false)
    projectile.body.setAllowGravity(false)
    projectile.setVelocity(velocityX, velocityY)
    projectile.displayWidth = config.displayWidth || 40
    projectile.displayHeight = config.displayHeight || projectile.displayWidth
    projectile.projectileDamage = roundToTenth(config.damage || 0)
    projectile.projectileLabel = config.label || 'projectile'
    projectile.projectileAttackType = attackType
    projectile.isExtraProjectile = isExtraProjectile
    projectile.hitEnemyIds = new Set()
    projectile.startX = startX
    projectile.startY = startY
    projectile.maxTravelDistance = Number(config.maxTravelDistance || 0)
  }

  updatePlayerProjectiles() {
    if (!playerProjectiles) {
      return
    }

    playerProjectiles.getChildren().forEach((projectile) => {
      if (!projectile?.active) {
        return
      }

      if (
        Number(projectile.maxTravelDistance || 0) > 0 &&
        Math.hypot(projectile.x - Number(projectile.startX || projectile.x), projectile.y - Number(projectile.startY || projectile.y)) >= projectile.maxTravelDistance
      ) {
        projectile.destroy()
        return
      }

      if (projectile.x < -120 || projectile.x > 920 || projectile.y < -120 || projectile.y > 720) {
        projectile.destroy()
        return
      }

      if (projectile.projectileKind === 'hpm-note') {
        const enemyTarget = this.livingEnemies().find((enemyState) => (
          enemyState.sprite?.active &&
          Phaser.Geom.Intersects.RectangleToRectangle(projectile.getBounds(), enemyState.sprite.getBounds())
        ))
        if (enemyTarget) {
          const config = this.getHpmConfig()
          const healAmount = roundToTenth(Number(config.noteHealBase || 6) + this.getHpmExtraLife() * Number(config.noteHealExtraLifeRatio || 0.1))
          const damage = roundToTenth(Number(config.noteDamageBase || 8) + this.getPlayerKickDamage() * Number(config.noteDamageKickRatio || 0.2))
          this.healPlayer(healAmount, 'hpm-note-hit', { targetId: enemyTarget.id })
          this.applyFlatDamageToEnemy(enemyTarget, damage, 'hpm-note', {
            baseDamage: damage,
            skipSound: true,
            skipReward: true
          })
          projectile.destroy()
          return
        }

        const allyTarget = this.time.now - Number(projectile.spawnedAt || 0) < 120
          ? null
          : this.getAlliedTargets().find((ally) => (
            Phaser.Geom.Intersects.RectangleToRectangle(projectile.getBounds(), ally.sprite.getBounds())
          ))
        if (allyTarget) {
          const config = this.getHpmConfig()
          const healAmount = roundToTenth(Number(config.noteHealBase || 6) + this.getHpmExtraLife() * Number(config.noteHealExtraLifeRatio || 0.1))
          const allyHeal = roundToTenth(Number(config.noteAllyHealBase || 7) + this.getPlayerPunchDamage() * Number(config.noteAllyHealPunchRatio || 0.1))
          this.healPlayer(healAmount, 'hpm-note-hit', { targetId: allyTarget.id })
          this.healAllyTarget(allyTarget, allyHeal, 'hpm-note-ally-heal')
          projectile.destroy()
        }
        return
      }

      const target = this.livingEnemies().find((enemyState) => {
        if (!enemyState.sprite?.active || projectile.hitEnemyIds?.has(enemyState.id)) {
          return false
        }

        return Phaser.Geom.Intersects.RectangleToRectangle(projectile.getBounds(), enemyState.sprite.getBounds())
      })

      if (target) {
        if (projectile.projectileKind === 'hpm-summon-laser') {
          const companion = this.getAlliedCompanions().find((ally) => ally.id === 'hpm-dream-catbug')
          if (companion) {
            this.applyCompanionDamageToEnemy(companion, target, Number(projectile.projectileDamage || 0), 'laser')
          }
          projectile.destroy()
          return
        }

        this.applyProjectileDamage(target, projectile)
      }
    })
  }

  tryGabengArrowAttack(enemyState) {
    if (!this.isGabengEnemy(enemyState) || !enemyState?.sprite?.active || enemyState.life <= 0 || lifePlayer <= 0) {
      return
    }

    const config = this.getGabengArrowConfig(enemyState)
    const target = this.getNearestAllyTarget(enemyState.sprite)
    const now = this.time.now
    if (!config || now < enemyState.nextArrowCheckAt || !target) {
      return
    }

    enemyState.nextArrowCheckAt = now + Number(config.checkIntervalMs || 1000)

    if (target.kind === 'player' && this.isPlayerUntargetable()) {
      return
    }

    const arrowChance = this.getGabengArrowChance(enemyState)
    const shouldFire = Math.random() < arrowChance

    this.recordEvent('gabeng-arrow-lock', {
      enemyId: enemyState.id,
      arrowChance,
      targetId: target.id,
      fired: shouldFire
    })

    if (!shouldFire) {
      return
    }

    this.spawnEnemyProjectile(enemyState, config)
  }

  spawnEnemyProjectile(enemyState, config) {
    const target = this.getNearestAllyTarget(enemyState.sprite)
    if (!enemyProjectiles || !config?.textureKey || !target?.sprite?.active) {
      return
    }

    const deltaX = target.sprite.x - enemyState.sprite.x
    const deltaY = target.sprite.y - enemyState.sprite.y
    const magnitude = Math.max(1, Math.hypot(deltaX, deltaY))
    const speed = Number(config.projectileSpeed || 440)
    const velocityX = (deltaX / magnitude) * speed
    const velocityY = (deltaY / magnitude) * speed
    const projectile = enemyProjectiles.create(enemyState.sprite.x, enemyState.sprite.y - 18, config.textureKey)

    projectile.setDepth(8)
    projectile.setCollideWorldBounds(false)
    projectile.body.setAllowGravity(false)
    projectile.setVelocity(velocityX, velocityY)
    projectile.displayWidth = config.displayWidth || 36
    projectile.displayHeight = config.displayHeight || projectile.displayWidth
    projectile.projectileDamage = roundToTenth(enemyState.stats.punchDamage * Number(config.damageRatio || 0.1))
    projectile.projectileLabel = config.label || '箭矢'
    projectile.projectileStunDurationMs = Number(config.stunDurationMs || 0)
    projectile.ownerEnemyId = enemyState.id
    projectile.targetId = target.id

    this.recordEvent('gabeng-arrow-fired', {
      enemyId: enemyState.id,
      projectileName: projectile.projectileLabel,
      totalDamage: projectile.projectileDamage,
      stunDurationMs: projectile.projectileStunDurationMs
    })
  }

  updateEnemyProjectiles() {
    if (!enemyProjectiles) {
      return
    }

    enemyProjectiles.getChildren().forEach((projectile) => {
      if (!projectile?.active) {
        return
      }

      if (!this.getAlliedTargets().length) {
        projectile.destroy()
        return
      }

      if (projectile.x < -120 || projectile.x > 920 || projectile.y < -120 || projectile.y > 720) {
        projectile.destroy()
        return
      }

      const target = this.getAlliedTargets().find((ally) => (
        Phaser.Geom.Intersects.RectangleToRectangle(projectile.getBounds(), ally.sprite.getBounds())
      ))
      if (!target) {
        return
      }

      this.applyEnemyProjectileDamage(projectile, target)
    })
  }

  applyEnemyProjectileDamage(projectile, target) {
    const totalDamage = this.applyDamageToAllyTarget(target, roundToTenth(projectile.projectileDamage || 0), {
      projectileName: projectile.projectileLabel,
      enemyId: projectile.ownerEnemyId
    })
    punchSound.play()

    const stunDurationMs = Number(projectile.projectileStunDurationMs || 0)
    if (target.kind === 'player' && stunDurationMs > 0 && lifePlayer > 0) {
      this.controlPlayer(stunDurationMs, 0, 0, '箭矢眩晕')
    }

    this.recordEvent('damage-to-player-projectile', {
      enemyId: projectile.ownerEnemyId,
      projectileName: projectile.projectileLabel,
      totalDamage,
      targetId: target.id,
      playerLifeAfter: lifePlayer,
      stunDurationMs
    })

    projectile.destroy()
  }

  applyDamageToEnemy(target, baseDamage, attackType) {
    let totalDamage = roundToTenth(baseDamage)
    const abilities = this.battleConfig.player.abilities || {}

    if (attackType === 'kick' && abilities.kickBonusDamage) {
      totalDamage = roundToTenth(totalDamage + abilities.kickBonusDamage)
    }

    if (this.battleConfig.player.id === 'yuzijiang' && this.isPlayerInvisible()) {
      totalDamage = roundToTenth(totalDamage + (abilities.invisibilityDamageBonus || 0))
    }

    const iq45EnhancedPunch = this.isIQ45Player() && attackType === 'punch' && playerIq45PendingEnhancedPunch
    if (iq45EnhancedPunch) {
      totalDamage = roundToTenth(totalDamage * Number(this.getIQ45Config().enhancedPunchDamageMultiplier || 2))
    }

    const connected = this.applyFlatDamageToEnemy(target, totalDamage, attackType, {
      baseDamage,
      originalAttackType: attackType,
      enhancedPunch: iq45EnhancedPunch
    })
    if (!connected) {
      return
    }

    if (attackType === 'punch') {
      if (this.isIQ45Player()) {
        this.addIQ45KickEnergy(Number(this.getIQ45Config().extendedKickEnergyPerPunchHit || 50), 'punch-hit')
      }
      playerPunchFollowUpTarget = {
        enemyId: target.id,
        x: target.sprite.x,
        y: target.sprite.y
      }
      this.triggerPlayerPunchFollowUps()
    }

    if (attackType === 'kick') {
      this.triggerKickSplashFromHit(target, totalDamage)
      this.triggerPlayerKickFollowUps(baseDamage, target.id)
    }

    if (iq45EnhancedPunch) {
      const config = this.getIQ45Config()
      const splashDamage = roundToTenth(this.getPlayerPunchDamage() * Number(config.enhancedPunchSplashRatio || 0.1))
      let totalSplashDamage = 0

      this.getHostileTargetsNearEnemy(
        target,
        Number(config.enhancedPunchSplashRange || 132),
        Number(config.enhancedPunchSplashVerticalRange || 120)
      ).forEach((enemyState) => {
        const hit = this.applyFlatDamageToEnemy(enemyState, splashDamage, 'iq45-enhanced-punch-splash', {
          baseDamage: splashDamage,
          splashFrom: target.id,
          skipSound: true,
          skipReward: true
        })
        if (hit) {
          totalSplashDamage = roundToTenth(totalSplashDamage + splashDamage)
        }
      })

      if (totalSplashDamage > 0) {
        this.addIQ45PunchEnergy(totalSplashDamage * Number(config.splashEnergyPerDamage || 4), 'enhanced-punch-splash')
      }

      this.recordEvent('iq45-enhanced-punch-finished', {
        enemyId: target.id,
        totalDamage,
        splashDamage: totalSplashDamage,
        currentEnergy: playerIq45PunchEnergy
      })
      playerIq45PendingEnhancedPunch = false
    }
  }

  applyProjectileDamage(target, projectile) {
    const damageMultiplier = this.getDreamCatbugDamageMultiplier(target)
    const totalDamage = roundToTenth((projectile.projectileDamage || 0) * damageMultiplier)
    if (totalDamage <= 0) {
      projectile.destroy()
      return
    }

    target.life = roundToTenth(Math.max(0, target.life - totalDamage))
    lastDamageDealt = totalDamage
    this.refreshEnemyUi()
    scorePlayer = roundToTenth(scorePlayer + totalDamage)
    if (scoreTextPlayer) { scoreTextPlayer.setText(`分数 ${this.formatNumber(scorePlayer)}`) }
    this.registerPlayerDamageDealt(totalDamage)
    this.applyDreamCatbugMarkFromHit(target, totalDamage, projectile.projectileAttackType || 'projectile')
    this.recordEvent('damage-to-enemy-projectile', {
      attackType: `${projectile.projectileAttackType}-projectile`,
      projectileName: projectile.projectileLabel,
      totalDamage,
      enemyId: target.id,
      enemyLifeAfter: target.life,
      isExtraProjectile: Boolean(projectile.isExtraProjectile),
      dreamCatbugAmplified: damageMultiplier > 1
    })

    projectile.hitEnemyIds?.add(target.id)
    projectile.destroy()
    this.handleEnemyDefeat(target)
  }
  handleEnemyDefeat(target) {
    if (target.life > 0 || !target.sprite?.active || target.defeatHandled) {
      return
    }

    target.defeatHandled = true
    this.triggerPlayerMasteryKillBurst()
    target.sprite.anims.play('die2', true)
    target.sprite.setVelocity(0, 0)
    this.time.delayedCall(320, () => {
      if (target.sprite?.active) {
        target.sprite.destroy()
      }
      this.refreshEnemyUi()
    })
  }

  triggerPlayerPunchFollowUps() {
    const abilities = this.battleConfig.player.abilities || {}
    if (!abilities.punchFollowUps || !this.livingEnemies().length) {
      return
    }

    for (let index = 1; index <= abilities.punchFollowUps; index += 1) {
      window.setTimeout(() => {
        if (!this.livingEnemies().length || lifePlayer <= 0) {
          return
        }

        const shouldHit = this.shouldPlayerPunchFollowUpHit(index)
        if (shouldHit) {
          const target = this.getEnemyInRange(120, 95, player, playerPunchFollowUpTarget?.enemyId)
          if (!target) {
            return
          }

          const followUpDamage = roundToTenth(abilities.punchFollowUpDamage)
          target.life = roundToTenth(Math.max(0, target.life - followUpDamage))
          lastDamageDealt = followUpDamage
          this.refreshEnemyUi()
          scorePlayer = roundToTenth(scorePlayer + followUpDamage)
          if (scoreTextPlayer) { scoreTextPlayer.setText(`分数 ${this.formatNumber(scorePlayer)}`) }
          this.registerPlayerDamageDealt(followUpDamage)
          punchSound.play()
          this.recordEvent('damage-to-enemy-follow-up', {
            attackType: 'punch-follow-up',
            totalDamage: followUpDamage,
            enemyId: target.id,
            enemyLifeAfter: target.life,
            hitIndex: index,
            followUpRule: this.getPunchFollowUpRuleLabel(index)
          })

          this.handleEnemyDefeat(target)

          return
        }

        this.recordEvent('follow-up-missed', {
          attackType: 'punch-follow-up',
          hitIndex: index,
          followUpRule: this.getPunchFollowUpRuleLabel(index)
        })
      }, index * (abilities.punchFollowUpGapMs || 70))
    }
  }

  triggerPlayerKickFollowUps(baseDamage, preferredId) {
    const abilities = this.battleConfig.player.abilities || {}
    if (!abilities.kickFollowUps || !this.livingEnemies().length) {
      return
    }

    for (let index = 1; index <= abilities.kickFollowUps; index += 1) {
      window.setTimeout(() => {
        if (!this.livingEnemies().length || lifePlayer <= 0) {
          return
        }

        const target = this.getEnemyInRange(138 + this.getPlayerKickRangeBonus(), 155, player, preferredId)
        if (!target) {
          return
        }

        const followUpDamage = roundToTenth(abilities.kickFollowUpDamage || baseDamage)
        target.life = roundToTenth(Math.max(0, target.life - followUpDamage))
        lastDamageDealt = followUpDamage
        this.refreshEnemyUi()
        scorePlayer = roundToTenth(scorePlayer + followUpDamage)
        if (scoreTextPlayer) { scoreTextPlayer.setText(`分数 ${this.formatNumber(scorePlayer)}`) }
        this.registerPlayerDamageDealt(followUpDamage)
        kickSound.play()
        this.handlePlayerHitReward('kick-follow-up', followUpDamage)
        this.recordEvent('damage-to-enemy-follow-up', {
          attackType: 'kick-follow-up',
          totalDamage: followUpDamage,
          enemyId: target.id,
          enemyLifeAfter: target.life,
          hitIndex: index
        })

        this.handleEnemyDefeat(target)
      }, index * (abilities.kickFollowUpGapMs || 90))
    }
  }

  setEnemyScoreCalcTimeout(enemyState, initialTarget, msList, damagePoints, deltaX, deltaY) {
    for (const ms of msList) {
      window.setTimeout(() => {
        if (!enemyState.sprite?.active || enemyState.life <= 0 || enemyState.hitPlayer) {
          return
        }

        const target = (
          initialTarget?.sprite?.active &&
          (initialTarget.kind !== 'player' || lifePlayer > 0) &&
          (initialTarget.kind !== 'companion' || initialTarget.companion?.life > 0)
        ) ? initialTarget : this.getNearestAllyTarget(enemyState.sprite)

        if (!target?.sprite?.active) {
          return
        }

        if (Math.abs(target.sprite.x - enemyState.sprite.x) < deltaX && Math.abs(target.sprite.y - enemyState.sprite.y) <= deltaY) {
          if (target.kind === 'player' && this.isPlayerUntargetable()) {
            const untargetableState = this.getPlayerUntargetableReason()
            this.recordEvent('damage-blocked', {
              attackType: deltaY > 100 ? 'enemy-kick' : 'enemy-punch',
              enemyId: enemyState.id,
              reason: untargetableState.reason,
              remainingMs: untargetableState.remainingMs
            })
            return
          }

          enemyState.hitPlayer = true
          const reducedDamage = this.applyDamageToAllyTarget(target, damagePoints, {
            attackType: deltaY > 100 ? 'enemy-kick' : 'enemy-punch',
            enemyId: enemyState.id
          })
          punchSound.play()
          if (this.isGabengEnemy(enemyState)) {
            if (deltaY > 100) {
              const config = this.getGabengArrowConfig(enemyState)
              const direction = enemyState.sprite.x <= target.sprite.x ? 1 : -1
              if (target.kind === 'player') {
                this.controlPlayer(
                  Number(config?.kickHitControlMs || 500),
                  direction * Number(config?.kickHitKnockbackX || 210),
                  Number(config?.kickHitKnockbackY || -120),
                  '嘎嘣飞踢击退'
                )
              } else if (target.companion?.sprite?.active) {
                target.companion.sprite.setVelocity(
                  direction * Number(config?.kickHitKnockbackX || 210),
                  Number(config?.kickHitKnockbackY || -120)
                )
              }
            } else {
              this.adjustGabengArrowChance(
                enemyState,
                Number(this.getGabengArrowConfig(enemyState)?.punchHitChanceGain || 0.02),
                'punch-hit'
              )
            }
          }
          if (target.kind === 'player') {
            this.maybeTriggerRetaliatoryStun(enemyState)
            this.registerJumpRetaliationBoost(enemyState)
          }
        }
      }, ms)
    }
  }

  getReducedPlayerDamage(baseDamage) {
    const abilities = this.battleConfig.player.abilities || {}
    let finalDamage = roundToTenth(baseDamage)

    if (this.isIQ45StoneActive()) {
      const healAmount = roundToTenth(finalDamage * Number(this.getIQ45Config().stoneHealRatio || 0.1))
      playerIq45StoneHealTotal = roundToTenth(playerIq45StoneHealTotal + healAmount)
      lifePlayer = roundToTenth(Math.min(maxLifePlayer, lifePlayer + healAmount))
      setPlayerValuebar(healthBarPlayer, this.toPercent(lifePlayer, maxLifePlayer))
      this.recordEvent('iq45-stone-heal', {
        baseDamage,
        healAmount,
        playerLifeAfter: lifePlayer,
        accumulatedStoneHeal: playerIq45StoneHealTotal
      })
      return 0
    }

    if (this.isGarlicSecondFakeForm() && playerGarlicShieldCharges > 0) {
      const shieldChargesBeforeHit = playerGarlicShieldCharges
      playerGarlicShieldCharges -= 1
      const reduction = this.getGarlicConfig().trueShieldReduction || 0.3
      finalDamage = Math.max(0.1, roundToTenth(finalDamage * (1 - reduction)))
      this.recordEvent('damage-reduced', {
        reason: '大蒜护盾减伤',
        baseDamage,
        totalDamage: finalDamage,
        shieldChargesBeforeHit,
        remainingShieldCharges: playerGarlicShieldCharges
      })
    }

    if (this.isHpmPlayer() && Number(this.hpmState.passiveShieldCharges || 0) > 0) {
      const shieldChargesBeforeHit = this.hpmState.passiveShieldCharges
      this.hpmState.passiveShieldCharges -= 1
      finalDamage = Math.max(0.1, roundToTenth(finalDamage * (1 - Number(this.getHpmConfig().passiveLayerShieldReduction || 0.3))))
      this.recordEvent('damage-reduced', {
        reason: 'hpm-passive-shield',
        baseDamage,
        totalDamage: finalDamage,
        shieldChargesBeforeHit,
        remainingShieldCharges: this.hpmState.passiveShieldCharges
      })
    }

    if (this.isHpmPlayer() && Number(this.hpmState.auraShieldCharges || 0) > 0) {
      const shieldChargesBeforeHit = this.hpmState.auraShieldCharges
      this.hpmState.auraShieldCharges -= 1
      finalDamage = Math.max(0.1, roundToTenth(finalDamage * (1 - Number(this.getHpmConfig().auraShieldReduction || 0.3))))
      this.recordEvent('damage-reduced', {
        reason: 'hpm-aura-shield',
        baseDamage,
        totalDamage: finalDamage,
        shieldChargesBeforeHit,
        remainingShieldCharges: this.hpmState.auraShieldCharges
      })
    }

    if (playerShieldCharges > 0 && abilities.shieldReduction) {
      const shieldChargesBeforeHit = playerShieldCharges
      playerShieldCharges -= 1
      finalDamage = Math.max(0.1, roundToTenth(finalDamage * (1 - abilities.shieldReduction)))
      this.recordEvent('damage-reduced', {
        reason: '护盾减伤',
        baseDamage,
        totalDamage: finalDamage,
        shieldChargesBeforeHit,
        remainingShieldCharges: playerShieldCharges
      })
    }

    if (playerPersistentDamageReduction > 0) {
      finalDamage = Math.max(0.1, roundToTenth(finalDamage * (1 - playerPersistentDamageReduction)))
      this.recordEvent('damage-reduced', {
        reason: '常驻减伤',
        baseDamage,
        totalDamage: finalDamage,
        persistentDamageReduction: playerPersistentDamageReduction
      })
    }

    if (this.isWudiPlayer() && playerFatalGuardCharges > 0 && finalDamage >= lifePlayer) {
      playerFatalGuardCharges -= 1
      this.recordEvent('wudi-fatal-guard-triggered', {
        reason: '亡崩死裂',
        baseDamage,
        totalDamage: 0,
        fatalGuardCharges: playerFatalGuardCharges
      })
      lifePlayer = Math.max(1, abilities.fatalGuardLife || 1)
      setPlayerValuebar(healthBarPlayer, this.toPercent(lifePlayer, maxLifePlayer))
      this.executeWudiDeathDance()
      return 0
    }

    if (playerFatalGuardCharges > 0 && finalDamage >= lifePlayer) {
      playerFatalGuardCharges -= 1
      this.triggerPlayerInvisibility('fatal-guard-trigger')
      this.recordEvent('fatal-guard-triggered', {
        reason: 'fatal-guard',
        baseDamage,
        totalDamage: Math.max(0, roundToTenth(lifePlayer - (abilities.fatalGuardLife || 1))),
        remainingShieldCharges: playerShieldCharges,
        fatalGuardCharges: playerFatalGuardCharges
      })
      return Math.max(0, roundToTenth(lifePlayer - (abilities.fatalGuardLife || 1)))
    }

    if (this.isGarlicPlayer() && !this.isGarlicSecondFakeForm() && finalDamage >= lifePlayer) {
      this.enterGarlicForm('true', '第一次假身死亡后切入真身')
      return 0
    }

    if (this.isIQ45Player() && !playerIq45StoneUsed) {
      const threshold = roundToTenth(maxLifePlayer * Number(this.getIQ45Config().stoneThresholdRatio || 0.2))
      const remainingLife = roundToTenth(lifePlayer - finalDamage)
      if (remainingLife > 0 && remainingLife <= threshold) {
        this.triggerIQ45StoneForm('life-below-threshold')
      }
    }

    return finalDamage
  }

  handleEnemyAttackRecovery(enemyState, attackType) {
    if (!enemyState.hitPlayer && attackType === 'kick' && this.isGabengEnemy(enemyState)) {
      this.adjustGabengArrowChance(
        enemyState,
        -Number(this.getGabengArrowConfig(enemyState)?.kickMissChanceLoss || 0.01),
        'kick-miss'
      )
    }

    if (enemyState.life <= 0 || lifePlayer <= 0 || enemyState.hitPlayer) {
      return
    }

    const target = this.getNearestAllyTarget(enemyState.sprite)
    if (!target?.sprite?.active) {
      return
    }

    const absDeltaX = Math.abs(target.sprite.x - enemyState.sprite.x)
    const verticalGap = Math.abs(target.sprite.y - enemyState.sprite.y)
    const now = this.time.now

    if (verticalGap > 120) {
      enemyState.nextDecisionAt = now + 90
      return
    }

    const shouldChase = absDeltaX > (attackType === 'kick' ? 74 : 62) || Math.random() < 0.68

    if (shouldChase) {
      enemyState.pressureUntil = now + 380
      enemyState.repositionUntil = now + 240
      enemyState.actionLockUntil = Math.max(enemyState.actionLockUntil, now + 130)
      this.recordEvent('enemy-reposition', {
        enemyId: enemyState.id,
        reason: `${attackType}-miss-chase`,
        distanceToPlayer: roundToTenth(absDeltaX)
      })
      return
    }

    enemyState.repositionUntil = now + 180
    enemyState.actionLockUntil = Math.max(enemyState.actionLockUntil, now + 110)
    this.recordEvent('enemy-reposition', {
      enemyId: enemyState.id,
      reason: `${attackType}-miss-retreat`,
      distanceToPlayer: roundToTenth(absDeltaX)
    })
  }

  handleEnemyReposition(enemyState, deltaX, absDeltaX, verticalGap) {
    const shouldCloseIn = absDeltaX > 94 || verticalGap > 70 || this.time.now < enemyState.pressureUntil

    this.doAnim(enemyState.sprite, 'walk2')

    if (shouldCloseIn) {
      if (deltaX > 0) {
        this.moveRight(enemyState.sprite)
      } else {
        this.moveLeft(enemyState.sprite)
      }
      return
    }

    if (deltaX > 0) {
      this.moveLeft(enemyState.sprite)
    } else {
      this.moveRight(enemyState.sprite)
    }
  }

  toPercent(value, total) {
    return total <= 0 ? 0 : (value / total) * 100
  }

  updatePlayersFlip() {
    const primaryEnemy = this.getPrimaryEnemy()
    if (primaryEnemy?.sprite) {
      this.animateFlip(player, primaryEnemy.sprite)
    }

    this.livingEnemies().forEach((enemyState) => {
      const target = this.getNearestAllyTarget(enemyState.sprite)
      this.animateFlip(enemyState.sprite, target?.sprite || player)
    })

    this.getAlliedCompanions().forEach((companion) => {
      const target = this.getNearestEnemies(1, companion.sprite)[0]
      if (target?.sprite) {
        this.animateFlip(companion.sprite, target.sprite)
      }
    })
  }

  animateFlip(first, second) {
    if (!first || !second || Math.abs(first.x - second.x) < 0.01) {
      return
    }

    first.flipX = first.x > second.x
  }

  setUpSounds() {
    music = this.sound.add('guile', { volume: 0.2, loop: true })
    music.play()
    fightSound = this.sound.add('fightSound', { volume: 0.2 })
    fightSound.play()
    kickSound = this.sound.add('kickSound', { volume: 0.2 })
    punchSound = this.sound.add('punchSound', { volume: 0.21 })
  }

  setUpBackground() {
    const background = this.add.image(400, 300, 'background')
    background.scaleX = 2
    background.scaleY = 1.6
  }

  setUpHealthBars() {
    this.makeBar(95, 80, 610, 25, 0xff2222)

    const playerFace = this.add.image(46, 70, 'playerFace')
    playerFace.displayWidth = 64
    playerFace.displayHeight = 64

    this.setUpPlayerMasteryHud()

    healthBarPlayer = this.makeBar(375, 80, 280, 25, 0xeeee44)
    setPlayerValuebar(healthBarPlayer, this.toPercent(lifePlayer, maxLifePlayer))
    this.refreshEnemyUi()
  }

  setUpPlayerMasteryHud() {
    const mastery = this.battleConfig.player.mastery || {}
    const levelLabel = mastery.levelLabel || 'Lv1'
    playerMasteryHud = this.add.container(46, 18)
    playerMasteryGlow = this.add.circle(0, 0, 24, 0x7fe7ff, mastery.canGlow ? 0.22 : 0)
    playerMasteryIcon = this.textures.exists('playerMasteryIcon')
      ? this.add.image(0, 0, 'playerMasteryIcon')
      : this.add.circle(0, 0, 17, 0xffffff, 0.95)
    if ('displayWidth' in playerMasteryIcon) {
      playerMasteryIcon.displayWidth = 34
      playerMasteryIcon.displayHeight = 34
    }
    playerMasteryText = this.add.text(28, -12, levelLabel, {
      font: 'bold 18px Arial',
      fill: '#fff4d6'
    }).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)

    playerMasteryHud.add([playerMasteryGlow, playerMasteryIcon, playerMasteryText])
    playerMasteryHud.setDepth(20)

    if (mastery.canGlow) {
      this.tweens.add({
        targets: playerMasteryGlow,
        scaleX: 1.18,
        scaleY: 1.18,
        alpha: 0.52,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }

    if (mastery.canPulse) {
      playerMasteryPulseRing = this.add.circle(0, 0, 24, 0xffffff, 0)
      playerMasteryPulseRing.setStrokeStyle(2, 0xffffff, 0.65)
      playerMasteryHud.addAt(playerMasteryPulseRing, 0)
      this.tweens.add({
        targets: playerMasteryPulseRing,
        scaleX: 1.45,
        scaleY: 1.45,
        alpha: 0,
        duration: 900,
        repeat: -1,
        ease: 'Quad.easeOut',
        onStart: () => {
          playerMasteryPulseRing.setAlpha(0.8)
          playerMasteryPulseRing.setScale(0.88)
        },
        onRepeat: () => {
          playerMasteryPulseRing.setAlpha(0.8)
          playerMasteryPulseRing.setScale(0.88)
        }
      })
    }

    if (mastery.canOrbit) {
      const orbitColors = [0x7fe7ff, 0xffc778]
      playerMasteryOrbitParticles = orbitColors.map((color, index) => {
        const particle = this.add.circle(0, 0, 3, color, 0.9)
        playerMasteryHud.add(particle)
        particle.orbitOffset = index * Math.PI
        return particle
      })
    }
  }

  updatePlayerMasteryHud() {
    if (!playerMasteryHud || !playerMasteryIcon || !playerMasteryText) {
      return
    }

    const alpha = getMasteryHudAlpha(this.time.now, playerMasteryDimUntil)
    playerMasteryHud.setAlpha(alpha)

    if (Array.isArray(playerMasteryOrbitParticles) && playerMasteryOrbitParticles.length) {
      const orbitRadius = 26
      playerMasteryOrbitParticles.forEach((particle, index) => {
        const angle = this.time.now * 0.0008 * (index % 2 === 0 ? 1 : -1) + particle.orbitOffset
        particle.x = Math.cos(angle) * orbitRadius
        particle.y = Math.sin(angle) * orbitRadius
      })
    }
  }

  dimPlayerMasteryHud(durationMs = 280) {
    playerMasteryDimUntil = Math.max(playerMasteryDimUntil, this.time.now + durationMs)
  }

  triggerPlayerMasteryKillBurst() {
    const mastery = this.battleConfig.player.mastery || {}
    if (!mastery.iconUrl || !this.textures.exists('playerMasteryIcon')) {
      return
    }

    const flash = this.add.rectangle(400, 300, 800, 600, 0xffffff, 0)
    const icon = this.add.image(400, 300, 'playerMasteryIcon')
    icon.setDepth(120)
    flash.setDepth(119)
    icon.setScale(0.18)
    icon.setAlpha(0)

    this.tweens.add({
      targets: flash,
      alpha: 0.28,
      duration: 90,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    })

    this.tweens.add({
      targets: icon,
      scaleX: 8.2,
      scaleY: 8.2,
      alpha: 1,
      duration: 180,
      yoyo: true,
      repeat: 1,
      ease: 'Cubic.easeOut',
      onComplete: () => icon.destroy()
    })
  }

  refreshEnemyUi() {
    this.enemyUi.forEach((item) => {
      item.back?.destroy()
      item.bar?.destroy()
      item.face?.destroy()
      item.label?.destroy()
    })
    this.enemyUi = []

    const living = this.livingEnemies()
    const uiY = living.length > 1 ? [62, 98] : [80]

    living.forEach((enemyState, index) => {
      const y = uiY[index] || 80 + index * 36
      const faceY = living.length > 1 ? 54 + index * 36 : 70
      const back = this.makeBar(425, y, 280, 25, 0xff2222)
      const bar = this.makeBar(425, y, 280, 25, 0xeeee44)
      setEnemyValuebar(bar, this.toPercent(enemyState.life, enemyState.maxLife))

      const face = this.add.image(753, faceY, 'enemyFace')
      face.displayWidth = living.length > 1 ? 46 : 64
      face.displayHeight = living.length > 1 ? 46 : 64

      const markState = this.getDreamCatbugMarkState(enemyState)
      const markText = markState && this.time.now < markState.expiresAt
        ? ` · 梦印 ${this.formatNumber((markState.expiresAt - this.time.now) / 1000)}`
        : ''
      const label = this.add.text(560, y - 18, `${living.length > 1 ? `嘎嘣 ${index + 1}` : this.battleConfig.enemy.name}${markText}`, {
        font: 'bold 15px Arial',
        fill: '#fff'
      }).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)

      enemyState.uiBack = back
      enemyState.uiBar = bar
      enemyState.uiFace = face
      enemyState.label = label
      this.enemyUi.push({ back, bar, face, label })
    })
  }

  makeBar(x, y, xSize, ySize, color) {
    const bar = this.add.graphics()
    bar.fillStyle(color, 1)
    bar.fillRect(0, 0, xSize, ySize)
    bar.x = x
    bar.y = y
    return bar
  }

  handlePlayerHitReward(attackType, totalDamage) {
    const playerId = this.battleConfig.player.id

    if (playerId === 'starter') {
      if (attackType === 'punch' && lifePlayer < maxLifePlayer) {
        const lifeBeforeHeal = lifePlayer
        lifePlayer = roundToTenth(Math.min(maxLifePlayer, lifePlayer + totalDamage * 0.6))

        if (lifePlayer > lifeBeforeHeal) {
          setPlayerValuebar(healthBarPlayer, this.toPercent(lifePlayer, maxLifePlayer))
          this.recordEvent('lifesteal-heal', {
            attackType,
            healAmount: roundToTenth(lifePlayer - lifeBeforeHeal),
            playerLifeAfter: lifePlayer
          })
        }
      }

      if (attackType === 'kick' || attackType === 'kick-follow-up') {
        playerShieldCharges += 1
        this.recordEvent('shield-charge-gained', {
          attackType,
          remainingShieldCharges: playerShieldCharges
        })
      }
    }

    if (playerId === 'tank' && (attackType === 'kick' || attackType === 'kick-follow-up')) {
      playerKickHitStreak += 1
      this.recordEvent('kick-streak-updated', {
        attackType,
        kickHitStreak: playerKickHitStreak
      })
    }

    if ((attackType === 'punch' || attackType === '大蒜-假身J' || attackType === '大蒜-真身J') && playerEquipmentPunchHealCharges > 0 && playerEquipmentPunchHealRatio > 0) {
      const lifeBeforeHeal = lifePlayer
      playerEquipmentPunchHealCharges -= 1
      lifePlayer = roundToTenth(Math.min(maxLifePlayer, lifePlayer + totalDamage * playerEquipmentPunchHealRatio))
      setPlayerValuebar(healthBarPlayer, this.toPercent(lifePlayer, maxLifePlayer))
      this.recordEvent('装备-拳击回血', {
        attackType,
        healAmount: roundToTenth(lifePlayer - lifeBeforeHeal),
        playerLifeAfter: lifePlayer,
        remainingPunchHealCharges: playerEquipmentPunchHealCharges
      })
    }
  }

  shouldPlayerPunchFollowUpHit(index) {
    const target = playerPunchFollowUpTarget

    if (this.battleConfig.player.id === 'striker') {
      if (index === 1) {
        return true
      }

      if (index === 2 && target) {
        const enemy = this.livingEnemies().find((item) => item.id === target.enemyId)
        if (!enemy) {
          return false
        }

        return Math.abs(enemy.sprite.x - target.x) <= 18 && Math.abs(enemy.sprite.y - target.y) <= 30
      }
    }

    return Boolean(this.getEnemyInRange(120, 95, player, target?.enemyId))
  }

  getPunchFollowUpRuleLabel(index) {
    if (this.battleConfig.player.id === 'striker') {
      return index === 1 ? '锁定追击' : '原地脱手追击'
    }

    return '普通追击'
  }

  setUpTexts() {
    this.add.text(375, 77, '决斗', { font: 'bold 28px Arial', fill: '#fff' }).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)
    this.add.text(95, 105, this.battleConfig.player.name, { font: 'bold 20px Arial', fill: '#ea7' }).setShadow(2, 2, 'rgba(0,0,70,1)', 1)
    this.enemyNameText = this.add.text(535, 105, this.battleConfig.enemy.name, { font: 'bold 20px Arial', fill: '#ea7' }).setShadow(2, 2, 'rgba(0,0,70,1)', 1)
    this.levelText = this.add.text(300, 30, `第 ${this.battleConfig.level.id} 关`, { font: 'bold 22px Arial', fill: '#fff' }).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)
    this.add.text(480, 30, `奖励 ${this.battleConfig.level.reward} 朱玥`, { font: 'bold 18px Arial', fill: '#ffd166' }).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)
    scoreTextPlayer = null
    playerStatusText = this.add.text(95, 132, this.getPlayerStatusLabel(), {
      font: 'bold 13px Arial',
      fill: '#d8f3ff'
    }).setShadow(1, 1, 'rgba(0,0,0,0.7)', 1)

    if ((this.battleConfig.invincibleSeconds || 0) > 0) {
      this.add.text(236, 560, `本局开场无敌 ${this.battleConfig.invincibleSeconds} 秒`, { font: 'bold 20px Arial', fill: '#fff6bf' }).setShadow(2, 2, 'rgba(0,0,0,0.55)', 1)
    }

    this.updatePhaseTexts()
  }

  updatePauseSnapshot() {
    this.game.registry.set('pauseSnapshot', {
      levelName: this.battleConfig.level.name,
      playerName: this.battleConfig.player.name,
      enemyName: this.battleConfig.enemy.name,
      equipmentName: this.battleConfig.player.equipment?.name || null,
      score: roundToTenth(scorePlayer),
      playerLife: roundToTenth(lifePlayer),
      playerMaxLife: roundToTenth(maxLifePlayer),
      garlicForm: playerGarlicForm,
      garlicShieldCharges: playerGarlicShieldCharges,
      enemyStates: this.livingEnemies().map((enemyState) => ({
        id: enemyState.id,
        name: enemyState.id === 'enemy-1' ? this.battleConfig.enemy.name : enemyState.id,
        life: roundToTenth(enemyState.life),
        maxLife: roundToTenth(enemyState.maxLife)
      }))
    })
  }

  updatePhaseTexts() {
    if (this.levelText) {
      const phaseSuffix = this.battleConfig.level.battleMode === 'gabeng-split'
        ? ` - 第 ${this.phase} 阶段`
        : ''
      this.levelText.setText(`第 ${this.battleConfig.level.id} 关${phaseSuffix}`)
    }

    if (this.enemyNameText) {
      this.enemyNameText.setText(this.phase === 2 ? '嘎嘣双生体' : this.battleConfig.enemy.name)
    }
  }

  setUpPlatforms() {
    platforms = this.physics.add.staticGroup()
    platforms.create(400, 568, 'ground').setScale(3).refreshBody()
    platforms.setVisible(false)
  }

  setUpInputKeys() {
    keyW = this.addInputKey(Phaser.Input.Keyboard.KeyCodes.W)
    keyA = this.addInputKey(Phaser.Input.Keyboard.KeyCodes.A)
    keyD = this.addInputKey(Phaser.Input.Keyboard.KeyCodes.D)
    keyKick = this.addInputKey(Phaser.Input.Keyboard.KeyCodes.K)
    keyPunch = this.addInputKey(Phaser.Input.Keyboard.KeyCodes.J)
    keyUltimate = this.addInputKey(Phaser.Input.Keyboard.KeyCodes.L)
    keyESC = this.addInputKey(Phaser.Input.Keyboard.KeyCodes.ESC)
  }

  addTimeEvent() {
    this.time.addEvent({
      delay: 5000,
      callback: this.persistLiveState,
      callbackScope: this,
      loop: true
    })
  }

  persistLiveState() {
    if (!loadedEndAnimations && this.token) {
      localStorage.setItem('fightback:last-session', JSON.stringify({
        token: this.token,
        score: scorePlayer,
        level: this.battleConfig.level.id,
        phase: this.phase,
        playerLife: lifePlayer,
        enemyLife: this.livingEnemies().map((enemyState) => ({
          id: enemyState.id,
          life: enemyState.life
        })),
        lastDamageDealt,
        lastDamageTaken,
        debugLog: battleDebugLog.slice(-20),
        updatedAt: new Date().toISOString()
      }))
    }
  }

  recordEvent(type, detail = {}) {
    battleDebugLog.push({
      type,
      at: new Date().toISOString(),
      timeInBattleMs: this.time.now,
      phase: this.phase,
      playerLife: lifePlayer,
      enemyLife: this.livingEnemies().map((enemyState) => ({
        id: enemyState.id,
        life: enemyState.life
      })),
      detail
    })

    if (battleDebugLog.length > 140) {
      battleDebugLog.shift()
    }
  }

  buildBattleSummary() {
    loadedEndAnimations = true
    return {
      score: scorePlayer,
      phase: this.phase,
      playerRemainingLife: lifePlayer,
      enemyRemainingLife: this.livingEnemies().map((enemyState) => ({
        id: enemyState.id,
        life: enemyState.life
      })),
      debugLog: battleDebugLog.slice(-80)
    }
  }

  playAttackSound(attackType) {
    if (String(attackType).includes('punch')) {
      punchSound.play()
      return
    }

    kickSound.play()
  }

  formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1)
  }

  createAnimation(key, sprite, framesArray, frameRate, repeat = 0, repeatDelay = 0) {
      if (this.anims.exists(key)) {
        return
    }

    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(sprite, { frames: framesArray }),
      frameRate,
      repeat,
        repeatDelay
      })
    }

    createAnimationFromConfig(key, sprite, config, fallbackFramesArray, fallbackFrameRate, fallbackRepeat = 0, fallbackRepeatDelay = 0) {
      const framesArray = Array.isArray(config?.frames) && config.frames.length ? config.frames : fallbackFramesArray
      const frameRate = Number(config?.frameRate || fallbackFrameRate)
      const repeat = Number.isFinite(config?.repeat) ? Number(config.repeat) : fallbackRepeat
      const repeatDelay = Number.isFinite(config?.repeatDelay) ? Number(config.repeatDelay) : fallbackRepeatDelay
      this.createAnimation(key, sprite, framesArray, frameRate, repeat, repeatDelay)
    }

  addInputKey(keyCode) {
    return this.input.keyboard.addKey(keyCode)
  }

  moveLeft(target) {
    const enemyState = target === player ? null : this.enemies.find((enemy) => enemy.sprite === target)
    const speed = target === player ? this.getPlayerMoveSpeed() : this.getEnemyMoveSpeed(enemyState)
    target.setVelocityX(-speed)
  }

  moveRight(target) {
    const enemyState = target === player ? null : this.enemies.find((enemy) => enemy.sprite === target)
    const speed = target === player ? this.getPlayerMoveSpeed() : this.getEnemyMoveSpeed(enemyState)
    target.setVelocityX(speed)
  }

  stop(target) {
    target.setVelocityX(0)
  }

  jump(target) {
    const jumpVelocity = target === player
      ? roundToTenth((this.battleConfig.player.stats.jumpVelocity + this.getEquipmentBonusDelta('jumpVelocity')) * (1 + this.getPlayerJumpBoostRatio()))
      : this.battleConfig.enemy.stats.jumpVelocity

    if (target === player) {
      playerJumpState.airborne = true
      playerJumpState.startY = player.y
      playerJumpState.peakY = player.y
    }

    target.setVelocityY(-jumpVelocity)
  }

  doAnim(target, key) {
    if (typeof target !== 'undefined') {
      target.anims.play(key, true)
    }
  }

  stopIfWalking(target) {
    if (target.body.touching.down) {
      this.stop(target)
    }
  }

  availableHitJustDown(hit) {
    return Phaser.Input.Keyboard.JustDown(hit) && !justDownPlayer && this.livingEnemies().length > 0 && lifePlayer > 0
  }

  availableSideIsDown(side) {
    return side.isDown && !justDownPlayer && this.livingEnemies().length > 0 && lifePlayer > 0
  }

  availableJumpIsDown(jumpKey) {
    return jumpKey.isDown && player.body.touching.down && !justDownPlayer && this.livingEnemies().length > 0 && lifePlayer > 0
  }
}

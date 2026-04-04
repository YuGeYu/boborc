import Phaser, { Scene } from 'phaser'
import { SUPER_CABBO_UNLOCK_LEVEL } from '@/data/gameContent'
import { cloneBattleConfig } from '@/game/battleConfig'

let platforms
let player
let score1
let keyE
let youWinSound

const style1 = { font: 'bold 48px Arial', fill: '#fd0' }
const style2 = { font: 'bold 28px Arial', fill: '#fff' }

export default class WinScene extends Scene {
  constructor() {
    super({ key: 'WinScene' })
  }

  init(data) {
    this.token = data.token
    this.score1 = data.score1
    this.battleConfig = data.battleConfig
    this.battleSummary = data.battleSummary || {}
  }

  create() {
    score1 = this.score1 || 0
    youWinSound = this.sound.add('youWinSound', { volume: 0.2 })
    youWinSound.play()
    this.setUpBackground()
    this.setUpPlayer()
    this.setUpWinAnimation()
    this.addTimeEvent()
    this.setUpInputKeys()
  }

  update() {
    if (keyE.isDown) {
      const freshBattleConfig = cloneBattleConfig(this.game.registry.get('initialBattleConfig') || this.battleConfig)
      this.game.events.emit('battle-restart')
      this.scene.start('PlayScene', {
        token: this.token,
        battleConfig: freshBattleConfig
      })
      this.scene.stop()
    }
  }

  addTimeEvent() {
    this.time.addEvent({
      delay: 400,
      callback: this.publishResult,
      callbackScope: this,
      loop: false
    })
  }

  publishResult() {
    const payload = {
      id: `${this.battleConfig.level.id}-win-${Date.now()}`,
      token: this.token || 'local-demo',
      score: score1,
      level: this.battleConfig.level.id,
      isWinner: true,
      reward: this.battleConfig.level.reward,
      playerId: this.battleConfig.player.id,
      playerName: this.battleConfig.player.name,
      enemyName: this.battleConfig.enemy.name,
      summary: {
        ...this.battleSummary,
        outcome: 'win'
      },
      debugLog: this.battleSummary.debugLog || [],
      updatedAt: new Date().toISOString()
    }

    if (this.battleConfig.level.id === SUPER_CABBO_UNLOCK_LEVEL) {
      this.scene.start('SuperCabboUnlockScene', { payload })
      this.scene.stop()
      return
    }

    localStorage.setItem('fightback:last-result', JSON.stringify(payload))
    this.game.events.emit('battle-complete', payload)
  }

  setUpBackground() {
    this.add.image(400, 300, 'sky')
    platforms = this.physics.add.staticGroup()
    platforms.create(400, 568, 'ground').setScale(4).refreshBody()
    this.add.text(300, 240, '胜利', style1).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)
    this.add.text(225, 305, `获得 ${this.battleConfig.level.reward} 朱玥`, style2).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)
    this.add.text(220, 345, '按 E 可直接重打本关', style2).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)
  }

  setUpPlayer() {
    player = this.physics.add.sprite(150, 900, 'brawler')
    player.scale = 3
    player.setCollideWorldBounds(true)
    this.physics.add.collider(player, platforms)
  }

  setUpWinAnimation() {
    if (!this.anims.exists('win')) {
      this.anims.create({
        key: 'win',
        frames: this.anims.generateFrameNumbers('brawler', { frames: [21, 22] }),
        frameRate: 3,
        repeat: -1
      })
    }

    player.anims.play('win', true)
  }

  setUpInputKeys() {
    keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
  }
}

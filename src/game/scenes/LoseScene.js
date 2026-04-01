import Phaser, { Scene } from 'phaser'

let platforms
let player
let keyE
let youLoseSound

export default class LoseScene extends Scene {
  constructor() {
    super({ key: 'LoseScene' })
  }

  init(data) {
    this.token = data.token
    this.score1 = data.score1
    this.battleConfig = data.battleConfig
    this.battleSummary = data.battleSummary || {}
  }

  create() {
    youLoseSound = this.sound.add('youLoseSound', { volume: 0.2 })
    youLoseSound.play()
    this.setUpBackground()
    this.setUpPlayer()
    this.setUpDeathAnimation()
    this.addTimeEvent()
    this.setUpInputKeys()
  }

  update() {
    if (keyE.isDown) {
      this.game.events.emit('battle-restart')
      this.scene.start('PlayScene', {
        token: this.token,
        battleConfig: {
          ...this.battleConfig
        }
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
      id: `${this.battleConfig.level.id}-lose-${Date.now()}`,
      token: this.token || 'local-demo',
      score: this.score1 || 0,
      level: this.battleConfig.level.id,
      isWinner: false,
      reward: 0,
      playerId: this.battleConfig.player.id,
      playerName: this.battleConfig.player.name,
      enemyName: this.battleConfig.enemy.name,
      summary: {
        ...this.battleSummary,
        outcome: 'lose'
      },
      debugLog: this.battleSummary.debugLog || [],
      updatedAt: new Date().toISOString()
    }

    localStorage.setItem('fightback:last-result', JSON.stringify(payload))
    this.game.events.emit('battle-complete', payload)
  }

  setUpBackground() {
    this.add.image(400, 300, 'sky')
    platforms = this.physics.add.staticGroup()
    platforms.create(400, 568, 'ground').setScale(2).refreshBody()
    this.add.text(302, 280, '失败', { font: 'bold 48px Arial', fill: '#f00' }).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)
    this.add.text(220, 336, '按 E 可立刻重试本关', { font: 'bold 24px Arial', fill: '#fff' }).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)
  }

  setUpPlayer() {
    player = this.physics.add.sprite(150, 900, 'brawler')
    player.scale = 3
    player.setCollideWorldBounds(true)
    this.physics.add.collider(player, platforms)
  }

  setUpDeathAnimation() {
    if (!this.anims.exists('die')) {
      this.anims.create({
        key: 'die',
        frames: this.anims.generateFrameNumbers('brawler', { frames: [18, 19, 20] }),
        frameRate: 5
      })
    }

    player.anims.play('die', true)
  }

  setUpInputKeys() {
    keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
  }
}

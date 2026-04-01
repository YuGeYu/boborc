import Phaser, { Scene } from 'phaser'

let platforms
let player
let keyESC

const titleStyle = { font: 'bold 32px Arial', fill: '#1f2937' }
const bodyStyle = { font: 'bold 22px Arial', fill: '#374151' }

export default class PauseScene extends Scene {
  constructor () {
    super({ key: 'PauseScene' })
  }

  create() {
    this.battleConfig = this.game.registry.get('battleConfig') || {}
    this.pauseSnapshot = this.game.registry.get('pauseSnapshot') || {}
    this.setUpInputKeys()
    this.setUpBackground()
    this.setUpPlayer()
    this.setUpIdleAnimation()
    this.setUpTexts()
  }

  update() {
    if (keyESC.isDown) {
      this.scene.resume('PlayScene')
      this.scene.stop()
    }
  }

  setUpInputKeys() {
    keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
  }

  setUpBackground() {
    this.add.image(400, 300, 'sky')
    platforms = this.physics.add.staticGroup()
    platforms.create(400, 568, 'ground').setScale(2).refreshBody()
  }

  setUpTexts() {
    const snapshot = this.pauseSnapshot
    const enemySummary = Array.isArray(snapshot.enemyStates) && snapshot.enemyStates.length
      ? snapshot.enemyStates.map((enemy) => `${this.formatEnemyName(enemy.name)} ${enemy.life}/${enemy.maxLife}`).join(' / ')
      : `${this.battleConfig.enemy?.name || '敌人'} 未知`

    this.add.text(300, 92, '已暂停', titleStyle)
    this.add.text(212, 138, '按 ESC 返回战斗', bodyStyle)
    this.add.text(88, 215, `当前关卡：${snapshot.levelName || this.battleConfig.level?.name || '--'}`, bodyStyle)
    this.add.text(88, 255, `出战角色：${snapshot.playerName || this.battleConfig.player?.name || '--'}`, bodyStyle)
    this.add.text(88, 295, `装备：${snapshot.equipmentName || '不使用装备'}`, bodyStyle)
    this.add.text(88, 335, `玩家生命：${snapshot.playerLife ?? '--'} / ${snapshot.playerMaxLife ?? '--'}`, bodyStyle)
    this.add.text(88, 375, `敌方状态：${enemySummary}`, bodyStyle)
    this.add.text(88, 415, `当前得分：${snapshot.score ?? 0}`, bodyStyle)
  }

  formatEnemyName(value) {
    if (value === 'enemy-1') {
      return this.battleConfig.enemy?.name || '敌人一号'
    }

    if (value === 'gabeng-left') {
      return '左侧嘎嘣'
    }

    if (value === 'gabeng-right') {
      return '右侧嘎嘣'
    }

    return value || '敌方目标'
  }

  setUpPlayer() {
    player = this.physics.add.sprite(100, 450, 'brawler')
    player.setBounce(0.2)
    player.setCollideWorldBounds(true)
    this.physics.add.collider(player, platforms)
  }

  setUpIdleAnimation() {
    if (!this.anims.exists('idle')) {
      this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('brawler', { frames: [5, 6, 7, 8] }),
        frameRate: 8,
        repeat: -1
      })
    }

    player.anims.play('idle', true)
  }
}

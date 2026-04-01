import { Scene } from 'phaser'

export default class SuperCabboUnlockScene extends Scene {
  constructor() {
    super({ key: 'SuperCabboUnlockScene' })
  }

  init(data) {
    this.payload = data.payload
  }

  create() {
    const { width, height } = this.scale
    const centerX = width / 2
    const centerY = height / 2

    this.cameras.main.setBackgroundColor('#080b16')

    const title = this.add.text(centerX, 90, '超级鸽吻开始分裂', {
      font: 'bold 42px "Microsoft YaHei", "PingFang SC", sans-serif',
      fill: '#fff1a6'
    }).setOrigin(0.5)

    const subtitle = this.add.text(centerX, 145, '一份化为你的新角色，一份振翅飞离战场', {
      font: '28px "Microsoft YaHei", "PingFang SC", sans-serif',
      fill: '#ffffff'
    }).setOrigin(0.5)

    const flash = this.add.circle(centerX, centerY, 70, 0xffe066, 0.95)
    const leftCabbo = this.add.sprite(centerX, centerY + 20, 'brawler2').setScale(3.2)
    const rightCabbo = this.add.sprite(centerX, centerY + 20, 'brawler2').setScale(3.2)
    rightCabbo.flipX = true

    const bottomText = this.add.text(centerX, height - 92, '获得新角色：鸽吻', {
      font: 'bold 34px "Microsoft YaHei", "PingFang SC", sans-serif',
      fill: '#8ff7d9'
    }).setOrigin(0.5)

    const hint = this.add.text(centerX, height - 50, '动画结束后将自动结算本局奖励', {
      font: '22px "Microsoft YaHei", "PingFang SC", sans-serif',
      fill: '#dce6ff'
    }).setOrigin(0.5)

    this.tweens.add({
      targets: flash,
      scaleX: 8,
      scaleY: 8,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut'
    })

    this.tweens.add({
      targets: leftCabbo,
      x: centerX - 180,
      y: centerY + 10,
      angle: -8,
      duration: 1200,
      ease: 'Sine.easeOut'
    })

    this.tweens.add({
      targets: rightCabbo,
      x: centerX + 260,
      y: centerY - 140,
      angle: 22,
      duration: 1350,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: rightCabbo,
          x: width + 180,
          y: centerY - 240,
          alpha: 0.2,
          duration: 900,
          ease: 'Quad.easeIn'
        })
      }
    })

    this.tweens.add({
      targets: [title, subtitle, bottomText, hint],
      alpha: { from: 0, to: 1 },
      duration: 550,
      ease: 'Quad.easeOut'
    })

    this.time.delayedCall(2600, () => {
      localStorage.setItem('fightback:last-result', JSON.stringify(this.payload))
      this.game.events.emit('battle-complete', this.payload)
      this.scene.stop()
    })
  }
}

import { Scene } from 'phaser'
import sky from '@/game/assets/sky.png'
import background from '@/game/assets/background-700x400.png'
import ground from '@/game/assets/platform.png'
import brawler from '@/game/assets/ken.png'
import brawler2 from '@/game/assets/character3.png'
import theme from '@/game/assets/GuileTheme.ogg'
import fightSound from '@/game/assets/Fight.mp3'
import youLoseSound from '@/game/assets/YouLose.mp3'
import youWinSound from '@/game/assets/YouWin.mp3'
import kickSound from '@/game/assets/KickSound.mp3'
import punchSound from '@/game/assets/PunchSound.mp3'

const style = { font: 'bold 32px Arial', fill: '#fff', boundsAlignH: 'center', boundsAlignV: 'middle' }

export default class BootScene extends Scene {
  constructor () {
    super({ key: 'BootScene' })
  }

  preload () {
    const battleConfig = this.game.registry.get('battleConfig') || {}
    const playerSpriteSheetConfig = battleConfig?.player?.battleSpriteSheetConfig || {}

    this.load.image('sky', sky)
    this.load.image('background', background)
    this.load.image('ground', ground)
    this.load.audio('guile', theme)
    this.load.audio('fightSound', fightSound)
    this.load.audio('youLoseSound', youLoseSound)
    this.load.audio('youWinSound', youWinSound)
    this.load.audio('kickSound', kickSound)
    this.load.audio('punchSound', punchSound)
    this.load.spritesheet('brawler', battleConfig?.player?.battleSpriteSheet || brawler, {
      frameWidth: playerSpriteSheetConfig.frameWidth || 67,
      frameHeight: playerSpriteSheetConfig.frameHeight || 113
    })
    this.load.spritesheet('brawler2', brawler2, { frameWidth: 67, frameHeight: 113 })
  }

  create() {
    this.add.image(400, 300, 'sky')
    this.add.text(285, 300, 'Loading...', style).setShadow(3, 3, 'rgba(0,0,0,0.5)', 2)

    const token = new URL(location.href).searchParams.get('token') || 'local-demo'
    const battleConfig = this.game.registry.get('battleConfig')
    const projectileAssets = [
      ...this.collectProjectileAssets(battleConfig.player?.abilities?.attackProjectiles),
      ...this.collectEnemyProjectileAssets(battleConfig.enemy?.abilities)
    ]

    this.load.image('playerFace', battleConfig.player.avatar)
    this.load.image('enemyFace', battleConfig.enemy.avatar)
    if (battleConfig.player?.mastery?.iconUrl) {
      this.load.image('playerMasteryIcon', battleConfig.player.mastery.iconUrl)
    }
    projectileAssets.forEach(({ textureKey, asset }) => {
      this.load.image(textureKey, asset)
    })
    this.load.once('complete', () => {
      this.scene.start('PlayScene', { token, battleConfig })
    })
    this.load.start()
  }

  collectProjectileAssets(projectileConfig) {
    if (!projectileConfig) {
      return []
    }

    const assetMap = new Map()
    const buckets = [
      ...(Array.isArray(projectileConfig.punch) ? projectileConfig.punch : []),
      ...(Array.isArray(projectileConfig.kick) ? projectileConfig.kick : []),
      ...(Array.isArray(projectileConfig.extra) ? projectileConfig.extra : [])
    ]

    buckets.forEach((item) => {
      if (!item?.textureKey || !item?.asset) {
        return
      }

      assetMap.set(item.textureKey, {
        textureKey: item.textureKey,
        asset: item.asset
      })
    })

    return [...assetMap.values()]
  }

  collectEnemyProjectileAssets(enemyAbilities) {
    if (!enemyAbilities?.gabengArrow?.textureKey || !enemyAbilities?.gabengArrow?.asset) {
      return []
    }

    return [{
      textureKey: enemyAbilities.gabengArrow.textureKey,
      asset: enemyAbilities.gabengArrow.asset
    }]
  }
}

import Phaser from 'phaser'
import BootScene from '@/game/scenes/BootScene'
import PlayScene from '@/game/scenes/PlayScene'
import WinScene from '@/game/scenes/WinScene'
import PauseScene from '@/game/scenes/PauseScene'
import LoseScene from '@/game/scenes/LoseScene'
import SuperCabboUnlockScene from '@/game/scenes/SuperCabboUnlockScene'
import { cloneBattleConfig } from '@/game/battleConfig'

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch (error) {
    return false
  }
}

function shouldPreferCanvas() {
  const userAgent = window.navigator.userAgent.toLowerCase()
  return userAgent.includes('firefox')
}

function resolveRendererType() {
  if (shouldPreferCanvas()) {
    return Phaser.CANVAS
  }

  return canUseWebGL() ? Phaser.WEBGL : Phaser.CANVAS
}

function createGame(containerId, battleConfig, rendererType) {
  return new Phaser.Game({
    type: rendererType,
    width: 800,
    height: 600,
    parent: containerId,
    backgroundColor: '#111827',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 1200 },
        debug: false
      }
    },
    scene: [BootScene, PlayScene, WinScene, PauseScene, LoseScene, SuperCabboUnlockScene]
  })
}

function launch(containerId, battleConfig, onBattleEnd = () => {}, onBattleRestart = () => {}) {
  const rendererType = resolveRendererType()
  let game
  const battleConfigSnapshot = cloneBattleConfig(battleConfig)

  try {
    game = createGame(containerId, battleConfigSnapshot, rendererType)
  } catch (error) {
    if (rendererType === Phaser.CANVAS) {
      throw error
    }

    game = createGame(containerId, battleConfigSnapshot, Phaser.CANVAS)
  }

  game.registry.set('battleConfig', cloneBattleConfig(battleConfigSnapshot))
  game.registry.set('initialBattleConfig', cloneBattleConfig(battleConfigSnapshot))
  game.events.on('battle-complete', onBattleEnd)
  game.events.on('battle-restart', onBattleRestart)

  return game
}

export default launch
export { launch }

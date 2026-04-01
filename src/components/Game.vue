<template>
  <div ref="shell" class="game-shell" tabindex="-1">
    <div class="game-frame">
      <div v-if="downloaded" :id="containerId" class="game-mount" />
      <div v-else-if="loadingError" class="placeholder error-state">
        <div class="error-copy">
          <strong>游戏启动失败</strong>
          <span>{{ loadingError }}</span>
          <button class="retry-btn" type="button" @click="relaunchGame">重新加载战斗</button>
        </div>
      </div>
      <div v-else class="placeholder">
        正在加载战斗资源...
      </div>
    </div>
    <p class="hint">
      键盘操作：A / D 移动，W 跳跃，J 拳击，K 飞踢，Esc 暂停。
    </p>
  </div>
</template>

<script>
const GAME_IMPORT_TIMEOUT_MS = 15000

export default {
  props: {
    battleConfig: {
      type: Object,
      required: true
    },
    battleKey: {
      type: String,
      required: true
    }
  },
  emits: ['battle-complete', 'battle-restart', 'game-ready'],
  data() {
    return {
      downloaded: false,
      gameInstance: null,
      containerId: 'game-container',
      loadingError: ''
    }
  },
  async mounted() {
    window.addEventListener('keydown', this.handleWindowKeydown, true)
    await this.relaunchGame()
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleWindowKeydown, true)
    if (this.gameInstance) {
      this.gameInstance.destroy(true)
    }
  },
  watch: {
    battleKey() {
      this.relaunchGame()
    }
  },
  methods: {
    delay(ms) {
      return new Promise((resolve) => {
        window.setTimeout(resolve, ms)
      })
    },
    getErrorMessage(error) {
      if (!error) {
        return ''
      }

      if (typeof error === 'string') {
        return error
      }

      return [
        error.message,
        error.name,
        error.type,
        error.request
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    },
    classifyImportError(error) {
      const message = this.getErrorMessage(error)

      if (error?.code === 'IMPORT_TIMEOUT' || !navigator.onLine) {
        return 'network-timeout'
      }

      if (
        message.includes('chunkloaderror') ||
        message.includes('loading chunk') ||
        message.includes('failed to fetch dynamically imported module') ||
        message.includes('importing a module script failed') ||
        message.includes('missing')
      ) {
        return 'version-mismatch'
      }

      if (
        message.includes('blocked') ||
        message.includes('err_blocked_by_client') ||
        message.includes('content security policy') ||
        message.includes('csp') ||
        message.includes('denied')
      ) {
        return 'browser-blocked'
      }

      return 'network-timeout'
    },
    buildImportErrorMessage(errorType, attempt) {
      if (errorType === 'version-mismatch') {
        return attempt > 1
          ? '检测到页面资源版本不一致。通常是页面缓存了旧脚本，请刷新页面后重试。'
          : '页面资源可能刚更新，正在重新尝试加载最新脚本...'
      }

      if (errorType === 'browser-blocked') {
        return attempt > 1
          ? '浏览器或扩展可能拦截了游戏脚本。请关闭脚本拦截插件后重试，或改用 Chrome / Edge。'
          : '浏览器可能拦截了游戏脚本，正在重新尝试加载...'
      }

      return attempt > 1
        ? '网络连接较慢或请求超时，脚本资源仍未加载成功，请刷新页面后重试。'
        : '脚本加载较慢，正在自动重试一次...'
    },
    async importGameModuleWithRetry() {
      let lastError = null

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          return await Promise.race([
            import(/* webpackChunkName: "game" */ '@/game/game'),
            new Promise((_, reject) => {
              window.setTimeout(() => {
                const timeoutError = new Error('Import timeout')
                timeoutError.code = 'IMPORT_TIMEOUT'
                reject(timeoutError)
              }, GAME_IMPORT_TIMEOUT_MS)
            })
          ])
        } catch (error) {
          lastError = error
          const errorType = this.classifyImportError(error)
          this.loadingError = this.buildImportErrorMessage(errorType, attempt)

          if (attempt < 2) {
            await this.delay(1200)
            continue
          }

          error.userFacingType = errorType
          throw error
        }
      }

      throw lastError || new Error('Unknown import failure')
    },
    handleWindowKeydown(event) {
      if (event.code === 'Space') {
        event.preventDefault()
        event.stopPropagation()
      }
    },
    async relaunchGame() {
      this.loadingError = ''
      this.downloaded = false

      if (this.gameInstance) {
        this.gameInstance.destroy(true)
        this.gameInstance = null
      }

      let game

      try {
        game = await this.importGameModuleWithRetry()
      } catch (error) {
        const errorType = error.userFacingType || this.classifyImportError(error)
        this.loadingError = this.buildImportErrorMessage(errorType, 2)
        return
      }

      this.downloaded = true
      await this.$nextTick()

      try {
        if (this.$refs.shell && typeof this.$refs.shell.focus === 'function') {
          this.$refs.shell.focus()
        }

        const mountNode = document.getElementById(this.containerId)
        if (!mountNode) {
          throw new Error('Game container not found')
        }

        this.gameInstance = game.launch(
          this.containerId,
          this.battleConfig,
          (payload) => {
            this.$emit('battle-complete', payload)
          },
          () => {
            this.$emit('battle-restart')
          }
        )

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.$emit('game-ready')
          })
        })
      } catch (error) {
        this.downloaded = false
        this.loadingError = '当前浏览器未能正常初始化战斗画面，请刷新后重试，或改用 Chrome / Edge。'
      }
    }
  }
}
</script>

<style scoped lang="scss">
.game-shell {
  display: grid;
  gap: 14px;
  justify-items: center;
  outline: none;
}

.game-frame {
  width: 100%;
  overflow: hidden;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
}

.game-mount {
  display: flex;
  justify-content: center;
}

.game-mount :deep(canvas) {
  display: block;
  width: 100%;
  max-width: 800px;
  height: auto;
  margin: 0 auto;
}

.placeholder {
  display: grid;
  place-items: center;
  min-height: 320px;
  padding: 24px;
  color: #f4f1e8;
  font-size: 1.25rem;
  font-family: 'Courier New', Courier, monospace;
}

.error-state {
  background: rgba(22, 24, 33, 0.92);
}

.error-copy {
  display: grid;
  gap: 12px;
  justify-items: center;
  text-align: center;
  max-width: 520px;
}

.retry-btn {
  min-height: 42px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #f59e0b;
  color: #1f2937;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.retry-btn:hover {
  background: #fbbf24;
}

.hint {
  margin: 0;
  color: #b7bfd3;
  font-size: 0.95rem;
  text-align: center;
}
</style>

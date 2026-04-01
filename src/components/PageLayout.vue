<template>
  <div class="page-stage" :class="`page-stage--${currentPage}`">
    <div class="ambient ambient-a"></div>
    <div class="ambient ambient-b"></div>
    <div class="ambient ambient-c"></div>
    <div class="ambient-grid"></div>

    <div class="app-shell">
      <header class="topbar glass-panel">
        <div class="brand-block">
          <p class="eyebrow">BOBO SQUAD STRIKE</p>
          <h1>{{ title }}</h1>
          <p class="subtitle">{{ subtitle }}</p>
        </div>

        <div class="brand-side">
          <div class="brand-chip">
            <span class="brand-chip__label">游戏名称</span>
            <strong>《嘎嘣小队出击》</strong>
          </div>
        </div>
      </header>

      <aside v-if="showMobileNotice" class="mobile-notice panel">
        <strong>移动端提示</strong>
        <p>当前检测到你正在使用手机或平板访问。本作的战斗操作与页面交互按 PC 键鼠体验设计，建议改用电脑打开网站游玩。</p>
      </aside>

      <main class="content-shell">
        <slot />
      </main>

      <footer class="site-footer glass-panel">
        <span>《嘎嘣小队出击》 v{{ buildMeta.version }}</span>
      </footer>
    </div>
  </div>
</template>
<script>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { buildMeta } from '@/generated/buildMeta'
import menuSelectSfx from '@/assets/audio/ui/menu-select.ogg'
import menuConfirmSfx from '@/assets/audio/ui/menu-confirm.ogg'
import menuOpenSfx from '@/assets/audio/ui/menu-open.ogg'
import menuCloseSfx from '@/assets/audio/ui/menu-close.ogg'
import menuTabSfx from '@/assets/audio/ui/menu-tab.ogg'

export default {
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    currentPage: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const showMobileNotice = ref(false)
    const hasUserActivatedAudio = ref(false)
    let selectAudio = null
    let confirmAudio = null
    let openAudio = null
    let closeAudio = null
    let tabAudio = null

    function handleContextMenu(event) {
      event.preventDefault()
    }

    function detectMobileDevice() {
      const ua = window.navigator.userAgent.toLowerCase()
      const isTouchDevice = window.matchMedia?.('(pointer: coarse)').matches
      showMobileNotice.value = /android|iphone|ipad|ipod|mobile|windows phone/.test(ua) || Boolean(isTouchDevice && window.innerWidth <= 980)
    }

    function createAudio(src, { loop = false, volume = 0.35 } = {}) {
      const audio = new Audio(src)
      audio.preload = 'auto'
      audio.loop = loop
      audio.volume = volume
      return audio
    }

    function playCue(audio) {
      if (!audio || !hasUserActivatedAudio.value) {
        return
      }

      const instance = audio.cloneNode()
      instance.volume = audio.volume
      instance.play().catch(() => {})
    }

    function resolveUiSound(target) {
      const explicitSound = target?.dataset?.uiSound
      if (explicitSound) {
        return explicitSound
      }

      if (target?.classList?.contains('modal-close')) {
        return 'close'
      }

      if (target?.classList?.contains('page-tab') || target?.classList?.contains('page-nav') || target?.classList?.contains('page-number')) {
        return 'tab'
      }

      if (target?.classList?.contains('avatar-tile') || target?.classList?.contains('level-card')) {
        return 'select'
      }

      if (target?.matches?.('button, a, [role="button"]')) {
        return 'confirm'
      }

      return ''
    }

    function handlePointerActivate() {
      if (!hasUserActivatedAudio.value) {
        hasUserActivatedAudio.value = true
      }
    }

    function handleUiPointerDown(event) {
      handlePointerActivate()

      const target = event.target instanceof Element
        ? event.target.closest('[data-ui-sound], button, a, [role="button"], .avatar-tile, .level-card, .page-tab, .page-nav, .page-number, .modal-close')
        : null

      if (!target || target.closest('.game-shell')) {
        return
      }

      const soundType = resolveUiSound(target)
      if (soundType === 'select') {
        playCue(selectAudio)
        return
      }

      if (soundType === 'open') {
        playCue(openAudio)
        return
      }

      if (soundType === 'close') {
        playCue(closeAudio)
        return
      }

      if (soundType === 'tab') {
        playCue(tabAudio)
        return
      }

      if (soundType === 'confirm') {
        playCue(confirmAudio)
      }
    }

    onMounted(() => {
      selectAudio = createAudio(menuSelectSfx, { volume: 0.34 })
      confirmAudio = createAudio(menuConfirmSfx, { volume: 0.34 })
      openAudio = createAudio(menuOpenSfx, { volume: 0.32 })
      closeAudio = createAudio(menuCloseSfx, { volume: 0.3 })
      tabAudio = createAudio(menuTabSfx, { volume: 0.28 })
      window.addEventListener('contextmenu', handleContextMenu)
      window.addEventListener('pointerdown', handleUiPointerDown, true)
      detectMobileDevice()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('pointerdown', handleUiPointerDown, true)
      selectAudio = null
      confirmAudio = null
      openAudio = null
      closeAudio = null
      tabAudio = null
    })

    return {
      buildMeta,
      showMobileNotice
    }
  }
}
</script>

<style lang="scss">
:root {
  --bg-base: #081522;
  --bg-surface: rgba(10, 22, 37, 0.6);
  --panel: rgba(12, 26, 43, 0.58);
  --panel-strong: rgba(14, 30, 48, 0.78);
  --panel-border: rgba(167, 226, 255, 0.16);
  --panel-shadow: 0 28px 80px rgba(2, 8, 20, 0.42);
  --text-main: #eff8ff;
  --text-soft: rgba(228, 241, 255, 0.86);
  --text-muted: rgba(177, 205, 228, 0.76);
  --accent: #7fe7ff;
  --accent-2: #90a6ff;
  --accent-3: #ffc778;
  --success: #87ffb7;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
  margin: 0;
}

body {
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
  color: var(--text-main);
  background:
    radial-gradient(circle at 15% 20%, rgba(62, 181, 255, 0.24), transparent 24%),
    radial-gradient(circle at 80% 18%, rgba(153, 117, 255, 0.2), transparent 20%),
    radial-gradient(circle at 68% 78%, rgba(255, 180, 93, 0.18), transparent 26%),
    linear-gradient(145deg, #050d17 0%, #09172a 38%, #07111f 100%);
  overflow-x: hidden;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(180deg, rgba(255, 255, 255, 0.48), transparent 88%);
  pointer-events: none;
  opacity: 0.24;
}

a {
  color: inherit;
  text-decoration: none;
}

.page-stage {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
}

.ambient {
  position: fixed;
  border-radius: 50%;
  filter: blur(24px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.8;
}

.ambient-a {
  top: -120px;
  left: -80px;
  width: 360px;
  height: 360px;
  background:
    radial-gradient(circle, rgba(122, 238, 255, 0.42) 0%, rgba(122, 238, 255, 0.05) 62%, transparent 76%);
  animation: ambientFloat 18s ease-in-out infinite;
}

.ambient-b {
  top: 20vh;
  right: -120px;
  width: 420px;
  height: 420px;
  background:
    radial-gradient(circle, rgba(147, 160, 255, 0.34) 0%, rgba(147, 160, 255, 0.08) 58%, transparent 74%);
  animation: ambientFloatAlt 22s ease-in-out infinite;
}

.ambient-c {
  bottom: -120px;
  left: 42%;
  width: 440px;
  height: 440px;
  background:
    radial-gradient(circle, rgba(255, 190, 105, 0.28) 0%, rgba(255, 190, 105, 0.04) 60%, transparent 76%);
  animation: ambientPulse 14s ease-in-out infinite;
}

.ambient-grid {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.12), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 24%);
  pointer-events: none;
  z-index: 0;
}

.app-shell {
  position: relative;
  z-index: 1;
  width: min(1320px, calc(100% - 28px));
  margin: 0 auto;
  padding: 26px 0 48px;
}

.glass-panel,
.panel,
.shop-card,
.level-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--panel-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.03)),
    linear-gradient(145deg, rgba(12, 26, 43, 0.74), rgba(9, 19, 34, 0.54));
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
}

.glass-panel::before,
.panel::before,
.shop-card::before,
.level-card::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background:
    linear-gradient(140deg, rgba(255, 255, 255, 0.18), transparent 26%, transparent 68%, rgba(127, 231, 255, 0.12)),
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.18), transparent 28%);
  pointer-events: none;
}

.glass-panel::after,
.panel::after,
.shop-card::after,
.level-card::after {
  content: '';
  position: absolute;
  inset: auto -18% -55% 28%;
  height: 140px;
  background: radial-gradient(circle, rgba(127, 231, 255, 0.12), transparent 70%);
  filter: blur(18px);
  pointer-events: none;
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  margin-bottom: 20px;
  padding: 24px;
  border-radius: 32px;
}

.brand-block,
.brand-side,
.brand-chip,
.panel,
.shop-card,
.level-card,
.site-footer,
.btn {
  position: relative;
  z-index: 1;
}

.brand-side {
  display: grid;
  gap: 12px;
  align-content: center;
  min-width: min(100%, 260px);
}

.brand-chip {
  padding: 14px 16px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05));
}

.brand-chip strong {
  display: block;
  font-size: 1.02rem;
  color: #ffffff;
}

.brand-chip__label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.28em;
}

.topbar h1 {
  margin: 0;
  font-size: clamp(2.1rem, 4.5vw, 4rem);
  line-height: 0.96;
  letter-spacing: 0.02em;
}

.subtitle {
  margin: 12px 0 0;
  max-width: 62ch;
  color: var(--text-soft);
  line-height: 1.75;
}

.content-shell {
  display: grid;
  gap: 20px;
}

.mobile-notice {
  display: grid;
  gap: 8px;
  margin-bottom: 20px;
  border-color: rgba(255, 199, 120, 0.28);
  background:
    linear-gradient(180deg, rgba(255, 217, 160, 0.12), rgba(255, 255, 255, 0.03)),
    linear-gradient(145deg, rgba(44, 30, 12, 0.74), rgba(26, 19, 9, 0.54));
}

.mobile-notice p,
.mobile-notice strong {
  margin: 0;
}

.mobile-notice strong {
  color: #ffe3ad;
}

.page-grid,
.stats-grid {
  display: grid;
  gap: 18px;
}

.stats-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.panel {
  padding: 20px;
  border-radius: 28px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-header h2,
.panel-header h3,
.panel h2,
.panel h3 {
  margin: 0;
}

.panel-header span,
.muted,
.panel p,
.panel li,
.panel small {
  color: var(--text-muted);
}

.hero-card {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 10px 18px;
  border: 1px solid rgba(127, 231, 255, 0.22);
  border-radius: 16px;
  cursor: pointer;
  background:
    linear-gradient(135deg, rgba(127, 231, 255, 0.9), rgba(144, 166, 255, 0.82));
  color: #031120;
  font-weight: 800;
  box-shadow: 0 16px 34px rgba(86, 192, 255, 0.26);
  transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 20px 42px rgba(86, 192, 255, 0.34);
  filter: brightness(1.05);
}

.btn.secondary {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.06));
  color: var(--text-main);
  border-color: rgba(255, 255, 255, 0.14);
  box-shadow: 0 16px 34px rgba(4, 12, 24, 0.22);
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.avatar-card {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 14px;
  align-items: center;
}

.avatar-card img,
.shop-card img {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 14px 32px rgba(2, 8, 20, 0.24);
}

.shop-grid,
.level-grid {
  display: grid;
  gap: 12px;
}

.shop-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.shop-card,
.level-card {
  padding: 16px;
  border-radius: 22px;
}

.level-grid {
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.level-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-main);
  text-align: left;
  cursor: pointer;
}

.level-card.active,
.shop-card.selected {
  outline: 2px solid rgba(127, 231, 255, 0.72);
}

.level-card.locked {
  opacity: 0.45;
  cursor: not-allowed;
}

.stat-number {
  font-size: clamp(2.1rem, 5vw, 3rem);
  font-weight: 900;
  letter-spacing: 0.02em;
  color: #ffffff;
}

.site-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-top: 22px;
  padding: 14px 18px;
  border-radius: 22px;
  color: var(--text-muted);
  font-size: 0.92rem;
}

input,
textarea,
select {
  color: var(--text-main);
}

::selection {
  background: rgba(127, 231, 255, 0.22);
}

@keyframes ambientFloat {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(30px, 45px, 0) scale(1.08); }
}

@keyframes ambientFloatAlt {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-38px, 32px, 0) scale(0.92); }
}

@keyframes ambientPulse {
  0%, 100% { transform: scale(0.94); opacity: 0.64; }
  50% { transform: scale(1.05); opacity: 0.95; }
}

@media (max-width: 980px) {
  .topbar,
  .hero-card,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .brand-side {
    min-width: 0;
  }
}

@media (max-width: 720px) {
  .app-shell {
    width: min(100% - 20px, 1320px);
    padding-top: 18px;
  }

  .topbar,
  .panel {
    border-radius: 24px;
  }

  .avatar-card {
    grid-template-columns: 1fr;
  }
}
</style>

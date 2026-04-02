<template>
  <PageLayout
    title="角色图鉴"
    subtitle="默认展示头像阵列。点击头像后以横向模态框查看该角色的固定属性区与分页机制区。"
    current-page="shop"
  >
    <section class="catalog-shell">
      <article class="panel catalog-hero">
        <div class="hero-copy">
          <span class="hero-kicker">角色总览</span>
          <h2>头像阵列 + 固定详情面板</h2>
          <p>图鉴默认只展示头像，适合持续扩充角色数量；点击头像后会进入固定布局的详情模态框，统一查看数值与机制。</p>
        </div>

        <div class="hero-wallet">
          <span>当前 {{ currencyLabel }}</span>
          <strong>{{ progress.zhuYue }}</strong>
          <small>详情框内可直接招募或切换出战角色。</small>
        </div>
      </article>

      <article class="panel">
        <div class="catalog-toolbar">
          <div>
            <h2>头像图鉴</h2>
            <p>当前共有 {{ characters.length }} 名角色。点击头像查看详情。</p>
          </div>

          <div class="action-row">
            <a class="btn secondary" href="./index.html">返回大厅</a>
            <a class="btn secondary" href="./profile.html">个人主页</a>
            <a class="btn secondary" href="./world.html">世界</a>
          </div>
        </div>

        <div class="avatar-grid">
          <button
            v-for="character in characters"
            :key="character.id"
            type="button"
            class="avatar-tile"
            data-ui-sound="open"
            :class="{ selected: progress.selectedCharacterId === character.id, locked: !isCharacterUnlocked(character.id) }"
            @click="openCharacterModal(character)"
          >
            <div class="avatar-frame">
              <img :src="character.avatar" :alt="character.name">
            </div>
            <strong>{{ character.name }}</strong>
            <span>{{ character.title }}</span>
            <em>{{ isCharacterUnlocked(character.id) ? '已解锁' : '未解锁' }}</em>
          </button>
        </div>
      </article>
    </section>

    <div
      v-if="activeCharacter"
      class="modal-overlay"
      @click.self="closeCharacterModal"
    >
      <article class="modal-card panel">
        <button type="button" class="modal-close" data-ui-sound="close" @click="closeCharacterModal">关闭</button>

        <div class="detail-layout">
          <section class="detail-left">
            <div class="portrait-shell">
              <img :src="activeCharacter.avatar" :alt="activeCharacter.name">
            </div>

            <div class="profile-card">
              <h2>{{ activeCharacter.name }}</h2>
              <p>{{ getUnlockLine(activeCharacter) }}</p>

              <div class="action-stack">
                <button
                  v-if="!isCharacterUnlocked(activeCharacter.id) && activeCharacter.unlockCost !== null"
                  class="btn"
                  :disabled="progress.zhuYue < activeCharacter.unlockCost"
                  @click="purchaseAndRefresh(activeCharacter.id)"
                >
                  招募角色
                </button>

                <button
                  v-else-if="!isCharacterUnlocked(activeCharacter.id)"
                  class="btn secondary"
                  disabled
                >
                  {{ activeCharacter.unlockRequirement || '暂不可获得' }}
                </button>

                <button
                  v-else
                  class="btn secondary"
                  @click="selectAndRefresh(activeCharacter.id)"
                >
                  {{ progress.selectedCharacterId === activeCharacter.id ? '当前出战中' : '设为出战角色' }}
                </button>
              </div>
            </div>
          </section>

          <section class="detail-right">
            <div class="stats-board compact">
              <div class="stat-chip">
                <span>生命</span>
                <strong>{{ activeCharacter.stats.health }}</strong>
              </div>
              <div class="stat-chip">
                <span>移动速度</span>
                <strong>{{ activeCharacter.stats.moveSpeed }}</strong>
              </div>
              <div class="stat-chip">
                <span>跳跃力度</span>
                <strong>{{ activeCharacter.stats.jumpVelocity }}</strong>
              </div>
              <div class="stat-chip">
                <span>拳击伤害</span>
                <strong>{{ activeCharacter.stats.punchDamage }}</strong>
              </div>
              <div class="stat-chip">
                <span>飞踢伤害</span>
                <strong>{{ activeCharacter.stats.kickDamage }}</strong>
              </div>
              <div class="stat-chip">
                <span>拳击冷却</span>
                <strong>{{ attackCooldownText.punch }}</strong>
              </div>
              <div class="stat-chip">
                <span>飞踢冷却</span>
                <strong>{{ attackCooldownText.kick }}</strong>
              </div>
              <div class="stat-chip highlight">
                <span>角色定位</span>
                <strong>{{ formatMechanic(activeCharacter.title) }}</strong>
              </div>
            </div>

            <div class="mechanic-panel">
              <div class="page-tabs">
                <button
                  v-for="page in mechanicPages"
                  :key="page.id"
                  type="button"
                  class="page-tab"
                  data-ui-sound="tab"
                  :class="{ active: activeMechanicPage === page.id }"
                  @click="activeMechanicPage = page.id"
                >
                  {{ page.label }}
                </button>
              </div>

              <div class="mechanic-grid">
                <section
                  v-for="item in currentMechanicItems"
                  :key="item.title"
                  class="mechanic-card"
                >
                  <span>{{ item.title }}</span>
                  <p>{{ item.content }}</p>
                </section>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  </PageLayout>
</template>

<script>
import { computed, ref } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { useGameState } from '@/state/useGameState'

export default {
  components: { PageLayout },
  setup() {
    const state = useGameState()
    const activeCharacter = ref(null)
    const activeMechanicPage = ref('page-1')

    function formatMechanic(text) {
      const normalized = String(text || '').trim()
      return normalized || '无额外机制说明'
    }

    function getUnlockLine(character) {
      if (character.unlockCost !== null) {
        return `招募价 ${character.unlockCost} ${state.currencyLabel}`
      }
      return character.unlockRequirement || '当前版本无可计算招募价格'
    }

    function getMechanicItems(character) {
      const pages = [
        {
          id: 'page-1',
          label: '第 1 页',
          items: [
            {
              title: '拳击机制',
              content: formatMechanic(character.details?.punchMechanic)
            },
            {
              title: '飞踢机制',
              content: formatMechanic(character.details?.kickMechanic)
            }
          ]
        },
        {
          id: 'page-2',
          label: '第 2 页',
          items: [
            {
              title: '大招机制',
              content: formatMechanic(character.details?.ultimateMechanic)
            },
            {
              title: '被动机制',
              content: formatMechanic(character.details?.passiveDetail)
            }
          ]
        }
      ]

      if (character.details?.story || character.passive) {
        pages.push({
          id: 'page-3',
          label: '第 3 页',
          items: [
            {
              title: '战斗定位',
              content: formatMechanic(character.passive)
            },
            {
              title: '角色故事',
              content: formatMechanic(character.details?.story)
            }
          ]
        })
      }

      return pages
    }

    const mechanicPages = computed(() => {
      if (!activeCharacter.value) {
        return []
      }

      return getMechanicItems(activeCharacter.value)
    })

    const currentMechanicItems = computed(() => {
      if (!activeCharacter.value) {
        return []
      }

      const page = mechanicPages.value.find((item) => item.id === activeMechanicPage.value)
      return page?.items || []
    })

    function openCharacterModal(character) {
      activeCharacter.value = character
      activeMechanicPage.value = 'page-1'
    }

    function closeCharacterModal() {
      activeCharacter.value = null
    }

    function purchaseAndRefresh(characterId) {
      state.purchaseCharacter(characterId)
      activeCharacter.value = state.characters.find((character) => character.id === characterId) || activeCharacter.value
    }

    function selectAndRefresh(characterId) {
      state.selectCharacter(characterId)
      activeCharacter.value = state.characters.find((character) => character.id === characterId) || activeCharacter.value
    }

    return {
      ...state,
      activeCharacter,
      activeMechanicPage,
      attackCooldownText: {
        punch: `${(state.attackCooldowns.punchMs / 1000).toFixed(2)} 秒`,
        kick: `${(state.attackCooldowns.kickMs / 1000).toFixed(2)} 秒`
      },
      mechanicPages,
      currentMechanicItems,
      formatMechanic,
      getUnlockLine,
      openCharacterModal,
      closeCharacterModal,
      purchaseAndRefresh,
      selectAndRefresh
    }
  }
}
</script>

<style scoped lang="scss">
.catalog-shell {
  display: grid;
  gap: 18px;
}

.catalog-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 20px;
  align-items: stretch;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(127, 231, 255, 0.18), transparent 38%),
    radial-gradient(circle at bottom right, rgba(255, 199, 120, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(14, 30, 48, 0.88), rgba(8, 18, 32, 0.78));
}

.hero-copy {
  display: grid;
  gap: 12px;
}

.hero-copy h2,
.hero-copy p,
.catalog-toolbar h2,
.catalog-toolbar p,
.profile-card h2,
.profile-card p {
  margin: 0;
}

.hero-copy h2 {
  font-size: clamp(1.8rem, 3vw, 2.7rem);
  line-height: 1.08;
}

.hero-copy p {
  max-width: 56ch;
  line-height: 1.8;
}

.hero-kicker {
  display: inline-flex;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(127, 231, 255, 0.14);
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-wallet {
  display: grid;
  align-content: center;
  gap: 10px;
  padding: 22px;
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(127, 231, 255, 0.2), rgba(144, 166, 255, 0.16)),
    rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f5fbff;
}

.hero-wallet span {
  font-weight: 700;
  color: var(--text-muted);
}

.hero-wallet strong {
  font-size: clamp(2.4rem, 5vw, 3.6rem);
  line-height: 1;
}

.catalog-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 14px;
}

.avatar-tile {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03)),
    linear-gradient(145deg, rgba(14, 30, 48, 0.84), rgba(8, 18, 32, 0.76));
  color: #f7fbff;
  text-align: left;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.avatar-tile:hover {
  transform: translateY(-3px);
  border-color: rgba(127, 231, 255, 0.4);
  box-shadow: 0 18px 32px rgba(2, 8, 20, 0.28);
}

.avatar-tile.selected {
  border-color: rgba(127, 231, 255, 0.55);
}

.avatar-tile.locked {
  opacity: 0.88;
}

.avatar-tile strong {
  font-size: 1rem;
}

.avatar-tile span,
.avatar-tile em {
  font-style: normal;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.avatar-frame {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(127, 231, 255, 0.16), rgba(144, 166, 255, 0.18));
}

.avatar-frame img,
.portrait-shell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(4, 10, 18, 0.76);
  backdrop-filter: blur(8px);
}

.modal-card {
  position: relative;
  width: min(1080px, calc(100vw - 36px));
  min-height: 640px;
  padding: 24px;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
}

.detail-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 20px;
  min-height: 592px;
}

.detail-left,
.detail-right {
  display: grid;
  gap: 16px;
}

.detail-left {
  grid-template-rows: 250px 1fr;
}

.portrait-shell {
  width: 240px;
  height: 240px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(127, 231, 255, 0.24);
  background: linear-gradient(160deg, rgba(127, 231, 255, 0.16), rgba(144, 166, 255, 0.18));
  box-shadow: 0 18px 36px rgba(2, 8, 20, 0.28);
}

.profile-card,
.mechanic-panel {
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.profile-card {
  display: grid;
  align-content: start;
  gap: 12px;
}

.profile-card p {
  color: var(--text-muted);
  line-height: 1.6;
}

.action-stack {
  display: grid;
  gap: 10px;
}

.stats-board.compact {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-chip {
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-chip span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.stat-chip strong {
  font-size: 1rem;
  line-height: 1.35;
}

.stat-chip.highlight {
  background: rgba(127, 231, 255, 0.08);
}

.detail-right {
  grid-template-rows: auto 1fr;
}

.mechanic-panel {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
  min-height: 0;
}

.page-tabs {
  display: flex;
  gap: 10px;
}

.page-tab {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #dff6ff;
  cursor: pointer;
}

.page-tab.active {
  background: rgba(127, 231, 255, 0.18);
  border-color: rgba(127, 231, 255, 0.42);
}

.mechanic-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-content: start;
}

.mechanic-card {
  min-height: 220px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.mechanic-card span {
  display: inline-block;
  margin-bottom: 8px;
  color: var(--accent);
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.mechanic-card p {
  margin: 0;
  color: var(--text-soft);
  line-height: 1.72;
  font-size: 0.95rem;
}

@media (max-width: 980px) {
  .catalog-hero,
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-left {
    grid-template-rows: auto auto;
  }
}

@media (max-width: 720px) {
  .stats-board.compact,
  .mechanic-grid {
    grid-template-columns: 1fr;
  }

  .modal-overlay {
    padding: 12px;
  }

  .modal-card {
    width: calc(100vw - 24px);
    min-height: auto;
  }
}
</style>

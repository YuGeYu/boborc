<template>
  <PageLayout
    title="世界设定"
    subtitle="查看最新公告、活动进度、角色熟练度，以及当前版本的核心作战规则。"
    current-page="world"
  >
    <section class="page-grid">
      <article class="panel world-banner">
        <div>
          <p class="world-tag">世界面板</p>
          <h2>当前远征状态</h2>
          <p>
            当前出战角色是 {{ selectedCharacter.name }}，主线已经推进到 {{ activeLevel.name }}。
            今天的活动奖励与角色熟练度也会在这里同步刷新。
          </p>
        </div>
        <div class="action-row">
          <a class="btn secondary" href="./index.html">返回大厅</a>
          <a class="btn" href="./levels.html">前往关卡</a>
          <a class="btn secondary" href="./shop.html">查看图鉴</a>
        </div>
      </article>

      <article class="panel tab-panel">
        <div class="page-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="page-tab"
            data-ui-sound="tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </article>

      <template v-if="activeTab === 'overview'">
        <article class="panel">
          <div class="panel-header">
            <h2>最新公告</h2>
            <span>当前消息</span>
          </div>
          <ul class="notice-list">
            <li>梦想猫虫改为通关第 100 关后自动加入队伍，不再消耗朱玥招募。</li>
            <li>嘎嘣箭矢与飞踢附带的控制时间已削弱，连续压制感会更短。</li>
            <li>{{ activityCurrencyLabel }} 只来自活动区域奖励，后续将用于角色熟练度养成。</li>
            <li>角色熟练度除了未来可消耗 {{ activityCurrencyLabel }} 提升外，目前也会通过实际出战逐步成长。</li>
          </ul>
        </article>

        <article class="panel">
          <div class="panel-header">
            <h2>世界观</h2>
            <span>背景设定</span>
          </div>
          <div class="world-grid">
            <div class="world-card">
              <strong>河边营地</strong>
              <p>这是一支由群友头像化身而成的小队。每位角色都来自图鉴档案，被重新召集后再次踏上战线。</p>
            </div>
            <div class="world-card">
              <strong>守关者嘎嘣</strong>
              <p>嘎嘣原本负责训练与守门，却在不断胜利里把“更强”当成唯一规则，最终把试炼压成了一条层层升级的挑战线。</p>
            </div>
            <div class="world-card">
              <strong>{{ currencyLabel }}</strong>
              <p>{{ currencyLabel }} 仍然用于主线通关与角色招募，是队伍持续扩编和推进主线的核心资源。</p>
            </div>
            <div class="world-card">
              <strong>{{ activityCurrencyLabel }}</strong>
              <p>{{ activityCurrencyLabel }} 来自活动区域，用来记录日常远征成果。它不会替代 {{ currencyLabel }}，而是服务于未来的熟练度培养线。</p>
            </div>
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <h2>机制说明</h2>
            <span>规则一览</span>
          </div>
          <div class="world-grid">
            <div class="world-card">
              <strong>固定守关者</strong>
              <p>敌人始终属于同一条战线，只会随着关卡推进提升属性与反应速度，让整条主线像一场持续升温的宿敌战。</p>
            </div>
            <div class="world-card">
              <strong>关卡奖励</strong>
              <p>主线胜利会奖励 {{ currencyLabel }}。活动区域则额外提供 {{ activityCurrencyLabel }}，两条资源线分别服务不同成长方向。</p>
            </div>
            <div class="world-card">
              <strong>最终试炼</strong>
              <p>第 100 关仍然会遇到分裂阶段嘎嘣；完成这一关后，梦想猫虫会自动解锁。</p>
            </div>
            <div class="world-card">
              <strong>角色熟练度</strong>
              <p>当前熟练度会通过角色出战直接增长。未来也会开放使用 {{ activityCurrencyLabel }} 进一步培养。</p>
            </div>
          </div>
        </article>
      </template>

      <template v-else-if="activeTab === 'activity'">
        <section class="stats-grid">
          <article class="panel metric-card">
            <div class="panel-header">
              <h3>{{ activityCurrencyLabel }}</h3>
              <span>活动货币</span>
            </div>
            <div class="stat-number">{{ progress.starlightBadge }}</div>
          </article>

          <article class="panel metric-card">
            <div class="panel-header">
              <h3>今日已完成</h3>
              <span>日常</span>
            </div>
            <div class="stat-number">{{ completedDailyCount }}/3</div>
          </article>

          <article class="panel metric-card">
            <div class="panel-header">
              <h3>当前出战熟练度</h3>
              <span>{{ selectedCharacter.name }}</span>
            </div>
            <div class="stat-number">{{ selectedCharacterMastery }}</div>
          </article>
        </section>

        <article class="panel">
          <div class="panel-header">
            <h2>活动区域</h2>
            <span>每日任务</span>
          </div>
          <div v-if="session.settingsError || session.settingsMessage" class="mastery-feedback" :class="{ error: session.settingsError }">
            {{ session.settingsError || session.settingsMessage }}
          </div>
          <div class="activity-grid">
            <div class="activity-card" :class="{ done: dailyActivityStatus.loginClaimed }">
              <strong>每日登录送</strong>
              <p>每天首次进入存档自动发放。</p>
              <span>奖励：+{{ dailyActivityRewards.login }} {{ activityCurrencyLabel }}</span>
              <em>{{ dailyActivityStatus.loginClaimed ? '今日已领取' : '待领取' }}</em>
            </div>

            <div class="activity-card" :class="{ done: dailyActivityStatus.participated }">
              <strong>每日参加关卡</strong>
              <p>当天完成任意 1 场关卡挑战即可。</p>
              <span>奖励：+{{ dailyActivityRewards.participation }} {{ activityCurrencyLabel }}</span>
              <em>{{ dailyActivityStatus.participated ? '今日已完成' : '待完成' }}</em>
            </div>

            <div class="activity-card" :class="{ done: dailyActivityStatus.firstWinClaimed }">
              <strong>每日首胜</strong>
              <p>当天首次获得主线胜利时发放。</p>
              <span>奖励：+{{ dailyActivityRewards.firstWin }} {{ activityCurrencyLabel }}</span>
              <em>{{ dailyActivityStatus.firstWinClaimed ? '今日已完成' : '待完成' }}</em>
            </div>
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <h2>兑换区域</h2>
            <span>1 朱玥 = 10 {{ activityCurrencyLabel }}</span>
          </div>
          <div class="exchange-panel">
            <div class="exchange-card">
              <strong>当前持有</strong>
              <p>{{ currencyLabel }}：{{ progress.zhuYue }}</p>
              <p>{{ activityCurrencyLabel }}：{{ progress.starlightBadge }}</p>
            </div>
            <div class="exchange-form">
              <label for="zhu-yue-exchange">投入朱玥</label>
              <div class="mastery-invest-row">
                <input
                  id="zhu-yue-exchange"
                  v-model.number="exchangeAmount"
                  type="number"
                  min="1"
                  step="1"
                >
                <button
                  class="btn"
                  type="button"
                  @click="applyExchange"
                >
                  兑换星辉徽记
                </button>
              </div>
              <small>输入多少朱玥，就会按 1:10 兑换成 {{ activityCurrencyLabel }}。</small>
            </div>
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <h2>活动说明</h2>
            <span>养成预告</span>
          </div>
          <div class="world-grid">
            <div class="world-card">
              <strong>不奖励朱玥</strong>
              <p>活动区域的三种每日奖励都只发放 {{ activityCurrencyLabel }}，不会直接发放 {{ currencyLabel }}。</p>
            </div>
            <div class="world-card">
              <strong>后续用途</strong>
              <p>{{ activityCurrencyLabel }} 将用于未来的角色熟练度提升功能，形成独立于主线通关奖励的成长渠道。</p>
            </div>
            <div class="world-card">
              <strong>当前额外成长</strong>
              <p>即使还没开放消耗 {{ activityCurrencyLabel }} 的养成，角色只要出战，也会获得基础熟练度。</p>
            </div>
            <div class="world-card">
              <strong>角色皮肤上线</strong>
              <p>河边的小帅与青柠熟练度达到 Lv{{ starterSkinUnlockLevel }} 后，可在角色熟练度页打开皮肤展示并切换新皮肤参与战斗。</p>
            </div>
            <div class="world-card">
              <strong>刷新规则</strong>
              <p>所有每日任务都按本地日期刷新，登录、参战、首胜互相独立结算。</p>
            </div>
          </div>
        </article>
      </template>

      <template v-else>
        <article class="panel">
          <div class="panel-header">
            <h2>角色熟练度</h2>
            <span>按当前存档统计</span>
          </div>
          <div v-if="session.settingsError || session.settingsMessage" class="mastery-feedback" :class="{ error: session.settingsError }">
            {{ session.settingsError || session.settingsMessage }}
          </div>
          <div class="tier-strip">
            <div
              v-for="tier in masteryTiers"
              :key="tier.level"
              class="tier-chip"
            >
              <img :src="tier.iconUrl" :alt="tier.levelLabel">
              <span>{{ tier.levelLabel }}</span>
            </div>
          </div>
          <div class="mastery-grid">
            <div
              v-for="character in characterMasteryList"
              :key="character.id"
              class="mastery-card"
              :class="{
                unlocked: progress.unlockedCharacterIds.includes(character.id),
                'skin-ready': canOpenSkinModal(character),
                glow: character.canGlow,
                orbit: character.canOrbit,
                pulse: character.canPulse
              }"
              @click="openSkinModal(character)"
            >
              <div class="mastery-icon-shell">
                <img class="character-avatar" :src="character.avatar" :alt="character.name">
                <img class="mastery-icon" :src="character.iconUrl" :alt="character.levelLabel">
              </div>
              <div class="mastery-copy">
                <strong>{{ character.name }}</strong>
                <span>{{ character.title }}</span>
                <p>熟练等级：{{ character.levelLabel }}</p>
                <p>熟练度：{{ character.mastery }}</p>
                <p>评级：{{ character.rankLabel }}</p>
                <p v-if="character.selectedSkinId">当前皮肤：{{ character.selectedSkinName }}</p>
                <p>
                  {{ character.nextRankNeed === null ? '已达到当前最高熟练等级。' : `距离下一等级还差 ${character.nextRankNeed} 熟练度。` }}
                </p>
                <button
                  v-if="canOpenSkinModal(character)"
                  class="btn secondary skin-entry-btn"
                  type="button"
                  @click.stop="openSkinModal(character)"
                >
                  打开皮肤展示
                </button>
                <div class="mastery-invest">
                  <label :for="`mastery-spend-${character.id}`">投入星辉徽记</label>
                  <div class="mastery-invest-row">
                    <input
                      :id="`mastery-spend-${character.id}`"
                      v-model.number="masterySpendInputs[character.id]"
                      type="number"
                      min="1"
                      step="1"
                    >
                    <button
                      class="btn secondary invest-btn"
                      type="button"
                      @click="applyMasterySpend(character.id)"
                    >
                      提升熟练度
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </template>
    </section>

    <div
      v-if="skinModalCharacter"
      class="modal-overlay"
      @click.self="closeSkinModal"
    >
      <article class="modal-card panel skin-modal-card">
        <button type="button" class="modal-close" data-ui-sound="close" @click="closeSkinModal">关闭</button>
        <div class="panel-header">
          <h2>{{ skinModalCharacter.name }} 皮肤展示</h2>
          <span>熟练度达到 Lv{{ starterSkinUnlockLevel }} 已解锁</span>
        </div>

        <div class="skin-grid">
          <section class="skin-option">
            <div class="skin-text-only">默认皮肤</div>
            <p>保持当前角色的默认外观，不额外展示预览图。</p>
            <button
              class="btn secondary"
              type="button"
              :disabled="skinModalCharacter.selectedSkinId === getDefaultSkinId(skinModalCharacter)"
              @click="applySkinSelection(skinModalCharacter.id, getDefaultSkinId(skinModalCharacter))"
            >
              {{ skinModalCharacter.selectedSkinId === getDefaultSkinId(skinModalCharacter) ? '当前使用中' : '使用默认皮肤' }}
            </button>
          </section>

          <section
            v-for="skin in skinModalCharacter.availableSkins.filter(item => item.type === 'skin')"
            :key="skin.id"
            class="skin-option"
          >
            <img :src="skin.preview" :alt="skin.name">
            <strong>{{ skin.name }}</strong>
            <p>{{ skin.description }}</p>
            <button
              class="btn"
              type="button"
              :disabled="skinModalCharacter.selectedSkinId === skin.id"
              @click="applySkinSelection(skinModalCharacter.id, skin.id)"
            >
              {{ skinModalCharacter.selectedSkinId === skin.id ? '当前使用中' : '使用这款皮肤' }}
            </button>
          </section>
        </div>
      </article>
    </div>
  </PageLayout>
</template>

<script>
import { computed, reactive, ref } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { useGameState } from '@/state/useGameState'

export default {
  components: { PageLayout },
  setup() {
    const state = useGameState()
    const masteryTierAssets = [
      '/mastery-icons/1.jpg',
      '/mastery-icons/2.jpg',
      '/mastery-icons/3.jpg',
      '/mastery-icons/4.jpg',
      '/mastery-icons/5.jpg',
      '/mastery-icons/6.jpg',
      '/mastery-icons/7.jpg',
      '/mastery-icons/8.jpg',
      '/mastery-icons/9.jpg'
    ]
    const masterySpendInputs = reactive({})
    const exchangeAmount = ref(0)
    const activeTab = ref('overview')
    const skinModalCharacter = ref(null)
    const tabs = [
      { id: 'overview', label: '世界观' },
      { id: 'activity', label: '活动区域' },
      { id: 'mastery', label: '角色熟练度' }
    ]

    const completedDailyCount = computed(() => (
      Number(state.dailyActivityStatus.value.loginClaimed)
      + Number(state.dailyActivityStatus.value.participated)
      + Number(state.dailyActivityStatus.value.firstWinClaimed)
    ))

    const selectedCharacterMastery = computed(() => (
      Number(state.progress.characterMastery?.[state.selectedCharacter.value.id] || 0)
    ))
    const masteryTiers = computed(() => masteryTierAssets.map((iconUrl, index) => ({
      level: index + 1,
      levelLabel: `Lv${index + 1}`,
      iconUrl
    })))

    function applyMasterySpend(characterId) {
      const spendAmount = Math.max(0, Math.floor(Number(masterySpendInputs[characterId] || 0)))
      if (!spendAmount) {
        return
      }

      const ok = state.spendActivityCurrencyOnMastery(characterId, spendAmount)
      if (ok) {
        masterySpendInputs[characterId] = 0
      }
    }

    function applyExchange() {
      const spendAmount = Math.max(0, Math.floor(Number(exchangeAmount.value || 0)))
      if (!spendAmount) {
        return
      }

      const ok = state.exchangeZhuYueForActivityCurrency(spendAmount)
      if (ok) {
        exchangeAmount.value = 0
      }
    }

    function canOpenSkinModal(character) {
      return Array.isArray(character.availableSkins) && character.availableSkins.some((item) => item.type === 'skin')
    }

    function getDefaultSkinId(character) {
      return character?.availableSkins?.find((item) => item.type === 'default')?.id || null
    }

    function openSkinModal(character) {
      if (!canOpenSkinModal(character)) {
        return
      }

      skinModalCharacter.value = state.characterMasteryList.value.find((item) => item.id === character.id) || character
    }

    function closeSkinModal() {
      skinModalCharacter.value = null
    }

    function applySkinSelection(characterId, skinId) {
      const ok = state.selectCharacterSkin(characterId, skinId)
      if (ok) {
        skinModalCharacter.value = state.characterMasteryList.value.find((item) => item.id === characterId) || null
      }
    }

    return {
      ...state,
      activeTab,
      applyExchange,
      applySkinSelection,
      tabs,
      canOpenSkinModal,
      closeSkinModal,
      exchangeAmount,
      getDefaultSkinId,
      applyMasterySpend,
      completedDailyCount,
      masterySpendInputs,
      masteryTiers,
      openSkinModal,
      skinModalCharacter,
      selectedCharacterMastery
    }
  }
}
</script>

<style scoped lang="scss">
.world-banner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  background:
    radial-gradient(circle at top right, rgba(127, 231, 255, 0.16), transparent 30%),
    linear-gradient(135deg, rgba(14, 30, 48, 0.86), rgba(8, 18, 32, 0.78));
}

.world-tag {
  margin: 0 0 10px;
  color: var(--accent);
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.tab-panel {
  padding: 14px 20px;
}

.page-tabs {
  display: flex;
  flex-wrap: wrap;
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

.notice-list {
  margin: 0;
  padding-left: 20px;
  line-height: 1.9;
}

.world-grid,
.activity-grid,
.mastery-grid {
  display: grid;
  gap: 14px;
}

.world-grid,
.activity-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mastery-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.mastery-feedback {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(127, 231, 255, 0.18);
  background: rgba(127, 231, 255, 0.08);
  color: var(--text-main);
}

.mastery-feedback.error {
  border-color: rgba(255, 120, 120, 0.28);
  background: rgba(255, 120, 120, 0.1);
  color: #ffd7d7;
}

.tier-strip {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.tier-chip {
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tier-chip img {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  object-fit: cover;
}

.tier-chip span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.world-card,
.activity-card,
.mastery-card {
  padding: 18px;
  border-radius: 22px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04)),
    rgba(5, 17, 31, 0.34);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.world-card p,
.activity-card p,
.mastery-copy p {
  margin: 10px 0 0;
  line-height: 1.8;
}

.activity-card span,
.activity-card em,
.mastery-copy span {
  display: block;
  margin-top: 10px;
  color: var(--text-muted);
  font-style: normal;
}

.activity-card.done {
  border-color: rgba(135, 255, 183, 0.35);
  background:
    linear-gradient(145deg, rgba(135, 255, 183, 0.14), rgba(255, 255, 255, 0.04)),
    rgba(5, 17, 31, 0.34);
}

.metric-card {
  min-height: 170px;
}

.mastery-card {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 16px;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.mastery-icon-shell {
  position: relative;
  width: 96px;
  height: 96px;
}

.character-avatar {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 14px 32px rgba(2, 8, 20, 0.24);
}

.mastery-icon {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32);
  z-index: 2;
}

.mastery-card.unlocked {
  border-color: rgba(127, 231, 255, 0.3);
}

.mastery-card.skin-ready {
  cursor: pointer;
}

.mastery-card.skin-ready:hover {
  border-color: rgba(255, 199, 120, 0.4);
  transform: translateY(-2px);
  transition: transform 180ms ease, border-color 180ms ease;
}

.mastery-card.glow .mastery-icon-shell::after {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 24px;
  background: radial-gradient(circle, rgba(127, 231, 255, 0.34), transparent 70%);
  filter: blur(10px);
  animation: masteryBreath 2.6s ease-in-out infinite;
}

.mastery-card.orbit::before,
.mastery-card.orbit::after {
  content: '';
  position: absolute;
  left: 56px;
  top: 50%;
  width: 6px;
  height: 6px;
  margin-top: -3px;
  border-radius: 50%;
  background: rgba(127, 231, 255, 0.85);
  box-shadow: 0 0 16px rgba(127, 231, 255, 0.65);
  transform-origin: 0 -38px;
  animation: masteryOrbit 10s linear infinite;
}

.mastery-card.orbit::after {
  background: rgba(255, 199, 120, 0.82);
  box-shadow: 0 0 16px rgba(255, 199, 120, 0.6);
  animation-duration: 13s;
  animation-direction: reverse;
}

.mastery-card.pulse .mastery-icon-shell::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 28px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  animation: masteryPulseBurst 1.9s ease-out infinite;
}

.mastery-copy strong {
  display: block;
  font-size: 1.08rem;
}

.mastery-invest {
  margin-top: 14px;
}

.exchange-panel {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
}

.exchange-card,
.exchange-form {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.exchange-card p,
.exchange-form small {
  margin: 10px 0 0;
  color: var(--text-muted);
}

.mastery-invest label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: 0.84rem;
}

.mastery-invest-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.mastery-invest-row input {
  flex: 1;
  min-width: 0;
  min-height: 42px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
}

.invest-btn {
  min-height: 42px;
}

.skin-entry-btn {
  margin-top: 12px;
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

.skin-modal-card {
  position: relative;
  width: min(960px, calc(100vw - 36px));
  max-height: calc(100vh - 48px);
  padding: 20px;
  overflow: auto;
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

.skin-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.skin-option {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.skin-option img {
  width: 100%;
  max-height: min(62vh, 520px);
  object-fit: contain;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(3, 10, 20, 0.45);
}

.skin-option p,
.skin-option strong {
  margin: 0;
}

.skin-text-only {
  display: grid;
  place-items: center;
  min-height: 220px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-main);
  font-size: 1.1rem;
  font-weight: 800;
}

@keyframes masteryBreath {
  0%, 100% { opacity: 0.45; transform: scale(0.96); }
  50% { opacity: 1; transform: scale(1.08); }
}

@keyframes masteryOrbit {
  from { transform: rotate(0deg) translateX(28px); }
  to { transform: rotate(360deg) translateX(28px); }
}

@keyframes masteryPulseBurst {
  0% { opacity: 0.85; transform: scale(0.88); }
  70% { opacity: 0.15; transform: scale(1.22); }
  100% { opacity: 0; transform: scale(1.3); }
}

@media (max-width: 900px) {
  .world-grid,
  .activity-grid,
  .mastery-grid {
    grid-template-columns: 1fr;
  }

  .tier-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .mastery-card {
    grid-template-columns: 1fr;
  }

  .mastery-invest-row {
    flex-direction: column;
    align-items: stretch;
  }

  .exchange-panel {
    grid-template-columns: 1fr;
  }

  .skin-grid {
    grid-template-columns: 1fr;
  }
}
</style>

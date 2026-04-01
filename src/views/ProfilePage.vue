<template>
  <PageLayout
    title="个人主页"
    subtitle="查看当前角色、本地进度，以及云存档同步状态，统一管理你的《啵啵小队出击》作战档案。"
    current-page="profile"
  >
    <section class="page-grid">
      <article class="panel profile-hero">
        <div class="avatar-block">
          <img :src="selectedCharacter.avatar" :alt="selectedCharacter.name">
          <div>
            <p class="profile-label">当前出战角色</p>
            <h2>{{ selectedCharacter.name }}</h2>
            <p>{{ selectedCharacter.title }}</p>
            <p>{{ selectedCharacter.passive }}</p>
          </div>
        </div>
        <div class="action-row">
          <a class="btn secondary" href="./index.html">返回大厅</a>
          <a class="btn" href="./battle.html">进入战斗</a>
          <a class="btn secondary" href="./shop.html">角色图鉴</a>
          <a class="btn secondary" href="./saves.html">存档中心</a>
          <a class="btn secondary" href="./settings.html">设置</a>
        </div>
      </article>

      <section class="stats-grid">
        <article class="panel">
          <div class="panel-header">
            <h3>当前货币</h3>
            <span>资源</span>
          </div>
          <div class="stat-number">{{ progress.zhuYue }}</div>
        </article>
        <article class="panel">
          <div class="panel-header">
            <h3>当前关卡</h3>
            <span>进度</span>
          </div>
          <div class="stat-number">{{ activeLevel.id }}</div>
        </article>
        <article class="panel">
          <div class="panel-header">
            <h3>当前账户</h3>
            <span>档案</span>
          </div>
          <div class="stat-number account-name">{{ currentAccount.name }}</div>
        </article>
      </section>

      <article class="panel cloud-summary">
        <div class="panel-header">
          <h2>云存档</h2>
          <span>{{ auth.user ? '已连接' : '未连接' }}</span>
        </div>
        <p v-if="auth.user">当前已登录：{{ auth.user.displayName }}，@{{ auth.user.username }}</p>
        <p v-else>当前还没有连接云存档。你可以前往存档中心登录并同步本机进度。</p>
        <p class="muted">同步状态：{{ cloudStatusText }}</p>
        <p class="muted">云端版本：{{ accountStore.syncMeta.cloudVersion || 0 }}</p>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>角色面板</h2>
          <span>数值与战斗定位</span>
        </div>
        <div class="profile-grid">
          <div class="detail-card">
            <strong>基础数值</strong>
            <p>生命：{{ selectedCharacter.stats.health }}</p>
            <p>移动：{{ selectedCharacter.stats.moveSpeed }}</p>
            <p>跳跃：{{ selectedCharacter.stats.jumpVelocity }}</p>
            <p>拳击伤害：{{ selectedCharacter.stats.punchDamage }}</p>
            <p>飞踢伤害：{{ selectedCharacter.stats.kickDamage }}</p>
            <p>拳击冷却：{{ attackCooldownText.punch }}</p>
            <p>飞踢冷却：{{ attackCooldownText.kick }}</p>
          </div>
          <div class="detail-card">
            <strong>战斗说明</strong>
            <p>定位：{{ selectedCharacter.title }}</p>
            <p>被动：{{ selectedCharacter.details.passiveDetail }}</p>
            <p>拳击机制：{{ selectedCharacter.details.punchMechanic }}</p>
            <p>飞踢机制：{{ selectedCharacter.details.kickMechanic }}</p>
          </div>
          <div class="detail-card">
            <strong>当前状态</strong>
            <p>当前关卡：{{ activeLevel.name }}</p>
            <p>已解锁角色：{{ progress.unlockedCharacterIds.length }}</p>
            <p>已解锁关卡：{{ progress.unlockedLevelIds.length }}</p>
            <p>最近结果：{{ lastBattleText }}</p>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>已解锁角色</h2>
          <span>当前可用阵容</span>
        </div>
        <div class="roster-grid">
          <div
            v-for="character in unlockedCharacters"
            :key="character.id"
            class="roster-card"
            :class="{ active: character.id === progress.selectedCharacterId }"
          >
            <img :src="character.avatar" :alt="character.name">
            <div>
              <strong>{{ character.name }}</strong>
              <p>{{ character.title }}</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  </PageLayout>
</template>

<script>
import { computed } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { useGameState } from '@/state/useGameState'

export default {
  components: { PageLayout },
  setup() {
    const state = useGameState()

    const unlockedCharacters = computed(() => (
      state.characters.filter(character => state.progress.unlockedCharacterIds.includes(character.id))
    ))

    const lastBattleText = computed(() => {
      const result = state.session.lastBattleResult
      if (!result) {
        return '本次打开后还没有新的战斗结算。'
      }

      return `${result.isWinner ? '胜利' : '失败'}，第 ${result.level} 关，奖励 ${result.reward} ${state.currencyLabel}`
    })

    const cloudStatusText = computed(() => {
      const map = {
        idle: '未同步',
        syncing: '同步中',
        synced: '已同步',
        conflict: '发生冲突',
        offline: '离线'
      }

      return map[state.auth.syncStatus] || state.auth.syncStatus || '未同步'
    })

      return {
      ...state,
      attackCooldownText: {
        punch: `${(state.attackCooldowns.punchMs / 1000).toFixed(2)} 秒`,
        kick: `${(state.attackCooldowns.kickMs / 1000).toFixed(2)} 秒`
      },
      unlockedCharacters,
      lastBattleText,
      cloudStatusText
    }
  }
}
</script>

<style scoped lang="scss">
.profile-hero {
  display: grid;
  gap: 18px;
  background:
    radial-gradient(circle at top right, rgba(127, 231, 255, 0.14), transparent 26%),
    linear-gradient(145deg, rgba(14, 30, 48, 0.86), rgba(8, 18, 32, 0.78));
}

.avatar-block {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 18px;
  align-items: center;
}

.avatar-block img {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 18px 36px rgba(2, 8, 20, 0.3);
}

.profile-label {
  margin: 0 0 8px;
  color: var(--accent);
  font-weight: 800;
  letter-spacing: 0.08em;
}

.avatar-block h2 {
  margin: 0 0 8px;
}

.avatar-block p {
  margin: 0 0 6px;
  line-height: 1.75;
}

.account-name {
  font-size: 1.4rem;
  line-height: 1.2;
}

.cloud-summary p {
  margin: 8px 0 0;
}

.profile-grid,
.roster-grid {
  display: grid;
  gap: 14px;
}

.profile-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.detail-card,
.roster-card {
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-card p {
  margin: 8px 0 0;
  line-height: 1.7;
}

.roster-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.roster-card {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px;
  align-items: center;
}

.roster-card img {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  object-fit: cover;
}

.roster-card.active {
  outline: 2px solid rgba(127, 231, 255, 0.58);
}

@media (max-width: 900px) {
  .avatar-block,
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>

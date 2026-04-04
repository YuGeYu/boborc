<template>
  <PageLayout
    title="战斗页面"
    subtitle="当前角色将与本关敌人交战。战斗结束后会结算奖励，并保留本场记录。"
    current-page="battle"
  >
    <section class="page-grid">
      <article class="panel">
        <div class="panel-header">
          <h2>本场信息</h2>
          <span>{{ selectedCharacter.name }} VS {{ enhancedBattleConfig.enemies.length > 1 ? `敌方阵营（${enhancedBattleConfig.enemies.length}）` : enhancedBattleConfig.enemy.name }}</span>
        </div>

        <div class="stats-grid">
          <div class="info-card">
            <strong>玩家</strong>
            <p>{{ selectedCharacter.name }}</p>
            <p>装备：{{ enhancedBattleConfig.player.equipment ? enhancedBattleConfig.player.equipment.name : '未使用装备' }}</p>
            <p>生命：{{ enhancedBattleConfig.player.stats.health }}</p>
            <p>移动速度：{{ enhancedBattleConfig.player.stats.moveSpeed }}</p>
            <p>跳跃力度：{{ enhancedBattleConfig.player.stats.jumpVelocity }}</p>
            <p>拳击基础伤害：{{ enhancedBattleConfig.player.stats.punchDamage }}</p>
            <p>飞踢基础伤害：{{ enhancedBattleConfig.player.stats.kickDamage }}</p>
            <p>拳击冷却：{{ enhancedBattleConfig.player.attackCooldowns.punchMs }} ms</p>
            <p>飞踢冷却：{{ enhancedBattleConfig.player.attackCooldowns.kickMs }} ms</p>
            <p>阵营：己方 {{ enhancedBattleConfig.allies.length }} 人 / 敌方 {{ enhancedBattleConfig.enemies.length }} 人 / 中立 {{ enhancedBattleConfig.neutrals?.length || 0 }} 人</p>
            <p>操作：A / D 移动，W 跳跃，J 拳击，K 飞踢</p>
            <p>战斗定位：{{ enhancedBattleConfig.player.passive }}</p>
          </div>

          <div class="info-card">
            <strong>敌人</strong>
            <p>{{ enhancedBattleConfig.enemy.name }}</p>
            <p>{{ enhancedBattleConfig.enemy.title }}</p>
            <p>当前关卡：{{ activeLevel.name }}</p>
            <p>生命：{{ enhancedBattleConfig.enemy.stats.health }}</p>
            <p>移动速度：{{ enhancedBattleConfig.enemy.stats.moveSpeed }}</p>
            <p>跳跃力度：{{ enhancedBattleConfig.enemy.stats.jumpVelocity }}</p>
            <p>拳击基础伤害：{{ enhancedBattleConfig.enemy.stats.punchDamage }}</p>
            <p>飞踢基础伤害：{{ enhancedBattleConfig.enemy.stats.kickDamage }}</p>
            <p>拳击冷却：{{ enhancedBattleConfig.enemy.attackCooldowns.punchMs }} ms</p>
            <p>飞踢冷却：{{ enhancedBattleConfig.enemy.attackCooldowns.kickMs }} ms</p>
            <p v-if="isFinalBossLevel">第 100 关拥有分裂阶段，第一阶段击破后会变成两只嘎嘣。</p>
            <p v-if="isGabengLevel">嘎嘣机制：默认每秒锁定最近目标，并有概率发射箭矢；拳击命中会提高箭矢概率，飞踢空掉会降低箭矢概率。</p>
            <p v-if="isGabengLevel">箭矢会造成相当于嘎嘣当前拳击伤害 10% 的伤害，并附带较短眩晕；飞踢命中时也会附带较短击退控制。</p>
            <p v-else>敌人会根据距离和时机自动选择拳击或飞踢。</p>
          </div>

          <div class="info-card">
            <strong>奖励</strong>
            <p>{{ activeLevel.reward }} {{ currencyLabel }}</p>
            <p>胜利后直接累计到当前存档。</p>
            <p>第 10 关之后，每通过 1 关都会自动出现下一关；第 100 关通关后会自动获得梦想猫虫。</p>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="action-row">
          <a class="btn secondary" href="./levels.html">返回关卡</a>
          <a class="btn secondary" href="./shop.html">查看图鉴</a>
        </div>

        <div class="ready-panel">
          <button class="btn" type="button" data-ui-sound="confirm" @click="startBattle">开始本关</button>
        </div>

        <div v-if="showRetryPanel" class="retry-panel">
          <strong>本关挑战失败</strong>
          <p>你可以直接重新开始本关，也可以在失败结算界面按 E 立即重试。</p>
          <button class="btn secondary" type="button" data-ui-sound="confirm" @click="restartBattle">重新开始本关</button>
        </div>

        <div v-if="showNextLevelPanel" class="retry-panel success-panel">
          <strong>本关已通关</strong>
          <p>下一关已经解锁，点击按钮即可直接进入下一关挑战。</p>
          <button class="btn" type="button" data-ui-sound="confirm" @click="startNextLevelBattle">挑战下一关</button>
        </div>

        <Game
          v-if="session.battleLaunchId > 0"
          :battle-config="enhancedBattleConfig"
          :battle-key="enhancedBattleKey"
          @battle-complete="onBattleComplete"
          @battle-restart="onBattleRestart"
          @game-ready="handleGameReady"
        />

        <div v-if="battleInProgress && liveDebugLog.length" class="record-panel live-record-panel">
          <div class="panel-header">
            <h2>实时战斗日志</h2>
            <span>预览调试用，战斗进行中每隔几秒刷新</span>
          </div>

          <div class="record-summary">
            <p>当前日志时间：{{ liveLogUpdatedAt }}</p>
            <p>当前关卡：第 {{ activeLevel.id }} 关，角色：{{ selectedCharacter.name }}</p>
          </div>

          <div class="debug-log">
            <div
              v-for="(entry, index) in liveDebugLog"
              :key="`live-${entry.at}-${index}`"
              class="debug-entry"
            >
              <strong>{{ formatDebugTime(entry.at) }} · {{ formatDebugTitle(entry) }}</strong>
              <span>{{ formatDebugDetail(entry) }}</span>
            </div>
          </div>
        </div>

        <div v-if="showRecordPanel" class="record-panel">
          <div class="panel-header">
            <h2>战斗记录</h2>
            <span>仅在一局结束后显示</span>
          </div>

          <div class="record-summary">
            <p>
              最近一局：第 {{ displayBattleResult.level }} 关，
              {{ displayBattleResult.isWinner ? '胜利' : '失败' }}
            </p>
            <p>角色：{{ displayBattleResult.playerName || selectedCharacter.name }}，得分：{{ displayBattleResult.score || 0 }}</p>
          </div>

          <div v-if="latestDebugLog.length" class="record-pagination">
            <span>日志分页：第 {{ latestLogPage }} / {{ latestLogPageCount }} 页</span>
            <div class="record-pagination-actions">
              <button
                class="btn secondary"
                type="button"
                :disabled="latestLogPage <= 1"
                @click="goToLatestLogPage(latestLogPage - 1)"
              >
                上一页
              </button>
              <button
                class="btn secondary"
                type="button"
                :disabled="latestLogPage >= latestLogPageCount"
                @click="goToLatestLogPage(latestLogPage + 1)"
              >
                下一页
              </button>
            </div>
          </div>

          <div v-if="latestPagedDebugLog.length" class="debug-log">
            <div
              v-for="(entry, index) in latestPagedDebugLog"
              :key="`${entry.at}-${latestLogPage}-${index}`"
              class="debug-entry"
            >
              <strong>{{ formatDebugTime(entry.at) }} · {{ formatDebugTitle(entry) }}</strong>
              <span>{{ formatDebugDetail(entry) }}</span>
            </div>
          </div>

        </div>
      </article>
    </section>
  </PageLayout>
</template>

<script>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Game from '@/components/Game'
import PageLayout from '@/components/PageLayout.vue'
import { useGameState } from '@/state/useGameState'

export default {
  components: { Game, PageLayout },
  setup() {
    const state = useGameState()
    const LOGS_PER_PAGE = 20
    const pendingScroll = ref(false)
    const battleInProgress = ref(false)
    const latestBattleResult = ref(null)
    const liveBattleSnapshot = ref(null)
    const latestLogPage = ref(1)
    let liveLogTimerId = null

    const isFinalBossLevel = computed(() => (
      state.activeLevel.value?.id === 100 &&
      state.battleConfig.value?.level?.battleMode === 'gabeng-split'
    ))
    const isGabengLevel = computed(() => (
      state.battleConfig.value?.enemy?.name === '嘎嘣'
    ))

    const enhancedBattleConfig = computed(() => state.battleConfig.value)

    const enhancedBattleKey = computed(() => (
      `${state.battleKey.value}-${state.session.battleLaunchId}-normal`
    ))

    const nextLevel = computed(() => state.levels.find(level => level.id === state.activeLevel.value.id + 1) || null)
    const displayBattleResult = computed(() => latestBattleResult.value)

    const showRetryPanel = computed(() => (
      Boolean(displayBattleResult.value) &&
      !displayBattleResult.value.isWinner &&
      displayBattleResult.value.level === state.activeLevel.value.id &&
      !battleInProgress.value
    ))

    const showNextLevelPanel = computed(() => (
      Boolean(displayBattleResult.value) &&
      displayBattleResult.value.isWinner &&
      displayBattleResult.value.level === state.activeLevel.value.id &&
      nextLevel.value &&
      state.isLevelUnlocked(nextLevel.value.id) &&
      !battleInProgress.value
    ))

    const showRecordPanel = computed(() => Boolean(displayBattleResult.value) && !battleInProgress.value)

    const latestDebugLog = computed(() => {
      const lastResult = displayBattleResult.value
      if (!lastResult || !Array.isArray(lastResult.debugLog)) {
        return []
      }

      return lastResult.debugLog
          .filter((entry) => {
            if (entry.type === 'enemy-reposition') {
              return false
            }

            if (entry.type === 'iq45-energy-updated' && entry.detail?.reason === 'time-charge') {
              return false
            }

            return true
          })
          .slice()
          .reverse()
      })
    const latestLogPageCount = computed(() => Math.max(1, Math.ceil(latestDebugLog.value.length / LOGS_PER_PAGE)))
    const latestPagedDebugLog = computed(() => {
      const startIndex = (latestLogPage.value - 1) * LOGS_PER_PAGE
      return latestDebugLog.value.slice(startIndex, startIndex + LOGS_PER_PAGE)
    })

    const liveDebugLog = computed(() => {
      const snapshot = liveBattleSnapshot.value
      if (!snapshot || !Array.isArray(snapshot.debugLog)) {
        return []
      }

      return snapshot.debugLog
        .filter((entry) => {
          if (entry.type === 'enemy-reposition') {
            return false
          }

          if (entry.type === 'iq45-energy-updated' && entry.detail?.reason === 'time-charge') {
            return false
          }

          return true
        })
        .slice()
        .reverse()
    })

    const liveLogUpdatedAt = computed(() => {
      const updatedAt = liveBattleSnapshot.value?.updatedAt
      return updatedAt ? formatTime(updatedAt) : '--'
    })

    function blurActiveElement() {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur()
      }
    }

    function scrollToBottom() {
      nextTick(() => {
        window.setTimeout(() => {
          window.scrollTo({
            top: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
            behavior: 'smooth'
          })
        }, 700)
      })
    }

    function prepareBattle() {
      battleInProgress.value = false
      blurActiveElement()
    }

    function readLiveBattleSnapshot() {
      try {
        const raw = window.localStorage.getItem('fightback:last-session')
        if (!raw) {
          liveBattleSnapshot.value = null
          return
        }

        const parsed = JSON.parse(raw)
        if (parsed?.level !== state.activeLevel.value.id) {
          liveBattleSnapshot.value = parsed
          return
        }

        liveBattleSnapshot.value = parsed
      } catch (error) {
        liveBattleSnapshot.value = null
      }
    }

    function stopLiveLogPolling() {
      if (liveLogTimerId) {
        window.clearInterval(liveLogTimerId)
        liveLogTimerId = null
      }
    }

    function startLiveLogPolling() {
      stopLiveLogPolling()
      readLiveBattleSnapshot()
      liveLogTimerId = window.setInterval(() => {
        readLiveBattleSnapshot()
      }, 1000)
    }

    function handleGameReady() {
      if (pendingScroll.value) {
        pendingScroll.value = false
        scrollToBottom()
      }
    }

    function startBattle() {
      prepareBattle()
      const ok = state.launchBattle()
      if (ok) {
        battleInProgress.value = true
        pendingScroll.value = true
        latestBattleResult.value = null
        liveBattleSnapshot.value = null
        startLiveLogPolling()
      }
    }

    function restartBattle() {
      prepareBattle()
      const ok = state.restartCurrentLevel()
      if (ok) {
        battleInProgress.value = true
        pendingScroll.value = true
        latestBattleResult.value = null
        liveBattleSnapshot.value = null
        startLiveLogPolling()
      }
    }

    function startNextLevelBattle() {
      prepareBattle()
      const ok = state.challengeNextLevel()
      if (ok) {
        battleInProgress.value = true
        pendingScroll.value = true
        latestBattleResult.value = null
        liveBattleSnapshot.value = null
        startLiveLogPolling()
      }
    }

    function onBattleComplete(payload) {
      battleInProgress.value = false
      latestBattleResult.value = payload
      latestLogPage.value = 1
      readLiveBattleSnapshot()
      stopLiveLogPolling()
      state.handleBattleComplete(payload)
    }

    function onBattleRestart() {
      battleInProgress.value = true
      startLiveLogPolling()
    }

    function goToLatestLogPage(page) {
      latestLogPage.value = Math.min(latestLogPageCount.value, Math.max(1, Number(page || 1)))
    }

    function formatTime(value) {
      if (!value) {
        return '--'
      }

      return new Date(value).toLocaleString('zh-CN', { hour12: false })
    }

    function formatDebugTime(value) {
      if (!value) {
        return '--'
      }

      return new Date(value).toLocaleTimeString('zh-CN', { hour12: false })
    }

    function formatEnemyId(value) {
      const map = {
        'enemy-1': '敌人一号',
        'gabeng-left': '左侧嘎嘣',
        'gabeng-right': '右侧嘎嘣'
      }

      if (typeof value === 'string') {
        const numberedEnemyMatch = value.match(/^(.+)-(\d+)$/)
        if (numberedEnemyMatch) {
          const [, baseId, rawIndex] = numberedEnemyMatch
          const index = Number(rawIndex)
          const baseNameMap = {
            'cabbo-ai': '鸽吻',
            enemy: '敌人'
          }

          if (baseNameMap[baseId]) {
            return `${baseNameMap[baseId]}${toChineseIndex(index)}号`
          }
        }
      }

      return map[value] || '敌方目标'
    }

    function formatPlayerId(value) {
      const map = Object.fromEntries(
        state.characters.map(character => [character.id, character.name])
      )

      map.player = '当前角色'
      map['hpm-dream-catbug'] = '梦想猫虫'

      return map[value] || value || '当前角色'
    }

    function formatDebugDetail(entry) {
      const detail = entry.detail || {}

      if (entry.type === 'dream-catbug-mark-applied') {
        const enemyName = formatDebugValue('enemyId', detail.enemyId)
        const attackType = formatDebugValue('attackType', detail.attackType)
        return `${enemyName}被附加梦印。触发来源：${attackType}；持续时间：3 秒。`
      }

      if (entry.type === 'dream-catbug-mark-ended') {
        const enemyName = formatDebugValue('enemyId', detail.enemyId)
        const reason = formatDebugValue('markReason', detail.reason)
        const damage = formatDebugValue('markAccumulatedDamage', detail.markAccumulatedDamage)
        const heal = formatDebugValue('healAmount', detail.healAmount)
        return `${enemyName}的梦印结束。结束原因：${reason}；梦印累计伤害：${damage}；本次回复生命：${heal}。`
      }

      if (entry.type === 'player-heal') {
        const reason = formatDebugValue('reason', detail.reason)
        const heal = formatDebugValue('healAmount', detail.healAmount)
        const lifeAfter = formatDebugValue('playerLifeAfter', detail.playerLifeAfter)
        const source = detail.source ? `；来源单位：${formatDebugValue('source', detail.source)}` : ''
        const radius = detail.healRadius ? `；治疗范围：${formatDebugValue('healRadius', detail.healRadius)}` : ''
        return `回复生命 ${heal} 点。来源：${reason}${source}${radius}；当前生命：${lifeAfter}。`
      }

      if (entry.type === 'dream-candy-summoned') {
        const radius = formatDebugValue('healRadius', detail.healRadius)
        const amount = formatDebugValue('healAmount', detail.healAmount)
        const interval = formatDebugValue('healIntervalMs', detail.healIntervalMs)
        return `想吃棒棒糖已生成。治疗范围：${radius}；单次治疗：${amount}；治疗间隔：${interval} 毫秒。`
      }

      if (entry.type === 'dream-candy-ended') {
        const reason = formatDebugValue('reason', detail.reason)
        return `想吃棒棒糖结束。原因：${reason}。`
      }

      if (entry.type === 'damage-to-enemy-projectile') {
        const projectileName = formatDebugValue('projectileName', detail.projectileName)
        const enemyName = formatDebugValue('enemyId', detail.enemyId)
        const damage = formatDebugValue('totalDamage', detail.totalDamage)
        const lifeAfter = formatDebugValue('enemyLifeAfter', detail.enemyLifeAfter)
        const sourceText = detail.isExtraProjectile ? '额外追加' : '正常发射'

        return `${projectileName}命中${enemyName}，造成 ${damage} 点伤害，${enemyName}剩余生命 ${lifeAfter}。来源：${sourceText}。`
      }

      if (entry.type === 'damage-to-player-projectile') {
        const projectileName = formatDebugValue('projectileName', detail.projectileName)
        const enemyName = formatDebugValue('enemyId', detail.enemyId)
        const damage = formatDebugValue('totalDamage', detail.totalDamage)
        const lifeAfter = formatDebugValue('playerLifeAfter', detail.playerLifeAfter)
        const stunDuration = formatDebugValue('stunDurationMs', detail.stunDurationMs)
        const targetName = formatDebugValue('targetId', detail.targetId)

        return `${enemyName}发出的${projectileName}命中${targetName}，造成 ${damage} 点伤害；当前玩家生命 ${lifeAfter}；附带控制 ${stunDuration} 毫秒。`
      }

      if (entry.type === 'ally-heal') {
        const targetName = formatDebugValue('targetId', detail.targetId)
        const heal = formatDebugValue('healAmount', detail.healAmount)
        return `${targetName}回复生命 ${heal} 点。`
      }

      if (entry.type === 'damage-to-ally') {
        const targetName = formatDebugValue('targetId', detail.targetId)
        const damage = formatDebugValue('totalDamage', detail.totalDamage)
        const lifeAfter = formatDebugValue('allyLifeAfter', detail.allyLifeAfter)
        return `${targetName}受到 ${damage} 点伤害，剩余生命 ${lifeAfter}。`
      }

      if (entry.type === 'hpm-extra-life-gained') {
        return `原因：${formatDebugValue('reason', detail.reason)}；增加 ${formatDebugValue('amount', detail.amount)} 点额外生命；当前额外生命 ${formatDebugValue('extraLife', detail.extraLife)}；拳击共鸣 ${formatDebugValue('passivePunchLayers', detail.passivePunchLayers)} 层；飞踢共鸣 ${formatDebugValue('passiveKickLayers', detail.passiveKickLayers)} 层；被动护盾 ${formatDebugValue('passiveShieldCharges', detail.passiveShieldCharges)} 次。`
      }

      if (entry.type === 'hpm-protection-circle-created') {
        return `保护圈已展开。范围半径 ${formatDebugValue('radius', detail.radius)}；持续 ${formatDebugValue('durationMs', detail.durationMs)} 毫秒。`
      }

      if (entry.type === 'hpm-aura-shield-granted') {
        return `飞踢护盾已发放。当前自身飞踢护盾 ${formatDebugValue('playerAuraShieldCharges', detail.playerAuraShieldCharges)} 次；影响友方数量 ${formatDebugValue('allyCount', detail.allyCount)}。`
      }

      if (entry.type === 'hpm-summon-created') {
        return `${formatDebugValue('targetId', detail.targetId)}已登场；继承角色：${formatDebugValue('inheritedCharacter', detail.inheritedCharacter)}；持续 ${formatDebugValue('durationMs', detail.durationMs)} 毫秒。`
      }

      if (entry.type === '装备-效果更新') {
        const equipmentName = formatDebugValue('equipmentName', detail.equipmentName)
        const evolutionName = detail.equipmentEvolutionName
          ? `；一阶进化：${formatDebugValue('equipmentEvolutionName', detail.equipmentEvolutionName)}`
          : ''
        const secondEvolutionName = detail.equipmentSecondEvolutionName
          ? `；二阶进化：${formatDebugValue('equipmentSecondEvolutionName', detail.equipmentSecondEvolutionName)}`
          : ''

        return `原因：${formatDebugValue('reason', detail.reason)}；装备：${equipmentName}${evolutionName}${secondEvolutionName}；最大生命：${formatDebugValue('maxLifePlayer', detail.maxLifePlayer)}；护盾次数：${formatDebugValue('shieldCharges', detail.shieldCharges)}；常驻减伤：${formatDebugValue('persistentDamageReduction', detail.persistentDamageReduction)}；拳击减伤：${formatDebugValue('punchDamageReduction', detail.punchDamageReduction)}；飞踢减伤：${formatDebugValue('kickDamageReduction', detail.kickDamageReduction)}；周期回血：${formatDebugValue('periodicHealAmount', detail.periodicHealAmount)}；最低血友方治疗：${formatDebugValue('lowestAllyHealAmount', detail.lowestAllyHealAmount)}。`
      }

      const labels = {
        attackType: '攻击类型',
        triggerType: '触发方式',
        reason: '原因',
        remainingMs: '剩余毫秒',
        baseDamage: '基础伤害',
        totalDamage: '实际伤害',
        enemyLifeAfter: '敌方剩余生命',
        playerLifeAfter: '玩家剩余生命',
        arrowChance: '箭矢概率',
        currentEnergy: '当前能量',
        maxEnergy: '最大能量',
        hitIndex: '追击段数',
        initialShieldCharges: '开场护盾次数',
        shieldChargesBeforeHit: '受击前护盾次数',
        remainingShieldCharges: '剩余护盾次数',
        healAmount: '恢复生命',
        healRadius: '治疗范围',
        healIntervalMs: '治疗间隔',
        source: '来源单位',
        markReason: '梦印结束原因',
        markAccumulatedDamage: '梦印累计伤害',
        dreamCatbugAmplified: '梦印增伤',
        enhancedPunch: '强化拳',
        followUpRule: '追击规则',
        kickHitStreak: '飞踢连续命中次数',
        enemyId: '目标敌人',
        battleMode: '战斗模式',
        level: '关卡',
        enemyName: '敌人名称',
        phase: '阶段',
        fatalGuardCharges: '致命伤抵挡次数',
        invisibilityStarted: '隐身启动',
        invisibilityRemainingMs: '隐身剩余毫秒',
        projectileName: '投射物',
        equipmentName: '装备名称',
        equipmentEvolutionName: '进化装备',
        equipmentSecondEvolutionName: '二阶进化装备',
        threshold: '进化阈值',
        totalDamageDealt: '累计对敌伤害',
        from: '进化前装备',
        to: '进化后装备',
        punchHealCharges: '拳击回血次数',
        punchHealRatio: '拳击回血比例',
        persistentDamageReduction: '常驻减伤比例',
        remainingPunchHealCharges: '剩余拳击回血次数',
        playerId: '角色标识',
        targetId: '目标单位',
        allyLifeAfter: '友方剩余生命',
        garlicForm: '大蒜形态',
        form: '当前形态',
        shieldCharges: '护盾次数',
        shieldReduction: '护盾减伤比例',
        originalAttackType: '原始攻击类型',
        transitionMs: '切换无敌时长',
        knockbackX: '击退 X',
        knockbackY: '击退 Y',
        bonusDamage: '额外伤害',
        controlMs: '控制时长',
        distanceToPlayer: '与玩家距离',
        currentLife: '当前生命',
        maxLife: '最大生命',
        splitAnimationText: '分裂提示',
        isWinner: '是否胜利',
        hitTargets: '命中目标',
        splashFrom: '溅射来源',
        pathStartX: '起始 X',
        pathEndX: '结束 X',
        jumpHeight: '跳跃高度',
        splashDamage: '溅射伤害',
        healAmount: '治疗量',
        accumulatedStoneHeal: '石像累计回血',
        stunDurationMs: '眩晕时长',
        stunChance: '眩晕概率',
        fired: '是否发射',
        jumpBoostStacks: '跳跃增幅层数',
        jumpBoostRatio: '跳跃增幅比例',
        remainingFatalGuardCharges: '剩余致命免疫次数',
        extraLife: '额外生命',
        passivePunchLayers: '拳击共鸣层数',
        passiveKickLayers: '飞踢共鸣层数',
        playerAuraShieldCharges: '飞踢护盾次数',
        passiveShieldCharges: '被动护盾次数',
        allyCount: '影响友方数量',
        radius: '范围半径',
        durationMs: '持续时间',
        inheritedCharacter: '继承角色',
        amount: '数值',
        markHealCapRatio: '梦印回血上限比例',
        slowRatio: '减速比例',
        slowDurationMs: '减速持续毫秒',
        intervalMs: '间隔毫秒',
        reflectedFrom: '反伤来源',
        lifestealRatio: '吸血比例',
        chance: '触发概率'
      }

      return Object.entries(detail)
        .filter(([key]) => key !== 'isExtraProjectile')
        .map(([key, value]) => `${labels[key] || key}: ${formatDebugValue(key, value)}`)
        .join('；')
    }

    function formatDebugValue(key, value) {
      const map = {
        kick: '飞踢',
        punch: '拳击',
        '大蒜-假身J': '大蒜假身 J',
        '大蒜-假身K': '大蒜假身 K',
        '大蒜-真身J': '大蒜真身 J',
        '大蒜-真身K': '大蒜真身 K',
        'kick-follow-up': '飞踢追击',
        'punch-follow-up': '拳击追击',
        'kick-projectile': '飞踢投射物',
        'punch-projectile': '拳击投射物',
        'enemy-kick': '敌方飞踢',
        'enemy-punch': '敌方拳击',
        shield: '护盾减伤',
        'battle-start': '战斗开始',
        'damage-to-enemy': '命中敌人',
        'damage-to-enemy-follow-up': '追击命中',
        'damage-to-enemy-projectile': '投射物命中',
        'damage-to-player-projectile': '敌方投射物命中',
        'damage-to-player': '玩家受击',
        'damage-blocked': '伤害被格挡',
        'damage-reduced': '触发减伤',
        'boss-phase-split': '嘎嘣分裂',
        'follow-up-missed': '追击落空',
        'invisibility-started': '进入隐身',
        'invisibility-ended': '隐身结束',
        'fatal-guard-triggered': '抵挡致命伤',
        'shield-charge-gained': '护盾次数增加',
        'lifesteal-heal': '拳击回血',
        'kick-streak-updated': '飞踢连击层数提升',
        'enemy-reposition': '敌人调整站位',
        '装备-自动进化': '装备自动进化',
        '装备-效果更新': '装备效果更新',
        '装备-拳击回血': '装备拳击回血',
        'equipment-proximity-pulse': '近身脉冲',
        'equipment-kick-splash': '飞踢溅射',
        'equipment-retaliatory-quake': '震域回响',
        'equipment-hit-slow': '命中缓速',
        'equipment-hit-nullify': '命中封招',
        'equipment-nullify-consumed': '封招生效',
        'equipment-lifesteal': '命中吸血',
        'equipment-damage-reflect': '受击反伤',
        'equipment-periodic-heal': '周期回血',
        'equipment-low-life-burst': '低血爆发',
        'equipment-divine-stride': '神行模式',
        'equipment-divine-stride-evade': '神行闪避',
        'equipment-lowest-ally-heal': '最低血友方治疗',
        'equipment-landing-ally-buff': '落地团队增益',
        'equipment-ally-control-resist': '队友抗控',
        'equipment-retaliatory-stun': '受击反震',
        'equipment-jump-boost': '受击跃势',
        'equipment-landing-shockwave': '落地震击',
        'gabeng-arrow-lock': '嘎嘣锁定目标',
        'gabeng-arrow-fired': '嘎嘣发射箭矢',
        'gabeng-arrow-rate-updated': '嘎嘣箭矢概率变化',
        'iq45-energy-updated': 'IQ45 拳能变化',
        'iq45-kick-energy-updated': 'IQ45 飞踢充能变化',
        'iq45-enhanced-punch-armed': 'IQ45 强化拳就绪',
        'iq45-enhanced-punch-finished': 'IQ45 强化拳结算',
        'iq45-enhanced-punch-splash': 'IQ45 强化拳溅射',
        'iq45-extended-kick-armed': 'IQ45 拉拽飞踢就绪并释放',
        'iq45-extended-kick': 'IQ45 拉拽飞踢',
        'iq45-stone-started': 'IQ45 石像启动',
        'iq45-stone-heal': 'IQ45 石像回血',
        'iq45-stone-bonus-heal': 'IQ45 石像补偿回血',
        'iq45-stone-burst': 'IQ45 石像反震',
        'wudi-punch-dash': '无敌小可爱冲拳',
        'wudi-punch-finished': '无敌小可爱冲拳结算',
        'wudi-kick-lock': '无敌小可爱锁空飞踢',
        'wudi-kick-shockwave': '无敌小可爱飞踢震击',
        'wudi-fatal-guard-triggered': '亡崩死裂触发',
        'wudi-death-dance-start': '亡崩死裂开始',
        'wudi-death-dance-punch': '亡崩死裂跃拳',
        'wudi-death-dance-shockwave': '亡崩死裂震击',
        'wudi-death-dance-ended': '亡崩死裂结束',
        '亡崩死裂': '亡崩死裂',
        '大蒜-形态切换': '大蒜形态切换',
        '大蒜-真身J结算': '大蒜真身 J 结算',
        'lock-on-follow-up': '锁定追击',
        'grounded-release-follow-up': '原地脱手追击',
        'normal-follow-up': '普通追击',
        single: '单体战',
        'gabeng-split': '嘎嘣分裂战',
        'fatal-guard': '致命伤抵挡',
        'timed-invisibility': '周期隐身',
        'fatal-guard-trigger': '致命伤触发隐身',
        'equipment-evolved': '装备进化完成',
        'equipment-second-evolved': '装备二阶进化完成',
        'equipment-fatal-guard-triggered': '装备致命守护触发',
        timeout: '自然结束',
        garlic: '大蒜',
        'fake-1': '第一次假身',
        'fake-2': '第二次假身',
        '大蒜真身不可命中': '大蒜真身不可命中',
        '大蒜切换期无敌': '大蒜切换期无敌',
        '笑啵啵': '笑啵啵',
        '哭啵啵': '哭啵啵',
        '红啵啵': '红啵啵',
        'dream-catbug-mark-expired': '梦印到期回复',
        'dream-candy-heal': '想吃棒棒糖治疗',
        'hpm-punch': 'hpm 共鸣拳击',
        'hpm-note': 'hpm 音符',
        'hpm-note-hit': 'hpm 音符命中回复',
        'hpm-note-ally-heal': 'hpm 音符友方治疗',
        'hpm-punch-self-heal': 'hpm 拳击自疗',
        'hpm-punch-ally-heal': 'hpm 拳击友疗',
        'hpm-protection-circle': 'hpm 保护圈治疗',
        'hpm-dream-candy': '梦想猫虫治疗圈',
        'hpm-extra-life-gained': 'hpm 额外生命增加',
        'hpm-extra-life-decayed': 'hpm 额外生命衰减',
        'hpm-protection-circle-created': 'hpm 保护圈展开',
        'hpm-protection-circle-ended': 'hpm 保护圈结束',
        'hpm-aura-shield-granted': 'hpm 飞踢护盾发放',
        'hpm-summon-damage': '梦想猫虫命中',
        'hpm-summon-created': '梦想猫虫登场',
        'hpm-dream-catbug': '梦想猫虫',
        'hpm-passive-shield': 'hpm 被动护盾',
        'hpm-aura-shield': 'hpm 飞踢护盾',
        expired: '自然结束',
        'expired-after-defeat': '目标倒下后结束',
        'player-defeated': '玩家倒下',
        'kick-miss': '飞踢落空',
        'punch-hit': '拳击命中',
        'battle-start': '战斗开始',
        'battle-start-snapshot': '开局快照',
        'battle-start-load': '读取开局配置',
        normal: '正常发射',
        '想吃棒棒糖': '想吃棒棒糖',
        true: '是',
        false: '否'
      }

      if (key === 'enemyId' || key === 'splashFrom') {
        return formatEnemyId(value)
      }

      if (key === 'hitTargets') {
        const targets = Array.isArray(value) ? value : [value]
        return targets.filter(Boolean).map(item => formatEnemyId(item)).join('、') || '无'
      }

      if (key === 'playerId') {
        return formatPlayerId(value)
      }

      if (key === 'targetId') {
        if (String(value).startsWith('enemy') || String(value).startsWith('gabeng')) {
          return formatEnemyId(value)
        }
        return formatPlayerId(value)
      }

      if (key === 'garlicForm' || key === 'form') {
        return map[value] || '无'
      }

      if (typeof value === 'number') {
        return Number.isInteger(value) ? String(value) : value.toFixed(1)
      }

      return map[value] || value
    }

    function toChineseIndex(value) {
      const map = {
        1: '一',
        2: '二',
        3: '三',
        4: '四',
        5: '五',
        6: '六',
        7: '七',
        8: '八',
        9: '九',
        10: '十'
      }

      return map[value] || String(value)
    }

    function formatDebugTitle(entry) {
      const titles = {
        'battle-start': '战斗开始',
        '装备-自动进化': '装备自动进化',
        '装备-效果更新': '装备效果更新',
        '装备-拳击回血': '装备拳击回血',
        'equipment-proximity-pulse': '近身脉冲',
        'equipment-kick-splash': '飞踢溅射',
        'equipment-retaliatory-quake': '震域回响',
        'equipment-hit-slow': '命中缓速',
        'equipment-hit-nullify': '命中封招',
        'equipment-nullify-consumed': '封招生效',
        'equipment-lifesteal': '命中吸血',
        'equipment-damage-reflect': '受击反伤',
        'equipment-periodic-heal': '周期回血',
        'equipment-low-life-burst': '低血爆发',
        'equipment-divine-stride': '神行模式',
        'equipment-divine-stride-evade': '神行闪避',
        'equipment-lowest-ally-heal': '最低血友方治疗',
        'equipment-landing-ally-buff': '落地团队增益',
        'equipment-ally-control-resist': '队友抗控',
        'equipment-retaliatory-stun': '受击反震',
        'equipment-jump-boost': '受击跃势',
        'equipment-landing-shockwave': '落地震击',
        'wudi-punch-dash': '无敌小可爱冲拳',
        'wudi-punch-finished': '无敌小可爱冲拳结算',
        'wudi-kick-lock': '无敌小可爱锁空飞踢',
        'wudi-kick-shockwave': '无敌小可爱飞踢震击',
        'wudi-fatal-guard-triggered': '亡崩死裂触发',
        'wudi-death-dance-start': '亡崩死裂开始',
        'wudi-death-dance-punch': '亡崩死裂跃拳',
        'wudi-death-dance-shockwave': '亡崩死裂震击',
        'wudi-death-dance-ended': '亡崩死裂结束',
        'damage-to-enemy': '命中敌人',
        'damage-to-enemy-follow-up': '追击命中',
        'damage-to-enemy-projectile': '投射物命中',
        'damage-to-player-projectile': '敌方投射物命中',
        'damage-to-player': '玩家受击',
        'damage-reduced': '触发减伤',
        'lifesteal-heal': '拳击回血',
        'shield-charge-gained': '护盾次数增加',
        'kick-streak-updated': '飞踢连击层数提升',
        'follow-up-missed': '追击落空',
        'boss-phase-split': '嘎嘣分裂',
        'fatal-guard-triggered': '抵挡致命伤',
        'invisibility-started': '进入隐身',
        'invisibility-ended': '隐身结束',
        'damage-blocked': '伤害被格挡',
        'enemy-reposition': '敌人调整站位',
        'player-heal': '生命回复',
        'dream-catbug-mark-applied': '梦印附加',
        'dream-catbug-mark-ended': '梦印结算',
        'dream-candy-summoned': '想吃棒棒糖生成',
        'dream-candy-ended': '想吃棒棒糖结束',
        'ally-heal': '友方回复',
        'damage-to-ally': '友方受击',
        'gabeng-arrow-lock': '嘎嘣锁定目标',
        'gabeng-arrow-fired': '嘎嘣发射箭矢',
        'gabeng-arrow-rate-updated': '嘎嘣箭矢概率变化',
        'iq45-energy-updated': 'IQ45 拳能变化',
        'iq45-kick-energy-updated': 'IQ45 飞踢充能变化',
        'iq45-enhanced-punch-armed': 'IQ45 强化拳就绪',
        'iq45-enhanced-punch-finished': 'IQ45 强化拳结算',
        'iq45-enhanced-punch-splash': 'IQ45 强化拳溅射',
        'iq45-extended-kick-armed': 'IQ45 拉拽飞踢就绪并释放',
        'iq45-extended-kick': 'IQ45 拉拽飞踢',
        'iq45-stone-started': 'IQ45 石像启动',
        'iq45-stone-heal': 'IQ45 石像回血',
        'iq45-stone-bonus-heal': 'IQ45 石像补偿回血',
        'iq45-stone-burst': 'IQ45 石像反震',
        'hpm-extra-life-gained': 'hpm 额外生命增加',
        'hpm-extra-life-decayed': 'hpm 额外生命衰减',
        'hpm-protection-circle-created': 'hpm 保护圈展开',
        'hpm-protection-circle-ended': 'hpm 保护圈结束',
        'hpm-aura-shield-granted': 'hpm 飞踢护盾发放',
        'hpm-summon-damage': '梦想猫虫命中',
        'hpm-summon-created': '梦想猫虫登场',
        'equipment-second-evolved': '装备二阶进化完成',
        'equipment-fatal-guard-triggered': '装备致命守护触发',
        '大蒜-形态切换': '大蒜形态切换',
        '大蒜-真身J结算': '大蒜真身 J 结算'
      }

      return titles[entry.type] || '战斗事件'
    }

    onMounted(() => {
      readLiveBattleSnapshot()
    })

    onBeforeUnmount(() => {
      stopLiveLogPolling()
    })

    watch(battleInProgress, (isRunning) => {
      if (!isRunning) {
        stopLiveLogPolling()
      }
    })

    watch(latestDebugLog, (entries) => {
      if (!entries.length) {
        latestLogPage.value = 1
        return
      }

      if (latestLogPage.value > latestLogPageCount.value) {
        latestLogPage.value = latestLogPageCount.value
      }
    })

    return {
      ...state,
      enhancedBattleConfig,
      enhancedBattleKey,
      displayBattleResult,
      isFinalBossLevel,
      isGabengLevel,
      latestDebugLog,
      latestLogPage,
      latestLogPageCount,
      latestPagedDebugLog,
      liveDebugLog,
      liveLogUpdatedAt,
      showRecordPanel,
      showRetryPanel,
      showNextLevelPanel,
      goToLatestLogPage,
      handleGameReady,
      onBattleComplete,
      onBattleRestart,
      restartBattle,
      startBattle,
      startNextLevelBattle,
      formatTime,
      formatDebugTime,
      formatDebugTitle,
      formatDebugDetail
    }
  }
}
</script>

<style scoped lang="scss">
.page-grid {
  display: grid;
  gap: 18px;
}

.panel {
  padding: 18px;
  border-radius: 24px;
}

.panel-header,
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.info-card,
.retry-panel,
.ready-panel,
.record-panel {
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.success-panel {
  background: rgba(96, 255, 176, 0.08);
}

.action-row {
  margin-bottom: 16px;
}

.ready-panel,
.retry-panel,
.record-panel {
  margin: 16px 0;
}

.live-record-panel {
  border: 1px solid rgba(127, 231, 255, 0.22);
}

.ready-panel,
.retry-panel {
  display: grid;
  gap: 10px;
}

.preview-tip {
  margin: 0;
  color: #ffd89b;
}

.record-summary p,
.info-card p {
  margin: 8px 0;
  line-height: 1.7;
}

.record-pagination,
.record-pagination-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.record-pagination {
  justify-content: space-between;
  margin-top: 14px;
}

.debug-log,
.history-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.debug-entry,
.history-entry {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
}

@media (max-width: 720px) {
  .panel-header,
  .action-row,
  .record-pagination,
  .record-pagination-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

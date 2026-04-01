<template>
  <PageLayout
    title="关卡选择"
    subtitle="每一关面对的都是同一条战线上的敌人，但越往后越危险。选好关卡后，就能直接进入战斗。"
    current-page="levels"
  >
    <section class="page-grid">
      <article class="panel">
        <div class="panel-header">
          <div>
            <h2>关卡列表</h2>
            <span class="muted">每页显示 20 关</span>
          </div>
          <span>奖励与难度同步提升</span>
        </div>

        <div class="level-grid">
          <button
            v-for="level in visibleLevels"
            :key="level.id"
            class="level-card"
            data-ui-sound="select"
            :class="{ active: activeLevel.id === level.id, locked: !isLevelUnlocked(level.id) }"
            :disabled="!isLevelUnlocked(level.id)"
            @click="selectLevel(level.id)"
          >
            <strong>{{ level.name }}</strong>
            <p>奖励：{{ level.reward }} {{ currencyLabel }}</p>
            <small>{{ level.description }}</small>
          </button>
        </div>

        <div class="pagination-bar">
          <button
            class="page-nav"
            type="button"
            data-ui-sound="tab"
            :disabled="pageIndex === 0"
            @click="goToPage(pageIndex - 1)"
          >
            上一页
          </button>

          <button
            v-for="page in pageNumbers"
            :key="page"
            class="page-number"
            :class="{ active: pageIndex === page - 1 }"
            type="button"
            data-ui-sound="tab"
            @click="goToPage(page - 1)"
          >
            {{ page }}
          </button>

          <button
            class="page-nav"
            type="button"
            data-ui-sound="tab"
            :disabled="pageIndex >= totalPages - 1"
            @click="goToPage(pageIndex + 1)"
          >
            下一页
          </button>
        </div>
      </article>

      <article class="panel preview-panel">
        <div class="panel-header">
          <h2>当前出战预览</h2>
          <div class="action-row">
            <a class="btn secondary" href="./index.html">返回大厅</a>
            <a class="btn" href="./battle.html">开始本关</a>
          </div>
        </div>

        <div class="avatar-card battle-preview">
          <img :src="selectedCharacter.avatar" :alt="selectedCharacter.name">
          <div>
            <strong>{{ selectedCharacter.name }}</strong>
            <p>本次对手：{{ aiOpponent.name }}</p>
            <p>当前关卡：{{ activeLevel.name }}</p>
            <p>本关奖励：{{ activeLevel.reward }} {{ currencyLabel }}</p>
          </div>
        </div>
      </article>
    </section>
  </PageLayout>
</template>

<script>
import { computed, ref, watch } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { useGameState } from '@/state/useGameState'

const PAGE_SIZE = 20

export default {
  components: { PageLayout },
  setup() {
    const state = useGameState()
    const pageIndex = ref(Math.floor((Math.max(1, state.activeLevel.value?.id || 1) - 1) / PAGE_SIZE))

    const totalPages = computed(() => Math.max(1, Math.ceil(state.levels.length / PAGE_SIZE)))
    const visibleLevels = computed(() => {
      const start = pageIndex.value * PAGE_SIZE
      return state.levels.slice(start, start + PAGE_SIZE)
    })
    const pageNumbers = computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1))

    watch(
      () => state.activeLevel.value?.id,
      levelId => {
        const nextPageIndex = Math.floor((Math.max(1, levelId || 1) - 1) / PAGE_SIZE)
        if (nextPageIndex !== pageIndex.value) {
          pageIndex.value = nextPageIndex
        }
      },
      { immediate: true }
    )

    function goToPage(nextPageIndex) {
      pageIndex.value = Math.min(Math.max(0, nextPageIndex), totalPages.value - 1)
    }

    return {
      ...state,
      pageIndex,
      totalPages,
      visibleLevels,
      pageNumbers,
      goToPage
    }
  }
}
</script>

<style scoped lang="scss">
.preview-panel {
  background:
    radial-gradient(circle at top right, rgba(127, 231, 255, 0.14), transparent 22%),
    linear-gradient(145deg, rgba(14, 30, 48, 0.84), rgba(8, 18, 32, 0.76));
}

.battle-preview {
  padding: 12px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.04);
}

.battle-preview p,
.battle-preview strong {
  display: block;
  margin: 6px 0 0;
}

.pagination-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 16px;
}

.page-nav,
.page-number {
  min-height: 40px;
  min-width: 40px;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-main);
  font-weight: 700;
}

.page-number.active {
  background: linear-gradient(135deg, rgba(127, 231, 255, 0.9), rgba(144, 166, 255, 0.82));
  color: #031120;
}

.page-nav:disabled,
.page-number:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>

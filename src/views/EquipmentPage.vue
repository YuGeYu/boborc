<template>
  <PageLayout
    title="装备配置"
    subtitle="每次出战只能选择 1 件基础装备。若该装备支持进化，则可在此预先选择进化方向；战斗中累计对敌伤害超过 100 后会自动完成进化。"
    current-page="equipment"
  >
    <section class="page-grid">
      <article class="panel">
        <div class="panel-header">
          <div>
            <h2>当前装备</h2>
            <span class="muted">{{ selectedEquipment ? selectedEquipment.name : '未装备' }}</span>
          </div>
          <div class="action-row">
            <a class="btn secondary" href="./index.html">返回大厅</a>
            <a class="btn secondary" href="./battle.html">前往战斗</a>
          </div>
        </div>

        <div class="equipment-grid">
          <button
            class="equipment-card empty-card"
            :class="{ active: !selectedEquipment }"
            type="button"
            @click="selectEquipment(null)"
          >
            <strong>不使用装备</strong>
            <p>保持角色原始面板，不附加任何额外基础效果。</p>
          </button>

          <button
            v-for="equipment in equipmentOptions"
            :key="equipment.id"
            class="equipment-card"
            :class="{ active: selectedEquipment?.id === equipment.id }"
            type="button"
            @click="selectEquipment(equipment.id)"
          >
            <strong>{{ equipment.name }}</strong>
            <p>{{ equipment.description }}</p>
            <small v-if="equipment.evolutionPaths?.length">可在累计伤害超过 100 后自动进化</small>
            <small v-else>该装备无法进化</small>
          </button>
        </div>

        <div v-if="availableEvolutionPaths.length" class="evolution-panel">
          <div class="panel-header compact">
            <div>
              <h3>进化方向</h3>
              <span class="muted">当前基础装备：{{ selectedEquipment ? selectedEquipment.name : '不使用装备' }}</span>
            </div>
            <span class="muted">累计对敌伤害 > 100 时自动覆盖当前基础状态</span>
          </div>

          <div class="evolution-grid">
            <button
              v-for="path in availableEvolutionPaths"
              :key="path.id"
              class="evolution-card"
              :class="{ active: selectedEquipmentEvolution?.id === path.id }"
              type="button"
              @click="selectEquipmentEvolution(selectedEquipment ? selectedEquipment.id : null, path.id)"
            >
              <strong>{{ path.name }}</strong>
              <p>{{ path.description }}</p>
            </button>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>出战预览</h2>
          <span>当前角色：{{ selectedCharacter.name }}</span>
        </div>

        <div class="stats-grid preview-grid">
          <div class="info-card">
            <strong>基础装备效果</strong>
            <p>装备名称：{{ selectedEquipment ? selectedEquipment.name : '未装备' }}</p>
            <p>生命：{{ battleConfig.player.stats.health }}</p>
            <p>移动速度：{{ battleConfig.player.stats.moveSpeed }}</p>
            <p>跳跃力度：{{ battleConfig.player.stats.jumpVelocity }}</p>
            <p>拳击基础伤害：{{ battleConfig.player.stats.punchDamage }}</p>
            <p>飞踢基础伤害：{{ battleConfig.player.stats.kickDamage }}</p>
          </div>

          <div class="info-card">
            <strong>自动进化效果</strong>
            <p>触发条件：本局累计对敌伤害 > 100</p>
            <p v-if="selectedEquipmentEvolution">进化结果：{{ selectedEquipmentEvolution.name }}</p>
            <p v-if="selectedEquipmentEvolution">{{ selectedEquipmentEvolution.description }}</p>
            <p v-else-if="selectedEquipment">该装备无法进化。</p>
            <p v-else>未装备时也可以预先选择一条进化方向。</p>
          </div>
        </div>
      </article>
    </section>
  </PageLayout>
</template>

<script>
import { computed } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { UNEQUIPPED_EVOLUTION_OPTIONS } from '@/data/gameContent'
import { useGameState } from '@/state/useGameState'

export default {
  components: { PageLayout },
  setup() {
    const state = useGameState()
    const availableEvolutionPaths = computed(() => (
      state.selectedEquipment.value?.evolutionPaths?.length
        ? state.selectedEquipment.value.evolutionPaths
        : (!state.selectedEquipment.value ? UNEQUIPPED_EVOLUTION_OPTIONS : [])
    ))

    return {
      ...state,
      availableEvolutionPaths
    }
  }
}
</script>

<style scoped lang="scss">
.page-grid {
  display: grid;
  gap: 18px;
}

.equipment-grid,
.evolution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.equipment-card,
.evolution-card {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04)),
    rgba(9, 19, 34, 0.42);
  text-align: left;
  cursor: pointer;
  color: var(--text-main);
}

.equipment-card.active,
.evolution-card.active {
  border-color: rgba(127, 231, 255, 0.56);
  box-shadow: 0 14px 32px rgba(127, 231, 255, 0.14);
}

.equipment-card strong,
.equipment-card p,
.equipment-card small,
.evolution-card strong,
.evolution-card p {
  margin: 0;
}

.equipment-card p,
.equipment-card small,
.evolution-card p {
  color: var(--text-muted);
  line-height: 1.7;
}

.empty-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
    rgba(8, 16, 29, 0.54);
}

.evolution-panel {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-header.compact {
  margin-bottom: 0;
}

.preview-grid {
  margin-top: 16px;
}

.info-card {
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.info-card p {
  margin: 8px 0 0;
  line-height: 1.7;
}
</style>

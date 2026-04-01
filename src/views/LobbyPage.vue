<template>
  <PageLayout
    title="作战大厅"
    subtitle="在这里统筹小队、确认当前出战角色，并快速前往关卡、图鉴、装备、世界观和个人进度页面。"
    current-page="lobby"
  >
    <section class="page-grid lobby-layout">
      <article class="panel hero-panel">
        <div class="hero-copy">
          <p class="hero-tag">当前出战角色</p>
          <h2>{{ selectedCharacter.name }}</h2>
          <p class="hero-role">{{ selectedCharacter.title }}</p>
          <p class="hero-desc">{{ selectedCharacter.passive }}</p>

          <div class="hero-stats">
            <span>生命 {{ selectedCharacter.stats.health }}</span>
            <span>移动 {{ selectedCharacter.stats.moveSpeed }}</span>
            <span>跳跃 {{ selectedCharacter.stats.jumpVelocity }}</span>
            <span>拳击 {{ selectedCharacter.stats.punchDamage }}</span>
            <span>飞踢 {{ selectedCharacter.stats.kickDamage }}</span>
          </div>

          <div class="action-row">
            <a class="btn" href="./battle.html">立即出战</a>
            <a class="btn secondary" href="./levels.html">查看关卡</a>
          </div>
        </div>

        <div class="hero-visual" aria-label="当前角色展示">
          <div class="nebula nebula-a"></div>
          <div class="nebula nebula-b"></div>
          <div class="nebula nebula-c"></div>

          <div class="liquid liquid-a"></div>
          <div class="liquid liquid-b"></div>
          <div class="liquid liquid-c"></div>

          <div class="beam beam-a"></div>
          <div class="beam beam-b"></div>
          <div class="beam beam-c"></div>

          <div class="constellation constellation-a"></div>
          <div class="constellation constellation-b"></div>
          <div class="constellation constellation-c"></div>

          <div class="halo halo-a"></div>
          <div class="halo halo-b"></div>
          <div class="halo halo-c"></div>
          <div class="halo halo-d"></div>
          <div class="halo halo-e"></div>

          <div class="spark spark-a"></div>
          <div class="spark spark-b"></div>
          <div class="spark spark-c"></div>
          <div class="spark spark-d"></div>
          <div class="spark spark-e"></div>
          <div class="spark spark-f"></div>

          <div class="hero-portrait">
            <img :src="selectedCharacter.avatar" :alt="selectedCharacter.name">
          </div>
          <div class="status-pill">已启用</div>
        </div>
      </article>

      <section class="action-board">
        <a class="feature-card levels-card" href="./levels.html">
          <p class="card-kicker">推进战线</p>
          <strong>关卡挑战</strong>
          <span>从 {{ activeLevel.name }} 继续推进，解锁更高难度与更多奖励。</span>
        </a>

        <a class="feature-card profile-card" href="./profile.html">
          <p class="card-kicker">查看状态</p>
          <strong>个人主页</strong>
          <span>查看当前资源、战绩、已解锁角色和云存档同步状态。</span>
        </a>

        <a class="feature-card world-card" href="./world.html">
          <p class="card-kicker">设定档案</p>
          <strong>世界观</strong>
          <span>阅读公告、背景设定与当前版本的核心作战规则。</span>
        </a>

        <a class="feature-card shop-card" href="./shop.html">
          <p class="card-kicker">队员集结</p>
          <strong>角色图鉴</strong>
          <span>比较角色数值与机制，招募成员并切换当前出战阵容。</span>
        </a>

        <a class="feature-card equipment-card" href="./equipment.html">
          <p class="card-kicker">战前调整</p>
          <strong>装备配置</strong>
          <span>选择永久生效的出战装备，为下一场战斗追加特性加成。</span>
        </a>
      </section>

      <section class="stats-grid">
        <article class="panel metric-card">
          <div class="panel-header">
            <h3>当前货币</h3>
            <span>资源</span>
          </div>
          <div class="stat-number">{{ progress.zhuYue }}</div>
        </article>

        <article class="panel metric-card">
          <div class="panel-header">
            <h3>已解锁角色</h3>
            <span>队伍</span>
          </div>
          <div class="stat-number">{{ progress.unlockedCharacterIds.length }}</div>
        </article>

        <article class="panel metric-card">
          <div class="panel-header">
            <h3>已通关关卡</h3>
            <span>进度</span>
          </div>
          <div class="stat-number">{{ progress.clearedLevelIds.length }}</div>
        </article>
      </section>
    </section>
  </PageLayout>
</template>
<script>
import PageLayout from '@/components/PageLayout.vue'
import { useGameState } from '@/state/useGameState'

export default {
  components: { PageLayout },
  setup() {
    return useGameState()
  }
}
</script>

<style scoped lang="scss">
.lobby-layout {
  gap: 22px;
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 420px);
  gap: 24px;
  align-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 16%, rgba(127, 231, 255, 0.18), transparent 22%),
    radial-gradient(circle at 14% 88%, rgba(255, 199, 120, 0.16), transparent 25%),
    linear-gradient(145deg, rgba(14, 30, 48, 0.86), rgba(8, 18, 32, 0.76));
}

.hero-copy {
  display: grid;
  gap: 14px;
}

.hero-copy h2 {
  margin: 0;
  font-size: clamp(2.2rem, 4vw, 3.7rem);
  line-height: 0.95;
}

.hero-tag {
  margin: 0;
  color: var(--accent);
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.hero-role {
  margin: 0;
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 700;
}

.hero-desc {
  margin: 0;
  max-width: 54ch;
  line-height: 1.8;
}

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-stats span {
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #dff6ff;
  font-size: 0.92rem;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hero-visual {
  position: relative;
  min-height: 380px;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.nebula,
.liquid,
.halo,
.beam,
.spark,
.constellation {
  position: absolute;
  border-radius: 50%;
}

.nebula {
  filter: blur(38px);
  opacity: 0.72;
  mix-blend-mode: screen;
}

.nebula-a {
  width: 220px;
  height: 180px;
  top: 6%;
  right: 10%;
  background: radial-gradient(circle, rgba(127, 231, 255, 0.28), transparent 72%);
  animation: orbitFloat 12s ease-in-out infinite;
}

.nebula-b {
  width: 180px;
  height: 180px;
  left: 6%;
  bottom: 10%;
  background: radial-gradient(circle, rgba(144, 166, 255, 0.24), transparent 70%);
  animation: orbitFloat 15s ease-in-out infinite reverse;
}

.nebula-c {
  width: 160px;
  height: 130px;
  top: 42%;
  right: 0;
  background: radial-gradient(circle, rgba(255, 199, 120, 0.22), transparent 72%);
  animation: pulseNebula 8s ease-in-out infinite;
}

.liquid {
  filter: blur(22px);
  opacity: 0.8;
}

.liquid-a {
  inset: 16% 22% auto auto;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(127, 231, 255, 0.4), transparent 70%);
  animation: drift 8s ease-in-out infinite;
}

.liquid-b {
  inset: auto auto 18% 14%;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(144, 166, 255, 0.34), transparent 70%);
  animation: drift 11s ease-in-out infinite reverse;
}

.liquid-c {
  inset: 48% 8% auto auto;
  width: 90px;
  height: 90px;
  background: radial-gradient(circle, rgba(255, 199, 120, 0.3), transparent 68%);
  animation: pulse 6s ease-in-out infinite;
}

.halo {
  border: 1px solid rgba(127, 231, 255, 0.18);
}

.halo-a {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-width: 2px;
  border-image: linear-gradient(135deg, rgba(127, 231, 255, 0.58), rgba(144, 166, 255, 0.18), rgba(255, 199, 120, 0.4)) 1;
  animation: spin 18s linear infinite;
}

.halo-b {
  width: 78%;
  aspect-ratio: 1 / 1;
  border-style: dashed;
  border-color: rgba(144, 166, 255, 0.24);
  animation: spin-reverse 16s linear infinite;
}

.halo-c {
  width: 58%;
  aspect-ratio: 1 / 1;
  border-style: dotted;
  border-color: rgba(255, 255, 255, 0.32);
  box-shadow: 0 0 32px rgba(127, 231, 255, 0.12);
  animation: pulse 4s ease-in-out infinite;
}

.halo-d {
  width: 124%;
  aspect-ratio: 1 / 1;
  border: 0;
  background:
    conic-gradient(from 180deg, rgba(127, 231, 255, 0), rgba(127, 231, 255, 0.18), rgba(144, 166, 255, 0.34), rgba(255, 199, 120, 0.16), rgba(127, 231, 255, 0));
  filter: blur(16px);
  animation: shimmerOrbit 9s linear infinite;
}

.halo-e {
  width: 92%;
  aspect-ratio: 1 / 1;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 0 26px rgba(127, 231, 255, 0.12),
    0 0 50px rgba(144, 166, 255, 0.18);
  animation: breathingRing 5.2s ease-in-out infinite;
}

.beam {
  inset: 50% auto auto 50%;
  width: 8px;
  height: 160px;
  border-radius: 999px;
  transform-origin: center top;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(127, 231, 255, 0.16), transparent 86%);
  filter: blur(1px);
  opacity: 0.5;
}

.beam-a {
  transform: translate(-50%, -50%) rotate(14deg);
  animation: beamPulse 4.8s ease-in-out infinite;
}

.beam-b {
  height: 190px;
  transform: translate(-50%, -50%) rotate(136deg);
  animation: beamPulse 5.4s ease-in-out infinite reverse;
}

.beam-c {
  height: 145px;
  transform: translate(-50%, -50%) rotate(252deg);
  animation: beamPulse 4.3s ease-in-out infinite;
}

.spark {
  z-index: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95), rgba(127, 231, 255, 0.52), transparent 72%);
  box-shadow: 0 0 18px rgba(127, 231, 255, 0.34);
}

.spark-a,
.spark-b,
.spark-c,
.spark-d,
.spark-e,
.spark-f {
  width: 14px;
  height: 14px;
}

.spark-a { top: 10%; left: 18%; animation: orbitSpark 6.2s ease-in-out infinite; }
.spark-b { top: 22%; right: 14%; animation: orbitSpark 5.1s ease-in-out infinite reverse; }
.spark-c { bottom: 18%; left: 14%; animation: orbitSpark 7.1s ease-in-out infinite; }
.spark-d { bottom: 12%; right: 18%; animation: orbitSpark 5.8s ease-in-out infinite reverse; }
.spark-e { top: 48%; left: 6%; width: 10px; height: 10px; animation: orbitSpark 4.7s ease-in-out infinite; }
.spark-f { top: 62%; right: 6%; width: 12px; height: 12px; animation: orbitSpark 6.6s ease-in-out infinite reverse; }

.constellation {
  border: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(127, 231, 255, 0.35), rgba(255, 255, 255, 0));
  opacity: 0.42;
  filter: blur(0.4px);
}

.constellation-a {
  width: 180px;
  height: 1px;
  top: 32%;
  left: 18%;
  transform: rotate(18deg);
  animation: starlink 7s ease-in-out infinite;
}

.constellation-b {
  width: 150px;
  height: 1px;
  bottom: 28%;
  right: 16%;
  transform: rotate(-24deg);
  animation: starlink 5.6s ease-in-out infinite reverse;
}

.constellation-c {
  width: 128px;
  height: 1px;
  bottom: 44%;
  left: 12%;
  transform: rotate(-62deg);
  animation: starlink 6.4s ease-in-out infinite;
}

.hero-portrait {
  position: relative;
  z-index: 1;
  width: min(72vw, 290px);
  aspect-ratio: 1 / 1;
  padding: 16px;
  border-radius: 50%;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.08)),
    linear-gradient(180deg, rgba(8, 24, 42, 0.95), rgba(18, 36, 56, 0.78));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.26),
    0 0 0 10px rgba(255, 255, 255, 0.05),
    0 28px 70px rgba(1, 8, 18, 0.4);
  backdrop-filter: blur(18px);
}

.hero-portrait::before {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: conic-gradient(from 180deg, rgba(127, 231, 255, 0), rgba(127, 231, 255, 0.44), rgba(144, 166, 255, 0), rgba(255, 199, 120, 0.32), rgba(127, 231, 255, 0));
  z-index: -1;
  filter: blur(10px);
}

.hero-portrait::after {
  content: '';
  position: absolute;
  inset: 8% 12% auto;
  height: 34%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.54), rgba(255, 255, 255, 0));
  filter: blur(6px);
  opacity: 0.72;
}

.hero-portrait img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 6px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 0 34px rgba(127, 231, 255, 0.18);
}

.status-pill {
  position: absolute;
  right: 4%;
  bottom: 8%;
  z-index: 2;
  padding: 10px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(127, 231, 255, 0.92), rgba(144, 166, 255, 0.86));
  color: #04111f;
  font-weight: 800;
  box-shadow: 0 16px 32px rgba(75, 173, 255, 0.26);
}

.action-board {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}

.feature-card {
  display: grid;
  gap: 10px;
  min-height: 180px;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03)),
    linear-gradient(140deg, rgba(13, 29, 46, 0.88), rgba(9, 19, 34, 0.74));
  box-shadow: 0 24px 60px rgba(2, 8, 20, 0.3);
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
}

.feature-card:hover {
  transform: translateY(-6px);
  border-color: rgba(127, 231, 255, 0.45);
  box-shadow: 0 28px 66px rgba(2, 8, 20, 0.38);
}

.feature-card strong {
  font-size: 1.5rem;
}

.feature-card span,
.card-kicker {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.8;
}

.card-kicker {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}

.levels-card { grid-column: span 5; }
.profile-card { grid-column: span 3; }
.world-card { grid-column: span 4; }
.shop-card { grid-column: span 7; }
.equipment-card { grid-column: span 5; }

.metric-card {
  min-height: 170px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spin-reverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes drift {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-18px) scale(1.06); }
}

@keyframes pulse {
  0%, 100% { transform: scale(0.96); opacity: 0.68; }
  50% { transform: scale(1.05); opacity: 1; }
}

@keyframes orbitFloat {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(12px, -18px, 0) scale(1.08); }
}

@keyframes pulseNebula {
  0%, 100% { transform: scale(0.94); opacity: 0.46; }
  50% { transform: scale(1.08); opacity: 0.86; }
}

@keyframes shimmerOrbit {
  from { transform: rotate(0deg) scale(0.96); }
  to { transform: rotate(360deg) scale(1.04); }
}

@keyframes breathingRing {
  0%, 100% { transform: scale(0.98); opacity: 0.5; }
  50% { transform: scale(1.04); opacity: 0.95; }
}

@keyframes beamPulse {
  0%, 100% { opacity: 0.18; }
  50% { opacity: 0.62; }
}

@keyframes orbitSpark {
  0%, 100% { transform: translateY(0) scale(0.8); opacity: 0.55; }
  50% { transform: translateY(-18px) scale(1.22); opacity: 1; }
}

@keyframes starlink {
  0%, 100% { opacity: 0.18; }
  50% { opacity: 0.58; }
}

@media (max-width: 980px) {
  .hero-panel {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: 320px;
  }

  .feature-card,
  .levels-card,
  .profile-card,
  .world-card,
  .shop-card,
  .equipment-card {
    grid-column: span 12;
    min-height: 156px;
  }
}
</style>

<template>
  <PageLayout
    title="设置中心"
    subtitle="在这里处理账户、兑换码，以及自愿支持站点维护的入口。"
    current-page="settings"
  >
    <section class="page-grid">
      <article class="panel support-panel">
        <div class="panel-header">
          <div>
            <h2>自愿支持</h2>
            <span>站点维护入口</span>
          </div>
        </div>

        <div class="support-layout">
          <img class="support-image" :src="supportImage" alt="微信支持码">

          <div class="support-copy">
            <p>这份支持主要会用于网站日常维护，比如域名、服务器与内容整理。</p>
            <p>是否支持完全随意，不影响正常游玩。页面只提供自愿支持入口，不提供额外权益，也不会和任何功能绑定。</p>
            <p class="support-note">本页面仅作为自愿支持站点维护使用，不属于募捐、公益筹款或付费解锁页面。</p>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>当前账户</h2>
          <div class="action-row compact-actions">
            <a class="btn secondary" href="./index.html">返回大厅</a>
            <a class="btn secondary" href="./profile.html">个人主页</a>
          </div>
        </div>
        <p>当前账户：{{ currentAccount.name }}</p>
      </article>

      <article class="panel">
        <div class="panel-header">
          <div>
            <h2>兑换码</h2>
            <span>一次性到账</span>
          </div>
        </div>
        <p>
          输入兑换码后，系统会自动判断是否有效、对应奖励以及截止时间。
          目前兑换码支持兑换 {{ currencyLabel }} 与部分关卡奖励，每个兑换码只能被一个账户使用一次。
        </p>
        <div class="redeem-row">
          <input
            v-model.trim="redeemInput"
            class="text-input"
            type="text"
            placeholder="输入兑换码"
          >
          <button class="btn" type="button" @click="handleRedeem">立即兑换</button>
        </div>
        <p v-if="session.settingsMessage" class="success-text">{{ session.settingsMessage }}</p>
        <p v-if="session.settingsError" class="error-text">{{ session.settingsError }}</p>
      </article>
    </section>
  </PageLayout>
</template>

<script>
import { ref } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { useGameState } from '@/state/useGameState'
import supportImage from '../../ads/support-wechat.png'

export default {
  components: { PageLayout },
  setup() {
    const state = useGameState()
    const redeemInput = ref('')

    function handleRedeem() {
      const ok = state.redeemCode(redeemInput.value)
      if (ok) {
        redeemInput.value = ''
      }
    }

    return {
      ...state,
      supportImage,
      redeemInput,
      handleRedeem
    }
  }
}
</script>

<style scoped lang="scss">
.compact-actions {
  margin-top: 0;
}

.support-panel {
  gap: 18px;
  background:
    radial-gradient(circle at top left, rgba(127, 231, 255, 0.14), transparent 26%),
    linear-gradient(145deg, rgba(14, 30, 48, 0.86), rgba(8, 18, 32, 0.78));
}

.support-layout {
  display: grid;
  grid-template-columns: minmax(220px, 320px) 1fr;
  gap: 22px;
  align-items: center;
}

.support-image {
  display: block;
  width: min(100%, 320px);
  margin: 0 auto;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 22px 52px rgba(2, 8, 20, 0.28);
}

.support-copy {
  display: grid;
  gap: 12px;
}

.support-copy p {
  margin: 0;
  line-height: 1.8;
}

.support-note {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  font-weight: 700;
}

.redeem-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.text-input {
  flex: 1 1 240px;
  min-height: 46px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-main);
  font-size: 1rem;
  backdrop-filter: blur(12px);
}

.text-input::placeholder {
  color: var(--text-muted);
}

.success-text {
  color: var(--success);
  font-weight: 700;
}

.error-text {
  color: #ff8f8f;
  font-weight: 700;
}

@media (max-width: 860px) {
  .support-layout {
    grid-template-columns: 1fr;
  }
}
</style>

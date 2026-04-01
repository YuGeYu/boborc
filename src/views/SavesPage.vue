<template>
  <PageLayout
    title="存档中心"
    subtitle="在这里管理本地账户、手动存档槽，以及云账户和云存档同步。"
    current-page="saves"
  >
    <section class="page-grid">
      <article class="panel">
        <div class="panel-header">
          <h2>云账户</h2>
          <div class="action-row compact-actions">
            <a class="btn secondary" href="./index.html">返回大厅</a>
            <a class="btn secondary" href="./profile.html">个人主页</a>
          </div>
        </div>

        <div v-if="auth.status === 'authenticated' && auth.user" class="cloud-card">
          <div class="cloud-row">
            <strong>{{ auth.user.displayName }}</strong>
            <span>@{{ auth.user.username }}</span>
          </div>
          <div class="cloud-row muted">
            <span>同步状态：{{ syncStatusText }}</span>
            <span>云端版本：{{ accountStore.syncMeta.cloudVersion || 0 }}</span>
          </div>
          <div class="cloud-row muted">
            <span>最近云端更新时间：{{ formatTime(accountStore.syncMeta.cloudUpdatedAt) }}</span>
            <span>最近同步时间：{{ formatTime(accountStore.syncMeta.lastSyncedAt) }}</span>
          </div>
          <div class="action-row compact-actions">
            <button class="btn" type="button" @click="handleUpload(false)">同步本地到云端</button>
            <button class="btn secondary" type="button" @click="handleDownload">下载云存档</button>
            <button class="btn secondary" type="button" @click="handleUpload(true)">强制覆盖上传</button>
            <button class="btn secondary" type="button" @click="handleLogout">退出登录</button>
          </div>
        </div>

        <div v-else class="auth-grid">
          <section class="auth-card">
            <h3>登录云账户</h3>
            <input v-model.trim="loginForm.username" class="text-input" type="text" placeholder="用户名">
            <input v-model="loginForm.password" class="text-input" type="password" placeholder="密码">
            <p class="rule-text">用户名需为 3 到 24 位，只能使用小写字母、数字和下划线。</p>
            <p class="rule-text">密码至少 6 位。</p>
            <button class="btn" type="button" @click="handleLogin">登录</button>
          </section>

          <section class="auth-card">
            <h3>注册云账户</h3>
            <input v-model.trim="registerForm.displayName" class="text-input" type="text" placeholder="显示名称">
            <input v-model.trim="registerForm.username" class="text-input" type="text" placeholder="用户名">
            <input v-model="registerForm.password" class="text-input" type="password" placeholder="密码">
            <p class="rule-text">用户名需为 3 到 24 位，只能使用小写字母、数字和下划线。</p>
            <p class="rule-text">密码至少 6 位。</p>
            <button class="btn" type="button" @click="handleRegister">创建账户</button>
          </section>
        </div>

        <article v-if="auth.migrationNotice" class="migration-tip">
          <strong>首次登录迁移提示</strong>
          <p>{{ auth.migrationNotice }}</p>
        </article>
        <p v-if="auth.message" class="success-text">{{ auth.message }}</p>
        <p v-if="auth.error" class="error-text">{{ auth.error }}</p>
        <p v-if="auth.syncMessage" class="success-text">{{ auth.syncMessage }}</p>
        <p v-if="auth.syncError" class="error-text">{{ auth.syncError }}</p>
        <p v-if="!auth.apiAvailable" class="muted">
          云端接口暂时不可用，本机本地存档仍然可以继续使用。
        </p>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>当前本地账户</h2>
          <span>保存在浏览器缓存中，离线也能继续游玩。</span>
        </div>
        <div class="account-banner">
          <strong>{{ currentAccount.name }}</strong>
          <span>货币：{{ progress.zhuYue }}</span>
          <span>已通关：{{ progress.clearedLevelIds.length }}</span>
          <span>最近本地更新时间：{{ formatTime(accountStore.syncMeta.localUpdatedAt) }}</span>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>本地账户</h2>
          <span>在当前设备上切换或创建更多本地档案。</span>
        </div>
        <div class="account-grid">
          <button
            v-for="account in accountStore.accounts"
            :key="account.id"
            class="account-card"
            :class="{ active: account.id === currentAccount.id }"
            @click="switchAccount(account.id)"
          >
            <strong>{{ account.name }}</strong>
            <span>创建时间：{{ formatTime(account.createdAt) }}</span>
          </button>
        </div>

        <div class="create-row">
          <input v-model.trim="newAccountName" class="text-input" type="text" placeholder="新的本地账户名称">
          <button class="btn" type="button" @click="handleCreateAccount">创建本地账户</button>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>存档槽</h2>
          <span>对当前本地账户进行手动保存和读取。</span>
        </div>
        <div class="slot-grid">
          <div v-for="slot in currentAccount.saveSlots" :key="slot.id" class="slot-card">
            <strong>{{ slot.name }}</strong>
            <p v-if="slot.progress">保存时间：{{ formatTime(slot.savedAt) }}</p>
            <p v-else>这个存档槽还是空的。</p>
            <p v-if="slot.readOnly" class="slot-tip">
              自动存档会始终跟随当前本地进度自动更新，只能读取，不能手动覆盖。
            </p>
            <div class="action-row compact-actions">
              <button class="btn" type="button" :disabled="slot.readOnly" @click="saveToSlot(slot.id)">
                {{ slot.readOnly ? '只读存档' : '保存当前进度' }}
              </button>
              <button class="btn secondary" type="button" @click="loadFromSlot(slot.id)">读取这个存档</button>
            </div>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>重新开始</h2>
          <span>为当前本地账户创建一份全新的空白进度。</span>
        </div>
        <p>这只会重置当前本地账户，你之后仍然可以从手动存档槽或云存档恢复进度。</p>
        <button class="btn" type="button" @click="startFreshSave">开启空白存档</button>
      </article>

      <article v-if="session.saveMessage || session.saveError" class="panel">
        <p v-if="session.saveMessage" class="success-text">{{ session.saveMessage }}</p>
        <p v-if="session.saveError" class="error-text">{{ session.saveError }}</p>
      </article>
    </section>
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
    const newAccountName = ref('')
    const loginForm = reactive({
      username: '',
      password: ''
    })
    const registerForm = reactive({
      displayName: '',
      username: '',
      password: ''
    })

    const syncStatusText = computed(() => {
      const map = {
        idle: '未同步',
        syncing: '同步中',
        synced: '已同步',
        conflict: '发生冲突',
        offline: '离线'
      }

      return map[state.auth.syncStatus] || state.auth.syncStatus || '未同步'
    })

    function formatTime(value) {
      if (!value) {
        return '--'
      }

      return new Date(value).toLocaleString('zh-CN', { hour12: false })
    }

    function handleCreateAccount() {
      const ok = state.addAccount(newAccountName.value)
      if (ok) {
        newAccountName.value = ''
      }
    }

    async function handleLogin() {
      const ok = await state.loginAccount(loginForm)
      if (ok) {
        loginForm.password = ''
      }
    }

    async function handleRegister() {
      const ok = await state.registerAccount(registerForm)
      if (ok) {
        registerForm.password = ''
      }
    }

    async function handleLogout() {
      await state.logoutAccount()
    }

    async function handleDownload() {
      await state.downloadCloudSave()
    }

    async function handleUpload(force) {
      await state.uploadLocalSave({ force })
    }

    return {
      ...state,
      newAccountName,
      loginForm,
      registerForm,
      syncStatusText,
      formatTime,
      handleCreateAccount,
      handleLogin,
      handleRegister,
      handleLogout,
      handleDownload,
      handleUpload
    }
  }
}
</script>

<style scoped lang="scss">
.compact-actions {
  margin-top: 0;
}

.cloud-card,
.account-banner,
.account-grid,
.slot-grid,
.auth-grid {
  display: grid;
  gap: 14px;
}

.cloud-card,
.account-banner {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.cloud-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
}

.auth-grid,
.account-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.auth-card,
.account-card,
.slot-card {
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.account-card.active {
  outline: 2px solid rgba(127, 231, 255, 0.58);
}

.create-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.text-input {
  width: 100%;
  min-height: 46px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-main);
  font-size: 1rem;
}

.text-input::placeholder {
  color: var(--text-muted);
}

.slot-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.success-text {
  color: var(--success);
  font-weight: 700;
}

.slot-tip,
.rule-text {
  color: var(--text-muted);
}

.rule-text {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.6;
}

.error-text {
  color: #ff8f8f;
  font-weight: 700;
}

.migration-tip {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
}

.migration-tip p {
  margin: 8px 0 0;
}
</style>

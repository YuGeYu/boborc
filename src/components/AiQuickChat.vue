<template>
  <article class="panel ai-panel">
    <div class="panel-header ai-header">
      <div>
        <h2>营地 AI 顾问</h2>
        <span>快速对话 / 战术问答 / 世界观速查</span>
      </div>

      <button class="btn secondary compact-btn" type="button" @click="clearChat">清空对话</button>
    </div>

    <p class="ai-model-desc">{{ modelDescription }}</p>
    <p v-if="!configured" class="ai-warning">当前未配置 AI 对话接口，面板已接入，但还不能真正发送消息。</p>

    <div ref="messageViewport" class="chat-log">
      <div
        v-for="(message, index) in visibleMessages"
        :key="`${message.role}-${index}-${message.content.slice(0, 16)}`"
        class="chat-row"
        :class="`chat-row--${message.role}`"
      >
        <div class="chat-avatar">{{ message.role === 'user' ? '你' : 'AI' }}</div>
        <div class="chat-bubble" v-html="renderMessage(message.content)"></div>
      </div>

      <div v-if="loading" class="chat-row chat-row--assistant">
        <div class="chat-avatar">AI</div>
        <div class="chat-bubble chat-bubble--loading">
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span>正在整理回答…</span>
        </div>
      </div>
    </div>

    <div class="composer">
      <textarea
        v-model="draft"
        class="chat-input"
        rows="4"
        placeholder="问问角色强弱、阵容搭配、关卡打法，或让 AI 帮你理解某个机制。"
        @keydown="handleKeydown"
      />
      <div class="composer-footer">
        <p class="composer-hint">`Enter` 发送，`Shift + Enter` 换行。</p>
        <button class="btn" type="button" :disabled="loading || !draft.trim()" @click="submit">发送</button>
      </div>
      <p v-if="errorMessage" class="ai-error">{{ errorMessage }}</p>
    </div>
  </article>
</template>

<script>
import { computed, nextTick, ref, watch } from 'vue'
import {
  AI_MODEL_DESCRIPTION,
  AI_SYSTEM_PROMPT,
  buildAiContextMessage,
  createInitialAiMessages,
  getAiOffTopicReply,
  isAiQuestionRelevant,
  isAiChatConfigured,
  sendAiChat
} from '@/common/aiChat'

const STORAGE_KEY = 'boborc-ai-quick-chat'

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderSimpleMarkdown(value) {
  const escaped = escapeHtml(value)
  return escaped
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${String(code).trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

function normalizeStoredMessages(value) {
  if (!Array.isArray(value)) {
    return createInitialAiMessages()
  }

  const filtered = value.filter(item => item && item.role && item.content)
  return filtered.length ? filtered : createInitialAiMessages()
}

export default {
  props: {
    gameContext: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const configured = isAiChatConfigured()
    const modelDescription = AI_MODEL_DESCRIPTION
    const draft = ref('')
    const loading = ref(false)
    const errorMessage = ref('')
    const messageViewport = ref(null)

    let storedMessages = createInitialAiMessages()
    try {
      storedMessages = normalizeStoredMessages(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'))
    } catch (error) {
      storedMessages = createInitialAiMessages()
    }

    const messages = ref(storedMessages)
    const visibleMessages = computed(() => messages.value)

    function persistMessages() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value.slice(-24)))
    }

    function scrollToBottom() {
      nextTick(() => {
        const viewport = messageViewport.value
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight
        }
      })
    }

    function clearChat() {
      messages.value = createInitialAiMessages()
      errorMessage.value = ''
      persistMessages()
      scrollToBottom()
    }

    function renderMessage(value) {
      return renderSimpleMarkdown(value)
    }

    function buildRequestMessages(userContent) {
      return [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'system', content: `当前游戏上下文：\n${buildAiContextMessage(props.gameContext)}` },
        ...messages.value,
        { role: 'user', content: userContent }
      ]
    }

    async function submit() {
      const content = draft.value.trim()
      if (!content || loading.value) {
        return
      }

      errorMessage.value = ''
      draft.value = ''
      messages.value = [...messages.value, { role: 'user', content }]
      persistMessages()
      scrollToBottom()

      if (!isAiQuestionRelevant(content, props.gameContext)) {
        messages.value = [...messages.value, { role: 'assistant', content: getAiOffTopicReply() }]
        persistMessages()
        scrollToBottom()
        return
      }

      if (!configured) {
        errorMessage.value = 'AI 接口暂未配置，面板结构已经接好。'
        return
      }

      loading.value = true
      try {
        const reply = await sendAiChat(buildRequestMessages(content))
        messages.value = [...messages.value, reply]
        persistMessages()
        scrollToBottom()
      } catch (error) {
        errorMessage.value = 'AI 暂时没有成功返回结果，请稍后再试。'
      } finally {
        loading.value = false
      }
    }

    function handleKeydown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        submit()
      }
    }

    watch(() => props.gameContext, () => {
      errorMessage.value = ''
    }, { deep: true })

    scrollToBottom()

    return {
      configured,
      modelDescription,
      draft,
      errorMessage,
      handleKeydown,
      loading,
      messageViewport,
      renderMessage,
      submit,
      clearChat,
      visibleMessages
    }
  }
}
</script>

<style scoped lang="scss">
.ai-panel {
  display: grid;
  gap: 16px;
}

.ai-header {
  align-items: start;
}

.compact-btn {
  min-height: 40px;
  padding: 8px 14px;
}

.ai-model-desc,
.ai-warning,
.composer-hint,
.ai-error {
  margin: 0;
}

.ai-warning {
  color: #ffd89b;
}

.chat-log {
  display: grid;
  gap: 12px;
  max-height: 540px;
  overflow-y: auto;
  padding: 8px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)),
    rgba(3, 11, 20, 0.34);
}

.chat-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.chat-row--user {
  flex-direction: row-reverse;
}

.chat-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 800;
  flex: 0 0 auto;
  background: linear-gradient(135deg, rgba(127, 231, 255, 0.9), rgba(144, 166, 255, 0.84));
  color: #04111f;
}

.chat-row--user .chat-avatar {
  background: linear-gradient(135deg, rgba(255, 199, 120, 0.95), rgba(255, 146, 100, 0.86));
}

.chat-bubble {
  max-width: min(100%, 760px);
  padding: 12px 14px;
  border-radius: 18px;
  line-height: 1.75;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  word-break: break-word;
}

.chat-row--user .chat-bubble {
  background: rgba(127, 231, 255, 0.14);
}

.chat-bubble :deep(code) {
  padding: 2px 6px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  font-family: Consolas, monospace;
}

.chat-bubble :deep(pre) {
  margin: 8px 0 0;
  padding: 12px;
  border-radius: 14px;
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.22);
}

.chat-bubble--loading {
  display: flex;
  gap: 8px;
  align-items: center;
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: aiBounce 1.2s infinite ease-in-out;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.16s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.32s;
}

.composer {
  display: grid;
  gap: 10px;
}

.chat-input {
  width: 100%;
  min-height: 110px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
  resize: vertical;
}

.composer-footer {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.ai-error {
  color: #ff9e9e;
  font-weight: 700;
}

@keyframes aiBounce {
  0%, 80%, 100% { transform: scale(0.65); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

@media (max-width: 860px) {
  .ai-header,
  .composer-footer {
    display: grid;
    gap: 12px;
  }
}
</style>

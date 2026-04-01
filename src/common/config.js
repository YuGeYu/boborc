const rawApiUrl = process.env.VUE_APP_API_URL
const rawAiChatApiUrl = process.env.VUE_APP_AI_CHAT_API_URL
const rawAiChatApiKey = process.env.VUE_APP_AI_CHAT_API_KEY

export const API_URL = rawApiUrl && rawApiUrl !== 'https://example.com'
  ? rawApiUrl
  : '/api'

export const DEBUG_MODE = process.env.VUE_APP_DEBUG_MODE === 'true'

export const AI_CHAT_API_URL = rawAiChatApiUrl && rawAiChatApiUrl !== 'https://example.com'
  ? rawAiChatApiUrl
  : 'https://platform.aitools.cfd/api/v1/chat/completions'

export const AI_CHAT_API_KEY = rawAiChatApiKey || ''

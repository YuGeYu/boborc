import { AI_CHAT_API_KEY, AI_CHAT_API_URL } from '@/common/config'

export const AI_MODEL_ID = 'zhipu/glm-4-flash'
export const AI_MODEL_DESCRIPTION = '快速对话已启用，适合角色推荐、关卡建议和机制解释。'

export const AI_SYSTEM_PROMPT = `你是《嘎嘣小队出击》的营地档案官兼战术顾问。

回答规则：
1. 只用简洁、自然、直接的中文回答。
2. 只能基于对话里提供的游戏上下文回答，不允许编造不存在的角色、关卡、装备、组织或剧情名词。
3. 如果玩家让你“推荐一个适合当前进度的角色”，你必须优先参考当前关卡、已解锁角色、当前货币和已选角色来回答。
4. 做推荐时，必须明确点名 1 到 3 个“当前游戏里真实存在且已解锁或可购买”的角色，并说明原因。
5. 如果某个推荐受限于货币不足、尚未解锁或当前版本信息不足，要直接说清楚限制，不要模糊带过。
6. 如果玩家问机制，优先解释“怎么触发、实际效果、适合什么场景、弱点是什么”。
7. 不要说“请告诉我更多信息”这种空话；如果上下文已经足够，就直接给建议。如果上下文仍然不足，也要先基于现有信息给一个最好版本的回答。
8. 如果玩家的问题与《嘎嘣小队出击》无关，你必须直接拒绝回答，并明确说明“这里只回答《嘎嘣小队出击》相关内容”，然后引导对方改问角色、关卡、装备、机制或世界观问题。
9. 禁止输出与本游戏无关的泛化模板答案，尤其禁止使用类似“嘎嘣小兵、嘎嘣队长、嘎嘣狙击手”这种未出现在上下文里的名字。`

export function createInitialAiMessages() {
  return [
    {
      role: 'assistant',
      content: '我是营地档案官。你可以直接问我角色推荐、关卡打法、装备取舍，或者让帮你解释某个机制。'
    }
  ]
}

export function buildAiContextMessage(context = {}) {
  const {
    selectedCharacterName = '未知',
    activeLevelId = '?',
    activeLevelName = '未知关卡',
    currencyLabel = '货币',
    zhuYue = 0,
    unlockedCharacterNames = [],
    lockedCharacterSummaries = [],
    clearedLevelIds = []
  } = context

  return [
    `当前出战角色：${selectedCharacterName}`,
    `当前关卡：第 ${activeLevelId} 关（${activeLevelName}）`,
    `当前货币：${zhuYue} ${currencyLabel}`,
    `已解锁角色：${unlockedCharacterNames.join('、') || '无'}`,
    `已通关关卡：${clearedLevelIds.length ? clearedLevelIds.join('、') : '无'}`,
    `可购买但未解锁角色：${lockedCharacterSummaries.join('；') || '无'}`
  ].join('\n')
}

export function buildAiDomainKeywords(context = {}) {
  const dynamicKeywords = [
    context.selectedCharacterName,
    context.activeLevelName,
    ...(context.unlockedCharacterNames || []),
    ...((context.lockedCharacterSummaries || []).map(item => String(item).split('（')[0]))
  ]

  return [
    '嘎嘣小队出击',
    '嘎嘣',
    '鸽吻',
    '角色',
    '阵容',
    '关卡',
    '第100关',
    '100关',
    '装备',
    '机制',
    '世界观',
    '出战',
    '招募',
    '通关',
    '朱玥',
    '战斗',
    'boss',
    '敌人',
    '营地',
    '梦想猫虫',
    '大蒜',
    'IQ45',
    '无敌小可爱',
    '鱼子酱',
    '河边的小帅',
    '河边小帅',
    ...dynamicKeywords.filter(Boolean)
  ]
}

export function isAiQuestionRelevant(content, context = {}) {
  const text = String(content || '').trim()
  if (!text) {
    return true
  }

  const keywords = buildAiDomainKeywords(context)
  return keywords.some(keyword => text.includes(keyword))
}

export function getAiOffTopicReply() {
  return '这里是《嘎嘣小队出击》的营地 AI，只回答本游戏相关内容。你可以改问我角色推荐、关卡打法、装备选择、机制解释或世界观设定。'
}

export function isAiChatConfigured() {
  return Boolean(AI_CHAT_API_URL && AI_CHAT_API_KEY)
}

export async function sendAiChat(messages) {
  if (!isAiChatConfigured()) {
    throw new Error('AI_CHAT_NOT_CONFIGURED')
  }

  const response = await fetch(AI_CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_CHAT_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL_ID,
      messages,
      temperature: 0.4,
      max_tokens: 1200
    })
  })

  if (!response.ok) {
    throw new Error(`AI_CHAT_REQUEST_FAILED_${response.status}`)
  }

  const data = await response.json()
  const message = data?.choices?.[0]?.message
  if (!message?.content) {
    throw new Error('AI_CHAT_INVALID_RESPONSE')
  }

  return message
}

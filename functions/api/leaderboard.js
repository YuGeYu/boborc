import { getLeaderboardEntries } from '../_lib/db'
import { json } from '../_lib/http'

export async function onRequestGet(context) {
  const entries = await getLeaderboardEntries(context.env.DB, 50)

  return json({
    ok: true,
    entries,
    settlementRule: {
      day: '每周日',
      time: '23:00',
      rewards: [
        { rank: 1, reward: 50 },
        { rank: 2, reward: 30 }
      ],
      claimNotice: '排行榜奖励不会自动发放。请在结算后截图联系开发者 QQ2641821302 获取兑换码。'
    }
  })
}

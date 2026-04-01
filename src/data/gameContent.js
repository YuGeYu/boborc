import starterAvatar from '../../ads/b_146b0dbd5077c51fde4b0ec2a1334462.jpg'
import aiAvatar from '../../ads/b_53d714b809f69d41ba13413d3cda05ec.jpg'
import strikerAvatar from '../../ads/b_040b052f832a7d77f990cf3f47f05b77.jpg'
import tankAvatar from '../../ads/b_9a778a55e09c0b2c05a01914cca01f76.jpg'
import garlicAvatar from '../../ads/garlic.jpg'
import wudiXiaokeaiAvatar from '../../ads/wudi-xiaokeai.jpg'
import iq45Avatar from '../../ads/b_b9e7427c2e9f147ff57c19d9147bb4a4.jpg'
import gabengAvatar from '@/game/assets/gabeng-face.jpg'
import yuzijiangAvatar from '@/game/assets/yuzijiang.jpg'
import yuxingheAvatar from '../../ads/yuxinghe.jpg'
import smileBoboProjectile from '@/game/assets/smile-bobo.jpg'
import cryBoboProjectile from '@/game/assets/cry-bobo.jpg'
import redBoboProjectile from '@/game/assets/red-bobo.jpg'
import gabengArrowProjectile from '@/game/assets/gabeng-arrow.png'
import dreamCatbugAvatar from '@/game/assets/dream-catbug-avatar.jpg'
import starterRiversideSkinPreview from '@/game/assets/skins/starter-riverside-preview.png'
import starterMuqiaoSkinSprite from '@/game/assets/chatgpt-usable-spritesheet.png'
import qingningSkinPreview from '@/game/assets/skins/qingning-skin-preview.png'
import qingningSkinSprite from '@/game/assets/skins/qingning-spritesheet-compatible.png'

export const CURRENCY_LABEL = '朱玥'
export const ACTIVITY_CURRENCY_LABEL = '星辉徽记'
export const SUPER_CABBO_UNLOCK_LEVEL = 10
export const GABENG_SPLIT_LEVEL_ID = 100
export const FINAL_LEVEL_ID = 200
export const ATTACK_COOLDOWNS = {
  punchMs: 390,
  kickMs: 450
}
export const STARTER_SKIN_UNLOCK_LEVEL = 8

export const CHARACTER_SKINS = {
  starter: [
    {
      id: 'starter-default',
      name: '默认皮肤',
      type: 'default'
    },
    {
      id: 'starter-muqiao',
      name: '暮桥便装',
      type: 'skin',
      unlockMasteryLevel: STARTER_SKIN_UNLOCK_LEVEL,
      preview: starterRiversideSkinPreview,
      battleSpriteSheet: starterMuqiaoSkinSprite,
      description: '一套更贴近日常街头感的格斗装扮，保留了小帅的轻快体态。'
    }
  ],
  striker: [
    {
      id: 'striker-default',
      name: '默认皮肤',
      type: 'default'
    },
    {
      id: 'striker-qingning-sprint',
      name: '疾风突进',
      type: 'skin',
      unlockMasteryLevel: STARTER_SKIN_UNLOCK_LEVEL,
      preview: qingningSkinPreview,
      battleSpriteSheet: qingningSkinSprite,
      battleSpriteSheetConfig: {
        frameWidth: 67,
        frameHeight: 113
      },
      battleSpriteScale: {
        x: 2,
        y: 2
      },
      battleSpriteAnimations: {
        walk: { frames: [0, 1, 2, 3, 4, 5], frameRate: 8, repeat: 0 },
        idle: { frames: [6, 7, 8, 9, 10], frameRate: 6, repeat: 0 },
        jumpkick: { frames: [15, 21, 17, 21], frameRate: 10, repeat: 0 },
        punch: { frames: [12, 13, 14], frameRate: 7, repeat: 0 },
        win: { frames: [9, 10], frameRate: 2, repeat: 0 },
        die: { frames: [22, 23, 24], frameRate: 4, repeat: 0 }
      },
      description: '以青柠高机动突进为核心设计的战斗皮肤，保留轻快压制节奏，并替换为新的战斗动作 spritesheet。'
    }
  ]
}

export const UNEQUIPPED_EVOLUTION_OPTIONS = [
  {
    id: 'alert-pulse-ring',
    name: '警戒脉环',
    description: '进化后只要有非己方单位进入角色前后 110、上下 130 的范围内，就会每秒受到相当于角色当前拳击基础伤害 10% 的脉冲伤害。',
    bonuses: {
      proximityPulseDamageRatio: 0.1,
      proximityPulseRange: 110,
      proximityPulseVerticalRange: 130
    }
  },
  {
    id: 'shockwave-greaves',
    name: '震踢回响',
        description: '进化后飞踢命中首个非己方单位时，会对其周围左右 120、上下 120 范围内的非己方单位造成本次首段实际伤害 10% 的溅射伤害。',
    bonuses: {
      kickSplashDamageRatio: 0.1,
      kickSplashRange: 120,
      kickSplashVerticalRange: 120
    }
  }
]
export const EQUIPMENT_OPTIONS = [
  {
    id: 'sword',
    name: '普通剑',
    type: 'attack',
    description: '拳击和飞踢基础伤害都增加 2 点。',
    bonuses: {
      punchDamage: 2,
      kickDamage: 2
    },
    evolutionPaths: [
      {
        id: 'pojun-edge',
        name: '破军锋',
        description: '进化后拳击和飞踢基础伤害都增加 4 点。',
        bonuses: {
          punchDamage: 4,
          kickDamage: 4
        }
      },
      {
        id: 'liuguang-blade',
        name: '流光刃',
        description: '进化后拳击和飞踢基础伤害都增加 2 点，并额外获得 1 次 30% 拳击回血。',
        bonuses: {
          punchDamage: 2,
          kickDamage: 2,
          punchHealCharges: 1,
          punchHealRatio: 0.3
        }
      }
    ]
  },
  {
    id: 'shield',
    name: '普通盾',
    type: 'guard',
    description: '获得 1 次 30% 减伤护盾。',
    bonuses: {
      shieldCharges: 1,
      shieldReduction: 0.3
    },
    evolutionPaths: [
      {
        id: 'yaogang-bulwark',
        name: '曜钢壁垒',
        description: '进化后获得 1 次 60% 减伤护盾。',
        bonuses: {
          shieldCharges: 1,
          shieldReduction: 0.6
        }
      },
      {
        id: 'liufeng-cloak',
        name: '流风斗篷',
        description: '进化后获得常驻护盾效果，每次受到伤害时减伤 10%。',
        bonuses: {
          persistentDamageReduction: 0.1
        }
      }
    ]
  },
  {
    id: 'shoes',
    name: '普通鞋',
    type: 'speed',
    description: '移动速度增加 40。',
    bonuses: {
      moveSpeed: 40
    },
    evolutionPaths: [
      {
        id: 'zhuifeng-lv',
        name: '逐风行履',
        description: '进化后移动速度增加 80。',
        bonuses: {
          moveSpeed: 80
        }
      },
      {
        id: 'lingyue-boots',
        name: '凌跃战靴',
        description: '进化后移动速度增加 40，跳跃力度增加 50。',
        bonuses: {
          moveSpeed: 40,
          jumpVelocity: 50
        }
      }
    ]
  },
  {
    id: 'spring',
    name: '普通弹簧',
    type: 'jump',
    description: '跳跃力度增加 50。',
    bonuses: {
      jumpVelocity: 50
    },
    evolutionPaths: [
      {
        id: 'rebound-core',
        name: '反震簧芯',
        description: '进化后只要有非己方单位成功攻击角色，每次都有 10% 概率让攻击者眩晕 0.5 秒。',
        bonuses: {
          jumpVelocity: 50,
          retaliatoryStunChance: 0.1,
          retaliatoryStunDurationMs: 500
        }
      },
      {
        id: 'quake-spring',
        name: '震岳跃簧',
        description: '进化后每次被非己方单位成功攻击，角色跳跃力度增加 2%；跳跃结束落地时，会对周围左右 120、上下 120 范围内的非己方单位造成等于本次跳跃高度 10% 的震击伤害。',
        bonuses: {
          jumpVelocity: 50,
          jumpRetaliationBoostPerHit: 0.02,
          landingShockwaveHeightRatio: 0.1,
          landingShockwaveRange: 120,
          landingShockwaveVerticalRange: 120
        }
      }
    ]
  }
]

export const PLAYER_CHARACTERS = [
  {
    id: 'starter',
    name: '河边的小帅',
    title: '新手过渡型',
    avatar: starterAvatar,
    unlockCost: 0,
    passive: '生命低于初始值后，拳击命中会回复部分生命；飞踢命中还能补充减伤护盾。',
    skills: [
      'J 普通拳：生命低于 30 时，命中后回复本次伤害的 60% 生命，且生命不会超过 30。',
      'K 普通飞踢：取消追击；每次命中敌人都会额外获得 1 层减伤护盾。'
    ],
    abilities: {
      mode: 'starter-lifesteal',
      shieldCharges: 1,
      shieldReduction: 0.3,
      kickRangeBonus: 6,
      kickBonusDamage: 1
    },
    details: {
      moveSpeed: '中速',
      punchMechanic: '拳击基础伤害 = 3。生命低于 30 时，命中回复本次伤害的 60%，但不会超过生命上限。',
      kickMechanic: '飞踢基础伤害 = 6，首段额外附加 1 点伤害，所以实际首段伤害 = 7。',
      passiveDetail: '开局自带 1 层 30% 减伤护盾，每次飞踢命中都会再补 1 层。',
      remarks: '偏前期续航，适合稳扎稳打。',
      story: '河边的小帅原本只是营地附近最不起眼的孩子，没人觉得他会站上最前线。可也正因为总是在旁边看着别人受伤、看着撤离路线被一点点堵死，他最早学会的不是炫技，而是怎么活下来、怎么把同伴带回来。他的拳脚没有花哨传说，只有一股很难被打断的韧劲。每次顶着伤继续站稳，都是在提醒自己，哪怕只是最普通的人，也能成为队伍里最先撑住局面的人。'
    },
    stats: {
      health: 30,
      moveSpeed: 160,
      jumpVelocity: 560,
      punchDamage: 3,
      kickDamage: 6
    }
  },
  {
    id: 'striker',
    name: '青柠',
    title: '轻快突进型',
    avatar: strikerAvatar,
    unlockCost: 30,
    passive: '依靠速度和先手压制取胜，但身板与容错都更吃操作。',
    skills: [
      'J 青柠快刺：首段命中后自动追加 2 段追击，每段 3 点伤害。',
      'K 疾风飞踢：位移更快，更适合切入与补刀。'
    ],
    abilities: {
      mode: 'striker-combo',
      punchFollowUps: 2,
      punchFollowUpDamage: 3,
      punchFollowUpGapMs: 140,
      kickRangeBonus: 60
    },
    details: {
      moveSpeed: '超高速',
      punchMechanic: '拳击基础伤害 = 6。首段命中后自动追加 2 段追击，每段伤害 = 3。',
      kickMechanic: '飞踢基础伤害 = 9，额外判定距离 = 60。',
      passiveDetail: '拳击追击强调站位与时机，第一段追击稳定，第二段追击取决于敌人是否还留在原位。',
      remarks: '适合打先手与持续压位。',
      story: '青柠总像一阵先到一步的风。别人还在判断距离的时候，她已经决定了切入角度；别人刚准备后撤，她的第二段追击已经追到了脸上。她并不是天生就比别人勇敢，只是太习惯把犹豫留在出手之后。营地里最早流传她名字的原因，不是因为她打得最重，而是因为总有人说，刚看见她冲出去，下一秒战局就已经被她重新切开了。'
    },
    stats: {
      health: 58,
      moveSpeed: 199,
      jumpVelocity: 610,
      punchDamage: 6,
      kickDamage: 9
    }
  },
  {
    id: 'tank',
    name: '牢泡猫',
    title: '笨重换血型',
    avatar: tankAvatar,
    unlockCost: 300,
    passive: '损血越多拳击越重，连续飞踢命中还能继续把拳击伤害往上抬。',
    skills: [
      'J 重泡拳：每损失 1 点生命，拳击额外增加 2 点伤害。',
      'K 震荡飞踢：连续命中 2 次以上后，拳击再额外增加对应连击层数伤害。'
    ],
    abilities: {
      mode: 'tank-ramp',
      kickRangeBonus: 10
    },
    details: {
      moveSpeed: '低速',
      punchMechanic: '拳击基础伤害 = 8。每损失 1 点生命，拳击额外增加 2 点伤害。',
      kickMechanic: '飞踢基础伤害 = 12，额外判定距离 = 10。',
      passiveDetail: '拳击增伤没有上限；若飞踢连续命中达到 n 次且 n >= 2，则拳击再额外增加 n 点伤害。',
      remarks: '后期成长型重拳角色。',
      story: '牢泡猫看起来总像是最不适合正面硬拼的那个，动作慢，体型重，挨了打也不爱喊疼。可真正和他并肩打过的人都知道，他越是被逼到后面，拳头就越重。他把很多情绪都压在沉默里，像把怒气和不甘一层层泡进身体，等到真要还手时再一次性砸出去。对他来说，撑住不是消极挨打，而是在等一个能把整场局势反压回去的瞬间。'
    },
    stats: {
      health: 84,
      moveSpeed: 148,
      jumpVelocity: 545,
      punchDamage: 8,
      kickDamage: 12
    }
  },
  {
    id: 'garlic',
    name: '大蒜',
    title: '真假身切换型',
    avatar: garlicAvatar,
    unlockCost: 900,
    passive: '初始以假身作战。第一次假身死亡不会真正出局，而是切换为真身；真身一段时间后恢复为第二次假身。第二次假身死亡后才会真正败北。真假身切换期间无敌，真身阶段全程无法被命中。',
    skills: [
      '假身 J 拳击：基础伤害 35，命中单体后造成击退，并让目标 0.35 秒内无法操作。',
      '假身 K 飞踢：基础伤害 45，对前方路径上的全部目标造成击退，并让目标 0.5 秒内无法操作。',
      '真身 J 突进：向前突进；若命中，则对路径上的全部目标造成 82 伤害、强力击飞并控制 0.7 秒。无论是否命中，都会获得 1 层减伤护盾。',
      '真身 K 锁定起飞：锁定最近目标并控制其 0.9 秒，在起飞阶段造成 168 伤害并造成高击飞；技能结束后立即恢复为第二次假身。'
    ],
    abilities: {
      mode: 'garlic-rebirth',
      garlic: {
        fakePunchDamage: 35,
        fakePunchControlMs: 350,
        fakePunchKnockbackX: 240,
        fakeKickDamage: 45,
        fakeKickControlMs: 500,
        fakeKickRange: 180,
        fakeKickVerticalRange: 150,
        fakeKickKnockbackX: 320,
        trueFormMoveSpeedBonus: 60,
        trueFormDurationMs: 6000,
        transitionInvincibleMs: 900,
        truePunchDamage: 82,
        truePunchDashSpeed: 420,
        truePunchDashDurationMs: 180,
        truePunchRange: 210,
        truePunchControlMs: 700,
        truePunchKnockbackX: 420,
        truePunchKnockbackY: -220,
        trueShieldReduction: 0.3,
        trueKickDamage: 168,
        trueKickLockMs: 900,
        trueKickKnockbackX: 120,
        trueKickKnockbackY: -360,
        trueKickTakeoffDelayMs: 280,
        trueKickRecoverToFakeDelayMs: 520
      }
    },
    details: {
      moveSpeed: '假身 220；真身 280（+60）',
      punchMechanic: '假身 J：基础伤害 = 35，命中单体后附带 350 ms 控制与固定击退。真身 J：向前突进，若突进命中，则对前方路径内所有敌人造成 82 伤害、控制 700 ms，并施加 X = 420、Y = -220 的强击飞；无论是否命中，都会获得 1 层减伤护盾。',
      kickMechanic: '假身 K：基础伤害 = 45，命中前方路径内所有敌人，并附带 500 ms 控制与固定击退。真身 K：锁定最近目标，起飞阶段控制目标 900 ms，并在起飞过程中造成 168 伤害，同时施加 X = 120、Y = -360 的高击飞；结算后立即恢复为第二次假身。',
      passiveDetail: '战斗开始于第一次假身。第一次假身死亡时触发假死亡并切入真身；真身持续 6 秒后恢复为第二次假身。第二次假身死亡才是真死亡。真身阶段与形态切换阶段都无法被命中；真身 J 获得的每层护盾，会在第二次假身阶段将一次受到的伤害降低 30%。',
      remarks: '主打节奏切换、控场和第二条命。',
      story: '营地里第一次见到大蒜时，大家看到的不是想象中的辛辣怪物，而是一朵安静的花。他原本只是生长在角落里的普通花朵，直到故土被战火撕开，才学会把“倒下”伪装成“重生”。假身是他留给世界的温和外表，真身则是一次次破碎之后留下的求生本能。名字像大蒜，外表却是花，因为真正被记住的从来不是样子，而是那种被折断之后仍然会重新长出来的生命力。'
    },
    factSheet: {
      recruitCost: 900,
      baseStats: {
        health: 300,
        moveSpeed: 220,
        jumpVelocity: 600
      },
      formRules: [
        '开局状态 = 第一次假身。',
        '第一次假身死亡 = 假死亡，立即切换真身并将生命重置为 300。',
        '真身持续时间 = 6000 ms，结束后恢复为第二次假身并将生命重置为 300。',
        '第二次假身死亡 = 真死亡。',
        '假身/真身切换无敌时间 = 900 ms。',
        '真身全程不可被敌人命中。'
      ],
      fakeForm: {
        punchDamage: 35,
        punchControlMs: 500,
        kickDamage: 45,
        kickControlMs: 750
      },
      trueForm: {
        moveSpeed: 280,
        punchDamage: 82,
        punchControlMs: 1000,
        punchKnockbackX: 420,
        punchKnockbackY: -220,
        kickDamage: 168,
        kickControlMs: 1400,
        kickKnockbackX: 120,
        kickKnockbackY: -360,
        shieldReductionPerStack: 0.3
      }
    },
    stats: {
      health: 300,
      moveSpeed: 220,
      jumpVelocity: 600,
      punchDamage: 35,
      kickDamage: 45
    }
  },
  {
    id: 'wudi-xiaokeai',
    name: '无敌小可爱',
    title: '跃空崩裂型',
    avatar: wudiXiaokeaiAvatar,
    unlockCost: 1100,
    passive: '拥有 1 次致命伤免疫。触发后会进入“亡崩死裂”，连续锁定 3 个非己方单位进行跳跃拳击清场，期间全程无法命中、霸体、无敌。',
    skills: [
      'J 无停冲拳：向前冲锋并穿过路径上的所有单位；冲锋结束后，对路径上的全部非己方单位造成当前拳击基础伤害 + 其 10% 的额外伤害，并将其原地击飞控制 0.5 秒。',
      'K 锁空飞踢：锁定最近的非己方单位，原地跃起后以飞踢姿态命中目标；造成当前飞踢基础伤害 + 其 10% 的额外伤害，并在落点周围引发基于跳跃高度的震击。',
      '被动 亡崩死裂：首次受到致命伤害时免疫该次死亡，依次锁定最近的 3 个非己方单位发动跳跃拳击；每段都附带额外伤害、原地击飞和落点震击。'
    ],
    abilities: {
      mode: 'wudi-xiaokeai',
      fatalGuardCharges: 1,
      fatalGuardLife: 1,
      wudiXiaokeai: {
        punchDashSpeed: 540,
        punchDashDurationMs: 260,
        punchPathVerticalRange: 140,
        punchBonusRatio: 0.1,
        punchControlMs: 500,
        punchControlKnockbackY: -220,
        kickBonusRatio: 0.1,
        kickLockRange: 9999,
        kickTakeoffVelocity: 300,
        kickTravelDelayMs: 240,
        kickRecoverDelayMs: 520,
        kickShockwaveHeightRatio: 0.1,
        kickShockwaveRange: 128,
        kickShockwaveVerticalRange: 128,
        deathDanceLockCount: 3,
        deathDanceJumpIntervalMs: 420,
        deathDanceStartDelayMs: 120,
        deathDanceTotalDurationMs: 1800,
        deathDanceShockwaveHeightRatio: 0.1,
        deathDanceShockwaveRange: 132,
        deathDanceShockwaveVerticalRange: 132
      }
    },
    details: {
      moveSpeed: '移动速度 200',
      punchMechanic: '拳击基础伤害 = 35。出拳时会向前高速冲锋，冲锋结束后，路径上的全部非己方单位都会受到当前拳击基础伤害 + 其 10% 的额外伤害，并被原地击飞控制 0.5 秒；若拳击基础伤害被装备等效果抬高，额外伤害也会同步抬高。',
      kickMechanic: '飞踢基础伤害 = 45。施放时会锁定最近的非己方单位，命中目标时造成当前飞踢基础伤害 + 其 10% 的额外伤害，并对目标周围左右 128、上下 128 范围内的非己方单位造成等于本次跳跃高度 10% 的震击伤害。',
      passiveDetail: '首次致命伤会被免疫并保留 1 点生命，随后进入“亡崩死裂”。期间无法被命中、不会被打断，也不会受到任何伤害；会连续完成 3 次跳跃拳击，每次都带有单体爆发、0.5 秒原地击飞，以及对目标周围左右 132、上下 132 范围内的震击伤害。',
      remarks: '高成本、高压制、极强残局翻盘能力。喜爱跳跃，进攻节奏围绕跃击、锁定和范围清场展开。',
      story: '无敌小可爱平时总是一副软绵绵、跳来跳去的样子，像是永远不会真正生气。但一旦同伴被逼到角落，或自己被打到濒死，那份“可爱”会瞬间裂开，露出近乎不讲道理的强冲与连锁崩裂。它不喜欢站着对拼，更喜欢把战场切成一段段短暂而暴烈的跃击轨迹，让对手在还没看清下一落点之前就被轰回地面。'
    },
    stats: {
      health: 350,
      moveSpeed: 200,
      jumpVelocity: 600,
      punchDamage: 35,
      kickDamage: 45
    }
  },
  {
    id: 'iq45',
    name: 'IQ45',
    title: '笨脑巨力型',
    avatar: iq45Avatar,
    unlockCost: 1300,
    passive: '生命跌破基础生命 20% 后会只触发一次石像化；石像期间不会掉血，反而会把受到的伤害转成回血。',
    skills: [
      'J 呆拳：平时是普通拳击。拳击能量攒满后，下一拳会变成强化拳击，造成当前拳击基础伤害 2.6 倍的伤害，并对目标附近非己方单位造成当前拳击基础伤害 10% 的溅射。',
      'K 牵引飞踢：常规范围内就是普通飞踢；拳击命中会为飞踢充能，飞踢能量攒满后，若目标只在加长判定距离内，才会先把目标拉到面前，再打出更重的强化飞踢并附带更强的击退控制。',
      '被动 石像脑回路：生命低于基础生命 20% 时会定在原地化为石像一段时间。石像期间受到攻击不会掉血，而会回复该次本应损失生命的 20%；结束时若总回复不足 60，则额外回复 60，否则会对最近的非己方单位造成 45 点反震伤害。'
    ],
    abilities: {
      mode: 'iq45-bruiser',
      iq45: {
        punchEnergyMax: 100,
        punchEnergyPerSecond: 25,
        enhancedPunchDamageMultiplier: 2.6,
        enhancedPunchSplashRatio: 0.1,
        enhancedPunchSplashRange: 132,
        enhancedPunchSplashVerticalRange: 120,
        splashEnergyPerDamage: 4,
        extendedKickEnergyMax: 100,
        extendedKickEnergyPerPunchHit: 50,
        extendedKickRange: 260,
        extendedKickVerticalRange: 155,
        extendedKickPullDurationMs: 260,
        extendedKickPullOffsetX: 88,
        extendedKickDamageMultiplier: 1.9,
        extendedKickControlMs: 700,
        extendedKickKnockbackX: 320,
        extendedKickKnockbackY: -180,
        stoneThresholdRatio: 0.2,
        stoneDurationMs: 2800,
        stoneHealRatio: 0.2,
        stoneMinimumHealBonus: 60,
        stoneBurstDamage: 45,
        stoneBurstRange: 220
      }
    },
    details: {
      moveSpeed: '中低速',
      punchMechanic: '拳击基础伤害 = 45。每秒自动积攒拳击能量；能量满后，下一拳会变成强化拳击，造成当前拳击基础伤害 2.6 倍的伤害，并对目标附近敌人造成当前拳击基础伤害 10% 的溅射。若拳击基础伤害被装备等效果抬高，强化拳与溅射都会同步变强。',
      kickMechanic: '飞踢基础伤害 = 55。常规范围内按普通飞踢结算；每次拳击命中会为拉拽飞踢充能 50 点，满 100 点后下一次满足距离条件的飞踢才会触发牵引效果。强化飞踢造成当前飞踢基础伤害 1.9 倍的伤害，并附带 700 ms 持续控制与更强击退。',
      passiveDetail: '基础生命 20% 阈值 = 90。第一次被打到低于 90 生命时，会进入约 2.8 秒石像状态，期间所有来袭伤害改为回血 20%。石像结束时若总回血不足 60，会额外回复 60；若总回血超过 60，则会对最近敌人反震 45 点伤害。石像只会触发 1 次。',
      remarks: '看起来脑袋笨笨的，但越乱的场面越容易一拳一片。强化拳与拉人飞踢都更适合打多目标混战。',
      story: 'IQ45 经常在营地里把最简单的话听错半拍，反应也总比别人慢一点，于是大家都默认它不太聪明。可真正上了场，它又会用一种近乎莽撞的方式把战局掀翻。它不太会算距离，却会把人硬拽到自己拳脚能碰到的地方；它不太会读空气，却能在最狼狈的时候突然缩成一尊石像，硬生生把挨打变成回血。谁也说不清它到底是笨，还是只是用了一种别人完全跟不上的脑回路在打架。'
    },
    stats: {
      health: 450,
      moveSpeed: 190,
      jumpVelocity: 610,
      punchDamage: 45,
      kickDamage: 55
    }
  },
  {
    id: 'yuzijiang',
    name: '鱼子酱',
    title: '终极潜行型',
    avatar: yuzijiangAvatar,
    unlockCost: 500,
    passive: '拥有双次致命伤抵御、长时间隐身和隐身爆发伤害，是以 500 朱玥价格定位的顶级角色。',
    skills: [
      'J 深海断潮拳：高伤拳击，隐身命中时会触发额外爆发伤害。',
      'K 暗潮裂空踢：超远距离飞踢，适合借隐身窗口强行切入。'
    ],
    abilities: {
      mode: 'yuzijiang-shadow',
      kickRangeBonus: 80,
      fatalGuardCharges: 2,
      fatalGuardLife: 18,
      invisibilityDurationMs: 5200,
      invisibilityCooldownMs: 7800,
      invisibilityDamageBonus: 12
    },
    details: {
      moveSpeed: '极高速',
      punchMechanic: '拳击基础伤害 = 26。若在隐身状态下命中，额外追加 12 点爆发伤害，所以隐身拳击实际伤害 = 38。',
      kickMechanic: '飞踢基础伤害 = 34，额外判定距离 = 80。',
      passiveDetail: '每局自带 2 次致命伤抵御。受到足以致死的伤害时，不会倒下，而是保留 18 点生命并立刻进入 5.2 秒隐身。正常战斗中也会每 7.8 秒自动进入一次 5.2 秒隐身。隐身期间敌人无法稳定锁定鱼子酱。',
      remarks: '高价格对应高统治力，兼具翻盘、生存、切入和爆发。',
      story: '鱼子酱从不喜欢把自己暴露在喧闹中央。她更像深海里那道看不清轮廓的暗流，平时安静得近乎不存在，真正靠近时却已经来不及躲。营地里关于她的传闻很多，有人说她总能在最危险的时候消失，也有人说她其实从没离开，只是站在所有人看不见的角度观察局势。她相信最有效的胜利不是最响的那次出手，而是让敌人直到倒下都没弄明白自己是怎么输的。'
    },
    stats: {
      health: 188,
      moveSpeed: 220,
      jumpVelocity: 720,
      punchDamage: 26,
      kickDamage: 34
    }
  },
  {
    id: 'yuxinghe',
    name: '予星河',
    title: '啵啵追击型',
    avatar: yuxingheAvatar,
    unlockCost: 700,
    passive: 'J 拳击与 K 飞踢都会稳定追加远程啵啵，且每次出手还有 20% 概率额外飞出红啵啵补伤。',
    skills: [
      'J 星糖拳击：出拳时必定额外发射 1 发笑啵啵，命中造成 20 点伤害。',
      'K 星坠飞踢：飞踢时必定额外发射 1 发哭啵啵，命中造成 30 点伤害。',
      '被动 红啵啵：每次 J / K 额外有 20% 概率再发射 1 发红啵啵，命中造成 40 点伤害。'
    ],
    abilities: {
      mode: 'yuxinghe-bobo-barrage',
      attackProjectiles: {
        extraChance: 0.2,
        punch: [
          {
            label: '笑啵啵',
            textureKey: 'yuxinghe-smile-bobo',
            asset: smileBoboProjectile,
            damage: 20,
            speed: 520,
            displayWidth: 42,
            displayHeight: 42
          }
        ],
        kick: [
          {
            label: '哭啵啵',
            textureKey: 'yuxinghe-cry-bobo',
            asset: cryBoboProjectile,
            damage: 30,
            speed: 560,
            displayWidth: 44,
            displayHeight: 44
          }
        ],
        extra: [
          {
            label: '红啵啵',
            textureKey: 'yuxinghe-red-bobo',
            asset: redBoboProjectile,
            damage: 40,
            speed: 610,
            displayWidth: 46,
            displayHeight: 46,
            on: ['punch', 'kick']
          }
        ]
      }
    },
    details: {
      moveSpeed: '高',
      punchMechanic: '拳击基础伤害 = 30。无论拳击是否命中，都会额外向前发射笑啵啵，命中敌人造成 20 点伤害。',
      kickMechanic: '飞踢基础伤害 = 40。无论飞踢是否命中，都会额外向前发射哭啵啵，命中敌人造成 30 点伤害。',
      passiveDetail: '每次 J 拳击或 K 飞踢，额外有 20% 概率发射红啵啵；笑啵啵 / 哭啵啵仍会照常发射，红啵啵命中造成 40 点伤害。',
      remarks: '适合中距离持续压制，出招落空也能用投射物维持威胁。',
      story: '予星河是那种会把战场也变成舞台的人。她不是为了漂亮才把啵啵一个个抛出去，而是很早就明白，情绪本身也能成为武器。笑啵啵、哭啵啵、红啵啵，看上去像玩笑，真砸到人身上却一点都不轻。她总说，只靠蛮力太无趣，真正厉害的是让敌人在应付节奏、光影和情绪时，一点点把自己的破绽全部交出来。'
    },
    stats: {
      health: 250,
      moveSpeed: 200,
      jumpVelocity: 600,
      punchDamage: 30,
      kickDamage: 40
    }
  },
  {
    id: 'dream-catbug',
    name: '梦想猫虫',
    title: '梦印锁场型',
    avatar: dreamCatbugAvatar,
    unlockCost: null,
    unlockRequirement: '通关第 100 关后自动获得，不可购买。',
    passive: '任何攻击命中非己方单位都会留下 3 秒梦印；梦印期间再次命中该单位会造成 2 倍实际伤害，梦印结束后会按该单位在梦印期间受到的实际总伤害回复梦想猫虫生命。',
    skills: [
      'J 梦切拳：基础拳击命中后会给目标挂上梦印，并额外发射 1 道短距离激光，激光只能命中 1 个非己方单位。',
      'K 梦坠飞踢：基础飞踢命中后同样会挂上梦印，并在身边生成 1 个中立单位“想吃棒棒糖”，持续为附近己方单位回复生命。',
      '被动 梦印递进：梦印第 1 秒减速 10%，第 2 秒减速 50%，第 3 秒禁止移动；同一单位同一时间只能存在 1 个梦印。'
    ],
    abilities: {
      mode: 'dream-catbug-laser-lock',
      kickRangeBonus: 26,
      dreamCatbug: {
        markDurationMs: 3000,
        markedDamageMultiplier: 2,
        markHealRatio: 0.35,
        markHealCapRatio: 0.25,
        laserDamage: 19.3,
        laserSpeed: 605,
        laserMaxTravelDistance: 176,
        laserDisplayWidth: 54,
        laserDisplayHeight: 18,
        summonDurationMs: 3900,
        summonHealRadius: 169,
        summonHealAmount: 16.9,
        summonHealIntervalMs: 480
      },
      attackProjectiles: {
        punch: [
          {
            label: '梦切激光',
            textureKey: 'dream-catbug-laser',
            asset: gabengArrowProjectile,
            damage: 19.3,
            speed: 605,
            displayWidth: 54,
            displayHeight: 18,
            aimAtNearestEnemy: true,
            maxTravelDistance: 176
          }
        ]
      }
    },
    details: {
      moveSpeed: '移动速度公式：移动速度 = (拳击基础伤害 + 飞踢基础伤害) x 175%，所以当前为 210。',
      punchMechanic: '拳击基础伤害 = 55。拳击命中后挂 3 秒梦印；同时会发射 1 道短距离激光，激光伤害 = 拳击基础伤害 x 35% = 19.3，最远飞行距离 = 拳击基础伤害 x 320% = 176。',
      kickMechanic: '飞踢基础伤害 = 65，额外判定距离 = 飞踢基础伤害 x 40% = 26。释放飞踢时会在身边生成中立单位“想吃棒棒糖”，持续 3900 ms；其治疗范围 = 飞踢基础伤害 x 260% = 169，每 520 ms 回复一次生命，每次回复 = 飞踢基础伤害 x 18% = 11.7。',
      passiveDetail: '梦印持续 3 秒，不可叠加不可刷新。第 1 秒减速 10%，第 2 秒减速 50%，第 3 秒禁止移动。梦印期间梦想猫虫再次命中该目标时，实际伤害 = 本次打出的实际伤害 x 2。梦印结束时，梦想猫虫回复该目标在梦印期间所受实际总伤害的 20%，单个梦印的回血上限 = 最大生命值的 15%。',
      remarks: '跳跃力度公式：跳跃力度 = (拳击基础伤害 + 飞踢基础伤害) x 550%，所以当前为 660。整体是高血量、高伤害、强单点压制的后期角色。',
      story: '梦想猫虫不靠瞬间爆发把对手拍死，而是先给目标种下梦印，再用越来越沉的压制把对方一步步拖进自己最擅长的节奏里。等梦印散去时，它又会从那段压制里抽回生命，像是把对手做过的噩梦反过来喂给自己。'
    },
    stats: {
      health: 550,
      moveSpeed: 210,
      jumpVelocity: 660,
      punchDamage: 55,
      kickDamage: 65
    }
  },
  {
    id: 'cabbo',
    name: '鸽吻',
    title: '终章奖励型',
    avatar: aiAvatar,
    unlockCost: null,
    unlockRequirement: '通关第 10 关后自动解锁，不可购买。',
    passive: '拳脚都带轻量追击，整体数值接近常用角色的均衡强度。',
    skills: [
      'J 裂羽连拳：拳击命中后自动追加 1 段轻追击。',
      'K 破空飞踢：飞踢命中后自动追加 1 段轻追击。'
    ],
    abilities: {
      mode: 'cabbo-balanced',
      punchFollowUps: 1,
      punchFollowUpDamage: 2,
      punchFollowUpGapMs: 88,
      kickFollowUps: 1,
      kickFollowUpDamage: 3,
      kickFollowUpGapMs: 92,
      kickRangeBonus: 8,
      kickBonusDamage: 1
    },
    details: {
      moveSpeed: '中高速',
      punchMechanic: '拳击基础伤害 = 6。首段命中后自动追加 1 段追击，追击伤害 = 2。',
      kickMechanic: '飞踢基础伤害 = 9。首段额外附加 1 点伤害，且自动追加 1 段 3 点追击。',
      passiveDetail: '更强调稳定追击，而不是纯数值碾压。',
      remarks: '均衡型奖励角色。',
      story: '鸽吻曾经是所有试炼里最熟悉也最让人头疼的对手。它不像某些角色那样有一眼就能看穿的极端长板，却总能在你以为节奏稳住的时候，再补上一下恰到好处的追击。被真正击败之后，它没有消失，反而像把那份压迫感留下来，变成了能被玩家掌握的力量。于是这份“奖励”并不是白送的战利品，而是一种证明，证明你已经跨过了那个曾经反复拦住你的终章门槛。'
    },
    stats: {
      health: 58,
      moveSpeed: 162,
      jumpVelocity: 582,
      punchDamage: 6,
      kickDamage: 9
    }
  }
]

export const AI_OPPONENT = {
  id: 'cabbo-ai',
  name: '鸽吻',
  title: '突变后的守关者',
  avatar: aiAvatar,
  baseStats: {
    health: 92,
    moveSpeed: 152,
    jumpVelocity: 562,
    punchDamage: 6,
    kickDamage: 8,
    reactionDelay: 460
  }
}

const BASE_LEVELS = [
  { id: 1, reward: getLevelReward(1), description: '熟悉节奏与按键，先把基础对抗手感找回来。', enemyScale: { health: 1, punchDamage: 1, kickDamage: 1, reactionMultiplier: 1 } },
  { id: 2, reward: getLevelReward(2), description: '鸽吻开始更主动地试探你，移动与压近更频繁。', enemyScale: { health: 1.08, punchDamage: 1.12, kickDamage: 1.12, reactionMultiplier: 0.94 } },
  { id: 3, reward: getLevelReward(3), description: '开始出现明显的压迫感，需要更认真地处理距离。', enemyScale: { health: 1.16, punchDamage: 1.24, kickDamage: 1.24, reactionMultiplier: 0.88 } },
  { id: 4, reward: getLevelReward(4), description: '守关者会更积极地衔接攻击，不能只靠硬吃。', enemyScale: { health: 1.26, punchDamage: 1.38, kickDamage: 1.38, reactionMultiplier: 0.8 } },
  { id: 5, reward: getLevelReward(5), description: '进入中段试炼，连续失误会被明显惩罚。', enemyScale: { health: 1.38, punchDamage: 1.52, kickDamage: 1.54, reactionMultiplier: 0.74 } },
  { id: 6, reward: getLevelReward(6), description: '鸽吻开始形成更稳定的抢先手节奏。', enemyScale: { health: 1.52, punchDamage: 1.68, kickDamage: 1.7, reactionMultiplier: 0.68 } },
  { id: 7, reward: getLevelReward(7), description: '贴身后的压制变得明显，需要更好地利用角色特点。', enemyScale: { health: 1.68, punchDamage: 1.86, kickDamage: 1.9, reactionMultiplier: 0.6 } },
  { id: 8, reward: getLevelReward(8), description: '敌人的容错降低，但攻击性显著提升。', enemyScale: { health: 1.86, punchDamage: 2.04, kickDamage: 2.08, reactionMultiplier: 0.54 } },
  { id: 9, reward: getLevelReward(9), description: '终战前夜，鸽吻已经接近完全失控。', enemyScale: { health: 2.08, punchDamage: 2.28, kickDamage: 2.32, reactionMultiplier: 0.46 } },
  {
    id: 10,
    reward: getLevelReward(10),
    description: '与超级鸽吻决战。胜利后会解锁可用角色“鸽吻”。',
    enemyName: '超级鸽吻',
    enemyTitle: '分裂前的完全体守关者',
    enemyScale: { health: 2.4, punchDamage: 2.64, kickDamage: 2.84, reactionMultiplier: 0.36 }
  }
]

function roundToTenth(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10
}

const GENERATED_LEVEL_BASE_ID = 10
const GENERATED_LEVEL_CAP_ID = 99
const GENERATED_LEVEL_START_SCALES = {
  health: 2.4,
  punchDamage: 2.64,
  kickDamage: 2.84,
  reactionMultiplier: 0.36
}
const GENERATED_LEVEL_TARGET_SCALES = {
  health: 108.7,
  punchDamage: 9,
  kickDamage: 9.6
}
const GENERATED_LEVEL_CURVE_POWERS = {
  health: 1.5,
  punchDamage: 1.35,
  kickDamage: 1.35
}
const FINAL_BOSS_SCALE_BONUS = {
  health: 1.035,
  punchDamage: 1.03,
  kickDamage: 1.03
}
const POST_SPLIT_GABENG_GROWTH = {
  health: 1.018,
  punchDamage: 1.01,
  kickDamage: 1.01
}
const GABENG_BOSS_ABILITIES = {
  mode: 'gabeng-arrow-boss',
  gabengArrow: {
    textureKey: 'gabengArrow',
    asset: gabengArrowProjectile,
    label: '嘎嘣箭矢',
    baseChance: 0.05,
    maxChanceBonus: 0.4,
    maxChancePenalty: 0.04,
    punchHitChanceGain: 0.02,
    kickMissChanceLoss: 0.01,
    checkIntervalMs: 1000,
    damageRatio: 0.1,
    stunDurationMs: 650,
    kickHitControlMs: 320,
    kickHitKnockbackX: 210,
    kickHitKnockbackY: -120,
    projectileSpeed: 440,
    displayWidth: 36,
    displayHeight: 18
  }
}

function getLevelReward(id) {
  return Math.max(1, Math.floor(id * 0.8))
}

function getGeneratedLevelProgress(id) {
  const rawProgress = (id - GENERATED_LEVEL_BASE_ID) / (GENERATED_LEVEL_CAP_ID - GENERATED_LEVEL_BASE_ID)
  return Math.max(0, Math.min(1, rawProgress))
}

function interpolateGeneratedScale(id, key) {
  const start = GENERATED_LEVEL_START_SCALES[key]
  const target = GENERATED_LEVEL_TARGET_SCALES[key]
  const power = GENERATED_LEVEL_CURVE_POWERS[key]
  const progress = Math.pow(getGeneratedLevelProgress(id), power)

  return roundToTenth(start + (target - start) * progress)
}

function getGeneratedEnemyScale(id) {
  if (id > GABENG_SPLIT_LEVEL_ID) {
    const depth = id - GABENG_SPLIT_LEVEL_ID
    const splitBossScale = getGeneratedEnemyScale(GABENG_SPLIT_LEVEL_ID)
    return {
      health: roundToTenth(splitBossScale.health * Math.pow(POST_SPLIT_GABENG_GROWTH.health, depth)),
      punchDamage: roundToTenth(splitBossScale.punchDamage * Math.pow(POST_SPLIT_GABENG_GROWTH.punchDamage, depth)),
      kickDamage: roundToTenth(splitBossScale.kickDamage * Math.pow(POST_SPLIT_GABENG_GROWTH.kickDamage, depth)),
      reactionMultiplier: splitBossScale.reactionMultiplier
    }
  }

  const health = interpolateGeneratedScale(id, 'health')
  const punchDamage = interpolateGeneratedScale(id, 'punchDamage')
  const kickDamage = interpolateGeneratedScale(id, 'kickDamage')
  const reactionMultiplier = GENERATED_LEVEL_START_SCALES.reactionMultiplier

  if (id === GABENG_SPLIT_LEVEL_ID) {
    return {
      health: roundToTenth(health * FINAL_BOSS_SCALE_BONUS.health),
      punchDamage: roundToTenth(punchDamage * FINAL_BOSS_SCALE_BONUS.punchDamage),
      kickDamage: roundToTenth(kickDamage * FINAL_BOSS_SCALE_BONUS.kickDamage),
      reactionMultiplier
    }
  }

  return {
    health,
    punchDamage,
    kickDamage,
    reactionMultiplier
  }
}

function createGeneratedLevel(id) {
  const depth = id - GENERATED_LEVEL_BASE_ID
  const { health, punchDamage, kickDamage, reactionMultiplier } = getGeneratedEnemyScale(id)
  const reward = getLevelReward(id)

  if (id === GABENG_SPLIT_LEVEL_ID) {
    return {
      id,
      name: `第 ${id} 关`,
      reward,
      description: '嘎嘣降临。第一阶段是完整个体，击破后会一分为二，你必须同时清理两只嘎嘣。',
      enemyName: '嘎嘣',
      enemyTitle: '双生裂变终局',
      enemyAvatar: gabengAvatar,
      enemyAbilities: GABENG_BOSS_ABILITIES,
      enemyScale: { health, punchDamage, kickDamage, reactionMultiplier },
      battleMode: 'gabeng-split',
      splitAnimationText: '嘎嘣裂解成了两个个体！'
    }
  }

  if (id > GABENG_SPLIT_LEVEL_ID) {
    const postSplitDepth = id - GABENG_SPLIT_LEVEL_ID
    const descriptions = [
      '双生裂变之后，嘎嘣本体的压迫感并没有结束，后续试炼会继续向更高层推进。',
      '嘎嘣开始更稳定地利用箭矢与重击压你，失误成本会被迅速放大。',
      '越往后走，嘎嘣越像是把第 100 关的压迫重新压缩成单体极限强度。',
      '每一关都是更高压的嘎嘣试炼，直到第 200 关才算真正摸到尽头。'
    ]
    const descriptionIndex = Math.min(descriptions.length - 1, Math.floor((postSplitDepth - 1) / 33))

    return {
      id,
      name: `第 ${id} 关`,
      reward,
      description: descriptions[descriptionIndex],
      enemyName: '嘎嘣',
      enemyTitle: id >= 160 ? '极压守门者' : '裂变后的守关者',
      enemyAvatar: gabengAvatar,
      enemyAbilities: GABENG_BOSS_ABILITIES,
      enemyScale: { health, punchDamage, kickDamage, reactionMultiplier },
      battleMode: 'single'
    }
  }

  const intensityBand = Math.min(4, Math.floor((depth - 1) / 18))
  const descriptions = [
    '第 10 关之后，试炼会自动向前延伸，敌人每一关都会继续成长。',
    '鸽吻的动作开始更密，你需要更稳定地处理先手与换位。',
    '中后段的鸽吻几乎不给喘息空间，失误会被连续追击放大。',
    '每一次胜利都会立刻生成下一关，直到你摸到最终的裂变终点。',
    '终局之前的鸽吻已经接近极限，任何贪刀都可能直接葬送这一关。'
  ]

  return {
    id,
    name: `第 ${id} 关`,
    reward,
    description: descriptions[intensityBand],
    enemyName: id >= 50 ? '狂躁鸽吻' : undefined,
    enemyTitle: id >= 80 ? '接近崩坏的守关者' : undefined,
    enemyScale: { health, punchDamage, kickDamage, reactionMultiplier },
    battleMode: 'single'
  }
}

export const LEVELS = [
  ...BASE_LEVELS.map((level) => ({
    ...level,
    name: `第 ${level.id} 关`,
    battleMode: 'single'
  })),
  ...Array.from({ length: FINAL_LEVEL_ID - BASE_LEVELS.length }, (_, index) => createGeneratedLevel(index + 11))
]

export function getCharacterById(id) {
  return PLAYER_CHARACTERS.find((character) => character.id === id) || PLAYER_CHARACTERS[0]
}

export function getLevelById(id) {
  return LEVELS.find((level) => level.id === id) || LEVELS[0]
}

export function getEquipmentById(id) {
  return EQUIPMENT_OPTIONS.find((equipment) => equipment.id === id) || null
}

export function getEquipmentEvolutionById(equipmentId, evolutionId) {
  const equipment = getEquipmentById(equipmentId)
  if (!equipment || !Array.isArray(equipment.evolutionPaths)) {
    return null
  }

  return equipment.evolutionPaths.find((evolution) => evolution.id === evolutionId) || null
}

export function getUnequippedEvolutionById(evolutionId) {
  return UNEQUIPPED_EVOLUTION_OPTIONS.find((evolution) => evolution.id === evolutionId) || null
}

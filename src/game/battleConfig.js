function cloneBattleActor(actor) {
  return {
    ...actor,
    baseAbilities: {
      ...(actor?.baseAbilities || {})
    },
    abilities: {
      ...(actor?.abilities || {})
    },
    attackCooldowns: {
      ...(actor?.attackCooldowns || {})
    },
    stats: {
      ...(actor?.stats || {})
    }
  }
}

export function createBattleActor({ actor, team, controlMode = 'ai', slot = 0, isPrimary = false }) {
  return {
    ...cloneBattleActor(actor),
    team,
    controlMode,
    slot,
    isPrimary
  }
}

function createBattleTeam(id, actors) {
  const normalizedActors = Array.isArray(actors) ? actors : []

  return {
    id,
    actors: normalizedActors,
    primaryActorId: normalizedActors.find((actor) => actor.isPrimary)?.id || normalizedActors[0]?.id || null,
    humanActorIds: normalizedActors
      .filter((actor) => actor.controlMode === 'human')
      .map((actor) => actor.id)
  }
}

export function normalizeBattleConfigShape(config) {
  const fallbackPlayer = config?.player ? createBattleActor({
    actor: config.player,
    team: 'allies',
    controlMode: 'human',
    slot: 0,
    isPrimary: true
  }) : null

  const fallbackEnemy = config?.enemy ? createBattleActor({
    actor: config.enemy,
    team: 'enemies',
    controlMode: 'ai',
    slot: 0,
    isPrimary: true
  }) : null

  const allies = Array.isArray(config?.allies) && config.allies.length
    ? config.allies.map((actor, index) => createBattleActor({
      actor,
      team: 'allies',
      controlMode: actor.controlMode || (index === 0 ? 'human' : 'ai'),
      slot: Number.isFinite(actor?.slot) ? actor.slot : index,
      isPrimary: typeof actor?.isPrimary === 'boolean' ? actor.isPrimary : index === 0
    }))
    : (fallbackPlayer ? [fallbackPlayer] : [])

  const enemies = Array.isArray(config?.enemies) && config.enemies.length
    ? config.enemies.map((actor, index) => createBattleActor({
      actor,
      team: 'enemies',
      controlMode: actor.controlMode || 'ai',
      slot: Number.isFinite(actor?.slot) ? actor.slot : index,
      isPrimary: typeof actor?.isPrimary === 'boolean' ? actor.isPrimary : index === 0
    }))
    : (fallbackEnemy ? [fallbackEnemy] : [])

  const neutrals = Array.isArray(config?.neutrals) && config.neutrals.length
    ? config.neutrals.map((actor, index) => createBattleActor({
      actor,
      team: 'neutrals',
      controlMode: actor.controlMode || 'ai',
      slot: Number.isFinite(actor?.slot) ? actor.slot : index,
      isPrimary: typeof actor?.isPrimary === 'boolean' ? actor.isPrimary : index === 0
    }))
    : []

  return {
    ...config,
    allies,
    enemies,
    neutrals,
    participantGroups: {
      allies,
      enemies,
      neutrals
    },
    teams: {
      allies: createBattleTeam('allies', allies),
      enemies: createBattleTeam('enemies', enemies),
      neutrals: createBattleTeam('neutrals', neutrals)
    },
    player: allies.find((actor) => actor.isPrimary) || allies[0] || fallbackPlayer,
    enemy: enemies.find((actor) => actor.isPrimary) || enemies[0] || fallbackEnemy
  }
}

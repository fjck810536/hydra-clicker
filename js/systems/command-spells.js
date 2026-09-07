function assertDefinition(definition) {
  if (!definition || definition.id !== 'command-spell-1') {
    throw new TypeError('Command Spell I definition is required.');
  }
  if (definition.cost?.currency !== 'humanity-evil') {
    throw new TypeError('Command Spell I currently requires humanity-evil currency.');
  }
  if (!Array.isArray(definition.levels) || definition.levels.length < 1) {
    throw new TypeError('Command Spell I requires at least one level definition.');
  }

  let previousKills = -1n;
  let previousLevel = 0;
  for (const level of definition.levels) {
    if (!Number.isInteger(level.level) || level.level !== previousLevel + 1) {
      throw new TypeError('Command Spell I levels must be contiguous positive integers.');
    }
    if (typeof level.requiredHydraKills !== 'bigint' || level.requiredHydraKills < 0n) {
      throw new TypeError('Command Spell I requiredHydraKills must be a non-negative BigInt.');
    }
    if (level.requiredHydraKills <= previousKills) {
      throw new RangeError('Command Spell I kill requirements must strictly increase.');
    }
    if (typeof level.cost !== 'bigint' || level.cost < 0n) {
      throw new TypeError('Command Spell I level cost must be a non-negative BigInt.');
    }
    if (!Number.isFinite(level.attacksPerSecond) || level.attacksPerSecond <= 0) {
      throw new RangeError('Command Spell I attacksPerSecond must be a finite number > 0.');
    }

    previousKills = level.requiredHydraKills;
    previousLevel = level.level;
  }
}

function milestoneId(definition, level) {
  return `${definition.id}-lv${level}`;
}

function parseMilestoneLevel(definition, id) {
  const prefix = `${definition.id}-lv`;
  if (typeof id !== 'string' || !id.startsWith(prefix)) return null;
  const level = Number(id.slice(prefix.length));
  return Number.isInteger(level) && level > 0 ? level : null;
}

function getCurrentLevel(snapshot, definition) {
  if (!snapshot.master.commandSpells.autoSlash) return 0;

  let level = 1;
  for (const candidate of definition.levels.slice(1)) {
    if (snapshot.progression.milestones.includes(milestoneId(definition, candidate.level))) {
      level = candidate.level;
    } else {
      break;
    }
  }
  return level;
}

export function createCommandSpellSystem({ state, events, definition } = {}) {
  if (!state || typeof state.read !== 'function' || typeof state.update !== 'function') {
    throw new TypeError('Command Spell system requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('Command Spell system requires an event bus.');
  }
  assertDefinition(definition);

  // Playtest tuning may remove levels. Preserve already-earned lower milestones,
  // but clamp saves that still carry an obsolete level above the current MAX.
  // This specifically migrates the old Lv.8 / 128 APS experiment to 64 APS MAX
  // without introducing a new state schema version.
  const initialSnapshot = state.read();
  const maxDefinition = definition.levels.at(-1);
  const hasObsoleteHigherLevel = initialSnapshot.progression.milestones.some((id) => {
    const level = parseMilestoneLevel(definition, id);
    return level != null && level > maxDefinition.level;
  });
  if (
    initialSnapshot.master.commandSpells.autoSlash
    && hasObsoleteHigherLevel
    && initialSnapshot.berserker.baseAttacksPerSecond > maxDefinition.attacksPerSecond
  ) {
    state.update((draft) => {
      draft.berserker.baseAttacksPerSecond = maxDefinition.attacksPerSecond;
    });
  }

  let announcedLevel = null;

  function getStatus() {
    const snapshot = state.read();
    const level = getCurrentLevel(snapshot, definition);
    const maxLevel = definition.levels.length;
    const next = definition.levels[level] ?? null;
    const maxed = next == null;
    const killsMet = maxed || snapshot.statistics.totalHydrasKilled >= next.requiredHydraKills;
    const canAfford = maxed || snapshot.master.humanityEvil >= next.cost;

    return Object.freeze({
      id: definition.id,
      purchased: level >= 1,
      level,
      maxLevel,
      maxed,
      attacksPerSecond: snapshot.berserker.baseAttacksPerSecond,
      nextLevel: next?.level ?? null,
      nextAttacksPerSecond: next?.attacksPerSecond ?? null,
      killsMet,
      canAfford,
      available: !maxed && killsMet && canAfford,
      requiredHydraKills: next?.requiredHydraKills ?? definition.levels.at(-1).requiredHydraKills,
      cost: next?.cost ?? 0n,
      balance: snapshot.master.humanityEvil,
      kills: snapshot.statistics.totalHydrasKilled,
    });
  }

  function announceIfAvailable(atMs) {
    const status = getStatus();
    if (status.available && announcedLevel !== status.nextLevel) {
      announcedLevel = status.nextLevel;
      events.emit('command-spell:available', {
        atMs,
        id: definition.id,
        level: status.nextLevel,
        cost: status.cost,
        requiredHydraKills: status.requiredHydraKills,
        attacksPerSecond: status.nextAttacksPerSecond,
      });
    }
    if (!status.available) {
      announcedLevel = null;
    }
    return status;
  }

  const offKilled = events.on('hydra:killed', ({ payload }) => {
    announceIfAvailable(payload.atMs);
  });
  const offCurrency = events.on('currency:gain', ({ payload }) => {
    announceIfAvailable(payload.atMs);
  });

  function purchase() {
    const status = getStatus();
    if (status.maxed) return { accepted: false, reason: 'max-level', status };
    if (!status.killsMet) return { accepted: false, reason: 'kills-required', status };
    if (!status.canAfford) return { accepted: false, reason: 'insufficient-humanity-evil', status };

    const next = definition.levels[status.level];
    const atMs = state.read().time.simulationTimeMs;

    state.update((draft) => {
      draft.master.humanityEvil -= next.cost;
      draft.master.commandSpells.autoSlash = true;
      draft.berserker.baseAttacksPerSecond = next.attacksPerSecond;

      if (next.level > 1) {
        const id = milestoneId(definition, next.level);
        if (!draft.progression.milestones.includes(id)) {
          draft.progression.milestones.push(id);
        }
      }
    });

    announcedLevel = null;
    events.emit('currency:spend', {
      atMs,
      currency: definition.cost.currency,
      amount: next.cost,
      reason: next.level === 1 ? definition.id : milestoneId(definition, next.level),
      balance: state.read().master.humanityEvil,
    });

    const payload = {
      atMs,
      id: definition.id,
      level: next.level,
      attacksPerSecond: next.attacksPerSecond,
    };

    if (next.level === 1) {
      events.emit('command-spell:unlocked', {
        ...payload,
        unlocks: [...definition.unlocks],
      });
    } else {
      events.emit('command-spell:upgraded', payload);
    }

    return { accepted: true, level: next.level, status: getStatus() };
  }

  return {
    getStatus,
    purchase,
    destroy() {
      offKilled();
      offCurrency();
    },
  };
}

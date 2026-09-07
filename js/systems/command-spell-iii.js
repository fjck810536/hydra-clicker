function milestoneId(definition, level) {
  return `${definition.id}-lv${level}`;
}

function assertDefinition(definition) {
  if (!definition || definition.id !== 'command-spell-3') {
    throw new TypeError('Command Spell III definition is required.');
  }
  if (!Number.isInteger(definition.unlockGeneration) || definition.unlockGeneration < 1) {
    throw new TypeError('Command Spell III unlockGeneration must be a positive integer.');
  }
  if (typeof definition.firstEligibilityMilestone !== 'string' || definition.firstEligibilityMilestone.length < 1) {
    throw new TypeError('Command Spell III firstEligibilityMilestone must be a non-empty string.');
  }
  if (!definition.base || !Array.isArray(definition.levels) || definition.levels.length < 1) {
    throw new TypeError('Command Spell III requires base data and levels.');
  }

  const all = [definition.base, ...definition.levels];
  for (const entry of all) {
    if (!Number.isInteger(entry.autoNpNumerator) || entry.autoNpNumerator < 0) {
      throw new TypeError('Command Spell III autoNpNumerator must be a non-negative integer.');
    }
    if (!Number.isInteger(entry.autoNpDenominator) || entry.autoNpDenominator < 1) {
      throw new TypeError('Command Spell III autoNpDenominator must be a positive integer.');
    }
  }

  let previousLevel = 0;
  let previousFraction = definition.base.autoNpNumerator / definition.base.autoNpDenominator;
  for (const level of definition.levels) {
    if (!Number.isInteger(level.level) || level.level !== previousLevel + 1) {
      throw new TypeError('Command Spell III levels must be contiguous positive integers.');
    }
    const fraction = level.autoNpNumerator / level.autoNpDenominator;
    if (!(fraction > previousFraction) || fraction > 1) {
      throw new RangeError('Command Spell III Auto-in-NP fractions must strictly increase up to 1.');
    }
    if (level.cost != null && (typeof level.cost !== 'bigint' || level.cost < 0n)) {
      throw new TypeError('Command Spell III cost must be null or a non-negative BigInt.');
    }
    previousLevel = level.level;
    previousFraction = fraction;
  }
}

function getCurrentLevel(snapshot, definition) {
  let current = 0;
  for (const level of definition.levels) {
    if (snapshot.progression.milestones.includes(milestoneId(definition, level.level))) {
      current = level.level;
    } else {
      break;
    }
  }
  return current;
}

function currentEffect(definition, level) {
  return level <= 0 ? definition.base : definition.levels[level - 1];
}

function projectFraction(effect) {
  return effect.autoNpNumerator / effect.autoNpDenominator;
}

function projectAutoNpAps(snapshot, effect) {
  const base = snapshot.berserker.baseAttacksPerSecond;
  if (!Number.isFinite(base) || base < 0) {
    throw new RangeError('baseAttacksPerSecond must be a finite number >= 0.');
  }
  return base * projectFraction(effect);
}

export function createCommandSpellIIISystem({ state, events, definition } = {}) {
  if (!state || typeof state.read !== 'function' || typeof state.update !== 'function') {
    throw new TypeError('Command Spell III system requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('Command Spell III system requires an event bus.');
  }
  assertDefinition(definition);

  function getStatus(snapshot = state.read()) {
    const level = getCurrentLevel(snapshot, definition);
    const effect = currentEffect(definition, level);
    const next = definition.levels[level] ?? null;
    const maxed = next == null;
    const eligibilityMet = level > 0
      || snapshot.progression.milestones.includes(definition.firstEligibilityMilestone);
    const pricePending = !maxed && (next.purchasePending === true || next.cost == null);
    const canAfford = maxed || (!pricePending && snapshot.master.humanityEvil >= next.cost);

    return Object.freeze({
      id: definition.id,
      generation: definition.unlockGeneration,
      eligible: eligibilityMet,
      unlocked: level > 0,
      level,
      maxLevel: definition.levels.length,
      maxed,
      autoNpNumerator: effect.autoNpNumerator,
      autoNpDenominator: effect.autoNpDenominator,
      autoNpFraction: projectFraction(effect),
      autoNpAps: projectAutoNpAps(snapshot, effect),
      nextLevel: next?.level ?? null,
      nextRewardLabel: next?.rewardLabel ?? null,
      nextAutoNpNumerator: next?.autoNpNumerator ?? effect.autoNpNumerator,
      nextAutoNpDenominator: next?.autoNpDenominator ?? effect.autoNpDenominator,
      nextAutoNpFraction: next ? projectFraction(next) : projectFraction(effect),
      nextAutoNpAps: next ? projectAutoNpAps(snapshot, next) : projectAutoNpAps(snapshot, effect),
      cost: next?.cost ?? null,
      pricePending,
      balance: snapshot.master.humanityEvil,
      canAfford,
      available: !maxed && eligibilityMet && !pricePending && canAfford,
    });
  }

  const offNpReleased = events.on('np:released', ({ payload }) => {
    const snapshot = state.read();
    if (snapshot.hydra.generation !== definition.unlockGeneration) return;
    if (snapshot.progression.milestones.includes(definition.firstEligibilityMilestone)) return;

    state.update((draft) => {
      draft.progression.milestones.push(definition.firstEligibilityMilestone);
    });

    events.emit('command-spell:eligible', {
      atMs: payload.atMs,
      id: definition.id,
      generation: definition.unlockGeneration,
      milestone: definition.firstEligibilityMilestone,
      pricePending: getStatus().pricePending,
    });
  });

  function purchase() {
    const before = getStatus();
    if (before.maxed) return { accepted: false, reason: 'max-level', status: before };
    if (!before.eligible) return { accepted: false, reason: 'eligibility-required', status: before };
    if (before.pricePending) return { accepted: false, reason: 'price-pending', status: before };
    if (!before.canAfford) {
      return { accepted: false, reason: 'insufficient-humanity-evil', status: before };
    }

    const next = definition.levels[before.level];
    const atMs = state.read().time.simulationTimeMs;
    state.update((draft) => {
      draft.master.humanityEvil -= next.cost;
      const id = milestoneId(definition, next.level);
      if (!draft.progression.milestones.includes(id)) draft.progression.milestones.push(id);
    });

    events.emit('currency:spend', {
      atMs,
      currency: 'humanity-evil',
      amount: next.cost,
      reason: milestoneId(definition, next.level),
      balance: state.read().master.humanityEvil,
    });

    const payload = {
      atMs,
      id: definition.id,
      level: next.level,
      rewardLabel: next.rewardLabel,
      autoNpNumerator: next.autoNpNumerator,
      autoNpDenominator: next.autoNpDenominator,
    };
    events.emit(next.level === 1 ? 'command-spell:unlocked' : 'command-spell:upgraded', payload);
    return { accepted: true, level: next.level, status: getStatus() };
  }

  return Object.freeze({
    getStatus,
    purchase,
    destroy() {
      offNpReleased();
    },
  });
}

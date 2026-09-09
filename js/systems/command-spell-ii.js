function milestoneId(definition, level) {
  return `${definition.id}-lv${level}`;
}

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer.`);
  }
}

function assertDefinition(definition) {
  if (!definition || definition.id !== 'command-spell-2') {
    throw new TypeError('Command Spell II definition is required.');
  }
  assertPositiveInteger(definition.unlockGeneration, 'Command Spell II unlockGeneration');
  if (typeof definition.firstEligibilityMilestone !== 'string' || definition.firstEligibilityMilestone.length < 1) {
    throw new TypeError('Command Spell II firstEligibilityMilestone must be a non-empty string.');
  }
  if (!definition.base || !Array.isArray(definition.levels) || definition.levels.length < 1) {
    throw new TypeError('Command Spell II requires base data and at least one level.');
  }

  for (const [name, value] of Object.entries({
    npManualStrikeCount: definition.base.npManualStrikeCount,
    npMaxPoints: definition.base.npMaxPoints,
  })) {
    assertPositiveInteger(value, `Command Spell II base ${name}`);
  }
  if (!Number.isFinite(definition.base.npDurationMs) || definition.base.npDurationMs <= 0) {
    throw new RangeError('Command Spell II base npDurationMs must be > 0.');
  }

  let previousLevel = 0;
  let previousKills = -1n;
  let previousStrikeCount = definition.base.npManualStrikeCount;
  let previousDuration = definition.base.npDurationMs;

  for (const level of definition.levels) {
    if (!Number.isInteger(level.level) || level.level !== previousLevel + 1) {
      throw new TypeError('Command Spell II levels must be contiguous positive integers.');
    }

    // Generation-kill gates are optional explicit data. A null gate means the
    // level is governed by the already-established first eligibility milestone,
    // sequential ownership, price status, and current Humanity Evil only.
    if (level.requiredGenerationKills != null) {
      if (typeof level.requiredGenerationKills !== 'bigint' || level.requiredGenerationKills < 0n) {
        throw new TypeError('Command Spell II requiredGenerationKills must be null or a non-negative BigInt.');
      }
      if (level.requiredGenerationKills <= previousKills) {
        throw new RangeError('Command Spell II defined kill requirements must strictly increase.');
      }
      previousKills = level.requiredGenerationKills;
    }

    if (level.cost == null) {
      if (level.purchasePending !== true) {
        throw new TypeError('A Command Spell II level without a price must be marked purchasePending.');
      }
    } else if (typeof level.cost !== 'bigint' || level.cost < 0n) {
      throw new TypeError('Command Spell II level cost must be a non-negative BigInt or null.');
    }

    if (!['strike', 'efficiency', 'time'].includes(level.branch)) {
      throw new TypeError('Command Spell II branch must be strike, efficiency, or time.');
    }
    if (typeof level.rewardLabel !== 'string' || level.rewardLabel.length < 1) {
      throw new TypeError('Command Spell II rewardLabel must be a non-empty string.');
    }
    assertPositiveInteger(level.npManualStrikeCount, 'Command Spell II npManualStrikeCount');
    assertPositiveInteger(level.npMaxPoints, 'Command Spell II npMaxPoints');
    if (!Number.isFinite(level.npDurationMs) || level.npDurationMs <= 0) {
      throw new RangeError('Command Spell II npDurationMs must be > 0.');
    }
    if (level.npManualStrikeCount < previousStrikeCount) {
      throw new RangeError('Command Spell II strike count cannot decrease.');
    }
    if (level.npDurationMs < previousDuration) {
      throw new RangeError('Command Spell II duration cannot decrease.');
    }

    previousLevel = level.level;
    previousStrikeCount = level.npManualStrikeCount;
    previousDuration = level.npDurationMs;
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

function currentEffects(definition, level) {
  if (level <= 0) return definition.base;
  return definition.levels[level - 1];
}

function completedGenerationKills(snapshot, definition, generations) {
  if (snapshot.hydra.generation < definition.unlockGeneration) return 0n;

  let priorKills = 0n;
  for (let generation = 1; generation < definition.unlockGeneration; generation += 1) {
    const target = generations?.[generation]?.killsToNextGeneration;
    if (typeof target !== 'bigint') {
      throw new TypeError(`Generation ${generation} killsToNextGeneration is required for Command Spell II.`);
    }
    priorKills += target;
  }

  const target = generations?.[definition.unlockGeneration]?.killsToNextGeneration ?? null;
  let completed = snapshot.statistics.totalHydrasKilled - priorKills;
  if (completed < 0n) completed = 0n;
  if (typeof target === 'bigint' && completed > target) completed = target;
  return completed;
}

function normalizedToPoints(value, maxPoints) {
  return Math.min(maxPoints, Math.max(0, Math.round(value * maxPoints)));
}

export function createCommandSpellIISystem({
  state,
  events,
  definition,
  generations,
} = {}) {
  if (!state || typeof state.read !== 'function' || typeof state.update !== 'function') {
    throw new TypeError('Command Spell II system requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('Command Spell II system requires an event bus.');
  }
  if (!generations || typeof generations !== 'object') {
    throw new TypeError('Command Spell II system requires generation data.');
  }
  assertDefinition(definition);

  let announcedLevel = null;

  function getStatus(snapshot = state.read()) {
    const level = getCurrentLevel(snapshot, definition);
    const effects = currentEffects(definition, level);
    const next = definition.levels[level] ?? null;
    const extensionPending = next == null && definition.futureExtensionPending === true;
    const maxed = next == null && !extensionPending;
    const generationKills = completedGenerationKills(snapshot, definition, generations);
    const eligibilityMet = maxed
      || extensionPending
      || level > 0
      || (
        snapshot.hydra.generation >= definition.unlockGeneration
        && snapshot.progression.milestones.includes(definition.firstEligibilityMilestone)
      );
    const pricePending = extensionPending
      || (!maxed && (next?.purchasePending === true || next?.cost == null));
    const killsMet = maxed
      || extensionPending
      || next?.requiredGenerationKills == null
      || generationKills >= next.requiredGenerationKills;
    const canAfford = maxed
      || (!pricePending && snapshot.master.humanityEvil >= next.cost);

    return Object.freeze({
      id: definition.id,
      unlocked: level > 0,
      level,
      maxLevel: definition.levels.length,
      maxed,
      extensionPending,
      generation: definition.unlockGeneration,
      generationKills,
      eligibilityMet,
      npManualStrikeCount: effects.npManualStrikeCount,
      npMaxPoints: effects.npMaxPoints,
      npDurationMs: effects.npDurationMs,
      nextLevel: next?.level ?? null,
      nextBranch: next?.branch ?? null,
      nextRewardLabel: next?.rewardLabel ?? null,
      nextNpManualStrikeCount: next?.npManualStrikeCount ?? effects.npManualStrikeCount,
      nextNpMaxPoints: next?.npMaxPoints ?? effects.npMaxPoints,
      nextNpDurationMs: next?.npDurationMs ?? effects.npDurationMs,
      requiredGenerationKills: next?.requiredGenerationKills ?? null,
      cost: next?.cost ?? null,
      balance: snapshot.master.humanityEvil,
      killsMet,
      canAfford,
      pricePending,
      available: !maxed && !pricePending && eligibilityMet && killsMet && canAfford,
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
        generation: definition.unlockGeneration,
        requiredGenerationKills: status.requiredGenerationKills,
        branch: status.nextBranch,
        rewardLabel: status.nextRewardLabel,
      });
    }
    if (!status.available) announcedLevel = null;
    return status;
  }

  const offKilled = events.on('hydra:killed', ({ payload }) => {
    announceIfAvailable(payload.atMs);
  });
  const offCurrency = events.on('currency:gain', ({ payload }) => {
    announceIfAvailable(payload.atMs);
  });
  const offIntro = events.on('hydra:intro-complete', ({ payload }) => {
    if (payload.milestone === definition.firstEligibilityMilestone) {
      announceIfAvailable(payload.atMs);
    }
  });

  function purchase() {
    const before = getStatus();
    if (before.maxed) return { accepted: false, reason: 'max-level', status: before };
    if (!before.eligibilityMet) {
      return { accepted: false, reason: 'eligibility-required', status: before };
    }
    if (before.pricePending) return { accepted: false, reason: 'price-pending', status: before };
    if (!before.killsMet) return { accepted: false, reason: 'kills-required', status: before };
    if (!before.canAfford) {
      return { accepted: false, reason: 'insufficient-humanity-evil', status: before };
    }

    const next = definition.levels[before.level];
    const atMs = state.read().time.simulationTimeMs;
    const absoluteNpPoints = normalizedToPoints(state.read().berserker.np, before.npMaxPoints);

    state.update((draft) => {
      draft.master.humanityEvil -= next.cost;
      const id = milestoneId(definition, next.level);
      if (!draft.progression.milestones.includes(id)) {
        draft.progression.milestones.push(id);
      }

      // State stores NP normalized for save compatibility. Changing the gauge
      // requirement must preserve actual charged points rather than granting a
      // free proportional refill when the maximum changes.
      const retainedPoints = Math.min(absoluteNpPoints, next.npMaxPoints);
      draft.berserker.np = retainedPoints / next.npMaxPoints;
    });

    announcedLevel = null;
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
      branch: next.branch,
      rewardLabel: next.rewardLabel,
      npManualStrikeCount: next.npManualStrikeCount,
      npMaxPoints: next.npMaxPoints,
      npDurationMs: next.npDurationMs,
    };

    events.emit(next.level === 1 ? 'command-spell:unlocked' : 'command-spell:upgraded', payload);
    return { accepted: true, level: next.level, status: getStatus() };
  }

  return Object.freeze({
    getStatus,
    purchase,
    destroy() {
      offKilled();
      offCurrency();
      offIntro();
    },
  });
}

export const HYDRA_I_REGEN_CURVE = Object.freeze({
  baseDelayMs: 1500,
  kill9DelayMs: 350,
  minDelayMs: 100,
  kill9: 9,
  minAtKills: 99,
});

export const HUMANITY_EVIL_ECONOMY = Object.freeze({
  basePerKill: 11n,
  generationMultiplier: 3n,
});

export function getHydraIRegenDelayMs(
  totalHydrasKilled,
  curve = HYDRA_I_REGEN_CURVE,
) {
  if (typeof totalHydrasKilled !== 'bigint' || totalHydrasKilled < 0n) {
    throw new TypeError('totalHydrasKilled must be a non-negative BigInt.');
  }

  const {
    baseDelayMs,
    kill9DelayMs,
    minDelayMs,
    kill9,
    minAtKills,
  } = curve;

  for (const [name, value] of Object.entries({
    baseDelayMs,
    kill9DelayMs,
    minDelayMs,
    kill9,
    minAtKills,
  })) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be a finite number > 0.`);
    }
  }

  if (!Number.isInteger(kill9) || !Number.isInteger(minAtKills) || minAtKills <= kill9) {
    throw new RangeError('kill9 and minAtKills must be increasing positive integers.');
  }
  if (!(baseDelayMs > kill9DelayMs && kill9DelayMs > minDelayMs)) {
    throw new RangeError('regen delays must satisfy base > kill9 > minimum.');
  }

  const cappedKills = totalHydrasKilled > BigInt(minAtKills)
    ? minAtKills
    : Number(totalHydrasKilled);

  if (cappedKills <= kill9) {
    const progress = cappedKills / kill9;
    const ratio = kill9DelayMs / baseDelayMs;
    return Math.round(baseDelayMs * (ratio ** progress));
  }

  const tailProgress = (minAtKills - cappedKills) / (minAtKills - kill9);
  const curvedDelay = minDelayMs
    + (kill9DelayMs - minDelayMs) * (tailProgress ** 2);

  return Math.max(minDelayMs, Math.round(curvedDelay));
}

export function getHumanityEvilRewardForGeneration(
  generation,
  economy = HUMANITY_EVIL_ECONOMY,
) {
  if (!Number.isInteger(generation) || generation < 1) {
    throw new RangeError('generation must be a positive integer.');
  }

  const {
    basePerKill = 11n,
    generationMultiplier = 3n,
  } = economy ?? {};

  if (typeof basePerKill !== 'bigint' || basePerKill < 0n) {
    throw new TypeError('basePerKill must be a non-negative BigInt.');
  }
  if (typeof generationMultiplier !== 'bigint' || generationMultiplier < 1n) {
    throw new TypeError('generationMultiplier must be a positive BigInt.');
  }

  return basePerKill * (generationMultiplier ** BigInt(generation - 1));
}

export function getHumanityEvilCostForGenerationUnits(
  generation,
  units,
  economy = HUMANITY_EVIL_ECONOMY,
) {
  if (typeof units !== 'bigint' || units < 0n) {
    throw new TypeError('units must be a non-negative BigInt.');
  }
  return getHumanityEvilRewardForGeneration(generation, economy) * units;
}

const humanityCost = (generation, units) => (
  getHumanityEvilCostForGenerationUnits(generation, units, HUMANITY_EVIL_ECONOMY)
);

const HYDRA_II_FIRST_MANUAL_CUT_MILESTONE = 'hydra-ii-first-manual-cut';
const HYDRA_III_FIRST_NP_RELEASE_MILESTONE = 'hydra-iii-first-np-release';

// Command Spell I uses debut-generation Humanity Evil units (U_n) from the
// long-term economy proposal. Hydra I is the onboarding exception; Hydra II
// begins the mature 36U / 54U pair. The 729 APS price remains a range, so it is
// intentionally still pending rather than silently choosing one endpoint.
const COMMAND_SPELL_I_LEVELS = Object.freeze([
  Object.freeze({ level: 1, requiredHydraKills: null, cost: humanityCost(1, 9n), attacksPerSecond: 1 }),
  Object.freeze({ level: 2, requiredHydraKills: null, cost: humanityCost(1, 3n), attacksPerSecond: 3 }),
  Object.freeze({ level: 3, requiredHydraKills: null, cost: humanityCost(1, 6n), attacksPerSecond: 9 }),
  Object.freeze({ level: 4, requiredHydraKills: null, cost: humanityCost(1, 9n), attacksPerSecond: 27 }),
  Object.freeze({ level: 5, requiredHydraKills: null, cost: humanityCost(2, 36n), attacksPerSecond: 81 }),
  Object.freeze({ level: 6, requiredHydraKills: null, cost: humanityCost(2, 54n), attacksPerSecond: 243 }),
  Object.freeze({
    level: 7,
    requiredHydraKills: null,
    cost: null,
    attacksPerSecond: 729,
    purchasePending: true,
    intendedGeneration: 3,
  }),
]);

// Only the Hydra-II teaching trio has a single-value price in the current
// long-term proposal. Later CS II beats keep their already-tested effect shapes
// for save/TEST compatibility, but formal purchasing is price-pending until the
// cross-generation ranges are resolved. 81 seconds is no longer treated as the
// conceptual end of Command Spell II's long-term time axis.
const COMMAND_SPELL_II_LEVELS = Object.freeze([
  Object.freeze({
    level: 1,
    branch: 'strike',
    rewardLabel: 'NP MANUAL ×3',
    requiredGenerationKills: 0n,
    cost: humanityCost(2, 9n),
    npManualStrikeCount: 3,
    npMaxPoints: 132,
    npDurationMs: 3000,
  }),
  Object.freeze({
    level: 2,
    branch: 'efficiency',
    rewardLabel: 'NP EFFICIENCY I',
    requiredGenerationKills: 9n,
    cost: humanityCost(2, 6n),
    npManualStrikeCount: 3,
    npMaxPoints: 66,
    npDurationMs: 3000,
  }),
  Object.freeze({
    level: 3,
    branch: 'time',
    rewardLabel: 'TIME STOP 9 s',
    requiredGenerationKills: 18n,
    cost: humanityCost(2, 27n),
    npManualStrikeCount: 3,
    npMaxPoints: 198,
    npDurationMs: 9000,
  }),
  Object.freeze({
    level: 4,
    branch: 'strike',
    rewardLabel: 'NP MANUAL ×6',
    requiredGenerationKills: null,
    intendedGeneration: 3,
    cost: null,
    purchasePending: true,
    npManualStrikeCount: 6,
    npMaxPoints: 396,
    npDurationMs: 9000,
  }),
  Object.freeze({
    level: 5,
    branch: 'efficiency',
    rewardLabel: 'NP EFFICIENCY II',
    requiredGenerationKills: null,
    intendedGeneration: 3,
    cost: null,
    purchasePending: true,
    npManualStrikeCount: 6,
    npMaxPoints: 198,
    npDurationMs: 9000,
  }),
  Object.freeze({
    level: 6,
    branch: 'time',
    rewardLabel: 'TIME STOP 27 s',
    requiredGenerationKills: null,
    intendedGeneration: 3,
    cost: null,
    purchasePending: true,
    npManualStrikeCount: 6,
    npMaxPoints: 594,
    npDurationMs: 27000,
  }),
  Object.freeze({
    level: 7,
    branch: 'strike',
    rewardLabel: 'NP MANUAL ×9',
    requiredGenerationKills: null,
    intendedGeneration: 4,
    cost: null,
    purchasePending: true,
    npManualStrikeCount: 9,
    npMaxPoints: 792,
    npDurationMs: 27000,
  }),
  Object.freeze({
    level: 8,
    branch: 'efficiency',
    rewardLabel: 'NP EFFICIENCY III',
    requiredGenerationKills: null,
    intendedGeneration: 4,
    cost: null,
    purchasePending: true,
    npManualStrikeCount: 9,
    npMaxPoints: 396,
    npDurationMs: 27000,
  }),
  Object.freeze({
    level: 9,
    branch: 'time',
    rewardLabel: 'TIME STOP 81 s',
    requiredGenerationKills: null,
    intendedGeneration: 4,
    cost: null,
    purchasePending: true,
    npManualStrikeCount: 9,
    npMaxPoints: 1188,
    npDurationMs: 81000,
  }),
]);

// Command Spell III is intentionally finite. The first bridge purchase has a
// single-value 9U3 debut price. Lv.2/MAX remain ranges in player-facing design,
// so only those later purchases stay price-pending.
const COMMAND_SPELL_III_LEVELS = Object.freeze([
  Object.freeze({
    level: 1,
    rewardLabel: 'AUTO IN NP · 1/9',
    autoNpNumerator: 1,
    autoNpDenominator: 9,
    cost: humanityCost(3, 9n),
  }),
  Object.freeze({
    level: 2,
    rewardLabel: 'AUTO IN NP · 1/3',
    autoNpNumerator: 1,
    autoNpDenominator: 3,
    cost: null,
    purchasePending: true,
  }),
  Object.freeze({
    level: 3,
    rewardLabel: 'AUTO IN NP · FULL',
    autoNpNumerator: 1,
    autoNpDenominator: 1,
    cost: null,
    purchasePending: true,
  }),
]);

export const HYDRA_GENERATIONS = Object.freeze({
  1: Object.freeze({
    generation: 1,
    startingHeads: 9n,
    maxHeads: 9n,
    killsToNextGeneration: 99n,
  }),
  2: Object.freeze({
    generation: 2,
    startingHeads: 9n,
    maxHeads: 81n,
    killsToNextGeneration: 99n,
  }),
  3: Object.freeze({
    generation: 3,
    startingHeads: 9n,
    maxHeads: 729n,
    killsToNextGeneration: null,
  }),
});

export const HYDRA_I_PROGRESSION = Object.freeze({
  // Legacy alias retained for Hydra I-only callers/tests.
  humanityEvilPerKill: HUMANITY_EVIL_ECONOMY.basePerKill,
  humanityEvil: HUMANITY_EVIL_ECONOMY,
  respawnDelayMs: 300,
  burstRespawnDelayMs: 100,
  regenCurve: HYDRA_I_REGEN_CURVE,
  generations: HYDRA_GENERATIONS,
  np: Object.freeze({
    maxPoints: 66,
    pointsPerHead: 1,
    durationMs: 3000,
  }),
  commandSpellI: Object.freeze({
    id: 'command-spell-1',
    displayName: 'Command Spell I',
    requiredHydraKills: 9n,
    cost: Object.freeze({
      currency: 'humanity-evil',
      amount: humanityCost(1, 9n),
    }),
    unlocks: Object.freeze(['combat.autoSlash']),
    levels: COMMAND_SPELL_I_LEVELS,
  }),
  commandSpellII: Object.freeze({
    id: 'command-spell-2',
    displayName: 'Command Spell II',
    unlockGeneration: 2,
    firstEligibilityMilestone: HYDRA_II_FIRST_MANUAL_CUT_MILESTONE,
    futureExtensionPending: true,
    base: Object.freeze({
      npManualStrikeCount: 1,
      npMaxPoints: 66,
      npDurationMs: 3000,
    }),
    levels: COMMAND_SPELL_II_LEVELS,
  }),
  commandSpellIII: Object.freeze({
    id: 'command-spell-3',
    displayName: 'Command Spell III',
    unlockGeneration: 3,
    firstEligibilityMilestone: HYDRA_III_FIRST_NP_RELEASE_MILESTONE,
    base: Object.freeze({
      autoNpNumerator: 0,
      autoNpDenominator: 1,
    }),
    levels: COMMAND_SPELL_III_LEVELS,
  }),
  // Compatibility alias for the existing Playtest 4.2 TEST preset/API while
  // formal Command Spell II progression replaces the prototype-only path.
  commandSpellIIPrototype: Object.freeze({
    id: 'command-spell-2',
    firstLevelMilestone: 'command-spell-2-lv1',
    npManualStrikeCount: 3,
  }),
  hydraIIIntro: Object.freeze({
    unlockAtHydraKills: 99n,
    generation: 2,
    firstManualCutMilestone: HYDRA_II_FIRST_MANUAL_CUT_MILESTONE,
  }),
  hydraIIIIntro: Object.freeze({
    fromGeneration: 2,
    generation: 3,
    unlockAfterGenerationKills: 99n,
    treeViewLogicalHeadThreshold: 100n,
    firstNpReleaseMilestone: HYDRA_III_FIRST_NP_RELEASE_MILESTONE,
  }),
});

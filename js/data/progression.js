export const HYDRA_I_REGEN_CURVE = Object.freeze({
  baseDelayMs: 1500,
  kill9DelayMs: 350,
  minDelayMs: 100,
  kill9: 9,
  minAtKills: 99,
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
  {
    basePerKill = 11n,
    generationMultiplier = 3n,
  } = {},
) {
  if (!Number.isInteger(generation) || generation < 1) {
    throw new RangeError('generation must be a positive integer.');
  }
  if (typeof basePerKill !== 'bigint' || basePerKill < 0n) {
    throw new TypeError('basePerKill must be a non-negative BigInt.');
  }
  if (typeof generationMultiplier !== 'bigint' || generationMultiplier < 1n) {
    throw new TypeError('generationMultiplier must be a positive BigInt.');
  }

  return basePerKill * (generationMultiplier ** BigInt(generation - 1));
}

// Command Spell I now follows the player-facing affordability-driven pacing.
// Levels 1–6 have no independent kill gate: sequential prerequisites + the
// shared Humanity Evil balance naturally produce the intended chapter timing.
// Lv.7 / 729 APS belongs to Hydra III, but its real price is intentionally TBD.
const COMMAND_SPELL_I_LEVELS = Object.freeze([
  Object.freeze({ level: 1, requiredHydraKills: null, cost: 99n, attacksPerSecond: 1 }),
  Object.freeze({ level: 2, requiredHydraKills: null, cost: 33n, attacksPerSecond: 3 }),
  Object.freeze({ level: 3, requiredHydraKills: null, cost: 66n, attacksPerSecond: 9 }),
  Object.freeze({ level: 4, requiredHydraKills: null, cost: 99n, attacksPerSecond: 27 }),
  Object.freeze({ level: 5, requiredHydraKills: null, cost: 1782n, attacksPerSecond: 81 }),
  Object.freeze({ level: 6, requiredHydraKills: null, cost: 2178n, attacksPerSecond: 243 }),
  Object.freeze({
    level: 7,
    requiredHydraKills: null,
    cost: null,
    attacksPerSecond: 729,
    purchasePending: true,
    intendedGeneration: 3,
  }),
]);

const COMMAND_SPELL_II_LEVELS = Object.freeze([
  Object.freeze({
    level: 1,
    branch: 'strike',
    rewardLabel: 'NP MANUAL ×3',
    requiredGenerationKills: 3n,
    cost: 297n,
    npManualStrikeCount: 3,
    npMaxPoints: 132,
    npDurationMs: 3000,
  }),
  Object.freeze({
    level: 2,
    branch: 'efficiency',
    rewardLabel: 'NP EFFICIENCY I',
    requiredGenerationKills: 9n,
    cost: 198n,
    npManualStrikeCount: 3,
    npMaxPoints: 66,
    npDurationMs: 3000,
  }),
  Object.freeze({
    level: 3,
    branch: 'time',
    rewardLabel: 'TIME STOP 9 s',
    requiredGenerationKills: 18n,
    cost: 396n,
    npManualStrikeCount: 3,
    npMaxPoints: 198,
    npDurationMs: 9000,
  }),
  Object.freeze({
    level: 4,
    branch: 'strike',
    rewardLabel: 'NP MANUAL ×6',
    requiredGenerationKills: 27n,
    cost: 396n,
    npManualStrikeCount: 6,
    npMaxPoints: 396,
    npDurationMs: 9000,
  }),
  Object.freeze({
    level: 5,
    branch: 'efficiency',
    rewardLabel: 'NP EFFICIENCY II',
    requiredGenerationKills: 39n,
    cost: 330n,
    npManualStrikeCount: 6,
    npMaxPoints: 198,
    npDurationMs: 9000,
  }),
  Object.freeze({
    level: 6,
    branch: 'time',
    rewardLabel: 'TIME STOP 27 s',
    requiredGenerationKills: 54n,
    cost: 495n,
    npManualStrikeCount: 6,
    npMaxPoints: 594,
    npDurationMs: 27000,
  }),
  Object.freeze({
    level: 7,
    branch: 'strike',
    rewardLabel: 'NP MANUAL ×9',
    requiredGenerationKills: 66n,
    cost: 594n,
    npManualStrikeCount: 9,
    npMaxPoints: 792,
    npDurationMs: 27000,
  }),
  Object.freeze({
    level: 8,
    branch: 'efficiency',
    rewardLabel: 'NP EFFICIENCY III',
    requiredGenerationKills: 81n,
    cost: 495n,
    npManualStrikeCount: 9,
    npMaxPoints: 396,
    npDurationMs: 27000,
  }),
  Object.freeze({
    level: 9,
    branch: 'time',
    rewardLabel: 'TIME STOP 81 s · MAX',
    requiredGenerationKills: 99n,
    cost: 693n,
    npManualStrikeCount: 9,
    npMaxPoints: 1188,
    npDurationMs: 81000,
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
  humanityEvilPerKill: 11n,
  humanityEvil: Object.freeze({
    basePerKill: 11n,
    generationMultiplier: 3n,
  }),
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
    // Legacy first-purchase aliases remain because 99 Humanity Evil naturally
    // occurs at Hydra I kill 9 under the 11-per-kill economy.
    requiredHydraKills: 9n,
    cost: Object.freeze({
      currency: 'humanity-evil',
      amount: 99n,
    }),
    unlocks: Object.freeze(['combat.autoSlash']),
    levels: COMMAND_SPELL_I_LEVELS,
  }),
  commandSpellII: Object.freeze({
    id: 'command-spell-2',
    displayName: 'Command Spell II',
    unlockGeneration: 2,
    base: Object.freeze({
      npManualStrikeCount: 1,
      npMaxPoints: 66,
      npDurationMs: 3000,
    }),
    levels: COMMAND_SPELL_II_LEVELS,
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
    firstManualCutMilestone: 'hydra-ii-first-manual-cut',
  }),
  hydraIIIIntro: Object.freeze({
    fromGeneration: 2,
    generation: 3,
    unlockAfterGenerationKills: 99n,
  }),
});

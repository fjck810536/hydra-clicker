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

const COMMAND_SPELL_I_LEVELS = Object.freeze([
  Object.freeze({ level: 1, requiredHydraKills: 9n, cost: 99n, attacksPerSecond: 1 }),
  Object.freeze({ level: 2, requiredHydraKills: 12n, cost: 22n, attacksPerSecond: 2 }),
  Object.freeze({ level: 3, requiredHydraKills: 16n, cost: 33n, attacksPerSecond: 4 }),
  Object.freeze({ level: 4, requiredHydraKills: 22n, cost: 44n, attacksPerSecond: 8 }),
  Object.freeze({ level: 5, requiredHydraKills: 30n, cost: 66n, attacksPerSecond: 16 }),
  Object.freeze({ level: 6, requiredHydraKills: 40n, cost: 88n, attacksPerSecond: 32 }),
  Object.freeze({ level: 7, requiredHydraKills: 66n, cost: 132n, attacksPerSecond: 64 }),
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
  humanityEvilPerKill: 11n,
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
      amount: 99n,
    }),
    unlocks: Object.freeze(['combat.autoSlash']),
    levels: COMMAND_SPELL_I_LEVELS,
  }),
  // Player-facing design has confirmed the first Command Spell II effect but
  // not its economy/unlock ladder yet. Keep the effect testable without
  // inventing permanent pricing or progression thresholds.
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

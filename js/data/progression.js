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

  // Phase A: the first nine kills teach the player that regeneration is
  // accelerating quickly. Exponential interpolation hits exactly 350ms at kill 9.
  if (cappedKills <= kill9) {
    const progress = cappedKills / kill9;
    const ratio = kill9DelayMs / baseDelayMs;
    return Math.round(baseDelayMs * (ratio ** progress));
  }

  // Phase B: regeneration keeps getting faster, but each additional kill buys
  // less speed than the previous one. A squared remaining-distance curve gives
  // a smooth flattening tail and reaches the logical 100ms floor at kill 99.
  const tailProgress = (minAtKills - cappedKills) / (minAtKills - kill9);
  const curvedDelay = minDelayMs
    + (kill9DelayMs - minDelayMs) * (tailProgress ** 2);

  return Math.max(minDelayMs, Math.round(curvedDelay));
}

export const HYDRA_I_PROGRESSION = Object.freeze({
  humanityEvilPerKill: 11n,
  respawnDelayMs: 300,
  regenCurve: HYDRA_I_REGEN_CURVE,
  commandSpellI: Object.freeze({
    id: 'command-spell-1',
    displayName: 'Command Spell I',
    requiredHydraKills: 9n,
    cost: Object.freeze({
      currency: 'humanity-evil',
      amount: 99n,
    }),
    unlocks: Object.freeze(['combat.autoSlash']),
  }),
});

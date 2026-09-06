export const HYDRA_I_REGEN_CURVE = Object.freeze({
  baseDelayMs: 1500,
  killsScale: 30,
  minDelayMs: 350,
});

export function getHydraIRegenDelayMs(
  totalHydrasKilled,
  curve = HYDRA_I_REGEN_CURVE,
) {
  if (typeof totalHydrasKilled !== 'bigint' || totalHydrasKilled < 0n) {
    throw new TypeError('totalHydrasKilled must be a non-negative BigInt.');
  }

  const { baseDelayMs, killsScale, minDelayMs } = curve;
  for (const [name, value] of Object.entries({ baseDelayMs, killsScale, minDelayMs })) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be a finite number > 0.`);
    }
  }

  const boundedKills = totalHydrasKilled > 1000000n ? 1000000n : totalHydrasKilled;
  const kills = Number(boundedKills);
  const curvedDelay = baseDelayMs / (1 + kills / killsScale);
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

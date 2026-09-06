export const HYDRA_I_PROGRESSION = Object.freeze({
  humanityEvilPerKill: 11n,
  respawnDelayMs: 1200,
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

export function createHumanityEvilSystem({
  state,
  events,
  rewardPerHydraKill = 1n,
} = {}) {
  if (!state || typeof state.read !== 'function' || typeof state.update !== 'function') {
    throw new TypeError('Humanity Evil system requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('Humanity Evil system requires an event bus.');
  }
  if (typeof rewardPerHydraKill !== 'bigint' || rewardPerHydraKill < 0n) {
    throw new TypeError('rewardPerHydraKill must be a non-negative BigInt.');
  }

  const offKilled = events.on('hydra:killed', ({ payload }) => {
    if (rewardPerHydraKill === 0n) return;

    state.update((draft) => {
      draft.master.humanityEvil += rewardPerHydraKill;
    });

    events.emit('currency:gain', {
      atMs: payload.atMs,
      currency: 'humanity-evil',
      amount: rewardPerHydraKill,
      reason: 'hydra-kill',
      balance: state.read().master.humanityEvil,
    });
  });

  return {
    destroy() {
      offKilled();
    },
  };
}

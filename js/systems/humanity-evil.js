export function createHumanityEvilSystem({
  state,
  events,
  rewardPerHydraKill = 1n,
  getRewardPerHydraKill = null,
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
  if (getRewardPerHydraKill != null && typeof getRewardPerHydraKill !== 'function') {
    throw new TypeError('getRewardPerHydraKill must be a function when provided.');
  }

  const resolveReward = (payload) => {
    const reward = getRewardPerHydraKill?.(payload, state.read()) ?? rewardPerHydraKill;
    if (typeof reward !== 'bigint' || reward < 0n) {
      throw new TypeError('Resolved Humanity Evil reward must be a non-negative BigInt.');
    }
    return reward;
  };

  const offKilled = events.on('hydra:killed', ({ payload }) => {
    const reward = resolveReward(payload);
    if (reward === 0n) return;

    state.update((draft) => {
      draft.master.humanityEvil += reward;
    });

    events.emit('currency:gain', {
      atMs: payload.atMs,
      currency: 'humanity-evil',
      amount: reward,
      reason: 'hydra-kill',
      generation: payload.generation ?? state.read().hydra.generation,
      balance: state.read().master.humanityEvil,
    });
  });

  return {
    destroy() {
      offKilled();
    },
  };
}

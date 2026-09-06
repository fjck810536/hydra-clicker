export function createHydraIProgressionSystem({
  state,
  events,
  respawnDelayMs = 1200,
} = {}) {
  if (!state || typeof state.read !== 'function' || typeof state.update !== 'function') {
    throw new TypeError('Progression system requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('Progression system requires an event bus.');
  }
  if (!Number.isFinite(respawnDelayMs) || respawnDelayMs < 0) {
    throw new RangeError('respawnDelayMs must be a finite number >= 0.');
  }

  const offKilled = events.on('hydra:killed', ({ payload }) => {
    state.update((draft) => {
      draft.hydra.defeated = true;
      draft.hydra.respawnAtMs = payload.atMs + respawnDelayMs;
    });
  });

  const offTick = events.on('clock:tick', ({ payload: tick }) => {
    const snapshot = state.read();
    if (!snapshot.hydra.defeated || snapshot.hydra.respawnAtMs == null) return;
    if (tick.nowMs < snapshot.hydra.respawnAtMs) return;

    let encounter = 0n;
    state.update((draft) => {
      draft.hydra.logicalHeadCount = draft.hydra.startingHeadCount;
      draft.hydra.turn = 0n;
      draft.hydra.pendingRegrowth = [];
      draft.hydra.defeated = false;
      draft.hydra.respawnAtMs = null;
      draft.hydra.encounter += 1n;
      encounter = draft.hydra.encounter;

      draft.modifiers.active = draft.modifiers.active.filter((modifier) => {
        return modifier.scope !== 'encounter';
      });
    });

    events.emit('hydra:respawned', {
      atMs: tick.nowMs,
      generation: 1,
      encounter,
      heads: state.read().hydra.logicalHeadCount,
    });
  });

  return {
    destroy() {
      offKilled();
      offTick();
    },
  };
}

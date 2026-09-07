export function createHydraIProgressionSystem({
  state,
  events,
  respawnDelayMs = 1200,
  getRespawnDelayMs = null,
  hydraIIIntro = null,
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
  if (getRespawnDelayMs != null && typeof getRespawnDelayMs !== 'function') {
    throw new TypeError('getRespawnDelayMs must be a function when provided.');
  }
  if (hydraIIIntro != null) {
    if (typeof hydraIIIntro.unlockAtHydraKills !== 'bigint' || hydraIIIntro.unlockAtHydraKills < 1n) {
      throw new TypeError('hydraIIIntro.unlockAtHydraKills must be a positive BigInt.');
    }
    if (!Number.isInteger(hydraIIIntro.generation) || hydraIIIntro.generation < 2) {
      throw new TypeError('hydraIIIntro.generation must be an integer >= 2.');
    }
    if (typeof hydraIIIntro.firstManualCutMilestone !== 'string' || hydraIIIntro.firstManualCutMilestone.length < 1) {
      throw new TypeError('hydraIIIntro.firstManualCutMilestone must be a non-empty string.');
    }
  }

  const resolveRespawnDelayMs = (snapshot, payload) => {
    const delay = getRespawnDelayMs?.(snapshot, payload) ?? respawnDelayMs;
    if (!Number.isFinite(delay) || delay < 0) {
      throw new RangeError('Resolved Hydra respawn delay must be a finite number >= 0.');
    }
    return delay;
  };

  const shouldEnterHydraII = (snapshot) => (
    hydraIIIntro != null
    && snapshot.hydra.generation === 1
    && snapshot.statistics.totalHydrasKilled >= hydraIIIntro.unlockAtHydraKills
  );

  function resetEncounterDraft(draft, { generation = draft.hydra.generation, encounter = null } = {}) {
    draft.hydra.generation = generation;
    draft.progression.hydraGeneration = generation;
    draft.hydra.logicalHeadCount = draft.hydra.startingHeadCount;
    draft.hydra.turn = 0n;
    draft.hydra.pendingRegrowth = [];
    draft.hydra.defeated = false;
    draft.hydra.respawnAtMs = null;
    draft.hydra.encounter = encounter ?? (draft.hydra.encounter + 1n);
    draft.modifiers.active = draft.modifiers.active.filter((modifier) => {
      return modifier.scope !== 'encounter';
    });
  }

  function enterHydraII(atMs) {
    let heads = 0n;
    state.update((draft) => {
      resetEncounterDraft(draft, {
        generation: hydraIIIntro.generation,
        encounter: 1n,
      });
      heads = draft.hydra.logicalHeadCount;
    });

    events.emit('hydra:generation-changed', {
      atMs,
      generation: hydraIIIntro.generation,
      encounter: 1n,
      heads,
      introRequiresManualCut: true,
    });
  }

  const offKilled = events.on('hydra:killed', ({ payload }) => {
    const delay = resolveRespawnDelayMs(state.read(), payload);
    state.update((draft) => {
      draft.hydra.defeated = true;
      draft.hydra.respawnAtMs = payload.atMs + delay;
    });
  });

  const offCut = events.on('head:cut', ({ payload }) => {
    if (hydraIIIntro == null || payload.source !== 'manual') return;
    const snapshot = state.read();
    if (snapshot.hydra.generation !== hydraIIIntro.generation) return;
    if (snapshot.progression.milestones.includes(hydraIIIntro.firstManualCutMilestone)) return;

    state.update((draft) => {
      draft.progression.milestones.push(hydraIIIntro.firstManualCutMilestone);
    });

    events.emit('hydra:intro-complete', {
      atMs: payload.atMs,
      generation: hydraIIIntro.generation,
      milestone: hydraIIIntro.firstManualCutMilestone,
    });
  });

  const offTick = events.on('clock:tick', ({ payload: tick }) => {
    const snapshot = state.read();

    // Compatibility path: a Playtest 2 save may already be sitting at 99 kills
    // with a live Hydra I. Enter Hydra II on the next simulation tick.
    if (shouldEnterHydraII(snapshot) && !snapshot.hydra.defeated) {
      enterHydraII(tick.nowMs);
      return;
    }

    if (!snapshot.hydra.defeated || snapshot.hydra.respawnAtMs == null) return;
    if (tick.nowMs < snapshot.hydra.respawnAtMs) return;

    if (shouldEnterHydraII(snapshot)) {
      enterHydraII(tick.nowMs);
      return;
    }

    let encounter = 0n;
    let generation = 1;
    state.update((draft) => {
      resetEncounterDraft(draft);
      encounter = draft.hydra.encounter;
      generation = draft.hydra.generation;
    });

    events.emit('hydra:respawned', {
      atMs: tick.nowMs,
      generation,
      encounter,
      heads: state.read().hydra.logicalHeadCount,
    });
  });

  return {
    destroy() {
      offKilled();
      offCut();
      offTick();
    },
  };
}

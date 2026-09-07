export function createHydraIProgressionSystem({
  state,
  events,
  respawnDelayMs = 1200,
  getRespawnDelayMs = null,
  generations = null,
  hydraIIIntro = null,
  hydraIIIIntro = null,
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
  if (generations != null && typeof generations !== 'object') {
    throw new TypeError('generations must be an object when provided.');
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
  if (hydraIIIIntro != null) {
    if (!Number.isInteger(hydraIIIIntro.fromGeneration) || hydraIIIIntro.fromGeneration < 1) {
      throw new TypeError('hydraIIIIntro.fromGeneration must be a positive integer.');
    }
    if (!Number.isInteger(hydraIIIIntro.generation) || hydraIIIIntro.generation <= hydraIIIIntro.fromGeneration) {
      throw new TypeError('hydraIIIIntro.generation must be greater than fromGeneration.');
    }
    if (typeof hydraIIIIntro.unlockAfterGenerationKills !== 'bigint' || hydraIIIIntro.unlockAfterGenerationKills < 1n) {
      throw new TypeError('hydraIIIIntro.unlockAfterGenerationKills must be a positive BigInt.');
    }
    if (
      hydraIIIIntro.treeViewLogicalHeadThreshold != null
      && (
        typeof hydraIIIIntro.treeViewLogicalHeadThreshold !== 'bigint'
        || hydraIIIIntro.treeViewLogicalHeadThreshold < 1n
      )
    ) {
      throw new TypeError('hydraIIIIntro.treeViewLogicalHeadThreshold must be a positive BigInt.');
    }
  }

  const getGenerationConfig = (generation) => {
    const config = generations?.[generation] ?? null;
    if (config == null) return null;
    if (typeof config.startingHeads !== 'bigint' || config.startingHeads < 1n) {
      throw new TypeError(`Generation ${generation} startingHeads must be a positive BigInt.`);
    }
    if (typeof config.maxHeads !== 'bigint' || config.maxHeads < config.startingHeads) {
      throw new TypeError(`Generation ${generation} maxHeads must be a BigInt >= startingHeads.`);
    }
    return config;
  };

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

  const completedKillsInCurrentGeneration = (snapshot) => {
    if (snapshot.hydra.encounter < 1n) return 0n;
    return snapshot.hydra.defeated
      ? snapshot.hydra.encounter
      : snapshot.hydra.encounter - 1n;
  };

  const shouldEnterHydraIII = (snapshot) => (
    hydraIIIIntro != null
    && snapshot.hydra.generation === hydraIIIIntro.fromGeneration
    && completedKillsInCurrentGeneration(snapshot) >= hydraIIIIntro.unlockAfterGenerationKills
  );

  function resetEncounterDraft(
    draft,
    {
      generation = draft.hydra.generation,
      encounter = null,
      startingHeads = null,
    } = {},
  ) {
    const generationConfig = getGenerationConfig(generation);
    const resolvedStartingHeads = startingHeads
      ?? generationConfig?.startingHeads
      ?? draft.hydra.startingHeadCount;

    draft.hydra.generation = generation;
    draft.progression.hydraGeneration = generation;
    draft.hydra.startingHeadCount = resolvedStartingHeads;
    draft.hydra.logicalHeadCount = resolvedStartingHeads;
    draft.hydra.turn = 0n;
    draft.hydra.pendingRegrowth = [];
    draft.hydra.defeated = false;
    draft.hydra.respawnAtMs = null;
    draft.hydra.encounter = encounter ?? (draft.hydra.encounter + 1n);
    draft.modifiers.active = draft.modifiers.active.filter((modifier) => {
      return modifier.scope !== 'encounter';
    });
  }

  function enterGeneration(generation, atMs, { introRequiresManualCut = false } = {}) {
    const config = getGenerationConfig(generation);
    let heads = 0n;
    state.update((draft) => {
      resetEncounterDraft(draft, {
        generation,
        encounter: 1n,
        startingHeads: config?.startingHeads ?? 9n,
      });
      heads = draft.hydra.logicalHeadCount;
    });

    events.emit('hydra:generation-changed', {
      atMs,
      generation,
      encounter: 1n,
      heads,
      maxHeads: config?.maxHeads ?? null,
      introRequiresManualCut,
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
    let snapshot = state.read();

    if (
      hydraIIIntro != null
      && payload.source === 'manual'
      && snapshot.hydra.generation === hydraIIIntro.generation
      && !snapshot.progression.milestones.includes(hydraIIIntro.firstManualCutMilestone)
    ) {
      state.update((draft) => {
        draft.progression.milestones.push(hydraIIIntro.firstManualCutMilestone);
      });

      events.emit('hydra:intro-complete', {
        atMs: payload.atMs,
        generation: hydraIIIntro.generation,
        milestone: hydraIIIntro.firstManualCutMilestone,
      });
      snapshot = state.read();
    }

    const treeThreshold = hydraIIIIntro?.treeViewLogicalHeadThreshold ?? null;
    if (
      typeof treeThreshold === 'bigint'
      && snapshot.hydra.generation === hydraIIIIntro.generation
      && !snapshot.progression.treeViewUnlocked
      && snapshot.hydra.logicalHeadCount >= treeThreshold
    ) {
      state.update((draft) => {
        draft.progression.treeViewUnlocked = true;
      });

      events.emit('tree-view:unlocked', {
        atMs: payload.atMs,
        generation: hydraIIIIntro.generation,
        logicalHeads: state.read().hydra.logicalHeadCount,
        threshold: treeThreshold,
      });
    }
  });

  const offTick = events.on('clock:tick', ({ payload: tick }) => {
    const snapshot = state.read();

    // Compatibility paths for saves already beyond a generation threshold.
    if (!snapshot.hydra.defeated) {
      if (shouldEnterHydraIII(snapshot)) {
        enterGeneration(hydraIIIIntro.generation, tick.nowMs);
        return;
      }
      if (shouldEnterHydraII(snapshot)) {
        enterGeneration(hydraIIIntro.generation, tick.nowMs, {
          introRequiresManualCut: true,
        });
        return;
      }
    }

    if (!snapshot.hydra.defeated || snapshot.hydra.respawnAtMs == null) return;
    if (tick.nowMs < snapshot.hydra.respawnAtMs) return;

    if (shouldEnterHydraIII(snapshot)) {
      enterGeneration(hydraIIIIntro.generation, tick.nowMs);
      return;
    }

    if (shouldEnterHydraII(snapshot)) {
      enterGeneration(hydraIIIntro.generation, tick.nowMs, {
        introRequiresManualCut: true,
      });
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

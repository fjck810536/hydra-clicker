const DEFAULT_GAIN_PER_HEAD = 0.125;
const DEFAULT_DURATION_MS = 3000;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function createNpSystem({
  state,
  events,
  gainPerHead = DEFAULT_GAIN_PER_HEAD,
  durationMs = DEFAULT_DURATION_MS,
} = {}) {
  if (!state || typeof state.read !== 'function' || typeof state.update !== 'function') {
    throw new TypeError('NP system requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('NP system requires an event bus.');
  }
  if (!Number.isFinite(gainPerHead) || gainPerHead < 0) {
    throw new RangeError('gainPerHead must be a finite number >= 0.');
  }
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new RangeError('durationMs must be a finite number > 0.');
  }

  const offCut = events.on('head:cut', ({ payload }) => {
    const amount = Number(payload.amount);
    state.update((draft) => {
      draft.berserker.np = clamp01(draft.berserker.np + amount * gainPerHead);
    });
    events.emit('np:charge', {
      atMs: payload.atMs,
      amount: amount * gainPerHead,
      value: state.read().berserker.np,
    });
  });

  const offTick = events.on('clock:tick', ({ payload: tick }) => {
    state.update((draft) => {
      draft.modifiers.active = draft.modifiers.active.filter((modifier) => {
        return modifier.endsAt == null || tick.nowMs < modifier.endsAt;
      });
    });
  });

  function release() {
    const snapshot = state.read();
    if (snapshot.berserker.np < 1) {
      return { accepted: false, reason: 'np-not-ready' };
    }

    const startsAt = snapshot.time.simulationTimeMs;
    const endsAt = startsAt + durationMs;
    const modifier = {
      id: `np-regeneration-window-${snapshot.statistics.totalNpReleases.toString()}`,
      type: 'rule-modifier',
      target: 'hydra.regrowth',
      effect: 'disable',
      startsAt,
      endsAt,
      source: 'np',
      scope: 'encounter',
    };

    state.update((draft) => {
      draft.berserker.np = 0;
      draft.modifiers.active.push(modifier);
      draft.statistics.totalNpReleases += 1n;
    });

    const payload = { atMs: startsAt, endsAt, modifier };
    events.emit('np:released', payload);
    return { accepted: true, ...payload };
  }

  return {
    release,
    isReady() {
      return state.read().berserker.np >= 1;
    },
    destroy() {
      offCut();
      offTick();
    },
  };
}

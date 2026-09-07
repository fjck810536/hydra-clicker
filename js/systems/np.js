const DEFAULT_MAX_POINTS = 66;
const DEFAULT_POINTS_PER_HEAD = 1;
const DEFAULT_DURATION_MS = 3000;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function assertGaugeConfig({ maxPoints, pointsPerHead, durationMs }) {
  if (!Number.isInteger(maxPoints) || maxPoints < 1) {
    throw new RangeError('NP maxPoints must be a positive integer.');
  }
  if (!Number.isInteger(pointsPerHead) || pointsPerHead < 0) {
    throw new RangeError('NP pointsPerHead must be a non-negative integer.');
  }
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new RangeError('durationMs must be a finite number > 0.');
  }
}

function normalizedToPoints(value, maxPoints) {
  return Math.min(maxPoints, Math.max(0, Math.round(clamp01(value) * maxPoints)));
}

export function createNpSystem({
  state,
  events,
  maxPoints = DEFAULT_MAX_POINTS,
  pointsPerHead = DEFAULT_POINTS_PER_HEAD,
  durationMs = DEFAULT_DURATION_MS,
} = {}) {
  if (!state || typeof state.read !== 'function' || typeof state.update !== 'function') {
    throw new TypeError('NP system requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('NP system requires an event bus.');
  }
  assertGaugeConfig({ maxPoints, pointsPerHead, durationMs });

  function getStatus(snapshot = state.read()) {
    const points = normalizedToPoints(snapshot.berserker.np, maxPoints);
    return Object.freeze({
      points,
      maxPoints,
      ready: points >= maxPoints,
      normalized: points / maxPoints,
    });
  }

  const offCut = events.on('head:cut', ({ payload }) => {
    if (typeof payload.amount !== 'bigint' || payload.amount < 0n) {
      throw new TypeError('head:cut amount must be a non-negative BigInt.');
    }

    const maxRelevantHeads = pointsPerHead === 0
      ? 0
      : Math.ceil(maxPoints / pointsPerHead);
    const relevantHeads = payload.amount > BigInt(maxRelevantHeads)
      ? maxRelevantHeads
      : Number(payload.amount);
    const requestedPoints = relevantHeads * pointsPerHead;

    let gainedPoints = 0;
    let valuePoints = 0;
    state.update((draft) => {
      const currentPoints = normalizedToPoints(draft.berserker.np, maxPoints);
      valuePoints = Math.min(maxPoints, currentPoints + requestedPoints);
      gainedPoints = valuePoints - currentPoints;
      draft.berserker.np = valuePoints / maxPoints;
    });

    events.emit('np:charge', {
      atMs: payload.atMs,
      amount: gainedPoints,
      value: valuePoints,
      max: maxPoints,
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
    const status = getStatus(snapshot);
    if (!status.ready) {
      return { accepted: false, reason: 'np-not-ready', status };
    }

    const startsAt = snapshot.time.simulationTimeMs;
    const endsAt = startsAt + durationMs;
    const modifier = {
      id: `np-head-growth-window-${snapshot.statistics.totalNpReleases.toString()}`,
      type: 'rule-modifier',
      target: 'hydra.headGrowth',
      effect: 'disable',
      startsAt,
      endsAt,
      source: 'np',
      scope: 'timed',
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
    getStatus,
    isReady() {
      return getStatus().ready;
    },
    destroy() {
      offCut();
      offTick();
    },
  };
}

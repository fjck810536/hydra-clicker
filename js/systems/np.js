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

function isNpModifierActive(modifier, nowMs) {
  if (!modifier || modifier.source !== 'np') return false;
  const startsAt = modifier.startsAt ?? 0;
  const endsAt = modifier.endsAt ?? Infinity;
  return startsAt <= nowMs && nowMs < endsAt;
}

export function createNpSystem({
  state,
  events,
  maxPoints = DEFAULT_MAX_POINTS,
  pointsPerHead = DEFAULT_POINTS_PER_HEAD,
  durationMs = DEFAULT_DURATION_MS,
  getConfig = null,
} = {}) {
  if (!state || typeof state.read !== 'function' || typeof state.update !== 'function') {
    throw new TypeError('NP system requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('NP system requires an event bus.');
  }
  if (getConfig != null && typeof getConfig !== 'function') {
    throw new TypeError('NP getConfig must be a function when provided.');
  }
  assertGaugeConfig({ maxPoints, pointsPerHead, durationMs });

  function resolveConfig(snapshot = state.read()) {
    const dynamic = getConfig?.(snapshot) ?? {};
    if (!dynamic || typeof dynamic !== 'object') {
      throw new TypeError('NP getConfig() must return an object.');
    }
    const config = {
      maxPoints: dynamic.maxPoints ?? maxPoints,
      pointsPerHead: dynamic.pointsPerHead ?? pointsPerHead,
      durationMs: dynamic.durationMs ?? durationMs,
    };
    assertGaugeConfig(config);
    return Object.freeze(config);
  }

  function getStatus(snapshot = state.read()) {
    const config = resolveConfig(snapshot);
    const points = normalizedToPoints(snapshot.berserker.np, config.maxPoints);
    return Object.freeze({
      points,
      maxPoints: config.maxPoints,
      ready: points >= config.maxPoints,
      normalized: points / config.maxPoints,
      durationMs: config.durationMs,
      pointsPerHead: config.pointsPerHead,
    });
  }

  function getWindowStatus(snapshot = state.read()) {
    const nowMs = snapshot.time.simulationTimeMs;
    const active = snapshot.modifiers.active.filter((modifier) => isNpModifierActive(modifier, nowMs));
    if (active.length === 0) {
      return Object.freeze({ active: false, startsAt: null, endsAt: null, remainingMs: 0 });
    }

    const startsAt = Math.min(...active.map((modifier) => modifier.startsAt ?? 0));
    const endsAt = Math.max(...active.map((modifier) => modifier.endsAt ?? nowMs));
    return Object.freeze({
      active: true,
      startsAt,
      endsAt,
      remainingMs: Math.max(0, endsAt - nowMs),
    });
  }

  function isActive(snapshot = state.read()) {
    return getWindowStatus(snapshot).active;
  }

  const offCut = events.on('head:cut', ({ payload }) => {
    if (typeof payload.amount !== 'bigint' || payload.amount < 0n) {
      throw new TypeError('head:cut amount must be a non-negative BigInt.');
    }

    const snapshot = state.read();
    const config = resolveConfig(snapshot);
    const maxRelevantHeads = config.pointsPerHead === 0
      ? 0
      : Math.ceil(config.maxPoints / config.pointsPerHead);
    const relevantHeads = payload.amount > BigInt(maxRelevantHeads)
      ? maxRelevantHeads
      : Number(payload.amount);
    const requestedPoints = relevantHeads * config.pointsPerHead;

    let gainedPoints = 0;
    let valuePoints = 0;
    state.update((draft) => {
      const currentPoints = normalizedToPoints(draft.berserker.np, config.maxPoints);
      valuePoints = Math.min(config.maxPoints, currentPoints + requestedPoints);
      gainedPoints = valuePoints - currentPoints;
      draft.berserker.np = valuePoints / config.maxPoints;
    });

    events.emit('np:charge', {
      atMs: payload.atMs,
      amount: gainedPoints,
      value: valuePoints,
      max: config.maxPoints,
    });
  });

  const offTick = events.on('clock:tick', ({ payload: tick }) => {
    const expiredNpModifiers = [];
    let npStillActive = false;

    state.update((draft) => {
      draft.modifiers.active = draft.modifiers.active.filter((modifier) => {
        const expired = modifier.endsAt != null && tick.nowMs >= modifier.endsAt;
        if (expired && modifier.source === 'np') expiredNpModifiers.push(modifier);
        return !expired;
      });

      npStillActive = draft.modifiers.active.some((modifier) => (
        isNpModifierActive(modifier, tick.nowMs)
      ));
    });

    if (expiredNpModifiers.length > 0 && !npStillActive) {
      events.emit('np:ended', {
        atMs: tick.nowMs,
        endedAtMs: Math.max(...expiredNpModifiers.map((modifier) => modifier.endsAt ?? tick.nowMs)),
      });
    }
  });

  function release() {
    const snapshot = state.read();
    const status = getStatus(snapshot);
    if (!status.ready) {
      return { accepted: false, reason: 'np-not-ready', status };
    }

    const config = resolveConfig(snapshot);
    const startsAt = snapshot.time.simulationTimeMs;
    const endsAt = startsAt + config.durationMs;
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

    const payload = {
      atMs: startsAt,
      endsAt,
      durationMs: config.durationMs,
      maxPoints: config.maxPoints,
      modifier,
    };
    events.emit('np:released', payload);
    return { accepted: true, ...payload };
  }

  return {
    release,
    getStatus,
    getWindowStatus,
    getConfig(snapshot = state.read()) {
      return resolveConfig(snapshot);
    },
    isActive,
    isReady() {
      return getStatus().ready;
    },
    destroy() {
      offCut();
      offTick();
    },
  };
}

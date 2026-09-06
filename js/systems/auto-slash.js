export function createAutoSlashSystem({
  state,
  events,
  isEnabled = (snapshot) => (
    snapshot.master.commandSpells.autoSlash
    && !snapshot.hydra.defeated
    && snapshot.hydra.logicalHeadCount > 0n
  ),
  getAttacksPerSecond = (snapshot) => snapshot.berserker.baseAttacksPerSecond,
  getHeadsPerStrike = (snapshot) => snapshot.berserker.headsPerStrike,
} = {}) {
  if (!state || typeof state.read !== 'function') {
    throw new TypeError('Auto Slash requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('Auto Slash requires an event bus.');
  }

  let accumulator = 0;

  const unsubscribe = events.on('clock:tick', ({ payload: tick }) => {
    const snapshot = state.read();
    if (!isEnabled(snapshot)) {
      accumulator = 0;
      return;
    }

    const attacksPerSecond = getAttacksPerSecond(snapshot);
    if (!Number.isFinite(attacksPerSecond) || attacksPerSecond < 0) {
      throw new RangeError('Auto Slash attacksPerSecond must be a finite number >= 0.');
    }

    const headsPerStrike = getHeadsPerStrike(snapshot);
    if (typeof headsPerStrike !== 'bigint' || headsPerStrike < 1n) {
      throw new TypeError('Auto Slash headsPerStrike must be a positive BigInt.');
    }

    accumulator += attacksPerSecond * (tick.deltaMs / 1000);
    const strikeCount = Math.floor(accumulator);
    if (strikeCount < 1) return;

    accumulator -= strikeCount;

    events.emit('attack:requested', {
      source: 'auto',
      timestamp: tick.nowMs,
      strikeCount,
      headsPerStrike,
      target: null,
    });
  });

  return {
    getAccumulator() {
      return accumulator;
    },

    resetAccumulator() {
      accumulator = 0;
    },

    destroy() {
      unsubscribe();
    },
  };
}

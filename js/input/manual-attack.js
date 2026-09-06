export function createManualAttackInput({ state, events } = {}) {
  if (!state || typeof state.read !== 'function') {
    throw new TypeError('Manual attack input requires a state store.');
  }
  if (!events || typeof events.emit !== 'function') {
    throw new TypeError('Manual attack input requires an event bus.');
  }

  return {
    attack({ headsPerStrike = null, target = null } = {}) {
      const snapshot = state.read();
      const resolvedHeadsPerStrike = headsPerStrike ?? snapshot.berserker.headsPerStrike;

      if (typeof resolvedHeadsPerStrike !== 'bigint' || resolvedHeadsPerStrike < 1n) {
        throw new TypeError('headsPerStrike must be a positive BigInt.');
      }

      const request = {
        source: 'manual',
        timestamp: snapshot.time.simulationTimeMs,
        strikeCount: 1,
        headsPerStrike: resolvedHeadsPerStrike,
        target,
      };

      events.emit('attack:requested', request);
      return request;
    },
  };
}

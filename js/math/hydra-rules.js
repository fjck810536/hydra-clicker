function minBigInt(a, b) {
  return a < b ? a : b;
}

function assertHydraState(hydraState) {
  if (!hydraState || typeof hydraState !== 'object') {
    throw new TypeError('hydraState must be an object.');
  }

  if (typeof hydraState.logicalHeadCount !== 'bigint' || hydraState.logicalHeadCount < 0n) {
    throw new TypeError('hydraState.logicalHeadCount must be a non-negative BigInt.');
  }
}

function normalizeHeadsPerStrike(attack) {
  const value = attack?.headsPerStrike ?? 1n;
  if (typeof value !== 'bigint' || value < 1n) {
    throw new TypeError('attack.headsPerStrike must be a positive BigInt.');
  }
  return value;
}

export function createHydraIRule({ regenDelayMs = 1500 } = {}) {
  if (!Number.isFinite(regenDelayMs) || regenDelayMs < 0) {
    throw new RangeError('regenDelayMs must be a finite number >= 0.');
  }

  return Object.freeze({
    id: 'hydra-i-regeneration',
    generation: 1,
    regenDelayMs,

    resolveCut({ hydraState, attack = {}, turn = 0n, nowMs = 0 } = {}) {
      assertHydraState(hydraState);

      if (typeof turn !== 'bigint' || turn < 0n) {
        throw new TypeError('turn must be a non-negative BigInt.');
      }

      if (!Number.isFinite(nowMs) || nowMs < 0) {
        throw new RangeError('nowMs must be a finite number >= 0.');
      }

      const headsPerStrike = normalizeHeadsPerStrike(attack);
      const removable = minBigInt(headsPerStrike, hydraState.logicalHeadCount);

      if (removable === 0n) {
        return {
          accepted: false,
          ruleId: this.id,
          turnBefore: turn,
          turnAfter: turn,
          headsRemoved: 0n,
          headsSpawned: 0n,
          materialsProduced: 0n,
          regrowth: [],
          killed: true,
          effects: [],
        };
      }

      const remaining = hydraState.logicalHeadCount - removable;

      return {
        accepted: true,
        ruleId: this.id,
        turnBefore: turn,
        turnAfter: turn + 1n,
        headsRemoved: removable,
        headsSpawned: 0n,
        materialsProduced: 0n,
        regrowth: [
          {
            executeAt: nowMs + regenDelayMs,
            amount: removable,
            ruleId: 'regen-same-head',
            payload: { branchId: null },
          },
        ],
        killed: remaining === 0n,
        effects: ['slash-hit'],
      };
    },
  });
}

export const HydraRules = Object.freeze({
  I: createHydraIRule(),
});

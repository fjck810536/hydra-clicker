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

function rejectedAtZero(ruleId, turn) {
  return {
    accepted: false,
    ruleId,
    turnBefore: turn,
    turnAfter: turn,
    headsRemoved: 0n,
    headsSpawned: 0n,
    materialsProduced: 0n,
    regrowth: [],
    cancelPendingRegrowth: false,
    depleted: true,
    killed: false,
    effects: [],
  };
}

export function createHydraIRule({ regenDelayMs = 1500 } = {}) {
  if (!Number.isFinite(regenDelayMs) || regenDelayMs < 0) {
    throw new RangeError('regenDelayMs must be a finite number >= 0.');
  }

  return Object.freeze({
    id: 'hydra-i-regeneration',
    generation: 1,
    regenDelayMs,

    resolveCut({ hydraState, attack = {}, turn = 0n, nowMs = 0, ruleContext = {} } = {}) {
      assertHydraState(hydraState);

      if (typeof turn !== 'bigint' || turn < 0n) {
        throw new TypeError('turn must be a non-negative BigInt.');
      }

      if (!Number.isFinite(nowMs) || nowMs < 0) {
        throw new RangeError('nowMs must be a finite number >= 0.');
      }

      const headsPerStrike = normalizeHeadsPerStrike(attack);
      const removable = minBigInt(headsPerStrike, hydraState.logicalHeadCount);
      const regrowthEnabled = ruleContext.regrowthEnabled !== false;
      const effectiveRegenDelayMs = ruleContext.regrowthDelayMs ?? regenDelayMs;

      if (!Number.isFinite(effectiveRegenDelayMs) || effectiveRegenDelayMs < 0) {
        throw new RangeError('ruleContext.regrowthDelayMs must be a finite number >= 0.');
      }

      if (removable === 0n) {
        return rejectedAtZero(this.id, turn);
      }

      const remaining = hydraState.logicalHeadCount - removable;

      // Playtest 2 experiment: Hydra I treats reaching zero heads as terminal death.
      // depleted/killed remain distinct concepts for later Hydra generations.
      const killed = remaining === 0n;

      return {
        accepted: true,
        ruleId: this.id,
        turnBefore: turn,
        turnAfter: turn + 1n,
        headsRemoved: removable,
        headsSpawned: 0n,
        materialsProduced: 0n,
        regrowth: regrowthEnabled && !killed
          ? [
              {
                executeAt: nowMs + effectiveRegenDelayMs,
                amount: removable,
                ruleId: 'regen-same-head',
                payload: { branchId: null },
              },
            ]
          : [],
        cancelPendingRegrowth: killed,
        depleted: killed,
        killed,
        effects: ['slash-hit'],
      };
    },
  });
}

export function createHydraIIRule() {
  return Object.freeze({
    id: 'hydra-ii-cut-one-grow-two',
    generation: 2,

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
        return rejectedAtZero(this.id, turn);
      }

      // Hydra II's reveal is structural and immediate: each removed head produces
      // two new heads in the same resolution. This is not Hydra I delayed regrowth,
      // so the current hydra.regrowth suppression modifier does not disable it.
      const spawned = removable * 2n;

      return {
        accepted: true,
        ruleId: this.id,
        turnBefore: turn,
        turnAfter: turn + 1n,
        headsRemoved: removable,
        headsSpawned: spawned,
        materialsProduced: 0n,
        regrowth: [],
        cancelPendingRegrowth: false,
        depleted: false,
        killed: false,
        effects: ['slash-hit', 'hydra-grow-two'],
      };
    },
  });
}

export const HydraRules = Object.freeze({
  I: createHydraIRule(),
  II: createHydraIIRule(),
});

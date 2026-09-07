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

function rejected(ruleId, turn, { depleted = false, reason = null } = {}) {
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
    depleted,
    killed: false,
    effects: reason ? [reason] : [],
  };
}

function rejectedAtZero(ruleId, turn) {
  return rejected(ruleId, turn, { depleted: true });
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
      const headGrowthEnabled = ruleContext.headGrowthEnabled !== false;
      const effectiveRegenDelayMs = ruleContext.regrowthDelayMs ?? regenDelayMs;

      if (!Number.isFinite(effectiveRegenDelayMs) || effectiveRegenDelayMs < 0) {
        throw new RangeError('ruleContext.regrowthDelayMs must be a finite number >= 0.');
      }

      if (removable === 0n) {
        return rejectedAtZero(this.id, turn);
      }

      const remaining = hydraState.logicalHeadCount - removable;
      const killed = remaining === 0n;

      return {
        accepted: true,
        ruleId: this.id,
        turnBefore: turn,
        turnAfter: turn + 1n,
        headsRemoved: removable,
        headsSpawned: 0n,
        materialsProduced: 0n,
        regrowth: headGrowthEnabled && !killed
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

function createCutOneGrowTwoRule({ generation, maxHeadCount, id } = {}) {
  if (!Number.isInteger(generation) || generation < 2) {
    throw new TypeError('generation must be an integer >= 2.');
  }
  if (typeof maxHeadCount !== 'bigint' || maxHeadCount < 1n) {
    throw new TypeError('maxHeadCount must be a positive BigInt.');
  }
  if (typeof id !== 'string' || id.length < 1) {
    throw new TypeError('id must be a non-empty string.');
  }

  return Object.freeze({
    id,
    generation,
    maxHeadCount,

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
      if (removable === 0n) {
        return rejectedAtZero(this.id, turn);
      }

      const remaining = hydraState.logicalHeadCount - removable;
      const headGrowthEnabled = ruleContext.headGrowthEnabled !== false;
      let spawned = 0n;

      if (headGrowthEnabled) {
        const desiredSpawn = removable * 2n;
        const availableCapacity = maxHeadCount > remaining
          ? maxHeadCount - remaining
          : 0n;
        spawned = minBigInt(desiredSpawn, availableCapacity);
      }

      const killed = remaining === 0n && spawned === 0n;
      const effects = ['slash-hit'];
      if (spawned > 0n) effects.push('hydra-grow-two');

      return {
        accepted: true,
        ruleId: this.id,
        turnBefore: turn,
        turnAfter: turn + 1n,
        headsRemoved: removable,
        headsSpawned: spawned,
        materialsProduced: 0n,
        regrowth: [],
        cancelPendingRegrowth: killed,
        depleted: killed,
        killed,
        effects,
      };
    },
  });
}

export function createHydraIIRule({ maxHeadCount = 81n } = {}) {
  return createCutOneGrowTwoRule({
    generation: 2,
    maxHeadCount,
    id: 'hydra-ii-cut-one-grow-two',
  });
}

export function createHydraIIIRule({ maxHeadCount = 729n } = {}) {
  return createCutOneGrowTwoRule({
    generation: 3,
    maxHeadCount,
    id: 'hydra-iii-cut-one-grow-two',
  });
}

export function createHydraShellRule({ generation, maxHeadCount } = {}) {
  if (!Number.isInteger(generation) || generation < 1) {
    throw new TypeError('generation must be a positive integer.');
  }
  if (typeof maxHeadCount !== 'bigint' || maxHeadCount < 1n) {
    throw new TypeError('maxHeadCount must be a positive BigInt.');
  }

  const id = `hydra-${generation}-shell`;
  return Object.freeze({
    id,
    generation,
    maxHeadCount,
    resolveCut({ hydraState, turn = 0n, nowMs = 0 } = {}) {
      assertHydraState(hydraState);
      if (typeof turn !== 'bigint' || turn < 0n) {
        throw new TypeError('turn must be a non-negative BigInt.');
      }
      if (!Number.isFinite(nowMs) || nowMs < 0) {
        throw new RangeError('nowMs must be a finite number >= 0.');
      }
      return rejected(id, turn, { reason: 'generation-rule-not-implemented' });
    },
  });
}

export const HydraRules = Object.freeze({
  I: createHydraIRule(),
  II: createHydraIIRule(),
  III: createHydraIIIRule(),
});

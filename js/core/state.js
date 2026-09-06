const INITIAL_HEADS = 9n;

function clone(value) {
  return structuredClone(value);
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;

  Object.freeze(value);
  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }
  return value;
}

export function createInitialState() {
  return {
    schemaVersion: 1,

    time: {
      simulationTimeMs: 0,
      tick: 0,
      paused: false,
    },

    hydra: {
      generation: 1,
      logicalHeadCount: INITIAL_HEADS,
      startingHeadCount: INITIAL_HEADS,
      turn: 0n,
      pendingRegrowth: [],
    },

    berserker: {
      baseAttacksPerSecond: 1,
      headsPerStrike: 1n,
      rage: 0,
      np: 0,
    },

    master: {
      humanityEvil: 0n,
      commandSpells: {
        autoSlash: false,
        autoNp: false,
        treeTargeting: false,
      },
    },

    progression: {
      hydraGeneration: 1,
      analyzerLevel: 0,
      treeViewUnlocked: false,
      milestones: [],
    },

    statistics: {
      totalHeadsCut: 0n,
      totalHydrasKilled: 0n,
      totalNpReleases: 0n,
      lifetimeMaterials: 0n,
    },

    modifiers: {
      active: [],
    },
  };
}

export class GameStateStore {
  #state;

  constructor(initialState = createInitialState()) {
    this.#state = clone(initialState);
    this.#validate(this.#state);
  }

  read() {
    return deepFreeze(clone(this.#state));
  }

  update(mutator) {
    if (typeof mutator !== 'function') {
      throw new TypeError('GameStateStore.update expects a function.');
    }

    const draft = clone(this.#state);
    mutator(draft);
    this.#validate(draft);
    this.#state = draft;
    return this.read();
  }

  replace(nextState) {
    const candidate = clone(nextState);
    this.#validate(candidate);
    this.#state = candidate;
    return this.read();
  }

  createSnapshot() {
    return this.read();
  }

  #validate(state) {
    if (!state || typeof state !== 'object') throw new TypeError('State must be an object.');
    if (state.schemaVersion !== 1) throw new Error('Unsupported state schemaVersion.');

    if (!Number.isFinite(state.time.simulationTimeMs) || state.time.simulationTimeMs < 0) {
      throw new RangeError('simulationTimeMs must be a finite number >= 0.');
    }

    if (!Number.isInteger(state.time.tick) || state.time.tick < 0) {
      throw new RangeError('time.tick must be an integer >= 0.');
    }

    if (typeof state.hydra.logicalHeadCount !== 'bigint' || state.hydra.logicalHeadCount < 0n) {
      throw new TypeError('hydra.logicalHeadCount must be a non-negative BigInt.');
    }

    if (typeof state.hydra.turn !== 'bigint' || state.hydra.turn < 0n) {
      throw new TypeError('hydra.turn must be a non-negative BigInt.');
    }

    if (!Array.isArray(state.hydra.pendingRegrowth)) {
      throw new TypeError('hydra.pendingRegrowth must be an array.');
    }

    for (const event of state.hydra.pendingRegrowth) {
      if (!event || event.type !== 'hydra-regrow') {
        throw new TypeError('Every pending regrowth event must be type hydra-regrow.');
      }
      if (!Number.isFinite(event.executeAt) || event.executeAt < 0) {
        throw new RangeError('regrowth executeAt must be a finite number >= 0.');
      }
      if (typeof event.amount !== 'bigint' || event.amount < 1n) {
        throw new TypeError('regrowth amount must be a positive BigInt.');
      }
    }

    if (typeof state.berserker.headsPerStrike !== 'bigint' || state.berserker.headsPerStrike < 1n) {
      throw new TypeError('berserker.headsPerStrike must be a positive BigInt.');
    }

    if (!Number.isFinite(state.berserker.baseAttacksPerSecond) || state.berserker.baseAttacksPerSecond < 0) {
      throw new RangeError('baseAttacksPerSecond must be a finite number >= 0.');
    }

    if (typeof state.master.humanityEvil !== 'bigint' || state.master.humanityEvil < 0n) {
      throw new TypeError('master.humanityEvil must be a non-negative BigInt.');
    }
  }
}

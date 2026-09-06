import { GameClock } from './clock.js';
import { EventBus } from './event-bus.js';
import { GameStateStore, createInitialState } from './state.js';
import { createHydraIRule } from '../math/hydra-rules.js';
import { createHydraRegrowthSystem } from '../systems/hydra-regrowth.js';
import { createCombatSystem } from '../systems/combat.js';
import { createAutoSlashSystem } from '../systems/auto-slash.js';
import { createManualAttackInput } from '../input/manual-attack.js';

export function createCoreRuntime({
  fixedStepMs = 100,
  initialState = createInitialState(),
} = {}) {
  const events = new EventBus();
  const state = new GameStateStore(initialState);
  const clock = new GameClock({ fixedStepMs });

  const unsubscribeClock = clock.onTick((tick) => {
    state.update((draft) => {
      draft.time.simulationTimeMs = tick.nowMs;
      draft.time.tick = tick.tick;
    });

    events.emit('clock:tick', tick);
  });

  return {
    clock,
    events,
    state,

    start() {
      clock.start();
    },

    stop() {
      clock.stop();
    },

    advance(ms) {
      return clock.advance(ms);
    },

    snapshot() {
      return state.createSnapshot();
    },

    destroy() {
      clock.stop();
      unsubscribeClock();
      events.clear();
    },
  };
}

export function createHydraIGameRuntime({
  fixedStepMs = 100,
  regenDelayMs = 1500,
  initialState = createInitialState(),
} = {}) {
  const core = createCoreRuntime({ fixedStepMs, initialState });
  const rule = createHydraIRule({ regenDelayMs });

  const regrowth = createHydraRegrowthSystem(core);
  const combat = createCombatSystem({
    ...core,
    getRule: () => rule,
  });
  const autoSlash = createAutoSlashSystem(core);
  const manual = createManualAttackInput(core);

  return {
    ...core,
    rule,
    manualAttack(options) {
      return manual.attack(options);
    },
    systems: Object.freeze({
      regrowth,
      combat,
      autoSlash,
    }),
    destroy() {
      autoSlash.destroy();
      combat.destroy();
      regrowth.destroy();
      core.destroy();
    },
  };
}

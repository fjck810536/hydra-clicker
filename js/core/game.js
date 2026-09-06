import { GameClock } from './clock.js';
import { EventBus } from './event-bus.js';
import { GameStateStore, createInitialState } from './state.js';
import { createHydraIRule } from '../math/hydra-rules.js';
import { createHydraRegrowthSystem } from '../systems/hydra-regrowth.js';
import { createCombatSystem } from '../systems/combat.js';
import { createAutoSlashSystem } from '../systems/auto-slash.js';
import { createNpSystem } from '../systems/np.js';
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
  npGainPerHead = 0.125,
  npDurationMs = 3000,
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
  const np = createNpSystem({
    ...core,
    gainPerHead: npGainPerHead,
    durationMs: npDurationMs,
  });
  const manual = createManualAttackInput(core);

  return {
    ...core,
    rule,
    manualAttack(options) {
      return manual.attack(options);
    },
    releaseNp() {
      return np.release();
    },
    systems: Object.freeze({
      regrowth,
      combat,
      autoSlash,
      np,
    }),
    destroy() {
      np.destroy();
      autoSlash.destroy();
      combat.destroy();
      regrowth.destroy();
      core.destroy();
    },
  };
}

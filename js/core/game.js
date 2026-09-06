import { GameClock } from './clock.js';
import { EventBus } from './event-bus.js';
import { GameStateStore, createInitialState } from './state.js';

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

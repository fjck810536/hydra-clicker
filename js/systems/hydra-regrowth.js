import { processDueRegrowth } from '../math/hydra-model.js';

export function createHydraRegrowthSystem({ state, events } = {}) {
  if (!state || typeof state.update !== 'function') {
    throw new TypeError('Hydra regrowth system requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('Hydra regrowth system requires an event bus.');
  }

  const unsubscribe = events.on('clock:tick', (tick) => {
    let result = null;

    state.update((draft) => {
      result = processDueRegrowth(draft, tick.nowMs);
    });

    if (result.headsRegrown > 0n) {
      events.emit('head:regrow', {
        atMs: tick.nowMs,
        amount: result.headsRegrown,
        events: result.events,
      });
    }
  });

  return {
    destroy() {
      unsubscribe();
    },
  };
}

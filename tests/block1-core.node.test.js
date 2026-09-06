import test from 'node:test';
import assert from 'node:assert/strict';

import { EventBus } from '../js/core/event-bus.js';
import { GameClock } from '../js/core/clock.js';
import { GameStateStore, createInitialState } from '../js/core/state.js';
import { createCoreRuntime } from '../js/core/game.js';

test('initial state uses integer logical counts', () => {
  const state = createInitialState();
  assert.equal(state.hydra.logicalHeadCount, 9n);
  assert.equal(state.master.humanityEvil, 0n);
  assert.equal(state.statistics.totalHeadsCut, 0n);
});

test('fixed-step clock is independent from frame-sized advances', () => {
  const clock = new GameClock({ fixedStepMs: 100 });
  let ticks = 0;
  clock.onTick(() => { ticks += 1; });

  const first = clock.advance(250);
  assert.equal(first.steps, 2);
  assert.equal(clock.simulationTimeMs, 200);
  assert.equal(ticks, 2);

  const second = clock.advance(50);
  assert.equal(second.steps, 1);
  assert.equal(clock.simulationTimeMs, 300);
  assert.equal(ticks, 3);
});

test('core runtime synchronizes clock into logical state', () => {
  const runtime = createCoreRuntime({ fixedStepMs: 100 });
  runtime.advance(350);
  const snapshot = runtime.snapshot();

  assert.equal(snapshot.time.simulationTimeMs, 300);
  assert.equal(snapshot.time.tick, 3);
  runtime.destroy();
});

test('state snapshots cannot mutate stored state', () => {
  const store = new GameStateStore();
  const snapshot = store.read();

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.hydra), true);
  assert.throws(() => {
    snapshot.hydra.logicalHeadCount = 123n;
  }, TypeError);
  assert.equal(store.read().hydra.logicalHeadCount, 9n);
});

test('state rejects floating-point head counts', () => {
  const store = new GameStateStore();

  assert.throws(() => {
    store.update((draft) => {
      draft.hydra.logicalHeadCount = 8.5;
    });
  });

  assert.equal(store.read().hydra.logicalHeadCount, 9n);
});

test('event bus can subscribe, unsubscribe and once()', () => {
  const events = new EventBus();
  let normal = 0;
  let once = 0;

  const unsubscribe = events.on('head:cut', () => { normal += 1; });
  events.once('head:cut', () => { once += 1; });

  events.emit('head:cut');
  events.emit('head:cut');
  unsubscribe();
  events.emit('head:cut');

  assert.equal(normal, 2);
  assert.equal(once, 1);
});

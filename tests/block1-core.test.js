import { EventBus } from '../js/core/event-bus.js';
import { GameClock } from '../js/core/clock.js';
import { GameStateStore, createInitialState } from '../js/core/state.js';
import { createCoreRuntime } from '../js/core/game.js';

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error });
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message = '') {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message} expected ${String(expected)}, got ${String(actual)}`.trim());
  }
}

test('initial state uses integer logical counts', () => {
  const state = createInitialState();
  assertEqual(state.hydra.logicalHeadCount, 9n);
  assertEqual(state.master.humanityEvil, 0n);
  assertEqual(state.statistics.totalHeadsCut, 0n);
});

test('fixed-step clock is independent from frame-sized advances', () => {
  const clock = new GameClock({ fixedStepMs: 100 });
  let ticks = 0;
  clock.onTick(() => { ticks += 1; });

  const first = clock.advance(250);
  assertEqual(first.steps, 2);
  assertEqual(clock.simulationTimeMs, 200);
  assertEqual(ticks, 2);

  const second = clock.advance(50);
  assertEqual(second.steps, 1);
  assertEqual(clock.simulationTimeMs, 300);
  assertEqual(ticks, 3);
});

test('core runtime synchronizes clock into logical state', () => {
  const runtime = createCoreRuntime({ fixedStepMs: 100 });
  runtime.advance(350);
  const snapshot = runtime.snapshot();

  assertEqual(snapshot.time.simulationTimeMs, 300);
  assertEqual(snapshot.time.tick, 3);
  runtime.destroy();
});

test('state snapshots cannot mutate stored state', () => {
  const store = new GameStateStore();
  const snapshot = store.read();

  assert(Object.isFrozen(snapshot));
  assert(Object.isFrozen(snapshot.hydra));

  let mutationFailed = false;
  try {
    snapshot.hydra.logicalHeadCount = 123n;
  } catch {
    mutationFailed = true;
  }

  assert(mutationFailed || snapshot.hydra.logicalHeadCount === 9n);
  assertEqual(store.read().hydra.logicalHeadCount, 9n);
});

test('state rejects floating-point head counts', () => {
  const store = new GameStateStore();
  let threw = false;

  try {
    store.update((draft) => {
      draft.hydra.logicalHeadCount = 8.5;
    });
  } catch {
    threw = true;
  }

  assert(threw, 'logicalHeadCount must reject Number/floats');
  assertEqual(store.read().hydra.logicalHeadCount, 9n);
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

  assertEqual(normal, 2);
  assertEqual(once, 1);
});

const summary = {
  passed: results.filter((result) => result.ok).length,
  failed: results.filter((result) => !result.ok).length,
  total: results.length,
  results,
};

window.__HYDRA_BLOCK1_TESTS__ = summary;
window.dispatchEvent(new CustomEvent('hydra-tests:complete', { detail: summary }));

console.table(results.map(({ name, ok, error }) => ({
  test: name,
  result: ok ? 'PASS' : 'FAIL',
  error: error?.message ?? '',
})));

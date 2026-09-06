import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from '../js/core/state.js';
import { createHydraIGameRuntime } from '../js/core/game.js';
import {
  DEFAULT_SAVE_KEY,
  createSaveStore,
  deserializeGameSave,
  serializeGameSave,
} from '../js/core/save.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('save serialization round-trips BigInt logical state without View objects', () => {
  const state = createInitialState();
  state.hydra.logicalHeadCount = 123456789012345678901234567890n;
  state.hydra.encounter = 42n;
  state.master.humanityEvil = 999n;
  state.master.commandSpells.autoSlash = true;
  state.statistics.totalHeadsCut = 777n;
  state.statistics.totalHydrasKilled = 9n;
  state.hydra.pendingRegrowth.push({
    id: 'regrow-test',
    type: 'hydra-regrow',
    executeAt: 1500,
    amount: 3n,
    payload: { branchId: null, ruleId: 'regen-same-head' },
  });

  const serialized = serializeGameSave(state, { savedAtEpochMs: 123456 });
  const restored = deserializeGameSave(serialized);

  assert.equal(restored.savedAtEpochMs, 123456);
  assert.equal(restored.state.hydra.logicalHeadCount, 123456789012345678901234567890n);
  assert.equal(restored.state.hydra.encounter, 42n);
  assert.equal(restored.state.master.humanityEvil, 999n);
  assert.equal(restored.state.master.commandSpells.autoSlash, true);
  assert.equal(restored.state.statistics.totalHeadsCut, 777n);
  assert.equal(restored.state.statistics.totalHydrasKilled, 9n);
  assert.equal(restored.state.hydra.pendingRegrowth[0].amount, 3n);
  assert.equal(serialized.includes('BABYLON'), false);
  assert.equal(serialized.includes('mesh'), false);
});

test('save store uses a versioned local-storage key and can clear saves', () => {
  const storage = createMemoryStorage();
  const store = createSaveStore({ storage, now: () => 555 });
  const state = createInitialState();
  state.master.humanityEvil = 11n;

  store.save(state);
  assert.equal(store.key, DEFAULT_SAVE_KEY);
  assert.equal(store.load().savedAtEpochMs, 555);
  assert.equal(store.load().state.master.humanityEvil, 11n);

  store.clear();
  assert.equal(store.load(), null);
});

test('restored runtime resumes simulation time so pending regrowth keeps its remaining delay', () => {
  const firstRuntime = createHydraIGameRuntime();
  firstRuntime.manualAttack();
  firstRuntime.advance(700);

  const saved = deserializeGameSave(serializeGameSave(firstRuntime.snapshot(), {
    savedAtEpochMs: 1000,
  }));
  firstRuntime.destroy();

  const restoredRuntime = createHydraIGameRuntime({ initialState: saved.state });

  assert.equal(restoredRuntime.clock.simulationTimeMs, 700);
  assert.equal(restoredRuntime.snapshot().time.simulationTimeMs, 700);
  assert.equal(restoredRuntime.snapshot().hydra.logicalHeadCount, 8n);

  restoredRuntime.advance(700);
  assert.equal(restoredRuntime.snapshot().hydra.logicalHeadCount, 8n);

  restoredRuntime.advance(100);
  assert.equal(restoredRuntime.snapshot().time.simulationTimeMs, 1500);
  assert.equal(restoredRuntime.snapshot().hydra.logicalHeadCount, 9n);

  restoredRuntime.destroy();
});

test('real-world time away does not create offline progress in Block 9', () => {
  const runtime = createHydraIGameRuntime();
  runtime.manualAttack();
  runtime.advance(500);

  const save = deserializeGameSave(serializeGameSave(runtime.snapshot(), {
    savedAtEpochMs: 1000,
  }));
  runtime.destroy();

  // Pretend the page was closed for many hours. The saved simulation time stays authoritative.
  const reopenedAtEpochMs = 1000 + 8 * 60 * 60 * 1000;
  assert.ok(reopenedAtEpochMs > save.savedAtEpochMs);

  const restoredRuntime = createHydraIGameRuntime({ initialState: save.state });
  assert.equal(restoredRuntime.snapshot().time.simulationTimeMs, 500);
  assert.equal(restoredRuntime.snapshot().hydra.logicalHeadCount, 8n);

  restoredRuntime.destroy();
});

test('corrupt and unsupported saves are rejected rather than partially applied', () => {
  assert.throws(() => deserializeGameSave('{not-json'));
  assert.throws(() => deserializeGameSave(JSON.stringify({
    formatVersion: 999,
    savedAtEpochMs: 0,
    state: {},
  })), /Unsupported save formatVersion/);
});

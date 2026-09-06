import test from 'node:test';
import assert from 'node:assert/strict';

import { GameStateStore, createInitialState } from '../js/core/state.js';
import { createHydraIRule } from '../js/math/hydra-rules.js';
import { resolveCut } from '../js/math/cut-resolver.js';
import { applyCutResolution, processDueRegrowth } from '../js/math/hydra-model.js';

function cutOnce({ state, rule, headsPerStrike = 1n, nowMs = 0 }) {
  const snapshot = state.read();
  const resolution = resolveCut({
    rule,
    hydraState: snapshot.hydra,
    attack: { headsPerStrike },
    turn: snapshot.hydra.turn,
    nowMs,
  });

  state.update((draft) => {
    applyCutResolution(draft, resolution);
  });

  return resolution;
}

test('Hydra I: 9 -> cut -> 8 and schedules one-head regrowth', () => {
  const state = new GameStateStore(createInitialState());
  const rule = createHydraIRule({ regenDelayMs: 1500 });

  const resolution = cutOnce({ state, rule, nowMs: 0 });
  const snapshot = state.read();

  assert.equal(resolution.accepted, true);
  assert.equal(resolution.headsRemoved, 1n);
  assert.equal(snapshot.hydra.logicalHeadCount, 8n);
  assert.equal(snapshot.hydra.turn, 1n);
  assert.equal(snapshot.hydra.pendingRegrowth.length, 1);
  assert.equal(snapshot.hydra.pendingRegrowth[0].executeAt, 1500);
  assert.equal(snapshot.statistics.totalHeadsCut, 1n);
});

test('Hydra I: regrowth does not happen early and restores the same head at deadline', () => {
  const state = new GameStateStore(createInitialState());
  const rule = createHydraIRule({ regenDelayMs: 1500 });

  cutOnce({ state, rule, nowMs: 0 });

  state.update((draft) => {
    const result = processDueRegrowth(draft, 1499);
    assert.equal(result.processed, 0);
  });
  assert.equal(state.read().hydra.logicalHeadCount, 8n);

  state.update((draft) => {
    const result = processDueRegrowth(draft, 1500);
    assert.equal(result.processed, 1);
    assert.equal(result.headsRegrown, 1n);
  });

  const snapshot = state.read();
  assert.equal(snapshot.hydra.logicalHeadCount, 9n);
  assert.equal(snapshot.hydra.pendingRegrowth.length, 0);
});

test('Hydra I: reaching zero heads is depleted, not killed, while regrowth is pending', () => {
  const state = new GameStateStore(createInitialState());
  const rule = createHydraIRule({ regenDelayMs: 1500 });

  const resolution = cutOnce({ state, rule, headsPerStrike: 9n, nowMs: 0 });

  assert.equal(resolution.depleted, true);
  assert.equal(resolution.killed, false);
  assert.equal(state.read().hydra.logicalHeadCount, 0n);
  assert.equal(state.read().hydra.pendingRegrowth[0].amount, 9n);

  state.update((draft) => processDueRegrowth(draft, 1500));
  assert.equal(state.read().hydra.logicalHeadCount, 9n);
});

test('Hydra I: cutting while already depleted is rejected and creates no extra regrowth', () => {
  const initial = createInitialState();
  initial.hydra.logicalHeadCount = 0n;
  const state = new GameStateStore(initial);
  const rule = createHydraIRule({ regenDelayMs: 1500 });

  const snapshot = state.read();
  const resolution = resolveCut({
    rule,
    hydraState: snapshot.hydra,
    attack: { headsPerStrike: 1n },
    turn: snapshot.hydra.turn,
    nowMs: 0,
  });

  assert.equal(resolution.accepted, false);
  assert.equal(resolution.depleted, true);
  assert.equal(resolution.killed, false);
  assert.deepEqual(resolution.regrowth, []);
});

test('Hydra I rule is pure: resolving a cut does not mutate the supplied state', () => {
  const initial = createInitialState();
  const hydraBefore = structuredClone(initial.hydra);
  const rule = createHydraIRule({ regenDelayMs: 500 });

  resolveCut({
    rule,
    hydraState: initial.hydra,
    attack: { headsPerStrike: 3n },
    turn: initial.hydra.turn,
    nowMs: 100,
  });

  assert.deepEqual(initial.hydra, hydraBefore);
});

test('Hydra I: overlapping regrowth events restore only what each cut removed', () => {
  const state = new GameStateStore(createInitialState());
  const rule = createHydraIRule({ regenDelayMs: 1500 });

  cutOnce({ state, rule, nowMs: 0 });
  cutOnce({ state, rule, nowMs: 100 });
  assert.equal(state.read().hydra.logicalHeadCount, 7n);
  assert.equal(state.read().hydra.pendingRegrowth.length, 2);

  state.update((draft) => processDueRegrowth(draft, 1500));
  assert.equal(state.read().hydra.logicalHeadCount, 8n);
  assert.equal(state.read().hydra.pendingRegrowth.length, 1);

  state.update((draft) => processDueRegrowth(draft, 1600));
  assert.equal(state.read().hydra.logicalHeadCount, 9n);
  assert.equal(state.read().hydra.pendingRegrowth.length, 0);
});

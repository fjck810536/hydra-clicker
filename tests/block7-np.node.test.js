import test from 'node:test';
import assert from 'node:assert/strict';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { createInitialState } from '../js/core/state.js';

function cutHeadsAcrossEncounters(runtime, count) {
  for (let i = 0; i < count; i += 1) {
    if (runtime.snapshot().hydra.defeated) runtime.advance(300);
    runtime.manualAttack();
  }
}

test('NP cannot release before the 66-point gauge is full', () => {
  const runtime = createHydraIGameRuntime();

  const result = runtime.releaseNp();
  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'np-not-ready');
  assert.equal(result.status.points, 0);
  assert.equal(result.status.maxPoints, 66);
  assert.equal(runtime.snapshot().statistics.totalNpReleases, 0n);

  runtime.destroy();
});

test('each accepted head cut gives +1 NP and 66 heads fill the gauge', () => {
  const runtime = createHydraIGameRuntime({ regenDelayMs: 10000 });

  cutHeadsAcrossEncounters(runtime, 65);
  assert.deepEqual(runtime.npStatus(), {
    points: 65,
    maxPoints: 66,
    ready: false,
    normalized: 65 / 66,
  });

  cutHeadsAcrossEncounters(runtime, 1);
  const status = runtime.npStatus();
  assert.equal(status.points, 66);
  assert.equal(status.maxPoints, 66);
  assert.equal(status.ready, true);
  assert.equal(runtime.snapshot().berserker.np, 1);

  runtime.destroy();
});

test('old normalized NP save values map proportionally onto the 66-point gauge', () => {
  const initialState = createInitialState();
  initialState.berserker.np = 0.5;
  const runtime = createHydraIGameRuntime({ initialState });

  const status = runtime.npStatus();
  assert.equal(status.points, 33);
  assert.equal(status.maxPoints, 66);
  assert.equal(status.ready, false);

  runtime.destroy();
});

test('NP pauses already scheduled regrowth until the window ends', () => {
  const runtime = createHydraIGameRuntime({
    regenDelayMs: 500,
    npDurationMs: 1000,
  });

  runtime.manualAttack();
  runtime.state.update((draft) => {
    draft.berserker.np = 1;
  });
  const release = runtime.releaseNp();
  assert.equal(release.accepted, true);

  runtime.advance(600);
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 8n);
  assert.equal(runtime.snapshot().hydra.pendingRegrowth.length, 1);

  runtime.advance(400);
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 9n);
  assert.equal(runtime.snapshot().hydra.pendingRegrowth.length, 0);

  runtime.destroy();
});

test('NP window suppresses new regrowth while Hydra I itself owns terminal death', () => {
  const runtime = createHydraIGameRuntime({
    regenDelayMs: 10000,
    npDurationMs: 3000,
  });
  const kills = [];
  const offKilled = runtime.events.on('hydra:killed', ({ payload }) => kills.push(payload));

  runtime.state.update((draft) => {
    draft.berserker.np = 1;
  });
  const release = runtime.releaseNp();
  assert.equal(release.accepted, true);
  assert.equal(release.modifier.scope, 'timed');

  for (let i = 0; i < 9; i += 1) runtime.manualAttack();
  const snapshot = runtime.snapshot();

  assert.equal(snapshot.hydra.logicalHeadCount, 0n);
  assert.equal(snapshot.hydra.pendingRegrowth.length, 0);
  assert.equal(snapshot.statistics.totalHydrasKilled, 1n);
  assert.equal(kills.length, 1);
  assert.equal(runtime.npStatus().points, 9);

  offKilled();
  runtime.destroy();
});

test('one NP window survives respawns and can cover multiple Hydra kills', () => {
  const runtime = createHydraIGameRuntime({
    regenDelayMs: 10000,
    npDurationMs: 3000,
  });

  runtime.state.update((draft) => {
    draft.berserker.np = 1;
  });
  const release = runtime.releaseNp();
  assert.equal(release.accepted, true);
  assert.equal(release.modifier.scope, 'timed');

  for (let i = 0; i < 9; i += 1) runtime.manualAttack();
  assert.equal(runtime.snapshot().statistics.totalHydrasKilled, 1n);

  runtime.advance(100);
  assert.equal(runtime.snapshot().hydra.encounter, 2n);
  assert.equal(runtime.snapshot().modifiers.active.length, 1);

  for (let i = 0; i < 9; i += 1) runtime.manualAttack();
  assert.equal(runtime.snapshot().statistics.totalHydrasKilled, 2n);

  runtime.advance(100);
  let snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.encounter, 3n);
  assert.equal(snapshot.modifiers.active.length, 1);

  runtime.manualAttack();
  snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.logicalHeadCount, 8n);
  assert.equal(snapshot.hydra.pendingRegrowth.length, 0);

  runtime.advance(1000);
  runtime.advance(1000);
  runtime.advance(800);
  assert.equal(runtime.snapshot().modifiers.active.length, 0);

  runtime.destroy();
});

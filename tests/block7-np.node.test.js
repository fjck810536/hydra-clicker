import test from 'node:test';
import assert from 'node:assert/strict';

import { createHydraIGameRuntime } from '../js/core/game.js';

test('NP cannot release before charge reaches 100%', () => {
  const runtime = createHydraIGameRuntime();

  const result = runtime.releaseNp();
  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'np-not-ready');
  assert.equal(runtime.snapshot().statistics.totalNpReleases, 0n);

  runtime.destroy();
});

test('accepted cuts charge NP and eight heads fill the prototype gauge', () => {
  const runtime = createHydraIGameRuntime({ regenDelayMs: 10000 });

  for (let i = 0; i < 8; i += 1) runtime.manualAttack();

  const snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.logicalHeadCount, 1n);
  assert.equal(snapshot.berserker.np, 1);
  assert.equal(snapshot.hydra.pendingRegrowth.length, 8);

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

  for (let i = 0; i < 8; i += 1) runtime.manualAttack();
  assert.equal(runtime.snapshot().berserker.np, 1);
  assert.equal(runtime.snapshot().hydra.pendingRegrowth.length, 8);

  const release = runtime.releaseNp();
  assert.equal(release.accepted, true);
  assert.equal(release.modifier.scope, 'timed');

  runtime.manualAttack();
  const snapshot = runtime.snapshot();

  assert.equal(snapshot.hydra.logicalHeadCount, 0n);
  assert.equal(snapshot.hydra.pendingRegrowth.length, 0);
  assert.equal(snapshot.statistics.totalHydrasKilled, 1n);
  assert.equal(kills.length, 1);
  assert.equal(snapshot.berserker.np, 0.125);

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

  runtime.advance(300);
  assert.equal(runtime.snapshot().hydra.encounter, 2n);
  assert.equal(runtime.snapshot().modifiers.active.length, 1);

  for (let i = 0; i < 9; i += 1) runtime.manualAttack();
  assert.equal(runtime.snapshot().statistics.totalHydrasKilled, 2n);

  runtime.advance(300);
  let snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.encounter, 3n);
  assert.equal(snapshot.modifiers.active.length, 1);

  runtime.manualAttack();
  snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.logicalHeadCount, 8n);
  assert.equal(snapshot.hydra.pendingRegrowth.length, 0);

  runtime.advance(1000);
  runtime.advance(1000);
  runtime.advance(400);
  assert.equal(runtime.snapshot().modifiers.active.length, 0);

  runtime.destroy();
});

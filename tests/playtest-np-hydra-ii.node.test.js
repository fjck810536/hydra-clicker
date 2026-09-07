import test from 'node:test';
import assert from 'node:assert/strict';

import { createHydraIGameRuntime } from '../js/core/game.js';

test('NP READY playtest preset fills the gauge without changing combat progression', () => {
  const runtime = createHydraIGameRuntime();
  const before = runtime.snapshot();

  const result = runtime.testPresets.readyNp();
  const after = runtime.snapshot();

  assert.equal(result.preset, 'np-ready');
  assert.equal(result.points, 66);
  assert.equal(runtime.npStatus().ready, true);
  assert.equal(runtime.npStatus().points, 66);
  assert.equal(after.statistics.totalHydrasKilled, before.statistics.totalHydrasKilled);
  assert.equal(after.statistics.totalHeadsCut, before.statistics.totalHeadsCut);
  assert.equal(after.master.humanityEvil, before.master.humanityEvil);
  assert.equal(after.hydra.encounter, before.hydra.encounter);

  runtime.destroy();
});

test('Hydra II accepts NP release and CUT 1 suppresses structural GROW +2', () => {
  const runtime = createHydraIGameRuntime();
  const cuts = [];
  const offCut = runtime.events.on('head:cut', ({ payload }) => cuts.push(payload));

  runtime.state.update((draft) => {
    draft.hydra.generation = 2;
    draft.hydra.encounter = 1n;
    draft.hydra.logicalHeadCount = 9n;
    draft.hydra.startingHeadCount = 9n;
    draft.hydra.turn = 0n;
    draft.hydra.pendingRegrowth = [];
    draft.hydra.defeated = false;
    draft.hydra.respawnAtMs = null;
    draft.progression.hydraGeneration = 2;
  });

  runtime.testPresets.readyNp();
  const release = runtime.releaseNp();
  assert.equal(release.accepted, true);
  assert.equal(release.modifier.target, 'hydra.headGrowth');

  runtime.manualAttack();
  const snapshot = runtime.snapshot();

  assert.equal(cuts.length, 1);
  assert.equal(cuts[0].amount, 1n);
  assert.equal(cuts[0].spawned, 0n);
  assert.equal(snapshot.hydra.logicalHeadCount, 8n);
  assert.equal(snapshot.hydra.pendingRegrowth.length, 0);

  offCut();
  runtime.destroy();
});

test('legacy active hydra.regrowth NP modifier still suppresses Hydra II head growth', () => {
  const runtime = createHydraIGameRuntime();

  runtime.state.update((draft) => {
    draft.hydra.generation = 2;
    draft.progression.hydraGeneration = 2;
    draft.modifiers.active.push({
      id: 'legacy-np-window',
      type: 'rule-modifier',
      target: 'hydra.regrowth',
      effect: 'disable',
      startsAt: 0,
      endsAt: 3000,
      source: 'np',
      scope: 'timed',
    });
  });

  runtime.manualAttack();
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 8n);

  runtime.destroy();
});

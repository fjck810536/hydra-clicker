import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createHydraIGameRuntime } from '../js/core/game.js';

test('MAX COMMAND SPELL preset grants current Lv.MAX / 729 APS without inventing kills or currency', () => {
  const runtime = createHydraIGameRuntime();

  try {
    const before = runtime.snapshot();
    const result = runtime.testPresets.maxCommandSpellI();
    const after = runtime.snapshot();
    const status = runtime.commandSpellIStatus();

    assert.equal(result.level, 7);
    assert.equal(result.attacksPerSecond, 729);
    assert.equal(after.master.commandSpells.autoSlash, true);
    assert.equal(after.berserker.baseAttacksPerSecond, 729);
    assert.equal(status.level, 7);
    assert.equal(status.maxed, true);

    assert.equal(after.statistics.totalHydrasKilled, before.statistics.totalHydrasKilled);
    assert.equal(after.master.humanityEvil, before.master.humanityEvil);

    for (const level of [2, 3, 4, 5, 6, 7]) {
      assert.ok(after.progression.milestones.includes(`command-spell-1-lv${level}`));
    }
  } finally {
    runtime.destroy();
  }
});

test('START HYDRA #98 preset means 97 completed kills and a fresh Hydra I encounter 98', () => {
  const runtime = createHydraIGameRuntime();

  try {
    runtime.testPresets.startHydraIEncounter98();
    const snapshot = runtime.snapshot();

    assert.equal(snapshot.statistics.totalHydrasKilled, 97n);
    assert.equal(snapshot.hydra.generation, 1);
    assert.equal(snapshot.progression.hydraGeneration, 1);
    assert.equal(snapshot.hydra.encounter, 98n);
    assert.equal(snapshot.hydra.logicalHeadCount, 9n);
    assert.equal(snapshot.hydra.startingHeadCount, 9n);
    assert.equal(snapshot.hydra.turn, 0n);
    assert.equal(snapshot.hydra.defeated, false);
    assert.equal(snapshot.hydra.respawnAtMs, null);
    assert.deepEqual(snapshot.hydra.pendingRegrowth, []);
    assert.equal(snapshot.berserker.np, 0);
    assert.deepEqual(snapshot.modifiers.active, []);
  } finally {
    runtime.destroy();
  }
});

test('playtest presets compose: max spell survives jumping to Hydra #98', () => {
  const runtime = createHydraIGameRuntime();

  try {
    runtime.testPresets.maxCommandSpellI();
    runtime.testPresets.startHydraIEncounter98();

    const snapshot = runtime.snapshot();
    assert.equal(snapshot.statistics.totalHydrasKilled, 97n);
    assert.equal(snapshot.hydra.encounter, 98n);
    assert.equal(snapshot.master.commandSpells.autoSlash, true);
    assert.equal(snapshot.berserker.baseAttacksPerSecond, 729);
    assert.equal(runtime.commandSpellIStatus().maxed, true);
  } finally {
    runtime.destroy();
  }
});

test('browser TEST preset handlers switch the session to non-persistent mode', async () => {
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(appSource, /enterNonPersistentTestSession\(\)/);
  assert.match(appSource, /suppressPersistence\s*=\s*true/);
  assert.match(appSource, /runtime\.testPresets\.maxCommandSpellI\(\)/);
  assert.match(appSource, /runtime\.testPresets\.startHydraIEncounter98\(\)/);
  assert.match(indexSource, /data-test-command-spell-max/);
  assert.match(indexSource, /data-test-hydra-98/);
});

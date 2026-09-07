import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createHydraIGameRuntime } from '../js/core/game.js';

test('Command Spell I TEST preset can switch exactly among Lv.1, Lv.3, Lv.6 and MAX', () => {
  const runtime = createHydraIGameRuntime();

  try {
    const before = runtime.snapshot();
    const expectations = [
      { level: 1, aps: 1, milestones: [] },
      { level: 3, aps: 9, milestones: [2, 3] },
      { level: 6, aps: 243, milestones: [2, 3, 4, 5, 6] },
      { level: 7, aps: 729, milestones: [2, 3, 4, 5, 6, 7] },
      { level: 1, aps: 1, milestones: [] },
    ];

    for (const expected of expectations) {
      const result = runtime.testPresets.setCommandSpellILevel(expected.level);
      const snapshot = runtime.snapshot();
      const status = runtime.commandSpellIStatus();

      assert.equal(result.level, expected.level);
      assert.equal(result.attacksPerSecond, expected.aps);
      assert.equal(snapshot.master.commandSpells.autoSlash, true);
      assert.equal(snapshot.berserker.baseAttacksPerSecond, expected.aps);
      assert.equal(status.level, expected.level);

      for (const level of [2, 3, 4, 5, 6, 7]) {
        assert.equal(
          snapshot.progression.milestones.includes(`command-spell-1-lv${level}`),
          expected.milestones.includes(level),
        );
      }
    }

    const after = runtime.snapshot();
    assert.equal(after.statistics.totalHydrasKilled, before.statistics.totalHydrasKilled);
    assert.equal(after.master.humanityEvil, before.master.humanityEvil);
  } finally {
    runtime.destroy();
  }
});

test('legacy MAX COMMAND SPELL helper still grants current Lv.MAX / 729 APS', () => {
  const runtime = createHydraIGameRuntime();

  try {
    const result = runtime.testPresets.maxCommandSpellI();
    const snapshot = runtime.snapshot();

    assert.equal(result.level, 7);
    assert.equal(result.attacksPerSecond, 729);
    assert.equal(snapshot.berserker.baseAttacksPerSecond, 729);
    assert.equal(runtime.commandSpellIStatus().maxed, true);
  } finally {
    runtime.destroy();
  }
});

test('Humanity Evil +999 TEST preset is cumulative and changes no kill statistics', () => {
  const runtime = createHydraIGameRuntime();

  try {
    const before = runtime.snapshot();
    const first = runtime.testPresets.addHumanityEvil999();
    const second = runtime.testPresets.addHumanityEvil999();
    const third = runtime.testPresets.addHumanityEvil999();
    const after = runtime.snapshot();

    assert.equal(first.amount, 999n);
    assert.equal(first.balance, 999n);
    assert.equal(second.balance, 1998n);
    assert.equal(third.balance, 2997n);
    assert.equal(after.master.humanityEvil, 2997n);
    assert.equal(after.statistics.totalHydrasKilled, before.statistics.totalHydrasKilled);
    assert.equal(after.statistics.totalHeadsCut, before.statistics.totalHeadsCut);
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

test('playtest presets compose: selected Command Spell I level survives jumping to Hydra #98', () => {
  const runtime = createHydraIGameRuntime();

  try {
    runtime.testPresets.setCommandSpellILevel(6);
    runtime.testPresets.startHydraIEncounter98();

    const snapshot = runtime.snapshot();
    assert.equal(snapshot.statistics.totalHydrasKilled, 97n);
    assert.equal(snapshot.hydra.encounter, 98n);
    assert.equal(snapshot.master.commandSpells.autoSlash, true);
    assert.equal(snapshot.berserker.baseAttacksPerSecond, 243);
    assert.equal(runtime.commandSpellIStatus().level, 6);
  } finally {
    runtime.destroy();
  }
});

test('browser TEST controls stay non-persistent and expose CS I cycle plus cumulative Humanity Evil', async () => {
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(appSource, /enterNonPersistentTestSession\(\)/);
  assert.match(appSource, /suppressPersistence\s*=\s*true/);
  assert.match(appSource, /COMMAND_SPELL_I_TEST_LEVELS\s*=\s*Object\.freeze\(\[1, 3, 6, 7\]\)/);
  assert.match(appSource, /runtime\.testPresets\.setCommandSpellILevel\(level\)/);
  assert.match(appSource, /commandSpellITestCursor\s*=\s*\(commandSpellITestCursor \+ 1\)/);
  assert.match(appSource, /runtime\.testPresets\.addHumanityEvil999\(\)/);
  assert.match(appSource, /unbindTestHumanityEvil999/);
  assert.match(appSource, /runtime\.testPresets\.startHydraIEncounter98\(\)/);
  assert.match(indexSource, /data-test-command-spell-max/);
  assert.match(indexSource, /CS I TEST · 1 → 3 → 6 → MAX/);
  assert.match(indexSource, /data-test-humanity-evil-999/);
  assert.match(indexSource, /人類惡 \+999/);
  assert.match(indexSource, /data-test-hydra-98/);
});

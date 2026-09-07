import test from 'node:test';
import assert from 'node:assert/strict';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { createInitialState } from '../js/core/state.js';
import { HYDRA_I_PROGRESSION } from '../js/data/progression.js';

const LEVELS = HYDRA_I_PROGRESSION.commandSpellI.levels;

test('Command Spell I upgrade data reaches 64 APS Lv.MAX at kill 66', () => {
  assert.deepEqual(
    LEVELS.map((entry) => Number(entry.requiredHydraKills)),
    [9, 12, 16, 22, 30, 40, 66],
  );
  assert.deepEqual(
    LEVELS.map((entry) => Number(entry.cost)),
    [99, 22, 33, 44, 66, 88, 132],
  );
  assert.deepEqual(
    LEVELS.map((entry) => entry.attacksPerSecond),
    [1, 2, 4, 8, 16, 32, 64],
  );

  const postUnlockCost = LEVELS.slice(1).reduce((sum, entry) => sum + entry.cost, 0n);
  assert.equal(postUnlockCost, 385n);
  assert.equal((66n - 9n) * HYDRA_I_PROGRESSION.humanityEvilPerKill, 627n);
});

test('an old save with Auto Slash unlocked is treated as Command Spell I Lv.1', () => {
  const initialState = createInitialState();
  initialState.master.commandSpells.autoSlash = true;
  initialState.statistics.totalHydrasKilled = 12n;
  initialState.master.humanityEvil = 22n;

  const runtime = createHydraIGameRuntime({ initialState });
  const before = runtime.commandSpellIStatus();

  assert.equal(before.level, 1);
  assert.equal(before.nextLevel, 2);
  assert.equal(before.available, true);
  assert.equal(before.nextAttacksPerSecond, 2);

  const purchase = runtime.buyCommandSpellI();
  assert.equal(purchase.accepted, true);
  assert.equal(purchase.level, 2);
  assert.equal(runtime.snapshot().berserker.baseAttacksPerSecond, 2);
  assert.ok(runtime.snapshot().progression.milestones.includes('command-spell-1-lv2'));

  runtime.destroy();
});

test('legacy Playtest 2.3 Lv.8 / 128 APS save is clamped to current 64 APS MAX', () => {
  const initialState = createInitialState();
  initialState.master.commandSpells.autoSlash = true;
  initialState.berserker.baseAttacksPerSecond = 128;
  initialState.statistics.totalHydrasKilled = 99n;
  initialState.progression.milestones = [
    'command-spell-1-lv2',
    'command-spell-1-lv3',
    'command-spell-1-lv4',
    'command-spell-1-lv5',
    'command-spell-1-lv6',
    'command-spell-1-lv7',
    'command-spell-1-lv8',
  ];

  const runtime = createHydraIGameRuntime({ initialState });
  const status = runtime.commandSpellIStatus();

  assert.equal(status.level, 7);
  assert.equal(status.maxed, true);
  assert.equal(status.attacksPerSecond, 64);
  assert.equal(runtime.snapshot().berserker.baseAttacksPerSecond, 64);

  runtime.destroy();
});

test('kill 66 economy can buy every post-unlock Command Spell I upgrade and leave reserve Humanity Evil', () => {
  const initialState = createInitialState();
  initialState.master.commandSpells.autoSlash = true;
  initialState.statistics.totalHydrasKilled = 66n;
  initialState.master.humanityEvil = 627n;

  const runtime = createHydraIGameRuntime({ initialState });

  for (let targetLevel = 2; targetLevel <= 7; targetLevel += 1) {
    const status = runtime.commandSpellIStatus();
    assert.equal(status.nextLevel, targetLevel);
    assert.equal(status.available, true);

    const purchase = runtime.buyCommandSpellI();
    assert.equal(purchase.accepted, true);
    assert.equal(purchase.level, targetLevel);
  }

  const finalStatus = runtime.commandSpellIStatus();
  const snapshot = runtime.snapshot();

  assert.equal(finalStatus.level, 7);
  assert.equal(finalStatus.maxed, true);
  assert.equal(snapshot.berserker.baseAttacksPerSecond, 64);
  assert.equal(snapshot.master.humanityEvil, 242n);

  runtime.destroy();
});

test('64 APS max plus one NP can clear the final 95 to 99 stretch inside the burst window', () => {
  const initialState = createInitialState();
  initialState.master.commandSpells.autoSlash = true;
  initialState.berserker.baseAttacksPerSecond = 64;
  initialState.berserker.np = 1;
  initialState.statistics.totalHydrasKilled = 95n;
  initialState.progression.milestones = [
    'command-spell-1-lv2',
    'command-spell-1-lv3',
    'command-spell-1-lv4',
    'command-spell-1-lv5',
    'command-spell-1-lv6',
    'command-spell-1-lv7',
  ];

  const runtime = createHydraIGameRuntime({ initialState });
  const released = runtime.releaseNp();
  assert.equal(released.accepted, true);

  runtime.advance(3000);
  const killsAfter = runtime.snapshot().statistics.totalHydrasKilled;

  assert.ok(killsAfter >= 99n, `expected NP burst to reach kill 99, got ${killsAfter.toString()}`);

  runtime.destroy();
});

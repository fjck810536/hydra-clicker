import test from 'node:test';
import assert from 'node:assert/strict';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { createInitialState } from '../js/core/state.js';
import { HYDRA_I_PROGRESSION } from '../js/data/progression.js';

const LEVELS = HYDRA_I_PROGRESSION.commandSpellI.levels;

test('Command Spell I upgrade data reaches Lv.MAX at kill 66 with doubling APS', () => {
  assert.deepEqual(
    LEVELS.map((entry) => Number(entry.requiredHydraKills)),
    [9, 12, 16, 22, 30, 40, 52, 66],
  );
  assert.deepEqual(
    LEVELS.map((entry) => Number(entry.cost)),
    [99, 22, 33, 44, 66, 88, 110, 132],
  );
  assert.deepEqual(
    LEVELS.map((entry) => entry.attacksPerSecond),
    [1, 2, 4, 8, 16, 32, 64, 128],
  );

  const postUnlockCost = LEVELS.slice(1).reduce((sum, entry) => sum + entry.cost, 0n);
  assert.equal(postUnlockCost, 495n);
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

test('kill 66 economy can buy every post-unlock Command Spell I upgrade and leave 132 Humanity Evil', () => {
  const initialState = createInitialState();
  initialState.master.commandSpells.autoSlash = true;
  initialState.statistics.totalHydrasKilled = 66n;
  initialState.master.humanityEvil = 627n;

  const runtime = createHydraIGameRuntime({ initialState });

  for (let targetLevel = 2; targetLevel <= 8; targetLevel += 1) {
    const status = runtime.commandSpellIStatus();
    assert.equal(status.nextLevel, targetLevel);
    assert.equal(status.available, true);

    const purchase = runtime.buyCommandSpellI();
    assert.equal(purchase.accepted, true);
    assert.equal(purchase.level, targetLevel);
  }

  const finalStatus = runtime.commandSpellIStatus();
  const snapshot = runtime.snapshot();

  assert.equal(finalStatus.level, 8);
  assert.equal(finalStatus.maxed, true);
  assert.equal(snapshot.berserker.baseAttacksPerSecond, 128);
  assert.equal(snapshot.master.humanityEvil, 132n);

  runtime.destroy();
});

test('Lv.MAX plus NP burst can defeat more than six Hydra in one simulated second', () => {
  const initialState = createInitialState();
  initialState.master.commandSpells.autoSlash = true;
  initialState.berserker.baseAttacksPerSecond = 128;
  initialState.berserker.np = 1;
  initialState.statistics.totalHydrasKilled = 66n;
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
  const released = runtime.releaseNp();
  assert.equal(released.accepted, true);

  const killsBefore = runtime.snapshot().statistics.totalHydrasKilled;
  runtime.advance(1000);
  const killsAfter = runtime.snapshot().statistics.totalHydrasKilled;
  const killsInOneSecond = killsAfter - killsBefore;

  assert.ok(killsInOneSecond > 6n, `expected >6 Hydra/sec, got ${killsInOneSecond.toString()}`);
  assert.equal(killsInOneSecond, 10n);

  runtime.destroy();
});

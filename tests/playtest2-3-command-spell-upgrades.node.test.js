import test from 'node:test';
import assert from 'node:assert/strict';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { createInitialState } from '../js/core/state.js';
import { HYDRA_I_PROGRESSION } from '../js/data/progression.js';

const LEVELS = HYDRA_I_PROGRESSION.commandSpellI.levels;

test('Command Spell I uses the revised affordability-driven APS and price curve', () => {
  assert.deepEqual(
    LEVELS.map((entry) => entry.requiredHydraKills),
    [null, null, null, null, null, null, null],
  );
  assert.deepEqual(
    LEVELS.map((entry) => entry.cost),
    [99n, 33n, 66n, 99n, 1782n, 2178n, null],
  );
  assert.deepEqual(
    LEVELS.map((entry) => entry.attacksPerSecond),
    [1, 3, 9, 27, 81, 243, 729],
  );

  const formalCostThrough243 = LEVELS.slice(0, 6).reduce((sum, entry) => sum + entry.cost, 0n);
  assert.equal(formalCostThrough243, 4257n);
  assert.equal(LEVELS.at(-1).purchasePending, true);
  assert.equal(LEVELS.at(-1).intendedGeneration, 3);
});

test('a save with only Auto Slash unlocked is treated as Command Spell I Lv.1', () => {
  const initialState = createInitialState();
  initialState.master.commandSpells.autoSlash = true;
  initialState.statistics.totalHydrasKilled = 12n;
  initialState.master.humanityEvil = 33n;

  const runtime = createHydraIGameRuntime({ initialState });
  const before = runtime.commandSpellIStatus();

  assert.equal(before.level, 1);
  assert.equal(before.nextLevel, 2);
  assert.equal(before.available, true);
  assert.equal(before.nextAttacksPerSecond, 3);

  const purchase = runtime.buyCommandSpellI();
  assert.equal(purchase.accepted, true);
  assert.equal(purchase.level, 2);
  assert.equal(runtime.snapshot().berserker.baseAttacksPerSecond, 3);
  assert.ok(runtime.snapshot().progression.milestones.includes('command-spell-1-lv2'));

  runtime.destroy();
});

test('legacy 128 APS upgrade save migrates conservatively to 81 APS instead of receiving free 729 APS', () => {
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

  assert.equal(status.level, 5);
  assert.equal(status.maxed, false);
  assert.equal(status.attacksPerSecond, 81);
  assert.equal(status.nextAttacksPerSecond, 243);
  assert.equal(runtime.snapshot().berserker.baseAttacksPerSecond, 81);
  assert.equal(runtime.snapshot().progression.milestones.includes('command-spell-1-lv6'), false);
  assert.equal(runtime.snapshot().progression.milestones.includes('command-spell-1-lv8'), false);

  runtime.destroy();
});

test('formal Humanity Evil purchases can reach 243 APS but 729 remains price-pending', () => {
  const initialState = createInitialState();
  initialState.master.humanityEvil = 4257n;

  const runtime = createHydraIGameRuntime({ initialState });

  for (let targetLevel = 1; targetLevel <= 6; targetLevel += 1) {
    const status = runtime.commandSpellIStatus();
    assert.equal(status.nextLevel, targetLevel);
    assert.equal(status.available, true);

    const purchase = runtime.buyCommandSpellI();
    assert.equal(purchase.accepted, true);
    assert.equal(purchase.level, targetLevel);
  }

  const finalStatus = runtime.commandSpellIStatus();
  const snapshot = runtime.snapshot();

  assert.equal(finalStatus.level, 6);
  assert.equal(finalStatus.maxed, false);
  assert.equal(finalStatus.nextAttacksPerSecond, 729);
  assert.equal(finalStatus.pricePending, true);
  assert.equal(finalStatus.available, false);
  assert.equal(snapshot.berserker.baseAttacksPerSecond, 243);
  assert.equal(snapshot.master.humanityEvil, 0n);
  assert.equal(runtime.buyCommandSpellI().reason, 'price-pending');

  runtime.destroy();
});

test('729 APS remains a valid owned/test state and is still paused by NP time stop', () => {
  const initialState = createInitialState();
  initialState.master.commandSpells.autoSlash = true;
  initialState.berserker.baseAttacksPerSecond = 729;
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

  runtime.advance(1000);
  runtime.advance(1000);
  runtime.advance(900);
  assert.equal(runtime.snapshot().statistics.totalHydrasKilled, 95n);
  assert.equal(runtime.isNpActive(), true);

  runtime.advance(100);
  assert.equal(runtime.isNpActive(), false);

  runtime.advance(100);
  assert.ok(runtime.snapshot().statistics.totalHeadsCut > 0n);

  runtime.destroy();
});

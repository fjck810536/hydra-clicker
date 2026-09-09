import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { createInitialState } from '../js/core/state.js';
import {
  HYDRA_I_PROGRESSION,
  getHumanityEvilCostForGenerationUnits,
  getHumanityEvilRewardForGeneration,
} from '../js/data/progression.js';

function createHydraIIState({
  totalKills = 99n,
  humanityEvil = 0n,
  heads = 9n,
  introComplete = true,
} = {}) {
  const state = createInitialState();
  state.hydra.generation = 2;
  state.hydra.encounter = totalKills > 99n ? totalKills - 98n : 1n;
  state.hydra.logicalHeadCount = heads;
  state.hydra.startingHeadCount = 9n;
  state.progression.hydraGeneration = 2;
  if (introComplete) state.progression.milestones.push('hydra-ii-first-manual-cut');
  state.statistics.totalHydrasKilled = totalKills;
  state.master.humanityEvil = humanityEvil;
  return state;
}

test('Humanity Evil true-kill rewards scale by x3 each Hydra generation', () => {
  assert.deepEqual(
    [1, 2, 3, 4].map((generation) => getHumanityEvilRewardForGeneration(
      generation,
      HYDRA_I_PROGRESSION.humanityEvil,
    )),
    [11n, 33n, 99n, 297n],
  );
});

test('normalized U_n costs convert exactly into raw Humanity Evil', () => {
  assert.equal(getHumanityEvilCostForGenerationUnits(1, 9n), 99n);
  assert.equal(getHumanityEvilCostForGenerationUnits(2, 36n), 1188n);
  assert.equal(getHumanityEvilCostForGenerationUnits(2, 54n), 1782n);
  assert.equal(getHumanityEvilCostForGenerationUnits(3, 9n), 891n);

  // Catch-up is natural purchasing-power inflation, not price rescaling.
  assert.equal(getHumanityEvilCostForGenerationUnits(4, 54n), 16038n);
  assert.equal(16038n / getHumanityEvilRewardForGeneration(5), 18n);
  assert.equal(16038n / getHumanityEvilRewardForGeneration(6), 6n);
});

test('a true Hydra II kill awards 33 Humanity Evil instead of the Hydra I 11', () => {
  const initialState = createHydraIIState({ heads: 1n });
  initialState.berserker.np = 1;
  const runtime = createHydraIGameRuntime({ initialState });
  const gains = [];
  const offGain = runtime.events.on('currency:gain', ({ payload }) => gains.push(payload));

  assert.equal(runtime.releaseNp().accepted, true);
  runtime.manualAttack();

  const snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.defeated, true);
  assert.equal(snapshot.statistics.totalHydrasKilled, 100n);
  assert.equal(snapshot.master.humanityEvil, 33n);
  assert.equal(gains.length, 1);
  assert.equal(gains[0].amount, 33n);
  assert.equal(gains[0].generation, 2);

  offGain();
  runtime.destroy();
});

test('Command Spell I Data uses onboarding U1 costs then the mature 36U2 / 54U2 pair', () => {
  const levels = HYDRA_I_PROGRESSION.commandSpellI.levels;
  assert.deepEqual(levels.map((level) => level.attacksPerSecond), [1, 3, 9, 27, 81, 243, 729]);
  assert.deepEqual(levels.map((level) => level.cost), [99n, 33n, 66n, 99n, 1188n, 1782n, null]);
  assert.deepEqual(levels.map((level) => level.requiredHydraKills), [null, null, null, null, null, null, null]);
  assert.deepEqual(levels.map((level) => level.purchasePending === true), [false, false, false, false, false, false, true]);
  assert.equal(levels.at(-1).intendedGeneration, 3);
});

test('Command Spell I formal purchases are affordability-driven through 243 APS and stop before ranged 729 pricing', () => {
  const initialState = createInitialState();
  initialState.statistics.totalHydrasKilled = 0n;
  initialState.master.humanityEvil = 3267n;
  const runtime = createHydraIGameRuntime({ initialState });

  for (let targetLevel = 1; targetLevel <= 6; targetLevel += 1) {
    const before = runtime.commandSpellIStatus();
    assert.equal(before.nextLevel, targetLevel);
    assert.equal(before.killsMet, true);
    assert.equal(before.available, true);

    const purchase = runtime.buyCommandSpellI();
    assert.equal(purchase.accepted, true);
    assert.equal(purchase.level, targetLevel);
  }

  const pending = runtime.commandSpellIStatus();
  assert.equal(pending.level, 6);
  assert.equal(pending.attacksPerSecond, 243);
  assert.equal(pending.nextLevel, 7);
  assert.equal(pending.nextAttacksPerSecond, 729);
  assert.equal(pending.pricePending, true);
  assert.equal(pending.cost, null);
  assert.equal(pending.available, false);
  assert.equal(runtime.buyCommandSpellI().reason, 'price-pending');
  assert.equal(runtime.snapshot().master.humanityEvil, 0n);

  runtime.destroy();
});

test('Command Spell II teaching trio has no hidden kill gates after the first reversal reveal', () => {
  const levels = HYDRA_I_PROGRESSION.commandSpellII.levels;
  assert.equal(HYDRA_I_PROGRESSION.commandSpellII.firstEligibilityMilestone, 'hydra-ii-first-manual-cut');
  assert.deepEqual(levels.map((level) => level.requiredGenerationKills), [0n, null, null, null, null, null, null, null, null]);
  assert.deepEqual(levels.map((level) => level.cost), [297n, 198n, 891n, null, null, null, null, null, null]);
  assert.deepEqual(levels.map((level) => level.purchasePending === true), [false, false, false, true, true, true, true, true, true]);
  assert.deepEqual(levels.map((level) => level.npManualStrikeCount), [3, 3, 3, 6, 6, 6, 9, 9, 9]);
  assert.deepEqual(levels.map((level) => level.npDurationMs), [3000, 3000, 9000, 9000, 9000, 27000, 27000, 27000, 81000]);
  assert.deepEqual(levels.slice(3).map((level) => level.intendedGeneration), [3, 3, 3, 4, 4, 4]);
  assert.equal(HYDRA_I_PROGRESSION.commandSpellII.futureExtensionPending, true);
});

test('Command Spell II Lv.1 unlocks on the first Hydra II reversal cut with zero Hydra II kills', () => {
  const initialState = createHydraIIState({
    totalKills: 99n,
    humanityEvil: 297n,
    introComplete: false,
  });
  initialState.berserker.np = 0.5;
  const runtime = createHydraIGameRuntime({ initialState });

  const beforeCut = runtime.commandSpellIIStatus();
  assert.equal(beforeCut.level, 0);
  assert.equal(beforeCut.generationKills, 0n);
  assert.equal(beforeCut.killsMet, true);
  assert.equal(beforeCut.eligibilityMet, false);
  assert.equal(beforeCut.available, false);
  assert.equal(runtime.buyCommandSpellII().reason, 'eligibility-required');

  runtime.manualAttack();
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 10n);
  assert.equal(runtime.snapshot().statistics.totalHydrasKilled, 99n);

  const afterCut = runtime.commandSpellIIStatus();
  assert.equal(afterCut.generationKills, 0n);
  assert.equal(afterCut.eligibilityMet, true);
  assert.equal(afterCut.available, true);
  assert.equal(runtime.npStatus().points, 34);
  assert.equal(runtime.npStatus().maxPoints, 66);

  const purchase = runtime.buyCommandSpellII();
  assert.equal(purchase.accepted, true);
  assert.equal(purchase.level, 1);

  const after = runtime.commandSpellIIStatus();
  assert.equal(after.npManualStrikeCount, 3);
  assert.equal(after.npMaxPoints, 132);
  assert.equal(after.npDurationMs, 3000);
  assert.equal(runtime.npStatus().points, 34);
  assert.equal(runtime.npStatus().maxPoints, 132);
  assert.equal(runtime.snapshot().master.humanityEvil, 0n);

  runtime.destroy();
});

test('Command Spell II Lv.2 and Lv.3 can be bought at zero Hydra II kills when Humanity Evil is sufficient', () => {
  const initialState = createHydraIIState({ totalKills: 99n, humanityEvil: 1386n, introComplete: true });
  const runtime = createHydraIGameRuntime({ initialState });

  for (let level = 1; level <= 3; level += 1) {
    const before = runtime.commandSpellIIStatus();
    assert.equal(before.generationKills, 0n);
    assert.equal(before.nextLevel, level);
    assert.equal(before.killsMet, true);
    assert.equal(before.available, true);

    const purchase = runtime.buyCommandSpellII();
    assert.equal(purchase.accepted, true);
    assert.equal(purchase.level, level);
  }

  const pending = runtime.commandSpellIIStatus();
  assert.equal(runtime.snapshot().master.humanityEvil, 0n);
  assert.equal(pending.level, 3);
  assert.equal(pending.nextLevel, 4);
  assert.equal(pending.pricePending, true);
  assert.equal(pending.available, false);
  assert.equal(pending.cost, null);
  assert.equal(runtime.buyCommandSpellII().reason, 'price-pending');

  runtime.destroy();
});

test('legacy / TEST-owned later Command Spell II milestones keep their effects but 81 seconds is not conceptual MAX', () => {
  const initialState = createHydraIIState({ totalKills: 198n });
  for (let level = 1; level <= 9; level += 1) {
    initialState.progression.milestones.push(`command-spell-2-lv${level}`);
  }
  const runtime = createHydraIGameRuntime({ initialState });

  const status = runtime.commandSpellIIStatus();
  assert.equal(status.level, 9);
  assert.equal(status.npManualStrikeCount, 9);
  assert.equal(status.npDurationMs, 81000);
  assert.equal(status.maxed, false);
  assert.equal(status.extensionPending, true);
  assert.equal(status.pricePending, true);
  assert.equal(status.nextLevel, null);
  assert.equal(runtime.buyCommandSpellII().reason, 'price-pending');

  runtime.destroy();
});

test('formal player UI routes all three Command Spell lines through fixed slots and one purchase modal', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const panelSource = await readFile(new URL('../js/view/command-spell-panel.js', import.meta.url), 'utf8');

  assert.match(html, /data-command-spell-slot="1"/);
  assert.match(html, /data-command-spell-slot="2"/);
  assert.match(html, /data-command-spell-slot="3"/);
  assert.match(html, /data-command-spell-modal/);
  assert.match(html, /data-command-spell-purchase/);

  assert.match(appSource, /commandSpellPanel\.currentOpenSpellId\(\)/);
  assert.match(appSource, /runtime\.buyCommandSpellI\(\)/);
  assert.match(appSource, /runtime\.buyCommandSpellII\(\)/);
  assert.match(appSource, /runtime\.buyCommandSpellIII\(\)/);
  assert.match(appSource, /runtime\.commandSpellIIStatus\(\)/);
  assert.doesNotMatch(appSource, /state\.update/);
  assert.doesNotMatch(panelSource, /from ['"]\.\.\/systems\//);
  assert.doesNotMatch(panelSource, /from ['"]\.\.\/math\//);
});

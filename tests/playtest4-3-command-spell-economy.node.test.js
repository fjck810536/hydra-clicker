import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { createInitialState } from '../js/core/state.js';
import {
  HYDRA_I_PROGRESSION,
  getHumanityEvilRewardForGeneration,
} from '../js/data/progression.js';

function createHydraIIState({
  totalKills = 99n,
  humanityEvil = 0n,
  heads = 9n,
} = {}) {
  const state = createInitialState();
  state.hydra.generation = 2;
  state.hydra.encounter = totalKills > 99n ? totalKills - 98n : 1n;
  state.hydra.logicalHeadCount = heads;
  state.hydra.startingHeadCount = 9n;
  state.progression.hydraGeneration = 2;
  state.progression.milestones.push('hydra-ii-first-manual-cut');
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

test('Command Spell I Data uses the revised Hydra I / II economy and leaves 729 APS price pending', () => {
  const levels = HYDRA_I_PROGRESSION.commandSpellI.levels;
  assert.deepEqual(levels.map((level) => level.attacksPerSecond), [1, 3, 9, 27, 81, 243, 729]);
  assert.deepEqual(levels.map((level) => level.cost), [99n, 33n, 66n, 99n, 1782n, 2178n, null]);
  assert.deepEqual(levels.map((level) => level.requiredHydraKills), [null, null, null, null, null, null, null]);
  assert.deepEqual(levels.map((level) => level.purchasePending === true), [false, false, false, false, false, false, true]);
  assert.equal(levels.at(-1).intendedGeneration, 3);
});

test('Command Spell I formal purchases are affordability-driven through 243 APS and stop before unpriced 729 APS', () => {
  const initialState = createInitialState();
  initialState.statistics.totalHydrasKilled = 0n;
  initialState.master.humanityEvil = 4257n;
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

test('Command Spell II Data locks the confirmed nine-beat cost, reveal and NP curves', () => {
  const levels = HYDRA_I_PROGRESSION.commandSpellII.levels;
  assert.deepEqual(levels.map((level) => level.requiredGenerationKills), [3n, 9n, 18n, 27n, 39n, 54n, 66n, 81n, 99n]);
  assert.deepEqual(levels.map((level) => level.cost), [297n, 198n, 396n, 396n, 330n, 495n, 594n, 495n, 693n]);
  assert.deepEqual(levels.map((level) => level.npManualStrikeCount), [3, 3, 3, 6, 6, 6, 9, 9, 9]);
  assert.deepEqual(levels.map((level) => level.npMaxPoints), [132, 66, 198, 396, 198, 594, 792, 396, 1188]);
  assert.deepEqual(levels.map((level) => level.npDurationMs), [3000, 3000, 9000, 9000, 9000, 27000, 27000, 27000, 81000]);
});

test('Command Spell II Lv.1 becomes purchasable after 3 Hydra II kills and preserves absolute charged NP points', () => {
  const initialState = createHydraIIState({ totalKills: 102n, humanityEvil: 297n });
  initialState.berserker.np = 0.5;
  const runtime = createHydraIGameRuntime({ initialState });

  const before = runtime.commandSpellIIStatus();
  assert.equal(before.level, 0);
  assert.equal(before.generationKills, 3n);
  assert.equal(before.available, true);
  assert.equal(runtime.npStatus().points, 33);
  assert.equal(runtime.npStatus().maxPoints, 66);

  const purchase = runtime.buyCommandSpellII();
  assert.equal(purchase.accepted, true);
  assert.equal(purchase.level, 1);

  const after = runtime.commandSpellIIStatus();
  assert.equal(after.npManualStrikeCount, 3);
  assert.equal(after.npMaxPoints, 132);
  assert.equal(after.npDurationMs, 3000);
  assert.equal(runtime.npStatus().points, 33);
  assert.equal(runtime.npStatus().maxPoints, 132);
  assert.equal(runtime.snapshot().berserker.np, 0.25);
  assert.equal(runtime.snapshot().master.humanityEvil, 0n);

  runtime.destroy();
});

test('buying all nine Command Spell II beats produces the canonical sawtooth gauge and 81-second MAX', () => {
  const initialState = createHydraIIState({ totalKills: 198n, humanityEvil: 3894n });
  const runtime = createHydraIGameRuntime({ initialState });

  const observed = [];
  for (let level = 1; level <= 9; level += 1) {
    const before = runtime.commandSpellIIStatus();
    assert.equal(before.nextLevel, level);
    assert.equal(before.available, true);

    const purchase = runtime.buyCommandSpellII();
    assert.equal(purchase.accepted, true);
    observed.push({
      strikes: purchase.status.npManualStrikeCount,
      max: purchase.status.npMaxPoints,
      duration: purchase.status.npDurationMs,
    });
  }

  assert.deepEqual(observed.map((value) => value.max), [132, 66, 198, 396, 198, 594, 792, 396, 1188]);
  assert.deepEqual(observed.map((value) => value.strikes), [3, 3, 3, 6, 6, 6, 9, 9, 9]);
  assert.deepEqual(observed.map((value) => value.duration), [3000, 3000, 9000, 9000, 9000, 27000, 27000, 27000, 81000]);
  assert.equal(runtime.snapshot().master.humanityEvil, 0n);
  assert.equal(runtime.commandSpellIIStatus().maxed, true);

  runtime.state.update((draft) => {
    draft.berserker.np = 1;
  });
  assert.deepEqual(
    { points: runtime.npStatus().points, maxPoints: runtime.npStatus().maxPoints },
    { points: 1188, maxPoints: 1188 },
  );
  const release = runtime.releaseNp();
  assert.equal(release.accepted, true);
  assert.equal(release.durationMs, 81000);
  assert.equal(release.endsAt - release.atMs, 81000);

  runtime.destroy();
});

test('formal player UI routes both Command Spell lines through fixed slots and one purchase modal', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const panelSource = await readFile(new URL('../js/view/command-spell-panel.js', import.meta.url), 'utf8');

  assert.match(html, /data-command-spell-slot="1"/);
  assert.match(html, /data-command-spell-slot="2"/);
  assert.match(html, /data-command-spell-slot="3"/);
  assert.match(html, /data-command-spell-modal/);
  assert.match(html, /data-command-spell-purchase/);
  assert.doesNotMatch(html, /data-command-spell-button/);
  assert.doesNotMatch(html, /data-command-spell-ii-button/);

  assert.match(appSource, /commandSpellPanel\.currentOpenSpellId\(\)/);
  assert.match(appSource, /runtime\.buyCommandSpellI\(\)/);
  assert.match(appSource, /runtime\.buyCommandSpellII\(\)/);
  assert.match(appSource, /runtime\.commandSpellIIStatus\(\)/);
  assert.doesNotMatch(appSource, /state\.update/);
  assert.doesNotMatch(panelSource, /from ['"]\.\.\/systems\//);
  assert.doesNotMatch(panelSource, /from ['"]\.\.\/math\//);
});

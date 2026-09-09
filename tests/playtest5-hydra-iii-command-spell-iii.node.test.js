import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { createInitialState } from '../js/core/state.js';
import { createHydraIIIRule } from '../js/math/hydra-rules.js';
import { applyCutResolution } from '../js/math/hydra-model.js';
import { HYDRA_I_PROGRESSION } from '../js/data/progression.js';
import { projectTreeView } from '../js/view/tree-view.js';
import { projectCommandSpellIIISlot } from '../js/view/command-spell-panel.js';

function createHydraIIIState({
  heads = 9n,
  np = 0,
  autoSlash = false,
  attacksPerSecond = 1,
  humanityEvil = 0n,
} = {}) {
  const state = createInitialState();
  state.hydra.generation = 3;
  state.hydra.encounter = 1n;
  state.hydra.logicalHeadCount = heads;
  state.hydra.startingHeadCount = 9n;
  state.progression.hydraGeneration = 3;
  state.statistics.totalHydrasKilled = 198n;
  state.berserker.np = np;
  state.master.commandSpells.autoSlash = autoSlash;
  state.berserker.baseAttacksPerSecond = attacksPerSecond;
  state.master.humanityEvil = humanityEvil;
  return state;
}

test('Hydra III keeps CUT 1 -> GROW 2 while scaling the logical cap to 729', () => {
  const rule = createHydraIIIRule({ maxHeadCount: 729n });

  for (const [before, after, spawned] of [
    [9n, 10n, 2n],
    [728n, 729n, 2n],
    [729n, 729n, 1n],
  ]) {
    const state = createHydraIIIState({ heads: before });
    const resolution = rule.resolveCut({
      hydraState: state.hydra,
      attack: { headsPerStrike: 1n },
      turn: state.hydra.turn,
      nowMs: 0,
    });
    assert.equal(resolution.accepted, true);
    assert.equal(resolution.headsRemoved, 1n);
    assert.equal(resolution.headsSpawned, spawned);
    applyCutResolution(state, resolution);
    assert.equal(state.hydra.logicalHeadCount, after);
  }
});

test('Hydra III is killable during NP head-growth suppression and awards 99 Humanity Evil', () => {
  const initialState = createHydraIIIState({ heads: 1n, np: 1 });
  const runtime = createHydraIGameRuntime({ initialState });

  assert.equal(runtime.releaseNp().accepted, true);
  runtime.manualAttack();

  let snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.logicalHeadCount, 0n);
  assert.equal(snapshot.hydra.defeated, true);
  assert.equal(snapshot.statistics.totalHydrasKilled, 199n);
  assert.equal(snapshot.master.humanityEvil, 99n);

  runtime.advance(100);
  snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.generation, 3);
  assert.equal(snapshot.hydra.encounter, 2n);
  assert.equal(snapshot.hydra.logicalHeadCount, 9n);

  runtime.destroy();
});

test('Hydra III first reaches 100 logical heads before Tree View becomes observationally available', () => {
  const runtime = createHydraIGameRuntime();
  const unlocks = [];
  const offUnlock = runtime.events.on('tree-view:unlocked', ({ payload }) => unlocks.push(payload));

  const preset = runtime.testPresets.startHydraIIIAt99();
  assert.equal(preset.heads, 99n);
  assert.equal(runtime.snapshot().progression.treeViewUnlocked, false);

  runtime.manualAttack();
  const snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.logicalHeadCount, 100n);
  assert.equal(snapshot.progression.treeViewUnlocked, true);
  assert.equal(unlocks.length, 1);
  assert.equal(unlocks[0].logicalHeads, 100n);
  assert.equal(unlocks[0].threshold, 100n);

  const projection = projectTreeView(snapshot, { visibleHeadCap: 99n, maxHeads: 729n });
  assert.equal(projection.unlocked, true);
  assert.equal(projection.logicalHeads, 100n);
  assert.equal(projection.visibleHeads, 99n);
  assert.equal(projection.overflowHeads, 1n);
  assert.equal(projection.maxHeads, 729n);

  offUnlock();
  runtime.destroy();
});

test('Tree View continues to project 729 logical heads through a 99-head visible proxy', () => {
  const state = createHydraIIIState({ heads: 729n });
  state.progression.treeViewUnlocked = true;
  const projection = projectTreeView(state, { visibleHeadCap: 99n, maxHeads: 729n });

  assert.equal(projection.logicalHeads, 729n);
  assert.equal(projection.visibleHeads, 99n);
  assert.equal(projection.overflowHeads, 630n);
  assert.equal(projection.maxHeads, 729n);
});

test('Command Spell III keeps the finite 1/9 -> 1/3 -> full bridge and prices only the exact 9U3 first step', () => {
  const definition = HYDRA_I_PROGRESSION.commandSpellIII;
  assert.equal(definition.unlockGeneration, 3);
  assert.equal(definition.firstEligibilityMilestone, 'hydra-iii-first-np-release');
  assert.deepEqual(
    definition.levels.map((level) => [level.autoNpNumerator, level.autoNpDenominator]),
    [[1, 9], [1, 3], [1, 1]],
  );
  assert.deepEqual(definition.levels.map((level) => level.cost), [891n, null, null]);
  assert.deepEqual(definition.levels.map((level) => level.purchasePending === true), [false, true, true]);
});

test('entering Hydra III exposes the Command Spell III chapter but first NP release remains the one-time reveal', () => {
  const runtime = createHydraIGameRuntime({ initialState: createHydraIIIState({ humanityEvil: 9999n }) });
  const status = runtime.commandSpellIIIStatus();

  assert.equal(status.chapterReached, true);
  assert.equal(status.eligible, false);
  assert.equal(status.available, false);
  assert.equal(runtime.buyCommandSpellIII().reason, 'eligibility-required');

  assert.deepEqual(projectCommandSpellIIISlot(status), {
    state: 'preview',
    level: '—',
    meta: 'NP TO REVEAL',
    clickable: false,
  });

  runtime.destroy();
});

test('first NP release while fighting Hydra III reveals a priced but possibly unaffordable Command Spell III', () => {
  const initialState = createHydraIIIState({ np: 1 });
  const runtime = createHydraIGameRuntime({ initialState });
  const eligibleEvents = [];
  const offEligible = runtime.events.on('command-spell:eligible', ({ payload }) => eligibleEvents.push(payload));

  let status = runtime.commandSpellIIIStatus();
  assert.equal(status.chapterReached, true);
  assert.equal(status.eligible, false);
  assert.equal(status.unlocked, false);
  assert.equal(status.autoNpFraction, 0);

  assert.equal(runtime.releaseNp().accepted, true);
  status = runtime.commandSpellIIIStatus();
  assert.equal(status.eligible, true);
  assert.equal(status.unlocked, false);
  assert.equal(status.pricePending, false);
  assert.equal(status.available, false);
  assert.equal(status.cost, 891n);
  assert.equal(runtime.buyCommandSpellIII().reason, 'insufficient-humanity-evil');
  assert.equal(eligibleEvents.length, 1);
  assert.equal(eligibleEvents[0].cost, 891n);
  assert.equal(eligibleEvents[0].pricePending, false);

  offEligible();
  runtime.destroy();
});

test('9U3 buys Command Spell III Lv.1, then Lv.2 returns to price-pending range state', () => {
  const initialState = createHydraIIIState({ np: 1, humanityEvil: 891n, autoSlash: true, attacksPerSecond: 9 });
  const runtime = createHydraIGameRuntime({ initialState });
  const availableEvents = [];
  const offAvailable = runtime.events.on('command-spell:available', ({ payload }) => {
    if (payload.id === 'command-spell-3') availableEvents.push(payload);
  });

  assert.equal(runtime.releaseNp().accepted, true);
  let status = runtime.commandSpellIIIStatus();
  assert.equal(status.available, true);
  assert.equal(status.cost, 891n);
  assert.equal(availableEvents.length, 1);

  const purchase = runtime.buyCommandSpellIII();
  assert.equal(purchase.accepted, true);
  assert.equal(purchase.level, 1);
  assert.equal(runtime.snapshot().master.humanityEvil, 0n);

  status = runtime.commandSpellIIIStatus();
  assert.equal(status.level, 1);
  assert.equal(status.autoNpFraction, 1 / 9);
  assert.equal(status.nextLevel, 2);
  assert.equal(status.pricePending, true);
  assert.equal(status.cost, null);
  assert.equal(status.available, false);
  assert.equal(runtime.buyCommandSpellIII().reason, 'price-pending');

  offAvailable();
  runtime.destroy();
});

test('base Hydra III NP still pauses Auto Slash before Command Spell III is acquired', () => {
  const initialState = createHydraIIIState({
    heads: 30n,
    np: 1,
    autoSlash: true,
    attacksPerSecond: 9,
  });
  const runtime = createHydraIGameRuntime({ initialState });
  const autoCuts = [];
  const offCut = runtime.events.on('head:cut', ({ payload }) => {
    if (payload.source === 'auto') autoCuts.push(payload);
  });

  assert.equal(runtime.releaseNp().accepted, true);
  runtime.advance(1000);
  assert.equal(autoCuts.length, 0);
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 30n);

  offCut();
  runtime.destroy();
});

for (const { level, expectedFraction, expectedCuts } of [
  { level: 1, expectedFraction: 1 / 9, expectedCuts: 1 },
  { level: 2, expectedFraction: 1 / 3, expectedCuts: 3 },
  { level: 3, expectedFraction: 1, expectedCuts: 9 },
]) {
  test(`Command Spell III Lv.${level} projects ${expectedCuts} APS worth of Auto into NP from 9 APS`, () => {
    const initialState = createHydraIIIState({
      heads: 40n,
      autoSlash: true,
      attacksPerSecond: 9,
    });
    const runtime = createHydraIGameRuntime({ initialState });
    runtime.testPresets.setCommandSpellIIILevel(level);
    runtime.testPresets.readyNp();

    const requests = [];
    const offRequest = runtime.events.on('attack:requested', ({ payload }) => {
      if (payload.source === 'auto') requests.push(payload);
    });

    const status = runtime.commandSpellIIIStatus();
    assert.equal(status.autoNpFraction, expectedFraction);
    assert.equal(status.autoNpAps, expectedCuts);
    assert.equal(runtime.releaseNp().accepted, true);

    runtime.advance(1000);
    const autoStrikes = requests.reduce((sum, request) => sum + request.strikeCount, 0);
    assert.equal(autoStrikes, expectedCuts);
    assert.equal(runtime.snapshot().hydra.logicalHeadCount, 40n - BigInt(expectedCuts));

    offRequest();
    runtime.destroy();
  });
}

test('Command Spell III automatic NP attacks never inherit Command Spell II manual x3', () => {
  const initialState = createHydraIIIState({
    heads: 30n,
    autoSlash: true,
    attacksPerSecond: 9,
  });
  const runtime = createHydraIGameRuntime({ initialState });
  runtime.testPresets.commandSpellIILv1();
  runtime.testPresets.setCommandSpellIIILevel(1);
  runtime.testPresets.readyNp();

  const autoRequests = [];
  const offRequest = runtime.events.on('attack:requested', ({ payload }) => {
    if (payload.source === 'auto') autoRequests.push(payload);
  });

  assert.equal(runtime.commandSpellIIStatus().npManualStrikeCount, 3);
  assert.equal(runtime.releaseNp().accepted, true);
  runtime.advance(1000);

  assert.equal(autoRequests.length, 1);
  assert.equal(autoRequests[0].strikeCount, 1);
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 29n);

  offRequest();
  runtime.destroy();
});

test('Command Spell III TEST progression changes no Humanity Evil, kill count, or Command Spell I APS', () => {
  const initialState = createHydraIIIState({ autoSlash: true, attacksPerSecond: 27 });
  initialState.master.humanityEvil = 4321n;
  const runtime = createHydraIGameRuntime({ initialState });
  const before = runtime.snapshot();

  runtime.testPresets.setCommandSpellIIILevel(1);
  runtime.testPresets.setCommandSpellIIILevel(2);
  runtime.testPresets.setCommandSpellIIILevel(3);

  const after = runtime.snapshot();
  assert.equal(after.master.humanityEvil, before.master.humanityEvil);
  assert.equal(after.statistics.totalHydrasKilled, before.statistics.totalHydrasKilled);
  assert.equal(after.berserker.baseAttacksPerSecond, 27);
  assert.equal(runtime.commandSpellIIIStatus().maxed, true);

  runtime.destroy();
});

test('Command Spell III fixed slot distinguishes reveal preview, revealed-poor and actually affordable', () => {
  const preview = projectCommandSpellIIISlot({
    chapterReached: true,
    eligible: false,
    unlocked: false,
    level: 0,
    maxed: false,
    pricePending: false,
    available: false,
    cost: 891n,
  });
  assert.deepEqual(preview, {
    state: 'preview',
    level: '—',
    meta: 'NP TO REVEAL',
    clickable: false,
  });

  const common = {
    chapterReached: true,
    eligible: true,
    unlocked: false,
    level: 0,
    maxed: false,
    pricePending: false,
    cost: 891n,
    autoNpNumerator: 0,
    autoNpDenominator: 1,
    autoNpAps: 0,
    nextAutoNpNumerator: 1,
    nextAutoNpDenominator: 9,
    nextAutoNpAps: 1,
  };

  const poor = projectCommandSpellIIISlot({ ...common, available: false });
  assert.equal(poor.state, 'owned-dim');
  assert.equal(poor.level, 'NEW');
  assert.equal(poor.meta, '891 人類惡');
  assert.equal(poor.clickable, true);

  const ready = projectCommandSpellIIISlot({ ...common, available: true });
  assert.equal(ready.state, 'available');
  assert.equal(ready.level, 'NEW');
  assert.equal(ready.meta, '891 人類惡');
});

test('Tree View is a right-side Scene 2 drawer above the globally fixed bottom action bar', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const treeSource = await readFile(new URL('../js/view/tree-view.js', import.meta.url), 'utf8');
  const hudSource = await readFile(new URL('../js/view/hud-view.js', import.meta.url), 'utf8');
  const panelSource = await readFile(new URL('../js/view/command-spell-panel.js', import.meta.url), 'utf8');

  assert.match(html, /data-tree-view-toggle/);
  assert.match(html, /data-tree-view-overlay/);
  assert.match(html, /data-tree-view-scene/);
  assert.match(html, /data-tree-view-close/);
  assert.match(html, /TREE[\s\S]*◀/);
  assert.match(html, /▶[\s\S]*TREE/);
  assert.match(html, /data-bottom-hud/);
  assert.match(html, /data-tree-view-logical/);
  assert.match(html, /data-tree-view-overflow/);
  assert.match(html, /data-np-button-label/);
  assert.match(html, /data-test-command-spell-iii/);
  assert.match(html, /data-test-hydra-iii-99/);
  assert.match(html, /THE NUMBER ESCAPED THE MONSTER/);

  assert.match(css, /\.tree-view-overlay\s*\{[\s\S]*transform:\s*translateX\(100%\)/);
  assert.match(css, /\.tree-view-overlay\[data-open="true"\]\s*\{[\s\S]*transform:\s*translateX\(0\)/);
  assert.match(css, /bottom:\s*calc\(var\(--bottom-hud-height\) \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /\.bottom-hud\s*\{[\s\S]*z-index:\s*100/);

  assert.match(appSource, /createTreeView/);
  assert.match(appSource, /autoNpStatus:\s*spellIII/);
  assert.doesNotMatch(appSource, /unbindTreeViewBackdrop/);
  assert.doesNotMatch(appSource, /bindModalBackdropClose\(treeView/);
  assert.match(treeSource, /overlay\.dataset\.open/);
  assert.match(treeSource, /root\.classList\.toggle\('tree-open'/);
  assert.doesNotMatch(treeSource, /from ['"]\.\.\/systems\//);
  assert.doesNotMatch(treeSource, /from ['"]\.\.\/core\//);
  assert.doesNotMatch(treeSource, /state\.update/);

  assert.match(hudSource, /npButtonLabel\.textContent/);
  assert.doesNotMatch(hudSource, /npButton\.textContent\s*=/);
  assert.match(panelSource, /NP TO REVEAL/);
  assert.match(panelSource, /「這裡怎麼沒有 SKIP\?\?\?」/);
});

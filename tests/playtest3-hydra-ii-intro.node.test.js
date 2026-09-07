import test from 'node:test';
import assert from 'node:assert/strict';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { createInitialState } from '../js/core/state.js';
import { createHydraIIRule } from '../js/math/hydra-rules.js';
import { applyCutResolution } from '../js/math/hydra-model.js';
import { HYDRA_GENERATIONS } from '../js/data/progression.js';

test('generation data follows 9^n head caps for Hydra I-III', () => {
  assert.equal(HYDRA_GENERATIONS[1].startingHeads, 9n);
  assert.equal(HYDRA_GENERATIONS[1].maxHeads, 9n);
  assert.equal(HYDRA_GENERATIONS[2].startingHeads, 9n);
  assert.equal(HYDRA_GENERATIONS[2].maxHeads, 81n);
  assert.equal(HYDRA_GENERATIONS[3].startingHeads, 9n);
  assert.equal(HYDRA_GENERATIONS[3].maxHeads, 729n);
  assert.equal(HYDRA_GENERATIONS[1].killsToNextGeneration, 99n);
  assert.equal(HYDRA_GENERATIONS[2].killsToNextGeneration, 99n);
});

test('Hydra II pure rule turns one normal cut into immediate net +1 head', () => {
  const rule = createHydraIIRule({ maxHeadCount: 81n });
  const state = createInitialState();
  state.hydra.generation = 2;
  state.progression.hydraGeneration = 2;

  const resolution = rule.resolveCut({
    hydraState: state.hydra,
    attack: { headsPerStrike: 1n },
    turn: 0n,
    nowMs: 0,
  });

  assert.equal(resolution.accepted, true);
  assert.equal(resolution.headsRemoved, 1n);
  assert.equal(resolution.headsSpawned, 2n);
  assert.equal(resolution.regrowth.length, 0);
  assert.equal(resolution.killed, false);

  applyCutResolution(state, resolution);
  assert.equal(state.hydra.logicalHeadCount, 10n);
});

test('Hydra II cannot grow past its logical 81-head cap', () => {
  const rule = createHydraIIRule({ maxHeadCount: 81n });
  const state = createInitialState();
  state.hydra.generation = 2;
  state.progression.hydraGeneration = 2;
  state.hydra.logicalHeadCount = 81n;

  const resolution = rule.resolveCut({
    hydraState: state.hydra,
    attack: { headsPerStrike: 1n },
    turn: 0n,
    nowMs: 0,
  });

  assert.equal(resolution.headsRemoved, 1n);
  assert.equal(resolution.headsSpawned, 1n);
  applyCutResolution(state, resolution);
  assert.equal(state.hydra.logicalHeadCount, 81n);
});

test('Hydra II becomes killable when head growth is suppressed', () => {
  const rule = createHydraIIRule({ maxHeadCount: 81n });
  const state = createInitialState();
  state.hydra.generation = 2;
  state.progression.hydraGeneration = 2;
  state.hydra.logicalHeadCount = 1n;

  const resolution = rule.resolveCut({
    hydraState: state.hydra,
    attack: { headsPerStrike: 1n },
    turn: 0n,
    nowMs: 0,
    ruleContext: { headGrowthEnabled: false },
  });

  assert.equal(resolution.headsRemoved, 1n);
  assert.equal(resolution.headsSpawned, 0n);
  assert.equal(resolution.depleted, true);
  assert.equal(resolution.killed, true);

  applyCutResolution(state, resolution);
  assert.equal(state.hydra.logicalHeadCount, 0n);
});

test('the 99th Hydra I kill transitions into Hydra II after the encounter gap', () => {
  const initialState = createInitialState();
  initialState.hydra.logicalHeadCount = 1n;
  initialState.statistics.totalHydrasKilled = 98n;
  initialState.master.commandSpells.autoSlash = true;
  initialState.berserker.baseAttacksPerSecond = 64;
  initialState.progression.milestones = [
    'command-spell-1-lv2',
    'command-spell-1-lv3',
    'command-spell-1-lv4',
    'command-spell-1-lv5',
    'command-spell-1-lv6',
    'command-spell-1-lv7',
  ];

  const runtime = createHydraIGameRuntime({ initialState, regenDelayMs: 10000 });
  runtime.manualAttack();

  let snapshot = runtime.snapshot();
  assert.equal(snapshot.statistics.totalHydrasKilled, 99n);
  assert.equal(snapshot.hydra.generation, 1);
  assert.equal(snapshot.hydra.defeated, true);

  runtime.advance(300);
  snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.generation, 2);
  assert.equal(snapshot.progression.hydraGeneration, 2);
  assert.equal(snapshot.hydra.encounter, 1n);
  assert.equal(snapshot.hydra.logicalHeadCount, 9n);
  assert.equal(snapshot.hydra.defeated, false);

  runtime.destroy();
});

test('Hydra II pauses Auto Slash until the player makes the first manual cut', () => {
  const initialState = createInitialState();
  initialState.hydra.generation = 2;
  initialState.progression.hydraGeneration = 2;
  initialState.statistics.totalHydrasKilled = 99n;
  initialState.master.commandSpells.autoSlash = true;
  initialState.berserker.baseAttacksPerSecond = 64;

  const runtime = createHydraIGameRuntime({ initialState });
  runtime.advance(500);
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 9n);

  runtime.manualAttack();
  let snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.logicalHeadCount, 10n);
  assert.ok(snapshot.progression.milestones.includes('hydra-ii-first-manual-cut'));

  runtime.advance(100);
  snapshot = runtime.snapshot();
  assert.ok(snapshot.hydra.logicalHeadCount > 10n);
  assert.equal(snapshot.hydra.logicalHeadCount <= 81n, true);
  assert.equal(snapshot.hydra.generation, 2);
  assert.equal(snapshot.hydra.defeated, false);

  runtime.destroy();
});

test('NP head-growth suppression turns Hydra II cuts into net -1 and can kill it', () => {
  const initialState = createInitialState();
  initialState.hydra.generation = 2;
  initialState.progression.hydraGeneration = 2;
  initialState.statistics.totalHydrasKilled = 99n;
  initialState.berserker.np = 1;
  initialState.progression.milestones.push('hydra-ii-first-manual-cut');

  const runtime = createHydraIGameRuntime({ initialState });
  assert.equal(runtime.releaseNp().accepted, true);

  for (let i = 0; i < 9; i += 1) runtime.manualAttack();

  const snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.logicalHeadCount, 0n);
  assert.equal(snapshot.hydra.defeated, true);
  assert.equal(snapshot.statistics.totalHydrasKilled, 100n);

  runtime.destroy();
});

test('a killed Hydra II respawns as the next Hydra II until encounter 99', () => {
  const initialState = createInitialState();
  initialState.hydra.generation = 2;
  initialState.progression.hydraGeneration = 2;
  initialState.hydra.encounter = 1n;
  initialState.hydra.logicalHeadCount = 1n;
  initialState.statistics.totalHydrasKilled = 99n;
  initialState.berserker.np = 1;
  initialState.progression.milestones.push('hydra-ii-first-manual-cut');

  const runtime = createHydraIGameRuntime({ initialState });
  runtime.releaseNp();
  runtime.manualAttack();
  runtime.advance(100);

  const snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.generation, 2);
  assert.equal(snapshot.hydra.encounter, 2n);
  assert.equal(snapshot.hydra.logicalHeadCount, 9n);

  runtime.destroy();
});

test('killing Hydra II encounter 99 enters a playable 9-head Hydra III capped at 729', () => {
  const initialState = createInitialState();
  initialState.hydra.generation = 2;
  initialState.progression.hydraGeneration = 2;
  initialState.hydra.encounter = 99n;
  initialState.hydra.logicalHeadCount = 1n;
  initialState.statistics.totalHydrasKilled = 197n;
  initialState.berserker.np = 1;
  initialState.master.commandSpells.autoSlash = true;
  initialState.berserker.baseAttacksPerSecond = 64;
  initialState.progression.milestones.push('hydra-ii-first-manual-cut');

  const runtime = createHydraIGameRuntime({ initialState });
  runtime.releaseNp();
  runtime.manualAttack();

  let snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.defeated, true);
  assert.equal(snapshot.statistics.totalHydrasKilled, 198n);

  runtime.advance(100);
  snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.generation, 3);
  assert.equal(snapshot.progression.hydraGeneration, 3);
  assert.equal(snapshot.hydra.encounter, 1n);
  assert.equal(snapshot.hydra.logicalHeadCount, 9n);
  assert.equal(runtime.rules.III.maxHeadCount, 729n);

  // The NP window survives the generation cut. CS III is not owned yet, so
  // Auto remains paused, but manual Hydra III cuts are now real and net -1.
  runtime.manualAttack();
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 8n);

  runtime.destroy();
});

test('a legacy live Hydra I save already at 99 kills enters Hydra II on next tick', () => {
  const initialState = createInitialState();
  initialState.statistics.totalHydrasKilled = 99n;

  const runtime = createHydraIGameRuntime({ initialState });
  runtime.advance(100);

  const snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.generation, 2);
  assert.equal(snapshot.hydra.logicalHeadCount, 9n);
  assert.equal(snapshot.hydra.encounter, 1n);

  runtime.destroy();
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { createInitialState } from '../js/core/state.js';
import { createHydraIIRule } from '../js/math/hydra-rules.js';
import { applyCutResolution } from '../js/math/hydra-model.js';

test('Hydra II pure rule turns one cut into immediate net +1 head', () => {
  const rule = createHydraIIRule();
  const state = createInitialState();
  state.hydra.generation = 2;
  state.progression.hydraGeneration = 2;

  const resolution = rule.resolveCut({
    hydraState: state.hydra,
    attack: { headsPerStrike: 1n },
    turn: 0n,
    nowMs: 0,
    ruleContext: { regrowthEnabled: false },
  });

  assert.equal(resolution.accepted, true);
  assert.equal(resolution.headsRemoved, 1n);
  assert.equal(resolution.headsSpawned, 2n);
  assert.equal(resolution.regrowth.length, 0);
  assert.equal(resolution.killed, false);

  applyCutResolution(state, resolution);
  assert.equal(state.hydra.logicalHeadCount, 10n);
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
  assert.equal(snapshot.hydra.generation, 2);
  assert.equal(snapshot.hydra.defeated, false);

  runtime.destroy();
});

test('NP regrowth suppression does not cancel Hydra II structural grow-two rule', () => {
  const initialState = createInitialState();
  initialState.hydra.generation = 2;
  initialState.progression.hydraGeneration = 2;
  initialState.statistics.totalHydrasKilled = 99n;
  initialState.berserker.np = 1;

  const runtime = createHydraIGameRuntime({ initialState });
  assert.equal(runtime.releaseNp().accepted, true);
  runtime.manualAttack();

  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 10n);
  assert.equal(runtime.snapshot().modifiers.active.length, 1);

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

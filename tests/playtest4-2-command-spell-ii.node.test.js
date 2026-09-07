import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { createInitialState } from '../js/core/state.js';

function createHydraIIState() {
  const state = createInitialState();
  state.hydra.generation = 2;
  state.hydra.encounter = 1n;
  state.hydra.logicalHeadCount = 9n;
  state.hydra.startingHeadCount = 9n;
  state.progression.hydraGeneration = 2;
  state.progression.milestones.push('hydra-ii-first-manual-cut');
  return state;
}

test('NP window exposes a GameClock-derived tenths-ready countdown status', () => {
  const initialState = createHydraIIState();
  initialState.berserker.np = 1;
  const runtime = createHydraIGameRuntime({ initialState, npDurationMs: 3000 });

  assert.equal(runtime.releaseNp().accepted, true);
  assert.deepEqual(runtime.npWindowStatus(), {
    active: true,
    startsAt: 0,
    endsAt: 3000,
    remainingMs: 3000,
  });

  runtime.advance(100);
  assert.equal(runtime.npWindowStatus().remainingMs, 2900);
  runtime.advance(1000);
  assert.equal(runtime.npWindowStatus().remainingMs, 1900);

  runtime.advance(1000);
  runtime.advance(900);
  assert.deepEqual(runtime.npWindowStatus(), {
    active: false,
    startsAt: null,
    endsAt: null,
    remainingMs: 0,
  });

  runtime.destroy();
});

test('Command Spell II prototype is NP-only: outside NP one manual tap remains one cut', () => {
  const runtime = createHydraIGameRuntime({ initialState: createHydraIIState() });
  runtime.testPresets.commandSpellIILv1();
  const cuts = [];
  const offCut = runtime.events.on('head:cut', ({ payload }) => cuts.push(payload));

  const request = runtime.manualAttack();
  assert.equal(request.strikeCount, 1);
  assert.equal(cuts.length, 1);
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 10n);

  offCut();
  runtime.destroy();
});

test('Command Spell II Lv.1 turns one NP manual tap into three separately resolved cuts', () => {
  const initialState = createHydraIIState();
  initialState.berserker.np = 1;
  const runtime = createHydraIGameRuntime({ initialState });
  runtime.testPresets.commandSpellIILv1();
  const cuts = [];
  const resolved = [];
  const offCut = runtime.events.on('head:cut', ({ payload }) => cuts.push(payload));
  const offResolved = runtime.events.on('attack:resolved', ({ payload }) => resolved.push(payload));

  runtime.releaseNp();
  const request = runtime.manualAttack();

  assert.equal(request.source, 'manual');
  assert.equal(request.strikeCount, 3);
  assert.equal(cuts.length, 3);
  assert.equal(resolved.length, 3);
  assert.deepEqual(resolved.map((entry) => entry.strikeIndex), [0, 1, 2]);
  assert.deepEqual(cuts.map((entry) => entry.spawned), [0n, 0n, 0n]);
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 6n);

  offResolved();
  offCut();
  runtime.destroy();
});

test('Hydra II cap preset isolates the intended 81-head NP technique playtest', () => {
  const runtime = createHydraIGameRuntime();
  runtime.testPresets.commandSpellIILv1();
  const cap = runtime.testPresets.startHydraIIAtCap();

  let snapshot = runtime.snapshot();
  assert.equal(cap.preset, 'hydra-ii-at-cap');
  assert.equal(cap.heads, 81n);
  assert.equal(snapshot.hydra.generation, 2);
  assert.equal(snapshot.hydra.logicalHeadCount, 81n);
  assert.equal(snapshot.hydra.encounter, 1n);
  assert.ok(snapshot.progression.milestones.includes('hydra-ii-first-manual-cut'));
  assert.equal(runtime.commandSpellIIPrototypeStatus().unlocked, true);

  runtime.testPresets.readyNp();
  assert.equal(runtime.releaseNp().accepted, true);
  runtime.manualAttack();
  snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.logicalHeadCount, 78n);

  runtime.destroy();
});

test('Command Spell II TEST preset is session-style progression only and invents no economy', () => {
  const runtime = createHydraIGameRuntime();
  const before = runtime.snapshot();
  const result = runtime.testPresets.commandSpellIILv1();
  const after = runtime.snapshot();

  assert.equal(result.preset, 'command-spell-ii-lv1');
  assert.equal(result.npManualStrikeCount, 3);
  assert.equal(runtime.commandSpellIIPrototypeStatus().unlocked, true);
  assert.equal(after.statistics.totalHydrasKilled, before.statistics.totalHydrasKilled);
  assert.equal(after.master.humanityEvil, before.master.humanityEvil);
  assert.equal(after.berserker.baseAttacksPerSecond, before.berserker.baseAttacksPerSecond);

  runtime.destroy();
});

test('player shell exposes compact NP timing and non-persistent Playtest 4.2 controls', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const timerSource = await readFile(new URL('../js/view/np-timer-view.js', import.meta.url), 'utf8');

  assert.match(html, /data-np-timer/);
  assert.match(html, /data-np-timer-value/);
  assert.match(html, /data-test-command-spell-ii/);
  assert.match(html, /data-test-hydra-ii-cap/);
  assert.match(css, /\.np-timer[\s\S]*pointer-events:\s*none/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.match(appSource, /runtime\.npWindowStatus\(\)/);
  assert.match(appSource, /runtime\.testPresets\.commandSpellIILv1\(\)/);
  assert.match(appSource, /runtime\.testPresets\.startHydraIIAtCap\(\)/);
  assert.match(appSource, /enterNonPersistentTestSession\(\)/);
  assert.match(timerSource, /toFixed\(1\)/);
  assert.doesNotMatch(timerSource, /setTimeout/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { createInitialState } from '../js/core/state.js';

function createHydraIIState({ autoSlash = false, attacksPerSecond = 1 } = {}) {
  const state = createInitialState();
  state.hydra.generation = 2;
  state.hydra.encounter = 1n;
  state.hydra.logicalHeadCount = 9n;
  state.hydra.startingHeadCount = 9n;
  state.progression.hydraGeneration = 2;
  state.progression.milestones.push('hydra-ii-first-manual-cut');
  state.master.commandSpells.autoSlash = autoSlash;
  state.berserker.baseAttacksPerSecond = attacksPerSecond;
  state.berserker.np = 1;
  return state;
}

test('active NP time stop pauses Auto Slash while manual cuts remain accepted', () => {
  const initialState = createHydraIIState({ autoSlash: true, attacksPerSecond: 8 });
  const runtime = createHydraIGameRuntime({ initialState, npDurationMs: 3000 });
  const cuts = [];
  const offCut = runtime.events.on('head:cut', ({ payload }) => cuts.push(payload));

  assert.equal(runtime.releaseNp().accepted, true);
  assert.equal(runtime.isNpActive(), true);

  runtime.advance(1000);
  assert.equal(cuts.length, 0, 'Auto Slash must not cut during NP time stop');
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 9n);

  runtime.manualAttack();
  assert.equal(cuts.length, 1);
  assert.equal(cuts[0].source, 'manual');
  assert.equal(cuts[0].spawned, 0n);
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 8n);

  runtime.advance(1900);
  assert.equal(cuts.length, 1, 'Auto Slash remains paused for the full active NP window');
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 8n);

  offCut();
  runtime.destroy();
});

test('NP expiry emits time-resume semantics without restoring heads cut during the window', () => {
  const initialState = createHydraIIState();
  const runtime = createHydraIGameRuntime({ initialState, npDurationMs: 3000 });
  const ended = [];
  const cuts = [];
  const offEnded = runtime.events.on('np:ended', ({ payload }) => ended.push(payload));
  const offCut = runtime.events.on('head:cut', ({ payload }) => cuts.push(payload));

  runtime.releaseNp();
  runtime.manualAttack();
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 8n);

  runtime.advance(3000);
  assert.equal(runtime.isNpActive(), false);
  assert.equal(ended.length, 1);
  assert.equal(ended[0].atMs, 3000);
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 8n, 'NP cuts are not deferred debt');

  runtime.manualAttack();
  assert.equal(cuts.at(-1).spawned, 2n, 'normal Hydra II growth resumes on the next ordinary cut');
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 9n);

  offEnded();
  offCut();
  runtime.destroy();
});

test('Auto Slash resumes after NP expires instead of remaining permanently disabled', () => {
  const initialState = createHydraIIState({ autoSlash: true, attacksPerSecond: 1 });
  const runtime = createHydraIGameRuntime({ initialState, npDurationMs: 3000 });
  const autoCuts = [];
  const offCut = runtime.events.on('head:cut', ({ payload }) => {
    if (payload.source === 'auto') autoCuts.push(payload);
  });

  runtime.releaseNp();
  runtime.advance(2900);
  assert.equal(autoCuts.length, 0);

  runtime.advance(100);
  assert.equal(runtime.isNpActive(), false);
  assert.equal(autoCuts.length, 0, 'expiry tick only begins accumulating Auto Slash again at 1 APS');

  runtime.advance(900);
  assert.equal(autoCuts.length, 1);
  assert.equal(autoCuts[0].spawned, 2n);
  assert.equal(runtime.snapshot().hydra.logicalHeadCount, 10n);

  offCut();
  runtime.destroy();
});

test('NP time-stop presentation is semantic-event driven and never blocks manual tapping', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const phaseSource = await readFile(new URL('../js/view/np-phase-view.js', import.meta.url), 'utf8');
  const hudSource = await readFile(new URL('../js/view/hud-view.js', import.meta.url), 'utf8');

  assert.match(html, /data-np-phase/);
  assert.match(html, /寶具解放/);
  assert.match(html, /ナインライブズ/);
  assert.match(html, /射殺す百頭/);
  assert.match(css, /\.np-phase[\s\S]*pointer-events:\s*none/);
  assert.match(css, /np-release-card/);
  assert.match(css, /np-resume-card/);
  assert.match(phaseSource, /animationend/);
  assert.doesNotMatch(phaseSource, /setTimeout/);
  assert.match(appSource, /events\.on\('np:released'/);
  assert.match(appSource, /events\.on\('np:ended'/);
  assert.match(appSource, /runtime\.isNpActive\(\)/);
  assert.match(hudSource, /PAUSED · NP/);
  assert.match(hudSource, /寶具解放/);
});

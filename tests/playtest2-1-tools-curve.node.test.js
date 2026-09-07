import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createHydraIGameRuntime } from '../js/core/game.js';
import { getHydraIRegenDelayMs } from '../js/data/progression.js';

test('Hydra I regeneration curve hits 350ms at kill 9 then flattens toward the 100ms floor', () => {
  assert.equal(getHydraIRegenDelayMs(0n), 1500);
  assert.equal(getHydraIRegenDelayMs(9n), 350);
  assert.equal(getHydraIRegenDelayMs(30n), 247);
  assert.equal(getHydraIRegenDelayMs(99n), 100);
  assert.equal(getHydraIRegenDelayMs(999999999999n), 100);
});

test('default Hydra I runtime injects the current kill-based regen delay into new cuts', () => {
  const runtime = createHydraIGameRuntime();
  runtime.state.update((draft) => {
    draft.statistics.totalHydrasKilled = 30n;
  });

  assert.equal(runtime.currentRegenDelayMs(), 247);
  runtime.manualAttack();

  const snapshot = runtime.snapshot();
  assert.equal(snapshot.hydra.pendingRegrowth.length, 1);
  assert.equal(snapshot.hydra.pendingRegrowth[0].executeAt, 247);

  runtime.destroy();
});

test('explicit regenDelayMs remains a deterministic test override', () => {
  const runtime = createHydraIGameRuntime({ regenDelayMs: 432 });
  runtime.state.update((draft) => {
    draft.statistics.totalHydrasKilled = 99n;
  });

  assert.equal(runtime.currentRegenDelayMs(), 432);
  runtime.manualAttack();
  assert.equal(runtime.snapshot().hydra.pendingRegrowth[0].executeAt, 432);

  runtime.destroy();
});

test('Playtest tools expose regen readout and reset save without direct gameplay mutation', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(html, /data-test-tools-toggle/);
  assert.match(html, /data-test-regen-delay/);
  assert.match(html, /data-reset-save/);
  assert.match(appSource, /saveStore\?\.clear\(\)/);
  assert.match(appSource, /suppressPersistence\s*=\s*true/);
  assert.match(appSource, /if \(suppressPersistence \|\| !saveStore\) return false/);
  assert.doesNotMatch(appSource, /totalHydrasKilled\s*[+\-]?=/);
  assert.doesNotMatch(appSource, /humanityEvil\s*[+\-]?=/);
});

test('NP presentation uses a View-only red tint driven from the runtime active window', async () => {
  const stageSource = await readFile(new URL('../js/view/battle-scene.js', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(stageSource, /setNpActive/);
  assert.match(stageSource, /scene\.clearColor\.copyFromFloats\(0\.075, 0\.018, 0\.022, 1\)/);
  assert.match(appSource, /const npWindow = runtime\.npWindowStatus\(\)/);
  assert.match(appSource, /const npActive = npWindow\.active/);
  assert.match(appSource, /stage\.setNpActive\(npActive\)/);
  assert.doesNotMatch(stageSource, /from ['"]\.\.\/systems\//);
  assert.doesNotMatch(stageSource, /from ['"]\.\.\/math\//);
});

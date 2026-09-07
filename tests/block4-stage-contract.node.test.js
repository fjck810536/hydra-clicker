import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { BATTLE_STAGE_SPEC } from '../js/view/battle-scene.js';

test('portrait battle composition keeps Berserker left of Hydra', () => {
  assert.ok(BATTLE_STAGE_SPEC.berserkerAnchor.x < 0);
  assert.ok(BATTLE_STAGE_SPEC.hydraAnchor.x > 0);
  assert.ok(BATTLE_STAGE_SPEC.berserkerAnchor.x < BATTLE_STAGE_SPEC.hydraAnchor.x);
  assert.ok(BATTLE_STAGE_SPEC.virtualHeight > 0);
});

test('index loads Babylon before the module app and locks viewport scaling', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  const babylonIndex = html.indexOf('https://cdn.babylonjs.com/babylon.js');
  const appIndex = html.indexOf('type="module" src="js/app.js"');

  assert.ok(babylonIndex >= 0, 'Babylon CDN script must be present.');
  assert.ok(appIndex > babylonIndex, 'Babylon must load before app.js.');
  assert.match(html, /maximum-scale=1/);
  assert.match(html, /user-scalable=no/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /id="battle-canvas"/);
  assert.match(html, /data-fixed-control/);
});

test('iOS portrait shell prevents page scroll and fixed battle-control zoom gestures', async () => {
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /overflow:\s*hidden/);
  assert.match(css, /overscroll-behavior:\s*none/);
  assert.match(css, /\.battle-canvas[\s\S]*touch-action:\s*none/);
  assert.match(css, /\.command-spell-slot[\s\S]*touch-action:\s*none/);
  assert.match(css, /\.np-button[\s\S]*touch-action:\s*none/);
  assert.match(css, /\.command-spell-modal-purchase[\s\S]*pointer-events:\s*auto/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /orientation:\s*landscape/);

  assert.match(appSource, /bindFixedControl/);
  assert.match(appSource, /addEventListener\('pointerup'/);
  assert.match(appSource, /addEventListener\('dblclick'/);
  assert.match(appSource, /event\.preventDefault\(\)/);
});

test('view layer does not import Hydra math or gameplay systems directly', async () => {
  const stageSource = await readFile(new URL('../js/view/battle-scene.js', import.meta.url), 'utf8');
  const hudSource = await readFile(new URL('../js/view/hud-view.js', import.meta.url), 'utf8');
  const commandSpellSource = await readFile(new URL('../js/view/command-spell-panel.js', import.meta.url), 'utf8');

  for (const source of [stageSource, hudSource, commandSpellSource]) {
    assert.doesNotMatch(source, /from ['"]\.\.\/math\//);
    assert.doesNotMatch(source, /from ['"]\.\.\/systems\//);
  }
});

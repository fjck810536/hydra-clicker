import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { resolveRuleContext } from '../js/systems/modifiers.js';

test('NP uses a generic timed head-growth rule modifier rather than a character-specific branch', () => {
  const context = resolveRuleContext([
    {
      id: 'np-test',
      type: 'rule-modifier',
      target: 'hydra.headGrowth',
      effect: 'disable',
      startsAt: 100,
      endsAt: 500,
      source: 'np',
    },
  ], 250);

  assert.equal(context.headGrowthEnabled, false);
  assert.equal(context.regrowthEnabled, false);
  assert.equal(resolveRuleContext([], 250).headGrowthEnabled, true);
});

test('legacy hydra.regrowth modifier remains a compatibility alias for head-growth suppression', () => {
  const context = resolveRuleContext([
    {
      id: 'legacy-np-test',
      type: 'rule-modifier',
      target: 'hydra.regrowth',
      effect: 'disable',
      startsAt: 0,
      endsAt: 500,
      source: 'np',
    },
  ], 250);

  assert.equal(context.headGrowthEnabled, false);
  assert.equal(context.regrowthEnabled, false);
});

test('portrait shell exposes an NP control without reopening page scrolling', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');

  assert.match(html, /data-hud="np"/);
  assert.match(html, /data-np-button/);
  assert.match(css, /\.np-button[\s\S]*pointer-events:\s*auto/);
  assert.match(css, /html,[\s\S]*body[\s\S]*overflow:\s*hidden/);
});

test('READY NP stays releasable during the defeated respawn gap', async () => {
  const hudSource = await readFile(new URL('../js/view/hud-view.js', import.meta.url), 'utf8');

  assert.match(hudSource, /npButton\.disabled\s*=\s*!npGauge\.ready/);
  assert.doesNotMatch(hudSource, /npButton\.disabled\s*=\s*!npGauge\.ready\s*\|\|\s*snapshot\.hydra\.defeated/);
});

test('UI requests NP release through runtime API and does not mutate Hydra state directly', async () => {
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const hudSource = await readFile(new URL('../js/view/hud-view.js', import.meta.url), 'utf8');

  assert.match(appSource, /runtime\.releaseNp\(\)/);
  assert.doesNotMatch(appSource, /logicalHeadCount\s*[-+]?=/);
  assert.doesNotMatch(hudSource, /from ['"]\.\.\/systems\//);
  assert.doesNotMatch(hudSource, /from ['"]\.\.\/math\//);
});

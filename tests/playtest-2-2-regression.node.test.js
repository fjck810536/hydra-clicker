import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  HYDRA_I_REGEN_CURVE,
  getHydraIRegenDelayMs,
} from '../js/data/progression.js';

test('Hydra I regen curve reaches 350ms on kill 9 and 100ms floor on kill 99', () => {
  assert.equal(HYDRA_I_REGEN_CURVE.baseDelayMs, 1500);
  assert.equal(HYDRA_I_REGEN_CURVE.kill9DelayMs, 350);
  assert.equal(HYDRA_I_REGEN_CURVE.minDelayMs, 100);
  assert.equal(getHydraIRegenDelayMs(0n), 1500);
  assert.equal(getHydraIRegenDelayMs(9n), 350);
  assert.equal(getHydraIRegenDelayMs(99n), 100);
  assert.equal(getHydraIRegenDelayMs(999999n), 100);
});

test('post-kill-9 regen acceleration keeps improving but each kill has diminishing impact', () => {
  const delays = [];
  for (let kill = 9n; kill <= 99n; kill += 1n) {
    delays.push(getHydraIRegenDelayMs(kill));
  }

  for (let index = 1; index < delays.length; index += 1) {
    assert.ok(delays[index] <= delays[index - 1], 'regen delay must never get slower');
  }

  const earlyGain = delays[0] - delays[1];
  const lateGain = delays[80] - delays[81];
  assert.ok(earlyGain > lateGain, 'per-kill speed gain should flatten toward kill 99');
});

test('pre-kill-9 curve accelerates quickly and lands exactly on the milestone', () => {
  const expected = [1500, 1276, 1086, 923, 786, 668, 569, 484, 411, 350];
  const actual = expected.map((_, kill) => getHydraIRegenDelayMs(BigInt(kill)));
  assert.deepEqual(actual, expected);
});

test('iOS battle shell owns touchend and gesture defaults instead of only individual controls', async () => {
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(appSource, /bindBattleShellGestureLock/);
  assert.match(appSource, /addEventListener\('touchend',[\s\S]*capture:\s*true/);
  assert.match(appSource, /addEventListener\('touchmove',[\s\S]*capture:\s*true/);
  assert.match(appSource, /addEventListener\('gesturestart',[\s\S]*capture:\s*true/);
  assert.match(css, /body[\s\S]*touch-action:\s*none/);
  assert.match(css, /\.game-shell[\s\S]*touch-action:\s*none/);
  assert.match(html, /minimum-scale=1/);
  assert.match(html, /maximum-scale=1/);
  assert.match(html, /user-scalable=no/);
});

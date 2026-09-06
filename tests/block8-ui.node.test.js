import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { HYDRA_I_PROGRESSION } from '../js/data/progression.js';

test('Block 8 tuning lives in Data and reaches 99 Humanity Evil on the ninth kill', () => {
  assert.equal(HYDRA_I_PROGRESSION.humanityEvilPerKill, 11n);
  assert.equal(HYDRA_I_PROGRESSION.commandSpellI.requiredHydraKills, 9n);
  assert.equal(HYDRA_I_PROGRESSION.commandSpellI.cost.amount, 99n);
  assert.equal(
    HYDRA_I_PROGRESSION.humanityEvilPerKill * HYDRA_I_PROGRESSION.commandSpellI.requiredHydraKills,
    HYDRA_I_PROGRESSION.commandSpellI.cost.amount,
  );
});

test('portrait shell exposes progression controls without reopening page scroll', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');

  assert.match(html, /data-hud="kills"/);
  assert.match(html, /data-hud="humanity-evil"/);
  assert.match(html, /data-command-spell-button/);
  assert.match(css, /overflow:\s*hidden/);
  assert.match(css, /\.command-spell-button[\s\S]*pointer-events:\s*auto/);
});

test('UI purchases Command Spell through runtime API rather than mutating logical state', async () => {
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const hudSource = await readFile(new URL('../js/view/hud-view.js', import.meta.url), 'utf8');

  assert.match(appSource, /runtime\.buyCommandSpellI\(\)/);
  assert.match(appSource, /runtime\.commandSpellIStatus\(\)/);
  assert.doesNotMatch(appSource, /state\.update/);
  assert.doesNotMatch(appSource, /logicalHeadCount\s*=/);
  assert.doesNotMatch(hudSource, /from ['"]\.\.\/systems\//);
  assert.doesNotMatch(hudSource, /from ['"]\.\.\/math\//);
});

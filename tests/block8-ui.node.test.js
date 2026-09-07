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

test('portrait shell exposes fixed three-slot progression controls without reopening page scroll', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');

  assert.match(html, /data-hud="kills"/);
  assert.match(html, /data-hud="humanity-evil"/);
  assert.match(html, /data-command-spell-panel/);
  assert.match(html, /data-command-spell-slot="1"/);
  assert.match(html, /data-command-spell-slot="2"/);
  assert.match(html, /data-command-spell-slot="3"/);
  assert.match(html, /data-command-spell-modal/);
  assert.match(html, /data-command-spell-purchase/);
  assert.match(css, /overflow:\s*hidden/);
  assert.match(css, /\.command-spell-slot[\s\S]*pointer-events:\s*auto/);
  assert.match(css, /\.command-spell-slot[\s\S]*touch-action:\s*none/);
});

test('Command Spell detail modal purchases through runtime APIs rather than mutating logical state', async () => {
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const hudSource = await readFile(new URL('../js/view/hud-view.js', import.meta.url), 'utf8');
  const panelSource = await readFile(new URL('../js/view/command-spell-panel.js', import.meta.url), 'utf8');

  assert.match(appSource, /commandSpellPanel\.open\(1\)/);
  assert.match(appSource, /commandSpellPanel\.open\(2\)/);
  assert.match(appSource, /commandSpellPanel\.currentOpenSpellId\(\)/);
  assert.match(appSource, /runtime\.buyCommandSpellI\(\)/);
  assert.match(appSource, /runtime\.buyCommandSpellII\(\)/);
  assert.match(appSource, /runtime\.commandSpellIStatus\(\)/);
  assert.match(appSource, /runtime\.commandSpellIIStatus\(\)/);
  assert.doesNotMatch(appSource, /state\.update/);
  assert.doesNotMatch(appSource, /logicalHeadCount\s*=/);

  for (const source of [hudSource, panelSource]) {
    assert.doesNotMatch(source, /from ['"]\.\.\/systems\//);
    assert.doesNotMatch(source, /from ['"]\.\.\/math\//);
  }
});

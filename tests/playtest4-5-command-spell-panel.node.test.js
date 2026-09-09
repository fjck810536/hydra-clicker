import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  projectCommandSpellISlot,
  projectCommandSpellIISlot,
} from '../js/view/command-spell-panel.js';

function spellI(overrides = {}) {
  return {
    purchased: false,
    level: 0,
    maxed: false,
    attacksPerSecond: 1,
    nextLevel: 1,
    nextAttacksPerSecond: 1,
    canAfford: false,
    available: false,
    cost: 99n,
    pricePending: false,
    ...overrides,
  };
}

function spellII(overrides = {}) {
  return {
    unlocked: false,
    level: 0,
    maxed: false,
    extensionPending: false,
    pricePending: false,
    chapterReached: false,
    eligibilityMet: false,
    available: false,
    cost: 297n,
    npManualStrikeCount: 1,
    npMaxPoints: 66,
    npDurationMs: 3000,
    nextRewardLabel: 'NP MANUAL ×3',
    nextNpManualStrikeCount: 3,
    nextNpMaxPoints: 132,
    nextNpDurationMs: 3000,
    ...overrides,
  };
}

test('Command Spell I slot stays dormant before first affordability then lights as NEW', () => {
  assert.deepEqual(projectCommandSpellISlot(spellI()), {
    state: 'dormant',
    level: '—',
    meta: 'EMPTY',
    clickable: false,
  });

  assert.deepEqual(projectCommandSpellISlot(spellI({ available: true, canAfford: true })), {
    state: 'available',
    level: 'NEW',
    meta: '99 人類惡',
    clickable: true,
  });
});

test('owned Command Spell I remains clickable while dim when poor and lights again when affordable', () => {
  const poor = projectCommandSpellISlot(spellI({
    purchased: true,
    level: 2,
    attacksPerSecond: 3,
    nextLevel: 3,
    nextAttacksPerSecond: 9,
    cost: 66n,
  }));
  assert.equal(poor.state, 'owned-dim');
  assert.equal(poor.clickable, true);
  assert.match(poor.meta, /3 APS/);
  assert.match(poor.meta, /66/);

  const ready = projectCommandSpellISlot(spellI({
    purchased: true,
    level: 2,
    attacksPerSecond: 3,
    nextLevel: 3,
    nextAttacksPerSecond: 9,
    cost: 66n,
    canAfford: true,
    available: true,
  }));
  assert.equal(ready.state, 'affordable');
  assert.match(ready.meta, /LV UP/);
  assert.match(ready.meta, /66/);
});

test('243 APS formal state exposes 729 as PRICE TBD while TEST-owned 729 can read MAX', () => {
  const pending = projectCommandSpellISlot(spellI({
    purchased: true,
    level: 6,
    attacksPerSecond: 243,
    nextLevel: 7,
    nextAttacksPerSecond: 729,
    cost: null,
    pricePending: true,
  }));
  assert.equal(pending.state, 'owned-dim');
  assert.equal(pending.clickable, true);
  assert.match(pending.meta, /243 APS/);
  assert.match(pending.meta, /PRICE TBD/);

  const max = projectCommandSpellISlot(spellI({
    purchased: true,
    level: 7,
    maxed: true,
    attacksPerSecond: 729,
    nextLevel: null,
    nextAttacksPerSecond: null,
    cost: null,
  }));
  assert.equal(max.state, 'max');
  assert.equal(max.level, 'MAX');
  assert.match(max.meta, /729 APS/);
});

test('Command Spell II makes its one-time reveal condition visible, then uses affordability states', () => {
  assert.equal(projectCommandSpellIISlot(spellII()).state, 'dormant');

  const beforeCut = projectCommandSpellIISlot(spellII({ chapterReached: true }));
  assert.deepEqual(beforeCut, {
    state: 'preview',
    level: '—',
    meta: 'CUT TO REVEAL',
    clickable: false,
  });

  const revealedPoor = projectCommandSpellIISlot(spellII({
    chapterReached: true,
    eligibilityMet: true,
  }));
  assert.equal(revealedPoor.state, 'owned-dim');
  assert.equal(revealedPoor.level, 'NEW');
  assert.equal(revealedPoor.meta, '297 人類惡');
  assert.equal(revealedPoor.clickable, true);

  const first = projectCommandSpellIISlot(spellII({
    chapterReached: true,
    eligibilityMet: true,
    available: true,
  }));
  assert.equal(first.state, 'available');
  assert.equal(first.level, 'NEW');
  assert.equal(first.clickable, true);

  const poor = projectCommandSpellIISlot(spellII({
    unlocked: true,
    level: 1,
    chapterReached: true,
    eligibilityMet: true,
    npManualStrikeCount: 3,
    npMaxPoints: 132,
    cost: 198n,
  }));
  assert.equal(poor.state, 'owned-dim');
  assert.equal(poor.clickable, true);
  assert.match(poor.meta, /NP 132/);

  const pricePending = projectCommandSpellIISlot(spellII({
    unlocked: true,
    level: 3,
    chapterReached: true,
    eligibilityMet: true,
    npManualStrikeCount: 3,
    npMaxPoints: 198,
    npDurationMs: 9000,
    cost: null,
    pricePending: true,
  }));
  assert.equal(pricePending.state, 'owned-dim');
  assert.equal(pricePending.level, 'Lv.3');
  assert.match(pricePending.meta, /PRICE TBD/);

  const extension = projectCommandSpellIISlot(spellII({
    unlocked: true,
    level: 9,
    chapterReached: true,
    eligibilityMet: true,
    maxed: false,
    extensionPending: true,
    pricePending: true,
    npManualStrikeCount: 9,
    npMaxPoints: 1188,
    npDurationMs: 81000,
    cost: null,
  }));
  assert.equal(extension.state, 'owned-dim');
  assert.equal(extension.level, 'Lv.9');
  assert.match(extension.meta, /81s/);
  assert.match(extension.meta, /EXTENSION TBD/);
});

test('fixed bottom action bar reserves NP, Humanity Evil and exactly three Command Spell slots', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const slots = [...html.matchAll(/data-command-spell-slot="([123])"/g)].map((match) => match[1]);
  assert.deepEqual(slots, ['1', '2', '3']);

  assert.match(html, /data-bottom-hud/);
  assert.match(html, /class="np-button np-card"[^>]*data-np-button/);
  assert.match(html, /data-np-button-label/);
  assert.match(html, /class="resource-panel"/);
  assert.match(html, /data-hud="humanity-evil"/);
  assert.match(html, /data-command-spell-slot="3"[^>]*data-state="dormant"[^>]*disabled/);
  assert.match(html, /data-command-spell-modal-current/);
  assert.match(html, /data-command-spell-modal-next/);
  assert.match(html, /data-command-spell-modal-cost/);
  assert.match(html, /data-command-spell-close/);
  assert.match(html, /data-command-spell-purchase/);
  assert.match(html, /class="command-spell-modal-close"[^>]*style="width:44px;height:44px"/);
});

test('Command Spell II modal documents the simplified post-reveal purchase rule', async () => {
  const panelSource = await readFile(new URL('../js/view/command-spell-panel.js', import.meta.url), 'utf8');

  assert.match(panelSource, /「快點……再快點……！」/);
  assert.doesNotMatch(panelSource, /title:\s*'射殺す百頭'/);
  assert.match(panelSource, /status\.nextNpManualStrikeCount/);
  assert.match(panelSource, /status\.nextNpMaxPoints/);
  assert.match(panelSource, /status\.nextNpDurationMs/);
  assert.match(panelSource, /LONG-TERM TIME AXIS · TBD/);
  assert.match(panelSource, /不再要求額外蛇二擊殺/);
});

test('Command Spell modal closes after a successful purchase and backdrop taps close only outside the card', async () => {
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(appSource, /function bindModalBackdropClose/);
  assert.match(appSource, /if \(event\.target !== root\) return;/);
  assert.match(appSource, /const unbindCommandSpellBackdrop = bindModalBackdropClose/);
  assert.match(appSource, /if \(result\?\.accepted\) \{[\s\S]*persistNow\(\);[\s\S]*commandSpellPanel\.close\(\);[\s\S]*\}/);
});

test('Command Spell panel is a View projection and Application owns purchases', async () => {
  const panelSource = await readFile(new URL('../js/view/command-spell-panel.js', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.doesNotMatch(panelSource, /from ['"]\.\.\/systems\//);
  assert.doesNotMatch(panelSource, /from ['"]\.\.\/math\//);
  assert.doesNotMatch(panelSource, /from ['"]\.\.\/core\//);
  assert.doesNotMatch(panelSource, /humanityEvil\s*[+\-]?=/);

  assert.match(appSource, /commandSpellPanel\.open\(1\)/);
  assert.match(appSource, /commandSpellPanel\.open\(2\)/);
  assert.match(appSource, /commandSpellPanel\.open\(3\)/);
  assert.match(appSource, /commandSpellPanel\.currentOpenSpellId\(\)/);
  assert.match(appSource, /runtime\.buyCommandSpellI\(\)/);
  assert.match(appSource, /runtime\.buyCommandSpellII\(\)/);
  assert.match(appSource, /runtime\.buyCommandSpellIII\(\)/);
  assert.doesNotMatch(appSource, /state\.update/);
});

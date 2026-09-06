import test from 'node:test';
import assert from 'node:assert/strict';

import { createHydraIGameRuntime } from '../js/core/game.js';

function chargeAndKill(runtime) {
  while (runtime.snapshot().berserker.np < 1) {
    assert.ok(runtime.snapshot().hydra.logicalHeadCount > 0n);
    runtime.manualAttack();
  }

  const release = runtime.releaseNp();
  assert.equal(release.accepted, true);

  while (!runtime.snapshot().hydra.defeated) {
    runtime.manualAttack();
  }
}

function advance1200(runtime) {
  runtime.advance(1000);
  runtime.advance(200);
}

test('Hydra kill awards Humanity Evil and encounter respawns cleanly', () => {
  const runtime = createHydraIGameRuntime();

  chargeAndKill(runtime);
  let snapshot = runtime.snapshot();

  assert.equal(snapshot.statistics.totalHydrasKilled, 1n);
  assert.equal(snapshot.master.humanityEvil, 11n);
  assert.equal(snapshot.hydra.logicalHeadCount, 0n);
  assert.equal(snapshot.hydra.defeated, true);
  assert.equal(snapshot.modifiers.active.length, 1);

  advance1200(runtime);
  snapshot = runtime.snapshot();

  assert.equal(snapshot.hydra.logicalHeadCount, 9n);
  assert.equal(snapshot.hydra.encounter, 2n);
  assert.equal(snapshot.hydra.defeated, false);
  assert.equal(snapshot.hydra.respawnAtMs, null);
  assert.equal(snapshot.modifiers.active.length, 0);

  runtime.destroy();
});

test('Command Spell I requires 9 kills and 99 Humanity Evil, then unlocks Auto Slash', () => {
  const runtime = createHydraIGameRuntime();

  const early = runtime.buyCommandSpellI();
  assert.equal(early.accepted, false);
  assert.equal(early.reason, 'kills-required');

  for (let kill = 1; kill <= 9; kill += 1) {
    chargeAndKill(runtime);
    assert.equal(runtime.snapshot().statistics.totalHydrasKilled, BigInt(kill));
    assert.equal(runtime.snapshot().master.humanityEvil, BigInt(kill * 11));
    advance1200(runtime);
  }

  const status = runtime.commandSpellIStatus();
  assert.equal(status.killsMet, true);
  assert.equal(status.canAfford, true);
  assert.equal(status.available, true);
  assert.equal(status.cost, 99n);

  const purchase = runtime.buyCommandSpellI();
  assert.equal(purchase.accepted, true);

  let snapshot = runtime.snapshot();
  assert.equal(snapshot.master.humanityEvil, 0n);
  assert.equal(snapshot.master.commandSpells.autoSlash, true);

  const headsBeforeAuto = snapshot.hydra.logicalHeadCount;
  runtime.advance(1000);
  snapshot = runtime.snapshot();

  assert.equal(headsBeforeAuto, 9n);
  assert.equal(snapshot.hydra.logicalHeadCount, 8n);

  runtime.destroy();
});

test('Command Spell I purchase emits semantic unlock and spend events', () => {
  const runtime = createHydraIGameRuntime();
  const unlocked = [];
  const spent = [];

  const offUnlock = runtime.events.on('command-spell:unlocked', ({ payload }) => unlocked.push(payload));
  const offSpend = runtime.events.on('currency:spend', ({ payload }) => spent.push(payload));

  for (let kill = 0; kill < 9; kill += 1) {
    chargeAndKill(runtime);
    advance1200(runtime);
  }

  runtime.buyCommandSpellI();

  assert.equal(unlocked.length, 1);
  assert.deepEqual(unlocked[0].unlocks, ['combat.autoSlash']);
  assert.equal(spent.length, 1);
  assert.equal(spent[0].currency, 'humanity-evil');
  assert.equal(spent[0].amount, 99n);

  offUnlock();
  offSpend();
  runtime.destroy();
});

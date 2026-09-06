import test from 'node:test';
import assert from 'node:assert/strict';

import { createCoreRuntime } from '../js/core/game.js';
import { createHydraIRule } from '../js/math/hydra-rules.js';
import { createCombatSystem } from '../js/systems/combat.js';
import { createAutoSlashSystem } from '../js/systems/auto-slash.js';
import { createHydraRegrowthSystem } from '../js/systems/hydra-regrowth.js';
import { createManualAttackInput } from '../js/input/manual-attack.js';

function createHarness({ attacksPerSecond = 1, regenDelayMs = 10000 } = {}) {
  const core = createCoreRuntime({ fixedStepMs: 100 });
  core.state.update((draft) => {
    draft.berserker.baseAttacksPerSecond = attacksPerSecond;
  });

  const rule = createHydraIRule({ regenDelayMs });
  const regrowth = createHydraRegrowthSystem(core);
  const combat = createCombatSystem({
    ...core,
    getRule: () => rule,
  });
  const autoSlash = createAutoSlashSystem(core);
  const manual = createManualAttackInput(core);

  return {
    core,
    rule,
    regrowth,
    combat,
    autoSlash,
    manual,
    destroy() {
      autoSlash.destroy();
      combat.destroy();
      regrowth.destroy();
      core.destroy();
    },
  };
}

test('manual input emits an attack request that Combat resolves through Hydra I', () => {
  const h = createHarness();
  const cuts = [];
  const off = h.core.events.on('head:cut', ({ payload }) => cuts.push(payload));

  const request = h.manual.attack();
  const snapshot = h.core.snapshot();

  assert.equal(request.source, 'manual');
  assert.equal(request.timestamp, 0);
  assert.equal(snapshot.hydra.logicalHeadCount, 8n);
  assert.equal(snapshot.statistics.totalHeadsCut, 1n);
  assert.equal(cuts.length, 1);
  assert.equal(cuts[0].source, 'manual');
  assert.equal(cuts[0].amount, 1n);

  off();
  h.destroy();
});

test('manual attack timestamp comes from simulation time, not wall-clock time', () => {
  const h = createHarness();
  h.core.advance(550);

  const request = h.manual.attack();
  assert.equal(h.core.snapshot().time.simulationTimeMs, 500);
  assert.equal(request.timestamp, 500);

  h.destroy();
});

test('Auto Slash produces no attacks while capability is locked', () => {
  const h = createHarness({ attacksPerSecond: 8 });
  h.core.advance(1000);

  const snapshot = h.core.snapshot();
  assert.equal(snapshot.hydra.logicalHeadCount, 9n);
  assert.equal(snapshot.statistics.totalHeadsCut, 0n);
  assert.equal(h.autoSlash.getAccumulator(), 0);

  h.destroy();
});

test('Auto Slash at 2 attacks/sec produces exactly 2 cuts in one simulated second', () => {
  const h = createHarness({ attacksPerSecond: 2 });
  h.core.state.update((draft) => {
    draft.master.commandSpells.autoSlash = true;
  });

  h.core.advance(1000);
  const snapshot = h.core.snapshot();

  assert.equal(snapshot.statistics.totalHeadsCut, 2n);
  assert.equal(snapshot.hydra.logicalHeadCount, 7n);
  assert.ok(Math.abs(h.autoSlash.getAccumulator()) < 1e-9);

  h.destroy();
});

test('Auto Slash preserves fractional rates: 2.5 attacks/sec becomes 5 cuts over 2 seconds', () => {
  const h = createHarness({ attacksPerSecond: 2.5 });
  h.core.state.update((draft) => {
    draft.master.commandSpells.autoSlash = true;
  });

  h.core.advance(2000);
  const snapshot = h.core.snapshot();

  assert.equal(snapshot.statistics.totalHeadsCut, 5n);
  assert.equal(snapshot.hydra.logicalHeadCount, 4n);
  assert.ok(Math.abs(h.autoSlash.getAccumulator()) < 1e-9);

  h.destroy();
});

test('high attack speed may batch strikes in one Attack Request but Combat resolves each strike', () => {
  const h = createHarness({ attacksPerSecond: 20 });
  h.core.state.update((draft) => {
    draft.master.commandSpells.autoSlash = true;
  });

  const requested = [];
  const resolved = [];
  const offRequested = h.core.events.on('attack:requested', ({ payload }) => requested.push(payload));
  const offResolved = h.core.events.on('attack:resolved', ({ payload }) => resolved.push(payload));

  h.core.advance(100);

  assert.equal(requested.length, 1);
  assert.equal(requested[0].strikeCount, 2);
  assert.equal(resolved.length, 2);
  assert.equal(h.core.snapshot().hydra.logicalHeadCount, 7n);
  assert.equal(h.core.snapshot().hydra.turn, 2n);

  offRequested();
  offResolved();
  h.destroy();
});

test('Combat rejects surplus strikes after Hydra is depleted without inventing extra cuts', () => {
  const h = createHarness({ attacksPerSecond: 100 });
  h.core.state.update((draft) => {
    draft.master.commandSpells.autoSlash = true;
  });

  h.core.advance(100);
  const snapshot = h.core.snapshot();

  assert.equal(snapshot.hydra.logicalHeadCount, 0n);
  assert.equal(snapshot.statistics.totalHeadsCut, 9n);
  assert.equal(snapshot.hydra.turn, 9n);
  assert.equal(snapshot.hydra.pendingRegrowth.length, 9);

  h.destroy();
});

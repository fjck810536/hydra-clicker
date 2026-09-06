import test from 'node:test';
import assert from 'node:assert/strict';

import { createHydraIGameRuntime } from '../js/core/game.js';

test('Hydra I gameplay runtime composes manual cut and timed regrowth', () => {
  const game = createHydraIGameRuntime({ fixedStepMs: 100, regenDelayMs: 500 });

  game.manualAttack();
  assert.equal(game.snapshot().hydra.logicalHeadCount, 8n);

  game.advance(400);
  assert.equal(game.snapshot().hydra.logicalHeadCount, 8n);

  game.advance(100);
  assert.equal(game.snapshot().hydra.logicalHeadCount, 9n);

  game.destroy();
});

test('Hydra I gameplay runtime exposes Auto Slash through logical capability state', () => {
  const game = createHydraIGameRuntime({ fixedStepMs: 100, regenDelayMs: 10000 });

  game.state.update((draft) => {
    draft.berserker.baseAttacksPerSecond = 4;
    draft.master.commandSpells.autoSlash = true;
  });

  game.advance(1000);

  assert.equal(game.snapshot().statistics.totalHeadsCut, 4n);
  assert.equal(game.snapshot().hydra.logicalHeadCount, 5n);

  game.destroy();
});

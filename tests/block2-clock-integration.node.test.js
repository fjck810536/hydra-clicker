import test from 'node:test';
import assert from 'node:assert/strict';

import { createCoreRuntime } from '../js/core/game.js';
import { createHydraIRule } from '../js/math/hydra-rules.js';
import { resolveCut } from '../js/math/cut-resolver.js';
import { applyCutResolution } from '../js/math/hydra-model.js';
import { createHydraRegrowthSystem } from '../js/systems/hydra-regrowth.js';

test('Hydra I regrowth is driven by Game Clock, not render FPS or setTimeout', () => {
  const core = createCoreRuntime({ fixedStepMs: 100 });
  const regrowth = createHydraRegrowthSystem(core);
  const rule = createHydraIRule({ regenDelayMs: 1500 });

  const before = core.snapshot();
  const resolution = resolveCut({
    rule,
    hydraState: before.hydra,
    attack: { headsPerStrike: 1n },
    turn: before.hydra.turn,
    nowMs: before.time.simulationTimeMs,
  });

  core.state.update((draft) => applyCutResolution(draft, resolution));
  assert.equal(core.snapshot().hydra.logicalHeadCount, 8n);

  core.advance(1499);
  assert.equal(core.snapshot().time.simulationTimeMs, 1000);
  assert.equal(core.snapshot().hydra.logicalHeadCount, 8n);

  core.advance(500);
  assert.equal(core.snapshot().time.simulationTimeMs, 1500);
  assert.equal(core.snapshot().hydra.logicalHeadCount, 9n);
  assert.equal(core.snapshot().hydra.pendingRegrowth.length, 0);

  regrowth.destroy();
  core.destroy();
});

test('head:regrow emits semantic result after due regrowth is applied', () => {
  const core = createCoreRuntime({ fixedStepMs: 100 });
  const regrowth = createHydraRegrowthSystem(core);
  const rule = createHydraIRule({ regenDelayMs: 300 });
  const observed = [];
  const off = core.events.on('head:regrow', (event) => observed.push(event));

  const before = core.snapshot();
  const resolution = resolveCut({
    rule,
    hydraState: before.hydra,
    attack: { headsPerStrike: 2n },
    turn: before.hydra.turn,
    nowMs: before.time.simulationTimeMs,
  });
  core.state.update((draft) => applyCutResolution(draft, resolution));

  core.advance(300);

  assert.equal(core.snapshot().hydra.logicalHeadCount, 9n);
  assert.equal(observed.length, 1);
  assert.equal(observed[0].amount, 2n);
  assert.equal(observed[0].atMs, 300);

  off();
  regrowth.destroy();
  core.destroy();
});

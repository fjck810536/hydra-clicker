import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  INITIAL_HYDRA_HEAD_POOL_SIZE,
  MAX_VISIBLE_HEADS,
  computeVisibleHeadCount,
  getHeadSlotPose,
} from '../js/view/head-pool.js';

test('Hydra I starts with a 9-slot visual pool and keeps a 99-head hard cap', () => {
  assert.equal(INITIAL_HYDRA_HEAD_POOL_SIZE, 9);
  assert.equal(MAX_VISIBLE_HEADS, 99);
  assert.ok(INITIAL_HYDRA_HEAD_POOL_SIZE < MAX_VISIBLE_HEADS);
});

test('logical head count projects to visible heads without fractional values', () => {
  assert.equal(computeVisibleHeadCount(0n), 0);
  assert.equal(computeVisibleHeadCount(1n), 1);
  assert.equal(computeVisibleHeadCount(9n), 9);
  assert.equal(computeVisibleHeadCount(98n), 98);
  assert.equal(computeVisibleHeadCount(99n), 99);
});

test('astronomical logical counts saturate at 99 visible heads without Number conversion overflow', () => {
  const astronomical = 10n ** 100000n;
  assert.equal(computeVisibleHeadCount(astronomical), 99);
});

test('visual projection rejects Number/floating logical head counts', () => {
  assert.throws(() => computeVisibleHeadCount(8), /BigInt/);
  assert.throws(() => computeVisibleHeadCount(8.5), /BigInt/);
  assert.throws(() => computeVisibleHeadCount(-1n), /BigInt/);
});

test('head slot poses are deterministic and finite across the entire visible pool', () => {
  for (const index of [0, 4, 8, 9, 50, 98]) {
    const pose = getHeadSlotPose(index);
    assert.ok(Number.isFinite(pose.x));
    assert.ok(Number.isFinite(pose.y));
    assert.ok(Number.isFinite(pose.z));
    assert.ok(Number.isFinite(pose.rotationZ));
  }

  assert.deepEqual(getHeadSlotPose(0), getHeadSlotPose(0));
  assert.throws(() => getHeadSlotPose(99), /0 to 98/);
});

test('Hydra view remains inside View layer and app only feeds it snapshots', async () => {
  const poolSource = await readFile(new URL('../js/view/head-pool.js', import.meta.url), 'utf8');
  const hydraSource = await readFile(new URL('../js/view/hydra-view.js', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  for (const source of [poolSource, hydraSource]) {
    assert.doesNotMatch(source, /from ['"]\.\.\/math\//);
    assert.doesNotMatch(source, /from ['"]\.\.\/systems\//);
    assert.doesNotMatch(source, /headCount\s*[+\-*/]?=/);
  }

  assert.match(appSource, /createHydraView/);
  assert.match(appSource, /hydraView\.render\(snapshot\)/);
});

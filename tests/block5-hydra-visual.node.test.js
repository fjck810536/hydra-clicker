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

test('first nine heads already form a tall canopy while retaining low root-adjacent heads', () => {
  const poses = Array.from({ length: 9 }, (_, index) => getHeadSlotPose(index));
  const minY = Math.min(...poses.map((pose) => pose.y));
  const maxY = Math.max(...poses.map((pose) => pose.y));

  // Keep the old lower visual band, but let the crown rise far enough to run
  // underneath the portrait HUD.
  assert.ok(minY < 1.5, `expected a low head below 1.5, got ${minY}`);
  assert.ok(maxY > 5.4, `expected a tall head above 5.4, got ${maxY}`);
  assert.ok(maxY - minY > 4, 'expected a much taller canopy span');
});

test('99-head canopy is strongly left-biased and constrained on the right edge', () => {
  const poses = Array.from({ length: 99 }, (_, index) => getHeadSlotPose(index));
  const minX = Math.min(...poses.map((pose) => pose.x));
  const maxX = Math.max(...poses.map((pose) => pose.x));
  const positiveHeads = poses.filter((pose) => pose.x > 0).length;

  assert.ok(minX < -3.5, `expected broad left canopy below -3.5, got ${minX}`);
  assert.ok(maxX < 1.1, `expected right canopy constrained below 1.1, got ${maxX}`);
  assert.ok(Math.abs(minX) > maxX * 3, 'left screen-space spread should dominate right spread');

  // Right-side heads still exist so the silhouette reads as a fan/canopy rather
  // than a one-sided curtain, but they are a minority.
  assert.ok(positiveHeads >= 10, `expected some right-side heads, got ${positiveHeads}`);
  assert.ok(positiveHeads < 35, `expected right-side heads to remain a minority, got ${positiveHeads}`);
});

test('head slots fill canopy depth and carry finite radial neck geometry', () => {
  const poses = Array.from({ length: 99 }, (_, index) => getHeadSlotPose(index));
  const minZ = Math.min(...poses.map((pose) => pose.z));
  const maxZ = Math.max(...poses.map((pose) => pose.z));

  assert.ok(maxZ - minZ > 0.5, 'expected a folded 3D canopy rather than a planar fan');

  for (const index of [0, 4, 8, 9, 50, 98]) {
    const pose = getHeadSlotPose(index);
    assert.ok(Number.isFinite(pose.x));
    assert.ok(Number.isFinite(pose.y));
    assert.ok(Number.isFinite(pose.z));
    assert.ok(Number.isFinite(pose.rotationZ));
    assert.ok(Number.isFinite(pose.neckLength));
    assert.ok(pose.neckLength > 0);
  }

  assert.deepEqual(getHeadSlotPose(0), getHeadSlotPose(0));
  assert.throws(() => getHeadSlotPose(99), /0 to 98/);
});

test('top HUD stays above the battle canvas so tall Hydra heads are occluded by panels', async () => {
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');

  assert.match(css, /\.top-hud,[\s\S]*z-index:\s*2/);
  assert.match(css, /\.battle-canvas\s*\{[\s\S]*position:\s*absolute/);
});

test('Hydra view keeps only a small root base and remains inside View layer', async () => {
  const poolSource = await readFile(new URL('../js/view/head-pool.js', import.meta.url), 'utf8');
  const hydraSource = await readFile(new URL('../js/view/hydra-view.js', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  for (const source of [poolSource, hydraSource]) {
    assert.doesNotMatch(source, /from ['"]\.\.\/math\//);
    assert.doesNotMatch(source, /from ['"]\.\.\/systems\//);
    assert.doesNotMatch(source, /headCount\s*[+\-*/]?=/);
  }

  assert.match(hydraSource, /hydra-root-base/);
  assert.doesNotMatch(hydraSource, /hydra-haunch/);
  assert.doesNotMatch(hydraSource, /hydra-tail-placeholder/);
  assert.doesNotMatch(hydraSource, /hydra-body['"]/);
  assert.match(appSource, /createHydraView/);
  assert.match(appSource, /hydraView\.render\(snapshot\)/);
});

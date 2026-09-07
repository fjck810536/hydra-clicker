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
  assert.equal(computeVisibleHeadCount(81n), 81);
  assert.equal(computeVisibleHeadCount(98n), 98);
  assert.equal(computeVisibleHeadCount(99n), 99);
  assert.equal(computeVisibleHeadCount(729n), 99);
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

test('nine-head sparse composition stays clustered without two HUD-reaching antennae', () => {
  const poses = Array.from({ length: 9 }, (_, index) => getHeadSlotPose(index));
  const minY = Math.min(...poses.map((pose) => pose.y));
  const maxY = Math.max(...poses.map((pose) => pose.y));
  const shortNecks = poses.filter((pose) => pose.neckLength < 2.2).length;
  const veryTallHeads = poses.filter((pose) => pose.y > 3.6).length;
  const originXs = new Set(poses.map((pose) => pose.originX.toFixed(2)));

  assert.ok(minY < 1.3, `expected low heads near the established root band, got ${minY}`);
  assert.ok(maxY > 3.2, `expected some vertical hierarchy in the sparse crown, got ${maxY}`);
  assert.ok(maxY < 3.6, `sparse crown should stay below the previous antenna height, got ${maxY}`);

  assert.ok(shortNecks >= 6, `expected >=6 compact necks, got ${shortNecks}`);
  assert.equal(veryTallHeads, 0, `expected no sparse heads above 3.6, got ${veryTallHeads}`);
  assert.ok(originXs.size >= 5, `expected clustered root variation, got ${originXs.size} origins`);
});

test('transition slots widen the canopy without suddenly overflowing the right edge', () => {
  const poses = Array.from({ length: 32 }, (_, index) => getHeadSlotPose(index));
  const minX = Math.min(...poses.map((pose) => pose.x));
  const maxX = Math.max(...poses.map((pose) => pose.x));

  assert.ok(minX < -2.3, `expected transition canopy to expand left, got ${minX}`);
  assert.ok(maxX > 0.9, `expected transition canopy to keep a right lobe, got ${maxX}`);
  assert.ok(maxX < 1.4, `transition should not jump straight to dense overflow, got ${maxX}`);
});

test('99-head dense canopy remains left-heavy but naturally spills past the right viewport', () => {
  const poses = Array.from({ length: 99 }, (_, index) => getHeadSlotPose(index));
  const minX = Math.min(...poses.map((pose) => pose.x));
  const maxX = Math.max(...poses.map((pose) => pose.x));
  const rightOverflow = poses.filter((pose) => pose.x > 1.55).length;
  const positiveHeads = poses.filter((pose) => pose.x > 0).length;

  assert.ok(minX < -3.4, `expected broad left canopy below -3.4, got ${minX}`);
  assert.ok(maxX > 2.2, `expected natural right-edge overflow above 2.2, got ${maxX}`);
  assert.ok(Math.abs(minX) > maxX, 'left mass should remain broader than the right spill');

  assert.ok(rightOverflow >= 5, `expected >=5 overflow heads, got ${rightOverflow}`);
  assert.ok(positiveHeads >= 30, `expected a substantial right lobe, got ${positiveHeads}`);
  assert.ok(positiveHeads < 50, `right lobe should remain secondary, got ${positiveHeads}`);
});

test('head slots fill canopy depth and carry finite clustered neck geometry', () => {
  const poses = Array.from({ length: 99 }, (_, index) => getHeadSlotPose(index));
  const minZ = Math.min(...poses.map((pose) => pose.z));
  const maxZ = Math.max(...poses.map((pose) => pose.z));

  assert.ok(maxZ - minZ > 0.8, 'expected a folded 3D canopy rather than a planar fan');

  for (const index of [0, 4, 8, 9, 31, 32, 50, 98]) {
    const pose = getHeadSlotPose(index);
    assert.ok(Number.isFinite(pose.x));
    assert.ok(Number.isFinite(pose.y));
    assert.ok(Number.isFinite(pose.z));
    assert.ok(Number.isFinite(pose.originX));
    assert.ok(Number.isFinite(pose.originY));
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
  assert.match(css, /\.hud-strip\s*\{[\s\S]*background:\s*rgb\(8 8 12 \/ 9[0-9]%\)/);
});

test('Hydra view keeps only a small root base and remains inside View layer', async () => {
  const poolSource = await readFile(new URL('../js/view/head-pool.js', import.meta.url), 'utf8');
  const hydraSource = await readFile(new URL('../js/view/hydra-view.js', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  for (const source of [poolSource, hydraSource]) {
    assert.doesNotMatch(source, /from ['"]\.\.\/math\//);
    assert.doesNotMatch(source, /from ['"]\.\.\/systems\//);
  }

  assert.doesNotMatch(appSource, /visibleHeadCount\s*[-+]?=/);
});

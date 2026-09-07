export const INITIAL_HYDRA_HEAD_POOL_SIZE = 9;
export const MAX_VISIBLE_HEADS = 99;

// Visual-only canopy projection.
//
// The player should read a tall fan from the portrait camera, but the world-space
// geometry is deliberately *not* a symmetric planar sector. We generate leaf/end
// points inside an asymmetric screen-oriented envelope, then connect every point
// back toward the common Hydra root. The left side opens aggressively, the right
// side stays constrained, and depth folding keeps the crown from reading as a
// flat diagram.
const CANOPY_ROOT_Y = 0.38;
const CANOPY_MIN_Y = 0.92;
const CANOPY_MAX_Y = 6.10;
const CANOPY_MIN_LEFT_WIDTH = 0.42;
const CANOPY_MAX_LEFT_WIDTH = 4.15;
const CANOPY_MIN_RIGHT_WIDTH = 0.28;
const CANOPY_MAX_RIGHT_WIDTH = 0.92;
const CANOPY_DEPTH = 0.72;

function radicalInverse(index, base) {
  let value = index;
  let factor = 1;
  let result = 0;

  while (value > 0) {
    factor /= base;
    result += factor * (value % base);
    value = Math.floor(value / base);
  }

  return result;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function createBiasedCanopyPose(index) {
  // Halton bases 2 / 3 / 5 give every prefix (9, 20, 50, 99...) broad coverage
  // without obvious rows. This is intentionally fractal-ish / recursive-looking
  // rather than a literal mathematical fractal.
  const sequenceIndex = index + 1;
  const lateralSample = radicalInverse(sequenceIndex, 2);
  const heightSample = radicalInverse(sequenceIndex, 3);
  const depthSample = radicalInverse(sequenceIndex, 5);

  // A sub-linear exponent puts useful density into the upper crown while still
  // preserving low heads close to the existing Hydra root position.
  const heightT = heightSample ** 0.72;
  const y = lerp(CANOPY_MIN_Y, CANOPY_MAX_Y, heightT);

  // Screen-space silhouette first: the left envelope grows much faster than the
  // right envelope. This keeps the crown away from the phone's right edge while
  // allowing the upper-left mass to grow behind the HUD.
  const leftWidth = lerp(
    CANOPY_MIN_LEFT_WIDTH,
    CANOPY_MAX_LEFT_WIDTH,
    heightT ** 0.82,
  );
  const rightWidth = lerp(
    CANOPY_MIN_RIGHT_WIDTH,
    CANOPY_MAX_RIGHT_WIDTH,
    heightT ** 0.95,
  );

  let x = -leftWidth + lateralSample * (leftWidth + rightWidth);

  // Re-center the visible crown slightly toward the Hydra at higher levels so we
  // still get a handful of right-side heads without allowing the canopy to spill
  // heavily past the right screen edge.
  x += 0.34 * (heightT ** 0.75);

  // Tiny deterministic drift prevents the low-discrepancy samples from reading as
  // a sterile scatter plot. It also gives neighboring necks slightly different
  // silhouettes when the visible pool becomes dense.
  x += (depthSample - 0.5) * 0.14 * (0.35 + heightT);

  // Fold the crown in depth. The portrait camera still sees a fan-like silhouette,
  // but from another angle this is a shallow 3D canopy rather than a planar fan.
  const z = (depthSample - 0.5) * CANOPY_DEPTH
    + Math.max(0, x) * 0.16
    - Math.max(0, -x) * 0.03;

  const deltaY = y - CANOPY_ROOT_Y;
  const neckLength = Math.hypot(x, deltaY);
  const rotationZ = -Math.atan2(x, deltaY);

  return Object.freeze({
    x,
    y,
    z,
    rotationZ,
    neckLength,
  });
}

function assertPoolLimit(maxVisibleHeads) {
  if (!Number.isInteger(maxVisibleHeads) || maxVisibleHeads < 1 || maxVisibleHeads > MAX_VISIBLE_HEADS) {
    throw new RangeError(`maxVisibleHeads must be an integer from 1 to ${MAX_VISIBLE_HEADS}.`);
  }
}

export function computeVisibleHeadCount(
  logicalHeadCount,
  maxVisibleHeads = MAX_VISIBLE_HEADS,
) {
  if (typeof logicalHeadCount !== 'bigint' || logicalHeadCount < 0n) {
    throw new TypeError('logicalHeadCount must be a non-negative BigInt.');
  }
  assertPoolLimit(maxVisibleHeads);

  const cap = BigInt(maxVisibleHeads);
  if (logicalHeadCount >= cap) return maxVisibleHeads;
  return Number(logicalHeadCount);
}

export function getHeadSlotPose(index) {
  if (!Number.isInteger(index) || index < 0 || index >= MAX_VISIBLE_HEADS) {
    throw new RangeError(`head slot index must be from 0 to ${MAX_VISIBLE_HEADS - 1}.`);
  }

  return createBiasedCanopyPose(index);
}

function requireBabylon(babylon) {
  const required = [
    'TransformNode',
    'MeshBuilder',
    'StandardMaterial',
    'Color3',
  ];

  for (const key of required) {
    if (!babylon?.[key]) {
      throw new Error(`Babylon dependency is missing ${key}.`);
    }
  }
}

function createHeadSlot({ babylon, scene, parent, index, neckMaterial, headMaterial }) {
  const root = new babylon.TransformNode(`hydra-head-slot-${index}`, scene);
  root.parent = parent;

  const pose = getHeadSlotPose(index);
  root.position.set(0, CANOPY_ROOT_Y, pose.z);
  root.rotation.z = pose.rotationZ;

  // The neck now genuinely reaches from the common root toward its leaf/head
  // position. Long upper heads therefore read as rays/branches instead of short
  // vertical stalks floating around the fan area.
  const neck = babylon.MeshBuilder.CreateCylinder(`hydra-neck-${index}`, {
    height: pose.neckLength,
    diameterTop: 0.13,
    diameterBottom: 0.22,
    tessellation: 5,
  }, scene);
  neck.parent = root;
  neck.position.y = pose.neckLength * 0.5;
  neck.material = neckMaterial;
  neck.isPickable = false;

  const head = babylon.MeshBuilder.CreatePolyhedron(`hydra-head-${index}`, {
    type: 1,
    size: 0.27,
  }, scene);
  head.parent = root;
  head.scaling.set(1.32, 0.78, 0.92);
  head.position.set(-0.04, pose.neckLength + 0.16, 0);
  head.rotation.z = -0.10;
  head.material = headMaterial;
  head.isPickable = false;

  const snout = babylon.MeshBuilder.CreateBox(`hydra-snout-${index}`, {
    width: 0.25,
    height: 0.13,
    depth: 0.18,
  }, scene);
  snout.parent = root;
  snout.position.set(-0.20, pose.neckLength + 0.12, 0);
  snout.rotation.z = -0.08;
  snout.material = headMaterial;
  snout.isPickable = false;

  root.setEnabled(false);
  return root;
}

export function createHydraHeadPool({
  scene,
  parent,
  babylon = globalThis.BABYLON,
  initialPoolSize = INITIAL_HYDRA_HEAD_POOL_SIZE,
  maxVisibleHeads = MAX_VISIBLE_HEADS,
} = {}) {
  if (!scene) throw new TypeError('Hydra head pool requires a Babylon scene.');
  if (!parent) throw new TypeError('Hydra head pool requires a parent node.');
  requireBabylon(babylon);
  assertPoolLimit(maxVisibleHeads);

  if (!Number.isInteger(initialPoolSize) || initialPoolSize < 0 || initialPoolSize > maxVisibleHeads) {
    throw new RangeError('initialPoolSize must fit inside maxVisibleHeads.');
  }

  const neckMaterial = new babylon.StandardMaterial('hydra-neck-material', scene);
  neckMaterial.diffuseColor = new babylon.Color3(0.17, 0.22, 0.16);
  neckMaterial.specularColor = new babylon.Color3(0.03, 0.03, 0.03);

  const headMaterial = new babylon.StandardMaterial('hydra-head-material', scene);
  headMaterial.diffuseColor = new babylon.Color3(0.23, 0.29, 0.20);
  headMaterial.specularColor = new babylon.Color3(0.04, 0.04, 0.04);

  const slots = [];
  let visibleCount = -1;

  const ensurePoolSize = (requestedSize) => {
    const targetSize = Math.min(requestedSize, maxVisibleHeads);
    while (slots.length < targetSize) {
      slots.push(createHeadSlot({
        babylon,
        scene,
        parent,
        index: slots.length,
        neckMaterial,
        headMaterial,
      }));
    }
  };

  ensurePoolSize(initialPoolSize);

  const setLogicalHeadCount = (logicalHeadCount) => {
    const nextVisibleCount = computeVisibleHeadCount(logicalHeadCount, maxVisibleHeads);
    if (nextVisibleCount === visibleCount) return nextVisibleCount;

    ensurePoolSize(nextVisibleCount);
    for (let index = 0; index < slots.length; index += 1) {
      slots[index].setEnabled(index < nextVisibleCount);
    }

    visibleCount = nextVisibleCount;
    return visibleCount;
  };

  return {
    maxVisibleHeads,
    initialPoolSize,
    setLogicalHeadCount,
    getVisibleCount() {
      return Math.max(0, visibleCount);
    },
    getPoolSize() {
      return slots.length;
    },
    destroy() {
      for (const slot of slots) slot.dispose(false, true);
      slots.length = 0;
      neckMaterial.dispose();
      headMaterial.dispose();
    },
  };
}

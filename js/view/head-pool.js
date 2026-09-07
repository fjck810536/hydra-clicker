export const INITIAL_HYDRA_HEAD_POOL_SIZE = 9;
export const MAX_VISIBLE_HEADS = 99;

const CANOPY_ROOT_Y = 0.38;
const SPARSE_SLOT_COUNT = 9;
const TRANSITION_SLOT_END = 32;

// Visual-only layout strategy:
//
// 1–9   = authored sparse Hydra composition. Nine heads should read as one monster,
//          not nine independent poles.
// 10–32 = transition canopy. New heads fill gaps without moving the original nine.
// 33–99 = dense canopy. The crown becomes large, clustered and partially off-screen.
//
// Existing slots never jump when head count changes; growth only reveals additional
// slots. This keeps Hydra II proliferation visually continuous.
const SPARSE_HEAD_POSES = Object.freeze([
  Object.freeze({ x: -0.52, y: 1.15, z: -0.05, originX: -0.14, originY: 0.46 }),
  Object.freeze({ x: 0.10, y: 1.32, z: 0.08, originX: 0.00, originY: 0.50 }),
  Object.freeze({ x: 0.62, y: 1.50, z: -0.08, originX: 0.14, originY: 0.46 }),
  Object.freeze({ x: -0.94, y: 1.82, z: 0.10, originX: -0.16, originY: 0.46 }),
  Object.freeze({ x: -0.24, y: 2.04, z: -0.12, originX: -0.02, originY: 0.50 }),
  Object.freeze({ x: 0.70, y: 2.28, z: 0.12, originX: 0.16, originY: 0.46 }),
  Object.freeze({ x: -1.32, y: 2.78, z: -0.08, originX: -0.18, originY: 0.46 }),
  Object.freeze({ x: -1.58, y: 4.20, z: 0.08, originX: -0.16, originY: 0.46 }),
  Object.freeze({ x: 0.48, y: 5.10, z: -0.04, originX: 0.12, originY: 0.48 }),
]);

const TRANSITION_HUBS = Object.freeze([
  Object.freeze({ x: -0.30, y: 0.50 }),
  Object.freeze({ x: -0.08, y: 0.54 }),
  Object.freeze({ x: 0.18, y: 0.50 }),
  Object.freeze({ x: 0.34, y: 0.47 }),
]);

const DENSE_HUBS = Object.freeze([
  Object.freeze({ x: -0.48, y: 0.54 }),
  Object.freeze({ x: -0.25, y: 0.58 }),
  Object.freeze({ x: -0.04, y: 0.60 }),
  Object.freeze({ x: 0.18, y: 0.57 }),
  Object.freeze({ x: 0.40, y: 0.52 }),
]);

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

function finalizePose({ x, y, z, originX = 0, originY = CANOPY_ROOT_Y }) {
  const deltaX = x - originX;
  const deltaY = y - originY;
  const neckLength = Math.hypot(deltaX, deltaY);

  return Object.freeze({
    x,
    y,
    z,
    originX,
    originY,
    rotationZ: -Math.atan2(deltaX, deltaY),
    neckLength,
  });
}

function createTransitionPose(index) {
  const localIndex = index - SPARSE_SLOT_COUNT + 1;
  const lateral = radicalInverse(localIndex, 2);
  const height = radicalInverse(localIndex, 3);
  const depth = radicalInverse(localIndex, 5);
  const hubSample = radicalInverse(localIndex, 7);

  const heightT = height ** 0.78;
  const y = lerp(1.22, 5.55, heightT);
  const leftWidth = lerp(0.82, 3.10, heightT ** 0.82);
  const rightWidth = lerp(0.58, 1.58, heightT ** 0.92);

  // Transition heads mostly fill the existing silhouette. A gentle right tail is
  // already allowed so the later dense canopy does not suddenly discover the edge.
  let x = -leftWidth + lateral * (leftWidth + rightWidth);
  x += (depth - 0.5) * 0.18 * (0.45 + heightT);

  const hubIndex = Math.min(
    TRANSITION_HUBS.length - 1,
    Math.floor(hubSample * TRANSITION_HUBS.length),
  );
  const hub = TRANSITION_HUBS[hubIndex];

  return finalizePose({
    x,
    y,
    z: (depth - 0.5) * 0.58 + x * 0.035,
    originX: hub.x,
    originY: hub.y,
  });
}

function createDensePose(index) {
  const localIndex = index - TRANSITION_SLOT_END + 1;
  const lateral = radicalInverse(localIndex, 2);
  const height = radicalInverse(localIndex, 3);
  const depth = radicalInverse(localIndex, 5);
  const hubSample = radicalInverse(localIndex, 7);
  const clusterSample = radicalInverse(localIndex, 11);

  // Dense mode is screen-space composition, not a geometric safety cone. The
  // left side still carries more mass, but the right edge is deliberately soft:
  // several leaves extend beyond the portrait viewport and are cropped naturally.
  const heightT = height ** 0.68;
  let y = lerp(1.28, 6.55, heightT);

  const leftWidth = lerp(1.15, 4.45, heightT ** 0.78);
  const rightWidth = lerp(1.00, 3.15, heightT ** 0.88);
  let x = -leftWidth + lateral * (leftWidth + rightWidth);

  // Pull samples into loose lobes instead of filling one uniform wedge. This is
  // only a visual fractal-like cue for now: repeated local clusters, not a true
  // recursive Hydra tree.
  const lobe = Math.floor(clusterSample * 5);
  const lobeBiases = [-0.72, -0.34, -0.02, 0.34, 0.78];
  const lobeHeights = [0.12, -0.08, 0.16, -0.14, 0.06];
  const lobeBias = lobeBiases[Math.min(lobe, lobeBiases.length - 1)];
  const lobeHeight = lobeHeights[Math.min(lobe, lobeHeights.length - 1)];

  x += lobeBias * (0.20 + heightT * 0.42);
  y += lobeHeight * (0.35 + heightT * 0.55);
  x += (depth - 0.5) * 0.22 * (0.55 + heightT);

  const hubIndex = Math.min(
    DENSE_HUBS.length - 1,
    Math.floor(hubSample * DENSE_HUBS.length),
  );
  const hub = DENSE_HUBS[hubIndex];

  return finalizePose({
    x,
    y,
    // A shallow fold in Z stops the canopy reading as a flat fan from alternate
    // angles, while preserving the portrait silhouette from the gameplay camera.
    z: (depth - 0.5) * 0.86 + Math.max(0, x) * 0.08 - Math.max(0, -x) * 0.025,
    originX: hub.x,
    originY: hub.y,
  });
}

function createSparsePose(index) {
  const pose = SPARSE_HEAD_POSES[index];
  return finalizePose(pose);
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

  if (index < SPARSE_SLOT_COUNT) return createSparsePose(index);
  if (index < TRANSITION_SLOT_END) return createTransitionPose(index);
  return createDensePose(index);
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
  root.position.set(pose.originX, pose.originY, pose.z);
  root.rotation.z = pose.rotationZ;

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

export const INITIAL_HYDRA_HEAD_POOL_SIZE = 9;
export const MAX_VISIBLE_HEADS = 99;

// Playtest 2 silhouette: a narrow root that opens into a wider upward fan.
// Higher heads move farther from center instead of converging into a crown.
const HYDRA_I_HEAD_POSES = Object.freeze([
  Object.freeze({ x: 0.00, y: 0.98, z: 0.08, rotationZ: 0.00 }),
  Object.freeze({ x: -0.28, y: 1.22, z: -0.08, rotationZ: 0.08 }),
  Object.freeze({ x: 0.32, y: 1.26, z: 0.10, rotationZ: -0.08 }),
  Object.freeze({ x: -0.60, y: 1.50, z: 0.06, rotationZ: 0.15 }),
  Object.freeze({ x: 0.66, y: 1.55, z: -0.10, rotationZ: -0.15 }),
  Object.freeze({ x: -0.94, y: 1.78, z: -0.08, rotationZ: 0.22 }),
  Object.freeze({ x: 1.02, y: 1.84, z: 0.08, rotationZ: -0.22 }),
  Object.freeze({ x: -1.28, y: 2.08, z: 0.10, rotationZ: 0.30 }),
  Object.freeze({ x: 1.36, y: 2.14, z: -0.06, rotationZ: -0.30 }),
]);

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

  if (index < HYDRA_I_HEAD_POSES.length) {
    return HYDRA_I_HEAD_POSES[index];
  }

  const extraIndex = index - HYDRA_I_HEAD_POSES.length;
  const tier = Math.floor(extraIndex / 18) + 1;
  const slot = extraIndex % 18;
  const normalized = slot / 17;
  const side = normalized * 2 - 1;
  const spread = 1.42 + tier * 0.22;
  const height = 1.08 + Math.abs(side) * 1.55 + tier * 0.20;

  return Object.freeze({
    x: side * spread,
    y: height,
    z: ((slot % 3) - 1) * 0.10 - tier * 0.012,
    rotationZ: -side * 0.30,
  });
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
  root.position.set(pose.x, pose.y, pose.z);
  root.rotation.z = pose.rotationZ;

  const neck = babylon.MeshBuilder.CreateCylinder(`hydra-neck-${index}`, {
    height: 0.82,
    diameterTop: 0.16,
    diameterBottom: 0.24,
    tessellation: 5,
  }, scene);
  neck.parent = root;
  neck.position.y = -0.33;
  neck.material = neckMaterial;
  neck.isPickable = false;

  const head = babylon.MeshBuilder.CreatePolyhedron(`hydra-head-${index}`, {
    type: 1,
    size: 0.27,
  }, scene);
  head.parent = root;
  head.scaling.set(1.32, 0.78, 0.92);
  head.position.set(-0.04, 0.16, 0);
  head.rotation.z = -0.10;
  head.material = headMaterial;
  head.isPickable = false;

  const snout = babylon.MeshBuilder.CreateBox(`hydra-snout-${index}`, {
    width: 0.25,
    height: 0.13,
    depth: 0.18,
  }, scene);
  snout.parent = root;
  snout.position.set(-0.20, 0.12, 0);
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

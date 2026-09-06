export const INITIAL_HYDRA_HEAD_POOL_SIZE = 9;
export const MAX_VISIBLE_HEADS = 99;

const HYDRA_I_HEAD_POSES = Object.freeze([
  Object.freeze({ x: -0.82, y: 1.18, z: 0.10, rotationZ: -0.42 }),
  Object.freeze({ x: -0.66, y: 1.58, z: -0.10, rotationZ: -0.31 }),
  Object.freeze({ x: -0.44, y: 1.86, z: 0.06, rotationZ: -0.20 }),
  Object.freeze({ x: -0.20, y: 2.05, z: -0.06, rotationZ: -0.10 }),
  Object.freeze({ x: 0.04, y: 2.12, z: 0.08, rotationZ: 0 }),
  Object.freeze({ x: 0.28, y: 2.03, z: -0.08, rotationZ: 0.10 }),
  Object.freeze({ x: 0.50, y: 1.82, z: 0.06, rotationZ: 0.20 }),
  Object.freeze({ x: 0.68, y: 1.52, z: -0.10, rotationZ: 0.31 }),
  Object.freeze({ x: 0.80, y: 1.14, z: 0.10, rotationZ: 0.42 }),
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
  const ring = Math.floor(extraIndex / 18) + 1;
  const slot = extraIndex % 18;
  const angle = (-Math.PI * 0.92) + (slot / 17) * Math.PI * 0.84;
  const radiusX = 0.88 + ring * 0.16;
  const radiusY = 1.05 + ring * 0.12;

  return Object.freeze({
    x: Math.cos(angle) * radiusX,
    y: 1.08 + Math.sin(angle) * radiusY + ring * 0.16,
    z: ((slot % 3) - 1) * 0.10 - ring * 0.012,
    rotationZ: angle * 0.28,
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

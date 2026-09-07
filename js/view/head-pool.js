export const INITIAL_HYDRA_HEAD_POOL_SIZE = 9;
export const MAX_VISIBLE_HEADS = 99;

// Visual-only polar fan. Slots use a deterministic low-discrepancy sequence so
// every prefix (9 heads, 20 heads, 99 heads...) fills the *area* of the fan
// instead of tracing only its two V-shaped edges.
const FAN_HALF_ANGLE_RADIANS = 0.78;
const FAN_MIN_RADIUS = 0.72;
const FAN_MAX_RADIUS = 2.15;
const FAN_ORIGIN_Y = 0.38;
const FAN_DEPTH = 0.22;

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

function createFilledFanPose(index) {
  // Halton bases 2 / 3 distribute angular and radial coordinates independently.
  // Radius is area-corrected with sqrt so points do not bunch up at the root.
  const sequenceIndex = index + 1;
  const angularSample = radicalInverse(sequenceIndex, 2);
  const radialSample = radicalInverse(sequenceIndex, 3);
  const depthSample = radicalInverse(sequenceIndex, 5);

  const angle = -FAN_HALF_ANGLE_RADIANS
    + angularSample * FAN_HALF_ANGLE_RADIANS * 2;
  const radiusSquared = FAN_MIN_RADIUS ** 2
    + radialSample * (FAN_MAX_RADIUS ** 2 - FAN_MIN_RADIUS ** 2);
  const radius = Math.sqrt(radiusSquared);

  return Object.freeze({
    x: Math.sin(angle) * radius,
    y: FAN_ORIGIN_Y + Math.cos(angle) * radius,
    z: (depthSample - 0.5) * FAN_DEPTH,
    // Local +Y points away from the common root, so each neck reads as one
    // radial spoke rather than a vertical stalk placed somewhere in a triangle.
    rotationZ: -angle,
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

  return createFilledFanPose(index);
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

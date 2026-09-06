import { createHydraHeadPool } from './head-pool.js';

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

export function createHydraView({
  scene,
  anchor,
  babylon = globalThis.BABYLON,
} = {}) {
  if (!scene) throw new TypeError('Hydra view requires a Babylon scene.');
  if (!anchor) throw new TypeError('Hydra view requires the Hydra stage anchor.');
  requireBabylon(babylon);

  const root = new babylon.TransformNode('hydra-view-root', scene);
  root.parent = anchor;
  root.position.set(0, -0.18, 0);

  const bodyMaterial = new babylon.StandardMaterial('hydra-body-material', scene);
  bodyMaterial.diffuseColor = new babylon.Color3(0.12, 0.17, 0.12);
  bodyMaterial.specularColor = new babylon.Color3(0.025, 0.025, 0.025);

  const body = babylon.MeshBuilder.CreatePolyhedron('hydra-body', {
    type: 2,
    size: 0.82,
  }, scene);
  body.parent = root;
  body.position.set(0.06, 0.42, 0.18);
  body.scaling.set(1.25, 0.88, 0.90);
  body.rotation.z = -0.08;
  body.material = bodyMaterial;
  body.isPickable = false;

  const haunch = babylon.MeshBuilder.CreatePolyhedron('hydra-haunch', {
    type: 1,
    size: 0.56,
  }, scene);
  haunch.parent = root;
  haunch.position.set(0.44, 0.32, 0.22);
  haunch.scaling.set(1.22, 0.74, 0.88);
  haunch.material = bodyMaterial;
  haunch.isPickable = false;

  const tail = babylon.MeshBuilder.CreateCylinder('hydra-tail-placeholder', {
    height: 1.15,
    diameterTop: 0.08,
    diameterBottom: 0.24,
    tessellation: 5,
  }, scene);
  tail.parent = root;
  tail.position.set(0.78, 0.24, 0.20);
  tail.rotation.z = -1.18;
  tail.material = bodyMaterial;
  tail.isPickable = false;

  const pool = createHydraHeadPool({
    scene,
    parent: root,
    babylon,
  });

  let lastLogicalHeadCount = null;

  const render = (snapshot) => {
    const logicalHeadCount = snapshot?.hydra?.logicalHeadCount;
    if (typeof logicalHeadCount !== 'bigint' || logicalHeadCount < 0n) {
      throw new TypeError('Hydra view requires snapshot.hydra.logicalHeadCount as a non-negative BigInt.');
    }

    if (logicalHeadCount === lastLogicalHeadCount) return pool.getVisibleCount();
    lastLogicalHeadCount = logicalHeadCount;
    return pool.setLogicalHeadCount(logicalHeadCount);
  };

  return {
    root,
    pool,
    render,
    destroy() {
      pool.destroy();
      bodyMaterial.dispose();
      root.dispose(false);
    },
  };
}

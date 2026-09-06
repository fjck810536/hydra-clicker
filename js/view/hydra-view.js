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

  const rootMaterial = new babylon.StandardMaterial('hydra-root-material', scene);
  rootMaterial.diffuseColor = new babylon.Color3(0.12, 0.17, 0.12);
  rootMaterial.specularColor = new babylon.Color3(0.025, 0.025, 0.025);

  // Playtest 2 silhouette: no large torso/haunch/tail. Keep only a tiny visual
  // root so the neck fan reads as one organism instead of floating heads.
  const rootBase = babylon.MeshBuilder.CreatePolyhedron('hydra-root-base', {
    type: 1,
    size: 0.36,
  }, scene);
  rootBase.parent = root;
  rootBase.position.set(0.02, 0.34, 0.16);
  rootBase.scaling.set(1.05, 0.48, 0.82);
  rootBase.material = rootMaterial;
  rootBase.isPickable = false;

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
      rootMaterial.dispose();
      root.dispose(false);
    },
  };
}

export const BERSERKER_VIEW_SPEC = Object.freeze({
  attackDurationMs: 180,
  idleBobAmplitude: 0.045,
  idleBobSpeed: 0.0045,
  restRotationZ: -0.32,
  strikeRotationZ: 1.05,
});

function requireBabylon(babylon) {
  const required = [
    'TransformNode',
    'MeshBuilder',
    'StandardMaterial',
    'Color3',
    'Vector3',
    'Quaternion',
    'Animation',
  ];

  for (const key of required) {
    if (!babylon?.[key]) {
      throw new Error(`Babylon dependency is missing ${key}.`);
    }
  }
}

function makeMaterial({ babylon, scene, name, diffuse }) {
  const material = new babylon.StandardMaterial(name, scene);
  material.diffuseColor = new babylon.Color3(...diffuse);
  material.specularColor = new babylon.Color3(0.08, 0.08, 0.08);
  return material;
}

function createPrimitiveBody({ babylon, scene, root }) {
  const skin = makeMaterial({
    babylon,
    scene,
    name: 'berserker-skin',
    diffuse: [0.43, 0.30, 0.25],
  });
  const armor = makeMaterial({
    babylon,
    scene,
    name: 'berserker-armor',
    diffuse: [0.13, 0.12, 0.14],
  });
  const weaponMaterial = makeMaterial({
    babylon,
    scene,
    name: 'berserker-weapon',
    diffuse: [0.28, 0.29, 0.31],
  });

  const torso = babylon.MeshBuilder.CreateBox('berserker-torso', {
    width: 0.82,
    height: 1.28,
    depth: 0.50,
  }, scene);
  torso.parent = root;
  torso.position.set(0, 1.37, 0);
  torso.scaling.x = 1.08;
  torso.material = armor;
  torso.isPickable = false;

  const waist = babylon.MeshBuilder.CreateBox('berserker-waist', {
    width: 0.56,
    height: 0.50,
    depth: 0.42,
  }, scene);
  waist.parent = root;
  waist.position.set(0, 0.53, 0);
  waist.material = armor;
  waist.isPickable = false;

  const head = babylon.MeshBuilder.CreatePolyhedron('berserker-head', {
    type: 1,
    size: 0.38,
  }, scene);
  head.parent = root;
  head.position.set(0.02, 2.24, 0);
  head.scaling.y = 1.15;
  head.material = skin;
  head.isPickable = false;

  const leftLeg = babylon.MeshBuilder.CreateCylinder('berserker-left-leg', {
    height: 1.02,
    diameterTop: 0.30,
    diameterBottom: 0.40,
    tessellation: 5,
  }, scene);
  leftLeg.parent = root;
  leftLeg.position.set(-0.25, -0.17, 0);
  leftLeg.material = armor;
  leftLeg.isPickable = false;

  const rightLeg = leftLeg.clone('berserker-right-leg');
  rightLeg.parent = root;
  rightLeg.position.x = 0.25;

  const leftArm = babylon.MeshBuilder.CreateCylinder('berserker-left-arm', {
    height: 1.10,
    diameterTop: 0.34,
    diameterBottom: 0.26,
    tessellation: 5,
  }, scene);
  leftArm.parent = root;
  leftArm.position.set(-0.58, 1.30, 0);
  leftArm.rotation.z = -0.15;
  leftArm.material = skin;
  leftArm.isPickable = false;

  const weaponPivot = new babylon.TransformNode('berserker-weapon-pivot', scene);
  weaponPivot.parent = root;
  weaponPivot.position.set(0.47, 1.70, 0);
  weaponPivot.rotation.z = BERSERKER_VIEW_SPEC.restRotationZ;

  const rightArm = babylon.MeshBuilder.CreateCylinder('berserker-right-arm', {
    height: 1.16,
    diameterTop: 0.37,
    diameterBottom: 0.26,
    tessellation: 5,
  }, scene);
  rightArm.parent = weaponPivot;
  rightArm.position.set(0, -0.44, 0);
  rightArm.material = skin;
  rightArm.isPickable = false;

  const weapon = babylon.MeshBuilder.CreateBox('berserker-weapon', {
    width: 0.22,
    height: 2.15,
    depth: 0.18,
  }, scene);
  weapon.parent = weaponPivot;
  weapon.position.set(0.10, 0.54, 0);
  weapon.rotation.z = -0.08;
  weapon.material = weaponMaterial;
  weapon.isPickable = false;

  const blade = babylon.MeshBuilder.CreatePolyhedron('berserker-blade', {
    type: 1,
    size: 0.48,
  }, scene);
  blade.parent = weaponPivot;
  blade.position.set(0.08, 1.58, 0);
  blade.scaling.set(0.55, 1.65, 0.38);
  blade.material = weaponMaterial;
  blade.isPickable = false;

  return {
    weaponPivot,
    materials: [skin, armor, weaponMaterial],
  };
}

function createStrikeAnimation({ babylon, weaponPivot }) {
  const animation = new babylon.Animation(
    'berserker-strike',
    'rotation.z',
    60,
    babylon.Animation.ANIMATIONTYPE_FLOAT,
    babylon.Animation.ANIMATIONLOOPMODE_CONSTANT,
  );

  animation.setKeys([
    { frame: 0, value: BERSERKER_VIEW_SPEC.restRotationZ },
    { frame: 3, value: BERSERKER_VIEW_SPEC.restRotationZ - 0.35 },
    { frame: 7, value: BERSERKER_VIEW_SPEC.strikeRotationZ },
    { frame: 11, value: BERSERKER_VIEW_SPEC.restRotationZ },
  ]);

  weaponPivot.animations = [animation];
  return animation;
}

export function createBerserkerView({
  scene,
  anchor,
  babylon = globalThis.BABYLON,
} = {}) {
  if (!scene || !anchor) {
    throw new TypeError('createBerserkerView requires scene and anchor.');
  }
  requireBabylon(babylon);

  const root = new babylon.TransformNode('berserker-view-root', scene);
  root.parent = anchor;
  root.position.set(-0.10, -1.03, 0);
  root.scaling.setAll(0.82);

  const { weaponPivot, materials } = createPrimitiveBody({ babylon, scene, root });
  createStrikeAnimation({ babylon, weaponPivot });

  const idleStartMs = performance.now();
  const idleObserver = scene.onBeforeRenderObservable.add(() => {
    const elapsed = performance.now() - idleStartMs;
    root.position.y = -1.03 + Math.sin(elapsed * BERSERKER_VIEW_SPEC.idleBobSpeed)
      * BERSERKER_VIEW_SPEC.idleBobAmplitude;
  });

  let currentAnimation = null;

  function playAttack({ speed = 1 } = {}) {
    const safeSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1;
    const speedRatio = Math.max(0.25, Math.min(8, safeSpeed));

    if (currentAnimation) {
      scene.stopAnimation(weaponPivot);
    }

    currentAnimation = scene.beginAnimation(
      weaponPivot,
      0,
      11,
      false,
      speedRatio,
      () => {
        currentAnimation = null;
        weaponPivot.rotation.z = BERSERKER_VIEW_SPEC.restRotationZ;
      },
    );

    return currentAnimation;
  }

  return {
    root,
    weaponPivot,
    playAttack,
    destroy() {
      scene.stopAnimation(weaponPivot);
      scene.onBeforeRenderObservable.remove(idleObserver);
      root.dispose(false, true);
      for (const material of materials) material.dispose();
    },
  };
}

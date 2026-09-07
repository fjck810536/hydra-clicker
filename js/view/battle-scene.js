export const BATTLE_STAGE_SPEC = Object.freeze({
  virtualHeight: 11,
  berserkerAnchor: Object.freeze({ x: -1.55, y: 1.15, z: 0 }),
  hydraAnchor: Object.freeze({ x: 1.55, y: 1.15, z: 0 }),
  camera: Object.freeze({ x: 0, y: 3.1, z: -14 }),
  target: Object.freeze({ x: 0, y: 2.65, z: 0 }),
});

const GENERATION_STAGE_PALETTES = Object.freeze({
  1: Object.freeze({
    clear: Object.freeze([0.035, 0.035, 0.045]),
    backdrop: Object.freeze([0.055, 0.06, 0.075]),
    backdropEmissive: Object.freeze([0, 0, 0]),
    groundEmissive: Object.freeze([0, 0, 0]),
  }),
  2: Object.freeze({
    clear: Object.freeze([0.038, 0.044, 0.027]),
    backdrop: Object.freeze([0.068, 0.078, 0.046]),
    backdropEmissive: Object.freeze([0.008, 0.012, 0.003]),
    groundEmissive: Object.freeze([0.005, 0.008, 0.002]),
  }),
  3: Object.freeze({
    clear: Object.freeze([0.033, 0.029, 0.047]),
    backdrop: Object.freeze([0.062, 0.052, 0.080]),
    backdropEmissive: Object.freeze([0.007, 0.004, 0.012]),
    groundEmissive: Object.freeze([0.004, 0.002, 0.008]),
  }),
});

function requireBabylon(babylon) {
  const required = [
    'Engine',
    'Scene',
    'Camera',
    'Vector3',
    'Color3',
    'Color4',
    'FreeCamera',
    'HemisphericLight',
    'DirectionalLight',
    'MeshBuilder',
    'StandardMaterial',
    'TransformNode',
  ];

  for (const key of required) {
    if (!babylon?.[key]) {
      throw new Error(`Babylon dependency is missing ${key}.`);
    }
  }
}

function applyPortraitOrtho({ camera, engine, babylon }) {
  const renderWidth = Math.max(1, engine.getRenderWidth());
  const renderHeight = Math.max(1, engine.getRenderHeight());
  const aspect = renderWidth / renderHeight;
  const halfHeight = BATTLE_STAGE_SPEC.virtualHeight / 2;
  const halfWidth = halfHeight * aspect;

  camera.mode = babylon.Camera.ORTHOGRAPHIC_CAMERA;
  camera.orthoLeft = -halfWidth;
  camera.orthoRight = halfWidth;
  camera.orthoTop = halfHeight;
  camera.orthoBottom = -halfHeight;
}

function createAnchorMarker({ babylon, scene, name, position }) {
  const anchor = new babylon.TransformNode(name, scene);
  anchor.position.copyFromFloats(position.x, position.y, position.z);

  const marker = babylon.MeshBuilder.CreatePolyhedron(`${name}-marker`, {
    type: 1,
    size: 0.22,
  }, scene);
  marker.parent = anchor;
  marker.position.y = 0.1;
  marker.isPickable = false;

  const material = new babylon.StandardMaterial(`${name}-marker-material`, scene);
  material.diffuseColor = new babylon.Color3(0.55, 0.55, 0.55);
  material.emissiveColor = new babylon.Color3(0.12, 0.12, 0.12);
  material.disableLighting = false;
  marker.material = material;

  return anchor;
}

export function createBattleStage({
  canvas,
  babylon = globalThis.BABYLON,
  onStageTap = null,
} = {}) {
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new TypeError('createBattleStage requires a canvas element.');
  }
  requireBabylon(babylon);

  const engine = new babylon.Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
    adaptToDeviceRatio: true,
  });
  const scene = new babylon.Scene(engine);
  scene.clearColor = new babylon.Color4(0.035, 0.035, 0.045, 1);

  const camera = new babylon.FreeCamera(
    'battle-camera',
    new babylon.Vector3(
      BATTLE_STAGE_SPEC.camera.x,
      BATTLE_STAGE_SPEC.camera.y,
      BATTLE_STAGE_SPEC.camera.z,
    ),
    scene,
  );
  camera.setTarget(new babylon.Vector3(
    BATTLE_STAGE_SPEC.target.x,
    BATTLE_STAGE_SPEC.target.y,
    BATTLE_STAGE_SPEC.target.z,
  ));
  camera.minZ = 0.1;
  camera.maxZ = 100;
  scene.activeCamera = camera;

  const hemi = new babylon.HemisphericLight(
    'stage-hemi',
    new babylon.Vector3(0, 1, -0.5),
    scene,
  );
  hemi.intensity = 0.8;

  const key = new babylon.DirectionalLight(
    'stage-key',
    new babylon.Vector3(-0.4, -0.8, 0.6),
    scene,
  );
  key.position = new babylon.Vector3(3, 7, -5);
  key.intensity = 1.1;

  const backdrop = babylon.MeshBuilder.CreatePlane('stage-backdrop', {
    width: 14,
    height: 16,
  }, scene);
  backdrop.position.set(0, 3.3, 2.2);
  backdrop.isPickable = false;

  const backdropMaterial = new babylon.StandardMaterial('stage-backdrop-material', scene);
  backdropMaterial.diffuseColor = new babylon.Color3(0.055, 0.06, 0.075);
  backdropMaterial.emissiveColor = new babylon.Color3(0, 0, 0);
  backdropMaterial.specularColor = babylon.Color3.Black();
  backdrop.material = backdropMaterial;

  const ground = babylon.MeshBuilder.CreateBox('stage-ground', {
    width: 8,
    height: 0.32,
    depth: 3.2,
  }, scene);
  ground.position.set(0, -0.16, 0.6);
  ground.isPickable = false;

  const groundMaterial = new babylon.StandardMaterial('stage-ground-material', scene);
  groundMaterial.diffuseColor = new babylon.Color3(0.10, 0.10, 0.12);
  groundMaterial.emissiveColor = new babylon.Color3(0, 0, 0);
  groundMaterial.specularColor = new babylon.Color3(0.05, 0.05, 0.05);
  ground.material = groundMaterial;

  let npTintActive = false;
  let generationAppearance = 1;

  const applyVisualState = () => {
    if (npTintActive) {
      scene.clearColor.copyFromFloats(0.075, 0.018, 0.022, 1);
      backdropMaterial.diffuseColor.copyFromFloats(0.12, 0.028, 0.035);
      backdropMaterial.emissiveColor.copyFromFloats(0.055, 0.006, 0.008);
      groundMaterial.emissiveColor.copyFromFloats(0.035, 0.004, 0.005);
      return;
    }

    const palette = GENERATION_STAGE_PALETTES[generationAppearance]
      ?? GENERATION_STAGE_PALETTES[1];
    scene.clearColor.copyFromFloats(...palette.clear, 1);
    backdropMaterial.diffuseColor.copyFromFloats(...palette.backdrop);
    backdropMaterial.emissiveColor.copyFromFloats(...palette.backdropEmissive);
    groundMaterial.emissiveColor.copyFromFloats(...palette.groundEmissive);
  };

  const setGenerationAppearance = (generation) => {
    if (!Number.isInteger(generation) || generation < 1) {
      throw new TypeError('generation appearance must be a positive integer.');
    }
    if (generation === generationAppearance) return;
    generationAppearance = generation;
    applyVisualState();
  };

  const setNpActive = (active) => {
    const nextActive = Boolean(active);
    if (nextActive === npTintActive) return;
    npTintActive = nextActive;
    applyVisualState();
  };

  const berserkerAnchor = createAnchorMarker({
    babylon,
    scene,
    name: 'berserker-anchor',
    position: BATTLE_STAGE_SPEC.berserkerAnchor,
  });
  const hydraAnchor = createAnchorMarker({
    babylon,
    scene,
    name: 'hydra-anchor',
    position: BATTLE_STAGE_SPEC.hydraAnchor,
  });

  const resize = () => {
    engine.resize();
    applyPortraitOrtho({ camera, engine, babylon });
  };

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.visualViewport?.addEventListener('resize', resize, { passive: true });

  let lastTapMs = -Infinity;
  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const now = performance.now();
    if (now - lastTapMs < 220) {
      event.preventDefault();
    }
    lastTapMs = now;

    onStageTap?.(event);
  };

  const preventGesture = (event) => event.preventDefault();
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('gesturestart', preventGesture, { passive: false });
  canvas.addEventListener('gesturechange', preventGesture, { passive: false });
  canvas.addEventListener('gestureend', preventGesture, { passive: false });

  engine.runRenderLoop(() => {
    scene.render();
  });

  return {
    engine,
    scene,
    camera,
    setNpActive,
    setGenerationAppearance,
    anchors: Object.freeze({
      berserker: berserkerAnchor,
      hydra: hydraAnchor,
    }),
    destroy() {
      engine.stopRenderLoop();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('gesturestart', preventGesture);
      canvas.removeEventListener('gesturechange', preventGesture);
      canvas.removeEventListener('gestureend', preventGesture);
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      scene.dispose();
      engine.dispose();
    },
  };
}

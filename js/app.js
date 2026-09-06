import { createHydraIGameRuntime } from './core/game.js';
import { createBattleStage } from './view/battle-scene.js';
import { createHudView } from './view/hud-view.js';
import { createHydraView } from './view/hydra-view.js';
import { createBerserkerView } from './view/berserker-view.js';

const app = document.querySelector('[data-app]');
const canvas = document.querySelector('#battle-canvas');

if (!app || !canvas) {
  throw new Error('Hydra Clicker app shell is missing.');
}

const runtime = createHydraIGameRuntime();
const hud = createHudView({ root: app });

const stage = createBattleStage({
  canvas,
  onStageTap: () => {
    runtime.manualAttack();
  },
});

const hydraView = createHydraView({
  scene: stage.scene,
  anchor: stage.anchors.hydra,
});

const berserkerView = createBerserkerView({
  scene: stage.scene,
  anchor: stage.anchors.berserker,
});

const renderSnapshot = () => {
  const snapshot = runtime.snapshot();
  hud.render(snapshot);
  hydraView.render(snapshot);
};

const offTick = runtime.events.on('clock:tick', renderSnapshot);
const offAttackResolved = runtime.events.on('attack:resolved', ({ payload }) => {
  if (!payload.resolution.accepted) return;

  const snapshot = runtime.snapshot();
  berserkerView.playAttack({
    speed: snapshot.berserker.baseAttacksPerSecond,
  });
});
const offCut = runtime.events.on('head:cut', ({ payload }) => {
  hud.setStatus(`CUT ${payload.amount.toString()} · Hydra I regeneration pending`);
  renderSnapshot();
});
const offRegrow = runtime.events.on('head:regrow', ({ payload }) => {
  hud.setStatus(`REGROW +${payload.amount.toString()}`);
  renderSnapshot();
});

renderSnapshot();
hud.setStatus('Tap the stage: Berserker attacks, one Hydra head disappears, then regrows.');
runtime.start();

window.addEventListener('pagehide', () => {
  offTick();
  offAttackResolved();
  offCut();
  offRegrow();
  berserkerView.destroy();
  hydraView.destroy();
  stage.destroy();
  runtime.destroy();
}, { once: true });

import { createHydraIGameRuntime } from './core/game.js';
import { createBattleStage } from './view/battle-scene.js';
import { createHudView } from './view/hud-view.js';
import { createHydraView } from './view/hydra-view.js';
import { createBerserkerView } from './view/berserker-view.js';

const app = document.querySelector('[data-app]');
const canvas = document.querySelector('#battle-canvas');
const npButton = document.querySelector('[data-np-button]');

if (!app || !canvas || !npButton) {
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

const handleNpPress = () => {
  const result = runtime.releaseNp();
  if (result.accepted) {
    hud.setStatus('NP RELEASE · Hydra regeneration suspended for 3.0 s');
  }
  renderSnapshot();
};
npButton.addEventListener('click', handleNpPress);

const offTick = runtime.events.on('clock:tick', renderSnapshot);
const offAttackResolved = runtime.events.on('attack:resolved', ({ payload }) => {
  if (!payload.resolution.accepted) return;

  const snapshot = runtime.snapshot();
  berserkerView.playAttack({
    speed: snapshot.berserker.baseAttacksPerSecond,
  });
});
const offCut = runtime.events.on('head:cut', ({ payload }) => {
  hud.setStatus(payload.killed
    ? `CUT ${payload.amount.toString()} · TERMINAL CUT`
    : `CUT ${payload.amount.toString()}`);
  renderSnapshot();
});
const offRegrow = runtime.events.on('head:regrow', ({ payload }) => {
  hud.setStatus(`REGROW +${payload.amount.toString()}`);
  renderSnapshot();
});
const offNpReleased = runtime.events.on('np:released', () => {
  renderSnapshot();
});
const offKilled = runtime.events.on('hydra:killed', () => {
  hud.setStatus('HYDRA I DEFEATED · regeneration queue destroyed');
  renderSnapshot();
});

renderSnapshot();
hud.setStatus('Cut 8 heads to charge NP. Release it, then finish Hydra before regeneration returns.');
runtime.start();

window.addEventListener('pagehide', () => {
  npButton.removeEventListener('click', handleNpPress);
  offTick();
  offAttackResolved();
  offCut();
  offRegrow();
  offNpReleased();
  offKilled();
  berserkerView.destroy();
  hydraView.destroy();
  stage.destroy();
  runtime.destroy();
}, { once: true });

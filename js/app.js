import { createHydraIGameRuntime } from './core/game.js';
import { createBattleStage } from './view/battle-scene.js';
import { createHudView } from './view/hud-view.js';

const app = document.querySelector('[data-app]');
const canvas = document.querySelector('#battle-canvas');

if (!app || !canvas) {
  throw new Error('Hydra Clicker app shell is missing.');
}

const runtime = createHydraIGameRuntime();
const hud = createHudView({ root: app });

const renderHud = () => hud.render(runtime.snapshot());

const stage = createBattleStage({
  canvas,
  onStageTap: () => {
    runtime.manualAttack();
  },
});

const offTick = runtime.events.on('clock:tick', renderHud);
const offCut = runtime.events.on('head:cut', ({ payload }) => {
  hud.setStatus(`CUT ${payload.amount.toString()} · Hydra I regeneration pending`);
  renderHud();
});
const offRegrow = runtime.events.on('head:regrow', ({ payload }) => {
  hud.setStatus(`REGROW +${payload.amount.toString()}`);
  renderHud();
});

renderHud();
hud.setStatus('Tap the stage to test the headless Hydra I loop.');
runtime.start();

window.addEventListener('pagehide', () => {
  offTick();
  offCut();
  offRegrow();
  stage.destroy();
  runtime.destroy();
}, { once: true });

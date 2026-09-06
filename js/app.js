import { createHydraIGameRuntime } from './core/game.js';
import { createBattleStage } from './view/battle-scene.js';
import { createHudView } from './view/hud-view.js';
import { createHydraView } from './view/hydra-view.js';
import { createBerserkerView } from './view/berserker-view.js';

const app = document.querySelector('[data-app]');
const canvas = document.querySelector('#battle-canvas');
const npButton = document.querySelector('[data-np-button]');
const commandSpellButton = document.querySelector('[data-command-spell-button]');

if (!app || !canvas || !npButton || !commandSpellButton) {
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
  hud.render(snapshot, {
    commandSpellI: runtime.commandSpellIStatus(),
  });
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

const handleCommandSpellPress = () => {
  const result = runtime.buyCommandSpellI();
  if (result.accepted) {
    hud.setStatus('COMMAND SPELL I · AUTO SLASH UNLOCKED');
  }
  renderSnapshot();
};
commandSpellButton.addEventListener('click', handleCommandSpellPress);

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
  hud.setStatus('HYDRA I DEFEATED');
  renderSnapshot();
});
const offCurrencyGain = runtime.events.on('currency:gain', ({ payload }) => {
  if (payload.currency === 'humanity-evil') {
    hud.setStatus(`人類惡 +${payload.amount.toString()}`);
    renderSnapshot();
  }
});
const offRespawned = runtime.events.on('hydra:respawned', ({ payload }) => {
  hud.setStatus(`HYDRA I · ENCOUNTER ${payload.encounter.toString()}`);
  renderSnapshot();
});
const offSpellAvailable = runtime.events.on('command-spell:available', () => {
  hud.setStatus('COMMAND SPELL I AVAILABLE · 99 人類惡');
  renderSnapshot();
});
const offSpellUnlocked = runtime.events.on('command-spell:unlocked', () => {
  hud.setStatus('AUTO SLASH ONLINE');
  renderSnapshot();
});

renderSnapshot();
hud.setStatus('Defeat Hydra I repeatedly. 9 kills unlock Command Spell I.');
runtime.start();

window.addEventListener('pagehide', () => {
  npButton.removeEventListener('click', handleNpPress);
  commandSpellButton.removeEventListener('click', handleCommandSpellPress);
  offTick();
  offAttackResolved();
  offCut();
  offRegrow();
  offNpReleased();
  offKilled();
  offCurrencyGain();
  offRespawned();
  offSpellAvailable();
  offSpellUnlocked();
  berserkerView.destroy();
  hydraView.destroy();
  stage.destroy();
  runtime.destroy();
}, { once: true });

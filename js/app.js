import { createHydraIGameRuntime } from './core/game.js';
import { createSaveStore } from './core/save.js';
import { createBattleStage } from './view/battle-scene.js';
import { createHudView } from './view/hud-view.js';
import { createHydraView } from './view/hydra-view.js';
import { createBerserkerView } from './view/berserker-view.js';

const AUTOSAVE_INTERVAL_MS = 5000;

const app = document.querySelector('[data-app]');
const canvas = document.querySelector('#battle-canvas');
const npButton = document.querySelector('[data-np-button]');
const commandSpellButton = document.querySelector('[data-command-spell-button]');
const testToolsToggle = document.querySelector('[data-test-tools-toggle]');
const testToolsPanel = document.querySelector('[data-test-tools-panel]');
const resetSaveButton = document.querySelector('[data-reset-save]');
const regenDelayReadout = document.querySelector('[data-test-regen-delay]');

if (
  !app
  || !canvas
  || !npButton
  || !commandSpellButton
  || !testToolsToggle
  || !testToolsPanel
  || !resetSaveButton
  || !regenDelayReadout
) {
  throw new Error('Hydra Clicker app shell is missing.');
}

function bindFixedControl(button, handler) {
  const handlePointerUp = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    handler();
  };

  // Pointer-generated click is suppressed so Safari never gets a second
  // synthesized tap to use for smart zoom. detail === 0 preserves keyboard activation.
  const handleClick = (event) => {
    event.preventDefault();
    if (event.detail === 0) handler();
  };

  const preventGesture = (event) => event.preventDefault();

  button.addEventListener('pointerup', handlePointerUp, { passive: false });
  button.addEventListener('click', handleClick, { passive: false });
  button.addEventListener('dblclick', preventGesture, { passive: false });
  button.addEventListener('gesturestart', preventGesture, { passive: false });
  button.addEventListener('gesturechange', preventGesture, { passive: false });
  button.addEventListener('gestureend', preventGesture, { passive: false });

  return () => {
    button.removeEventListener('pointerup', handlePointerUp);
    button.removeEventListener('click', handleClick);
    button.removeEventListener('dblclick', preventGesture);
    button.removeEventListener('gesturestart', preventGesture);
    button.removeEventListener('gesturechange', preventGesture);
    button.removeEventListener('gestureend', preventGesture);
  };
}

function isNpWindowActive(snapshot) {
  const nowMs = snapshot.time.simulationTimeMs;
  return snapshot.modifiers.active.some((modifier) => {
    return modifier?.source === 'np'
      && (modifier.startsAt ?? 0) <= nowMs
      && nowMs < (modifier.endsAt ?? Infinity);
  });
}

let saveStore = null;
let restoredSave = null;
let suppressPersistence = false;

try {
  saveStore = createSaveStore({ storage: window.localStorage });
  restoredSave = saveStore.load();
} catch (error) {
  console.warn('Hydra Clicker save data is unavailable; starting a fresh session.', error);
}

let runtime;
let restoredFromSave = false;

if (restoredSave) {
  try {
    runtime = createHydraIGameRuntime({ initialState: restoredSave.state });
    restoredFromSave = true;
  } catch (error) {
    console.warn('Hydra Clicker save data failed logical validation; starting fresh.', error);
  }
}

runtime ??= createHydraIGameRuntime();

const hud = createHudView({ root: app });

function persistNow() {
  if (suppressPersistence || !saveStore) return false;

  try {
    saveStore.save(runtime.snapshot());
    return true;
  } catch (error) {
    console.warn('Hydra Clicker autosave failed.', error);
    return false;
  }
}

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
  stage.setNpActive(isNpWindowActive(snapshot));
  regenDelayReadout.textContent = `${runtime.currentRegenDelayMs()} ms`;
};

const handleNpPress = () => {
  const result = runtime.releaseNp();
  if (result.accepted) {
    hud.setStatus('NP RELEASE · regeneration suppressed for 3.0 s');
  }
  renderSnapshot();
};
const unbindNpButton = bindFixedControl(npButton, handleNpPress);

const handleCommandSpellPress = () => {
  const result = runtime.buyCommandSpellI();
  if (result.accepted) {
    persistNow();
    hud.setStatus('COMMAND SPELL I · AUTO SLASH UNLOCKED');
  }
  renderSnapshot();
};
const unbindCommandSpellButton = bindFixedControl(commandSpellButton, handleCommandSpellPress);

const handleTestToolsToggle = () => {
  testToolsPanel.hidden = !testToolsPanel.hidden;
};
const unbindTestToolsToggle = bindFixedControl(testToolsToggle, handleTestToolsToggle);

const handleResetSave = () => {
  suppressPersistence = true;
  try {
    saveStore?.clear();
  } catch (error) {
    console.warn('Hydra Clicker save reset failed.', error);
  }
  window.location.reload();
};
const unbindResetSave = bindFixedControl(resetSaveButton, handleResetSave);

let nextAutosaveAtMs = runtime.snapshot().time.simulationTimeMs + AUTOSAVE_INTERVAL_MS;

const offTick = runtime.events.on('clock:tick', ({ payload: tick }) => {
  renderSnapshot();

  if (tick.nowMs >= nextAutosaveAtMs) {
    persistNow();
    while (nextAutosaveAtMs <= tick.nowMs) {
      nextAutosaveAtMs += AUTOSAVE_INTERVAL_MS;
    }
  }
});
const offAttackResolved = runtime.events.on('attack:resolved', ({ payload }) => {
  if (!payload.resolution.accepted) return;

  const snapshot = runtime.snapshot();
  berserkerView.playAttack({
    speed: snapshot.berserker.baseAttacksPerSecond,
  });
});
const offCut = runtime.events.on('head:cut', ({ payload }) => {
  hud.setStatus(payload.killed
    ? `CUT ${payload.amount.toString()} · HYDRA DOWN`
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
    persistNow();
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
  persistNow();
  hud.setStatus('AUTO SLASH ONLINE');
  renderSnapshot();
});

const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    persistNow();
  }
};
document.addEventListener('visibilitychange', handleVisibilityChange);

renderSnapshot();
hud.setStatus(restoredFromSave
  ? 'SAVE RESTORED · simulation resumes where it stopped.'
  : 'Cut all 9 heads to defeat Hydra I. NP is a timed farming burst.');
runtime.start();

window.addEventListener('pagehide', () => {
  persistNow();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  unbindNpButton();
  unbindCommandSpellButton();
  unbindTestToolsToggle();
  unbindResetSave();
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

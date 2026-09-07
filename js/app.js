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
const autoApsReadout = document.querySelector('[data-test-auto-aps]');

if (
  !app
  || !canvas
  || !npButton
  || !commandSpellButton
  || !testToolsToggle
  || !testToolsPanel
  || !resetSaveButton
  || !regenDelayReadout
  || !autoApsReadout
) {
  throw new Error('Hydra Clicker app shell is missing.');
}

function bindFixedControl(button, handler) {
  const handlePointerUp = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    handler();
  };

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

function bindBattleShellGestureLock(root) {
  const preventDefault = (event) => event.preventDefault();
  const preventTouchEnd = (event) => event.preventDefault();
  const preventMultiTouch = (event) => {
    if (event.touches?.length > 1) event.preventDefault();
  };

  root.addEventListener('touchend', preventTouchEnd, { passive: false, capture: true });
  root.addEventListener('touchmove', preventMultiTouch, { passive: false, capture: true });
  root.addEventListener('dblclick', preventDefault, { passive: false, capture: true });
  root.addEventListener('gesturestart', preventDefault, { passive: false, capture: true });
  root.addEventListener('gesturechange', preventDefault, { passive: false, capture: true });
  root.addEventListener('gestureend', preventDefault, { passive: false, capture: true });

  return () => {
    root.removeEventListener('touchend', preventTouchEnd, true);
    root.removeEventListener('touchmove', preventMultiTouch, true);
    root.removeEventListener('dblclick', preventDefault, true);
    root.removeEventListener('gesturestart', preventDefault, true);
    root.removeEventListener('gesturechange', preventDefault, true);
    root.removeEventListener('gestureend', preventDefault, true);
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

const unbindBattleShellGestureLock = bindBattleShellGestureLock(app);

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

function isHydraIIIntroPending(snapshot) {
  const intro = runtime.progression.hydraIIIntro;
  return intro != null
    && snapshot.hydra.generation === intro.generation
    && !snapshot.progression.milestones.includes(intro.firstManualCutMilestone);
}

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
  const introPending = isHydraIIIntroPending(snapshot);
  hud.render(snapshot, {
    commandSpellI: runtime.commandSpellIStatus(),
    np: runtime.npStatus(),
    hydraIIIntroPending: introPending,
  });
  hydraView.render(snapshot);
  stage.setNpActive(isNpWindowActive(snapshot));

  const regenDelayMs = runtime.currentRegenDelayMs();
  regenDelayReadout.textContent = regenDelayMs == null ? 'STRUCTURAL' : `${regenDelayMs} ms`;
  autoApsReadout.textContent = introPending
    ? 'PAUSED · TAP'
    : snapshot.master.commandSpells.autoSlash
      ? `${snapshot.berserker.baseAttacksPerSecond} APS`
      : 'LOCKED';
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
    hud.setStatus(result.level === 1
      ? 'COMMAND SPELL I Lv.1 · AUTO SLASH UNLOCKED'
      : `COMMAND SPELL I Lv.${result.level} · ${result.status.attacksPerSecond} APS`);
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
  if (payload.spawned > 0n) {
    const net = payload.spawned - payload.amount;
    hud.setStatus(`CUT ${payload.amount.toString()} · GROW +${payload.spawned.toString()} · Δ +${net.toString()}`);
  } else {
    hud.setStatus(payload.killed
      ? `CUT ${payload.amount.toString()} · HYDRA DOWN`
      : `CUT ${payload.amount.toString()}`);
  }
  renderSnapshot();
});
const offRegrow = runtime.events.on('head:regrow', ({ payload }) => {
  hud.setStatus(`REGROW +${payload.amount.toString()}`);
  renderSnapshot();
});
const offNpReleased = runtime.events.on('np:released', () => {
  renderSnapshot();
});
const offKilled = runtime.events.on('hydra:killed', ({ payload }) => {
  hud.setStatus(`HYDRA ${payload.generation === 1 ? 'I' : 'II'} DEFEATED`);
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
  hud.setStatus(`HYDRA ${payload.generation === 1 ? 'I' : 'II'} · ENCOUNTER ${payload.encounter.toString()}`);
  renderSnapshot();
});
const offGenerationChanged = runtime.events.on('hydra:generation-changed', ({ payload }) => {
  persistNow();
  hud.setStatus(`HYDRA ${payload.generation === 2 ? 'II' : payload.generation} · AUTO PAUSED · TAP TO CUT`);
  renderSnapshot();
});
const offIntroComplete = runtime.events.on('hydra:intro-complete', () => {
  persistNow();
  renderSnapshot();
});
const offSpellAvailable = runtime.events.on('command-spell:available', ({ payload }) => {
  hud.setStatus(`COMMAND SPELL I Lv.${payload.level} AVAILABLE · ${payload.cost.toString()} 人類惡 · ${payload.attacksPerSecond} APS`);
  renderSnapshot();
});
const offSpellUnlocked = runtime.events.on('command-spell:unlocked', ({ payload }) => {
  persistNow();
  hud.setStatus(`AUTO SLASH ONLINE · ${payload.attacksPerSecond} APS`);
  renderSnapshot();
});
const offSpellUpgraded = runtime.events.on('command-spell:upgraded', ({ payload }) => {
  persistNow();
  hud.setStatus(`COMMAND SPELL I Lv.${payload.level} · ${payload.attacksPerSecond} APS`);
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
  : 'Cut heads to charge NP · 66 heads = READY.');
runtime.start();

window.addEventListener('pagehide', () => {
  persistNow();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  unbindBattleShellGestureLock();
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
  offGenerationChanged();
  offIntroComplete();
  offSpellAvailable();
  offSpellUnlocked();
  offSpellUpgraded();
  berserkerView.destroy();
  hydraView.destroy();
  stage.destroy();
  runtime.destroy();
}, { once: true });

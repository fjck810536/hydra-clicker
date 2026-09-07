import { createHydraIGameRuntime } from './core/game.js';
import { createSaveStore } from './core/save.js';
import { createBattleStage } from './view/battle-scene.js';
import { createHudView } from './view/hud-view.js';
import { createHydraView } from './view/hydra-view.js';
import { createBerserkerView } from './view/berserker-view.js';
import { projectGenerationProgress } from './view/generation-progress.js';
import { createGenerationTransitionView } from './view/generation-transition-view.js';
import { createNpPhaseView } from './view/np-phase-view.js';
import { createNpTimerView } from './view/np-timer-view.js';

const AUTOSAVE_INTERVAL_MS = 5000;

const app = document.querySelector('[data-app]');
const canvas = document.querySelector('#battle-canvas');
const npButton = document.querySelector('[data-np-button]');
const commandSpellIButton = document.querySelector('[data-command-spell-button]');
const commandSpellIIButton = document.querySelector('[data-command-spell-ii-button]');
const generationTransitionRoot = document.querySelector('[data-generation-transition]');
const npPhaseRoot = document.querySelector('[data-np-phase]');
const npTimerRoot = document.querySelector('[data-np-timer]');
const testToolsToggle = document.querySelector('[data-test-tools-toggle]');
const testToolsPanel = document.querySelector('[data-test-tools-panel]');
const testCommandSpellMaxButton = document.querySelector('[data-test-command-spell-max]');
const testCommandSpellIIButton = document.querySelector('[data-test-command-spell-ii]');
const testHydra98Button = document.querySelector('[data-test-hydra-98]');
const testHydraIICapButton = document.querySelector('[data-test-hydra-ii-cap]');
const testNpReadyButton = document.querySelector('[data-test-np-ready]');
const resetSaveButton = document.querySelector('[data-reset-save]');
const regenDelayReadout = document.querySelector('[data-test-regen-delay]');
const autoApsReadout = document.querySelector('[data-test-auto-aps]');
const totalKillsReadout = document.querySelector('[data-test-total-kills]');

if (
  !app
  || !canvas
  || !npButton
  || !commandSpellIButton
  || !commandSpellIIButton
  || !generationTransitionRoot
  || !npPhaseRoot
  || !npTimerRoot
  || !testToolsToggle
  || !testToolsPanel
  || !testCommandSpellMaxButton
  || !testCommandSpellIIButton
  || !testHydra98Button
  || !testHydraIICapButton
  || !testNpReadyButton
  || !resetSaveButton
  || !regenDelayReadout
  || !autoApsReadout
  || !totalKillsReadout
) {
  throw new Error('Hydra Clicker app shell is missing.');
}

function formatGeneration(generation) {
  if (generation === 1) return 'I';
  if (generation === 2) return 'II';
  if (generation === 3) return 'III';
  return String(generation);
}

function formatDurationMs(durationMs) {
  const seconds = durationMs / 1000;
  return Number.isInteger(seconds) ? `${seconds}s` : `${seconds.toFixed(1)}s`;
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
const generationTransition = createGenerationTransitionView({ root: generationTransitionRoot });
const npPhase = createNpPhaseView({ root: npPhaseRoot });
const npTimer = createNpTimerView({ root: npTimerRoot });

function isHydraIIIntroPending(snapshot) {
  const intro = runtime.progression.hydraIIIntro;
  return intro != null
    && snapshot.hydra.generation === intro.generation
    && !snapshot.progression.milestones.includes(intro.firstManualCutMilestone);
}

function getGenerationConfig(snapshot) {
  return runtime.progression.generations?.[snapshot.hydra.generation] ?? null;
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
  const npWindow = runtime.npWindowStatus();
  const npActive = npWindow.active;
  const spellII = runtime.commandSpellIIStatus();
  const generationConfig = getGenerationConfig(snapshot);
  const generationProgress = projectGenerationProgress(snapshot, generationConfig);

  hud.render(snapshot, {
    commandSpellI: runtime.commandSpellIStatus(),
    commandSpellII: spellII,
    np: runtime.npStatus(),
    npActive,
    hydraIIIntroPending: introPending,
    generationProgress,
  });
  npTimer.render({
    active: npActive,
    remainingMs: npWindow.remainingMs,
    manualStrikeCount: spellII.npManualStrikeCount,
  });
  hydraView.render(snapshot);
  stage.setGenerationAppearance(snapshot.hydra.generation);
  stage.setNpActive(npActive);
  app.dataset.hydraGeneration = String(snapshot.hydra.generation);
  app.dataset.npActive = npActive ? 'true' : 'false';

  const regenDelayMs = runtime.currentRegenDelayMs();
  regenDelayReadout.textContent = snapshot.hydra.generation >= 3
    ? 'RULE PENDING'
    : regenDelayMs == null
      ? 'STRUCTURAL'
      : `${regenDelayMs} ms`;
  autoApsReadout.textContent = snapshot.hydra.generation >= 3
    ? 'PAUSED'
    : npActive && snapshot.master.commandSpells.autoSlash
      ? 'PAUSED · NP'
      : introPending
        ? 'PAUSED · TAP'
        : snapshot.master.commandSpells.autoSlash
          ? `${snapshot.berserker.baseAttacksPerSecond} APS`
          : 'LOCKED';
  totalKillsReadout.textContent = snapshot.statistics.totalHydrasKilled.toString();
};

const handleNpPress = () => {
  runtime.releaseNp();
  renderSnapshot();
};
const unbindNpButton = bindFixedControl(npButton, handleNpPress);

const handleCommandSpellIPress = () => {
  const result = runtime.buyCommandSpellI();
  if (result.accepted) persistNow();
  renderSnapshot();
};
const unbindCommandSpellIButton = bindFixedControl(commandSpellIButton, handleCommandSpellIPress);

const handleCommandSpellIIPress = () => {
  const result = runtime.buyCommandSpellII();
  if (result.accepted) persistNow();
  renderSnapshot();
};
const unbindCommandSpellIIButton = bindFixedControl(commandSpellIIButton, handleCommandSpellIIPress);

const handleTestToolsToggle = () => {
  testToolsPanel.hidden = !testToolsPanel.hidden;
};
const unbindTestToolsToggle = bindFixedControl(testToolsToggle, handleTestToolsToggle);

function enterNonPersistentTestSession() {
  suppressPersistence = true;
}

const handleTestCommandSpellMax = () => {
  enterNonPersistentTestSession();
  const result = runtime.testPresets.maxCommandSpellI();
  hud.setStatus(`TEST · COMMAND SPELL I Lv.MAX · ${result.attacksPerSecond} APS · NOT SAVED`);
  renderSnapshot();
};
const unbindTestCommandSpellMax = bindFixedControl(testCommandSpellMaxButton, handleTestCommandSpellMax);

const handleTestCommandSpellII = () => {
  enterNonPersistentTestSession();
  const result = runtime.testPresets.commandSpellIILv1();
  hud.setStatus(`TEST · COMMAND SPELL II Lv.1 · NP MANUAL ×${result.npManualStrikeCount} · NOT SAVED`);
  renderSnapshot();
};
const unbindTestCommandSpellII = bindFixedControl(testCommandSpellIIButton, handleTestCommandSpellII);

const handleTestHydra98 = () => {
  enterNonPersistentTestSession();
  runtime.testPresets.startHydraIEncounter98();
  hud.setStatus('TEST · HYDRA I #98 · 97 KILLS COMPLETE · NOT SAVED');
  renderSnapshot();
};
const unbindTestHydra98 = bindFixedControl(testHydra98Button, handleTestHydra98);

const handleTestHydraIICap = () => {
  enterNonPersistentTestSession();
  const result = runtime.testPresets.startHydraIIAtCap();
  hud.setStatus(`TEST · HYDRA II · ${result.heads.toString()} HEADS · NOT SAVED`);
  renderSnapshot();
};
const unbindTestHydraIICap = bindFixedControl(testHydraIICapButton, handleTestHydraIICap);

const handleTestNpReady = () => {
  enterNonPersistentTestSession();
  runtime.testPresets.readyNp();
  const status = runtime.npStatus();
  hud.setStatus(`TEST · NP ${status.points}/${status.maxPoints} READY · NOT SAVED`);
  renderSnapshot();
};
const unbindTestNpReady = bindFixedControl(testNpReadyButton, handleTestNpReady);

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
  const isManual = payload.request?.source === 'manual';
  const strikeCount = isManual ? payload.request.strikeCount ?? 1 : 1;

  if (isManual && strikeCount > 1) {
    // Combat emits one semantic resolution per strike. The View projects the
    // whole manual request once, on strike 0, as a visibly discrete combo.
    if (payload.strikeIndex === 0) {
      berserkerView.playMultiAttack({ count: strikeCount });
    }
    return;
  }

  berserkerView.playAttack({
    speed: snapshot.berserker.baseAttacksPerSecond,
  });
});
const offCut = runtime.events.on('head:cut', ({ payload }) => {
  if (payload.spawned > 0n) {
    const net = payload.spawned - payload.amount;
    const sign = net >= 0n ? '+' : '';
    hud.setStatus(`CUT ${payload.amount.toString()} · GROW +${payload.spawned.toString()} · Δ ${sign}${net.toString()}`);
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
const offNpReleased = runtime.events.on('np:released', ({ payload }) => {
  npPhase.showRelease();
  hud.setStatus(`寶具解放 · TIME STOP · AUTO PAUSED · ${formatDurationMs(payload.durationMs)}`);
  renderSnapshot();
});
const offNpEnded = runtime.events.on('np:ended', () => {
  npPhase.showResume();
  hud.setStatus('TIME RESUMES · HYDRA LAW RESTORED');
  renderSnapshot();
});
const offKilled = runtime.events.on('hydra:killed', ({ payload }) => {
  hud.setStatus(`HYDRA ${formatGeneration(payload.generation)} DEFEATED`);
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
  hud.setStatus(`HYDRA ${formatGeneration(payload.generation)} · ENCOUNTER ${payload.encounter.toString()}`);
  renderSnapshot();
});
const offGenerationChanged = runtime.events.on('hydra:generation-changed', ({ payload }) => {
  persistNow();
  const config = runtime.progression.generations?.[payload.generation] ?? null;
  generationTransition.show({
    generation: payload.generation,
    maxHeads: payload.maxHeads ?? config?.maxHeads ?? null,
    killsToNextGeneration: config?.killsToNextGeneration ?? null,
  });

  if (payload.generation === 2) {
    hud.setStatus('HYDRA II · AUTO PAUSED · TAP TO CUT');
  } else if (payload.generation === 3) {
    hud.setStatus(`HYDRA III · 9 HEADS · MAX ${payload.maxHeads?.toString() ?? '729'} · RULE PENDING`);
  } else {
    hud.setStatus(`HYDRA ${formatGeneration(payload.generation)}`);
  }
  renderSnapshot();
});
const offIntroComplete = runtime.events.on('hydra:intro-complete', () => {
  persistNow();
  renderSnapshot();
});
const offSpellAvailable = runtime.events.on('command-spell:available', ({ payload }) => {
  if (payload.id === 'command-spell-2') {
    hud.setStatus(`COMMAND SPELL II Lv.${payload.level} AVAILABLE · ${payload.cost.toString()} 人類惡 · ${payload.rewardLabel}`);
  } else {
    hud.setStatus(`COMMAND SPELL I Lv.${payload.level} AVAILABLE · ${payload.cost.toString()} 人類惡 · ${payload.attacksPerSecond} APS`);
  }
  renderSnapshot();
});
const offSpellUnlocked = runtime.events.on('command-spell:unlocked', ({ payload }) => {
  persistNow();
  if (payload.id === 'command-spell-2') {
    hud.setStatus(`COMMAND SPELL II Lv.${payload.level} · ${payload.rewardLabel} · NP ${payload.npMaxPoints}`);
  } else {
    hud.setStatus(`AUTO SLASH ONLINE · ${payload.attacksPerSecond} APS`);
  }
  renderSnapshot();
});
const offSpellUpgraded = runtime.events.on('command-spell:upgraded', ({ payload }) => {
  persistNow();
  if (payload.id === 'command-spell-2') {
    hud.setStatus(`COMMAND SPELL II Lv.${payload.level} · ${payload.rewardLabel} · NP ${payload.npMaxPoints}`);
  } else {
    hud.setStatus(`COMMAND SPELL I Lv.${payload.level} · ${payload.attacksPerSecond} APS`);
  }
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
  unbindCommandSpellIButton();
  unbindCommandSpellIIButton();
  unbindTestToolsToggle();
  unbindTestCommandSpellMax();
  unbindTestCommandSpellII();
  unbindTestHydra98();
  unbindTestHydraIICap();
  unbindTestNpReady();
  unbindResetSave();
  offTick();
  offAttackResolved();
  offCut();
  offRegrow();
  offNpReleased();
  offNpEnded();
  offKilled();
  offCurrencyGain();
  offRespawned();
  offGenerationChanged();
  offIntroComplete();
  offSpellAvailable();
  offSpellUnlocked();
  offSpellUpgraded();
  npPhase.destroy();
  generationTransition.destroy();
  berserkerView.destroy();
  hydraView.destroy();
  stage.destroy();
  runtime.destroy();
}, { once: true });
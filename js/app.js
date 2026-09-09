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
import { createCommandSpellPanel } from './view/command-spell-panel.js';
import { createTreeView } from './view/tree-view.js';

const AUTOSAVE_INTERVAL_MS = 5000;
const VISIBLE_HEAD_CAP = 99n;

const app = document.querySelector('[data-app]');
const canvas = document.querySelector('#battle-canvas');
const npButton = document.querySelector('[data-np-button]');
const commandSpellPanelRoot = document.querySelector('[data-command-spell-panel]');
const commandSpellCloseButton = document.querySelector('[data-command-spell-close]');
const generationTransitionRoot = document.querySelector('[data-generation-transition]');
const npPhaseRoot = document.querySelector('[data-np-phase]');
const npTimerRoot = document.querySelector('[data-np-timer]');
const treeViewToggle = document.querySelector('[data-tree-view-toggle]');
const treeViewOverlay = document.querySelector('[data-tree-view-overlay]');
const treeViewCloseButton = document.querySelector('[data-tree-view-close]');
const testToolsToggle = document.querySelector('[data-test-tools-toggle]');
const testToolsPanel = document.querySelector('[data-test-tools-panel]');
const testCommandSpellMaxButton = document.querySelector('[data-test-command-spell-max]');
const testHumanityEvil999Button = document.querySelector('[data-test-humanity-evil-999]');
const testCommandSpellIIButton = document.querySelector('[data-test-command-spell-ii]');
const testCommandSpellIIIButton = document.querySelector('[data-test-command-spell-iii]');
const testHydra98Button = document.querySelector('[data-test-hydra-98]');
const testHydraIICapButton = document.querySelector('[data-test-hydra-ii-cap]');
const testHydraIII99Button = document.querySelector('[data-test-hydra-iii-99]');
const testNpReadyButton = document.querySelector('[data-test-np-ready]');
const resetSaveButton = document.querySelector('[data-reset-save]');
const regenDelayReadout = document.querySelector('[data-test-regen-delay]');
const autoApsReadout = document.querySelector('[data-test-auto-aps]');
const totalKillsReadout = document.querySelector('[data-test-total-kills]');

if (
  !app
  || !canvas
  || !npButton
  || !commandSpellPanelRoot
  || !commandSpellCloseButton
  || !generationTransitionRoot
  || !npPhaseRoot
  || !npTimerRoot
  || !treeViewToggle
  || !treeViewOverlay
  || !treeViewCloseButton
  || !testToolsToggle
  || !testToolsPanel
  || !testCommandSpellMaxButton
  || !testHumanityEvil999Button
  || !testCommandSpellIIButton
  || !testCommandSpellIIIButton
  || !testHydra98Button
  || !testHydraIICapButton
  || !testHydraIII99Button
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

function formatAps(value) {
  if (!Number.isFinite(value)) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function formatAutoNpFraction(status) {
  if (status.autoNpNumerator <= 0) return 'OFF';
  if (status.autoNpNumerator === status.autoNpDenominator) return 'FULL';
  return `${status.autoNpNumerator}/${status.autoNpDenominator}`;
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

function bindModalBackdropClose(root, handler) {
  const handlePointerUp = (event) => {
    if (event.target !== root) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    handler();
  };

  root.addEventListener('pointerup', handlePointerUp, { passive: false });
  return () => root.removeEventListener('pointerup', handlePointerUp);
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
const commandSpellPanel = createCommandSpellPanel({ root: app });
const generationTransition = createGenerationTransitionView({ root: generationTransitionRoot });
const npPhase = createNpPhaseView({ root: npPhaseRoot });
const npTimer = createNpTimerView({ root: npTimerRoot });
const treeView = createTreeView({ root: app });

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
  const spellI = runtime.commandSpellIStatus();
  const spellII = runtime.commandSpellIIStatus();
  const spellIII = runtime.commandSpellIIIStatus();
  const generationConfig = getGenerationConfig(snapshot);
  const generationProgress = projectGenerationProgress(snapshot, generationConfig);

  hud.render(snapshot, {
    np: runtime.npStatus(),
    npActive,
    hydraIIIntroPending: introPending,
    generationProgress,
  });
  commandSpellPanel.render({
    commandSpellI: spellI,
    commandSpellII: spellII,
    commandSpellIII: spellIII,
  });
  npTimer.render({
    active: npActive,
    remainingMs: npWindow.remainingMs,
    manualStrikeCount: spellII.npManualStrikeCount,
  });
  treeView.render(snapshot, {
    visibleHeadCap: VISIBLE_HEAD_CAP,
    maxHeads: generationConfig?.maxHeads ?? null,
  });
  hydraView.render(snapshot);
  stage.setGenerationAppearance(snapshot.hydra.generation);
  stage.setNpActive(npActive);
  app.dataset.hydraGeneration = String(snapshot.hydra.generation);
  app.dataset.npActive = npActive ? 'true' : 'false';

  const regenDelayMs = runtime.currentRegenDelayMs();
  regenDelayReadout.textContent = regenDelayMs == null
    ? 'STRUCTURAL'
    : `${regenDelayMs} ms`;

  if (!snapshot.master.commandSpells.autoSlash) {
    autoApsReadout.textContent = 'LOCKED';
  } else if (introPending) {
    autoApsReadout.textContent = 'PAUSED · TAP';
  } else if (npActive) {
    autoApsReadout.textContent = spellIII.autoNpFraction > 0
      ? `${formatAps(spellIII.autoNpAps)} APS · NP ${formatAutoNpFraction(spellIII)}`
      : 'PAUSED · NP';
  } else {
    autoApsReadout.textContent = `${snapshot.berserker.baseAttacksPerSecond} APS`;
  }
  totalKillsReadout.textContent = snapshot.statistics.totalHydrasKilled.toString();
};

const handleNpPress = () => {
  runtime.releaseNp();
  renderSnapshot();
};
const unbindNpButton = bindFixedControl(npButton, handleNpPress);

const handleCommandSpellSlotI = () => {
  commandSpellPanel.open(1);
};
const handleCommandSpellSlotII = () => {
  commandSpellPanel.open(2);
};
const handleCommandSpellSlotIII = () => {
  commandSpellPanel.open(3);
};
const unbindCommandSpellSlotI = bindFixedControl(commandSpellPanel.slots[0], handleCommandSpellSlotI);
const unbindCommandSpellSlotII = bindFixedControl(commandSpellPanel.slots[1], handleCommandSpellSlotII);
const unbindCommandSpellSlotIII = bindFixedControl(commandSpellPanel.slots[2], handleCommandSpellSlotIII);

const handleCommandSpellClose = () => {
  commandSpellPanel.close();
};
const unbindCommandSpellClose = bindFixedControl(commandSpellCloseButton, handleCommandSpellClose);
const unbindCommandSpellBackdrop = bindModalBackdropClose(
  commandSpellPanel.modal,
  handleCommandSpellClose,
);

const handleCommandSpellPurchase = () => {
  const id = commandSpellPanel.currentOpenSpellId();
  let result = null;
  if (id === 'command-spell-1') result = runtime.buyCommandSpellI();
  if (id === 'command-spell-2') result = runtime.buyCommandSpellII();
  if (id === 'command-spell-3') result = runtime.buyCommandSpellIII();
  if (result?.accepted) {
    persistNow();
    commandSpellPanel.close();
  }
  renderSnapshot();
};
const unbindCommandSpellPurchase = bindFixedControl(
  commandSpellPanel.purchaseButton,
  handleCommandSpellPurchase,
);

const handleTreeViewOpen = () => {
  treeView.open();
};
const handleTreeViewClose = () => {
  treeView.close();
};
const unbindTreeViewToggle = bindFixedControl(treeViewToggle, handleTreeViewOpen);
const unbindTreeViewClose = bindFixedControl(treeViewCloseButton, handleTreeViewClose);
const unbindTreeViewBackdrop = bindModalBackdropClose(treeViewOverlay, handleTreeViewClose);

const handleTestToolsToggle = () => {
  testToolsPanel.hidden = !testToolsPanel.hidden;
};
const unbindTestToolsToggle = bindFixedControl(testToolsToggle, handleTestToolsToggle);

function enterNonPersistentTestSession() {
  suppressPersistence = true;
}

const COMMAND_SPELL_I_TEST_LEVELS = Object.freeze([1, 3, 6, 7]);
let commandSpellITestCursor = -1;

function formatCommandSpellITestLevel(level) {
  return level === COMMAND_SPELL_I_TEST_LEVELS.at(-1) ? 'MAX' : `Lv.${level}`;
}

const handleTestCommandSpellMax = () => {
  enterNonPersistentTestSession();
  commandSpellITestCursor = (commandSpellITestCursor + 1) % COMMAND_SPELL_I_TEST_LEVELS.length;
  const level = COMMAND_SPELL_I_TEST_LEVELS[commandSpellITestCursor];
  const result = runtime.testPresets.setCommandSpellILevel(level);
  const label = formatCommandSpellITestLevel(result.level);
  testCommandSpellMaxButton.textContent = `CS I TEST · ${label} · ${result.attacksPerSecond} APS`;
  hud.setStatus(`TEST · COMMAND SPELL I ${label} · ${result.attacksPerSecond} APS · NOT SAVED`);
  renderSnapshot();
};
const unbindTestCommandSpellMax = bindFixedControl(testCommandSpellMaxButton, handleTestCommandSpellMax);

const handleTestHumanityEvil999 = () => {
  enterNonPersistentTestSession();
  const result = runtime.testPresets.addHumanityEvil999();
  hud.setStatus(`TEST · 人類惡 +999 · BALANCE ${result.balance.toString()} · NOT SAVED`);
  renderSnapshot();
};
const unbindTestHumanityEvil999 = bindFixedControl(testHumanityEvil999Button, handleTestHumanityEvil999);

const handleTestCommandSpellII = () => {
  enterNonPersistentTestSession();
  const result = runtime.testPresets.commandSpellIILv1();
  hud.setStatus(`TEST · COMMAND SPELL II Lv.1 · NP MANUAL ×${result.npManualStrikeCount} · NOT SAVED`);
  renderSnapshot();
};
const unbindTestCommandSpellII = bindFixedControl(testCommandSpellIIButton, handleTestCommandSpellII);

const COMMAND_SPELL_III_TEST_LEVELS = Object.freeze([1, 2, 3]);
let commandSpellIIITestCursor = -1;

function formatCommandSpellIIITestLevel(level) {
  return level === COMMAND_SPELL_III_TEST_LEVELS.at(-1) ? 'MAX' : `Lv.${level}`;
}

const handleTestCommandSpellIII = () => {
  enterNonPersistentTestSession();
  commandSpellIIITestCursor = (commandSpellIIITestCursor + 1) % COMMAND_SPELL_III_TEST_LEVELS.length;
  const level = COMMAND_SPELL_III_TEST_LEVELS[commandSpellIIITestCursor];
  const result = runtime.testPresets.setCommandSpellIIILevel(level);
  const status = runtime.commandSpellIIIStatus();
  const label = formatCommandSpellIIITestLevel(result.level);
  testCommandSpellIIIButton.textContent = `CS III TEST · ${label} · NP AUTO ${formatAutoNpFraction(status)}`;
  hud.setStatus(`TEST · COMMAND SPELL III ${label} · NP AUTO ${formatAutoNpFraction(status)} · NOT SAVED`);
  renderSnapshot();
};
const unbindTestCommandSpellIII = bindFixedControl(testCommandSpellIIIButton, handleTestCommandSpellIII);

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

const handleTestHydraIII99 = () => {
  enterNonPersistentTestSession();
  const result = runtime.testPresets.startHydraIIIAt99();
  hud.setStatus(`TEST · HYDRA III · ${result.heads.toString()} HEADS · TAP ONCE FOR 100 · NOT SAVED`);
  renderSnapshot();
};
const unbindTestHydraIII99 = bindFixedControl(testHydraIII99Button, handleTestHydraIII99);

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
    if (payload.strikeIndex === 0) {
      berserkerView.playMultiAttack({ count: strikeCount });
    }
    return;
  }

  const visualSpeed = payload.request?.source === 'auto' && runtime.isNpActive()
    ? Math.max(1, runtime.commandSpellIIIStatus().autoNpAps)
    : snapshot.berserker.baseAttacksPerSecond;
  berserkerView.playAttack({ speed: visualSpeed });
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
  const snapshot = runtime.snapshot();
  const spellIII = runtime.commandSpellIIIStatus();
  const autoLabel = snapshot.master.commandSpells.autoSlash && spellIII.autoNpFraction > 0
    ? `AUTO ${formatAps(spellIII.autoNpAps)} APS`
    : 'AUTO PAUSED';
  hud.setStatus(`寶具解放 · TIME STOP · ${autoLabel} · ${formatDurationMs(payload.durationMs)}`);
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
    hud.setStatus(`HYDRA III · 9 HEADS · MAX ${payload.maxHeads?.toString() ?? '729'} · VISIBLE CAP 99`);
  } else {
    hud.setStatus(`HYDRA ${formatGeneration(payload.generation)}`);
  }
  renderSnapshot();
});
const offIntroComplete = runtime.events.on('hydra:intro-complete', () => {
  persistNow();
  renderSnapshot();
});
const offTreeViewUnlocked = runtime.events.on('tree-view:unlocked', ({ payload }) => {
  persistNow();
  hud.setStatus(`TREE VIEW UNLOCKED · LOGICAL ${payload.logicalHeads.toString()} · VISIBLE 99`);
  renderSnapshot();
});
const offSpellEligible = runtime.events.on('command-spell:eligible', ({ payload }) => {
  if (payload.id === 'command-spell-3') {
    persistNow();
    const price = payload.pricePending
      ? 'PRICE TBD'
      : `${payload.cost.toString()} 人類惡`;
    hud.setStatus(`COMMAND SPELL III REVEALED · AUTO IN NP · ${price}`);
    renderSnapshot();
  }
});
const offSpellAvailable = runtime.events.on('command-spell:available', ({ payload }) => {
  if (payload.id === 'command-spell-2') {
    hud.setStatus(`COMMAND SPELL II Lv.${payload.level} AVAILABLE · ${payload.cost.toString()} 人類惡 · ${payload.rewardLabel}`);
  } else if (payload.id === 'command-spell-1') {
    hud.setStatus(`COMMAND SPELL I Lv.${payload.level} AVAILABLE · ${payload.cost.toString()} 人類惡 · ${payload.attacksPerSecond} APS`);
  } else if (payload.id === 'command-spell-3') {
    const fraction = payload.autoNpNumerator === payload.autoNpDenominator
      ? 'FULL'
      : `${payload.autoNpNumerator}/${payload.autoNpDenominator}`;
    hud.setStatus(`COMMAND SPELL III Lv.${payload.level} AVAILABLE · ${payload.cost.toString()} 人類惡 · NP AUTO ${fraction}`);
  }
  renderSnapshot();
});
const offSpellUnlocked = runtime.events.on('command-spell:unlocked', ({ payload }) => {
  persistNow();
  if (payload.id === 'command-spell-2') {
    hud.setStatus(`COMMAND SPELL II Lv.${payload.level} · ${payload.rewardLabel} · NP ${payload.npMaxPoints}`);
  } else if (payload.id === 'command-spell-3') {
    hud.setStatus(`COMMAND SPELL III Lv.${payload.level} · NP AUTO ${payload.autoNpNumerator}/${payload.autoNpDenominator}`);
  } else {
    hud.setStatus(`AUTO SLASH ONLINE · ${payload.attacksPerSecond} APS`);
  }
  renderSnapshot();
});
const offSpellUpgraded = runtime.events.on('command-spell:upgraded', ({ payload }) => {
  persistNow();
  if (payload.id === 'command-spell-2') {
    hud.setStatus(`COMMAND SPELL II Lv.${payload.level} · ${payload.rewardLabel} · NP ${payload.npMaxPoints}`);
  } else if (payload.id === 'command-spell-3') {
    const fraction = payload.autoNpNumerator === payload.autoNpDenominator
      ? 'FULL'
      : `${payload.autoNpNumerator}/${payload.autoNpDenominator}`;
    hud.setStatus(`COMMAND SPELL III Lv.${payload.level} · NP AUTO ${fraction}`);
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
  unbindCommandSpellSlotI();
  unbindCommandSpellSlotII();
  unbindCommandSpellSlotIII();
  unbindCommandSpellClose();
  unbindCommandSpellBackdrop();
  unbindCommandSpellPurchase();
  unbindTreeViewToggle();
  unbindTreeViewClose();
  unbindTreeViewBackdrop();
  unbindTestToolsToggle();
  unbindTestCommandSpellMax();
  unbindTestHumanityEvil999();
  unbindTestCommandSpellII();
  unbindTestCommandSpellIII();
  unbindTestHydra98();
  unbindTestHydraIICap();
  unbindTestHydraIII99();
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
  offTreeViewUnlocked();
  offSpellEligible();
  offSpellAvailable();
  offSpellUnlocked();
  offSpellUpgraded();
  treeView.close();
  commandSpellPanel.close();
  npPhase.destroy();
  generationTransition.destroy();
  berserkerView.destroy();
  hydraView.destroy();
  stage.destroy();
  runtime.destroy();
}, { once: true });

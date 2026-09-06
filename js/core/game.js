import { GameClock } from './clock.js';
import { EventBus } from './event-bus.js';
import { GameStateStore, createInitialState } from './state.js';
import { createHydraIRule } from '../math/hydra-rules.js';
import { createHydraRegrowthSystem } from '../systems/hydra-regrowth.js';
import { createCombatSystem } from '../systems/combat.js';
import { createAutoSlashSystem } from '../systems/auto-slash.js';
import { createNpSystem } from '../systems/np.js';
import { createHumanityEvilSystem } from '../systems/humanity-evil.js';
import { createCommandSpellSystem } from '../systems/command-spells.js';
import { createHydraIProgressionSystem } from '../systems/progression.js';
import { createManualAttackInput } from '../input/manual-attack.js';
import {
  HYDRA_I_PROGRESSION,
  getHydraIRegenDelayMs,
} from '../data/progression.js';

export function createCoreRuntime({
  fixedStepMs = 100,
  initialState = createInitialState(),
} = {}) {
  const events = new EventBus();
  const state = new GameStateStore(initialState);
  const initialSnapshot = state.read();
  const clock = new GameClock({
    fixedStepMs,
    initialSimulationTimeMs: initialSnapshot.time.simulationTimeMs,
    initialTickCount: initialSnapshot.time.tick,
  });

  const unsubscribeClock = clock.onTick((tick) => {
    state.update((draft) => {
      draft.time.simulationTimeMs = tick.nowMs;
      draft.time.tick = tick.tick;
    });

    events.emit('clock:tick', tick);
  });

  return {
    clock,
    events,
    state,

    start() {
      clock.start();
    },

    stop() {
      clock.stop();
    },

    advance(ms) {
      return clock.advance(ms);
    },

    snapshot() {
      return state.createSnapshot();
    },

    destroy() {
      clock.stop();
      unsubscribeClock();
      events.clear();
    },
  };
}

export function createHydraIGameRuntime({
  fixedStepMs = 100,
  regenDelayMs = null,
  npGainPerHead = 0.125,
  npDurationMs = 3000,
  progression = HYDRA_I_PROGRESSION,
  initialState = createInitialState(),
} = {}) {
  const core = createCoreRuntime({ fixedStepMs, initialState });
  const staticRegenDelayMs = regenDelayMs;
  const rule = createHydraIRule({
    regenDelayMs: staticRegenDelayMs ?? progression.regenCurve?.baseDelayMs ?? 1500,
  });

  const resolveCurrentRegenDelayMs = (snapshot = core.state.read()) => {
    if (staticRegenDelayMs != null) return staticRegenDelayMs;
    return getHydraIRegenDelayMs(
      snapshot.statistics.totalHydrasKilled,
      progression.regenCurve,
    );
  };

  const regrowth = createHydraRegrowthSystem(core);
  const combat = createCombatSystem({
    ...core,
    getRule: () => rule,
    getRuleContext: (snapshot) => ({
      regrowthDelayMs: resolveCurrentRegenDelayMs(snapshot),
    }),
  });
  const autoSlash = createAutoSlashSystem(core);
  const np = createNpSystem({
    ...core,
    gainPerHead: npGainPerHead,
    durationMs: npDurationMs,
  });
  const humanityEvil = createHumanityEvilSystem({
    ...core,
    rewardPerHydraKill: progression.humanityEvilPerKill,
  });
  const commandSpells = createCommandSpellSystem({
    ...core,
    definition: progression.commandSpellI,
  });
  const hydraProgression = createHydraIProgressionSystem({
    ...core,
    respawnDelayMs: progression.respawnDelayMs,
  });
  const manual = createManualAttackInput(core);

  return {
    ...core,
    rule,
    progression,
    manualAttack(options) {
      return manual.attack(options);
    },
    releaseNp() {
      return np.release();
    },
    currentRegenDelayMs() {
      return resolveCurrentRegenDelayMs(core.state.read());
    },
    commandSpellIStatus() {
      return commandSpells.getStatus();
    },
    buyCommandSpellI() {
      return commandSpells.purchase();
    },
    systems: Object.freeze({
      regrowth,
      combat,
      autoSlash,
      np,
      humanityEvil,
      commandSpells,
      hydraProgression,
    }),
    destroy() {
      hydraProgression.destroy();
      commandSpells.destroy();
      humanityEvil.destroy();
      np.destroy();
      autoSlash.destroy();
      combat.destroy();
      regrowth.destroy();
      core.destroy();
    },
  };
}

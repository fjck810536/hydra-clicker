import { GameClock } from './clock.js';
import { EventBus } from './event-bus.js';
import { GameStateStore, createInitialState } from './state.js';
import { createHydraIRule, createHydraIIRule, createHydraIIIRule } from '../math/hydra-rules.js';
import { createHydraRegrowthSystem } from '../systems/hydra-regrowth.js';
import { createCombatSystem } from '../systems/combat.js';
import { createAutoSlashSystem } from '../systems/auto-slash.js';
import { createNpSystem } from '../systems/np.js';
import { createHumanityEvilSystem } from '../systems/humanity-evil.js';
import { createCommandSpellSystem } from '../systems/command-spells.js';
import { createCommandSpellIISystem } from '../systems/command-spell-ii.js';
import { createCommandSpellIIISystem } from '../systems/command-spell-iii.js';
import { createHydraIProgressionSystem } from '../systems/progression.js';
import { isRegrowthEnabled } from '../systems/modifiers.js';
import { createManualAttackInput } from '../input/manual-attack.js';
import { createTestPresets } from '../dev/test-presets.js';
import {
  HYDRA_I_PROGRESSION,
  getHydraIRegenDelayMs,
  getHumanityEvilRewardForGeneration,
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
  npMaxPoints = null,
  npPointsPerHead = null,
  npDurationMs = null,
  progression = HYDRA_I_PROGRESSION,
  initialState = createInitialState(),
} = {}) {
  const core = createCoreRuntime({ fixedStepMs, initialState });
  const staticRegenDelayMs = regenDelayMs;
  const ruleI = createHydraIRule({
    regenDelayMs: staticRegenDelayMs ?? progression.regenCurve?.baseDelayMs ?? 1500,
  });
  const hydraIIConfig = progression.generations?.[2] ?? null;
  const hydraIIIConfig = progression.generations?.[3] ?? null;
  const ruleII = createHydraIIRule({
    maxHeadCount: hydraIIConfig?.maxHeads ?? 81n,
  });
  const ruleIII = createHydraIIIRule({
    maxHeadCount: hydraIIIConfig?.maxHeads ?? 729n,
  });

  const resolveCurrentRegenDelayMs = (snapshot = core.state.read()) => {
    if (snapshot.hydra.generation !== 1) return null;
    if (staticRegenDelayMs != null) return staticRegenDelayMs;
    return getHydraIRegenDelayMs(
      snapshot.statistics.totalHydrasKilled,
      progression.regenCurve,
    );
  };

  const regrowth = createHydraRegrowthSystem(core);
  const commandSpellII = createCommandSpellIISystem({
    ...core,
    definition: progression.commandSpellII,
    generations: progression.generations,
  });
  const commandSpellIII = createCommandSpellIIISystem({
    ...core,
    definition: progression.commandSpellIII,
  });
  const np = createNpSystem({
    ...core,
    maxPoints: progression.np?.maxPoints ?? 66,
    pointsPerHead: progression.np?.pointsPerHead ?? 1,
    durationMs: progression.np?.durationMs ?? 3000,
    getConfig: (snapshot) => {
      const spellII = commandSpellII.getStatus(snapshot);
      return {
        maxPoints: npMaxPoints ?? spellII.npMaxPoints,
        pointsPerHead: npPointsPerHead ?? progression.np?.pointsPerHead ?? 1,
        durationMs: npDurationMs ?? spellII.npDurationMs,
      };
    },
  });
  const humanityEvil = createHumanityEvilSystem({
    ...core,
    rewardPerHydraKill: progression.humanityEvilPerKill ?? 11n,
    getRewardPerHydraKill: (payload) => getHumanityEvilRewardForGeneration(
      payload.generation ?? core.state.read().hydra.generation,
      progression.humanityEvil ?? {
        basePerKill: progression.humanityEvilPerKill ?? 11n,
        generationMultiplier: 3n,
      },
    ),
  });
  const commandSpells = createCommandSpellSystem({
    ...core,
    definition: progression.commandSpellI,
  });

  const hydraProgression = createHydraIProgressionSystem({
    ...core,
    respawnDelayMs: progression.respawnDelayMs,
    generations: progression.generations,
    hydraIIIntro: progression.hydraIIIntro,
    hydraIIIIntro: progression.hydraIIIIntro,
    getRespawnDelayMs: (snapshot, payload) => (
      !isRegrowthEnabled(snapshot.modifiers.active, payload.atMs)
        ? progression.burstRespawnDelayMs ?? progression.respawnDelayMs
        : progression.respawnDelayMs
    ),
  });

  const combat = createCombatSystem({
    ...core,
    getRule: (snapshot) => {
      if (snapshot.hydra.generation === 1) return ruleI;
      if (snapshot.hydra.generation === 2) return ruleII;
      if (snapshot.hydra.generation === 3) return ruleIII;
      throw new RangeError(`Unsupported Hydra generation: ${snapshot.hydra.generation}`);
    },
    getRuleContext: (snapshot) => {
      if (snapshot.hydra.generation !== 1) return {};
      return { regrowthDelayMs: resolveCurrentRegenDelayMs(snapshot) };
    },
  });

  const isHydraIIIntroBlockingAuto = (snapshot) => {
    const intro = progression.hydraIIIntro;
    return intro != null
      && snapshot.hydra.generation === intro.generation
      && !snapshot.progression.milestones.includes(intro.firstManualCutMilestone);
  };

  const isPlayableGeneration = (snapshot) => snapshot.hydra.generation <= 3;

  const autoSlash = createAutoSlashSystem({
    ...core,
    isEnabled: (snapshot) => {
      const npActive = np.isActive(snapshot);
      const spellIII = commandSpellIII.getStatus(snapshot);
      const npAutoAllowed = !npActive || spellIII.autoNpFraction > 0;
      return (
        isPlayableGeneration(snapshot)
        && npAutoAllowed
        && snapshot.master.commandSpells.autoSlash
        && !snapshot.hydra.defeated
        && snapshot.hydra.logicalHeadCount > 0n
        && !isHydraIIIntroBlockingAuto(snapshot)
      );
    },
    getAttacksPerSecond: (snapshot) => {
      if (!np.isActive(snapshot)) return snapshot.berserker.baseAttacksPerSecond;
      return commandSpellIII.getStatus(snapshot).autoNpAps;
    },
  });
  const manual = createManualAttackInput(core);
  const testPresets = createTestPresets({
    ...core,
    progression,
  });

  const compatibilitySpellIIStatus = (snapshot = core.state.read()) => {
    const status = commandSpellII.getStatus(snapshot);
    return Object.freeze({
      unlocked: status.level >= 1,
      npManualStrikeCount: status.npManualStrikeCount,
    });
  };

  return {
    ...core,
    rule: ruleI,
    rules: Object.freeze({ I: ruleI, II: ruleII, III: ruleIII }),
    progression,
    manualAttack(options = {}) {
      const snapshot = core.state.read();
      const spellII = commandSpellII.getStatus(snapshot);
      const strikeCount = options.strikeCount ?? (
        np.isActive(snapshot)
          ? spellII.npManualStrikeCount
          : 1
      );
      return manual.attack({ ...options, strikeCount });
    },
    releaseNp() {
      return np.release();
    },
    npStatus() {
      return np.getStatus();
    },
    npWindowStatus() {
      return np.getWindowStatus(core.state.read());
    },
    isNpActive() {
      return np.isActive(core.state.read());
    },
    commandSpellIIStatus() {
      return commandSpellII.getStatus();
    },
    buyCommandSpellII() {
      return commandSpellII.purchase();
    },
    commandSpellIIIStatus() {
      return commandSpellIII.getStatus();
    },
    buyCommandSpellIII() {
      return commandSpellIII.purchase();
    },
    commandSpellIIPrototypeStatus() {
      return compatibilitySpellIIStatus(core.state.read());
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
    testPresets,
    systems: Object.freeze({
      regrowth,
      combat,
      autoSlash,
      np,
      humanityEvil,
      commandSpells,
      commandSpellII,
      commandSpellIII,
      hydraProgression,
    }),
    destroy() {
      autoSlash.destroy();
      combat.destroy();
      hydraProgression.destroy();
      commandSpells.destroy();
      commandSpellII.destroy();
      commandSpellIII.destroy();
      humanityEvil.destroy();
      np.destroy();
      regrowth.destroy();
      core.destroy();
    },
  };
}

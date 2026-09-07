function addMilestone(draft, id) {
  if (!draft.progression.milestones.includes(id)) {
    draft.progression.milestones.push(id);
  }
}

function removeMilestone(draft, id) {
  draft.progression.milestones = draft.progression.milestones.filter((value) => value !== id);
}

function currentCommandSpellIIEffect(snapshot, progression) {
  const definition = progression.commandSpellII;
  if (!definition?.base || !Array.isArray(definition.levels)) {
    return progression.np ?? { maxPoints: 66, durationMs: 3000 };
  }

  let current = definition.base;
  for (const level of definition.levels) {
    if (!snapshot.progression.milestones.includes(`${definition.id}-lv${level.level}`)) break;
    current = level;
  }
  return current;
}

export function createTestPresets({ state, events, progression } = {}) {
  if (!state || typeof state.read !== 'function' || typeof state.update !== 'function') {
    throw new TypeError('Test presets require a state store.');
  }
  if (!events || typeof events.emit !== 'function') {
    throw new TypeError('Test presets require an event bus.');
  }
  if (!progression?.commandSpellI?.levels?.length) {
    throw new TypeError('Test presets require Command Spell I progression data.');
  }

  function maxCommandSpellI() {
    const levels = progression.commandSpellI.levels;
    const max = levels.at(-1);

    state.update((draft) => {
      draft.master.commandSpells.autoSlash = true;
      draft.berserker.baseAttacksPerSecond = max.attacksPerSecond;

      for (const level of levels.slice(1)) {
        addMilestone(draft, `${progression.commandSpellI.id}-lv${level.level}`);
      }
    });

    const payload = {
      preset: 'command-spell-i-max',
      level: max.level,
      attacksPerSecond: max.attacksPerSecond,
    };
    events.emit('test:preset-applied', payload);
    return Object.freeze(payload);
  }

  function commandSpellIILv1() {
    const definition = progression.commandSpellII;
    const first = definition?.levels?.[0];
    if (!definition || !first || !Number.isInteger(first.npManualStrikeCount)) {
      throw new TypeError('Command Spell II level data is unavailable.');
    }

    state.update((draft) => {
      addMilestone(draft, `${definition.id}-lv${first.level}`);
    });

    const payload = {
      preset: 'command-spell-ii-lv1',
      level: first.level,
      npManualStrikeCount: first.npManualStrikeCount,
      npMaxPoints: first.npMaxPoints,
      npDurationMs: first.npDurationMs,
    };
    events.emit('test:preset-applied', payload);
    return Object.freeze(payload);
  }

  function readyNp() {
    state.update((draft) => {
      // Persistent NP storage is normalized 0..1. A full test gauge is therefore
      // exactly 1 regardless of the current player-facing max-point presentation.
      draft.berserker.np = 1;
    });

    const effect = currentCommandSpellIIEffect(state.read(), progression);
    const payload = {
      preset: 'np-ready',
      points: effect.npMaxPoints ?? progression.np?.maxPoints ?? 66,
    };
    events.emit('test:preset-applied', payload);
    return Object.freeze(payload);
  }

  function startHydraIEncounter98() {
    const intro = progression.hydraIIIntro;

    state.update((draft) => {
      draft.hydra.generation = 1;
      draft.hydra.encounter = 98n;
      draft.hydra.logicalHeadCount = 9n;
      draft.hydra.startingHeadCount = 9n;
      draft.hydra.turn = 0n;
      draft.hydra.pendingRegrowth = [];
      draft.hydra.defeated = false;
      draft.hydra.respawnAtMs = null;

      draft.progression.hydraGeneration = 1;
      if (intro?.firstManualCutMilestone) {
        removeMilestone(draft, intro.firstManualCutMilestone);
      }

      // "Start at Hydra #98" means 97 Hydra I kills are already complete.
      draft.statistics.totalHydrasKilled = 97n;
      draft.berserker.np = 0;
      draft.modifiers.active = [];
    });

    const payload = {
      preset: 'hydra-i-encounter-98',
      generation: 1,
      encounter: 98n,
      completedKills: 97n,
    };
    events.emit('test:preset-applied', payload);
    return Object.freeze(payload);
  }

  function startHydraIIAtCap() {
    const config = progression.generations?.[2];
    const intro = progression.hydraIIIntro;
    if (!config || typeof config.maxHeads !== 'bigint' || typeof config.startingHeads !== 'bigint') {
      throw new TypeError('Hydra II generation data is unavailable.');
    }

    state.update((draft) => {
      draft.hydra.generation = 2;
      draft.hydra.encounter = 1n;
      draft.hydra.logicalHeadCount = config.maxHeads;
      draft.hydra.startingHeadCount = config.startingHeads;
      draft.hydra.turn = config.maxHeads - config.startingHeads;
      draft.hydra.pendingRegrowth = [];
      draft.hydra.defeated = false;
      draft.hydra.respawnAtMs = null;

      draft.progression.hydraGeneration = 2;
      if (intro?.firstManualCutMilestone) {
        addMilestone(draft, intro.firstManualCutMilestone);
      }

      // Keep generation statistics internally plausible for HUD/debug output,
      // without granting corresponding currency in this non-persistent test session.
      draft.statistics.totalHydrasKilled = 99n;
      draft.berserker.np = 0;
      draft.modifiers.active = [];
    });

    const payload = {
      preset: 'hydra-ii-at-cap',
      generation: 2,
      encounter: 1n,
      heads: config.maxHeads,
    };
    events.emit('test:preset-applied', payload);
    return Object.freeze(payload);
  }

  return Object.freeze({
    maxCommandSpellI,
    commandSpellIILv1,
    readyNp,
    startHydraIEncounter98,
    startHydraIIAtCap,
  });
}

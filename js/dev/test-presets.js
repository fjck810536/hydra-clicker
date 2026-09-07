function addMilestone(draft, id) {
  if (!draft.progression.milestones.includes(id)) {
    draft.progression.milestones.push(id);
  }
}

function removeMilestone(draft, id) {
  draft.progression.milestones = draft.progression.milestones.filter((value) => value !== id);
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

  function readyNp() {
    state.update((draft) => {
      // Persistent NP storage is normalized 0..1. A full test gauge is therefore
      // exactly 1 regardless of the current player-facing max-point presentation.
      draft.berserker.np = 1;
    });

    const payload = {
      preset: 'np-ready',
      points: progression.np?.maxPoints ?? 66,
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

  return Object.freeze({
    maxCommandSpellI,
    readyNp,
    startHydraIEncounter98,
  });
}

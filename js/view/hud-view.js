function formatInteger(value) {
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function formatGeneration(generation) {
  if (generation === 1) return 'I';
  if (generation === 2) return 'II';
  if (generation === 3) return 'III';
  return String(generation);
}

function formatCommandSpellI(status) {
  if (!status) return 'COMMAND SPELL I';

  if (status.maxed) {
    return `COMMAND SPELL I · Lv.MAX · ${status.attacksPerSecond} APS`;
  }

  if (status.available) {
    return `COMMAND SPELL I · Lv.${status.nextLevel} · BUY ${formatInteger(status.cost)} · ${status.nextAttacksPerSecond} APS`;
  }

  if (!status.killsMet) {
    return `COMMAND SPELL I · ${formatInteger(status.kills)}/${formatInteger(status.requiredHydraKills)} KILLS · → ${status.nextAttacksPerSecond} APS`;
  }

  return `COMMAND SPELL I · Lv.${status.level} · NEED ${formatInteger(status.cost)} 人類惡 · → ${status.nextAttacksPerSecond} APS`;
}

function formatCommandSpellII(status, generation) {
  if (!status) return 'COMMAND SPELL II';

  if (status.maxed) {
    const seconds = Math.round(status.npDurationMs / 1000);
    return `COMMAND SPELL II · MAX · ×${status.npManualStrikeCount} · ${seconds}s`;
  }

  if (generation < status.generation) {
    return 'COMMAND SPELL II · LOCKED · HYDRA II';
  }

  if (!status.killsMet) {
    return `COMMAND SPELL II · ${formatInteger(status.generationKills)}/${formatInteger(status.requiredGenerationKills)} HYDRA II · ${status.nextRewardLabel}`;
  }

  if (status.available) {
    return `COMMAND SPELL II · Lv.${status.nextLevel} · BUY ${formatInteger(status.cost)} · ${status.nextRewardLabel}`;
  }

  return `COMMAND SPELL II · Lv.${status.level} · NEED ${formatInteger(status.cost)} 人類惡 · ${status.nextRewardLabel}`;
}

function formatNpGauge(np) {
  if (!np) return { label: '0/66', button: 'NP · 0/66', ready: false };
  const label = `${np.points}/${np.maxPoints}`;
  return {
    label: np.ready ? 'READY' : label,
    button: np.ready ? '寶具解放' : `NP · ${label}`,
    ready: np.ready,
  };
}

function formatGenerationProgress(progress) {
  if (!progress || progress.targetKills == null) {
    return { eyebrow: 'SHELL', kills: '—' };
  }

  const completed = formatInteger(progress.completedKills);
  const target = formatInteger(progress.targetKills);
  return {
    eyebrow: `${completed}/${target}`,
    kills: `${completed}/${target}`,
  };
}

export function createHudView({ root } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError('createHudView requires a root element.');
  }

  const generation = root.querySelector('[data-hud="hydra-generation"]');
  const headCount = root.querySelector('[data-hud="heads"]');
  const cutCount = root.querySelector('[data-hud="cuts"]');
  const killCount = root.querySelector('[data-hud="kills"]');
  const humanityEvil = root.querySelector('[data-hud="humanity-evil"]');
  const npValue = root.querySelector('[data-hud="np"]');
  const npButton = root.querySelector('[data-np-button]');
  const commandSpellIButton = root.querySelector('[data-command-spell-button]');
  const commandSpellIIButton = root.querySelector('[data-command-spell-ii-button]');
  const autoSlash = root.querySelector('[data-hud="auto-slash"]');
  const status = root.querySelector('[data-stage-status]');

  if (
    !generation
    || !headCount
    || !cutCount
    || !killCount
    || !humanityEvil
    || !npValue
    || !npButton
    || !commandSpellIButton
    || !commandSpellIIButton
    || !autoSlash
    || !status
  ) {
    throw new Error('HUD markup is incomplete.');
  }

  return {
    render(snapshot, {
      commandSpellI = null,
      commandSpellII = null,
      np = null,
      npActive = false,
      hydraIIIntroPending = false,
      generationProgress = null,
    } = {}) {
      const npGauge = formatNpGauge(np);
      const progress = formatGenerationProgress(generationProgress);

      generation.textContent = `HYDRA ${formatGeneration(snapshot.hydra.generation)} · ${progress.eyebrow}`;
      headCount.textContent = formatInteger(snapshot.hydra.logicalHeadCount);
      cutCount.textContent = formatInteger(snapshot.statistics.totalHeadsCut);
      killCount.textContent = progress.kills;
      humanityEvil.textContent = formatInteger(snapshot.master.humanityEvil);
      npValue.textContent = npGauge.label;
      npButton.textContent = npGauge.button;

      // NP is a timed rule modifier that can span encounters, so READY remains
      // releasable even during an empty respawn gap.
      npButton.disabled = !npGauge.ready;

      autoSlash.textContent = snapshot.hydra.generation >= 3
        ? 'PAUSED'
        : npActive && snapshot.master.commandSpells.autoSlash
          ? 'PAUSED · NP'
          : hydraIIIntroPending
            ? 'PAUSED · TAP'
            : snapshot.master.commandSpells.autoSlash
              ? `${snapshot.berserker.baseAttacksPerSecond} APS`
              : 'LOCKED';

      commandSpellIButton.textContent = formatCommandSpellI(commandSpellI);
      commandSpellIButton.disabled = !commandSpellI?.available;
      commandSpellIIButton.textContent = formatCommandSpellII(commandSpellII, snapshot.hydra.generation);
      commandSpellIIButton.disabled = !commandSpellII?.available;
    },
    setStatus(message) {
      status.textContent = message;
    },
  };
}

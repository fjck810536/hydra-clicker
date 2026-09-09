function formatInteger(value) {
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function formatGeneration(generation) {
  if (generation === 1) return 'I';
  if (generation === 2) return 'II';
  if (generation === 3) return 'III';
  return String(generation);
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
  return { eyebrow: `${completed}/${target}`, kills: `${completed}/${target}` };
}

function formatAps(value) {
  if (!Number.isFinite(value)) return '—';
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
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
  const npButtonLabel = root.querySelector('[data-np-button-label]');
  const autoSlash = root.querySelector('[data-hud="auto-slash"]');
  const status = root.querySelector('[data-stage-status]');

  if (!generation || !headCount || !cutCount || !killCount || !humanityEvil
    || !npValue || !npButton || !npButtonLabel || !autoSlash || !status) {
    throw new Error('HUD markup is incomplete.');
  }

  return {
    render(snapshot, {
      np = null,
      npActive = false,
      hydraIIIntroPending = false,
      generationProgress = null,
      autoNpStatus = null,
    } = {}) {
      const npGauge = formatNpGauge(np);
      const progress = formatGenerationProgress(generationProgress);

      generation.textContent = `HYDRA ${formatGeneration(snapshot.hydra.generation)} · ${progress.eyebrow}`;
      headCount.textContent = formatInteger(snapshot.hydra.logicalHeadCount);
      cutCount.textContent = formatInteger(snapshot.statistics.totalHeadsCut);
      killCount.textContent = progress.kills;
      humanityEvil.textContent = formatInteger(snapshot.master.humanityEvil);
      npValue.textContent = npGauge.label;
      npButtonLabel.textContent = npGauge.button;
      npButton.disabled = !npGauge.ready;

      if (!snapshot.master.commandSpells.autoSlash) {
        autoSlash.textContent = 'LOCKED';
      } else if (hydraIIIntroPending) {
        autoSlash.textContent = 'PAUSED · TAP';
      } else if (npActive) {
        autoSlash.textContent = autoNpStatus?.autoNpFraction > 0
          ? `${formatAps(autoNpStatus.autoNpAps)} APS`
          : 'PAUSED · NP';
      } else {
        autoSlash.textContent = `${formatAps(snapshot.berserker.baseAttacksPerSecond)} APS`;
      }
    },
    setStatus(message) {
      status.textContent = message;
    },
  };
}

function formatInteger(value) {
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function formatCommandSpell(status) {
  if (!status) return 'COMMAND SPELL I';

  if (status.maxed) {
    return `COMMAND SPELL I · Lv.MAX · ${status.attacksPerSecond} APS`;
  }

  if (status.available) {
    return `COMMAND SPELL I · Lv.${status.nextLevel} · BUY ${formatInteger(status.cost)} · ${status.nextAttacksPerSecond} APS`;
  }

  if (status.level === 0) {
    return `COMMAND SPELL I · ${formatInteger(status.kills)}/${formatInteger(status.requiredHydraKills)} KILLS`;
  }

  return `COMMAND SPELL I · Lv.${status.level} · NEXT ${formatInteger(status.requiredHydraKills)} KILLS`;
}

function formatNpGauge(np) {
  if (!np) return { label: '0/66', button: 'NP · 0/66', ready: false };
  const label = `${np.points}/${np.maxPoints}`;
  return {
    label: np.ready ? 'READY' : label,
    button: np.ready ? 'NP · RELEASE' : `NP · ${label}`,
    ready: np.ready,
  };
}

export function createHudView({ root } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError('createHudView requires a root element.');
  }

  const headCount = root.querySelector('[data-hud="heads"]');
  const cutCount = root.querySelector('[data-hud="cuts"]');
  const killCount = root.querySelector('[data-hud="kills"]');
  const humanityEvil = root.querySelector('[data-hud="humanity-evil"]');
  const npValue = root.querySelector('[data-hud="np"]');
  const npButton = root.querySelector('[data-np-button]');
  const commandSpellButton = root.querySelector('[data-command-spell-button]');
  const autoSlash = root.querySelector('[data-hud="auto-slash"]');
  const status = root.querySelector('[data-stage-status]');

  if (!headCount || !cutCount || !killCount || !humanityEvil || !npValue || !npButton || !commandSpellButton || !autoSlash || !status) {
    throw new Error('HUD markup is incomplete.');
  }

  return {
    render(snapshot, { commandSpellI = null, np = null } = {}) {
      const npGauge = formatNpGauge(np);

      headCount.textContent = formatInteger(snapshot.hydra.logicalHeadCount);
      cutCount.textContent = formatInteger(snapshot.statistics.totalHeadsCut);
      killCount.textContent = formatInteger(snapshot.statistics.totalHydrasKilled);
      humanityEvil.textContent = formatInteger(snapshot.master.humanityEvil);
      npValue.textContent = npGauge.label;
      npButton.textContent = npGauge.button;
      npButton.disabled = !npGauge.ready || snapshot.hydra.defeated;
      autoSlash.textContent = snapshot.master.commandSpells.autoSlash
        ? `${snapshot.berserker.baseAttacksPerSecond} APS`
        : 'LOCKED';

      commandSpellButton.textContent = formatCommandSpell(commandSpellI);
      commandSpellButton.disabled = !commandSpellI?.available;
    },
    setStatus(message) {
      status.textContent = message;
    },
  };
}

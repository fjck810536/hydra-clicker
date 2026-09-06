function formatInteger(value) {
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function formatPercent(value) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function formatCommandSpell(status) {
  if (!status) return 'COMMAND SPELL I';
  if (status.purchased) return 'COMMAND SPELL I · OWNED';
  if (status.available) return `COMMAND SPELL I · BUY ${formatInteger(status.cost)}`;
  return `COMMAND SPELL I · ${formatInteger(status.kills)}/${formatInteger(status.requiredHydraKills)} KILLS`;
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
    render(snapshot, { commandSpellI = null } = {}) {
      const npPercent = formatPercent(snapshot.berserker.np);
      const npReady = snapshot.berserker.np >= 1;

      headCount.textContent = formatInteger(snapshot.hydra.logicalHeadCount);
      cutCount.textContent = formatInteger(snapshot.statistics.totalHeadsCut);
      killCount.textContent = formatInteger(snapshot.statistics.totalHydrasKilled);
      humanityEvil.textContent = formatInteger(snapshot.master.humanityEvil);
      npValue.textContent = npReady ? 'READY' : npPercent;
      npButton.textContent = npReady ? 'NP · RELEASE' : `NP · ${npPercent}`;
      npButton.disabled = !npReady || snapshot.hydra.defeated;
      autoSlash.textContent = snapshot.master.commandSpells.autoSlash ? 'ON' : 'LOCKED';

      commandSpellButton.textContent = formatCommandSpell(commandSpellI);
      commandSpellButton.disabled = !commandSpellI?.available;
    },
    setStatus(message) {
      status.textContent = message;
    },
  };
}

function formatInteger(value) {
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function formatPercent(value) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

export function createHudView({ root } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError('createHudView requires a root element.');
  }

  const headCount = root.querySelector('[data-hud="heads"]');
  const cutCount = root.querySelector('[data-hud="cuts"]');
  const npValue = root.querySelector('[data-hud="np"]');
  const npButton = root.querySelector('[data-np-button]');
  const autoSlash = root.querySelector('[data-hud="auto-slash"]');
  const status = root.querySelector('[data-stage-status]');

  if (!headCount || !cutCount || !npValue || !npButton || !autoSlash || !status) {
    throw new Error('HUD markup is incomplete.');
  }

  return {
    render(snapshot) {
      const npPercent = formatPercent(snapshot.berserker.np);
      const npReady = snapshot.berserker.np >= 1;

      headCount.textContent = formatInteger(snapshot.hydra.logicalHeadCount);
      cutCount.textContent = formatInteger(snapshot.statistics.totalHeadsCut);
      npValue.textContent = npReady ? 'READY' : npPercent;
      npButton.textContent = npReady ? 'NP · RELEASE' : `NP · ${npPercent}`;
      npButton.disabled = !npReady;
      autoSlash.textContent = snapshot.master.commandSpells.autoSlash ? 'ON' : 'LOCKED';
    },
    setStatus(message) {
      status.textContent = message;
    },
  };
}

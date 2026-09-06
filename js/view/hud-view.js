function formatInteger(value) {
  return typeof value === 'bigint' ? value.toString() : String(value);
}

export function createHudView({ root } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError('createHudView requires a root element.');
  }

  const headCount = root.querySelector('[data-hud="heads"]');
  const cutCount = root.querySelector('[data-hud="cuts"]');
  const autoSlash = root.querySelector('[data-hud="auto-slash"]');
  const status = root.querySelector('[data-stage-status]');

  if (!headCount || !cutCount || !autoSlash || !status) {
    throw new Error('HUD markup is incomplete.');
  }

  return {
    render(snapshot) {
      headCount.textContent = formatInteger(snapshot.hydra.logicalHeadCount);
      cutCount.textContent = formatInteger(snapshot.statistics.totalHeadsCut);
      autoSlash.textContent = snapshot.master.commandSpells.autoSlash ? 'ON' : 'LOCKED';
    },
    setStatus(message) {
      status.textContent = message;
    },
  };
}

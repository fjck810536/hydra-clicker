function formatRemainingMs(remainingMs) {
  const safe = Number.isFinite(remainingMs) ? Math.max(0, remainingMs) : 0;
  return (safe / 1000).toFixed(1);
}

export function createNpTimerView({ root } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError('NP timer view requires a root element.');
  }

  const value = root.querySelector('[data-np-timer-value]');
  const technique = root.querySelector('[data-np-timer-technique]');
  if (!value || !technique) {
    throw new Error('NP timer markup is incomplete.');
  }

  function render({ active = false, remainingMs = 0, manualStrikeCount = 1 } = {}) {
    root.hidden = !active;
    if (!active) return;

    value.textContent = `${formatRemainingMs(remainingMs)} s`;
    technique.textContent = manualStrikeCount > 1
      ? `MANUAL ×${manualStrikeCount}`
      : 'MANUAL ×1';
  }

  return Object.freeze({ render });
}

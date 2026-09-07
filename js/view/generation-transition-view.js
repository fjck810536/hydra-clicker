function formatGeneration(generation) {
  if (generation === 1) return 'I';
  if (generation === 2) return 'II';
  if (generation === 3) return 'III';
  return String(generation);
}

function formatBigInt(value, fallback = '—') {
  return typeof value === 'bigint' ? value.toString() : fallback;
}

export function createGenerationTransitionView({ root } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError('Generation transition view requires a root element.');
  }

  const title = root.querySelector('[data-generation-transition-title]');
  const meta = root.querySelector('[data-generation-transition-meta]');
  if (!title || !meta) throw new Error('Generation transition markup is incomplete.');

  const handleAnimationEnd = (event) => {
    if (event.target !== root) return;
    root.classList.remove('is-active');
    root.hidden = true;
  };
  root.addEventListener('animationend', handleAnimationEnd);

  function show({ generation, maxHeads = null, killsToNextGeneration = null } = {}) {
    if (!Number.isInteger(generation) || generation < 1) {
      throw new TypeError('generation must be a positive integer.');
    }

    title.textContent = `HYDRA ${formatGeneration(generation)}`;
    meta.textContent = killsToNextGeneration == null
      ? `START 9 · MAX ${formatBigInt(maxHeads)} · RULE PENDING`
      : `START 9 · MAX ${formatBigInt(maxHeads)} · KILL ${formatBigInt(killsToNextGeneration)}`;

    root.dataset.generation = String(generation);
    root.hidden = false;
    root.classList.remove('is-active');
    // Re-trigger the CSS-only transition if generation changes happen rapidly in TEST.
    void root.offsetWidth;
    root.classList.add('is-active');
  }

  return {
    show,
    destroy() {
      root.removeEventListener('animationend', handleAnimationEnd);
    },
  };
}

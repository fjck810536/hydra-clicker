export function createNpPhaseView({ root } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError('NP phase view requires a root element.');
  }

  const kicker = root.querySelector('[data-np-phase-kicker]');
  const title = root.querySelector('[data-np-phase-title]');
  const meta = root.querySelector('[data-np-phase-meta]');
  if (!kicker || !title || !meta) {
    throw new Error('NP phase markup is incomplete.');
  }

  const handleAnimationEnd = (event) => {
    if (event.target !== root) return;
    root.classList.remove('is-active');
    root.hidden = true;
  };
  root.addEventListener('animationend', handleAnimationEnd);

  function showPhase({ phase, kickerText, titleText, metaText }) {
    root.dataset.phase = phase;
    kicker.textContent = kickerText;
    title.textContent = titleText;
    meta.textContent = metaText;
    root.hidden = false;
    root.classList.remove('is-active');
    // Re-trigger the CSS animation if TEST or a rapid re-release changes phase.
    void root.offsetWidth;
    root.classList.add('is-active');
  }

  function showRelease() {
    showPhase({
      phase: 'release',
      kickerText: '寶具解放',
      titleText: 'ナインライブズ',
      metaText: '射殺す百頭',
    });
  }

  function showResume() {
    showPhase({
      phase: 'resume',
      kickerText: 'TIME RESUMES',
      titleText: '時は動き出す',
      metaText: 'HYDRA LAW RESTORED',
    });
  }

  return {
    showRelease,
    showResume,
    destroy() {
      root.removeEventListener('animationend', handleAnimationEnd);
    },
  };
}

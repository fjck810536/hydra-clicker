const DEFAULT_VISIBLE_HEAD_CAP = 99n;

function minBigInt(a, b) {
  return a < b ? a : b;
}

export function projectTreeView(snapshot, {
  visibleHeadCap = DEFAULT_VISIBLE_HEAD_CAP,
  maxHeads = null,
} = {}) {
  if (!snapshot?.hydra || !snapshot?.progression) {
    throw new TypeError('projectTreeView requires a game snapshot.');
  }
  const logicalHeads = snapshot.hydra.logicalHeadCount;
  if (typeof logicalHeads !== 'bigint' || logicalHeads < 0n) {
    throw new TypeError('logicalHeadCount must be a non-negative BigInt.');
  }
  if (typeof visibleHeadCap !== 'bigint' || visibleHeadCap < 1n) {
    throw new TypeError('visibleHeadCap must be a positive BigInt.');
  }
  if (maxHeads != null && (typeof maxHeads !== 'bigint' || maxHeads < 1n)) {
    throw new TypeError('maxHeads must be null or a positive BigInt.');
  }

  const visibleHeads = minBigInt(logicalHeads, visibleHeadCap);
  const overflowHeads = logicalHeads > visibleHeadCap
    ? logicalHeads - visibleHeadCap
    : 0n;

  return Object.freeze({
    unlocked: snapshot.progression.treeViewUnlocked === true,
    generation: snapshot.hydra.generation,
    logicalHeads,
    visibleHeads,
    overflowHeads,
    visibleHeadCap,
    maxHeads,
  });
}

export function createTreeView({ root } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError('createTreeView requires a root element.');
  }

  const toggle = root.querySelector('[data-tree-view-toggle]');
  const overlay = root.querySelector('[data-tree-view-overlay]');
  const closeButton = root.querySelector('[data-tree-view-close]');
  const logical = root.querySelector('[data-tree-view-logical]');
  const visible = root.querySelector('[data-tree-view-visible]');
  const overflow = root.querySelector('[data-tree-view-overflow]');
  const cap = root.querySelector('[data-tree-view-cap]');

  if (!toggle || !overlay || !closeButton || !logical || !visible || !overflow || !cap) {
    throw new Error('Tree View markup is incomplete.');
  }

  let latest = null;

  function render(snapshot, options = {}) {
    latest = projectTreeView(snapshot, options);
    toggle.hidden = !latest.unlocked;
    if (!latest.unlocked) overlay.hidden = true;

    logical.textContent = latest.logicalHeads.toString();
    visible.textContent = `${latest.visibleHeads.toString()} / ${latest.visibleHeadCap.toString()}`;
    overflow.textContent = latest.overflowHeads > 0n
      ? `+${latest.overflowHeads.toString()}`
      : '0';
    cap.textContent = latest.maxHeads?.toString() ?? '—';
    overlay.dataset.generation = String(latest.generation);
    return latest;
  }

  function open() {
    if (!latest?.unlocked) return false;
    overlay.hidden = false;
    return true;
  }

  function close() {
    overlay.hidden = true;
  }

  return Object.freeze({
    toggle,
    overlay,
    closeButton,
    render,
    open,
    close,
  });
}

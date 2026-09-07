function formatInteger(value) {
  if (value == null) return '—';
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function formatSeconds(durationMs) {
  if (!Number.isFinite(durationMs)) return '—';
  return `${Math.round(durationMs / 1000)}s`;
}

export function projectCommandSpellISlot(status) {
  if (!status) {
    return Object.freeze({ state: 'dormant', level: '—', meta: 'EMPTY', clickable: false });
  }

  if (!status.purchased) {
    if (status.available) {
      return Object.freeze({
        state: 'available',
        level: 'NEW',
        meta: `${formatInteger(status.cost)} 人類惡`,
        clickable: true,
      });
    }
    return Object.freeze({ state: 'dormant', level: '—', meta: 'EMPTY', clickable: false });
  }

  if (status.maxed) {
    return Object.freeze({
      state: 'max',
      level: 'MAX',
      meta: `${status.attacksPerSecond} APS`,
      clickable: true,
    });
  }

  if (status.pricePending) {
    return Object.freeze({
      state: 'owned-dim',
      level: `Lv.${status.level}`,
      meta: `${status.attacksPerSecond} APS · PRICE TBD`,
      clickable: true,
    });
  }

  return Object.freeze({
    state: status.available ? 'affordable' : 'owned-dim',
    level: `Lv.${status.level}`,
    meta: status.available
      ? `LV UP · ${formatInteger(status.cost)}`
      : `${status.attacksPerSecond} APS · NEXT ${formatInteger(status.cost)}`,
    clickable: true,
  });
}

export function projectCommandSpellIISlot(status) {
  if (!status) {
    return Object.freeze({ state: 'dormant', level: '—', meta: 'EMPTY', clickable: false });
  }

  if (!status.unlocked) {
    if (status.available) {
      return Object.freeze({
        state: 'available',
        level: 'NEW',
        meta: `${formatInteger(status.cost)} 人類惡`,
        clickable: true,
      });
    }
    return Object.freeze({ state: 'dormant', level: '—', meta: 'EMPTY', clickable: false });
  }

  if (status.maxed) {
    return Object.freeze({
      state: 'max',
      level: 'MAX',
      meta: `×${status.npManualStrikeCount} · ${formatSeconds(status.npDurationMs)}`,
      clickable: true,
    });
  }

  return Object.freeze({
    state: status.available ? 'affordable' : 'owned-dim',
    level: `Lv.${status.level}`,
    meta: status.available
      ? `LV UP · ${formatInteger(status.cost)}`
      : `NP ${status.npMaxPoints} · NEXT ${formatInteger(status.cost)}`,
    clickable: true,
  });
}

function renderSlot(slot, projection) {
  slot.dataset.state = projection.state;
  slot.disabled = !projection.clickable;
  slot.setAttribute('aria-disabled', projection.clickable ? 'false' : 'true');

  const level = slot.querySelector('[data-command-spell-slot-level]');
  const meta = slot.querySelector('[data-command-spell-slot-meta]');
  level.textContent = projection.level;
  meta.textContent = projection.meta;
}

function spellIDFromNumber(number) {
  if (number === 1) return 'command-spell-1';
  if (number === 2) return 'command-spell-2';
  return null;
}

function modalModel(number, status) {
  if (number === 1) {
    const current = status.purchased
      ? `${status.attacksPerSecond} APS`
      : 'Auto Slash locked';
    const next = status.maxed
      ? 'MAX'
      : `${status.nextAttacksPerSecond} APS`;
    const cost = status.maxed
      ? '—'
      : status.pricePending
        ? 'PRICE TBD'
        : `${formatInteger(status.cost)} 人類惡`;
    const action = status.maxed
      ? 'MAX'
      : status.pricePending
        ? 'PRICE TBD'
        : status.purchased
          ? 'LV UP'
          : 'PURCHASE';

    return {
      title: '「幫我撐十秒。」',
      subtitle: 'COMMAND SPELL I',
      level: status.purchased ? `Lv.${status.level}` : 'Lv.0',
      current,
      next,
      cost,
      description: '普通時間的 Auto Slash。寶具時停期間仍會暫停。',
      action,
      canPurchase: status.available,
    };
  }

  const current = status.unlocked
    ? `×${status.npManualStrikeCount} · NP ${status.npMaxPoints} · ${formatSeconds(status.npDurationMs)}`
    : '×1 · NP 66 · 3s';
  const next = status.maxed
    ? 'MAX'
    : status.nextRewardLabel;

  return {
    title: '射殺す百頭',
    subtitle: 'COMMAND SPELL II',
    level: status.unlocked ? `Lv.${status.level}` : 'Lv.0',
    current,
    next,
    cost: status.maxed ? '—' : `${formatInteger(status.cost)} 人類惡`,
    description: '只強化寶具／時停技法：連斬、NP效率與時停時間。',
    action: status.maxed ? 'MAX' : status.unlocked ? 'LV UP' : 'PURCHASE',
    canPurchase: status.available,
  };
}

export function createCommandSpellPanel({ root } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError('createCommandSpellPanel requires a root element.');
  }

  const slots = [1, 2, 3].map((number) => root.querySelector(`[data-command-spell-slot="${number}"]`));
  const modal = root.querySelector('[data-command-spell-modal]');
  const modalTitle = root.querySelector('[data-command-spell-modal-title]');
  const modalSubtitle = root.querySelector('[data-command-spell-modal-subtitle]');
  const modalLevel = root.querySelector('[data-command-spell-modal-level]');
  const modalCurrent = root.querySelector('[data-command-spell-modal-current]');
  const modalNext = root.querySelector('[data-command-spell-modal-next]');
  const modalCost = root.querySelector('[data-command-spell-modal-cost]');
  const modalDescription = root.querySelector('[data-command-spell-modal-description]');
  const modalPurchase = root.querySelector('[data-command-spell-purchase]');

  if (slots.some((slot) => !slot) || !modal || !modalTitle || !modalSubtitle || !modalLevel
    || !modalCurrent || !modalNext || !modalCost || !modalDescription || !modalPurchase) {
    throw new Error('Command Spell panel markup is incomplete.');
  }

  let latestI = null;
  let latestII = null;
  let openSpell = null;

  function render({ commandSpellI, commandSpellII } = {}) {
    latestI = commandSpellI ?? null;
    latestII = commandSpellII ?? null;
    renderSlot(slots[0], projectCommandSpellISlot(latestI));
    renderSlot(slots[1], projectCommandSpellIISlot(latestII));
    renderSlot(slots[2], { state: 'dormant', level: '—', meta: 'EMPTY', clickable: false });

    if (openSpell != null) open(openSpell);
  }

  function open(number) {
    const status = number === 1 ? latestI : number === 2 ? latestII : null;
    if (!status) return false;
    const projection = number === 1
      ? projectCommandSpellISlot(status)
      : projectCommandSpellIISlot(status);
    if (!projection.clickable) return false;

    const model = modalModel(number, status);
    openSpell = number;
    modalTitle.textContent = model.title;
    modalSubtitle.textContent = model.subtitle;
    modalLevel.textContent = model.level;
    modalCurrent.textContent = model.current;
    modalNext.textContent = model.next;
    modalCost.textContent = model.cost;
    modalDescription.textContent = model.description;
    modalPurchase.textContent = model.action;
    modalPurchase.disabled = !model.canPurchase;
    modal.dataset.spell = String(number);
    modal.hidden = false;
    return true;
  }

  function close() {
    openSpell = null;
    modal.hidden = true;
    delete modal.dataset.spell;
  }

  function currentOpenSpellId() {
    return spellIDFromNumber(openSpell);
  }

  return Object.freeze({
    slots: Object.freeze(slots),
    modal,
    purchaseButton: modalPurchase,
    render,
    open,
    close,
    currentOpenSpellId,
  });
}

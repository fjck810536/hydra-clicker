function formatInteger(value) {
  if (value == null) return '—';
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function formatSeconds(durationMs) {
  if (!Number.isFinite(durationMs)) return '—';
  return `${Math.round(durationMs / 1000)}s`;
}

function formatNpTechnique({ strikeCount, maxPoints, durationMs }) {
  return `×${strikeCount} · NP ${maxPoints} · ${formatSeconds(durationMs)}`;
}

function formatAutoNpFraction(numerator, denominator) {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator < 1) return '—';
  if (numerator <= 0) return 'OFF';
  if (numerator === denominator) return 'FULL';
  return `${numerator}/${denominator}`;
}

function formatAps(value) {
  if (!Number.isFinite(value)) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
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

export function projectCommandSpellIIISlot(status) {
  if (!status) {
    return Object.freeze({ state: 'dormant', level: '—', meta: 'EMPTY', clickable: false });
  }

  if (!status.unlocked) {
    if (!status.eligible) {
      return Object.freeze({ state: 'dormant', level: '—', meta: 'EMPTY', clickable: false });
    }
    return Object.freeze({
      state: 'available',
      level: 'NEW',
      meta: status.pricePending ? 'PRICE TBD' : `${formatInteger(status.cost)} 人類惡`,
      clickable: true,
    });
  }

  const currentFraction = formatAutoNpFraction(status.autoNpNumerator, status.autoNpDenominator);
  if (status.maxed) {
    return Object.freeze({
      state: 'max',
      level: 'MAX',
      meta: `NP AUTO ${currentFraction}`,
      clickable: true,
    });
  }

  return Object.freeze({
    state: status.available ? 'affordable' : 'owned-dim',
    level: `Lv.${status.level}`,
    meta: status.available
      ? `LV UP · ${formatInteger(status.cost)}`
      : `NP AUTO ${currentFraction} · ${status.pricePending ? 'PRICE TBD' : `NEXT ${formatInteger(status.cost)}`}`,
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
  if (number === 3) return 'command-spell-3';
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
      description: '普通時間的 Auto Slash。寶具時停期間是否能運作，交給令咒 III。',
      action,
      canPurchase: status.available,
    };
  }

  if (number === 2) {
    const current = formatNpTechnique({
      strikeCount: status.npManualStrikeCount,
      maxPoints: status.npMaxPoints,
      durationMs: status.npDurationMs,
    });
    const next = status.maxed
      ? 'MAX'
      : formatNpTechnique({
        strikeCount: status.nextNpManualStrikeCount,
        maxPoints: status.nextNpMaxPoints,
        durationMs: status.nextNpDurationMs,
      });

    return {
      title: '「快點……再快點……！」',
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

  const currentFraction = formatAutoNpFraction(status.autoNpNumerator, status.autoNpDenominator);
  const nextFraction = formatAutoNpFraction(status.nextAutoNpNumerator, status.nextAutoNpDenominator);
  const current = `AUTO IN NP · ${currentFraction} · ${formatAps(status.autoNpAps)} APS`;
  const next = status.maxed
    ? 'MAX'
    : `AUTO IN NP · ${nextFraction} · ${formatAps(status.nextAutoNpAps)} APS`;
  const cost = status.maxed
    ? '—'
    : status.pricePending
      ? 'PRICE TBD'
      : `${formatInteger(status.cost)} 人類惡`;

  return {
    title: '「這裡怎麼沒有 SKIP???」',
    subtitle: 'COMMAND SPELL III',
    level: status.unlocked ? `Lv.${status.level}` : 'Lv.0',
    current,
    next,
    cost,
    description: '把令咒 I 的 Auto Slash 帶進寶具／時停。自動斬不繼承令咒 II 的手動連斬。',
    action: status.maxed ? 'MAX' : status.pricePending ? 'PRICE TBD' : status.unlocked ? 'LV UP' : 'PURCHASE',
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
  let latestIII = null;
  let openSpell = null;

  function render({ commandSpellI, commandSpellII, commandSpellIII } = {}) {
    latestI = commandSpellI ?? null;
    latestII = commandSpellII ?? null;
    latestIII = commandSpellIII ?? null;
    renderSlot(slots[0], projectCommandSpellISlot(latestI));
    renderSlot(slots[1], projectCommandSpellIISlot(latestII));
    renderSlot(slots[2], projectCommandSpellIIISlot(latestIII));

    if (openSpell != null) open(openSpell);
  }

  function open(number) {
    const status = number === 1
      ? latestI
      : number === 2
        ? latestII
        : number === 3
          ? latestIII
          : null;
    if (!status) return false;
    const projection = number === 1
      ? projectCommandSpellISlot(status)
      : number === 2
        ? projectCommandSpellIISlot(status)
        : projectCommandSpellIIISlot(status);
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

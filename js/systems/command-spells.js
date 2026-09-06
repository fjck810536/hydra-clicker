function assertDefinition(definition) {
  if (!definition || definition.id !== 'command-spell-1') {
    throw new TypeError('Command Spell I definition is required.');
  }
  if (typeof definition.requiredHydraKills !== 'bigint' || definition.requiredHydraKills < 0n) {
    throw new TypeError('requiredHydraKills must be a non-negative BigInt.');
  }
  if (definition.cost?.currency !== 'humanity-evil') {
    throw new TypeError('Command Spell I currently requires humanity-evil currency.');
  }
  if (typeof definition.cost.amount !== 'bigint' || definition.cost.amount < 0n) {
    throw new TypeError('Command Spell I cost must be a non-negative BigInt.');
  }
}

export function createCommandSpellSystem({ state, events, definition } = {}) {
  if (!state || typeof state.read !== 'function' || typeof state.update !== 'function') {
    throw new TypeError('Command Spell system requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('Command Spell system requires an event bus.');
  }
  assertDefinition(definition);

  let announcedAvailable = false;

  function getStatus() {
    const snapshot = state.read();
    const purchased = snapshot.master.commandSpells.autoSlash;
    const killsMet = snapshot.statistics.totalHydrasKilled >= definition.requiredHydraKills;
    const canAfford = snapshot.master.humanityEvil >= definition.cost.amount;

    return Object.freeze({
      id: definition.id,
      purchased,
      killsMet,
      canAfford,
      available: !purchased && killsMet && canAfford,
      requiredHydraKills: definition.requiredHydraKills,
      cost: definition.cost.amount,
      balance: snapshot.master.humanityEvil,
      kills: snapshot.statistics.totalHydrasKilled,
    });
  }

  function announceIfAvailable(atMs) {
    const status = getStatus();
    if (status.available && !announcedAvailable) {
      announcedAvailable = true;
      events.emit('command-spell:available', {
        atMs,
        id: definition.id,
        unlocks: [...definition.unlocks],
      });
    }
    if (!status.available && !status.purchased) {
      announcedAvailable = false;
    }
    return status;
  }

  const offKilled = events.on('hydra:killed', ({ payload }) => {
    announceIfAvailable(payload.atMs);
  });
  const offCurrency = events.on('currency:gain', ({ payload }) => {
    announceIfAvailable(payload.atMs);
  });

  function purchase() {
    const status = getStatus();
    if (status.purchased) return { accepted: false, reason: 'already-purchased', status };
    if (!status.killsMet) return { accepted: false, reason: 'kills-required', status };
    if (!status.canAfford) return { accepted: false, reason: 'insufficient-humanity-evil', status };

    const atMs = state.read().time.simulationTimeMs;
    state.update((draft) => {
      draft.master.humanityEvil -= definition.cost.amount;
      draft.master.commandSpells.autoSlash = true;
    });

    announcedAvailable = false;
    events.emit('currency:spend', {
      atMs,
      currency: definition.cost.currency,
      amount: definition.cost.amount,
      reason: definition.id,
      balance: state.read().master.humanityEvil,
    });
    events.emit('command-spell:unlocked', {
      atMs,
      id: definition.id,
      unlocks: [...definition.unlocks],
    });

    return { accepted: true, status: getStatus() };
  }

  return {
    getStatus,
    purchase,
    destroy() {
      offKilled();
      offCurrency();
    },
  };
}

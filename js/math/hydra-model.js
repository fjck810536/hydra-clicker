function makeRegrowthId(turnAfter, index) {
  return `regrow-${turnAfter.toString()}-${index}`;
}

export function applyCutResolution(draft, resolution) {
  if (!draft?.hydra) throw new TypeError('draft.hydra is required.');
  if (!resolution || typeof resolution !== 'object') {
    throw new TypeError('resolution is required.');
  }

  if (!resolution.accepted) return draft;

  if (typeof resolution.headsRemoved !== 'bigint' || resolution.headsRemoved < 0n) {
    throw new TypeError('resolution.headsRemoved must be a non-negative BigInt.');
  }

  if (resolution.headsRemoved > draft.hydra.logicalHeadCount) {
    throw new RangeError('Cannot remove more heads than currently exist.');
  }

  draft.hydra.logicalHeadCount -= resolution.headsRemoved;
  draft.hydra.turn = resolution.turnAfter;

  resolution.regrowth.forEach((event, index) => {
    draft.hydra.pendingRegrowth.push({
      id: makeRegrowthId(resolution.turnAfter, index),
      type: 'hydra-regrow',
      executeAt: event.executeAt,
      amount: event.amount,
      payload: {
        branchId: event.payload?.branchId ?? null,
        ruleId: event.ruleId,
      },
    });
  });

  draft.statistics.totalHeadsCut += resolution.headsRemoved;
  return draft;
}

export function processDueRegrowth(draft, nowMs) {
  if (!draft?.hydra) throw new TypeError('draft.hydra is required.');
  if (!Number.isFinite(nowMs) || nowMs < 0) {
    throw new RangeError('nowMs must be a finite number >= 0.');
  }

  const due = [];
  const pending = [];

  for (const event of draft.hydra.pendingRegrowth) {
    if (event.executeAt <= nowMs) due.push(event);
    else pending.push(event);
  }

  let regrown = 0n;
  for (const event of due) {
    draft.hydra.logicalHeadCount += event.amount;
    regrown += event.amount;
  }

  draft.hydra.pendingRegrowth = pending;

  return {
    processed: due.length,
    headsRegrown: regrown,
    events: due,
  };
}

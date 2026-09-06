export function resolveCut({ rule, hydraState, attack, turn, nowMs } = {}) {
  if (!rule || typeof rule.resolveCut !== 'function') {
    throw new TypeError('resolveCut requires a rule with resolveCut().');
  }

  return rule.resolveCut({
    hydraState,
    attack,
    turn,
    nowMs,
  });
}

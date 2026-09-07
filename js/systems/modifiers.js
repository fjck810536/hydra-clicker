export function getActiveModifiers(modifiers, nowMs) {
  if (!Array.isArray(modifiers)) return [];
  return modifiers.filter((modifier) => {
    if (!modifier || typeof modifier !== 'object') return false;
    const startsAt = modifier.startsAt ?? 0;
    const endsAt = modifier.endsAt ?? Infinity;
    return startsAt <= nowMs && nowMs < endsAt;
  });
}

export function resolveRuleContext(modifiers, nowMs) {
  const active = getActiveModifiers(modifiers, nowMs);
  const context = {
    headGrowthEnabled: true,
    regrowthEnabled: true,
  };

  for (const modifier of active) {
    if (modifier.type !== 'rule-modifier' || modifier.effect !== 'disable') continue;

    // `hydra.headGrowth` is the current generic target used by NP. The older
    // `hydra.regrowth` target remains a compatibility alias so an active timed
    // modifier restored from a Playtest 2/3 save keeps suppressing growth until
    // its original simulation-time deadline.
    if (modifier.target === 'hydra.headGrowth' || modifier.target === 'hydra.regrowth') {
      context.headGrowthEnabled = false;
      context.regrowthEnabled = false;
    }
  }

  return Object.freeze(context);
}

export function isHeadGrowthEnabled(modifiers, nowMs) {
  return resolveRuleContext(modifiers, nowMs).headGrowthEnabled;
}

// Compatibility helper for existing callers whose specific concern is Hydra I's
// delayed regrowth. Generic rules should prefer `headGrowthEnabled`.
export function isRegrowthEnabled(modifiers, nowMs) {
  return resolveRuleContext(modifiers, nowMs).regrowthEnabled;
}

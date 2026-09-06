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
    regrowthEnabled: true,
  };

  for (const modifier of active) {
    if (modifier.type === 'rule-modifier' && modifier.target === 'hydra.regrowth') {
      if (modifier.effect === 'disable') context.regrowthEnabled = false;
    }
  }

  return Object.freeze(context);
}

export function isRegrowthEnabled(modifiers, nowMs) {
  return resolveRuleContext(modifiers, nowMs).regrowthEnabled;
}

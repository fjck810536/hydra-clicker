import { resolveCut } from '../math/cut-resolver.js';
import { applyCutResolution } from '../math/hydra-model.js';
import { resolveRuleContext } from './modifiers.js';

function assertAttackRequest(attack) {
  if (!attack || typeof attack !== 'object') {
    throw new TypeError('attack request is required.');
  }

  const strikeCount = attack.strikeCount ?? 1;
  if (!Number.isInteger(strikeCount) || strikeCount < 1) {
    throw new TypeError('attack.strikeCount must be a positive integer.');
  }

  const headsPerStrike = attack.headsPerStrike ?? 1n;
  if (typeof headsPerStrike !== 'bigint' || headsPerStrike < 1n) {
    throw new TypeError('attack.headsPerStrike must be a positive BigInt.');
  }

  if (!Number.isFinite(attack.timestamp) || attack.timestamp < 0) {
    throw new RangeError('attack.timestamp must be a finite number >= 0.');
  }

  return { strikeCount, headsPerStrike };
}

export function createCombatSystem({
  state,
  events,
  getRule,
  getRuleContext = () => ({}),
} = {}) {
  if (!state || typeof state.read !== 'function' || typeof state.update !== 'function') {
    throw new TypeError('Combat system requires a state store.');
  }
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('Combat system requires an event bus.');
  }
  if (typeof getRule !== 'function') {
    throw new TypeError('Combat system requires getRule().');
  }
  if (typeof getRuleContext !== 'function') {
    throw new TypeError('Combat system getRuleContext must be a function.');
  }

  const unsubscribe = events.on('attack:requested', ({ payload: attack }) => {
    const { strikeCount, headsPerStrike } = assertAttackRequest(attack);
    const resolutions = [];

    for (let strikeIndex = 0; strikeIndex < strikeCount; strikeIndex += 1) {
      const snapshot = state.read();
      const rule = getRule(snapshot);
      const baseRuleContext = getRuleContext(snapshot, attack) ?? {};
      if (typeof baseRuleContext !== 'object') {
        throw new TypeError('getRuleContext() must return an object.');
      }

      const modifierRuleContext = resolveRuleContext(snapshot.modifiers.active, attack.timestamp);
      const ruleContext = Object.freeze({
        ...baseRuleContext,
        ...modifierRuleContext,
      });

      const resolution = resolveCut({
        rule,
        hydraState: snapshot.hydra,
        attack: {
          ...attack,
          strikeCount: 1,
          headsPerStrike,
        },
        turn: snapshot.hydra.turn,
        nowMs: attack.timestamp,
        ruleContext,
      });

      if (resolution.accepted) {
        state.update((draft) => applyCutResolution(draft, resolution));
      }

      resolutions.push(resolution);
      events.emit('attack:resolved', {
        request: attack,
        strikeIndex,
        resolution,
      });

      if (resolution.accepted && resolution.headsRemoved > 0n) {
        events.emit('head:cut', {
          atMs: attack.timestamp,
          source: attack.source,
          amount: resolution.headsRemoved,
          spawned: resolution.headsSpawned,
          turn: resolution.turnAfter,
          depleted: resolution.depleted,
          killed: resolution.killed,
        });
      }

      if (resolution.killed) {
        events.emit('hydra:killed', {
          atMs: attack.timestamp,
          generation: snapshot.hydra.generation,
          turn: resolution.turnAfter,
        });
      }

      if (!resolution.accepted || resolution.killed) break;
    }

    return resolutions;
  });

  return {
    destroy() {
      unsubscribe();
    },
  };
}

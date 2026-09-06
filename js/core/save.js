export const SAVE_FORMAT_VERSION = 1;
export const DEFAULT_SAVE_KEY = 'hydra-clicker:save:v1';

const BIGINT_TAG = '$hydraBigInt';

function encodeValue(_key, value) {
  if (typeof value === 'bigint') {
    return { [BIGINT_TAG]: value.toString() };
  }
  return value;
}

function decodeValue(_key, value) {
  if (
    value
    && typeof value === 'object'
    && Object.keys(value).length === 1
    && typeof value[BIGINT_TAG] === 'string'
  ) {
    if (!/^-?\d+$/.test(value[BIGINT_TAG])) {
      throw new TypeError('Invalid BigInt payload in save data.');
    }
    return BigInt(value[BIGINT_TAG]);
  }
  return value;
}

export function serializeGameSave(state, { savedAtEpochMs = Date.now() } = {}) {
  if (!state || typeof state !== 'object') {
    throw new TypeError('serializeGameSave requires logical game state.');
  }
  if (!Number.isFinite(savedAtEpochMs) || savedAtEpochMs < 0) {
    throw new RangeError('savedAtEpochMs must be a finite number >= 0.');
  }

  return JSON.stringify({
    formatVersion: SAVE_FORMAT_VERSION,
    savedAtEpochMs,
    state,
  }, encodeValue);
}

export function deserializeGameSave(serialized) {
  if (typeof serialized !== 'string' || serialized.length === 0) {
    throw new TypeError('deserializeGameSave requires a non-empty string.');
  }

  const envelope = JSON.parse(serialized, decodeValue);
  if (!envelope || typeof envelope !== 'object') {
    throw new TypeError('Save envelope must be an object.');
  }
  if (envelope.formatVersion !== SAVE_FORMAT_VERSION) {
    throw new Error(`Unsupported save formatVersion: ${String(envelope.formatVersion)}`);
  }
  if (!Number.isFinite(envelope.savedAtEpochMs) || envelope.savedAtEpochMs < 0) {
    throw new RangeError('Save savedAtEpochMs must be a finite number >= 0.');
  }
  if (!envelope.state || typeof envelope.state !== 'object') {
    throw new TypeError('Save state is missing.');
  }

  return envelope;
}

export function createSaveStore({
  storage,
  key = DEFAULT_SAVE_KEY,
  now = () => Date.now(),
} = {}) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('createSaveStore requires a Storage-like object.');
  }
  if (typeof key !== 'string' || key.length === 0) {
    throw new TypeError('save key must be a non-empty string.');
  }
  if (typeof now !== 'function') {
    throw new TypeError('now must be a function.');
  }

  return {
    key,

    save(state) {
      const serialized = serializeGameSave(state, { savedAtEpochMs: now() });
      storage.setItem(key, serialized);
      return serialized;
    },

    load() {
      const serialized = storage.getItem(key);
      if (serialized == null) return null;
      return deserializeGameSave(serialized);
    },

    clear() {
      if (typeof storage.removeItem === 'function') {
        storage.removeItem(key);
      } else {
        storage.setItem(key, '');
      }
    },
  };
}

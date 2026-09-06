export class EventBus {
  #listeners = new Map();

  on(type, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('EventBus listener must be a function.');
    }

    const listeners = this.#listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.#listeners.set(type, listeners);

    return () => this.off(type, listener);
  }

  once(type, listener) {
    const unsubscribe = this.on(type, (event) => {
      unsubscribe();
      listener(event);
    });

    return unsubscribe;
  }

  off(type, listener) {
    const listeners = this.#listeners.get(type);
    if (!listeners) return false;

    const removed = listeners.delete(listener);
    if (listeners.size === 0) this.#listeners.delete(type);
    return removed;
  }

  emit(type, payload = {}) {
    const event = Object.freeze({ type, payload });
    const listeners = this.#listeners.get(type);
    if (!listeners) return event;

    for (const listener of [...listeners]) {
      listener(event);
    }

    return event;
  }

  clear(type = null) {
    if (type === null) {
      this.#listeners.clear();
      return;
    }

    this.#listeners.delete(type);
  }
}

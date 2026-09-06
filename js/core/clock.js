export class GameClock {
  constructor({
    fixedStepMs = 100,
    maxFrameDeltaMs = 1000,
    initialSimulationTimeMs = 0,
    initialTickCount = 0,
  } = {}) {
    if (!(fixedStepMs > 0)) throw new RangeError('fixedStepMs must be > 0.');
    if (!(maxFrameDeltaMs >= fixedStepMs)) {
      throw new RangeError('maxFrameDeltaMs must be >= fixedStepMs.');
    }
    if (!Number.isFinite(initialSimulationTimeMs) || initialSimulationTimeMs < 0) {
      throw new RangeError('initialSimulationTimeMs must be a finite number >= 0.');
    }
    if (!Number.isInteger(initialTickCount) || initialTickCount < 0) {
      throw new RangeError('initialTickCount must be an integer >= 0.');
    }

    this.fixedStepMs = fixedStepMs;
    this.maxFrameDeltaMs = maxFrameDeltaMs;
    this.simulationTimeMs = initialSimulationTimeMs;
    this.tickCount = initialTickCount;
    this.running = false;

    this.#accumulatorMs = 0;
    this.#lastFrameTimeMs = null;
  }

  #tickListeners = new Set();
  #accumulatorMs;
  #lastFrameTimeMs;
  #rafId = null;

  onTick(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('GameClock tick listener must be a function.');
    }

    this.#tickListeners.add(listener);
    return () => this.#tickListeners.delete(listener);
  }

  #step() {
    this.simulationTimeMs += this.fixedStepMs;
    this.tickCount += 1;

    const tick = Object.freeze({
      deltaMs: this.fixedStepMs,
      nowMs: this.simulationTimeMs,
      tick: this.tickCount,
    });

    for (const listener of [...this.#tickListeners]) {
      listener(tick);
    }

    return tick;
  }

  advance(realDeltaMs) {
    if (!Number.isFinite(realDeltaMs) || realDeltaMs < 0) {
      throw new RangeError('realDeltaMs must be a finite number >= 0.');
    }

    const clampedDelta = Math.min(realDeltaMs, this.maxFrameDeltaMs);
    this.#accumulatorMs += clampedDelta;

    let steps = 0;
    while (this.#accumulatorMs >= this.fixedStepMs) {
      this.#accumulatorMs -= this.fixedStepMs;
      this.#step();
      steps += 1;
    }

    return {
      steps,
      alpha: this.#accumulatorMs / this.fixedStepMs,
      simulationTimeMs: this.simulationTimeMs,
      tickCount: this.tickCount,
    };
  }

  start() {
    if (this.running) return;
    if (typeof requestAnimationFrame !== 'function') {
      throw new Error('requestAnimationFrame is unavailable. Use advance() in tests/non-browser runtimes.');
    }

    this.running = true;
    this.#lastFrameTimeMs = null;

    const frame = (frameTimeMs) => {
      if (!this.running) return;

      if (this.#lastFrameTimeMs === null) {
        this.#lastFrameTimeMs = frameTimeMs;
      } else {
        const delta = frameTimeMs - this.#lastFrameTimeMs;
        this.#lastFrameTimeMs = frameTimeMs;
        this.advance(delta);
      }

      this.#rafId = requestAnimationFrame(frame);
    };

    this.#rafId = requestAnimationFrame(frame);
  }

  stop() {
    this.running = false;
    this.#lastFrameTimeMs = null;

    if (this.#rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.#rafId);
    }

    this.#rafId = null;
  }

  reset() {
    this.stop();
    this.simulationTimeMs = 0;
    this.tickCount = 0;
    this.#accumulatorMs = 0;
  }
}

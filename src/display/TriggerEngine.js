export class TriggerEngine {
  constructor() {
    this._driftOffset = 0;
    this._lastDriftTime = null;
    this._singleFired = false;
  }

  resetSingle() {
    this._singleFired = false;
    this._lastDriftTime = null;
  }

  reset() {
    this._driftOffset = 0;
    this._lastDriftTime = null;
    this._singleFired = false;
  }

  get driftOffset() { return this._driftOffset; }

  /**
   * Calcula el frame de trigger para el instante `now`.
   * @returns {{ driftOffset: number, triggerStatus: string, singleCompleted: boolean }}
   */
  update(now, state, divisionsX) {
    if (!state.running) {
      this._lastDriftTime = null;
      return { driftOffset: this._driftOffset, triggerStatus: 'stop', singleCompleted: false };
    }

    if (state.scanMode) {
      const dt = this._lastDriftTime == null ? 0 : now - this._lastDriftTime;
      this._lastDriftTime = now;
      // offset en divisiones; avanza linealmente con el tiempo
      this._driftOffset -= dt / state.timePerDiv;
      return { driftOffset: this._driftOffset, triggerStatus: 'auto', singleCompleted: false };
    }

    const srcSignal = state.trigger.source === 'CH2' ? state.signal2 : state.signal1;
    const tTrig = this._findTriggerTime(srcSignal, state.trigger.level, state.timePerDiv, divisionsX, state.trigger.slope);

    if (state.trigger.mode === 'Auto') {
      if (tTrig !== null) {
        this._driftOffset = -tTrig / state.timePerDiv;
        this._lastDriftTime = now;
        return { driftOffset: this._driftOffset, triggerStatus: 'triggered', singleCompleted: false };
      }
      const dt = this._lastDriftTime == null ? 0 : now - this._lastDriftTime;
      this._lastDriftTime = now;
      this._driftOffset += state.driftSpeed * dt + (Math.random() - 0.5) * 0.3 * dt;
      return { driftOffset: this._driftOffset, triggerStatus: 'auto', singleCompleted: false };
    }

    if (state.trigger.mode === 'Normal') {
      if (tTrig !== null) {
        this._driftOffset = -tTrig / state.timePerDiv;
        this._lastDriftTime = now;
        return { driftOffset: this._driftOffset, triggerStatus: 'triggered', singleCompleted: false };
      }
      this._lastDriftTime = null;
      return { driftOffset: this._driftOffset, triggerStatus: 'ready', singleCompleted: false };
    }

    if (state.trigger.mode === 'Único') {
      if (this._singleFired) {
        this._lastDriftTime = null;
        return { driftOffset: this._driftOffset, triggerStatus: 'stop', singleCompleted: false };
      }
      if (tTrig !== null) {
        this._driftOffset = -tTrig / state.timePerDiv;
        this._singleFired = true;
        return { driftOffset: this._driftOffset, triggerStatus: 'triggered', singleCompleted: true };
      }
      this._lastDriftTime = null;
      return { driftOffset: this._driftOffset, triggerStatus: 'armed', singleCompleted: false };
    }

    return { driftOffset: this._driftOffset, triggerStatus: 'auto', singleCompleted: false };
  }

  _findTriggerTime(signal, level, timePerDiv, divisionsX, slope) {
    if (!signal) return null;
    const [lo, hi] = signal.amplitudeRange;
    if (level < lo || level > hi) return null;
    const visibleSpan = divisionsX * timePerDiv;
    const samples = 256;
    const dt = visibleSpan / samples;
    let prev = signal.sample(-visibleSpan / 2);
    for (let i = 1; i <= samples; i++) {
      const t = -visibleSpan / 2 + i * dt;
      const cur = signal.sample(t);
      const hit = slope === 'Bajada'
        ? (prev > level && cur <= level)
        : (prev < level && cur >= level);
      if (hit) {
        const frac = Math.abs((level - prev) / (cur - prev || 1));
        return t - dt + frac * dt;
      }
      prev = cur;
    }
    return null;
  }
}

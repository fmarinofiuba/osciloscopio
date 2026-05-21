import { SineSignal } from './SineSignal.js'
import { SquareSignal } from './SquareSignal.js'

const DEFAULT_CH1 = { type: 'sine', amplitude: 3, frequency: 1000, phase: 0, offset: 0 }
const DEFAULT_CH2 = { type: 'sine', amplitude: 1, frequency: 500,  phase: 0, offset: 0 }

function createSignal(params) {
  const { type, amplitude, frequency, phase, offset, dutyCycle } = params
  if (type === 'square') {
    return new SquareSignal({ amplitude, frequency, phase, offset, dutyCycle: dutyCycle ?? 0.5 })
  }
  return new SineSignal({ amplitude, frequency, phase, offset })
}

function snapshotChannel(channel) {
  return {
    type: channel.params.type,
    amplitude: channel.params.amplitude,
    frequency: channel.params.frequency,
    phase: channel.params.phase,
    offset: channel.params.offset,
    dutyCycle: channel.params.dutyCycle,
  }
}

export class InputSignalManager {
  constructor({ ch1 = DEFAULT_CH1, ch2 = DEFAULT_CH2 } = {}) {
    this._mode = 'free'
    this._renderer = null
    this._listeners = new Set()

    this._ch1 = { params: { ...ch1 }, signal: createSignal(ch1) }
    this._ch2 = { params: { ...ch2 }, signal: createSignal(ch2) }

    this._userSnapshot = null
  }

  // ── Public read API ──────────────────────────────────────────────────────

  get mode() { return this._mode }
  get ch1() { return { ...this._ch1.params } }
  get ch2() { return { ...this._ch2.params } }

  // ── Renderer wiring ──────────────────────────────────────────────────────

  attachRenderer(renderer) {
    this._renderer = renderer
    if (renderer) {
      renderer.signal = this._ch1.signal
    }
  }

  // ── Subscription API ─────────────────────────────────────────────────────

  subscribe(listener) {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  _emit() {
    for (const l of this._listeners) l()
  }

  // ── User-facing setters (rejected during exercise) ───────────────────────

  setCh1Params(partial) {
    if (this._mode !== 'free') return false
    this._applyParams(this._ch1, partial, /*isCh1*/ true)
    this._emit()
    return true
  }

  setCh2Params(partial) {
    if (this._mode !== 'free') return false
    this._applyParams(this._ch2, partial, /*isCh1*/ false)
    this._emit()
    return true
  }

  _applyParams(channel, partial, isCh1) {
    const prevType = channel.params.type
    const nextParams = { ...channel.params, ...partial }
    channel.params = nextParams

    if (nextParams.type !== prevType) {
      channel.signal = createSignal(nextParams)
      if (isCh1 && this._renderer) {
        this._renderer.signal = channel.signal
      }
      return
    }

    // Same type: mutate live instance so the renderer keeps it without realloc.
    const sig = channel.signal
    if (typeof nextParams.amplitude === 'number') sig.amplitude = nextParams.amplitude
    if (typeof nextParams.frequency === 'number') sig.frequency = nextParams.frequency
    if (typeof nextParams.phase     === 'number') sig.phase     = nextParams.phase
    if (typeof nextParams.offset    === 'number') sig.offset    = nextParams.offset
    if (typeof nextParams.dutyCycle === 'number' && 'dutyCycle' in sig) {
      sig.dutyCycle = nextParams.dutyCycle
    }

    if (isCh1 && this._renderer) {
      this._renderer.invalidateDynamic?.()
    }
  }

  // ── Exercise ownership ───────────────────────────────────────────────────

  acquireForExercise({ ch1, ch2 } = {}) {
    if (this._mode === 'exercise') return
    this._userSnapshot = {
      ch1: snapshotChannel(this._ch1),
      ch2: snapshotChannel(this._ch2),
    }
    this._mode = 'exercise'
    if (ch1) this._forceApply(this._ch1, ch1, /*isCh1*/ true)
    if (ch2) this._forceApply(this._ch2, ch2, /*isCh1*/ false)
    this._emit()
  }

  releaseFromExercise() {
    if (this._mode !== 'exercise') return
    if (this._userSnapshot) {
      this._forceApply(this._ch1, this._userSnapshot.ch1, /*isCh1*/ true)
      this._forceApply(this._ch2, this._userSnapshot.ch2, /*isCh1*/ false)
    }
    this._userSnapshot = null
    this._mode = 'free'
    this._emit()
  }

  _forceApply(channel, params, isCh1) {
    channel.params = { ...channel.params, ...params }
    channel.signal = createSignal(channel.params)
    if (isCh1 && this._renderer) {
      this._renderer.signal = channel.signal
    }
  }
}

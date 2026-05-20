const ROTATION_RANGE = Math.PI * 1.5  // 270° total sweep

export class ControlsState {
  constructor(controlsConfig) {
    this._state = new Map()
    this._configs = new Map()

    for (const ctrl of controlsConfig.controls) {
      this._configs.set(ctrl.control, ctrl)

      if (ctrl.type === 'knob') {
        if (ctrl.stepValues) {
          this._state.set(ctrl.control, { step: ctrl.defaultIndex ?? 0 })
        } else {
          this._state.set(ctrl.control, { value: ctrl.defaultValue ?? 0 })
        }
      } else if (ctrl.type === 'button') {
        this._state.set(ctrl.control, { pressed: false })
      }
    }
  }

  getConfig(id) {
    return this._configs.get(id)
  }

  // ── Knobs with named step values ──────────────────────────────────────────

  getKnobStep(id) {
    return this._state.get(id)?.step ?? 0
  }

  setKnobStep(id, step) {
    const cfg = this._configs.get(id)
    const s = this._state.get(id)
    if (!cfg || !s) return
    const max = (cfg.stepValues?.length ?? cfg.stepCount ?? 1) - 1
    s.step = Math.max(0, Math.min(max, step))
  }

  getKnobValue(id) {
    const cfg = this._configs.get(id)
    const s = this._state.get(id)
    if (!cfg || !s) return ''
    if (cfg.stepValues) return cfg.stepValues[s.step] ?? ''
    // Numeric knob: interpolate
    const norm = s.step / Math.max(1, (cfg.stepCount ?? 2) - 1)
    const val = cfg.minValue + norm * (cfg.maxValue - cfg.minValue)
    return val.toFixed(1)
  }

  // ── Knob mesh rotation angle (in radians around rotationAxis) ────────────

  getKnobRotation(id) {
    const cfg = this._configs.get(id)
    const s = this._state.get(id)
    if (!cfg || !s) return 0
    const max = cfg.stepValues
      ? cfg.stepValues.length - 1
      : (cfg.stepCount ?? 2) - 1
    const norm = max > 0 ? s.step / max : 0
    return -ROTATION_RANGE / 2 + norm * ROTATION_RANGE
  }

  // ── Buttons ───────────────────────────────────────────────────────────────

  getButtonState(id) {
    return this._state.get(id)?.pressed ?? false
  }

  toggleButton(id) {
    const s = this._state.get(id)
    if (!s) return false
    s.pressed = !s.pressed
    return s.pressed
  }

  pressButton(id) {
    const s = this._state.get(id)
    if (s) s.pressed = true
  }

  releaseButton(id) {
    const s = this._state.get(id)
    if (s) s.pressed = false
  }
}

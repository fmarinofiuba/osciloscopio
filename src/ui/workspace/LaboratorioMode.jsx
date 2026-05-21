import { useSyncExternalStore, useCallback } from 'react'
import { useAppState } from '../../state/AppContext.jsx'

const SIGNAL_TYPES = [
  { key: 'sine',   label: 'Senoidal' },
  { key: 'square', label: 'Cuadrada' },
]

const PARAM_RANGES = {
  amplitude: { min: 0,    max: 10,    step: 0.1,   unit: 'V'  },
  frequency: { min: 1,    max: 10000, step: 1,     unit: 'Hz' },
  phaseDeg:  { min: -180, max: 180,   step: 1,     unit: '°'  },
  offset:    { min: -5,   max: 5,     step: 0.1,   unit: 'V'  },
  dutyCycle: { min: 1,    max: 99,    step: 1,     unit: '%'  },
}

function radToDeg(r) { return r * 180 / Math.PI }
function degToRad(d) { return d * Math.PI / 180 }

function ParamSlider({ label, value, onChange, range, disabled }) {
  const { min, max, step, unit } = range
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] text-text-muted">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (Number.isFinite(v)) onChange(v)
            }}
            disabled={disabled}
            step={step}
            min={min}
            max={max}
            className="w-16 px-1.5 py-0.5 text-[11px] font-mono text-right
                       bg-white/5 text-text-primary border border-panel-border rounded
                       focus:outline-none focus:border-accent/50 disabled:opacity-40"
          />
          <span className="text-[10px] text-text-muted/70 w-6">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full accent-accent disabled:opacity-40"
      />
    </div>
  )
}

function ChannelSection({ name, params, onChange, disabled }) {
  const type = params.type ?? 'sine'

  return (
    <div className="rounded-lg border border-panel-border bg-white/3 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-text-primary text-xs font-semibold uppercase tracking-wider">{name}</h3>
        <div className="flex gap-1">
          {SIGNAL_TYPES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onChange({ type: key })}
              disabled={disabled}
              className={`
                text-[10px] px-2 py-0.5 rounded border transition-colors
                ${type === key
                  ? 'bg-accent/15 text-accent border-accent/40'
                  : 'bg-white/3 text-text-muted border-panel-border hover:bg-white/8'}
                disabled:opacity-40
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ParamSlider
        label="Amplitud"
        value={params.amplitude}
        onChange={(v) => onChange({ amplitude: v })}
        range={PARAM_RANGES.amplitude}
        disabled={disabled}
      />
      <ParamSlider
        label="Frecuencia"
        value={params.frequency}
        onChange={(v) => onChange({ frequency: v })}
        range={PARAM_RANGES.frequency}
        disabled={disabled}
      />
      <ParamSlider
        label="Fase"
        value={radToDeg(params.phase ?? 0)}
        onChange={(deg) => onChange({ phase: degToRad(deg) })}
        range={PARAM_RANGES.phaseDeg}
        disabled={disabled}
      />
      <ParamSlider
        label="Offset"
        value={params.offset}
        onChange={(v) => onChange({ offset: v })}
        range={PARAM_RANGES.offset}
        disabled={disabled}
      />
      {type === 'square' && (
        <ParamSlider
          label="Duty cycle"
          value={(params.dutyCycle ?? 0.5) * 100}
          onChange={(pct) => onChange({ dutyCycle: pct / 100 })}
          range={PARAM_RANGES.dutyCycle}
          disabled={disabled}
        />
      )}
    </div>
  )
}

function useSignalManager() {
  const { signalManagerRef } = useAppState()
  const manager = signalManagerRef.current

  const subscribe = useCallback((cb) => {
    return manager ? manager.subscribe(cb) : () => {}
  }, [manager])
  const getSnapshot = useCallback(() => manager?.mode ?? 'free', [manager])

  // Trigger re-render on any manager change
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return manager
}

export default function LaboratorioMode() {
  const { state, dispatch } = useAppState()
  const manager = useSignalManager()

  if (state.activeExercise) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-3 border-b border-panel-border">
          <h2 className="text-text-primary text-sm font-semibold">Laboratorio</h2>
          <p className="text-text-muted text-xs mt-0.5">Entradas controladas por un ejercicio</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <span className="text-3xl opacity-30">✦</span>
          <p className="text-text-primary text-sm font-medium">Hay un ejercicio en curso.</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-[260px]">
            Para modificar las señales de entrada, debe finalizar o abandonar el ejercicio actual.
          </p>
          <button
            onClick={() => dispatch({ type: 'SET_WORKSPACE_MODE', payload: 'ejercicios' })}
            className="
              mt-2 px-4 py-2 rounded-lg text-xs font-medium
              bg-accent hover:bg-accent-hover text-white
              transition-all duration-150 active:scale-95
            "
          >
            Volver al ejercicio
          </button>
        </div>
      </div>
    )
  }

  if (!manager) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted text-xs">Inicializando señales…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-3 border-b border-panel-border">
        <h2 className="text-text-primary text-sm font-semibold">Laboratorio</h2>
        <p className="text-text-muted text-xs mt-0.5">Configurá las entradas del osciloscopio</p>
      </div>
      <div className="flex-1 overflow-y-auto panel-scroll px-3 py-3 space-y-3">
        <ChannelSection
          name="Canal 1"
          params={manager.ch1}
          onChange={(partial) => manager.setCh1Params(partial)}
        />
        <ChannelSection
          name="Canal 2"
          params={manager.ch2}
          onChange={(partial) => manager.setCh2Params(partial)}
        />
        <p className="text-[10px] text-text-muted/60 italic px-1">
          Nota: Canal 2 se configura aquí pero todavía no se muestra en pantalla.
        </p>
      </div>
    </div>
  )
}

import { useAppState } from '../../state/AppContext.jsx'
import controlsConfig from '../../data/controls.json'

const TYPE_LABELS = { knob: 'Perilla', button: 'Botón' }

export default function ControlExplanation() {
  const { state, dispatch } = useAppState()
  const ctrl = controlsConfig.controls.find((c) => c.control === state.selectedControl)

  if (!ctrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
        <span className="text-3xl opacity-30">💡</span>
        <p className="text-text-muted text-sm font-medium">Modo Explicar activo</p>
        <p className="text-text-muted/60 text-xs leading-relaxed">
          Hacé click sobre cualquier control del osciloscopio para ver su descripción y funcionamiento.
        </p>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_EXPLICAR' })}
          className="mt-2 text-xs text-text-muted hover:text-red-400 transition-colors"
        >
          Desactivar modo Explicar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-3 border-b border-panel-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] bg-amber-400/15 text-amber-300 border border-amber-400/20 rounded px-2 py-0.5 font-mono uppercase tracking-wider">
            {TYPE_LABELS[ctrl.type] ?? ctrl.type}
          </span>
          {ctrl.toggle && (
            <span className="text-[10px] bg-blue-400/15 text-blue-300 border border-blue-400/20 rounded px-2 py-0.5">
              Toggle
            </span>
          )}
          <button
            onClick={() => dispatch({ type: 'SELECT_CONTROL', payload: null })}
            className="ml-auto text-text-muted hover:text-text-primary text-xs transition-colors"
          >
            ✕
          </button>
        </div>
        <h2 className="text-text-primary text-sm font-semibold font-mono">
          {ctrl.tooltip.title}
        </h2>
        <p className="text-text-muted/60 text-[10px] mt-0.5 font-mono">{ctrl.mesh}</p>
      </div>

      <div className="flex-1 overflow-y-auto panel-scroll px-4 py-4 space-y-4">
        <p className="text-text-muted text-sm leading-relaxed">
          {ctrl.tooltip.description}
        </p>

        {/* Step values for large knobs */}
        {ctrl.stepValues && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Valores disponibles</p>
            <div className="flex flex-wrap gap-1">
              {ctrl.stepValues.map((v, i) => (
                <span
                  key={i}
                  className={`text-[10px] font-mono rounded px-2 py-0.5 border
                    ${i === ctrl.defaultIndex
                      ? 'bg-accent/20 text-accent border-accent/30'
                      : 'bg-white/5 text-text-muted border-panel-border'
                    }`}
                >
                  {v}
                </span>
              ))}
            </div>
            {ctrl.defaultIndex != null && (
              <p className="text-[10px] text-text-muted/60">
                Valor inicial: <span className="text-accent font-mono">{ctrl.stepValues[ctrl.defaultIndex]}</span>
              </p>
            )}
          </div>
        )}

        {/* Numeric range for small knobs */}
        {ctrl.stepCount != null && (
          <div className="bg-white/4 border border-panel-border rounded-lg px-3 py-2 space-y-1">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Rango</p>
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-text-muted">Mín: <span className="text-text-primary">{ctrl.minValue}</span></span>
              <span className="text-text-muted">Máx: <span className="text-text-primary">{ctrl.maxValue}</span></span>
              <span className="text-text-muted">Default: <span className="text-accent">{ctrl.defaultValue}</span></span>
            </div>
            <p className="text-[10px] text-text-muted/60">{ctrl.stepCount} pasos</p>
          </div>
        )}
      </div>
    </div>
  )
}

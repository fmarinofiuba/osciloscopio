import controlsConfig from '../../data/controls.json'
import { useAppState } from '../../state/AppContext.jsx'

function CompactExplanation() {
  const { state, dispatch } = useAppState()
  const ctrl = controlsConfig.controls.find((item) => item.control === state.selectedControl)

  if (!ctrl) return null

  const range = ctrl.stepValues
    ? `${ctrl.stepValues[0]} a ${ctrl.stepValues[ctrl.stepValues.length - 1]}`
    : ctrl.stepCount != null
      ? `${ctrl.minValue} a ${ctrl.maxValue}`
      : null

  return (
    <section
      data-xr-ui
      aria-label={`Explicacion de ${ctrl.tooltip.title}`}
      className="compact-sheet pointer-events-auto fixed inset-x-0 bottom-0 z-30 mx-auto flex max-h-[40dvh] w-full max-w-[680px] flex-col overflow-hidden border-t border-panel-border bg-[rgba(12,12,28,0.96)] shadow-2xl shadow-black/50"
    >
      <div className="flex items-start gap-3 border-b border-panel-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase text-accent">
            {ctrl.type === 'knob' ? 'Perilla' : 'Boton'}
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-text-primary">{ctrl.tooltip.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SELECT_CONTROL', payload: null })}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-xl text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
          aria-label="Cerrar explicacion"
        >
          &times;
        </button>
      </div>
      <div className="panel-scroll overflow-y-auto px-4 py-3">
        <p className="text-sm leading-relaxed text-text-muted">{ctrl.shortDescription ?? ctrl.tooltip.description}</p>
        {range && (
          <p className="mt-3 text-xs text-text-muted">
            Rango: <span className="font-mono text-text-primary">{range}</span>
          </p>
        )}
      </div>
    </section>
  )
}

function ModeSwitcher() {
  const { state, dispatch } = useAppState()

  function setMode(mode) {
    dispatch({ type: 'SET_INTERACTION_MODE', payload: mode })
    if (mode === 'interact') dispatch({ type: 'SELECT_CONTROL', payload: null })
  }

  return (
    <div
      data-xr-ui
      className="pointer-events-auto flex h-12 items-center rounded-md border border-panel-border bg-[rgba(8,8,20,0.94)] p-1 shadow-xl shadow-black/30"
      role="group"
      aria-label="Modo de interaccion"
    >
      {[
        ['interact', 'Usar'],
        ['explicar', 'Explicar'],
      ].map(([mode, label]) => (
        <button
          key={mode}
          type="button"
          onClick={() => setMode(mode)}
          className={`h-10 min-w-[92px] rounded px-4 text-sm font-medium transition-colors ${
            state.interactionMode === mode
              ? 'bg-accent text-white'
              : 'text-text-muted hover:bg-white/10 hover:text-text-primary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function CompactExperienceUI({ arState, liveValue, onStartAR, onResetPlacement }) {
  const isPlacing = arState.presenting && arState.placement !== 'placed'
  const surfaceReady = arState.placement === 'ready'

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-3 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="min-w-0">
          {isPlacing && (
            <div
              data-xr-ui
              className={`rounded-md border px-3 py-2 text-xs text-text-primary shadow-lg ${
                surfaceReady
                  ? 'border-emerald-300/40 bg-[rgba(5,35,28,0.92)]'
                  : 'border-white/15 bg-[rgba(8,8,20,0.88)]'
              }`}
            >
              {surfaceReady
                ? 'Tocá el marcador para colocar el osciloscopio'
                : 'Mové el dispositivo hasta detectar una superficie'}
            </div>
          )}
          {arState.error && (
            <div className="max-w-[min(78vw,420px)] rounded-md border border-red-400/30 bg-[rgba(40,8,12,0.94)] px-3 py-2 text-xs text-red-100 shadow-lg">
              {arState.error}
            </div>
          )}
        </div>

        {!arState.presenting && arState.supported && (
          <button
            data-xr-ui
            type="button"
            onClick={onStartAR}
            disabled={arState.starting}
            className="pointer-events-auto h-12 flex-shrink-0 rounded-md border border-accent/50 bg-accent px-4 text-sm font-semibold text-white shadow-xl shadow-black/30 transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {arState.starting ? 'Iniciando...' : 'Ver en AR'}
          </button>
        )}
      </div>

      {liveValue && (
        <div className="pointer-events-none fixed left-1/2 top-[max(72px,calc(env(safe-area-inset-top)+64px))] z-20 -translate-x-1/2 rounded-md border border-accent/35 bg-[rgba(8,8,20,0.92)] px-4 py-2 font-mono text-sm text-white shadow-lg">
          {liveValue.title}: <span className="text-accent-hover">{liveValue.value}</span>
        </div>
      )}

      <div className={`pointer-events-none fixed inset-x-0 z-20 flex items-end justify-center gap-2 px-3 ${
        arState.presenting ? 'bottom-[max(12px,env(safe-area-inset-bottom))]' : 'bottom-3'
      }`}>
        {!isPlacing && <ModeSwitcher />}
        {arState.presenting && arState.placement === 'placed' && (
          <button
            data-xr-ui
            type="button"
            onClick={onResetPlacement}
            className="pointer-events-auto h-12 rounded-md border border-panel-border bg-[rgba(8,8,20,0.94)] px-4 text-sm font-medium text-text-primary shadow-xl shadow-black/30 transition-colors hover:bg-white/10"
          >
            Reubicar
          </button>
        )}
      </div>

      <CompactExplanation />
    </>
  )
}

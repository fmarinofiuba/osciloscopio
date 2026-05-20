import { useAppState } from '../../state/AppContext.jsx'

const CAMERA_PRESETS = [
  { key: 'frontal',  label: 'Frontal'  },
  { key: 'diagonal', label: 'Diagonal' },
  { key: 'display',  label: 'Display'  },
  { key: 'general',  label: 'General'  },
]

const btnBase =
  'pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ' +
  'text-text-muted border border-panel-border transition-all duration-150 ' +
  'hover:text-text-primary hover:bg-btn-ghost-hover hover:border-white/20 active:scale-95'

const divider = 'w-px h-5 bg-white/10 mx-1'

export default function BottomToolbar() {
  const { state, dispatch, sceneRef } = useAppState()
  const isExplicar = state.interactionMode === 'explicar'

  function goToView(key) {
    dispatch({ type: 'SET_CAMERA_PRESET', payload: key })
    sceneRef.current?.transitionToView(key)
  }

  function resetCamera() {
    dispatch({ type: 'SET_CAMERA_PRESET', payload: 'frontal' })
    sceneRef.current?.transitionToView('frontal')
  }

  function toggleExplicar() {
    dispatch({ type: 'TOGGLE_EXPLICAR' })
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  return (
    <div className="glass-toolbar pointer-events-none flex-shrink-0">
      <div className="pointer-events-auto flex items-center gap-1 px-4 py-2 overflow-x-auto">

        {/* Camera presets */}
        <span className="text-[10px] font-semibold text-text-muted/60 uppercase tracking-wider mr-1 whitespace-nowrap">
          Vistas
        </span>
        {CAMERA_PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => goToView(key)}
            className={btnBase + (state.cameraPreset === key ? ' text-accent border-accent/40 bg-accent/10' : '')}
          >
            {label}
          </button>
        ))}
        <button onClick={resetCamera} className={btnBase} title="Reset cámara">
          ↺ Reset
        </button>

        <div className={divider} />

        {/* Explicar toggle */}
        <button
          onClick={toggleExplicar}
          className={
            btnBase +
            (isExplicar
              ? ' text-amber-300 border-amber-400/50 bg-amber-400/10 hover:bg-amber-400/20'
              : '')
          }
        >
          <span className={isExplicar ? 'text-amber-300' : ''}>💡</span>
          Explicar
          {isExplicar && (
            <span className="ml-1 text-[10px] bg-amber-400/20 text-amber-300 px-1 rounded">
              ON
            </span>
          )}
        </button>

        <div className={divider} />

        {/* Quick actions */}
        <button
          onClick={() => dispatch({ type: 'SET_INTERACTION_MODE', payload: 'interact' })}
          className={btnBase}
          title="Reset osciloscopio"
        >
          ⟳ Reset
        </button>
        <button onClick={toggleFullscreen} className={btnBase} title="Pantalla completa">
          ⛶ Full
        </button>

      </div>
    </div>
  )
}

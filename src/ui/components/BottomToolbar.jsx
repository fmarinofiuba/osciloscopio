import { useAppState } from '../../state/AppContext.jsx'

const CAMERA_PRESETS = [
  { key: 'frontal',  label: 'Frontal'  },  
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

  function goToView(key) {
    dispatch({ type: 'SET_CAMERA_PRESET', payload: key })
    sceneRef.current?.transitionToView(key)
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

        <div className={divider} />

        {/* Quick actions */}
        <button onClick={toggleFullscreen} className={btnBase} title="Pantalla completa">
          ⛶ Full
        </button>

      </div>
    </div>
  )
}

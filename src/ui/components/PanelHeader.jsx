import { useAppState } from '../../state/AppContext.jsx'

const MODES = [
  { key: 'explorar',       label: 'Explorar',      icon: '◎' },
  { key: 'ejercicios',     label: 'Ejercicios',    icon: '✦' },
  { key: 'manual',         label: 'Manual',        icon: '📖' },
  { key: 'configuracion',  label: 'Config',        icon: '⚙' },
]

export default function PanelHeader() {
  const { state, dispatch } = useAppState()

  function selectMode(key) {
    dispatch({ type: 'SET_WORKSPACE_MODE', payload: key })
  }

  function collapse() {
    dispatch({ type: 'COLLAPSE_PANEL' })
  }

  return (
    <div className="flex-shrink-0 border-b border-panel-border">
      {/* Mode navigation */}
      <div className="flex items-center px-2 pt-2">
        {MODES.map(({ key, label, icon }) => {
          const isActive = state.workspaceMode === key
          return (
            <button
              key={key}
              onClick={() => selectMode(key)}
              className={`
                flex items-center gap-1 px-3 py-2 rounded-t-lg text-xs font-medium
                transition-all duration-150 whitespace-nowrap
                ${isActive
                  ? 'text-text-primary bg-white/8 border-b-2 border-accent'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }
              `}
            >
              <span className="text-sm">{icon}</span>
              {label}
            </button>
          )
        })}

        <div className="flex-1" />

        {/* Collapse button */}
        <button
          onClick={collapse}
          className="
            p-1.5 rounded-md text-text-muted hover:text-text-primary
            hover:bg-white/10 transition-all duration-150 text-sm
          "
          title="Colapsar panel"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

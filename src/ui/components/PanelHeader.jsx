import { useAppState } from '../../state/AppContext.jsx'

const MODES = [
  { key: 'ejercicios', label: 'Ejercicios', icon: '*' },
  { key: 'explicar', label: 'Explicar', icon: '?' },
  { key: 'manual', label: 'Manual', icon: 'M' },
  { key: 'configuracion', label: 'Config', icon: 'C', hidden: true },
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
      <div className="flex items-center px-2 pt-2">
        {MODES.filter((mode) => !mode.hidden).map(({ key, label, icon }) => {
          const isActive = state.workspaceMode === key
          return (
            <button
              key={key}
              onClick={() => selectMode(key)}
              className={`
                flex items-center gap-1 px-2.5 py-2 rounded-t-lg text-[11px] font-medium
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

        <button
          onClick={collapse}
          className="
            p-1.5 rounded-md text-text-muted hover:text-text-primary
            hover:bg-white/10 transition-all duration-150 text-sm
          "
          title="Colapsar panel"
        >
          x
        </button>
      </div>
    </div>
  )
}

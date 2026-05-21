import { useAppState } from '../../state/AppContext.jsx'

export default function CompactLauncher() {
  const { dispatch } = useAppState()

  function expand() {
    dispatch({ type: 'SET_WORKSPACE_MODE', payload: 'laboratorio' })
  }

  return (
    <div className="pointer-events-auto absolute top-4 right-4 animate-fade-in">
      <button
        onClick={expand}
        className="
          flex items-center gap-2 px-4 py-2.5
          glass-panel rounded-xl
          text-text-primary text-sm font-medium
          shadow-lg shadow-black/40
          hover:bg-white/10 hover:border-white/20
          transition-all duration-200 active:scale-95
          border border-panel-border
        "
      >
        <span className="text-accent text-base">◎</span>
        <span>Menú</span>
        <span className="text-text-muted text-xs">▸</span>
      </button>
    </div>
  )
}

import { useAppState } from '../../state/AppContext.jsx'
import EjerciciosMode from '../workspace/EjerciciosMode.jsx'
import ManualMode from '../workspace/ManualMode.jsx'
import ConfiguracionMode from '../workspace/ConfiguracionMode.jsx'
import ControlExplanation from '../explicar/ControlExplanation.jsx'

export default function PanelContent() {
  const { state } = useAppState()

  // Explicar mode overrides content when a control is focused (or no control yet)
  if (state.interactionMode === 'explicar') {
    return (
      <div className="flex-1 min-h-0 overflow-hidden">
        <ControlExplanation />
      </div>
    )
  }

  switch (state.workspaceMode) {
    case 'ejercicios':
      return (
        <div className="flex-1 min-h-0 overflow-hidden">
          <EjerciciosMode />
        </div>
      )
    case 'manual':
      return (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ManualMode />
        </div>
      )
    case 'configuracion':
      return (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ConfiguracionMode />
        </div>
      )
    default:
      return (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <p className="text-text-muted text-xs text-center px-6">
            Seleccioná un modo para comenzar
          </p>
        </div>
      )
  }
}

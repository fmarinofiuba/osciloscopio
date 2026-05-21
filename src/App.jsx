import { useRef, useEffect, useState } from 'react'
import { AppProvider, useAppState } from './state/AppContext.jsx'
import { useThreeScene } from './scene/useThreeScene.js'
import WorkspacePanel from './ui/components/WorkspacePanel.jsx'
import BottomToolbar from './ui/components/BottomToolbar.jsx'
import Tooltip3D from './ui/components/Tooltip3D.jsx'
import { InputSignalManager } from './signals/InputSignalManager.js'
import { ExerciseManager } from './exercises/ExerciseManager.js'

const TOOLTIP_HIDDEN = { visible: false, x: 0, y: 0, title: '', description: '', liveValue: null }

function AppInner() {
  const canvasRef = useRef(null)
  const sceneRef = useThreeScene(canvasRef)
  const {
    state,
    dispatch,
    sceneRef: ctxSceneRef,
    signalManagerRef,
    exerciseManagerRef,
  } = useAppState()
  const [tooltip, setTooltip] = useState(TOOLTIP_HIDDEN)
  const interactionModeRef = useRef(state.interactionMode)
  const panelStateInitialized = useRef(false)

  // Sync sceneRef into context so BottomToolbar can call camera methods
  useEffect(() => {
    ctxSceneRef.current = sceneRef.current
  })

  // Notify camera when panel expands/collapses — skip initial mount
  useEffect(() => {
    if (!panelStateInitialized.current) {
      panelStateInitialized.current = true
      return
    }
    sceneRef.current?.reframeForUI(state.panelState === 'expanded')
  }, [state.panelState])

  // Sync interactionMode → scene and ref
  useEffect(() => {
    interactionModeRef.current = state.interactionMode
    sceneRef.current?.setInteractionMode(state.interactionMode)
  }, [state.interactionMode])

  // Instantiate managers once (signal manager survives across renders)
  if (!signalManagerRef.current) {
    signalManagerRef.current = new InputSignalManager()
  }
  if (!exerciseManagerRef.current) {
    exerciseManagerRef.current = new ExerciseManager(signalManagerRef.current, dispatch)
  }

  // Wire scene callbacks + signal manager to renderer once the scene is ready
  useEffect(() => {
    let id
    function tryWire() {
      const scene = sceneRef.current
      const renderer = scene?.getDisplayRenderer?.()
      if (!scene || !renderer) { id = setTimeout(tryWire, 150); return }

      signalManagerRef.current.attachRenderer(renderer)

      scene.setCallbacks({
        onHover: (x, y, ctrl) => {
          const hasLiveValue = ctrl._liveValue != null
          // Outside Explicar, only show the floating tooltip while a knob drag
          // is producing a live value. Hover-only tooltips belong to Explicar.
          if (!hasLiveValue && interactionModeRef.current !== 'explicar') return
          setTooltip({
            visible: true,
            x, y,
            title: ctrl.tooltip.title,
            description: ctrl.tooltip.description,
            liveValue: ctrl._liveValue ?? null,
          })
        },
        onHoverEnd: () => setTooltip(TOOLTIP_HIDDEN),
        onControlClick: (ctrl) => {
          dispatch({ type: 'SELECT_CONTROL', payload: ctrl.control })
          if (interactionModeRef.current === 'explicar') {
            dispatch({ type: 'EXPAND_PANEL' })
          }
        },
      })
    }
    id = setTimeout(tryWire, 150)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#cccccc]">
      {/* Three.js canvas — fills entire screen */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* React UI overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col">
        <div className="flex flex-1 min-h-0">
          <div className="flex-1" />
          <WorkspacePanel />
        </div>
        <BottomToolbar />
      </div>

      {/* Floating tooltip: shows knob live value during drag (any mode) and
          informational tooltips while the Explicar section is active. */}
      <Tooltip3D tooltip={tooltip} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}

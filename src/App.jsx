import { useRef, useEffect, useState } from 'react'
import { AppProvider, useAppState } from './state/AppContext.jsx'
import { useThreeScene } from './scene/useThreeScene.js'
import WorkspacePanel from './ui/components/WorkspacePanel.jsx'
import BottomToolbar from './ui/components/BottomToolbar.jsx'
import Tooltip3D from './ui/components/Tooltip3D.jsx'

const TOOLTIP_HIDDEN = { visible: false, x: 0, y: 0, title: '', description: '', liveValue: null }

function AppInner() {
  const canvasRef = useRef(null)
  const sceneRef = useThreeScene(canvasRef)
  const { state, dispatch, sceneRef: ctxSceneRef } = useAppState()
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

  // Wire scene callbacks once (with retry since scene loads async)
  useEffect(() => {
    let id
    function tryWire() {
      const scene = sceneRef.current
      if (!scene) { id = setTimeout(tryWire, 150); return }
      scene.setCallbacks({
        onHover: (x, y, ctrl) => setTooltip({
          visible: true,
          x, y,
          title: ctrl.tooltip.title,
          description: ctrl.tooltip.description,
          liveValue: ctrl._liveValue ?? null,
        }),
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

  // Update tooltip live value during knob drag (re-wire when tooltip changes)
  // The onHover callback already handles live value updates from InteractionSystem

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

      {/* 3D Tooltip — solo visible cuando el modo Explicar está activo */}
      {state.interactionMode === 'explicar' && <Tooltip3D tooltip={tooltip} />}
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

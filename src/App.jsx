import { useRef, useEffect, useState } from 'react'
import { AppProvider, useAppState } from './state/AppContext.jsx'
import { useThreeScene } from './scene/useThreeScene.js'
import WorkspacePanel from './ui/components/WorkspacePanel.jsx'
import BottomToolbar from './ui/components/BottomToolbar.jsx'
import Tooltip3D from './ui/components/Tooltip3D.jsx'
import WelcomePopup from './ui/components/WelcomePopup.jsx'
import ChannelPopup from './ui/workspace/ChannelPopup.jsx'
import CompactExperienceUI from './ui/components/CompactExperienceUI.jsx'
import { InputSignalManager } from './signals/InputSignalManager.js'
import { ExerciseManager } from './exercises/ExerciseManager.js'

function parseTimeValue(s) {
  const m = String(s).match(/^([0-9.]+)(ns|us|ms|s)$/)
  if (!m) return 1e-3
  return parseFloat(m[1]) * { ns: 1e-9, us: 1e-6, ms: 1e-3, s: 1 }[m[2]]
}

function parseVoltsValue(s) {
  const m = String(s).match(/^([0-9.]+)(mV|V)$/)
  if (!m) return 1
  return parseFloat(m[1]) * (m[2] === 'mV' ? 1e-3 : 1)
}

const TOOLTIP_HIDDEN = { visible: false, x: 0, y: 0, title: '', description: '', liveValue: null }
const AR_INITIAL = {
  supported: false,
  starting: false,
  presenting: false,
  placement: 'idle',
  error: null,
}

function useCompactViewport() {
  const query = '(max-width: 760px), (pointer: coarse) and (max-width: 1180px)'
  const [compact, setCompact] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setCompact(media.matches)
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  return compact
}

function AppInner() {
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const sceneRef = useThreeScene(canvasRef)
  const {
    state,
    dispatch,
    sceneRef: ctxSceneRef,
    signalManagerRef,
    exerciseManagerRef,
  } = useAppState()
  const [tooltip, setTooltip] = useState(TOOLTIP_HIDDEN)
  const [channelPopup, setChannelPopup] = useState(null)
  const [arState, setARState] = useState(AR_INITIAL)
  const isCompact = useCompactViewport()
  const interactionModeRef = useRef(state.interactionMode)
  const panelStateInitialized = useRef(false)
  const poweredRef = useRef(true)
  const arPresentingRef = useRef(false)
  const preARStateRef = useRef(null)

  // Sync sceneRef into context so BottomToolbar can call camera methods
  useEffect(() => {
    ctxSceneRef.current = sceneRef.current
  })

  useEffect(() => {
    let cancelled = false
    let timerId

    async function checkSupport() {
      const scene = sceneRef.current
      if (!scene?.isReady?.()) {
        timerId = window.setTimeout(checkSupport, 100)
        return
      }
      const supported = await scene.isARSupported()
      if (!cancelled) {
        setARState((current) => ({
          ...current,
          supported,
          error: !window.isSecureContext ? 'La realidad aumentada requiere abrir la app mediante HTTPS.' : current.error,
        }))
      }
    }

    checkSupport()
    return () => {
      cancelled = true
      window.clearTimeout(timerId)
    }
  }, [])

  useEffect(() => {
    let timerId
    function syncFraming() {
      const scene = sceneRef.current
      if (!scene?.isReady?.()) {
        timerId = window.setTimeout(syncFraming, 100)
        return
      }
      scene.setCompactFraming?.(isCompact)
    }
    syncFraming()
    return () => window.clearTimeout(timerId)
  }, [isCompact])

  useEffect(() => {
    const root = overlayRef.current
    if (!root) return undefined
    const blockSceneSelection = (event) => {
      if (event.target instanceof Element && event.target.closest('[data-xr-ui]')) {
        event.preventDefault()
      }
    }
    root.addEventListener('beforexrselect', blockSceneSelection)
    return () => root.removeEventListener('beforexrselect', blockSceneSelection)
  }, [])

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
    // Track previous normalized values for positional knobs (delta-based)
    const prevVertNorm = { ch1: 0, ch2: 0 }

    function tryWire() {
      const scene = sceneRef.current
      const renderer = scene?.getDisplayRenderer?.()
      if (!scene || !renderer) { id = setTimeout(tryWire, 150); return }

      signalManagerRef.current.attachRenderer(renderer)
      scene.setPowered?.(poweredRef.current)

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
        onProbeConnectorClick: (channel, anchor) => {
          setTooltip(TOOLTIP_HIDDEN)
          setChannelPopup({ channel, anchor })
        },

        onKnobChanged: (ctrl, rawValue) => {
          const r = scene.getDisplayRenderer()
          if (!r) return
          switch (ctrl.control) {
            case 'horizontalScale':
              r.timePerDiv = parseTimeValue(rawValue)
              break
            case 'verticalScaleCh1':
              r.ch1VoltsPerDiv = parseVoltsValue(rawValue)
              break
            case 'verticalScaleCh2':
              r.ch2VoltsPerDiv = parseVoltsValue(rawValue)
              break
            case 'triggerLevel': {
              // rawValue: "-50.0".."+50.0" range -100..+100 → normalize to -1..+1
              const norm = parseFloat(rawValue) / 100
              const halfRange = r.state.ch[1].voltsPerDiv * (r._divisionsY ?? 8) / 2
              r.triggerLevel = norm * halfRange
              break
            }
            case 'horizontalPosition': {
              const norm = parseFloat(rawValue) / 100
              const halfSpan = r.state.timePerDiv * (r._divisionsX ?? 10) / 2
              r.horizontalPosition = norm * halfSpan
              break
            }
            case 'verticalPositionCh1': {
              const norm = parseFloat(rawValue) / 100
              const halfDivs = (r._divisionsY ?? 8) / 2
              const delta = norm * halfDivs - prevVertNorm.ch1 * halfDivs
              prevVertNorm.ch1 = norm
              r.adjustVerticalPosition(1, delta)
              break
            }
            case 'verticalPositionCh2': {
              const norm = parseFloat(rawValue) / 100
              const halfDivs = (r._divisionsY ?? 8) / 2
              const delta = norm * halfDivs - prevVertNorm.ch2 * halfDivs
              prevVertNorm.ch2 = norm
              r.adjustVerticalPosition(2, delta)
              break
            }
          }
        },

        onButtonChanged: (ctrl, pressed) => {
          const r = scene.getDisplayRenderer()
          if (!r) return
          switch (ctrl.control) {
            case 'power':
              poweredRef.current = !poweredRef.current
              scene.setPowered?.(poweredRef.current)
              break
            case 'runStop':
              r.running = pressed
              break
            case 'ch1Menu':
              if (pressed) r.openMenu('ch1'); else r.closeMenu()
              break
            case 'ch2Menu':
              if (pressed) r.openMenu('ch2'); else r.closeMenu()
              break
            case 'triggerMenu':
              if (pressed) r.openMenu('trigger'); else r.closeMenu()
              break
            case 'cursor':
              if (pressed) r.openMenu('cursors'); else r.closeMenu()
              break
            case 'softKey1': r.pressBevelButton(0); break
            case 'softKey2': r.pressBevelButton(1); break
            case 'softKey3': r.pressBevelButton(2); break
            case 'softKey4': r.pressBevelButton(3); break
            case 'softKey5': r.pressBevelButton(4); break
          }
        },

        onARStateChange: (next) => {
          if (arPresentingRef.current && !next.presenting && preARStateRef.current) {
            dispatch({ type: 'SET_INTERACTION_MODE', payload: preARStateRef.current.interactionMode })
            dispatch({ type: 'SELECT_CONTROL', payload: preARStateRef.current.selectedControl })
            preARStateRef.current = null
          }
          arPresentingRef.current = next.presenting
          setARState((current) => ({
            ...current,
            ...next,
            starting: false,
            error: null,
          }))
        },
      })
    }
    id = setTimeout(tryWire, 150)
    return () => clearTimeout(id)
  }, [])

  async function startAR() {
    const scene = sceneRef.current
    if (!scene) return
    preARStateRef.current = {
      interactionMode: state.interactionMode,
      selectedControl: state.selectedControl,
    }
    setARState((current) => ({ ...current, starting: true, error: null }))
    try {
      await scene.startAR(overlayRef.current)
    } catch (error) {
      preARStateRef.current = null
      setARState((current) => ({
        ...current,
        starting: false,
        error: error.message,
      }))
    }
  }

  useEffect(() => {
    const manager = signalManagerRef.current
    if (!manager) return undefined

    const syncConnectors = () => {
      sceneRef.current?.setProbeCableVisible?.(1, manager.ch1Visible)
      sceneRef.current?.setProbeCableVisible?.(2, manager.ch2Visible)
    }

    syncConnectors()
    return manager.subscribe(syncConnectors)
  }, [])

  const compactChrome = isCompact || arState.presenting
  const liveValue = tooltip.visible && tooltip.liveValue != null
    ? { title: tooltip.title, value: tooltip.liveValue }
    : null

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#cccccc]">
      {/* Three.js canvas — fills entire screen */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      <div ref={overlayRef} id="xr-dom-overlay" className="absolute inset-0 pointer-events-none">
        {compactChrome ? (
          <CompactExperienceUI
            arState={arState}
            liveValue={liveValue}
            onStartAR={startAR}
            onResetPlacement={() => sceneRef.current?.resetARPlacement?.()}
          />
        ) : (
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            <div className="flex flex-1 min-h-0">
              <div className="flex-1" />
              <WorkspacePanel />
            </div>
            <BottomToolbar />
          </div>
        )}

        {!compactChrome && arState.supported && (
          <button
            data-xr-ui
            type="button"
            onClick={startAR}
            disabled={arState.starting}
            className="pointer-events-auto absolute left-4 top-4 z-20 h-11 rounded-md border border-accent/50 bg-accent px-4 text-sm font-semibold text-white shadow-xl shadow-black/30 transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {arState.starting ? 'Iniciando...' : 'Ver en AR'}
          </button>
        )}

        {!compactChrome && <Tooltip3D tooltip={tooltip} />}
        {!compactChrome && <WelcomePopup />}
        <ChannelPopup
          channel={channelPopup?.channel}
          anchor={channelPopup?.anchor}
          compact={compactChrome}
          onClose={() => setChannelPopup(null)}
        />
      </div>
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

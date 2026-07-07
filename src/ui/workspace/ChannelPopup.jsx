import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../../state/AppContext.jsx'
import { ChannelSection, useSignalManager } from './LaboratorioMode.jsx'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

const POPUP_WIDTH = 320
const POPUP_GAP = 72
const VIEWPORT_MARGIN = 8
const MENU_GAP = 24

function getInitialPosition(anchor) {
  const width = Math.min(window.innerWidth * 0.25, POPUP_WIDTH)
  const height = Math.min(window.innerHeight * 0.78, 520)
  const menuLeft = window.innerWidth * 0.65
  const rightLimit = Math.min(window.innerWidth - VIEWPORT_MARGIN, menuLeft - MENU_GAP)
  const freeAreaWidth = rightLimit - VIEWPORT_MARGIN

  if (!anchor || freeAreaWidth <= width) {
    return {
      left: Math.max(VIEWPORT_MARGIN, (freeAreaWidth - width) / 2),
      top: Math.max(VIEWPORT_MARGIN, (window.innerHeight - height) / 2),
    }
  }

  const leftCandidate = anchor.x - width - POPUP_GAP
  const rightCandidate = anchor.x + POPUP_GAP
  const fitsLeft = leftCandidate >= VIEWPORT_MARGIN
  const fitsRight = rightCandidate + width <= rightLimit
  let left

  if (fitsLeft) {
    left = leftCandidate
  } else if (fitsRight) {
    left = rightCandidate
  } else {
    left = anchor.x < freeAreaWidth / 2 ? rightCandidate : leftCandidate
  }

  return {
    left: clamp(left, VIEWPORT_MARGIN, rightLimit - width),
    top: clamp(anchor.y - height / 2, VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN),
  }
}

export default function ChannelPopup({ channel, anchor, onClose }) {
  const { state, dispatch } = useAppState()
  const manager = useSignalManager()
  const popupRef = useRef(null)
  const dragRef = useRef(null)
  const [position, setPosition] = useState(null)

  useEffect(() => {
    if (!channel) return
    setPosition(getInitialPosition(anchor))
  }, [channel, anchor])

  if (!channel || !manager) return null

  const isCh1 = channel === 1
  const params = isCh1 ? manager.ch1 : manager.ch2
  const active = isCh1 ? manager.ch1Visible : manager.ch2Visible
  const setVisible = isCh1 ? manager.setCh1Visible.bind(manager) : manager.setCh2Visible.bind(manager)
  const setParams = isCh1 ? manager.setCh1Params.bind(manager) : manager.setCh2Params.bind(manager)

  function startDrag(event) {
    if (event.button !== 0) return
    const popup = popupRef.current
    if (!popup) return

    const rect = popup.getBoundingClientRect()
    const startLeft = position?.left ?? rect.left
    const startTop = position?.top ?? rect.top
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft,
      startTop,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event) {
    const drag = dragRef.current
    const popup = popupRef.current
    if (!drag || !popup || drag.pointerId !== event.pointerId) return

    const rect = popup.getBoundingClientRect()
    const margin = 8
    const maxLeft = window.innerWidth - rect.width - margin
    const maxTop = window.innerHeight - rect.height - margin
    setPosition({
      left: clamp(drag.startLeft + event.clientX - drag.startX, margin, maxLeft),
      top: clamp(drag.startTop + event.clientY - drag.startY, margin, maxTop),
    })
  }

  function endDrag(event) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    try { event.currentTarget.releasePointerCapture(event.pointerId) } catch (_) {}
    dragRef.current = null
  }

  const floatingStyle = position
    ? { width: 'min(25vw, 320px)', left: position.left, top: position.top }
    : { width: 'min(25vw, 320px)', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <div
        ref={popupRef}
        className="
          pointer-events-auto fixed
          glass-panel border border-panel-border rounded-lg shadow-2xl shadow-black/50
          max-h-[78vh] overflow-hidden
        "
        style={floatingStyle}
      >
        <div
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex cursor-move select-none items-center gap-2 px-3 py-2 border-b border-panel-border"
        >
          <div>
            <h2 className="text-text-primary text-sm font-semibold">Canal {channel}</h2>
            <p className="text-text-muted text-[11px]">Entrada CH{channel}</p>
          </div>
          <div className="flex-1" />
          <button
            onClick={onClose}
            onPointerDown={(event) => event.stopPropagation()}
            className="px-2 py-1 rounded-md text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
            title="Cerrar"
          >
            x
          </button>
        </div>

        {state.activeExercise ? (
          <div className="p-4 text-center space-y-3">
            <p className="text-text-primary text-sm font-medium">Hay un ejercicio en curso.</p>
            <p className="text-text-muted text-xs leading-relaxed">
              Para modificar esta entrada, debe finalizar o abandonar el ejercicio actual.
            </p>
            <button
              onClick={() => dispatch({ type: 'SET_WORKSPACE_MODE', payload: 'ejercicios' })}
              className="px-3 py-2 rounded-md text-xs font-medium bg-accent hover:bg-accent-hover text-white"
            >
              Volver al ejercicio
            </button>
          </div>
        ) : (
          <div className="panel-scroll max-h-[68vh] overflow-y-auto p-3">
            <ChannelSection
              name={`Canal ${channel}`}
              params={params}
              active={active}
              canToggle={true}
              onToggle={() => setVisible(!active)}
              onChange={setParams}
            />
          </div>
        )}
      </div>
    </div>
  )
}

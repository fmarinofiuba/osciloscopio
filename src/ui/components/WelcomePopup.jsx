import { useEffect, useState } from 'react'

const STORAGE_KEY = 'oscilloscope.hideWelcomePopup'

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false)
  const [hideNextTime, setHideNextTime] = useState(false)

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== 'true')
    } catch (_) {
      setVisible(true)
    }
  }, [])

  function close() {
    if (hideNextTime) {
      try {
        window.localStorage.setItem(STORAGE_KEY, 'true')
      } catch (_) {}
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-popup-title"
        className="
          pointer-events-auto w-[min(90vw,420px)]
          glass-panel border border-panel-border rounded-lg shadow-2xl shadow-black/50
          animate-fade-in
        "
      >
        <div className="border-b border-panel-border px-5 py-4">
          <h2 id="welcome-popup-title" className="text-text-primary text-base font-semibold">
            Antes de comenzar
          </h2>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="space-y-3 text-sm leading-relaxed">
            <p className="text-text-primary">
              Para ver una señal en el osciloscopio, primero seleccione un canal y conecte su entrada.
            </p>
            <p className="text-text-muted">
              Haga clic en el conector CH1 o CH2 del instrumento para abrir la configuración del canal y activar la señal.
            </p>
            <p className="text-text-muted">
              Luego puede ajustar amplitud, frecuencia y tipo de señal desde el panel del canal.
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={hideNextTime}
              onChange={(event) => setHideNextTime(event.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            No volver a mostrar este mensaje
          </label>

          <div className="flex justify-end">
            <button
              onClick={close}
              className="
                px-4 py-2 rounded-md text-xs font-medium
                bg-accent hover:bg-accent-hover text-white
                transition-all duration-150 active:scale-95
              "
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
